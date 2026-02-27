export const SITE_URL = "https://www.hbrealstate.com";
export const SUPPORTED_SEO_LANGS = ["en", "tr", "ru"];

export const DEFAULT_SEO = {
  title: "HB International Gayrimenkul",
  description:
    "Discover premium real estate investment opportunities in Istanbul, Antalya, and across Turkey with HB International Real Estate.",
  image: "/og-image.png",
  siteName: "HB International Gayrimenkul",
  twitterCard: "summary_large_image",
  locale: "en_US",
  localeAlternates: ["tr_TR", "ru_RU"],
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

export const resolvePropertyPath = (property) => {
  const slug = resolvePropertySlug(property);
  return slug ? `/listing/${encodeURIComponent(slug)}` : "/listing";
};

const pickText = (...values) => {
  for (const value of values) {
    if (value === null || value === undefined) continue;
    const normalized = String(value).trim();
    if (normalized) return normalized;
  }
  return "";
};

const buildProjectSlugBase = (property) => {
  const projectTitle = pickText(
    property?.projectName,
    property?.title,
    property?.name,
    "New Residential Project"
  );
  const slugBase = slugify(projectTitle);
  if (!slugBase) return "hb-real-estate-project";
  return slugBase.slice(0, 120).replace(/-+$/g, "");
};

export const resolveProjectPath = (property) => {
  const id = String(property?.id || "").trim();
  if (!id) return "/projects";
  const generatedSlugBase = buildProjectSlugBase(property);
  return `/projects/${encodeURIComponent(`${generatedSlugBase}-${id}`)}`;
};

export const extractObjectId = (value = "") => {
  const match = String(value || "").trim().match(/([a-f0-9]{24})$/i);
  return match ? match[1] : "";
};

export const resolveBlogIdentifier = (blog, options = {}) => {
  const preferSlug = Boolean(options?.preferSlug);
  const slug = String(blog?.slug || "").trim();
  const id = String(blog?.id || "").trim();
  return preferSlug ? slug || id : id || slug;
};

export const resolveBlogPath = (blog, options = {}) => {
  const identifier = resolveBlogIdentifier(blog, options);
  return identifier ? `/blog/${encodeURIComponent(identifier)}` : "/blogs";
};

export const slugify = (value = "") =>
  value
    .toString()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

export const resolveCountrySlug = (value = "") => {
  const normalized = slugify(value);
  if (normalized) return normalized;
  return encodeURIComponent(String(value || "").trim().toLowerCase()).toLowerCase();
};

export const buildLanguageAlternates = (
  pathOrUrl = "/",
  languages = SUPPORTED_SEO_LANGS
) => {
  const absolute = toAbsoluteUrl(pathOrUrl);
  let baseUrl;

  try {
    baseUrl = new URL(absolute);
  } catch (_error) {
    baseUrl = new URL(SITE_URL);
  }

  const alternates = [];
  const seen = new Set();

  languages.forEach((lang) => {
    if (!lang) return;
    const hrefLang = String(lang).toLowerCase();
    if (seen.has(hrefLang)) return;
    seen.add(hrefLang);

    const localized = new URL(baseUrl.toString());
    localized.searchParams.set("lang", hrefLang);
    alternates.push({ hrefLang, href: localized.toString() });
  });

  alternates.push({ hrefLang: "x-default", href: baseUrl.toString() });
  return alternates;
};
