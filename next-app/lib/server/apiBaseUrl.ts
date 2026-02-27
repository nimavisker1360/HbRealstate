const trimTrailingSlashes = (value: string): string => value.replace(/\/+$/, "");

export function getServerApiBaseUrl(): string {
  const explicit =
    process.env.INTERNAL_API_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL;

  if (explicit) {
    return trimTrailingSlashes(String(explicit));
  }

  if (process.env.VERCEL_URL) {
    return `https://${trimTrailingSlashes(process.env.VERCEL_URL)}`;
  }

  return "http://localhost:3000";
}
