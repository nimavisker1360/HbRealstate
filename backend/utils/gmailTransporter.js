import nodemailer from "nodemailer";

const REQUIRED_GMAIL_ENV_VARS = [
  "GMAIL_USER",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GOOGLE_REFRESH_TOKEN",
];
const REQUIRED_PASSWORD_ENV_VARS = ["EMAIL_USER", "EMAIL_PASS"];

let cachedTransporter = null;
let cachedPasswordTransporter = null;

const readEnv = (key) => {
  const value = process.env[key];
  return typeof value === "string" ? value.trim() : "";
};

export const getMissingGmailEnvVars = () =>
  REQUIRED_GMAIL_ENV_VARS.filter((key) => !readEnv(key));

export const isGmailOauthConfigured = () =>
  getMissingGmailEnvVars().length === 0;

export const getMissingPasswordEnvVars = () =>
  REQUIRED_PASSWORD_ENV_VARS.filter((key) => !readEnv(key));

export const isEmailPasswordConfigured = () =>
  getMissingPasswordEnvVars().length === 0;

export const getGmailSender = () => readEnv("GMAIL_USER") || readEnv("EMAIL_USER");

export const getPasswordEmailSender = () => readEnv("EMAIL_USER");

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

export const createPasswordEmailTransporter = () =>
  nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: getPasswordEmailSender(),
      pass: readEnv("EMAIL_PASS"),
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

export const getPasswordEmailTransporter = () => {
  const missingEnvVars = getMissingPasswordEnvVars();
  if (missingEnvVars.length > 0) {
    throw new Error(
      `Missing password email environment variables: ${missingEnvVars.join(", ")}`
    );
  }

  if (!cachedPasswordTransporter) {
    cachedPasswordTransporter = createPasswordEmailTransporter();
  }

  return cachedPasswordTransporter;
};
