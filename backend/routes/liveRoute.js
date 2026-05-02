import express from "express";
import { createHmac } from "node:crypto";
import jwtCheck from "../config/authOConfig.js";

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

export { router as liveRoute };
