import type { ListingFilters } from "../types/property";
import { DEFAULT_LIMIT, DEFAULT_PAGE } from "./listingParams";

export const getSiteUrl = (): string => {
  const rawInput = String(
    process.env.NEXT_PUBLIC_SITE_URL || "https://example.com",
  ).trim();
  const normalized = rawInput
    .replace(/^['"]+|['"]+$/g, "")
    .split(/[,\s]/)
    .find(Boolean) || "https://example.com";
  const withProtocol = /^https?:\/\//i.test(normalized)
    ? normalized
    : `https://${normalized}`;
  return withProtocol.replace(/\/+$/, "");
};

export const slugifySegment = (value: string): string =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "")
    .replace(/-{2,}/g, "-");

export const titleFromSlug = (slug: string): string =>
  slug
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

export const buildListingSeoText = (
  filters: ListingFilters,
): {
  title: string;
  description: string;
  heading: string;
} => {
  const cityPart = filters.city ? ` in ${filters.city}` : "";
  const statusPart = filters.status ? ` (${filters.status})` : "";

  const title = `Properties${cityPart}${statusPart} | Advanced Real Estate Search`;
  const heading = filters.city
    ? `Properties in ${filters.city}`
    : "Advanced Real Estate Search";

  const description = filters.city
    ? `Browse verified properties in ${filters.city}. Filter by price, rooms, sea view, installment plans, citizenship eligibility, and ROI.`
    : "Browse verified global real estate listings with advanced filters for price, rooms, status, sea view, installment plans, and citizenship eligibility.";

  return { title, description, heading };
};

export const buildCanonicalListingUrl = (
  queryString: string,
  pathname = "/listing",
): string => {
  const siteUrl = getSiteUrl();
  const params = new URLSearchParams(queryString);

  if (params.get("page") === "1") {
    params.delete("page");
  }

  const normalized = params.toString();
  return normalized
    ? `${siteUrl}${pathname}?${normalized}`
    : `${siteUrl}${pathname}`;
};

export const buildCityCanonicalUrl = (city: string): string =>
  `${getSiteUrl()}/city/${slugifySegment(city)}`;

export const buildTypeCanonicalUrl = (propertyType: string): string =>
  `${getSiteUrl()}/type/${slugifySegment(propertyType)}`;

export const buildPropertyCanonicalUrl = (slug: string): string =>
  `${getSiteUrl()}/property/${encodeURIComponent(slug)}`;

export const shouldIndexListingPage = (filters: ListingFilters): boolean => {
  const hasLowValueFilters =
    typeof filters.minPrice === "number" ||
    typeof filters.maxPrice === "number" ||
    typeof filters.minRooms === "number" ||
    typeof filters.minRoi === "number" ||
    typeof filters.seaView === "boolean" ||
    typeof filters.installmentAvailable === "boolean" ||
    typeof filters.citizenshipEligible === "boolean";

  if (hasLowValueFilters) return false;

  if ((filters.sort ?? "newest") !== "newest") return false;
  if ((filters.page ?? DEFAULT_PAGE) > DEFAULT_PAGE) return false;
  if ((filters.limit ?? DEFAULT_LIMIT) !== DEFAULT_LIMIT) return false;
  if ((filters.propertyType?.length ?? 0) > 1) return false;

  return true;
};
