export const USER_ROLES = Object.freeze({
  ADMIN: "ADMIN",
  AGENT: "AGENT",
});

export const USER_STATUSES = Object.freeze({
  PENDING: "PENDING",
  ACTIVE: "ACTIVE",
  SUSPENDED: "SUSPENDED",
  REJECTED: "REJECTED",
});

export const AGENT_STATUSES = new Set(Object.values(USER_STATUSES));
export const ADMIN_CREATABLE_AGENT_STATUSES = new Set([
  USER_STATUSES.PENDING,
  USER_STATUSES.ACTIVE,
]);

export const normalizeEmail = (value = "") =>
  String(value || "").trim().toLowerCase();

export const normalizeOptionalString = (value) => {
  const normalized = String(value ?? "").trim();
  return normalized || null;
};

export const normalizeRole = (value) => {
  const role = String(value || "").trim().toUpperCase();
  return Object.values(USER_ROLES).includes(role) ? role : null;
};

export const normalizeStatus = (value) => {
  const status = String(value || "").trim().toUpperCase();
  return AGENT_STATUSES.has(status) ? status : null;
};

export const isAdminUser = (user) =>
  Boolean(user?.isAdmin || normalizeRole(user?.role) === USER_ROLES.ADMIN);

export const isActiveAgent = (user) =>
  normalizeRole(user?.role) === USER_ROLES.AGENT &&
  normalizeStatus(user?.status) === USER_STATUSES.ACTIVE;

export const serializeAccessUser = (user) => ({
  id: user.id,
  name: user.name || "",
  email: user.email,
  phone: user.phone || "",
  agencyName: user.agencyName || "",
  role: normalizeRole(user.role),
  status: normalizeStatus(user.status),
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});
