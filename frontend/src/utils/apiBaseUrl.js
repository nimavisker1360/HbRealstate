const trimValue = (value) =>
  typeof value === "string" ? value.trim() : "";

const LOCALHOST_API_PATTERN =
  /^https?:\/\/(?:localhost|127(?:\.\d{1,3}){3}|0\.0\.0\.0)(?::\d+)?(?:\/|$)/i;

const configuredApiUrl = trimValue(import.meta.env.VITE_API_URL);
const shouldUseRelativeApi =
  import.meta.env.PROD &&
  (!configuredApiUrl || LOCALHOST_API_PATTERN.test(configuredApiUrl));

export const API_BASE_URL = (
  shouldUseRelativeApi ? "/api" : configuredApiUrl || "/api"
).replace(/\/+$/, "");

