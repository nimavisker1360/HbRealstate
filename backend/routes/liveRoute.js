import express from "express";
import { createHmac } from "node:crypto";
import jwtCheck from "../config/authOConfig.js";
import { prisma } from "../config/prismaConfig.js";
import { getAuthenticatedEmail } from "../middleware/requireAdminUser.js";
import { USER_ROLES, isActiveAgent, isAdminUser } from "../utils/userAccess.js";

const router = express.Router();

const base64UrlJson = (value) =>
  Buffer.from(JSON.stringify(value)).toString("base64url");

const signLiveJwt = (payload, secret) => {
  const now = Math.floor(Date.now() / 1000);
  const header = {
    alg: "HS256",
    typ: "JWT",
  };
  const body = {
    ...payload,
    iat: now,
    exp: now + 15 * 60,
  };
  const encodedToken = `${base64UrlJson(header)}.${base64UrlJson(body)}`;
  const signature = createHmac("sha256", secret)
    .update(encodedToken)
    .digest("base64url");

  return `${encodedToken}.${signature}`;
};

const resolveSsoRole = ({ email, persistedUser }) => {
  if (isAdminUser(persistedUser)) {
    return USER_ROLES.ADMIN;
  }

  if (email && isActiveAgent(persistedUser)) {
    return USER_ROLES.AGENT;
  }

  return "BUYER";
};

router.get("/token", jwtCheck, (req, res) => {
  const user = req?.auth?.payload;

  if (!user?.sub) {
    return res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
  }

  const secret = process.env.LIVE_AUTH_SECRET;
  if (!secret) {
    return res.status(500).json({
      success: false,
      message: "LIVE_AUTH_SECRET is not configured.",
    });
  }

  const token = signLiveJwt(
    {
      auth0Id: user.sub,
      email: user.email ?? null,
      name: user.name ?? null,
      picture: user.picture ?? null,
    },
    secret
  );

  return res.json({ token });
});

router.get("/sso-token", jwtCheck, async (req, res) => {
  const user = req?.auth?.payload;

  if (!user?.sub) {
    return res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
  }

  const secret = process.env.HB_SSO_SECRET;
  if (!secret) {
    return res.status(500).json({
      success: false,
      message: "HB_SSO_SECRET is not configured.",
    });
  }

  const email = getAuthenticatedEmail(req);
  const persistedUser = email
    ? await prisma.user.findUnique({
        where: { email },
        select: { isAdmin: true, role: true, status: true },
      })
    : null;

  const token = signLiveJwt(
    {
      sub: user.sub,
      email: email || user.email || null,
      name: user.name ?? null,
      role: resolveSsoRole({ email, persistedUser }),
    },
    secret
  );

  return res.json({ token });
});

export { router as liveRoute };
