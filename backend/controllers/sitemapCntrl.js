import asyncHandler from "express-async-handler";
import { getMongoDb } from "../config/prismaConfig.js";

const DEFAULT_CANONICAL_ORIGIN = "https://www.hbrealstate.com";
const STATIC_PATHS = [
  "/",
  "/listing",
  "/projects",
  "/blogs",
  "/consultants",
  "/addresses",
  "/today",
];

const normalizeOrigin = (value) => {
  const raw = String(value || DEFAULT_CANONICAL_ORIGIN).trim();
  if (!raw) return DEFAULT_CANONICAL_ORIGIN;
  return raw.replace(/\/+$/, "");
};

const normalizeIdentifier = (value) =>
  String(value || "")
    .trim()
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");

const encodePathSegment = (value) => encodeURIComponent(value);

const slugify = (value) =>
  String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");

const resolveLastModified = (...candidates) => {
  for (const value of candidates) {
    if (!value) continue;
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date.toISOString();
  }
  return new Date().toISOString();
};

const escapeXml = (value) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const isProjectProperty = (propertyType) =>
  propertyType === "local-project" || propertyType === "international-project";

const toPropertyPath = (residency) => {
  const id = normalizeIdentifier(residency?._id);
  const explicitSlug = normalizeIdentifier(residency?.slug);
  const slugFromTitle = slugify(residency?.title);
  const fallbackSlug = slugFromTitle && id ? `${slugFromTitle}-${id}` : "";
  const identifier = explicitSlug || fallbackSlug || id;
  if (!identifier) return null;

  const prefix = isProjectProperty(residency?.propertyType)
    ? "/projects/"
    : "/listing/";

  return `${prefix}${encodePathSegment(identifier)}`;
};

const buildSitemapXml = (urls) => {
  const rows = urls
    .map(
      ({ loc, lastModified }) =>
        `  <url>\n    <loc>${escapeXml(loc)}</loc>\n    <lastmod>${escapeXml(
          lastModified
        )}</lastmod>\n  </url>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows}\n</urlset>\n`;
};

export const getSitemapXml = asyncHandler(async (_req, res) => {
  const origin = normalizeOrigin(
    process.env.CANONICAL_BASE_URL || process.env.SITEMAP_BASE_URL
  );
  const generatedAt = new Date().toISOString();

  const staticUrls = STATIC_PATHS.map((path) => ({
    loc: `${origin}${path}`,
    lastModified: generatedAt,
  }));

  let propertyUrls = [];

  try {
    const db = await getMongoDb();
    const residencies = await db
      .collection("Residency")
      .find(
        {},
        {
          projection: {
            _id: 1,
            slug: 1,
            title: 1,
            propertyType: 1,
            updatedAt: 1,
            createdAt: 1,
          },
        }
      )
      .toArray();

    propertyUrls = residencies
      .map((residency) => {
        const path = toPropertyPath(residency);
        if (!path) return null;
        return {
          loc: `${origin}${path}`,
          lastModified: resolveLastModified(
            residency?.updatedAt,
            residency?.createdAt,
            generatedAt
          ),
        };
      })
      .filter(Boolean);
  } catch (error) {
    // Keep sitemap available even if the database is temporarily unreachable.
    console.error("[sitemap] failed to fetch residency URLs:", error.message);
  }

  const uniqueByLoc = new Map();
  for (const item of [...staticUrls, ...propertyUrls]) {
    if (!item?.loc) continue;
    if (!uniqueByLoc.has(item.loc)) uniqueByLoc.set(item.loc, item);
  }

  const xml = buildSitemapXml([...uniqueByLoc.values()]);

  res.set("Content-Type", "application/xml; charset=utf-8");
  res.set(
    "Cache-Control",
    "public, max-age=0, s-maxage=600, stale-while-revalidate=86400"
  );
  res.status(200).send(xml);
});
