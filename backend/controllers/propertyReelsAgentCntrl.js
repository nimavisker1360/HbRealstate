import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import asyncHandler from "express-async-handler";
import { prisma } from "../config/prismaConfig.js";
import {
  getGmailSender,
  getGmailTransporter,
  getPasswordEmailSender,
  getPasswordEmailTransporter,
} from "../utils/gmailTransporter.js";
import {
  ADMIN_CREATABLE_AGENT_STATUSES,
  AGENT_STATUSES,
  USER_ROLES,
  USER_STATUSES,
  isActiveAgent,
  isAdminUser,
  normalizeEmail,
  normalizeOptionalString,
  normalizeStatus,
  serializeAccessUser,
} from "../utils/userAccess.js";

const hashPassword = (password) => {
  const normalized = String(password || "");
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(normalized, salt, 64).toString("hex");

  return `scrypt:${salt}:${derivedKey}`;
};

export const verifyPropertyReelsPassword = (password, storedHash = "") => {
  const [algorithm, salt, hash] = String(storedHash || "").split(":");

  if (algorithm !== "scrypt" || !salt || !hash) {
    return false;
  }

  const expected = Buffer.from(hash, "hex");
  const actual = scryptSync(String(password || ""), salt, 64);

  return expected.length === actual.length && timingSafeEqual(expected, actual);
};

const base64UrlJson = (value) =>
  Buffer.from(JSON.stringify(value)).toString("base64url");

const signAgentJwt = (payload, secret) => {
  const now = Math.floor(Date.now() / 1000);
  const header = {
    alg: "HS256",
    typ: "JWT",
  };
  const body = {
    ...payload,
    iat: now,
    exp: now + 8 * 60 * 60,
  };
  const encodedToken = `${base64UrlJson(header)}.${base64UrlJson(body)}`;
  const signature = createHmac("sha256", secret)
    .update(encodedToken)
    .digest("base64url");

  return `${encodedToken}.${signature}`;
};

const verifyAgentJwt = (token, secret) => {
  const parts = String(token || "").split(".");
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedPayload, signature] = parts;
  const signedPart = `${encodedHeader}.${encodedPayload}`;
  const expected = createHmac("sha256", secret)
    .update(signedPart)
    .digest("base64url");

  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(signature);
  if (
    expectedBuffer.length !== actualBuffer.length ||
    !timingSafeEqual(expectedBuffer, actualBuffer)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8")
    );
    if (!payload?.exp || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload;
  } catch (_error) {
    return null;
  }
};

const getAgentSecret = () =>
  process.env.PROPERTY_REELS_AGENT_SECRET ||
  process.env.HB_SSO_SECRET ||
  process.env.LIVE_AUTH_SECRET;

const getLiveLoginLink = () =>
  process.env.PROPERTY_REELS_LOGIN_URL ||
  process.env.LIVE_AGENT_LOGIN_URL ||
  "https://live.hbrealstate.com/login";

const getInviteTransporters = () => {
  const transporters = [];

  try {
    transporters.push({
      from: getGmailSender(),
      name: "gmail_oauth",
      transporter: getGmailTransporter(),
    });
  } catch (error) {
    console.warn(
      "Property Reels Gmail OAuth transporter unavailable:",
      error?.message || error
    );
  }

  try {
    transporters.push({
      from: getPasswordEmailSender(),
      name: "gmail_password",
      transporter: getPasswordEmailTransporter(),
    });
  } catch (error) {
    console.warn(
      "Property Reels password email transporter unavailable:",
      error?.message || error
    );
  }

  return transporters;
};

const sendAgentInviteEmail = async ({ user, temporaryPassword }) => {
  if (!user?.email || !temporaryPassword) {
    return { sent: false, reason: "missing_invite_data" };
  }

  const loginLink = getLiveLoginLink();
  const name = user.name || "Agent";
  const mail = {
      to: user.email,
      subject: "Your HB Property Reels live access",
      text: [
        `Hello ${name},`,
        "",
        "Your HB Property Reels agent access has been created.",
        `Login: ${loginLink}`,
        `Email: ${user.email}`,
        `Temporary code: ${temporaryPassword}`,
        "",
        "Please sign in and keep this code secure.",
      ].join("\n"),
      html: `
        <div style="font-family:Arial,sans-serif;color:#111827;line-height:1.6">
          <p>Hello ${name},</p>
          <p>Your HB Property Reels agent access has been created.</p>
          <p><strong>Login:</strong> <a href="${loginLink}">${loginLink}</a></p>
          <p><strong>Email:</strong> ${user.email}</p>
          <p><strong>Temporary code:</strong> <code style="font-size:16px">${temporaryPassword}</code></p>
          <p>Please sign in and keep this code secure.</p>
        </div>
      `,
  };

  const transporters = getInviteTransporters();
  if (transporters.length === 0) {
    return { sent: false, reason: "email_not_configured" };
  }

  let lastError = null;
  for (const option of transporters) {
    try {
      await option.transporter.sendMail({
        ...mail,
        from: option.from,
      });

      return { sent: true, provider: option.name };
    } catch (error) {
      lastError = error;
      console.error(
        `Property Reels invite email failed via ${option.name}:`,
        error?.message || error
      );
    }
  }

  return {
    sent: false,
    reason: lastError?.message || "email_send_failed",
  };
};

const agentSelect = {
  agencyName: true,
  createdAt: true,
  email: true,
  id: true,
  name: true,
  passwordHash: true,
  phone: true,
  role: true,
  status: true,
  updatedAt: true,
};

const publicAgentSelect = {
  agencyName: true,
  createdAt: true,
  email: true,
  id: true,
  name: true,
  phone: true,
  role: true,
  status: true,
  updatedAt: true,
};

const serializeAgent = (user) => ({
  ...serializeAccessUser(user),
  role: USER_ROLES.AGENT,
  status: normalizeStatus(user.status) || USER_STATUSES.PENDING,
});

const validateCreatePayload = (payload = {}) => {
  const email = normalizeEmail(payload.email);
  const name = normalizeOptionalString(payload.name);
  const status = normalizeStatus(payload.status) || USER_STATUSES.PENDING;

  if (!name) {
    return { error: "Name is required." };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "A valid email is required." };
  }

  if (!ADMIN_CREATABLE_AGENT_STATUSES.has(status)) {
    return { error: "Create status must be ACTIVE or PENDING." };
  }

  if (String(payload.temporaryPassword || "").length < 8) {
    return { error: "Temporary password must be at least 8 characters." };
  }

  return {
    data: {
      agencyName: normalizeOptionalString(payload.agencyName),
      email,
      name,
      passwordHash: hashPassword(payload.temporaryPassword),
      phone: normalizeOptionalString(payload.phone),
      status,
    },
  };
};

const validateUpdatePayload = (payload = {}) => {
  const data = {};

  if ("name" in payload) {
    const name = normalizeOptionalString(payload.name);
    if (!name) return { error: "Name is required." };
    data.name = name;
  }

  if ("phone" in payload) {
    data.phone = normalizeOptionalString(payload.phone);
  }

  if ("agencyName" in payload) {
    data.agencyName = normalizeOptionalString(payload.agencyName);
  }

  if ("status" in payload) {
    const status = normalizeStatus(payload.status);
    if (!AGENT_STATUSES.has(status)) {
      return { error: "Invalid agent status." };
    }
    data.status = status;
  }

  if (payload.temporaryPassword) {
    if (String(payload.temporaryPassword).length < 8) {
      return { error: "Temporary password must be at least 8 characters." };
    }

    data.passwordHash = hashPassword(payload.temporaryPassword);
  }

  return { data };
};

export const listPropertyReelsAgents = asyncHandler(async (_req, res) => {
  const users = await prisma.user.findMany({
    where: { role: USER_ROLES.AGENT },
    orderBy: { createdAt: "desc" },
    select: publicAgentSelect,
  });

  return res.status(200).json({
    agents: users.map(serializeAgent),
    totalAgents: users.length,
  });
});

export const createPropertyReelsAgent = asyncHandler(async (req, res) => {
  const validation = validateCreatePayload(req.body || {});

  if (validation.error) {
    return res.status(400).json({ message: validation.error });
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: validation.data.email },
    select: { id: true, isAdmin: true, role: true },
  });

  if (isAdminUser(existingUser)) {
    return res.status(409).json({ message: "Admin users cannot be agents." });
  }

  const user = existingUser
    ? await prisma.user.update({
        where: { email: validation.data.email },
        data: {
          ...validation.data,
          isAdmin: false,
          role: USER_ROLES.AGENT,
        },
        select: publicAgentSelect,
      })
    : await prisma.user.create({
        data: {
          ...validation.data,
          address: null,
          bookedVisits: [],
          favResidenciesID: [],
          image: null,
          isAdmin: false,
          profileComplete: false,
          role: USER_ROLES.AGENT,
        },
        select: publicAgentSelect,
      });

  const inviteEmail = req.body?.sendInvite
    ? await sendAgentInviteEmail({
        user,
        temporaryPassword: req.body.temporaryPassword,
      })
    : { sent: false, reason: "not_requested" };

  return res.status(201).json({
    agent: serializeAgent(user),
    inviteEmail,
    message: existingUser
      ? "Existing user converted to Property Reels agent."
      : "Property Reels agent created.",
  });
});

export const updatePropertyReelsAgent = asyncHandler(async (req, res) => {
  const { agentId } = req.params;
  const validation = validateUpdatePayload(req.body || {});

  if (validation.error) {
    return res.status(400).json({ message: validation.error });
  }

  const existingUser = await prisma.user.findFirst({
    where: { id: agentId, role: USER_ROLES.AGENT },
    select: { id: true },
  });

  if (!existingUser) {
    return res.status(404).json({ message: "Agent not found." });
  }

  const user = await prisma.user.update({
    where: { id: agentId },
    data: {
      ...validation.data,
      isAdmin: false,
      role: USER_ROLES.AGENT,
    },
    select: publicAgentSelect,
  });

  const inviteEmail =
    req.body?.sendInvite && req.body?.temporaryPassword
      ? await sendAgentInviteEmail({
          user,
          temporaryPassword: req.body.temporaryPassword,
        })
      : { sent: false, reason: "not_requested" };

  return res.status(200).json({
    agent: serializeAgent(user),
    inviteEmail,
    message: "Property Reels agent updated.",
  });
});

export const loginPropertyReelsAgent = asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const password = String(req.body?.password || "");

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  const secret = getAgentSecret();
  if (!secret) {
    return res.status(500).json({
      message:
        "PROPERTY_REELS_AGENT_SECRET, HB_SSO_SECRET, or LIVE_AUTH_SECRET must be configured.",
    });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: agentSelect,
  });

  if (
    !user ||
    !isActiveAgent(user) ||
    !user.passwordHash ||
    !verifyPropertyReelsPassword(password, user.passwordHash)
  ) {
    return res.status(401).json({ message: "Invalid agent credentials." });
  }

  const agent = serializeAgent(user);
  const token = signAgentJwt(
    {
      sub: user.id,
      email: user.email,
      name: user.name || "",
      agencyName: user.agencyName || "",
      role: USER_ROLES.AGENT,
      status: USER_STATUSES.ACTIVE,
    },
    secret
  );

  return res.status(200).json({ agent, token });
});

export const getPropertyReelsAgentSession = asyncHandler(async (req, res) => {
  const secret = getAgentSecret();
  if (!secret) {
    return res.status(500).json({
      message:
        "PROPERTY_REELS_AGENT_SECRET, HB_SSO_SECRET, or LIVE_AUTH_SECRET must be configured.",
    });
  }

  const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  const payload = verifyAgentJwt(token, secret);

  if (!payload?.email) {
    return res.status(401).json({ message: "Invalid agent session." });
  }

  const user = await prisma.user.findUnique({
    where: { email: normalizeEmail(payload.email) },
    select: agentSelect,
  });

  if (!user || !isActiveAgent(user)) {
    return res.status(401).json({ message: "Agent is not active." });
  }

  return res.status(200).json({ agent: serializeAgent(user) });
});
