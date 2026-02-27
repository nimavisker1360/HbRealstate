import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

interface PropertyEntry {
  id?: string;
  slug?: string;
  seoSlug?: string;
  updatedAt?: string;
}

interface SitemapUrl {
  path: string;
  lastmod?: string;
  changefreq?: "daily" | "weekly" | "monthly";
  priority?: string;
}

const SITE_URL = process.env.SITE_URL || "https://www.hbrealstate.com";
const rawApiBase =
  process.env.SITEMAP_API_URL ||
  process.env.VITE_API_URL ||
  `${SITE_URL}/api`;

const normalizeBaseUrl = (value: string) => {
  if (/^https?:\/\//i.test(value)) {
    return value.replace(/\/+$/, "");
  }
  const normalizedPath = value.startsWith("/") ? value : `/${value}`;
  return `${SITE_URL.replace(/\/+$/, "")}${normalizedPath}`.replace(/\/+$/, "");
};

const API_BASE = normalizeBaseUrl(rawApiBase);
const TODAY = new Date().toISOString().split("T")[0];

const staticPages: SitemapUrl[] = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/listing", changefreq: "daily", priority: "0.9" },
  { path: "/projects", changefreq: "weekly", priority: "0.8" },
  { path: "/istanbul-apartments", changefreq: "weekly", priority: "0.8" },
  { path: "/kyrenia-apartments", changefreq: "weekly", priority: "0.8" },
  { path: "/turkey-property-investment", changefreq: "weekly", priority: "0.8" },
  { path: "/turkish-citizenship-property", changefreq: "weekly", priority: "0.8" },
];

const toListingPath = (property: PropertyEntry): string | null => {
  const slug = property.slug || property.seoSlug;
  if (slug) {
    return `/listing/${encodeURIComponent(slug)}`;
  }
  if (property.id) {
    return `/listing/${property.id}`;
  }
  return null;
};

const fetchPropertyEntries = async (): Promise<PropertyEntry[]> => {
  try {
    const response = await fetch(`${API_BASE}/residency/allresd`, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`Unexpected status ${response.status}`);
    }

    const data = (await response.json()) as PropertyEntry[];
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.warn(
      `[sitemap] Failed to fetch properties from ${API_BASE}/residency/allresd. Continuing with static URLs only.`
    );
    return [];
  }
};

const xmlEscape = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");

const toUrlNode = (url: SitemapUrl) => {
  const loc = `${SITE_URL.replace(/\/+$/, "")}${url.path}`;
  const lines = [
    "  <url>",
    `    <loc>${xmlEscape(loc)}</loc>`,
    `    <lastmod>${url.lastmod || TODAY}</lastmod>`,
  ];

  if (url.changefreq) {
    lines.push(`    <changefreq>${url.changefreq}</changefreq>`);
  }
  if (url.priority) {
    lines.push(`    <priority>${url.priority}</priority>`);
  }

  lines.push("  </url>");
  return lines.join("\n");
};

const main = async () => {
  const properties = await fetchPropertyEntries();
  const dynamicPages: SitemapUrl[] = properties
    .map((property) => {
      const listingPath = toListingPath(property);
      if (!listingPath) return null;
      return {
        path: listingPath,
        lastmod: property.updatedAt
          ? new Date(property.updatedAt).toISOString().split("T")[0]
          : TODAY,
        changefreq: "daily",
        priority: "0.7",
      } as SitemapUrl;
    })
    .filter((item): item is SitemapUrl => Boolean(item));

  const unique = new Map<string, SitemapUrl>();
  [...staticPages, ...dynamicPages].forEach((item) => {
    unique.set(item.path, item);
  });

  const urlset = Array.from(unique.values()).map(toUrlNode).join("\n");
  const sitemap = `<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n${urlset}\n</urlset>\n`;

  const outputDir = path.join(process.cwd(), "public");
  const outputPath = path.join(outputDir, "sitemap.xml");

  await mkdir(outputDir, { recursive: true });
  await writeFile(outputPath, sitemap, "utf8");

  console.log(
    `[sitemap] Generated ${outputPath} with ${unique.size} URLs (${staticPages.length} static, ${dynamicPages.length} dynamic).`
  );
};

main().catch((error) => {
  console.error("[sitemap] Failed to generate sitemap:", error);
  process.exit(1);
});
