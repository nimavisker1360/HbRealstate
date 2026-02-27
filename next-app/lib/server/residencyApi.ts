import { cache } from "react";
import {
  PROPERTY_TYPES,
  type ListingFilters,
  type PropertiesApiResponse,
  type PropertyItem,
  type PropertyStatus,
  type PropertyType,
  type PropertyUse,
} from "../../types/property";
import { DEFAULT_LIMIT, DEFAULT_PAGE, MAX_LIMIT } from "../listingParams";
import { slugifySegment } from "../seo";
import { getServerApiBaseUrl } from "./apiBaseUrl";

interface ResidencyAddressDetails {
  city?: string;
  district?: string;
  neighborhood?: string;
}

interface ResidencyFacilities {
  bedrooms?: number | string;
  bathrooms?: number | string;
  area?: number | string;
}

interface ResidencySpecialOffer {
  installmentMonths?: number | string;
  title?: string;
  description?: string;
}

interface ResidencyProjectInfo {
  specialOffers?: ResidencySpecialOffer[];
}

interface ResidencyApiItem {
  id?: string;
  _id?: string;
  slug?: string | null;
  title?: string;
  description?: string;
  price?: number | string;
  currency?: string;
  address?: string;
  addressDetails?: ResidencyAddressDetails;
  city?: string;
  country?: string;
  image?: string | null;
  images?: string[];
  propertyType?: string;
  category?: string;
  listingStatus?: string;
  projectStatus?: string;
  usageStatus?: string;
  rooms?: string;
  bathrooms?: number | string;
  facilities?: ResidencyFacilities;
  area?: { gross?: number | string; net?: number | string } | number | string;
  projeHakkinda?: ResidencyProjectInfo;
  installmentAvailable?: boolean;
  citizenshipEligible?: boolean;
  seaView?: boolean;
  roiPercent?: number | string;
  interiorFeatures?: string[];
  exteriorFeatures?: string[];
  muhitFeatures?: string[];
  manzaraFeatures?: string[];
  createdAt?: string;
  updatedAt?: string;
}

const SEA_VIEW_KEYWORDS = [
  "sea view",
  "deniz manzara",
  "denize sifir",
  "denize yakin",
  "ocean view",
  "waterfront",
  "marina view",
];

const INSTALLMENT_KEYWORDS = [
  "installment",
  "payment plan",
  "taksit",
  "down payment",
];

const CITIZENSHIP_KEYWORDS = [
  "citizenship eligible",
  "turkish citizenship",
  "vatandaslik",
  "passport",
];

const READY_KEYWORDS = [
  "ready",
  "move in",
  "completed",
  "tamamlandi",
  "teslime hazir",
];

const OFFPLAN_KEYWORDS = [
  "off plan",
  "off-plan",
  "offplan",
  "under construction",
  "insaat halinde",
  "devam ediyor",
];

const CATEGORY_TO_TYPE: Record<string, PropertyType> = {
  residential: "residential",
  villa: "villa",
  commercial: "commercial",
  land: "land",
  building: "building",
  timeshare: "timeshare",
  touristfacility: "touristFacility",
  "tourist-facility": "touristFacility",
  residentialprojects: "residentialProjects",
  "residential-projects": "residentialProjects",
};

const TYPE_SET = new Set<PropertyType>(PROPERTY_TYPES);

const normalizeText = (value: unknown): string =>
  String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const includesAnyKeyword = (text: string, keywords: string[]): boolean =>
  keywords.some((keyword) => text.includes(keyword));

const asArray = <T>(value: T[] | undefined): T[] => (Array.isArray(value) ? value : []);

const parseNumber = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseNonNegativeNumber = (value: unknown, fallback = 0): number => {
  const parsed = parseNumber(value);
  if (parsed === null || parsed < 0) return fallback;
  return parsed;
};

const parseRoomCount = (rawRooms: unknown, facilities: ResidencyFacilities | undefined): number => {
  const facilityBedrooms = parseNumber(facilities?.bedrooms);
  if (facilityBedrooms !== null && facilityBedrooms >= 0) {
    return Math.floor(facilityBedrooms);
  }

  const roomsText = String(rawRooms || "");
  const match = roomsText.match(/(\d+)/);
  if (!match) return 0;
  const parsed = Number.parseInt(match[1], 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
};

const parseBathrooms = (
  rawBathrooms: unknown,
  facilities: ResidencyFacilities | undefined,
): number => {
  const explicit = parseNumber(rawBathrooms);
  if (explicit !== null && explicit >= 0) return Math.floor(explicit);

  const facilityBathrooms = parseNumber(facilities?.bathrooms);
  if (facilityBathrooms !== null && facilityBathrooms >= 0) {
    return Math.floor(facilityBathrooms);
  }

  return 0;
};

const parseAreaM2 = (
  rawArea: ResidencyApiItem["area"],
  facilities: ResidencyFacilities | undefined,
): number => {
  if (rawArea && typeof rawArea === "object" && !Array.isArray(rawArea)) {
    const gross = parseNumber(rawArea.gross);
    if (gross !== null && gross > 0) return gross;
    const net = parseNumber(rawArea.net);
    if (net !== null && net > 0) return net;
  }

  const explicitArea = parseNumber(rawArea);
  if (explicitArea !== null && explicitArea > 0) return explicitArea;

  const facilityArea = parseNumber(facilities?.area);
  if (facilityArea !== null && facilityArea > 0) return facilityArea;

  return 0;
};

const toIsoDate = (value: unknown): string => {
  const date = new Date(String(value || ""));
  if (Number.isNaN(date.getTime())) return new Date().toISOString();
  return date.toISOString();
};

const dedupeStrings = (values: string[]): string[] => {
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const value of values) {
    const normalized = value.trim();
    if (!normalized) continue;
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    unique.push(normalized);
  }
  return unique;
};

const resolvePropertyType = (record: ResidencyApiItem): PropertyType => {
  const normalizedCategory = normalizeText(record.category).replace(/\s+/g, "");
  if (normalizedCategory && CATEGORY_TO_TYPE[normalizedCategory]) {
    return CATEGORY_TO_TYPE[normalizedCategory];
  }

  const normalizedType = normalizeText(record.propertyType);
  if (TYPE_SET.has(normalizedType as PropertyType)) {
    return normalizedType as PropertyType;
  }

  if (normalizedType.includes("project")) {
    return "residentialProjects";
  }

  return "residential";
};

const resolvePropertyUse = (type: PropertyType): PropertyUse => {
  if (type === "commercial" || type === "building") return "commercial";
  if (type === "land") return "land";
  if (
    type === "residentialProjects" ||
    type === "local-project" ||
    type === "international-project" ||
    type === "timeshare"
  ) {
    return "investment";
  }
  return "residential";
};

const collectSearchText = (record: ResidencyApiItem): string => {
  const specialOffers = asArray(record.projeHakkinda?.specialOffers);
  const specialOfferText = specialOffers
    .flatMap((offer) => [offer?.title, offer?.description])
    .filter(Boolean);

  const rawText = [
    record.title,
    record.description,
    record.address,
    record.city,
    record.country,
    record.listingStatus,
    record.projectStatus,
    record.usageStatus,
    ...asArray(record.interiorFeatures),
    ...asArray(record.exteriorFeatures),
    ...asArray(record.muhitFeatures),
    ...asArray(record.manzaraFeatures),
    ...specialOfferText,
  ]
    .filter(Boolean)
    .join(" ");

  return normalizeText(rawText);
};

const resolveStatus = (record: ResidencyApiItem, searchableText: string): PropertyStatus => {
  const rawStatus = normalizeText(record.listingStatus);
  if (["ready", "hazir", "tamamlandi", "completed"].includes(rawStatus)) {
    return "ready";
  }
  if (
    [
      "offplan",
      "off-plan",
      "off plan",
      "devam-ediyor",
      "devam ediyor",
      "under construction",
      "insaat halinde",
    ].includes(rawStatus)
  ) {
    return "offplan";
  }

  const projectStatus = normalizeText(record.projectStatus);
  if (includesAnyKeyword(projectStatus, OFFPLAN_KEYWORDS)) return "offplan";
  if (includesAnyKeyword(projectStatus, READY_KEYWORDS)) return "ready";

  if (includesAnyKeyword(searchableText, OFFPLAN_KEYWORDS)) return "offplan";
  return "ready";
};

const resolveBooleanFlags = (record: ResidencyApiItem, searchableText: string) => {
  const specialOffers = asArray(record.projeHakkinda?.specialOffers);
  const hasInstallmentInOffers = specialOffers.some(
    (offer) => parseNonNegativeNumber(offer?.installmentMonths, 0) > 0,
  );

  return {
    seaView:
      Boolean(record.seaView) || includesAnyKeyword(searchableText, SEA_VIEW_KEYWORDS),
    installmentAvailable:
      Boolean(record.installmentAvailable) ||
      hasInstallmentInOffers ||
      includesAnyKeyword(searchableText, INSTALLMENT_KEYWORDS),
    citizenshipEligible:
      Boolean(record.citizenshipEligible) ||
      includesAnyKeyword(searchableText, CITIZENSHIP_KEYWORDS),
  };
};

const toPropertyItem = (record: ResidencyApiItem): PropertyItem | null => {
  const sourceId = String(record.id || record._id || "").trim();
  if (!sourceId) return null;

  const title = String(record.title || "").trim() || "Property";
  const city = String(record.city || record.addressDetails?.city || "").trim() || "Unknown";
  const district =
    String(record.addressDetails?.district || "").trim() ||
    city ||
    "Unknown District";
  const country = String(record.country || "").trim() || "Turkey";
  const currency = String(record.currency || "USD").trim().toUpperCase() || "USD";
  const price = parseNonNegativeNumber(record.price, 0);
  const rooms = parseRoomCount(record.rooms, record.facilities);
  const bathrooms = parseBathrooms(record.bathrooms, record.facilities);
  const areaM2 = parseAreaM2(record.area, record.facilities);
  const type = resolvePropertyType(record);
  const propertyUse = resolvePropertyUse(type);
  const searchableText = collectSearchText(record);
  const status = resolveStatus(record, searchableText);
  const booleanFlags = resolveBooleanFlags(record, searchableText);
  const slug = String(record.slug || sourceId).trim() || sourceId;
  const image = record.image || asArray(record.images)[0] || null;

  const amenities = dedupeStrings([
    ...asArray(record.interiorFeatures),
    ...asArray(record.exteriorFeatures),
    ...asArray(record.muhitFeatures),
    ...asArray(record.manzaraFeatures),
  ]);

  return {
    _id: sourceId,
    sourceId,
    title,
    slug,
    country,
    city,
    district,
    propertyType: type,
    propertyUse,
    status,
    price,
    currency,
    rooms,
    bedrooms: rooms,
    bathrooms,
    areaM2,
    seaView: booleanFlags.seaView,
    distanceToSeaM: 0,
    installmentAvailable: booleanFlags.installmentAvailable,
    citizenshipEligible: booleanFlags.citizenshipEligible,
    rentalGuarantee: false,
    roiPercent: parseNonNegativeNumber(record.roiPercent, 0),
    amenities,
    createdAt: toIsoDate(record.createdAt),
    description: record.description || undefined,
    image,
  };
};

const fetchResidencies = cache(async (): Promise<ResidencyApiItem[]> => {
  const baseUrl = getServerApiBaseUrl();
  const response = await fetch(`${baseUrl}/api/residency/allresd`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    next: {
      revalidate: 300,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch residencies: ${response.status}`);
  }

  const payload = (await response.json()) as unknown;
  if (!Array.isArray(payload)) return [];
  return payload as ResidencyApiItem[];
});

export async function getAllMappedProperties(): Promise<PropertyItem[]> {
  const residencies = await fetchResidencies();
  return residencies
    .map(toPropertyItem)
    .filter((item): item is PropertyItem => item !== null);
}

const sortItems = (items: PropertyItem[], sort = "newest"): PropertyItem[] => {
  const cloned = [...items];

  switch (sort) {
    case "price_asc":
      return cloned.sort((a, b) => a.price - b.price || b.createdAt.localeCompare(a.createdAt));
    case "price_desc":
      return cloned.sort((a, b) => b.price - a.price || b.createdAt.localeCompare(a.createdAt));
    case "roi_desc":
      return cloned.sort(
        (a, b) => b.roiPercent - a.roiPercent || b.createdAt.localeCompare(a.createdAt),
      );
    default:
      return cloned.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
};

const matchesCity = (itemCity: string, filterCity: string): boolean => {
  return slugifySegment(itemCity) === slugifySegment(filterCity);
};

const applyFilters = (items: PropertyItem[], filters: ListingFilters): PropertyItem[] => {
  return items
    .filter((item) => {
      if (!filters.city) return true;
      return matchesCity(item.city, filters.city);
    })
    .filter((item) => {
      if (!filters.propertyType?.length) return true;
      return filters.propertyType.includes(item.propertyType);
    })
    .filter((item) => {
      if (!filters.status) return true;
      return item.status === filters.status;
    })
    .filter((item) => {
      if (typeof filters.minPrice !== "number") return true;
      return item.price >= filters.minPrice;
    })
    .filter((item) => {
      if (typeof filters.maxPrice !== "number") return true;
      return item.price <= filters.maxPrice;
    })
    .filter((item) => {
      if (typeof filters.minRooms !== "number") return true;
      return item.rooms >= filters.minRooms;
    })
    .filter((item) => {
      if (typeof filters.seaView !== "boolean") return true;
      return item.seaView === filters.seaView;
    })
    .filter((item) => {
      if (typeof filters.installmentAvailable !== "boolean") return true;
      return item.installmentAvailable === filters.installmentAvailable;
    })
    .filter((item) => {
      if (typeof filters.citizenshipEligible !== "boolean") return true;
      return item.citizenshipEligible === filters.citizenshipEligible;
    })
    .filter((item) => {
      if (typeof filters.minRoi !== "number") return true;
      return item.roiPercent >= filters.minRoi;
    });
};

export async function getProperties(filters: ListingFilters): Promise<PropertiesApiResponse> {
  const allItems = await getAllMappedProperties();
  const filtered = applyFilters(allItems, filters);
  const sorted = sortItems(filtered, filters.sort ?? "newest");

  const limit = Math.min(Math.max(filters.limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT);
  const total = sorted.length;
  const pages = total === 0 ? 1 : Math.ceil(total / limit);
  const requestedPage = Math.max(filters.page ?? DEFAULT_PAGE, DEFAULT_PAGE);
  const page = Math.min(requestedPage, pages);
  const start = (page - 1) * limit;
  const items = sorted.slice(start, start + limit);

  return {
    items,
    total,
    page,
    pages,
  };
}

export async function getPropertyBySlug(slug: string): Promise<PropertyItem | null> {
  const normalizedSlug = String(slug || "").trim();
  if (!normalizedSlug) return null;

  const baseUrl = getServerApiBaseUrl();
  const response = await fetch(`${baseUrl}/api/residency/${encodeURIComponent(normalizedSlug)}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (response.ok) {
    const payload = (await response.json()) as ResidencyApiItem | null;
    if (payload && typeof payload === "object") {
      const mapped = toPropertyItem(payload);
      if (mapped) return mapped;
    }
  }

  const items = await getAllMappedProperties();
  return (
    items.find((item) => item.slug === normalizedSlug) ||
    items.find((item) => item.sourceId === normalizedSlug) ||
    null
  );
}

export async function getAvailableCities(): Promise<string[]> {
  const items = await getAllMappedProperties();
  return dedupeStrings(items.map((item) => item.city)).sort((a, b) =>
    a.localeCompare(b),
  );
}

export async function resolveCityBySlug(citySlug: string): Promise<string | null> {
  const normalized = slugifySegment(citySlug);
  const cities = await getAvailableCities();
  return cities.find((city) => slugifySegment(city) === normalized) || null;
}

export async function getAvailablePropertyTypes(): Promise<PropertyType[]> {
  const items = await getAllMappedProperties();
  const found = new Set<PropertyType>();

  for (const item of items) {
    found.add(item.propertyType);
  }

  return PROPERTY_TYPES.filter((type) => found.has(type));
}

export function resolvePropertyTypeFromSlug(typeSlug: string): PropertyType | null {
  const normalized = slugifySegment(typeSlug);
  for (const type of PROPERTY_TYPES) {
    if (slugifySegment(type) === normalized) {
      return type;
    }
  }
  return null;
}
