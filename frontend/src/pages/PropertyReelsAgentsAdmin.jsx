import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  Badge,
  Button,
  Container,
  Group,
  Loader,
  Modal,
  PasswordInput,
  Paper,
  Select,
  Switch,
  Table,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useAuth0 } from "@auth0/auth0-react";
import { Navigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  MdAdd,
  MdContentCopy,
  MdEdit,
  MdLink,
  MdLockReset,
  MdPassword,
  MdRefresh,
} from "react-icons/md";
import UserDetailContext from "../context/UserDetailContext";
import useAdmin from "../hooks/useAdmin";
import {
  createPropertyReelsAgent,
  getAllConsultants,
  getPropertyReelsAgents,
  updatePropertyReelsAgent,
} from "../utils/api";

const LOGIN_LINK = "https://live.hbrealstate.com/login";
const CREATE_STATUSES = ["ACTIVE", "PENDING"];
const UPDATE_STATUSES = ["PENDING", "ACTIVE", "SUSPENDED", "REJECTED"];

const emptyCreateForm = {
  agencyName: "",
  email: "",
  name: "",
  phone: "",
  sendInvite: false,
  status: "PENDING",
  temporaryPassword: "",
};

const emptyEditForm = {
  agencyName: "",
  name: "",
  phone: "",
  status: "PENDING",
  temporaryPassword: "",
};

const statusColors = {
  ACTIVE: "green",
  PENDING: "yellow",
  SUSPENDED: "orange",
  REJECTED: "red",
};

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const statusOptions = (statuses) =>
  statuses.map((status) => ({ label: status, value: status }));

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.message ||
  fallback;

const generateTemporaryPassword = () => {
  const bytes = new Uint32Array(3);
  window.crypto?.getRandomValues?.(bytes);
  const fallback = `${Date.now()}${Math.random()}`;
  const source = bytes.some(Boolean) ? Array.from(bytes).join("") : fallback;
  return `HB-${Number(source.replace(/\D/g, "").slice(0, 6) || Date.now())
    .toString(36)
    .toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
};

const PropertyReelsAgentsAdmin = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth0();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const {
    userDetails: { token },
  } = useContext(UserDetailContext);

  const [agents, setAgents] = useState([]);
  const [consultants, setConsultants] = useState([]);
  const [consultantsLoading, setConsultantsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [createOpened, setCreateOpened] = useState(false);
  const [editOpened, setEditOpened] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [selectedConsultantId, setSelectedConsultantId] = useState("");
  const [lastCredentials, setLastCredentials] = useState(null);
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [editForm, setEditForm] = useState(emptyEditForm);

  const canLoad = Boolean(token && isAdmin);

  const fetchAgents = useCallback(async () => {
    if (!canLoad) return;

    setLoading(true);
    try {
      const data = await getPropertyReelsAgents(token);
      setAgents(data?.agents || []);
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not load Property Reels agents."));
    } finally {
      setLoading(false);
    }
  }, [canLoad, token]);

  useEffect(() => {
    if (canLoad) {
      fetchAgents();
      return;
    }

    if (!authLoading && !adminLoading) {
      setLoading(false);
    }
  }, [adminLoading, authLoading, canLoad, fetchAgents]);

  const sortedAgents = useMemo(
    () =>
      [...agents].sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      ),
    [agents]
  );

  const consultantOptions = useMemo(
    () =>
      consultants
        .filter((consultant) => consultant?.email)
        .map((consultant) => ({
          value: consultant.id,
          label: `${consultant.name || consultant.email} - ${consultant.email}`,
        })),
    [consultants]
  );

  const fetchConsultants = useCallback(async () => {
    setConsultantsLoading(true);
    try {
      const data = await getAllConsultants();
      setConsultants(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not load consultants."));
    } finally {
      setConsultantsLoading(false);
    }
  }, []);

  const openCreate = () => {
    setCreateForm({
      ...emptyCreateForm,
      temporaryPassword: generateTemporaryPassword(),
    });
    setSelectedConsultantId("");
    setCreateOpened(true);
    if (consultants.length === 0) {
      fetchConsultants();
    }
  };

  const applyConsultant = (consultantId) => {
    setSelectedConsultantId(consultantId || "");
    const consultant = consultants.find((item) => item.id === consultantId);

    if (!consultant) return;

    setCreateForm((current) => ({
      ...current,
      agencyName:
        consultant.title ||
        consultant.specialty ||
        current.agencyName ||
        "HB Real Estate",
      email: consultant.email || current.email,
      name: consultant.name || current.name,
      phone: consultant.phone || consultant.whatsapp || current.phone,
      temporaryPassword: current.temporaryPassword || generateTemporaryPassword(),
    }));
  };

  const openEdit = (agent) => {
    setSelectedAgent(agent);
    setEditForm({
      agencyName: agent.agencyName || "",
      name: agent.name || "",
      phone: agent.phone || "",
      status: agent.status || "PENDING",
      temporaryPassword: "",
    });
    setEditOpened(true);
  };

  const copyLoginLink = async () => {
    try {
      await navigator.clipboard.writeText(LOGIN_LINK);
      toast.success("Login link copied.");
    } catch (_error) {
      toast.error("Could not copy login link.");
    }
  };

  const copyCredentials = async (credentials = lastCredentials) => {
    if (!credentials?.email || !credentials?.temporaryPassword) return;

    try {
      await navigator.clipboard.writeText(
        [
          `Login: ${LOGIN_LINK}`,
          `Email: ${credentials.email}`,
          `Password: ${credentials.temporaryPassword}`,
        ].join("\n")
      );
      toast.success("Login credentials copied.");
    } catch (_error) {
      toast.error("Could not copy credentials.");
    }
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      const data = await createPropertyReelsAgent(createForm, token);
      setAgents((current) => [data.agent, ...current]);
      setLastCredentials({
        email: data.agent?.email || createForm.email,
        name: data.agent?.name || createForm.name,
        temporaryPassword: createForm.temporaryPassword,
      });
      setCreateOpened(false);
      setCreateForm(emptyCreateForm);
      if (createForm.sendInvite && !data?.inviteEmail?.sent) {
        toast.warn(
          `Agent created, but invite email was not sent: ${
            data?.inviteEmail?.reason || "email not configured"
          }`
        );
      } else {
        toast.success(
          data?.inviteEmail?.sent
            ? "Agent created and live code sent."
            : "Agent created."
        );
      }
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not create agent."));
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedAgent) return;

    setSaving(true);
    try {
      const payload = {
        agencyName: editForm.agencyName,
        name: editForm.name,
        phone: editForm.phone,
        sendInvite: false,
        status: editForm.status,
        ...(editForm.temporaryPassword
          ? { temporaryPassword: editForm.temporaryPassword }
          : {}),
      };
      const data = await updatePropertyReelsAgent(selectedAgent.id, payload, token);

      setAgents((current) =>
        current.map((agent) => (agent.id === data.agent.id ? data.agent : agent))
      );
      if (editForm.temporaryPassword) {
        setLastCredentials({
          email: data.agent?.email || selectedAgent.email,
          name: data.agent?.name || selectedAgent.name,
          temporaryPassword: editForm.temporaryPassword,
        });
      }
      setEditOpened(false);
      setSelectedAgent(null);
      if (payload.sendInvite && !data?.inviteEmail?.sent) {
        toast.warn(
          `Agent updated, but invite email was not sent: ${
            data?.inviteEmail?.reason || "email not configured"
          }`
        );
      } else {
        toast.success(
          data?.inviteEmail?.sent
            ? "Agent updated and live code sent."
            : "Agent updated."
        );
      }
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not update agent."));
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-[60vh] flexCenter">
        <Loader size="lg" />
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <Container size="xl" py="xl">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <Text size="sm" tt="uppercase" fw={700} c="dimmed">
            Admin
          </Text>
          <Title order={1}>Property Reels Agents</Title>
          <Text c="dimmed" mt="xs">
            Manage live.hbrealstate.com agent access from the main admin panel.
          </Text>
        </div>
        <Group>
          <Button
            leftSection={<MdLink size={18} />}
            variant="light"
            onClick={copyLoginLink}
          >
            Copy login link
          </Button>
          <Button
            leftSection={<MdRefresh size={18} />}
            variant="default"
            onClick={fetchAgents}
          >
            Refresh
          </Button>
          <Button leftSection={<MdAdd size={18} />} onClick={openCreate}>
            Create agent
          </Button>
        </Group>
      </div>

      {lastCredentials && (
        <Paper withBorder radius="md" p="md" className="mb-6 bg-blue-50">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <Text fw={700}>Live login credentials ready</Text>
              <Text size="sm" c="dimmed">
                {lastCredentials.name || "Agent"} can now log in at {LOGIN_LINK}
              </Text>
              <Text size="sm" mt={4}>
                Email: <strong>{lastCredentials.email}</strong> | Password:{" "}
                <strong>{lastCredentials.temporaryPassword}</strong>
              </Text>
            </div>
            <Group>
              <Button
                variant="light"
                leftSection={<MdContentCopy size={16} />}
                onClick={() => copyCredentials()}
              >
                Copy credentials
              </Button>
              <Button variant="subtle" onClick={() => setLastCredentials(null)}>
                Hide
              </Button>
            </Group>
          </div>
        </Paper>
      )}

      <Paper withBorder radius="md" p="md">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Text fw={700}>Agents</Text>
            <Text size="sm" c="dimmed">
              Login: {LOGIN_LINK}
            </Text>
          </div>
          <Badge variant="light">{sortedAgents.length} total</Badge>
        </div>

        {loading ? (
          <div className="py-16 flexCenter">
            <Loader />
          </div>
        ) : (
          <Table.ScrollContainer minWidth={960}>
            <Table striped highlightOnHover verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Email</Table.Th>
                  <Table.Th>Phone</Table.Th>
                  <Table.Th>Agency</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Created</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {sortedAgents.map((agent) => (
                  <Table.Tr key={agent.id}>
                    <Table.Td>
                      <Text fw={600}>{agent.name || "-"}</Text>
                    </Table.Td>
                    <Table.Td>{agent.email}</Table.Td>
                    <Table.Td>{agent.phone || "-"}</Table.Td>
                    <Table.Td>{agent.agencyName || "-"}</Table.Td>
                    <Table.Td>
                      <Badge color={statusColors[agent.status] || "gray"}>
                        {agent.status || "PENDING"}
                      </Badge>
                    </Table.Td>
                    <Table.Td>{formatDate(agent.createdAt)}</Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <Button
                          size="xs"
                          variant="light"
                          leftSection={<MdEdit size={14} />}
                          onClick={() => openEdit(agent)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="xs"
                          variant="subtle"
                          leftSection={<MdContentCopy size={14} />}
                          onClick={copyLoginLink}
                        >
                          Link
                        </Button>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
                {sortedAgents.length === 0 && (
                  <Table.Tr>
                    <Table.Td colSpan={7}>
                      <Text ta="center" c="dimmed" py="xl">
                        No Property Reels agents yet.
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        )}
      </Paper>

      <Modal
        opened={createOpened}
        onClose={() => setCreateOpened(false)}
        title="Create Property Reels agent"
        centered
        size="lg"
      >
        <div className="grid gap-3">
          <Select
            label="Use existing website consultant"
            placeholder="Select consultant"
            data={consultantOptions}
            searchable
            clearable
            value={selectedConsultantId}
            onChange={applyConsultant}
            rightSection={consultantsLoading ? <Loader size={16} /> : undefined}
          />
          <TextInput
            label="Name"
            value={createForm.name}
            onChange={(event) =>
              setCreateForm({ ...createForm, name: event.currentTarget.value })
            }
            required
          />
          <TextInput
            label="Email"
            type="email"
            value={createForm.email}
            onChange={(event) =>
              setCreateForm({ ...createForm, email: event.currentTarget.value })
            }
            required
          />
          <TextInput
            label="Phone"
            value={createForm.phone}
            onChange={(event) =>
              setCreateForm({ ...createForm, phone: event.currentTarget.value })
            }
          />
          <TextInput
            label="Agency name"
            value={createForm.agencyName}
            onChange={(event) =>
              setCreateForm({
                ...createForm,
                agencyName: event.currentTarget.value,
              })
            }
          />
          <PasswordInput
            label="Temporary password"
            value={createForm.temporaryPassword}
            onChange={(event) =>
              setCreateForm({
                ...createForm,
                temporaryPassword: event.currentTarget.value,
              })
            }
            required
          />
          <Group justify="space-between" align="center">
            <Switch
              label="Optional: send live login code to this agent by email"
              checked={createForm.sendInvite}
              onChange={(event) =>
                setCreateForm({
                  ...createForm,
                  sendInvite: event.currentTarget.checked,
                })
              }
            />
            <Button
              size="xs"
              variant="light"
              leftSection={<MdPassword size={16} />}
              onClick={() =>
                setCreateForm({
                  ...createForm,
                  temporaryPassword: generateTemporaryPassword(),
                })
              }
            >
              Generate code
            </Button>
          </Group>
          <Select
            label="Status"
            data={statusOptions(CREATE_STATUSES)}
            value={createForm.status}
            onChange={(value) =>
              setCreateForm({ ...createForm, status: value || "PENDING" })
            }
          />
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={() => setCreateOpened(false)}>
              Cancel
            </Button>
            <Button loading={saving} onClick={handleCreate}>
              Create agent
            </Button>
          </Group>
        </div>
      </Modal>

      <Modal
        opened={editOpened}
        onClose={() => setEditOpened(false)}
        title="Update Property Reels agent"
        centered
        size="lg"
      >
        <div className="grid gap-3">
          <TextInput label="Email" value={selectedAgent?.email || ""} disabled />
          <TextInput
            label="Name"
            value={editForm.name}
            onChange={(event) =>
              setEditForm({ ...editForm, name: event.currentTarget.value })
            }
            required
          />
          <TextInput
            label="Phone"
            value={editForm.phone}
            onChange={(event) =>
              setEditForm({ ...editForm, phone: event.currentTarget.value })
            }
          />
          <TextInput
            label="Agency name"
            value={editForm.agencyName}
            onChange={(event) =>
              setEditForm({
                ...editForm,
                agencyName: event.currentTarget.value,
              })
            }
          />
          <Select
            label="Status"
            data={statusOptions(UPDATE_STATUSES)}
            value={editForm.status}
            onChange={(value) =>
              setEditForm({ ...editForm, status: value || "PENDING" })
            }
          />
          <PasswordInput
            label="Reset password"
            description="Leave blank to keep the current password."
            leftSection={<MdLockReset size={16} />}
            value={editForm.temporaryPassword}
            onChange={(event) =>
              setEditForm({
                ...editForm,
                temporaryPassword: event.currentTarget.value,
              })
            }
          />
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={() => setEditOpened(false)}>
              Cancel
            </Button>
            <Button loading={saving} onClick={handleUpdate}>
              Save changes
            </Button>
          </Group>
        </div>
      </Modal>
    </Container>
  );
};

export default PropertyReelsAgentsAdmin;
