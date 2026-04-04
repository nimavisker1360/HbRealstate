import { useState, useEffect, useCallback, useContext } from "react";
import {
  Accordion, ActionIcon, Badge, Button, Group, Loader, Modal, NumberInput,
  Paper, Progress, Select, Table, Tabs, Text, TextInput, Textarea, Title,
} from "@mantine/core";
import {
  MdAdd, MdArrowBack, MdCheckCircle, MdDelete, MdEdit, MdRefresh,
  MdCloudUpload, MdPhotoLibrary, MdSave, MdSearch, MdVisibility,
} from "react-icons/md";
import { pickAndUploadImages } from "../../utils/blobUpload";
import { toast } from "react-toastify";
import UserDetailContext from "../../context/UserDetailContext";
import {
  deleteInspectionRequestApi,
  getAllInspectionRequests,
  getInspectionRequest,
  saveInspectionChecklist,
  saveInspectionReport,
  updateInspectionRequest,
  updateInspectionStatus,
} from "../../utils/api";

const STATUS_COLORS = {
  new: "blue", contacted: "cyan", scheduled: "indigo", in_review: "violet",
  inspection_completed: "grape", report_drafting: "orange", report_ready: "teal",
  delivered: "green", closed: "gray", cancelled: "red",
};

const STATUS_LABELS = {
  new: "New", contacted: "Contacted", scheduled: "Scheduled", in_review: "In Review",
  inspection_completed: "Completed", report_drafting: "Drafting", report_ready: "Report Ready",
  delivered: "Delivered", closed: "Closed", cancelled: "Cancelled",
};

const NEXT_STATUSES = {
  new: ["contacted", "scheduled", "cancelled"],
  contacted: ["scheduled", "cancelled"],
  scheduled: ["in_review", "cancelled"],
  in_review: ["inspection_completed", "cancelled"],
  inspection_completed: ["report_drafting"],
  report_drafting: ["report_ready"],
  report_ready: ["delivered"],
  delivered: ["closed"],
  closed: [],
  cancelled: ["new"],
};

const CHECKLIST_STATUSES = ["good", "acceptable", "risky", "critical", "not_checked"];
const CHECKLIST_STATUS_META = {
  good: { label: "Good", color: "green", surface: "border-green-200 bg-green-50/70" },
  acceptable: { label: "Acceptable", color: "teal", surface: "border-teal-200 bg-teal-50/70" },
  risky: { label: "Risky", color: "orange", surface: "border-orange-200 bg-orange-50/70" },
  critical: { label: "Critical", color: "red", surface: "border-red-200 bg-red-50/70" },
  not_checked: { label: "Not Checked", color: "gray", surface: "border-slate-200 bg-slate-50" },
};

const SEVERITY_META = {
  none: { label: "None", color: "gray" },
  low: { label: "Low", color: "green" },
  medium: { label: "Medium", color: "yellow" },
  high: { label: "High", color: "orange" },
  critical: { label: "Critical", color: "red" },
};

const REPORT_STATUS_COLORS = {
  draft: "gray", review: "yellow", final: "teal", delivered: "green",
};

const REPORT_STATUS_LABELS = {
  draft: "Draft", review: "In Review", final: "Final", delivered: "Delivered",
};
const REPORT_PHOTO_PREFIXES = {
  before: "before::",
  after: "after::",
};

const SECTION_DEFS = [
  {
    key: "structuralSafety",
    label: "Structural Safety",
    weight: 35,
    defaultItems: [
      { key: "foundation", label: "Foundation & Base" },
      { key: "walls", label: "Walls & Load-Bearing" },
      { key: "roof", label: "Roof Structure" },
      { key: "cracks", label: "Cracks & Settlement" },
      { key: "moisture", label: "Moisture / Damp" },
      { key: "seismic", label: "Seismic Readiness" },
    ],
  },
  {
    key: "legalCompliance",
    label: "Legal / Compliance",
    weight: 10,
    defaultItems: [
      { key: "titleDeed", label: "Title Deed (TAPU)" },
      { key: "zoning", label: "Zoning Compliance" },
      { key: "permits", label: "Building Permits" },
      { key: "occupancy", label: "Occupancy Certificate" },
    ],
  },
  {
    key: "utilitiesPlumbing",
    label: "Utilities / Plumbing / Heating",
    weight: 25,
    defaultItems: [
      { key: "waterSupply", label: "Water Supply" },
      { key: "drainage", label: "Drainage & Sewage" },
      { key: "heating", label: "Heating System" },
      { key: "hotWater", label: "Hot Water" },
      { key: "gasLines", label: "Gas Lines" },
    ],
  },
  {
    key: "electricalSafety",
    label: "Electrical Safety",
    weight: 15,
    defaultItems: [
      { key: "wiring", label: "Wiring & Cables" },
      { key: "panel", label: "Electrical Panel" },
      { key: "grounding", label: "Grounding" },
      { key: "outlets", label: "Outlets & Switches" },
    ],
  },
  {
    key: "comfortInsulation",
    label: "Comfort / Insulation",
    weight: 15,
    defaultItems: [
      { key: "thermalInsulation", label: "Thermal Insulation" },
      { key: "soundInsulation", label: "Sound Insulation" },
      { key: "windows", label: "Windows & Glazing" },
      { key: "ventilation", label: "Ventilation" },
    ],
  },
];

const RISK_COLORS = { strong: "green", good: "teal", needs_attention: "orange", high_risk: "red" };
const RISK_LABELS = { strong: "Strong", good: "Good", needs_attention: "Needs Attention", high_risk: "High Risk" };

const formatLabel = (value) => {
  if (!value) return "";
  return String(value)
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString();
};

const getNumericValue = (value) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const formatAmount = (value) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(getNumericValue(value));

const uniqueUrls = (items = []) =>
  Array.from(new Set((Array.isArray(items) ? items : []).filter((item) => typeof item === "string" && item.trim())));

const parseReportPhotoGroups = (photos = []) =>
  (Array.isArray(photos) ? photos : []).reduce(
    (groups, entry) => {
      const value = typeof entry === "string" ? entry.trim() : "";
      if (!value) return groups;

      if (value.startsWith(REPORT_PHOTO_PREFIXES.before)) {
        groups.beforePhotos.push(value.slice(REPORT_PHOTO_PREFIXES.before.length));
        return groups;
      }

      if (value.startsWith(REPORT_PHOTO_PREFIXES.after)) {
        groups.afterPhotos.push(value.slice(REPORT_PHOTO_PREFIXES.after.length));
        return groups;
      }

      groups.afterPhotos.push(value);
      return groups;
    },
    { beforePhotos: [], afterPhotos: [] },
  );

const buildReportPhotoPayload = (beforePhotos = [], afterPhotos = []) => [
  ...uniqueUrls(beforePhotos).map((url) => `${REPORT_PHOTO_PREFIXES.before}${url}`),
  ...uniqueUrls(afterPhotos).map((url) => `${REPORT_PHOTO_PREFIXES.after}${url}`),
];

const formatCurrencyAmount = (currency, value) => {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(getNumericValue(value));
  } catch {
    return `${currency} ${formatAmount(value)}`;
  }
};

const getSectionItems = (source, sectionKey) =>
  Array.isArray(source?.[sectionKey]) ? source[sectionKey] : [];

const getSectionMetrics = (items = []) => {
  const total = items.length;
  const checked = items.filter((item) => item?.status && item.status !== "not_checked").length;
  const critical = items.filter(
    (item) => item?.status === "critical" || item?.severity === "critical",
  ).length;
  const attention = items.filter((item) => {
    const status = item?.status;
    const severity = item?.severity;
    return status === "risky" || status === "critical" || severity === "high" || severity === "critical";
  }).length;
  const repairItems = items.filter((item) => getNumericValue(item?.repairCostEstimate) > 0);
  const repairTotal = repairItems.reduce(
    (sum, item) => sum + getNumericValue(item?.repairCostEstimate),
    0,
  );

  return {
    total,
    checked,
    pending: Math.max(total - checked, 0),
    completion: total > 0 ? Math.round((checked / total) * 100) : 0,
    critical,
    attention,
    repairItems: repairItems.length,
    repairTotal,
  };
};

const getChecklistMetrics = (checklistData = {}) => {
  const totals = SECTION_DEFS.reduce(
    (summary, section) => {
      const metrics = getSectionMetrics(getSectionItems(checklistData, section.key));
      return {
        total: summary.total + metrics.total,
        checked: summary.checked + metrics.checked,
        pending: summary.pending + metrics.pending,
        critical: summary.critical + metrics.critical,
        attention: summary.attention + metrics.attention,
        repairItems: summary.repairItems + metrics.repairItems,
        repairTotal: summary.repairTotal + metrics.repairTotal,
      };
    },
    { total: 0, checked: 0, pending: 0, critical: 0, attention: 0, repairItems: 0, repairTotal: 0 },
  );

  return {
    ...totals,
    completion: totals.total > 0 ? Math.round((totals.checked / totals.total) * 100) : 0,
  };
};

const getDefaultOpenSections = (checklistData = {}) => {
  const prioritized = SECTION_DEFS.filter((section) => {
    const metrics = getSectionMetrics(getSectionItems(checklistData, section.key));
    return metrics.critical > 0 || metrics.attention > 0 || metrics.checked === 0;
  }).map((section) => section.key);

  return prioritized.length > 0 ? prioritized : SECTION_DEFS.slice(0, 2).map((section) => section.key);
};

const getFindingEntries = (findings = []) =>
  Array.isArray(findings)
    ? findings.filter((finding) => finding?.section?.trim() || finding?.finding?.trim())
    : [];

const getRepairEstimateSummary = (repairEstimates = [], checklistData = {}) => {
  const validReportEstimates = Array.isArray(repairEstimates)
    ? repairEstimates.filter(
        (estimate) => estimate?.item?.trim() && getNumericValue(estimate?.estimatedCost) > 0,
      )
    : [];

  if (validReportEstimates.length > 0) {
    return {
      source: "report",
      itemCount: validReportEstimates.length,
      currencyTotals: validReportEstimates.reduce((totals, estimate) => {
        const currency = estimate.currency || "USD";
        return {
          ...totals,
          [currency]: (totals[currency] || 0) + getNumericValue(estimate.estimatedCost),
        };
      }, {}),
      fallbackTotal: 0,
    };
  }

  const checklistMetrics = getChecklistMetrics(checklistData);
  return {
    source: "checklist",
    itemCount: checklistMetrics.repairItems,
    currencyTotals: {},
    fallbackTotal: checklistMetrics.repairTotal,
  };
};

const getRepairEstimateCardContent = (summary) => {
  const currencyEntries = Object.entries(summary.currencyTotals || {});

  if (currencyEntries.length === 1) {
    const [currency, total] = currencyEntries[0];
    return {
      value: formatCurrencyAmount(currency, total),
      detail: `${summary.itemCount} report estimate${summary.itemCount === 1 ? "" : "s"}`,
      breakdown: [],
    };
  }

  if (currencyEntries.length > 1) {
    return {
      value: `${currencyEntries.length} currency totals`,
      detail: `${summary.itemCount} report estimate${summary.itemCount === 1 ? "" : "s"}`,
      breakdown: currencyEntries.map(([currency, total]) => formatCurrencyAmount(currency, total)),
    };
  }

  if (summary.fallbackTotal > 0) {
    return {
      value: formatAmount(summary.fallbackTotal),
      detail: `${summary.itemCount} checklist estimate${summary.itemCount === 1 ? "" : "s"}`,
      breakdown: [],
    };
  }

  return {
    value: "Pending",
    detail: "Add repair lines to summarize costs",
    breakdown: [],
  };
};

const SummaryMetricCard = ({ label, value, hint, children }) => (
  <Paper shadow="xs" p="md" radius="md" className="h-full">
    <Text size="xs" c="dimmed" fw={700} className="uppercase tracking-[0.14em]">
      {label}
    </Text>
    {typeof value === "string" || typeof value === "number" ? (
      <Text size="xl" fw={700} mt={6}>
        {value}
      </Text>
    ) : (
      <div className="mt-2">{value}</div>
    )}
    {hint ? <Text size="sm" c="dimmed" mt="xs">{hint}</Text> : null}
    {children ? <div className="mt-3">{children}</div> : null}
  </Paper>
);

const InspectionManagement = () => {
  const { userDetails: { token } } = useContext(UserDetailContext);
  const [view, setView] = useState("list");
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null);
  const [checklistData, setChecklistData] = useState({});
  const [reportForm, setReportForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState("");
  const [openSections, setOpenSections] = useState(getDefaultOpenSections());

  const fetchRequests = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (filterStatus) params.status = filterStatus;
      const res = await getAllInspectionRequests(token, params);
      setRequests(res?.data || []);
    } catch {
      // handled in api.js
    }
    setLoading(false);
  }, [token, search, filterStatus]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const initChecklistData = (checklist) => {
    const data = {};
    for (const section of SECTION_DEFS) {
      const existing = checklist?.[section.key];
      data[section.key] = Array.isArray(existing) && existing.length > 0
        ? existing
        : section.defaultItems.map((item) => ({
          ...item,
          status: "not_checked",
          note: "",
          severity: "",
          repairCostEstimate: null,
          photoRefs: [],
        }));
    }
    data.overallRecommendation = checklist?.overallRecommendation || "";
    setChecklistData(data);
    setOpenSections(getDefaultOpenSections(data));
  };

  const initReportForm = (report) => {
    const parsedPhotos = parseReportPhotoGroups(report?.reportPhotos);
    setReportForm({
      summary: report?.summary || "",
      recommendation: report?.recommendation || "",
      disclaimer: report?.disclaimer || "This report is for informational purposes only. A certified structural engineer should be consulted for final assessment.",
      keyFindings: Array.isArray(report?.keyFindings) && report.keyFindings.length > 0
        ? report.keyFindings.map((finding) => ({ section: finding.section || "", finding: finding.finding || "", severity: finding.severity || "" }))
        : [{ section: "", finding: "", severity: "" }],
      repairEstimates: Array.isArray(report?.repairEstimates) && report.repairEstimates.length > 0
        ? report.repairEstimates.map((estimate) => ({ item: estimate.item || "", estimatedCost: estimate.estimatedCost ?? "", currency: estimate.currency || "USD" }))
        : [{ item: "", estimatedCost: "", currency: "USD" }],
      beforePhotos: parsedPhotos.beforePhotos,
      afterPhotos: parsedPhotos.afterPhotos,
      reportFiles: report?.reportFiles || [],
      status: report?.status || "draft",
    });
  };

  const openDetail = async (id) => {
    setDetailLoading(true);
    setView("detail");
    try {
      const res = await getInspectionRequest(id, token);
      const nextDetail = res?.data;
      setDetail(nextDetail);
      initChecklistData(nextDetail?.checklist);
      initReportForm(nextDetail?.report);
    } catch {
      toast.error("Failed to load details");
      setView("list");
    }
    setDetailLoading(false);
  };

  const handleStatusChange = async (nextStatus) => {
    if (!detail) return;
    setSaving(true);
    try {
      await updateInspectionStatus(detail.id, nextStatus, token);
      toast.success(`Status updated to ${STATUS_LABELS[nextStatus]}`);
      await openDetail(detail.id);
      fetchRequests();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Status update failed");
    }
    setSaving(false);
  };

  const handleSaveNotes = async () => {
    if (!detail) return;
    setSaving(true);
    try {
      await updateInspectionRequest(detail.id, {
        internalNotes: detail.internalNotes,
        assignedInspector: detail.assignedInspector,
        assignedPartner: detail.assignedPartner,
      }, token);
      toast.success("Saved");
      fetchRequests();
    } catch {
      toast.error("Save failed");
    }
    setSaving(false);
  };

  const handleSaveChecklist = async (markComplete = false) => {
    if (!detail) return;
    setSaving(true);
    try {
      const payload = { ...checklistData, markComplete };
      await saveInspectionChecklist(detail.id, payload, token);
      toast.success(markComplete ? "Checklist completed and scored" : "Checklist saved");
      await openDetail(detail.id);
      fetchRequests();
    } catch {
      toast.error("Checklist save failed");
    }
    setSaving(false);
  };

  const handleSaveReport = async () => {
    if (!detail) return;
    setSaving(true);
    try {
      const keyFindings = Array.isArray(reportForm.keyFindings)
        ? reportForm.keyFindings.filter((finding) => finding.section.trim() || finding.finding.trim())
        : null;
      const repairEstimates = Array.isArray(reportForm.repairEstimates)
        ? reportForm.repairEstimates.filter((estimate) => estimate.item.trim())
        : null;
      await saveInspectionReport(detail.id, {
        summary: reportForm.summary,
        recommendation: reportForm.recommendation,
        disclaimer: reportForm.disclaimer,
        keyFindings,
        repairEstimates,
        reportPhotos: buildReportPhotoPayload(reportForm.beforePhotos, reportForm.afterPhotos),
        reportFiles: reportForm.reportFiles,
        status: reportForm.status,
      }, token);
      toast.success("Report saved");
      await openDetail(detail.id);
      fetchRequests();
    } catch {
      toast.error("Report save failed");
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    try {
      await deleteInspectionRequestApi(deleteModal, token);
      toast.success("Request deleted");
      setDeleteModal(null);
      fetchRequests();
      if (detail?.id === deleteModal) setView("list");
    } catch {
      toast.error("Delete failed");
    }
  };

  const updateChecklistItem = (sectionKey, idx, field, value) => {
    setChecklistData((prev) => {
      const items = [...(prev[sectionKey] || [])];
      items[idx] = { ...items[idx], [field]: value };
      return { ...prev, [sectionKey]: items };
    });
  };

  const updateFinding = (idx, field, value) => {
    const updated = [...(reportForm.keyFindings || [])];
    updated[idx] = { ...updated[idx], [field]: value };
    setReportForm({ ...reportForm, keyFindings: updated });
  };

  const updateRepairEstimate = (idx, field, value) => {
    const updated = [...(reportForm.repairEstimates || [])];
    updated[idx] = { ...updated[idx], [field]: value };
    setReportForm({ ...reportForm, repairEstimates: updated });
  };

  if (view === "list") {
    return (
      <div>
        <div className="flexBetween mb-4">
          <div>
            <Title order={3} className="flex items-center gap-2 text-gray-800">
              <MdVisibility className="text-indigo-500" /> Inspection Requests
            </Title>
            <Text size="sm" c="dimmed">Manage property inspection requests</Text>
          </div>
          <Button variant="light" color="indigo" leftSection={<MdRefresh size={18} />} onClick={fetchRequests} loading={loading}>
            Refresh
          </Button>
        </div>

        <div className="flex gap-3 mb-4 flex-wrap">
          <TextInput
            placeholder="Search name, email, city..."
            leftSection={<MdSearch size={16} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[200px]"
          />
          <Select
            placeholder="All Statuses"
            clearable
            data={Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label }))}
            value={filterStatus}
            onChange={(value) => setFilterStatus(value || "")}
            className="w-[180px]"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader /></div>
        ) : requests.length === 0 ? (
          <Text c="dimmed" ta="center" py="xl">No inspection requests found</Text>
        ) : (
          <div className="overflow-x-auto">
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Property</Table.Th>
                  <Table.Th>Type</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Score</Table.Th>
                  <Table.Th>Date</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {requests.map((request) => (
                  <Table.Tr key={request.id} className="cursor-pointer" onClick={() => openDetail(request.id)}>
                    <Table.Td>
                      <Text size="sm" fw={500}>{request.fullName}</Text>
                      <Text size="xs" c="dimmed">{request.email}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{[request.city, request.district].filter(Boolean).join(", ") || "-"}</Text>
                    </Table.Td>
                    <Table.Td><Badge size="sm" variant="light">{request.requestType}</Badge></Table.Td>
                    <Table.Td><Badge color={STATUS_COLORS[request.status]}>{STATUS_LABELS[request.status] || request.status}</Badge></Table.Td>
                    <Table.Td>
                      {request.checklist?.totalScore != null ? (
                        <Badge color={RISK_COLORS[request.checklist.riskLabel] || "gray"}>{Math.round(request.checklist.totalScore)}/100</Badge>
                      ) : <Text size="xs" c="dimmed">-</Text>}
                    </Table.Td>
                    <Table.Td><Text size="xs" c="dimmed">{formatDate(request.createdAt)}</Text></Table.Td>
                    <Table.Td>
                      <Group gap={4}>
                        <ActionIcon variant="light" color="blue" onClick={(e) => { e.stopPropagation(); openDetail(request.id); }}><MdEdit size={16} /></ActionIcon>
                        <ActionIcon variant="light" color="red" onClick={(e) => { e.stopPropagation(); setDeleteModal(request.id); }}><MdDelete size={16} /></ActionIcon>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </div>
        )}

        <Modal opened={!!deleteModal} onClose={() => setDeleteModal(null)} title="Delete Request" centered>
          <Text>Are you sure? This action cannot be undone.</Text>
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={() => setDeleteModal(null)}>Cancel</Button>
            <Button color="red" onClick={handleDelete}>Delete</Button>
          </Group>
        </Modal>
      </div>
    );
  }

  if (detailLoading) return <div className="flex justify-center py-12"><Loader /></div>;
  if (!detail) return <Text c="dimmed" ta="center" py="xl">Request not found</Text>;

  const checklistMetrics = getChecklistMetrics(checklistData);
  const sectionScoreEntries = SECTION_DEFS.map((section) => ({
    ...section,
    score: detail.checklist?.sectionScores?.[section.key] ?? null,
    metrics: getSectionMetrics(getSectionItems(checklistData, section.key)),
  }));
  const riskLabel = detail.checklist?.riskLabel;
  const reportStatus = reportForm.status || detail.report?.status || "draft";
  const findingEntries = getFindingEntries(reportForm.keyFindings);
  const repairSummary = getRepairEstimateSummary(reportForm.repairEstimates, checklistData);
  const repairCard = getRepairEstimateCardContent(repairSummary);
  const requestUploadedImages = Array.isArray(detail.uploadedImages)
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
            <Text size="sm" c="dimmed">{detail.email} | {detail.phone}</Text>
          </div>
          <Badge size="lg" color={STATUS_COLORS[detail.status]}>{STATUS_LABELS[detail.status]}</Badge>
        </div>
      </Paper>

      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryMetricCard
          label="Request Status"
          value={STATUS_LABELS[detail.status] || formatLabel(detail.status)}
          hint={detail.scheduledDate ? `Scheduled ${formatDate(detail.scheduledDate)}` : "Scheduling not set"}
        >
          <Group gap={8}>
            <Badge variant="light" color={detail.urgency === "urgent" ? "red" : "gray"}>
              {formatLabel(detail.urgency)}
            </Badge>
            {detail.assignedInspector ? <Badge variant="outline" color="indigo">{detail.assignedInspector}</Badge> : null}
          </Group>
        </SummaryMetricCard>

        <SummaryMetricCard
          label="Total Score"
          value={detail.checklist?.totalScore != null ? `${Math.round(detail.checklist.totalScore)}/100` : "Pending"}
          hint={detail.checklist?.completedAt ? `Last scored ${formatDate(detail.checklist.completedAt)}` : "Score appears after checklist save"}
        >
          {detail.checklist?.totalScore != null ? (
            <Progress value={Math.round(detail.checklist.totalScore)} size="sm" radius="xl" color={RISK_COLORS[riskLabel] || "gray"} />
          ) : null}
        </SummaryMetricCard>

        <SummaryMetricCard
          label="Risk Category"
          value={riskLabel ? (
            <Badge size="lg" color={RISK_COLORS[riskLabel] || "gray"}>
              {RISK_LABELS[riskLabel] || formatLabel(riskLabel)}
            </Badge>
          ) : "Unscored"}
          hint={`${checklistMetrics.critical} critical issue${checklistMetrics.critical === 1 ? "" : "s"} flagged`}
        >
          <Group gap={8}>
            <Badge variant="light" color={checklistMetrics.attention > 0 ? "orange" : "gray"}>
              {checklistMetrics.attention} attention items
            </Badge>
            <Badge variant="outline" color={REPORT_STATUS_COLORS[reportStatus] || "gray"}>
              Report {REPORT_STATUS_LABELS[reportStatus] || formatLabel(reportStatus)}
            </Badge>
          </Group>
        </SummaryMetricCard>

        <SummaryMetricCard
          label="Checklist Completion"
          value={`${checklistMetrics.completion}%`}
          hint={`${checklistMetrics.checked}/${checklistMetrics.total} items reviewed`}
        >
          <Progress value={checklistMetrics.completion} size="sm" radius="xl" color="indigo" />
        </SummaryMetricCard>
      </div>

      <Tabs defaultValue="info">
        <Tabs.List grow>
          <Tabs.Tab value="info">Info & Status</Tabs.Tab>
          <Tabs.Tab value="checklist">Checklist</Tabs.Tab>
          <Tabs.Tab value="report">Score & Report</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="info" pt="md">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Paper shadow="xs" p="md" radius="md">
              <Text fw={600} mb="xs">Requester</Text>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <Text c="dimmed">Type:</Text><Text>{detail.requesterType}</Text>
                <Text c="dimmed">WhatsApp:</Text><Text>{detail.whatsapp || "-"}</Text>
                <Text c="dimmed">Language:</Text><Text>{detail.preferredLanguage}</Text>
              </div>
            </Paper>
            <Paper shadow="xs" p="md" radius="md">
              <Text fw={600} mb="xs">Property</Text>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <Text c="dimmed">Type:</Text><Text>{detail.propertyType || "-"}</Text>
                <Text c="dimmed">City:</Text><Text>{detail.city || "-"}</Text>
                <Text c="dimmed">District:</Text><Text>{detail.district || "-"}</Text>
                <Text c="dimmed">Address:</Text><Text>{detail.address || "-"}</Text>
                <Text c="dimmed">Ref Code:</Text><Text>{detail.referenceCode || "-"}</Text>
                <Text c="dimmed">Gross / Net:</Text><Text>{detail.grossArea || "-"} / {detail.netArea || "-"} m2</Text>
                <Text c="dimmed">Age / Floor:</Text><Text>{detail.buildingAge ?? "-"} yr | {detail.floorNumber ?? "-"}/{detail.totalFloors ?? "-"}</Text>
                <Text c="dimmed">Occupancy:</Text><Text>{detail.occupancyStatus || "-"}</Text>
              </div>
            </Paper>
            <Paper shadow="xs" p="md" radius="md">
              <Text fw={600} mb="xs">Request Details</Text>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <Text c="dimmed">Type:</Text><Badge variant="light">{detail.requestType}</Badge>
                <Text c="dimmed">Urgency:</Text><Badge variant="light" color={detail.urgency === "urgent" ? "red" : "gray"}>{detail.urgency}</Badge>
                <Text c="dimmed">Scheduled:</Text><Text>{detail.scheduledDate ? formatDate(detail.scheduledDate) : "-"}</Text>
              </div>
              {detail.notes ? <Text size="sm" mt="sm">{detail.notes}</Text> : null}
            </Paper>
            <Paper shadow="xs" p="md" radius="md">
              <Text fw={600} mb="xs">Assignment & Notes</Text>
              <TextInput label="Inspector" value={detail.assignedInspector || ""} onChange={(e) => setDetail({ ...detail, assignedInspector: e.target.value })} mb="xs" />
              <TextInput label="Partner" value={detail.assignedPartner || ""} onChange={(e) => setDetail({ ...detail, assignedPartner: e.target.value })} mb="xs" />
              <Textarea label="Internal Notes" autosize minRows={3} value={detail.internalNotes || ""} onChange={(e) => setDetail({ ...detail, internalNotes: e.target.value })} mb="xs" />
              <Button size="xs" leftSection={<MdSave size={14} />} onClick={handleSaveNotes} loading={saving}>Save</Button>
            </Paper>
          </div>

          {detail.uploadedImages?.length > 0 ? (
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
          ) : null}

          <Paper shadow="xs" p="md" radius="md" mt="md">
            <Text fw={600} mb="xs">Status Actions</Text>
            <Group gap="sm">
              {(NEXT_STATUSES[detail.status] || []).map((ns) => (
                <Button key={ns} size="sm" variant="light" color={STATUS_COLORS[ns]} onClick={() => handleStatusChange(ns)} loading={saving}>
                  To {STATUS_LABELS[ns]}
                </Button>
              ))}
              {(NEXT_STATUSES[detail.status] || []).length === 0 ? (
                <Text size="sm" c="dimmed">No further transitions available</Text>
              ) : null}
            </Group>
          </Paper>
        </Tabs.Panel>

        <Tabs.Panel value="checklist" pt="md">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
            <div className="space-y-4">
              <Paper shadow="xs" p="md" radius="md">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <Text fw={600}>Checklist Sections</Text>
                    <Text size="sm" c="dimmed">
                      Review one section at a time. Status and severity badges update live, while score updates after save.
                    </Text>
                  </div>
                  <Group gap={8}>
                    {CHECKLIST_STATUSES.map((status) => (
                      <Badge key={status} variant="light" color={CHECKLIST_STATUS_META[status].color}>
                        {CHECKLIST_STATUS_META[status].label}
                      </Badge>
                    ))}
                  </Group>
                </div>
              </Paper>

              <Accordion multiple variant="separated" radius="md" value={openSections} onChange={setOpenSections}>
                {sectionScoreEntries.map((section) => {
                  const items = getSectionItems(checklistData, section.key);
                  return (
                    <Accordion.Item key={section.key} value={section.key}>
                      <Accordion.Control>
                        <div className="flex w-full flex-col gap-3 pr-3 md:flex-row md:items-center md:justify-between">
                          <div className="min-w-0">
                            <div className="mb-1 flex flex-wrap items-center gap-2">
                              <Text fw={600}>{section.label}</Text>
                              <Badge variant="outline" color="gray">{section.weight}% weight</Badge>
                              {section.score != null ? (
                                <Badge variant="light" color={section.score >= 70 ? "green" : section.score >= 50 ? "orange" : "red"}>
                                  {Math.round(section.score)}/100
                                </Badge>
                              ) : (
                                <Badge variant="light" color="gray">Unscored</Badge>
                              )}
                            </div>
                            <Group gap={8}>
                              <Badge variant="light" color="indigo">{section.metrics.checked}/{section.metrics.total} checked</Badge>
                              {section.metrics.critical > 0 ? <Badge variant="light" color="red">{section.metrics.critical} critical</Badge> : null}
                              {section.metrics.attention > 0 ? <Badge variant="light" color="orange">{section.metrics.attention} attention</Badge> : null}
                            </Group>
                          </div>
                          <div className="w-full md:w-[140px]">
                            <Text size="xs" c="dimmed" mb={6}>Completion</Text>
                            <Progress value={section.metrics.completion} size="sm" radius="xl" color="indigo" />
                          </div>
                        </div>
                      </Accordion.Control>

                      <Accordion.Panel>
                        <div className="space-y-3">
                          {items.map((item, idx) => {
                            const statusMeta = CHECKLIST_STATUS_META[item.status] || CHECKLIST_STATUS_META.not_checked;
                            const severityMeta = SEVERITY_META[item.severity] || (item.severity ? { label: formatLabel(item.severity), color: "gray" } : null);
                            return (
                              <div key={item.key || idx} className={`rounded-xl border p-4 ${statusMeta.surface}`}>
                                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                  <div className="min-w-0">
                                    <Text size="sm" fw={600}>{item.label || formatLabel(item.key)}</Text>
                                    <Text size="xs" c="dimmed" mt={4}>
                                      {getNumericValue(item.repairCostEstimate) > 0
                                        ? `Repair estimate: ${formatAmount(item.repairCostEstimate)}`
                                        : "Add note, severity, and repair estimate if required."}
                                    </Text>
                                  </div>
                                  <Group gap={8}>
                                    <Badge variant="light" color={statusMeta.color}>{statusMeta.label}</Badge>
                                    {severityMeta && item.severity && item.severity !== "none" ? (
                                      <Badge variant="outline" color={severityMeta.color}>{severityMeta.label}</Badge>
                                    ) : null}
                                  </Group>
                                </div>

                                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                                  <Select
                                    label="Status"
                                    data={CHECKLIST_STATUSES.map((status) => ({ value: status, label: CHECKLIST_STATUS_META[status].label }))}
                                    value={item.status || "not_checked"}
                                    onChange={(value) => updateChecklistItem(section.key, idx, "status", value || "not_checked")}
                                  />
                                  <Select
                                    label="Severity"
                                    clearable
                                    data={Object.entries(SEVERITY_META).map(([value, meta]) => ({ value, label: meta.label }))}
                                    value={item.severity || ""}
                                    onChange={(value) => updateChecklistItem(section.key, idx, "severity", value || "")}
                                  />
                                  <NumberInput
                                    label="Repair Estimate"
                                    placeholder="Add cost"
                                    min={0}
                                    value={item.repairCostEstimate ?? ""}
                                    onChange={(value) => updateChecklistItem(section.key, idx, "repairCostEstimate", value)}
                                  />
                                </div>

                                <Textarea
                                  label="Inspector Note"
                                  autosize
                                  minRows={2}
                                  mt="md"
                                  value={item.note || ""}
                                  onChange={(e) => updateChecklistItem(section.key, idx, "note", e.target.value)}
                                />
                              </div>
                            );
                          })}
                        </div>
                      </Accordion.Panel>
                    </Accordion.Item>
                  );
                })}
              </Accordion>
            </div>

            <div className="space-y-4 xl:sticky xl:top-4">
              <Paper shadow="xs" p="md" radius="md">
                <Text fw={600}>Checklist Summary</Text>
                <Text size="sm" c="dimmed" mt={4}>
                  Track completion before saving the scored version.
                </Text>

                <div className="mt-4 space-y-4">
                  <div>
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <Text size="sm" fw={500}>Completion</Text>
                      <Text size="sm" c="dimmed">{checklistMetrics.checked}/{checklistMetrics.total}</Text>
                    </div>
                    <Progress value={checklistMetrics.completion} size="sm" radius="xl" color="indigo" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <Text size="xs" c="dimmed">Critical Issues</Text>
                      <Text fw={700} mt={4}>{checklistMetrics.critical}</Text>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <Text size="xs" c="dimmed">Costed Items</Text>
                      <Text fw={700} mt={4}>{checklistMetrics.repairItems}</Text>
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <Text size="xs" c="dimmed">Current Score State</Text>
                    <Text fw={700} mt={4}>
                      {detail.checklist?.totalScore != null ? `${Math.round(detail.checklist.totalScore)}/100` : "Pending save"}
                    </Text>
                    <Text size="xs" c="dimmed" mt={6}>
                      {detail.checklist?.completedAt ? `Last scored ${formatDate(detail.checklist.completedAt)}` : "Use Complete & Score when the checklist is ready."}
                    </Text>
                  </div>
                </div>
              </Paper>

              <Paper shadow="xs" p="md" radius="md">
                <Textarea
                  label="Overall Recommendation"
                  autosize
                  minRows={4}
                  value={checklistData.overallRecommendation || ""}
                  onChange={(e) => setChecklistData({ ...checklistData, overallRecommendation: e.target.value })}
                />
              </Paper>

              <Paper shadow="xs" p="md" radius="md">
                <Text fw={600}>Save Actions</Text>
                <Text size="sm" c="dimmed" mt={4}>
                  Save a draft to keep progress. Complete and score when you want the backend score refreshed.
                </Text>
                <div className="mt-4 flex flex-col gap-2">
                  <Button leftSection={<MdSave size={16} />} onClick={() => handleSaveChecklist(false)} loading={saving} fullWidth>
                    Save Draft
                  </Button>
                  <Button color="green" leftSection={<MdCheckCircle size={16} />} onClick={() => handleSaveChecklist(true)} loading={saving} fullWidth>
                    Complete & Score
                  </Button>
                </div>
              </Paper>
            </div>
          </div>
        </Tabs.Panel>
        <Tabs.Panel value="report" pt="md">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_380px] xl:items-start">
            <div className="space-y-4">
              <Paper shadow="xs" p="md" radius="md">
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Text fw={600}>Scoring & Report Center</Text>
                    <Text size="sm" c="dimmed">
                      Saved checklist scores stay authoritative. This view turns them into a clearer reporting workspace.
                    </Text>
                  </div>
                  <Badge variant="light" color={REPORT_STATUS_COLORS[reportStatus] || "gray"}>
                    {REPORT_STATUS_LABELS[reportStatus] || formatLabel(reportStatus)}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-3">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <Text size="xs" c="dimmed">Total Score</Text>
                    <Text size="xl" fw={700} mt={6}>{detail.checklist?.totalScore != null ? Math.round(detail.checklist.totalScore) : "Pending"}</Text>
                    <Text size="sm" c="dimmed" mt={8}>
                      {detail.checklist?.totalScore != null ? "Saved checklist score" : "Complete checklist scoring first"}
                    </Text>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <Text size="xs" c="dimmed">Risk Label</Text>
                    <div className="mt-3">
                      {riskLabel ? (
                        <Badge size="lg" color={RISK_COLORS[riskLabel] || "gray"}>
                          {RISK_LABELS[riskLabel] || formatLabel(riskLabel)}
                        </Badge>
                      ) : (
                        <Text fw={700}>Unscored</Text>
                      )}
                    </div>
                    <Text size="sm" c="dimmed" mt={8}>Based on current saved section scores</Text>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <Text size="xs" c="dimmed">Critical Issues</Text>
                    <Text size="xl" fw={700} mt={6}>{checklistMetrics.critical}</Text>
                    <Text size="sm" c="dimmed" mt={8}>Items marked critical by status or severity</Text>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <Text size="xs" c="dimmed">Repair Estimate Total</Text>
                    <Text size="xl" fw={700} mt={6}>{repairCard.value}</Text>
                    <Text size="sm" c="dimmed" mt={8}>{repairCard.detail}</Text>
                    {repairCard.breakdown.length > 0 ? (
                      <Text size="xs" c="dimmed" mt={8}>{repairCard.breakdown.join(" | ")}</Text>
                    ) : null}
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <Text size="xs" c="dimmed">Summary Findings</Text>
                    <Text size="xl" fw={700} mt={6}>{findingEntries.length}</Text>
                    <Text size="sm" c="dimmed" mt={8}>Key findings included in the report draft</Text>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <Text size="xs" c="dimmed">Report Status</Text>
                    <div className="mt-3">
                      <Badge size="lg" color={REPORT_STATUS_COLORS[reportStatus] || "gray"}>
                        {REPORT_STATUS_LABELS[reportStatus] || formatLabel(reportStatus)}
                      </Badge>
                    </div>
                    <Text size="sm" c="dimmed" mt={8}>
                      {detail.report?.generatedAt ? `Last updated ${formatDate(detail.report.generatedAt)}` : "Report not saved yet"}
                    </Text>
                  </div>
                </div>
              </Paper>

              {requestUploadedImages.length > 0 ? (
                <Paper shadow="xs" p="md" radius="md">
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <Text fw={600} className="flex items-center gap-2">
                        <MdPhotoLibrary className="text-indigo-500" /> Request Photos
                      </Text>
                      <Text size="sm" c="dimmed">
                        User-uploaded photos available here as visual reference while scoring and writing the report.
                      </Text>
                    </div>
                    <Badge variant="light" color="indigo">
                      {requestUploadedImages.length} photo{requestUploadedImages.length === 1 ? "" : "s"}
                    </Badge>
                  </div>

                  <div className="flex gap-3 flex-wrap">
                    {requestUploadedImages.map((url, index) => (
                      <a
                        key={`${detail.id}-report-photo-${index}`}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block overflow-hidden rounded-xl border border-slate-200"
                      >
                        <img
                          src={url}
                          alt={`request-upload-${index}`}
                          className="h-28 w-28 object-cover transition hover:scale-[1.02]"
                        />
                      </a>
                    ))}
                  </div>
                </Paper>
              ) : null}

              <Paper shadow="xs" p="md" radius="md">
                <div className="mb-4">
                  <Text fw={600}>Section Scores</Text>
                  <Text size="sm" c="dimmed">
                    Compare saved score by section with current checklist coverage.
                  </Text>
                </div>

                <div className="space-y-4">
                  {sectionScoreEntries.map((section) => (
                    <div key={section.key} className="rounded-xl border border-slate-200 p-4">
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Text fw={600}>{section.label}</Text>
                          <Badge variant="outline" color="gray">{section.weight}% weight</Badge>
                          <Badge variant="light" color="indigo">{section.metrics.checked}/{section.metrics.total} checked</Badge>
                        </div>
                        <Text fw={700}>{section.score != null ? `${Math.round(section.score)}/100` : "Pending"}</Text>
                      </div>
                      <Progress
                        value={section.score != null ? Math.max(Math.round(section.score), 0) : 0}
                        size="sm"
                        radius="xl"
                        color={section.score >= 70 ? "green" : section.score >= 50 ? "orange" : "red"}
                      />
                    </div>
                  ))}
                </div>
              </Paper>

              <Paper shadow="xs" p="md" radius="md">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <Text fw={600}>Summary Findings</Text>
                    <Text size="sm" c="dimmed">
                      Quick scan of the issues that will appear in the report.
                    </Text>
                  </div>
                  <Badge variant="light" color={findingEntries.length > 0 ? "indigo" : "gray"}>
                    {findingEntries.length} item{findingEntries.length === 1 ? "" : "s"}
                  </Badge>
                </div>

                {findingEntries.length > 0 ? (
                  <div className="space-y-3">
                    {findingEntries.map((finding, idx) => (
                      <div key={`${finding.section}-${idx}`} className="rounded-xl border border-slate-200 p-4">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          {finding.section ? (
                            <Badge variant="light" color="blue">
                              {SECTION_DEFS.find((section) => section.key === finding.section)?.label || formatLabel(finding.section)}
                            </Badge>
                          ) : null}
                          {finding.severity ? (
                            <Badge variant="outline" color={SEVERITY_META[finding.severity]?.color || "gray"}>
                              {SEVERITY_META[finding.severity]?.label || formatLabel(finding.severity)}
                            </Badge>
                          ) : null}
                        </div>
                        <Text size="sm">{finding.finding}</Text>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Text size="sm" c="dimmed">
                    No summary findings yet. Add key findings on the right to populate this overview.
                  </Text>
                )}
              </Paper>
            </div>

            <div className="space-y-4">
              <Paper shadow="xs" p="md" radius="md" className="xl:sticky xl:top-4">
                <Select
                  label="Report Status"
                  data={Object.entries(REPORT_STATUS_LABELS).map(([value, label]) => ({ value, label }))}
                  value={reportForm.status}
                  onChange={(value) => setReportForm({ ...reportForm, status: value || "draft" })}
                />
                <Text size="sm" c="dimmed" mt="sm">
                  Total score, section scores, and risk label continue to come from the saved checklist.
                </Text>
                <Button fullWidth mt="md" leftSection={<MdSave size={16} />} onClick={handleSaveReport} loading={saving}>
                  Save Report
                </Button>
              </Paper>

              <Paper shadow="xs" p="md" radius="md">
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Text fw={600}>Before / After Preview</Text>
                    <Text size="sm" c="dimmed">
                      Upload the before and after visuals that will be shown in the user's private panel.
                    </Text>
                  </div>
                  <Badge variant="light" color="indigo">
                    {(reportForm.beforePhotos?.length || 0) + (reportForm.afterPhotos?.length || 0)} photo
                    {(reportForm.beforePhotos?.length || 0) + (reportForm.afterPhotos?.length || 0) === 1 ? "" : "s"}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <Text fw={600} size="sm" mb="xs">Before Photos</Text>
                    {(reportForm.beforePhotos || []).length > 0 ? (
                      <div className="mb-3 flex gap-2 flex-wrap">
                        {reportForm.beforePhotos.map((url, index) => (
                          <div key={`report-before-${index}`} className="relative">
                            <a href={url} target="_blank" rel="noopener noreferrer">
                              <img src={url} alt={`report-before-${index}`} className="h-24 w-24 rounded border object-cover" />
                            </a>
                            <ActionIcon
                              size="xs"
                              color="red"
                              variant="filled"
                              className="absolute -top-1 -right-1"
                              onClick={() =>
                                setReportForm((prev) => ({
                                  ...prev,
                                  beforePhotos: prev.beforePhotos.filter((_, itemIndex) => itemIndex !== index),
                                }))
                              }
                            >
                              <MdDelete size={10} />
                            </ActionIcon>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Text size="sm" c="dimmed" mb="sm">No before photos uploaded</Text>
                    )}
                    <Button
                      size="xs"
                      variant="light"
                      leftSection={<MdCloudUpload size={16} />}
                      loading={uploading === "report-before"}
                      onClick={async () => {
                        setUploading("report-before");
                        try {
                          const urls = await pickAndUploadImages({ multiple: true });
                          if (urls.length) {
                            setReportForm((prev) => ({
                              ...prev,
                              beforePhotos: uniqueUrls([...(prev.beforePhotos || []), ...urls]),
                            }));
                          }
                        } catch {
                          toast.error("Before photo upload failed");
                        }
                        setUploading("");
                      }}
                    >
                      Upload Before Photos
                    </Button>
                  </div>

                  <div>
                    <Text fw={600} size="sm" mb="xs">After Photos</Text>
                    {(reportForm.afterPhotos || []).length > 0 ? (
                      <div className="mb-3 flex gap-2 flex-wrap">
                        {reportForm.afterPhotos.map((url, index) => (
                          <div key={`report-after-${index}`} className="relative">
                            <a href={url} target="_blank" rel="noopener noreferrer">
                              <img src={url} alt={`report-after-${index}`} className="h-24 w-24 rounded border object-cover" />
                            </a>
                            <ActionIcon
                              size="xs"
                              color="red"
                              variant="filled"
                              className="absolute -top-1 -right-1"
                              onClick={() =>
                                setReportForm((prev) => ({
                                  ...prev,
                                  afterPhotos: prev.afterPhotos.filter((_, itemIndex) => itemIndex !== index),
                                }))
                              }
                            >
                              <MdDelete size={10} />
                            </ActionIcon>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Text size="sm" c="dimmed" mb="sm">No after photos uploaded</Text>
                    )}
                    <Button
                      size="xs"
                      variant="light"
                      color="teal"
                      leftSection={<MdCloudUpload size={16} />}
                      loading={uploading === "report-after"}
                      onClick={async () => {
                        setUploading("report-after");
                        try {
                          const urls = await pickAndUploadImages({ multiple: true });
                          if (urls.length) {
                            setReportForm((prev) => ({
                              ...prev,
                              afterPhotos: uniqueUrls([...(prev.afterPhotos || []), ...urls]),
                            }));
                          }
                        } catch {
                          toast.error("After photo upload failed");
                        }
                        setUploading("");
                      }}
                    >
                      Upload After Photos
                    </Button>
                  </div>
                </div>
              </Paper>

              <Paper shadow="xs" p="md" radius="md">
                <Text fw={600} mb="sm">Narrative Summary</Text>
                <Textarea
                  label="Report Summary"
                  autosize
                  minRows={5}
                  value={reportForm.summary}
                  onChange={(e) => setReportForm({ ...reportForm, summary: e.target.value })}
                  mb="sm"
                />
                <Textarea
                  label="Recommendation"
                  autosize
                  minRows={3}
                  value={reportForm.recommendation}
                  onChange={(e) => setReportForm({ ...reportForm, recommendation: e.target.value })}
                  mb="sm"
                />
                <Textarea
                  label="Disclaimer"
                  autosize
                  minRows={3}
                  value={reportForm.disclaimer}
                  onChange={(e) => setReportForm({ ...reportForm, disclaimer: e.target.value })}
                />
              </Paper>

              <Paper shadow="xs" p="md" radius="md">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <Text fw={600}>Key Findings</Text>
                    <Text size="sm" c="dimmed">
                      Structure findings in a scan-friendly way for the report center and final output.
                    </Text>
                  </div>
                  <Button
                    size="xs"
                    variant="subtle"
                    leftSection={<MdAdd size={14} />}
                    onClick={() => setReportForm({
                      ...reportForm,
                      keyFindings: [...(reportForm.keyFindings || []), { section: "", finding: "", severity: "" }],
                    })}
                  >
                    Add Finding
                  </Button>
                </div>

                <div className="space-y-3">
                  {(reportForm.keyFindings || []).map((finding, idx) => (
                    <div key={idx} className="rounded-xl border border-slate-200 p-4">
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-[160px_120px_auto]">
                        <Select
                          label="Section"
                          clearable
                          data={SECTION_DEFS.map((section) => ({ value: section.key, label: section.label }))}
                          value={finding.section}
                          onChange={(value) => updateFinding(idx, "section", value || "")}
                        />
                        <Select
                          label="Severity"
                          clearable
                          data={["low", "medium", "high", "critical"].map((severity) => ({ value: severity, label: formatLabel(severity) }))}
                          value={finding.severity}
                          onChange={(value) => updateFinding(idx, "severity", value || "")}
                        />
                        <div className="flex items-end justify-end">
                          <ActionIcon
                            color="red"
                            variant="light"
                            onClick={() => {
                              const updated = reportForm.keyFindings.filter((_, itemIndex) => itemIndex !== idx);
                              setReportForm({
                                ...reportForm,
                                keyFindings: updated.length ? updated : [{ section: "", finding: "", severity: "" }],
                              });
                            }}
                          >
                            <MdDelete size={16} />
                          </ActionIcon>
                        </div>
                      </div>

                      <Textarea
                        label="Finding"
                        autosize
                        minRows={2}
                        mt="md"
                        value={finding.finding}
                        onChange={(e) => updateFinding(idx, "finding", e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </Paper>

              <Paper shadow="xs" p="md" radius="md">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <Text fw={600}>Repair Estimates</Text>
                    <Text size="sm" c="dimmed">
                      Build the cost summary used in the report center.
                    </Text>
                  </div>
                  <Button
                    size="xs"
                    variant="subtle"
                    leftSection={<MdAdd size={14} />}
                    onClick={() => setReportForm({
                      ...reportForm,
                      repairEstimates: [...(reportForm.repairEstimates || []), { item: "", estimatedCost: "", currency: "USD" }],
                    })}
                  >
                    Add Estimate
                  </Button>
                </div>

                <div className="space-y-3">
                  {(reportForm.repairEstimates || []).map((estimate, idx) => (
                    <div key={idx} className="rounded-xl border border-slate-200 p-4">
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_120px_100px_auto]">
                        <TextInput
                          label="Item"
                          placeholder="Roof repair"
                          value={estimate.item}
                          onChange={(e) => updateRepairEstimate(idx, "item", e.target.value)}
                        />
                        <NumberInput
                          label="Cost"
                          min={0}
                          value={estimate.estimatedCost}
                          onChange={(value) => updateRepairEstimate(idx, "estimatedCost", value)}
                        />
                        <Select
                          label="Currency"
                          data={["USD", "EUR", "TRY", "GBP"]}
                          value={estimate.currency}
                          onChange={(value) => updateRepairEstimate(idx, "currency", value || "USD")}
                        />
                        <div className="flex items-end justify-end">
                          <ActionIcon
                            color="red"
                            variant="light"
                            onClick={() => {
                              const updated = reportForm.repairEstimates.filter((_, itemIndex) => itemIndex !== idx);
                              setReportForm({
                                ...reportForm,
                                repairEstimates: updated.length ? updated : [{ item: "", estimatedCost: "", currency: "USD" }],
                              });
                            }}
                          >
                            <MdDelete size={16} />
                          </ActionIcon>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Paper>
            </div>
          </div>
        </Tabs.Panel>
      </Tabs>
    </div>
  );
};

export default InspectionManagement;
