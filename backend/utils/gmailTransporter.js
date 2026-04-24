import nodemailer from "nodemailer";

const REQUIRED_GMAIL_ENV_VARS = [
  "GMAIL_USER",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GOOGLE_REFRESH_TOKEN",
];

let cachedTransporter = null;

const readEnv = (key) => {
  const value = process.env[key];
  return typeof value === "string" ? value.trim() : "";
};

export const getMissingGmailEnvVars = () =>
  REQUIRED_GMAIL_ENV_VARS.filter((key) => !readEnv(key));

export const isGmailOauthConfigured = () =>
  getMissingGmailEnvVars().length === 0;

export const getGmailSender = () => readEnv("GMAIL_USER");

export const createGmailTransporter = () =>
  nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: getGmailSender(),
      clientId: readEnv("GOOGLE_CLIENT_ID"),
      clientSecret: readEnv("GOOGLE_CLIENT_SECRET"),
      refreshToken: readEnv("GOOGLE_REFRESH_TOKEN"),
    },
  });

export const getGmailTransporter = () => {
  const missingEnvVars = getMissingGmailEnvVars();
  if (missingEnvVars.length > 0) {
    throw new Error(
      `Missing Gmail OAuth environment variables: ${missingEnvVars.join(", ")}`
    );
  }

  if (!cachedTransporter) {
    cachedTransporter = createGmailTransporter();
  }

  return cachedTransporter;
};
