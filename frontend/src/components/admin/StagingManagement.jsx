import { useState, useEffect, useCallback, useContext } from "react";
import {
  Paper, Title, Text, Group, Badge, Button, Table, TextInput, Select,
  Modal, Textarea, Loader, ActionIcon, Divider, NumberInput, Tabs,
  Switch, MultiSelect,
} from "@mantine/core";
import {
  MdRefresh, MdSearch, MdEdit, MdDelete, MdArrowBack, MdSave,
  MdVisibility, MdAdd, MdPublish, MdUnpublished, MdBuild,
  MdPhotoLibrary, MdCategory, MdCloudUpload, MdEventAvailable, MdSchedule,
} from "react-icons/md";
import { pickAndUploadImages, pickAndUploadVideos } from "../../utils/blobUpload";
import { toast } from "react-toastify";
import UserDetailContext from "../../context/UserDetailContext";
import {
  getAllStagingRequests, getStagingRequestApi, updateStagingRequestApi,
  updateStagingStatus, deleteStagingRequestApi, upsertStagingProject,
  getStagingProject, updateStagingProjectStatus,
  getAllServicePackages, createServicePackage, updateServicePackage,
  deleteServicePackage,
} from "../../utils/api";
import InspectionManagement from "./InspectionManagement";

const STATUS_COLORS = {
  new: "blue", qualified: "cyan", proposal_sent: "indigo", approved: "violet",
  planning: "grape", in_progress: "orange", content_pending: "yellow",
  completed: "teal", published: "green", closed: "gray", cancelled: "red",
};
const STATUS_LABELS = {
  new: "New", qualified: "Qualified", proposal_sent: "Proposal Sent", approved: "Approved",
  planning: "Planning", in_progress: "In Progress", content_pending: "Content Pending",
  completed: "Completed", published: "Published", closed: "Closed", cancelled: "Cancelled",
};
const NEXT_STATUSES = {
  new: ["qualified", "cancelled"],
  qualified: ["proposal_sent", "cancelled"],
  proposal_sent: ["approved", "cancelled"],
  approved: ["planning", "cancelled"],
  planning: ["in_progress", "cancelled"],
  in_progress: ["content_pending", "completed", "cancelled"],
  content_pending: ["completed", "cancelled"],
  completed: ["published", "closed"],
  published: ["closed"],
  closed: [],
  cancelled: ["new"],
};

const PROJECT_STATUS_LABELS = {
  planning: "Planning", in_progress: "In Progress", content_pending: "Content Pending",
  completed: "Completed", published: "Published",
};
const PROJECT_STATUSES = Object.keys(PROJECT_STATUS_LABELS);

const SERVICE_OPTIONS = [
  "decluttering", "deep_cleaning", "minor_repairs", "painting", "furniture_rental",
  "accessory_styling", "professional_photography", "videography", "drone_footage",
  "virtual_tour_360", "floor_plan_2d", "floor_plan_3d", "social_media_content",
  "listing_copywriting", "home_staging_full", "renovation_light", "renovation_full",
];

const PACKAGE_CATEGORIES = ["visual_refresh", "sale_ready", "premium_listing_boost", "custom"];

const mergeUniqueUrls = (...groups) =>
  Array.from(new Set(groups.flat().filter((url) => typeof url === "string" && url.trim())));

const formatDateTime = (value) => {
  const date = new Date(value || "");
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const toDateTimeLocalValue = (value) => {
  const date = new Date(value || "");
  if (Number.isNaN(date.getTime())) return "";
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
};

const StagingManagement = () => {
  const { userDetails: { token } } = useContext(UserDetailContext);
  const [view, setView] = useState("list");
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState("");

  // Project form
  const [projectForm, setProjectForm] = useState({});
  // Packages
  const [packages, setPackages] = useState([]);
  const [packagesLoading, setPackagesLoading] = useState(false);
  const [pkgForm, setPkgForm] = useState({});
  const [pkgModal, setPkgModal] = useState(false);
  const [pkgDeleteModal, setPkgDeleteModal] = useState(null);

  const fetchRequests = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (filterStatus) params.status = filterStatus;
      const res = await getAllStagingRequests(token, params);
      setRequests(res?.data || []);
    } catch { /* handled in api.js */ }
    setLoading(false);
  }, [token, search, filterStatus]);

  const fetchPackages = useCallback(async () => {
    if (!token) return;
    setPackagesLoading(true);
    try {
      const res = await getAllServicePackages(token);
      setPackages(res?.data || []);
    } catch { /* ignore */ }
    setPackagesLoading(false);
  }, [token]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const openDetail = async (id) => {
    setDetailLoading(true);
    setView("detail");
    try {
      const res = await getStagingRequestApi(id, token);
      const d = res?.data;
      setDetail(d);
      initProjectForm(d?.project);
      if (packages.length === 0) fetchPackages();
    } catch { toast.error("Failed to load details"); setView("list"); }
    setDetailLoading(false);
  };

  const initProjectForm = (p) => {
    setProjectForm({
      title: p?.title || "",
      title_en: p?.title_en || "",
      title_tr: p?.title_tr || "",
      title_ru: p?.title_ru || "",
      slug: p?.slug || "",
      city: p?.city || "",
      district: p?.district || "",
      propertyType: p?.propertyType || "",
      projectCategory: p?.projectCategory || "",
      packageId: p?.packageId || "",
      assignedPartners: Array.isArray(p?.assignedPartners) && p.assignedPartners.length > 0
        ? p.assignedPartners.map((x) => ({ name: x.name || "", role: x.role || "" }))
        : [{ name: "", role: "" }],
      budgetEstimate: p?.budgetEstimate ?? "",
      budgetCurrency: p?.budgetCurrency || "USD",
      timelineEstimate: p?.timelineEstimate || "",
      timelineEstimate_en: p?.timelineEstimate_en || "",
      timelineEstimate_tr: p?.timelineEstimate_tr || "",
      timelineEstimate_ru: p?.timelineEstimate_ru || "",
      servicesIncluded: p?.servicesIncluded || [],
      expectedValueUplift: p?.expectedValueUplift ?? "",
      expectedRentalUplift: p?.expectedRentalUplift ?? "",
      expectedSaleSpeedDays: p?.expectedSaleSpeedDays ?? "",
      notes: p?.notes || "",
      beforePhotos: p?.beforePhotos || [],
      afterPhotos: p?.afterPhotos || [],
      beforeVideos: p?.beforeVideos || [],
      afterVideos: p?.afterVideos || [],
      floorPlanUrl: p?.floorPlanUrl || "",
      virtualTourUrl: p?.virtualTourUrl || "",
      droneFootageUrl: p?.droneFootageUrl || "",
      csHeadline: p?.caseStudyContent?.headline || p?.caseStudyContent?.title || "",
      csBody: p?.caseStudyContent?.body || p?.caseStudyContent?.text || p?.caseStudyContent?.description || "",
      csTestimonial: p?.caseStudyContent?.testimonial || "",
      csHeadline_en: p?.caseStudyContent_en?.headline || p?.caseStudyContent_en?.title || "",
      csBody_en: p?.caseStudyContent_en?.body || p?.caseStudyContent_en?.text || p?.caseStudyContent_en?.description || "",
      csTestimonial_en: p?.caseStudyContent_en?.testimonial || "",
      csHeadline_tr: p?.caseStudyContent_tr?.headline || p?.caseStudyContent_tr?.title || "",
      csBody_tr: p?.caseStudyContent_tr?.body || p?.caseStudyContent_tr?.text || p?.caseStudyContent_tr?.description || "",
      csTestimonial_tr: p?.caseStudyContent_tr?.testimonial || "",
      csHeadline_ru: p?.caseStudyContent_ru?.headline || p?.caseStudyContent_ru?.title || "",
      csBody_ru: p?.caseStudyContent_ru?.body || p?.caseStudyContent_ru?.text || p?.caseStudyContent_ru?.description || "",
      csTestimonial_ru: p?.caseStudyContent_ru?.testimonial || "",
      published: p?.published || false,
      status: p?.status || "planning",
    });
  };

  const handleStatusChange = async (nextStatus) => {
    if (!detail) return;
    setSaving(true);
    try {
      await updateStagingStatus(detail.id, nextStatus, token);
      toast.success(`Status → ${STATUS_LABELS[nextStatus]}`);
      await openDetail(detail.id);
      fetchRequests();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Status update failed");
    }
    setSaving(false);
  };

  const handleSaveNotes = async () => {
    if (!detail) return;
    setSaving(true);
    try {
      await updateStagingRequestApi(detail.id, {
        internalNotes: detail.internalNotes,
        assignedConsultantId: detail.assignedConsultantId,
        visitScheduledAt: detail.visitScheduledAt
          ? new Date(detail.visitScheduledAt).toISOString()
          : null,
        visitScheduleNotes: detail.visitScheduleNotes || "",
      }, token);
      toast.success("Request details saved");
      await openDetail(detail.id);
      fetchRequests();
    } catch { toast.error("Save failed"); }
    setSaving(false);
  };

  const handleSaveProject = async () => {
    if (!detail) return;
    setSaving(true);
    try {
      const assignedPartners = Array.isArray(projectForm.assignedPartners)
        ? projectForm.assignedPartners.filter((p) => p.name.trim() || p.role.trim())
        : null;
      const buildCaseStudyContent = (headline, body, testimonial) =>
        headline || body || testimonial
          ? { headline, body, testimonial }
          : null;
      const caseStudyContent = buildCaseStudyContent(
        projectForm.csHeadline,
        projectForm.csBody,
        projectForm.csTestimonial
      );
      const caseStudyContent_en = buildCaseStudyContent(
        projectForm.csHeadline_en,
        projectForm.csBody_en,
        projectForm.csTestimonial_en
      );
      const caseStudyContent_tr = buildCaseStudyContent(
        projectForm.csHeadline_tr,
        projectForm.csBody_tr,
        projectForm.csTestimonial_tr
      );
      const caseStudyContent_ru = buildCaseStudyContent(
        projectForm.csHeadline_ru,
        projectForm.csBody_ru,
        projectForm.csTestimonial_ru
      );

      const payload = {
        title: projectForm.title,
        title_en: projectForm.title_en || undefined,
        title_tr: projectForm.title_tr || undefined,
        title_ru: projectForm.title_ru || undefined,
        slug: projectForm.slug,
        city: projectForm.city || detail.city,
        district: projectForm.district || detail.district,
        propertyType: projectForm.propertyType || detail.propertyType,
        projectCategory: projectForm.projectCategory,
        packageId: projectForm.packageId || undefined,
        assignedPartners,
        budgetEstimate: projectForm.budgetEstimate || undefined,
        budgetCurrency: projectForm.budgetCurrency,
        timelineEstimate: projectForm.timelineEstimate,
        timelineEstimate_en: projectForm.timelineEstimate_en || undefined,
        timelineEstimate_tr: projectForm.timelineEstimate_tr || undefined,
        timelineEstimate_ru: projectForm.timelineEstimate_ru || undefined,
        servicesIncluded: projectForm.servicesIncluded,
        expectedValueUplift: projectForm.expectedValueUplift || undefined,
        expectedRentalUplift: projectForm.expectedRentalUplift || undefined,
        expectedSaleSpeedDays: projectForm.expectedSaleSpeedDays || undefined,
        notes: projectForm.notes,
        beforePhotos: projectForm.beforePhotos,
        afterPhotos: projectForm.afterPhotos,
        beforeVideos: projectForm.beforeVideos,
        afterVideos: projectForm.afterVideos,
        floorPlanUrl: projectForm.floorPlanUrl,
        virtualTourUrl: projectForm.virtualTourUrl,
        droneFootageUrl: projectForm.droneFootageUrl,
        caseStudyContent,
        caseStudyContent_en,
        caseStudyContent_tr,
        caseStudyContent_ru,
        published: projectForm.published,
      };
      await upsertStagingProject(detail.id, payload, token);
      toast.success("Project saved");
      await openDetail(detail.id);
    } catch { toast.error("Project save failed"); }
    setSaving(false);
  };

  const handleProjectStatusChange = async (nextStatus) => {
    if (!detail?.project?.id) return;
    setSaving(true);
    try {
      await updateStagingProjectStatus(detail.project.id, nextStatus, token);
      toast.success(`Project → ${PROJECT_STATUS_LABELS[nextStatus]}`);
      await openDetail(detail.id);
    } catch { toast.error("Project status update failed"); }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    try {
      await deleteStagingRequestApi(deleteModal, token);
      toast.success("Request deleted");
      setDeleteModal(null);
      fetchRequests();
      if (detail?.id === deleteModal) setView("list");
    } catch { toast.error("Delete failed"); }
  };

  // ── PACKAGE CRUD ──
  const openPkgEdit = (pkg = null) => {
    setPkgForm({
      id: pkg?.id || null,
      name: pkg?.name || "",
      name_en: pkg?.name_en || "",
      name_tr: pkg?.name_tr || "",
      name_ru: pkg?.name_ru || "",
      slug: pkg?.slug || "",
      description: pkg?.description || "",
      description_en: pkg?.description_en || "",
      description_tr: pkg?.description_tr || "",
      description_ru: pkg?.description_ru || "",
      category: pkg?.category || "",
      servicesIncluded: pkg?.servicesIncluded || [],
      priceFrom: pkg?.priceFrom ?? "",
      priceTo: pkg?.priceTo ?? "",
      priceCurrency: pkg?.priceCurrency || "USD",
      estimatedDays: pkg?.estimatedDays ?? "",
      published: pkg?.published ?? true,
      order: pkg?.order ?? 0,
    });
    setPkgModal(true);
  };

  const handleSavePkg = async () => {
    setSaving(true);
    try {
      const payload = { ...pkgForm };
      delete payload.id;
      if (pkgForm.id) {
        await updateServicePackage(pkgForm.id, payload, token);
        toast.success("Package updated");
      } else {
        await createServicePackage(payload, token);
        toast.success("Package created");
      }
      setPkgModal(false);
      fetchPackages();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Package save failed");
    }
    setSaving(false);
  };

  const handleDeletePkg = async () => {
    if (!pkgDeleteModal) return;
    try {
      await deleteServicePackage(pkgDeleteModal, token);
      toast.success("Package deleted");
      setPkgDeleteModal(null);
      fetchPackages();
    } catch { toast.error("Delete failed"); }
  };

  // ── LIST VIEW ──
  if (view === "list") {
    return (
      <div>
        <div className="flexBetween mb-4">
          <div>
            <Title order={3} className="flex items-center gap-2 text-gray-800">
              <MdBuild className="text-amber-500" /> Staging & Renovation
            </Title>
            <Text size="sm" c="dimmed">Manage staging, renovation, inspection requests, projects & packages</Text>
          </div>
          <Group gap="sm">
            <Button variant="light" color="amber" leftSection={<MdRefresh size={18} />} onClick={fetchRequests} loading={loading}>
              Refresh
            </Button>
          </Group>
        </div>

        <Tabs defaultValue="requests">
          <Tabs.List>
            <Tabs.Tab value="requests">Staging Requests</Tabs.Tab>
            <Tabs.Tab value="inspections" leftSection={<MdVisibility size={16} />}>
              Inspection Requests
            </Tabs.Tab>
            <Tabs.Tab value="packages" onClick={() => { if (packages.length === 0) fetchPackages(); }}>Service Packages</Tabs.Tab>
          </Tabs.List>

          {/* ── REQUESTS TAB ── */}
          <Tabs.Panel value="requests" pt="md">
            <div className="flex gap-3 mb-4 flex-wrap">
              <TextInput placeholder="Search name, email, city..." leftSection={<MdSearch size={16} />}
                value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 min-w-[200px]" />
              <Select placeholder="All Statuses" clearable
                data={Object.entries(STATUS_LABELS).map(([v, l]) => ({ value: v, label: l }))}
                value={filterStatus} onChange={setFilterStatus} className="w-[180px]" />
            </div>

            {loading ? (
              <div className="flex justify-center py-12"><Loader /></div>
            ) : requests.length === 0 ? (
              <Text c="dimmed" ta="center" py="xl">No staging requests found</Text>
            ) : (
              <div className="overflow-x-auto">
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Name</Table.Th>
                      <Table.Th>Property</Table.Th>
                      <Table.Th>Goal</Table.Th>
                      <Table.Th>Budget</Table.Th>
                      <Table.Th>Status</Table.Th>
                      <Table.Th>Date</Table.Th>
                      <Table.Th>Actions</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {requests.map((r) => (
                      <Table.Tr key={r.id} className="cursor-pointer" onClick={() => openDetail(r.id)}>
                        <Table.Td>
                          <Text size="sm" fw={500}>{r.fullName}</Text>
                          <Text size="xs" c="dimmed">{r.email}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">{[r.city, r.district].filter(Boolean).join(", ") || "—"}</Text>
                        </Table.Td>
                        <Table.Td><Text size="sm">{r.targetGoal || "—"}</Text></Table.Td>
                        <Table.Td><Text size="sm">{r.budgetRange || "—"}</Text></Table.Td>
                        <Table.Td><Badge color={STATUS_COLORS[r.status]}>{STATUS_LABELS[r.status] || r.status}</Badge></Table.Td>
                        <Table.Td><Text size="xs" c="dimmed">{new Date(r.createdAt).toLocaleDateString()}</Text></Table.Td>
                        <Table.Td>
                          <Group gap={4}>
                            <ActionIcon variant="light" color="blue" onClick={(e) => { e.stopPropagation(); openDetail(r.id); }}><MdEdit size={16} /></ActionIcon>
                            <ActionIcon variant="light" color="red" onClick={(e) => { e.stopPropagation(); setDeleteModal(r.id); }}><MdDelete size={16} /></ActionIcon>
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </div>
            )}
          </Tabs.Panel>

          {/* ── PACKAGES TAB ── */}
          <Tabs.Panel value="inspections" pt="md">
            <InspectionManagement />
          </Tabs.Panel>

          <Tabs.Panel value="packages" pt="md">
            <div className="flexBetween mb-4">
              <Text fw={600}>Service Packages</Text>
              <Group gap="sm">
                <Button variant="light" leftSection={<MdRefresh size={16} />} onClick={fetchPackages} loading={packagesLoading} size="xs">Refresh</Button>
                <Button leftSection={<MdAdd size={16} />} onClick={() => openPkgEdit()} size="xs">New Package</Button>
              </Group>
            </div>

            {packagesLoading ? (
              <div className="flex justify-center py-8"><Loader /></div>
            ) : packages.length === 0 ? (
              <Text c="dimmed" ta="center" py="xl">No packages yet</Text>
            ) : (
              <div className="overflow-x-auto">
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Name</Table.Th>
                      <Table.Th>Category</Table.Th>
                      <Table.Th>Price</Table.Th>
                      <Table.Th>Days</Table.Th>
                      <Table.Th>Published</Table.Th>
                      <Table.Th>Order</Table.Th>
                      <Table.Th>Actions</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {packages.map((pkg) => (
                      <Table.Tr key={pkg.id}>
                        <Table.Td><Text size="sm" fw={500}>{pkg.name}</Text></Table.Td>
                        <Table.Td><Badge variant="light">{pkg.category}</Badge></Table.Td>
                        <Table.Td>
                          <Text size="sm">
                            {pkg.priceFrom != null ? `${pkg.priceCurrency} ${pkg.priceFrom}` : "—"}
                            {pkg.priceTo != null ? ` - ${pkg.priceTo}` : ""}
                          </Text>
                        </Table.Td>
                        <Table.Td><Text size="sm">{pkg.estimatedDays ?? "—"}</Text></Table.Td>
                        <Table.Td>
                          <Badge color={pkg.published ? "green" : "gray"}>{pkg.published ? "Yes" : "No"}</Badge>
                        </Table.Td>
                        <Table.Td><Text size="sm">{pkg.order}</Text></Table.Td>
                        <Table.Td>
                          <Group gap={4}>
                            <ActionIcon variant="light" color="blue" onClick={() => openPkgEdit(pkg)}><MdEdit size={16} /></ActionIcon>
                            <ActionIcon variant="light" color="red" onClick={() => setPkgDeleteModal(pkg.id)}><MdDelete size={16} /></ActionIcon>
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </div>
            )}
          </Tabs.Panel>
        </Tabs>

        {/* Delete Request Modal */}
        <Modal opened={!!deleteModal} onClose={() => setDeleteModal(null)} title="Delete Request" centered>
          <Text>Are you sure? This action cannot be undone.</Text>
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={() => setDeleteModal(null)}>Cancel</Button>
            <Button color="red" onClick={handleDelete}>Delete</Button>
          </Group>
        </Modal>

        {/* Delete Package Modal */}
        <Modal opened={!!pkgDeleteModal} onClose={() => setPkgDeleteModal(null)} title="Delete Package" centered>
          <Text>Are you sure? This action cannot be undone.</Text>
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={() => setPkgDeleteModal(null)}>Cancel</Button>
            <Button color="red" onClick={handleDeletePkg}>Delete</Button>
          </Group>
        </Modal>

        {/* Package Edit Modal */}
        <Modal opened={pkgModal} onClose={() => setPkgModal(false)} title={pkgForm.id ? "Edit Package" : "New Package"} size="lg" centered>
          <div className="space-y-3">
            <TextInput label="Name" required value={pkgForm.name || ""} onChange={(e) => setPkgForm({ ...pkgForm, name: e.target.value })} />
            <div className="grid grid-cols-3 gap-2">
              <TextInput label="Name EN" value={pkgForm.name_en || ""} onChange={(e) => setPkgForm({ ...pkgForm, name_en: e.target.value })} />
              <TextInput label="Name TR" value={pkgForm.name_tr || ""} onChange={(e) => setPkgForm({ ...pkgForm, name_tr: e.target.value })} />
              <TextInput label="Name RU" value={pkgForm.name_ru || ""} onChange={(e) => setPkgForm({ ...pkgForm, name_ru: e.target.value })} />
            </div>
            <TextInput label="Slug" required value={pkgForm.slug || ""} onChange={(e) => setPkgForm({ ...pkgForm, slug: e.target.value })} />
            <Select label="Category" data={PACKAGE_CATEGORIES.map((c) => ({ value: c, label: c.replace(/_/g, " ") }))}
              value={pkgForm.category || ""} onChange={(v) => setPkgForm({ ...pkgForm, category: v })} />
            <Textarea label="Description" rows={2} value={pkgForm.description || ""} onChange={(e) => setPkgForm({ ...pkgForm, description: e.target.value })} />
            <div className="grid grid-cols-3 gap-2">
              <Textarea label="Desc EN" rows={2} value={pkgForm.description_en || ""} onChange={(e) => setPkgForm({ ...pkgForm, description_en: e.target.value })} />
              <Textarea label="Desc TR" rows={2} value={pkgForm.description_tr || ""} onChange={(e) => setPkgForm({ ...pkgForm, description_tr: e.target.value })} />
              <Textarea label="Desc RU" rows={2} value={pkgForm.description_ru || ""} onChange={(e) => setPkgForm({ ...pkgForm, description_ru: e.target.value })} />
            </div>
            <MultiSelect label="Services Included" data={SERVICE_OPTIONS.map((s) => ({ value: s, label: s.replace(/_/g, " ") }))}
              value={pkgForm.servicesIncluded || []} onChange={(v) => setPkgForm({ ...pkgForm, servicesIncluded: v })} searchable />
            <div className="grid grid-cols-3 gap-2">
              <NumberInput label="Price From" min={0} value={pkgForm.priceFrom} onChange={(v) => setPkgForm({ ...pkgForm, priceFrom: v })} />
              <NumberInput label="Price To" min={0} value={pkgForm.priceTo} onChange={(v) => setPkgForm({ ...pkgForm, priceTo: v })} />
              <Select label="Currency" data={["USD", "EUR", "GBP", "TRY"]}
                value={pkgForm.priceCurrency || "USD"} onChange={(v) => setPkgForm({ ...pkgForm, priceCurrency: v })} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <NumberInput label="Estimated Days" min={0} value={pkgForm.estimatedDays} onChange={(v) => setPkgForm({ ...pkgForm, estimatedDays: v })} />
              <NumberInput label="Order" min={0} value={pkgForm.order} onChange={(v) => setPkgForm({ ...pkgForm, order: v })} />
              <div className="flex items-end pb-1">
                <Switch label="Published" checked={pkgForm.published || false} onChange={(e) => setPkgForm({ ...pkgForm, published: e.currentTarget.checked })} />
              </div>
            </div>
          </div>
          <Group justify="flex-end" mt="lg">
            <Button variant="default" onClick={() => setPkgModal(false)}>Cancel</Button>
            <Button onClick={handleSavePkg} loading={saving}>{pkgForm.id ? "Update" : "Create"}</Button>
          </Group>
        </Modal>
      </div>
    );
  }

  // ── DETAIL VIEW ──
  if (detailLoading) return <div className="flex justify-center py-12"><Loader /></div>;
  if (!detail) return <Text c="dimmed" ta="center" py="xl">Request not found</Text>;
  const clientUploadedImages = Array.isArray(detail.uploadedImages)
    ? detail.uploadedImages.filter(Boolean)
    : [];

  return (
    <div>
      <Button variant="subtle" leftSection={<MdArrowBack />} onClick={() => { setView("list"); setDetail(null); }} mb="md">
        Back to List
      </Button>

      <Paper shadow="xs" p="md" radius="md" mb="md">
        <div className="flexBetween flex-wrap gap-4">
          <div>
            <Title order={3}>{detail.fullName}</Title>
            <Text size="sm" c="dimmed">{detail.email} &middot; {detail.phone}</Text>
          </div>
          <Badge size="lg" color={STATUS_COLORS[detail.status]}>{STATUS_LABELS[detail.status]}</Badge>
        </div>
      </Paper>

      <Tabs defaultValue="info">
        <Tabs.List>
          <Tabs.Tab value="info">Info & Status</Tabs.Tab>
          <Tabs.Tab value="project">Project</Tabs.Tab>
          <Tabs.Tab value="media">Media</Tabs.Tab>
          <Tabs.Tab value="showcase">Showcase</Tabs.Tab>
        </Tabs.List>

        {/* ── INFO TAB ── */}
        <Tabs.Panel value="info" pt="md">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Paper shadow="xs" p="md" radius="md">
              <Text fw={600} mb="xs">Requester</Text>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <Text c="dimmed">Owner Type:</Text><Text>{detail.ownerType}</Text>
                <Text c="dimmed">WhatsApp:</Text><Text>{detail.whatsapp || "—"}</Text>
                <Text c="dimmed">Language:</Text><Text>{detail.preferredLanguage}</Text>
              </div>
            </Paper>
            <Paper shadow="xs" p="md" radius="md">
              <Text fw={600} mb="xs">Property</Text>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <Text c="dimmed">Type:</Text><Text>{detail.propertyType || "—"}</Text>
                <Text c="dimmed">City:</Text><Text>{detail.city || "—"}</Text>
                <Text c="dimmed">District:</Text><Text>{detail.district || "—"}</Text>
                <Text c="dimmed">Address:</Text><Text>{detail.address || "—"}</Text>
                <Text c="dimmed">Condition:</Text><Text>{detail.currentCondition || "—"}</Text>
                <Text c="dimmed">Furnished:</Text><Text>{detail.furnishedState || "—"}</Text>
                <Text c="dimmed">Size:</Text><Text>{detail.propertySize ? `${detail.propertySize} m²` : "—"}</Text>
                <Text c="dimmed">Rooms:</Text><Text>{detail.roomCount || "—"}</Text>
              </div>
            </Paper>
            <Paper shadow="xs" p="md" radius="md">
              <Text fw={600} mb="xs">Request Details</Text>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <Text c="dimmed">Goal:</Text><Text>{detail.targetGoal || "—"}</Text>
                <Text c="dimmed">Budget:</Text><Text>{detail.budgetRange || "—"} {detail.budgetCurrency}</Text>
                <Text c="dimmed">Timeline:</Text><Text>{detail.desiredTimeline || "—"}</Text>
              </div>
              {detail.requestedServices?.length > 0 && (
                <div className="mt-2">
                  <Text size="xs" c="dimmed" mb={4}>Requested Services:</Text>
                  <Group gap={4}>{detail.requestedServices.map((s) => <Badge key={s} size="xs" variant="light">{s.replace(/_/g, " ")}</Badge>)}</Group>
                </div>
              )}
              {detail.notes && <><Divider my="xs" /><Text size="sm">{detail.notes}</Text></>}
            </Paper>
            <Paper
              shadow="xs"
              p="md"
              radius="xl"
              className="overflow-hidden border border-sky-100 bg-[radial-gradient(circle_at_top_left,_rgba(186,230,253,0.45),_rgba(255,255,255,0.98)_48%,_rgba(220,252,231,0.92)_100%)] lg:col-span-2"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl bg-sky-500 p-3 text-white shadow-lg shadow-sky-200">
                    <MdEventAvailable size={24} />
                  </div>
                  <div>
                    <Text fw={700} size="lg">Visit Checklist</Text>
                    <Text size="sm" c="dimmed">
                      Set the property visit time and a short note that becomes visible in the customer panel.
                    </Text>
                  </div>
                </div>
                <Badge
                  size="lg"
                  color={detail.visitScheduledAt ? "teal" : "gray"}
                  variant={detail.visitScheduledAt ? "light" : "outline"}
                >
                  {detail.visitScheduledAt ? "Customer Visible" : "Not Scheduled"}
                </Badge>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
                <div className="space-y-3">
                  <TextInput
                    label="Visit Date & Time"
                    type="datetime-local"
                    value={toDateTimeLocalValue(detail.visitScheduledAt)}
                    onChange={(e) => setDetail({ ...detail, visitScheduledAt: e.target.value || null })}
                  />
                  <Textarea
                    label="Customer Checklist Note"
                    description="Optional note shown in the customer panel."
                    rows={3}
                    value={detail.visitScheduleNotes || ""}
                    onChange={(e) => setDetail({ ...detail, visitScheduleNotes: e.target.value })}
                  />
                  <Group gap="sm">
                    <Button size="sm" leftSection={<MdSave size={14} />} onClick={handleSaveNotes} loading={saving}>
                      Save Visit Schedule
                    </Button>
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() =>
                        setDetail({
                          ...detail,
                          visitScheduledAt: null,
                          visitScheduleNotes: "",
                        })
                      }
                    >
                      Clear Form
                    </Button>
                  </Group>
                </div>

                <div className="rounded-[1.35rem] border border-white/80 bg-white/85 p-4 shadow-[0_18px_35px_rgba(14,116,144,0.08)] backdrop-blur">
                  <Group gap={8} mb="xs">
                    <MdSchedule className="text-sky-600" size={18} />
                    <Text fw={600}>Customer Preview</Text>
                  </Group>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    Visit Time
                  </Text>
                  <Text fw={700} size="lg" mt={4}>
                    {detail.visitScheduledAt ? formatDateTime(detail.visitScheduledAt) : "No property visit scheduled yet"}
                  </Text>
                  <Text size="sm" c="dimmed" mt="sm">
                    {detail.visitScheduleNotes ||
                      "Add access instructions, meeting point, or a short checklist note for the client."}
                  </Text>
                  <Divider my="sm" />
                  <Group gap={8}>
                    {detail.city ? <Badge variant="light" color="indigo">{detail.city}</Badge> : null}
                    {detail.district ? <Badge variant="light" color="cyan">{detail.district}</Badge> : null}
                    {detail.propertyType ? <Badge variant="light" color="gray">{detail.propertyType}</Badge> : null}
                  </Group>
                </div>
              </div>
            </Paper>
            <Paper shadow="xs" p="md" radius="md">
              <Text fw={600} mb="xs">Internal</Text>
              <TextInput label="Assigned Consultant ID" value={detail.assignedConsultantId || ""}
                onChange={(e) => setDetail({ ...detail, assignedConsultantId: e.target.value })} mb="xs" />
              <Textarea label="Internal Notes" rows={3} value={detail.internalNotes || ""}
                onChange={(e) => setDetail({ ...detail, internalNotes: e.target.value })} mb="xs" />
              <Button size="xs" leftSection={<MdSave size={14} />} onClick={handleSaveNotes} loading={saving}>Save</Button>
            </Paper>
          </div>

          {detail.uploadedImages?.length > 0 && (
            <Paper shadow="xs" p="md" radius="md" mt="md">
              <Text fw={600} mb="xs">Uploaded Images</Text>
              <div className="flex gap-2 flex-wrap">
                {detail.uploadedImages.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                    <img src={url} alt={`upload-${i}`} className="w-24 h-24 object-cover rounded border" />
                  </a>
                ))}
              </div>
            </Paper>
          )}

          <Paper shadow="xs" p="md" radius="md" mt="md">
            <Text fw={600} mb="xs">Status Actions</Text>
            <Group gap="sm">
              {(NEXT_STATUSES[detail.status] || []).map((ns) => (
                <Button key={ns} size="sm" variant="light" color={STATUS_COLORS[ns]}
                  onClick={() => handleStatusChange(ns)} loading={saving}>
                  → {STATUS_LABELS[ns]}
                </Button>
              ))}
              {(NEXT_STATUSES[detail.status] || []).length === 0 && (
                <Text size="sm" c="dimmed">No further transitions available</Text>
              )}
            </Group>
          </Paper>
        </Tabs.Panel>

        {/* ── PROJECT TAB ── */}
        <Tabs.Panel value="project" pt="md">
          <Paper shadow="xs" p="md" radius="md">
            <div className="flexBetween mb-4">
              <Text fw={600} className="flex items-center gap-2">
                <MdBuild className="text-amber-500" />
                {detail.project ? "Edit Project" : "Create Project"}
              </Text>
              {detail.project && (
                <Badge color={STATUS_COLORS[detail.project.status]}>{PROJECT_STATUS_LABELS[detail.project.status] || detail.project.status}</Badge>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <TextInput label="Title" value={projectForm.title || ""}
                onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })} />
              <TextInput label="Title EN" value={projectForm.title_en || ""}
                onChange={(e) => setProjectForm({ ...projectForm, title_en: e.target.value })} />
              <TextInput label="Title TR" value={projectForm.title_tr || ""}
                onChange={(e) => setProjectForm({ ...projectForm, title_tr: e.target.value })} />
              <TextInput label="Title RU" value={projectForm.title_ru || ""}
                onChange={(e) => setProjectForm({ ...projectForm, title_ru: e.target.value })} />
              <TextInput label="Slug" value={projectForm.slug || ""}
                onChange={(e) => setProjectForm({ ...projectForm, slug: e.target.value })} />
              <TextInput label="City" value={projectForm.city || ""}
                onChange={(e) => setProjectForm({ ...projectForm, city: e.target.value })} />
              <TextInput label="District" value={projectForm.district || ""}
                onChange={(e) => setProjectForm({ ...projectForm, district: e.target.value })} />
              <TextInput label="Property Type" value={projectForm.propertyType || ""}
                onChange={(e) => setProjectForm({ ...projectForm, propertyType: e.target.value })} />
              <Select label="Category" data={PACKAGE_CATEGORIES.map((c) => ({ value: c, label: c.replace(/_/g, " ") }))}
                value={projectForm.projectCategory || ""} onChange={(v) => setProjectForm({ ...projectForm, projectCategory: v })} clearable />
              <Select label="Package" data={packages.map((p) => ({ value: p.id, label: p.name }))}
                value={projectForm.packageId || ""} onChange={(v) => setProjectForm({ ...projectForm, packageId: v })} clearable />
              <Select label="Currency" data={["USD", "EUR", "GBP", "TRY"]}
                value={projectForm.budgetCurrency || "USD"} onChange={(v) => setProjectForm({ ...projectForm, budgetCurrency: v })} />
              <NumberInput label="Budget Estimate" min={0} value={projectForm.budgetEstimate}
                onChange={(v) => setProjectForm({ ...projectForm, budgetEstimate: v })} />
              <TextInput label="Timeline Estimate" value={projectForm.timelineEstimate || ""}
                onChange={(e) => setProjectForm({ ...projectForm, timelineEstimate: e.target.value })} />
              <TextInput label="Timeline EN" value={projectForm.timelineEstimate_en || ""}
                onChange={(e) => setProjectForm({ ...projectForm, timelineEstimate_en: e.target.value })} />
              <TextInput label="Timeline TR" value={projectForm.timelineEstimate_tr || ""}
                onChange={(e) => setProjectForm({ ...projectForm, timelineEstimate_tr: e.target.value })} />
              <TextInput label="Timeline RU" value={projectForm.timelineEstimate_ru || ""}
                onChange={(e) => setProjectForm({ ...projectForm, timelineEstimate_ru: e.target.value })} />
            </div>

            <MultiSelect label="Services Included" mt="sm"
              data={SERVICE_OPTIONS.map((s) => ({ value: s, label: s.replace(/_/g, " ") }))}
              value={projectForm.servicesIncluded || []} onChange={(v) => setProjectForm({ ...projectForm, servicesIncluded: v })} searchable />

            <Divider my="md" label="Value Uplift Expectations" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <NumberInput label="Value Uplift %" min={0} value={projectForm.expectedValueUplift}
                onChange={(v) => setProjectForm({ ...projectForm, expectedValueUplift: v })} />
              <NumberInput label="Rental Uplift %" min={0} value={projectForm.expectedRentalUplift}
                onChange={(v) => setProjectForm({ ...projectForm, expectedRentalUplift: v })} />
              <NumberInput label="Sale Speed (days)" min={0} value={projectForm.expectedSaleSpeedDays}
                onChange={(v) => setProjectForm({ ...projectForm, expectedSaleSpeedDays: v })} />
            </div>

            <Text fw={600} mt="md" mb="xs">Assigned Partners</Text>
            {(projectForm.assignedPartners || []).map((partner, idx) => (
              <Group key={idx} gap="xs" mb="xs" align="flex-end">
                <TextInput placeholder="Name" size="xs" className="flex-1"
                  value={partner.name}
                  onChange={(e) => {
                    const updated = [...projectForm.assignedPartners];
                    updated[idx] = { ...updated[idx], name: e.target.value };
                    setProjectForm({ ...projectForm, assignedPartners: updated });
                  }} />
                <TextInput placeholder="Role (e.g. Photographer, Contractor)" size="xs" className="flex-1"
                  value={partner.role}
                  onChange={(e) => {
                    const updated = [...projectForm.assignedPartners];
                    updated[idx] = { ...updated[idx], role: e.target.value };
                    setProjectForm({ ...projectForm, assignedPartners: updated });
                  }} />
                <ActionIcon size="sm" color="red" variant="light"
                  onClick={() => {
                    const updated = projectForm.assignedPartners.filter((_, i) => i !== idx);
                    setProjectForm({ ...projectForm, assignedPartners: updated.length ? updated : [{ name: "", role: "" }] });
                  }}>
                  <MdDelete size={14} />
                </ActionIcon>
              </Group>
            ))}
            <Button size="xs" variant="subtle" leftSection={<MdAdd size={14} />}
              onClick={() => setProjectForm({ ...projectForm, assignedPartners: [...(projectForm.assignedPartners || []), { name: "", role: "" }] })}>
              Add Partner
            </Button>

            <Textarea label="Notes" rows={2} mt="sm" value={projectForm.notes || ""}
              onChange={(e) => setProjectForm({ ...projectForm, notes: e.target.value })} />

            <Group mt="md" gap="sm">
              <Button leftSection={<MdSave size={16} />} onClick={handleSaveProject} loading={saving}>
                {detail.project ? "Update Project" : "Create Project"}
              </Button>
              {detail.project && PROJECT_STATUSES.filter((s) => s !== detail.project.status).map((ns) => (
                <Button key={ns} size="sm" variant="light" color={STATUS_COLORS[ns] || "gray"}
                  onClick={() => handleProjectStatusChange(ns)} loading={saving}>
                  → {PROJECT_STATUS_LABELS[ns]}
                </Button>
              ))}
            </Group>
          </Paper>
        </Tabs.Panel>

        {/* ── MEDIA TAB ── */}
        <Tabs.Panel value="media" pt="md">
          <div className="space-y-4">
            <Paper shadow="xs" p="md" radius="md">
              <div className="flexBetween mb-3 gap-3 flex-wrap">
                <div>
                  <Text fw={600} className="flex items-center gap-2">
                    <MdPhotoLibrary className="text-indigo-500" /> Client Uploaded Photos
                  </Text>
                  <Text size="sm" c="dimmed">
                    These are the photos the user submitted with the request. You can reuse them in the before gallery.
                  </Text>
                </div>
                <Button
                  size="xs"
                  variant="light"
                  color="indigo"
                  leftSection={<MdAdd size={14} />}
                  disabled={clientUploadedImages.length === 0}
                  onClick={() =>
                    setProjectForm((prev) => ({
                      ...prev,
                      beforePhotos: mergeUniqueUrls(prev.beforePhotos || [], clientUploadedImages),
                    }))
                  }
                >
                  Add All To Before Photos
                </Button>
              </div>

              {clientUploadedImages.length > 0 ? (
                <div className="flex gap-3 flex-wrap">
                  {clientUploadedImages.map((url, i) => {
                    const alreadyAdded = (projectForm.beforePhotos || []).includes(url);

                    return (
                      <div key={`client-upload-${i}`} className="relative">
                        <a href={url} target="_blank" rel="noopener noreferrer">
                          <img src={url} alt={`client-upload-${i}`} className="w-28 h-28 object-cover rounded border" />
                        </a>
                        <Button
                          size="compact-xs"
                          variant={alreadyAdded ? "default" : "filled"}
                          color={alreadyAdded ? "gray" : "indigo"}
                          className="absolute bottom-2 left-2"
                          disabled={alreadyAdded}
                          onClick={() =>
                            setProjectForm((prev) => ({
                              ...prev,
                              beforePhotos: mergeUniqueUrls(prev.beforePhotos || [], [url]),
                            }))
                          }
                        >
                          {alreadyAdded ? "Added" : "Use as Before"}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ) : <Text size="sm" c="dimmed">No user-uploaded photos on this request</Text>}
            </Paper>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Paper shadow="xs" p="md" radius="md">
              <Text fw={600} mb="xs" className="flex items-center gap-2"><MdPhotoLibrary className="text-blue-500" /> Before Photos</Text>
              {(projectForm.beforePhotos || []).length > 0 ? (
                <div className="flex gap-2 flex-wrap mb-3">
                  {projectForm.beforePhotos.map((url, i) => (
                    <div key={i} className="relative">
                      <a href={url} target="_blank" rel="noopener noreferrer">
                        <img src={url} alt={`before-${i}`} className="w-24 h-24 object-cover rounded border" />
                      </a>
                      <ActionIcon size="xs" color="red" variant="filled"
                        className="absolute -top-1 -right-1"
                        onClick={() => setProjectForm({ ...projectForm, beforePhotos: projectForm.beforePhotos.filter((_, j) => j !== i) })}>
                        <MdDelete size={10} />
                      </ActionIcon>
                    </div>
                  ))}
                </div>
              ) : <Text size="sm" c="dimmed" mb="sm">No before photos</Text>}
              <Button size="xs" variant="light" leftSection={<MdCloudUpload size={16} />}
                loading={uploading === "beforePhotos"}
                onClick={async () => {
                  setUploading("beforePhotos");
                  try {
                    const urls = await pickAndUploadImages({ multiple: true });
                    if (urls.length) setProjectForm((prev) => ({ ...prev, beforePhotos: [...(prev.beforePhotos || []), ...urls] }));
                  } catch { toast.error("Upload failed"); }
                  setUploading("");
                }}>
                Upload Photos
              </Button>
            </Paper>

            <Paper shadow="xs" p="md" radius="md">
              <Text fw={600} mb="xs" className="flex items-center gap-2"><MdPhotoLibrary className="text-green-500" /> After Photos</Text>
              {(projectForm.afterPhotos || []).length > 0 ? (
                <div className="flex gap-2 flex-wrap mb-3">
                  {projectForm.afterPhotos.map((url, i) => (
                    <div key={i} className="relative">
                      <a href={url} target="_blank" rel="noopener noreferrer">
                        <img src={url} alt={`after-${i}`} className="w-24 h-24 object-cover rounded border" />
                      </a>
                      <ActionIcon size="xs" color="red" variant="filled"
                        className="absolute -top-1 -right-1"
                        onClick={() => setProjectForm({ ...projectForm, afterPhotos: projectForm.afterPhotos.filter((_, j) => j !== i) })}>
                        <MdDelete size={10} />
                      </ActionIcon>
                    </div>
                  ))}
                </div>
              ) : <Text size="sm" c="dimmed" mb="sm">No after photos</Text>}
              <Button size="xs" variant="light" leftSection={<MdCloudUpload size={16} />}
                loading={uploading === "afterPhotos"}
                onClick={async () => {
                  setUploading("afterPhotos");
                  try {
                    const urls = await pickAndUploadImages({ multiple: true });
                    if (urls.length) setProjectForm((prev) => ({ ...prev, afterPhotos: [...(prev.afterPhotos || []), ...urls] }));
                  } catch { toast.error("Upload failed"); }
                  setUploading("");
                }}>
                Upload Photos
              </Button>
            </Paper>

            <Paper shadow="xs" p="md" radius="md">
              <Text fw={600} mb="xs">Before Videos</Text>
              {(projectForm.beforeVideos || []).length > 0 ? (
                <div className="space-y-1 mb-3">
                  {projectForm.beforeVideos.map((url, i) => (
                    <Group key={i} gap={4}>
                      <Text size="xs" className="truncate flex-1">{url}</Text>
                      <ActionIcon size="xs" color="red" variant="light"
                        onClick={() => setProjectForm({ ...projectForm, beforeVideos: projectForm.beforeVideos.filter((_, j) => j !== i) })}>
                        <MdDelete size={12} />
                      </ActionIcon>
                    </Group>
                  ))}
                </div>
              ) : <Text size="sm" c="dimmed" mb="sm">No before videos</Text>}
              <Button size="xs" variant="light" leftSection={<MdCloudUpload size={16} />}
                loading={uploading === "beforeVideos"}
                onClick={async () => {
                  setUploading("beforeVideos");
                  try {
                    const urls = await pickAndUploadVideos({ multiple: true });
                    if (urls.length) setProjectForm((prev) => ({ ...prev, beforeVideos: [...(prev.beforeVideos || []), ...urls] }));
                  } catch { toast.error("Upload failed"); }
                  setUploading("");
                }}>
                Upload Videos
              </Button>
            </Paper>

            <Paper shadow="xs" p="md" radius="md">
              <Text fw={600} mb="xs">After Videos</Text>
              {(projectForm.afterVideos || []).length > 0 ? (
                <div className="space-y-1 mb-3">
                  {projectForm.afterVideos.map((url, i) => (
                    <Group key={i} gap={4}>
                      <Text size="xs" className="truncate flex-1">{url}</Text>
                      <ActionIcon size="xs" color="red" variant="light"
                        onClick={() => setProjectForm({ ...projectForm, afterVideos: projectForm.afterVideos.filter((_, j) => j !== i) })}>
                        <MdDelete size={12} />
                      </ActionIcon>
                    </Group>
                  ))}
                </div>
              ) : <Text size="sm" c="dimmed" mb="sm">No after videos</Text>}
              <Button size="xs" variant="light" leftSection={<MdCloudUpload size={16} />}
                loading={uploading === "afterVideos"}
                onClick={async () => {
                  setUploading("afterVideos");
                  try {
                    const urls = await pickAndUploadVideos({ multiple: true });
                    if (urls.length) setProjectForm((prev) => ({ ...prev, afterVideos: [...(prev.afterVideos || []), ...urls] }));
                  } catch { toast.error("Upload failed"); }
                  setUploading("");
                }}>
                Upload Videos
              </Button>
            </Paper>
            </div>

          <Paper shadow="xs" p="md" radius="md" mt="md">
            <Text fw={600} mb="xs">Additional Links</Text>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <TextInput label="Floor Plan URL" value={projectForm.floorPlanUrl || ""}
                onChange={(e) => setProjectForm({ ...projectForm, floorPlanUrl: e.target.value })} />
              <TextInput label="Virtual Tour URL" value={projectForm.virtualTourUrl || ""}
                onChange={(e) => setProjectForm({ ...projectForm, virtualTourUrl: e.target.value })} />
              <TextInput label="Drone Footage URL" value={projectForm.droneFootageUrl || ""}
                onChange={(e) => setProjectForm({ ...projectForm, droneFootageUrl: e.target.value })} />
            </div>
          </Paper>

          <Group mt="md">
            <Button leftSection={<MdSave size={16} />} onClick={handleSaveProject} loading={saving}>Save Media Changes</Button>
          </Group>
          </div>
        </Tabs.Panel>

        {/* ── SHOWCASE TAB ── */}
        <Tabs.Panel value="showcase" pt="md">
          <Paper shadow="xs" p="md" radius="md">
            <Text fw={600} mb="md" className="flex items-center gap-2">
              <MdCategory className="text-purple-500" /> Showcase & Publishing
            </Text>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Select label="Project Category" data={PACKAGE_CATEGORIES.map((c) => ({ value: c, label: c.replace(/_/g, " ") }))}
                  value={projectForm.projectCategory || ""} onChange={(v) => setProjectForm({ ...projectForm, projectCategory: v })} clearable />
                <TextInput label="City" mt="sm" value={projectForm.city || ""}
                  onChange={(e) => setProjectForm({ ...projectForm, city: e.target.value })} />
                <TextInput label="District" mt="sm" value={projectForm.district || ""}
                  onChange={(e) => setProjectForm({ ...projectForm, district: e.target.value })} />
                <TextInput label="Budget Label" mt="sm" value={projectForm.budgetEstimate?.toString() || ""}
                  onChange={(e) => setProjectForm({ ...projectForm, budgetEstimate: parseFloat(e.target.value) || 0 })} />
                <TextInput label="Timeline Label" mt="sm" value={projectForm.timelineEstimate || ""}
                  onChange={(e) => setProjectForm({ ...projectForm, timelineEstimate: e.target.value })} />
              </div>
              <div>
                <Switch label="Published" size="md" checked={projectForm.published || false}
                  onChange={(e) => setProjectForm({ ...projectForm, published: e.currentTarget.checked })} mb="md" />
                <TextInput label="Headline" placeholder="e.g. Stunning transformation in Beylikdüzü"
                  value={projectForm.csHeadline || ""}
                  onChange={(e) => setProjectForm({ ...projectForm, csHeadline: e.target.value })} mb="sm" />
                <Textarea label="Story / Description" rows={5} placeholder="Describe what was done and the results achieved..."
                  value={projectForm.csBody || ""}
                  onChange={(e) => setProjectForm({ ...projectForm, csBody: e.target.value })} mb="sm" />
                <Textarea label="Client Testimonial" rows={3} placeholder="What did the client say about the project?"
                  value={projectForm.csTestimonial || ""}
                  onChange={(e) => setProjectForm({ ...projectForm, csTestimonial: e.target.value })} />
              </div>
            </div>

            <Divider my="md" label="Localized Case Study" />
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              <div>
                <TextInput label="Headline EN" value={projectForm.csHeadline_en || ""}
                  onChange={(e) => setProjectForm({ ...projectForm, csHeadline_en: e.target.value })} mb="sm" />
                <Textarea label="Story EN" rows={4} value={projectForm.csBody_en || ""}
                  onChange={(e) => setProjectForm({ ...projectForm, csBody_en: e.target.value })} mb="sm" />
                <Textarea label="Testimonial EN" rows={3} value={projectForm.csTestimonial_en || ""}
                  onChange={(e) => setProjectForm({ ...projectForm, csTestimonial_en: e.target.value })} />
              </div>
              <div>
                <TextInput label="Headline TR" value={projectForm.csHeadline_tr || ""}
                  onChange={(e) => setProjectForm({ ...projectForm, csHeadline_tr: e.target.value })} mb="sm" />
                <Textarea label="Story TR" rows={4} value={projectForm.csBody_tr || ""}
                  onChange={(e) => setProjectForm({ ...projectForm, csBody_tr: e.target.value })} mb="sm" />
                <Textarea label="Testimonial TR" rows={3} value={projectForm.csTestimonial_tr || ""}
                  onChange={(e) => setProjectForm({ ...projectForm, csTestimonial_tr: e.target.value })} />
              </div>
              <div>
                <TextInput label="Headline RU" value={projectForm.csHeadline_ru || ""}
                  onChange={(e) => setProjectForm({ ...projectForm, csHeadline_ru: e.target.value })} mb="sm" />
                <Textarea label="Story RU" rows={4} value={projectForm.csBody_ru || ""}
                  onChange={(e) => setProjectForm({ ...projectForm, csBody_ru: e.target.value })} mb="sm" />
                <Textarea label="Testimonial RU" rows={3} value={projectForm.csTestimonial_ru || ""}
                  onChange={(e) => setProjectForm({ ...projectForm, csTestimonial_ru: e.target.value })} />
              </div>
            </div>

            <Group mt="md">
              <Button leftSection={<MdSave size={16} />} onClick={handleSaveProject} loading={saving}>Save Showcase</Button>
              {detail.project && (
                <Button variant="light" color={projectForm.published ? "red" : "green"}
                  leftSection={projectForm.published ? <MdUnpublished size={16} /> : <MdPublish size={16} />}
                  onClick={() => {
                    setProjectForm({ ...projectForm, published: !projectForm.published });
                  }}>
                  {projectForm.published ? "Unpublish" : "Publish"}
                </Button>
              )}
            </Group>
          </Paper>
        </Tabs.Panel>
      </Tabs>
    </div>
  );
};

export default StagingManagement;
