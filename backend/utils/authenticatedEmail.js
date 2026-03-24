export const normalizeEmail = (value = "") =>
  String(value || "").trim().toLowerCase();

const AUTH_EMAIL_CLAIMS = [
  "email",
  "https://hbrealstate.com/email",
  "https://www.hbrealstate.com/email",
];

const ADMIN_EMAIL_ENV_KEYS = [
  "ADMIN_EMAILS",
  "ADMIN_EMAIL",
  "ADMIN_USER_EMAIL",
];

export const getAuthenticatedEmail = (req) => {
  const payload = req?.auth?.payload;
  if (!payload || typeof payload !== "object") return "";

  for (const claimKey of AUTH_EMAIL_CLAIMS) {
    const normalized = normalizeEmail(payload[claimKey]);
    if (normalized) return normalized;
  }

  return "";
};

export const resolveRequestEmail = (req) => {
  const authenticatedEmail = getAuthenticatedEmail(req);
  if (authenticatedEmail) return authenticatedEmail;

  const candidates = [
    req?.body?.email,
    req?.params?.email,
    req?.query?.email,
  ];

  for (const value of candidates) {
    const normalized = normalizeEmail(value);
    if (normalized) return normalized;
  }

  return "";
};

const getConfiguredAdminEmailSet = () => {
  const rawValue = ADMIN_EMAIL_ENV_KEYS.map((key) => process.env[key] || "")
    .join(",")
    .trim();

  if (!rawValue) {
    return new Set();
  }

  return new Set(
    rawValue
      .split(/[,\s;]+/)
      .map((value) => normalizeEmail(value))
      .filter(Boolean)
  );
};

export const isConfiguredAdminEmail = (value = "") =>
  getConfiguredAdminEmailSet().has(normalizeEmail(value));

export const buildUserCreateData = (payload = {}) => {
  const email = normalizeEmail(payload.email);
  const explicitAdminFlag =
    typeof payload.isAdmin === "boolean" ? payload.isAdmin : undefined;

  return {
    email,
    name: payload.name || null,
    image: payload.image || null,
    phone: payload.phone || null,
    address: payload.address || null,
    bookedVisits: [],
    favResidenciesID: [],
    ...(explicitAdminFlag !== undefined
      ? { isAdmin: explicitAdminFlag }
      : isConfiguredAdminEmail(email)
        ? { isAdmin: true }
        : {}),
  };
};
