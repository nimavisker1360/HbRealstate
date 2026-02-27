const trimTrailingSlashes = (value: string): string => value.replace(/\/+$/, "");

const normalizeBaseUrl = (value: string): string => {
  const raw = String(value || "")
    .trim()
    .replace(/^['"]+|['"]+$/g, "");
  const firstToken = raw.split(/[,\s]/).find(Boolean) || "";
  if (!firstToken) return "";
  const withProtocol = /^https?:\/\//i.test(firstToken)
    ? firstToken
    : `https://${firstToken}`;
  return trimTrailingSlashes(withProtocol);
};

export function getServerApiBaseUrl(): string {
  const explicit = normalizeBaseUrl(
    process.env.INTERNAL_API_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || "",
  );

  if (explicit) {
    return explicit;
  }

  if (process.env.VERCEL_URL) {
    return normalizeBaseUrl(process.env.VERCEL_URL);
  }

  return "http://localhost:3000";
}
