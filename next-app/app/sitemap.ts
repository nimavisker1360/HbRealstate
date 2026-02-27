import type { MetadataRoute } from "next";
import {
  getAllMappedProperties,
  getAvailableCities,
  getAvailablePropertyTypes,
} from "../lib/server/getProperties";
import { getSiteUrl } from "../lib/seo";
import { slugifySegment } from "../lib/seo";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const now = new Date();
  const items: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl}/listing`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/city`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.85,
    },
    {
      url: `${siteUrl}/type`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
  ];

  try {
    const [properties, cities, propertyTypes] = await Promise.all([
      getAllMappedProperties(),
      getAvailableCities(),
      getAvailablePropertyTypes(),
    ]);

    for (const city of cities) {
      items.push({
        url: `${siteUrl}/city/${slugifySegment(city)}`,
        lastModified: now,
        changeFrequency: "daily",
        priority: 0.8,
      });
    }

    for (const propertyType of propertyTypes) {
      items.push({
        url: `${siteUrl}/type/${slugifySegment(propertyType)}`,
        lastModified: now,
        changeFrequency: "daily",
        priority: 0.75,
      });
    }

    for (const property of properties) {
      items.push({
        url: `${siteUrl}/property/${encodeURIComponent(property.slug)}`,
        lastModified: new Date(property.createdAt),
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  } catch (_error) {
    // Fallback to static core URLs when API data is unavailable.
  }

  return items;
}
