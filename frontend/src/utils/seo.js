export const SITE_URL = "https://www.hbrealstate.com";

export const DEFAULT_SEO = {
  title: "HB International Gayrimenkul",
  description:
    "Discover premium real estate investment opportunities in Istanbul, Antalya, and across Turkey with HB International Real Estate.",
  image: "/og-image.png",
  siteName: "HB International Gayrimenkul",
  twitterCard: "summary_large_image",
};

export const toAbsoluteUrl = (value = "/") => {
  try {
    if (!value) return SITE_URL;
    return new URL(value, SITE_URL).toString();
  } catch (_error) {
    return SITE_URL;
  }
};

export const stripHtml = (value) =>
  String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const truncateText = (value, maxLength = 160) => {
  const normalized = stripHtml(value);
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 3).trim()}...`;
};

export const resolvePropertySlug = (property) =>
  property?.slug || property?.seoSlug || property?.id || "";
