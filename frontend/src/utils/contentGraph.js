import {
  resolveBlogPath,
  resolveProjectPath,
  resolvePropertyPath,
  slugify,
  stripHtml,
  truncateText,
} from "./seo";

const CITIZENSHIP_KEYWORDS = [
  "citizenship",
  "turkish citizenship",
  "passport",
  "vatandaslik",
  "vatandasliga uygun",
];

const INSTALLMENT_KEYWORDS = [
  "installment",
  "payment plan",
  "taksit",
  "taksitli",
  "down payment",
];

const INVESTMENT_KEYWORDS = [
  "investment",
  "investor",
  "roi",
  "yield",
  "capital growth",
  "yatirim",
  "yatirimci",
  "rental income",
];

const LEGAL_TAX_KEYWORDS = [
  "tax",
  "legal",
  "title deed",
  "valuation",
  "closing cost",
  "tapu",
  "vergi",
  "hukuk",
  "degerleme",
];

const FAMILY_KEYWORDS = [
  "family",
  "school",
  "park",
  "hospital",
  "muhit",
  "aile",
];

const LUXURY_KEYWORDS = [
  "luxury",
  "premium",
  "exclusive",
  "sea view",
  "boaz",
  "marina",
];

const RENTAL_KEYWORDS = [
  "rental",
  "rent",
  "lease",
  "tenant",
  "kira",
  "kiraci",
];

const HIGH_INTENT_CITIES = ["istanbul", "antalya", "kyrenia", "cyprus", "dubai"];

const DEFAULT_PRICE_BANDS = [
  { key: "entry", max: 150000 },
  { key: "mid", max: 300000 },
  { key: "upper", max: 600000 },
  { key: "premium", max: Number.POSITIVE_INFINITY },
];

const pickText = (...values) => {
  for (const value of values) {
    if (value === null || value === undefined) continue;
    const normalized = String(value).trim();
    if (normalized) return normalized;
  }
  return "";
};

const toArray = (value) => (Array.isArray(value) ? value : []);

export const normalizeText = (value = "") =>
  String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const uniqueStrings = (values = []) => {
  const seen = new Set();
  return values
    .map((value) => pickText(value))
    .filter(Boolean)
    .filter((value) => {
      const normalized = normalizeText(value);
      if (!normalized || seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    });
};

const includesAnyKeyword = (text, keywords) => {
  const haystack = normalizeText(text);
  return keywords.some((keyword) => haystack.includes(normalizeText(keyword)));
};

const intersectNormalized = (left = [], right = []) => {
  const rightSet = new Set(right.map((item) => normalizeText(item)).filter(Boolean));
  return uniqueStrings(left).filter((item) => rightSet.has(normalizeText(item)));
};

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const getPropertyDistrict = (property) => {
  const directDistrict = pickText(
    property?.addressDetails?.district,
    property?.district,
    property?.ilce
  );
  if (directDistrict) return directDistrict;

  const address = pickText(property?.address);
  if (!address) return "";
  const [firstPart] = address.split(",");
  return pickText(firstPart);
};

const getPropertySearchText = (property) => {
  const directValues = [
    property?.title,
    property?.name,
    property?.projectName,
    property?.description,
    property?.description_en,
    property?.description_tr,
    property?.description_ru,
    property?.address,
    property?.city,
    property?.country,
    property?.category,
    property?.propertyType,
    property?.listingStatus,
    property?.projectStatus,
    property?.usageStatus,
    property?.kampanya,
    property?.deedStatus,
  ];

  const offerValues = getPropertySpecialOffers(property).flatMap((offer) => [
    offer?.title,
    offer?.roomType,
    offer?.description,
    offer?.paymentPlan,
    offer?.locationLabel,
  ]);

  const featureValues = [
    ...toArray(property?.interiorFeatures),
    ...toArray(property?.exteriorFeatures),
    ...toArray(property?.muhitFeatures),
    ...toArray(property?.manzaraFeatures),
    ...toArray(property?.konumFeatures),
    ...toArray(property?.genelOzellikler),
  ];

  return normalizeText([...directValues, ...offerValues, ...featureValues].filter(Boolean).join(" "));
};

const resolvePriceBand = (price) => {
  const numericPrice = toNumber(price);
  if (!numericPrice) return "";
  const matched = DEFAULT_PRICE_BANDS.find((band) => numericPrice <= band.max);
  return matched?.key || "";
};

export const getPropertySpecialOffers = (property) => {
  const offers = toArray(property?.projeHakkinda?.specialOffers);
  const legacyOffer = property?.projeHakkinda?.specialOffer;
  if (legacyOffer && typeof legacyOffer === "object") {
    offers.push(legacyOffer);
  }
  return offers;
};

export const isInstallmentProperty = (property) => {
  const hasOfferInstallment = getPropertySpecialOffers(property).some(
    (offer) => toNumber(offer?.installmentMonths) > 0
  );
  if (hasOfferInstallment) return true;
  return includesAnyKeyword(getPropertySearchText(property), INSTALLMENT_KEYWORDS);
};

export const isCitizenshipEligibleProperty = (property) => {
  if (property?.gyo) return true;
  return includesAnyKeyword(getPropertySearchText(property), CITIZENSHIP_KEYWORDS);
};

export const getPropertyIntents = (property) => {
  const searchText = getPropertySearchText(property);
  const roomCount =
    toNumber(String(property?.rooms || "").match(/^(\d+)/)?.[1]) ||
    toNumber(property?.facilities?.bedrooms);
  const price = toNumber(property?.price);
  const city = normalizeText(property?.city);
  const intents = [];

  if (isCitizenshipEligibleProperty(property)) intents.push("citizenship");
  if (isInstallmentProperty(property)) intents.push("installment");
  if (includesAnyKeyword(searchText, INVESTMENT_KEYWORDS) || property?.gyo) {
    intents.push("investment");
  }
  if (includesAnyKeyword(searchText, LEGAL_TAX_KEYWORDS)) intents.push("legal-tax");
  if (roomCount >= 2 || includesAnyKeyword(searchText, FAMILY_KEYWORDS)) {
    intents.push("family-living");
  }
  if (
    includesAnyKeyword(searchText, RENTAL_KEYWORDS) ||
    HIGH_INTENT_CITIES.includes(city)
  ) {
    intents.push("rental-income");
  }
  if (price >= 750000 || includesAnyKeyword(searchText, LUXURY_KEYWORDS)) {
    intents.push("luxury");
  }
  if (intents.length === 0) intents.push("buyer-guide");
  return uniqueStrings(intents);
};

export const getPropertySignals = (property) => {
  const city = pickText(property?.city, property?.addressDetails?.city);
  const district = getPropertyDistrict(property);
  const country = pickText(property?.country);
  const category = pickText(property?.category);
  const propertyType = pickText(property?.propertyType);
  const citizenship = isCitizenshipEligibleProperty(property);
  const installment = isInstallmentProperty(property);
  const intents = getPropertyIntents(property);
  const tags = uniqueStrings([
    category,
    propertyType,
    city,
    district,
    country,
    ...intents,
  ]);

  return {
    city,
    district,
    country,
    category,
    propertyType,
    citizenship,
    installment,
    intents,
    tags,
    priceBand: resolvePriceBand(property?.price),
  };
};

const getLocalizedValue = (item, field, language = "en") => {
  if (!item || !field) return "";
  const normalizedLanguage = String(language || "en").toLowerCase();
  const suffix =
    normalizedLanguage.startsWith("tr")
      ? "tr"
      : normalizedLanguage.startsWith("ru")
      ? "ru"
      : "en";
  return pickText(item?.[`${field}_${suffix}`], item?.[field]);
};

export const getContentDisplayTitle = (item, language = "en") =>
  pickText(
    getLocalizedValue(item, "title", language),
    getLocalizedValue(item, "name", language),
    item?.breadcrumbLabel
  );

export const getContentDisplaySummary = (item, language = "en") =>
  truncateText(
    pickText(
      getLocalizedValue(item, "summary", language),
      getLocalizedValue(item, "description", language),
      item?.description,
      item?.introParagraphs?.[0]
    ),
    150
  );

const inferIntentsFromText = (text = "") => {
  const intents = [];
  if (includesAnyKeyword(text, CITIZENSHIP_KEYWORDS)) intents.push("citizenship");
  if (includesAnyKeyword(text, INSTALLMENT_KEYWORDS)) intents.push("installment");
  if (includesAnyKeyword(text, INVESTMENT_KEYWORDS)) intents.push("investment");
  if (includesAnyKeyword(text, LEGAL_TAX_KEYWORDS)) intents.push("legal-tax");
  if (includesAnyKeyword(text, FAMILY_KEYWORDS)) intents.push("family-living");
  if (includesAnyKeyword(text, RENTAL_KEYWORDS)) intents.push("rental-income");
  if (includesAnyKeyword(text, LUXURY_KEYWORDS)) intents.push("luxury");
  return uniqueStrings(intents);
};

export const getContentTaxonomy = (item) => {
  const taxonomy =
    item?.taxonomy && typeof item.taxonomy === "object" ? item.taxonomy : {};
  const title = getContentDisplayTitle(item, "en");
  const description = pickText(
    item?.description,
    item?.summary,
    item?.summary_en,
    item?.content,
    item?.content_en,
    item?.introParagraphs?.join(" ")
  );
  const searchText = normalizeText(`${title} ${stripHtml(description)}`);
  const city = pickText(taxonomy?.city, item?.city);
  const district = pickText(taxonomy?.district, item?.district);
  const country = pickText(taxonomy?.country, item?.country);
  const category = pickText(taxonomy?.category, item?.category, item?.pageType);
  const subcategory = pickText(taxonomy?.subcategory);
  const intents = uniqueStrings([
    ...toArray(taxonomy?.intents),
    ...inferIntentsFromText(searchText),
    item?.citizenship ? "citizenship" : "",
    item?.installment ? "installment" : "",
  ]);
  const tags = uniqueStrings([
    ...toArray(taxonomy?.tags),
    category,
    subcategory,
    city,
    district,
    country,
    ...intents,
  ]);

  return {
    contentType: pickText(taxonomy?.contentType, item?.contentType, item?.pageType, "article"),
    category,
    subcategory,
    city,
    district,
    country,
    tags,
    intents,
    citizenship: Boolean(taxonomy?.citizenship || item?.citizenship || intents.includes("citizenship")),
    installment: Boolean(taxonomy?.installment || item?.installment || intents.includes("installment")),
  };
};

const scoreSignalsAgainstContext = (signals, context) => {
  let score = 0;

  if (signals.city && context.city && normalizeText(signals.city) === normalizeText(context.city)) {
    score += 6;
  }

  if (
    signals.district &&
    context.district &&
    normalizeText(signals.district) === normalizeText(context.district)
  ) {
    score += 8;
  }

  if (
    signals.country &&
    context.country &&
    normalizeText(signals.country) === normalizeText(context.country)
  ) {
    score += 3;
  }

  if (
    signals.category &&
    context.category &&
    normalizeText(signals.category) === normalizeText(context.category)
  ) {
    score += 4;
  }

  if (
    signals.propertyType &&
    context.propertyType &&
    normalizeText(signals.propertyType) === normalizeText(context.propertyType)
  ) {
    score += 2;
  }

  if (signals.citizenship && context.citizenship) score += 4;
  if (signals.installment && context.installment) score += 4;
  if (signals.priceBand && context.priceBand && signals.priceBand === context.priceBand) {
    score += 2;
  }

  const sharedIntents = intersectNormalized(signals.intents, context.intents);
  score += sharedIntents.length * 3;

  const sharedTags = intersectNormalized(signals.tags, context.tags);
  score += Math.min(sharedTags.length, 4);

  return score;
};

const toPropertyCardData = (property) => ({
  ...property,
  route:
    property?.propertyType === "local-project" ||
    property?.propertyType === "international-project"
      ? resolveProjectPath(property)
      : resolvePropertyPath(property),
});

export const buildPropertyContext = (property) => getPropertySignals(property);

export const buildContentContext = (item) => getContentTaxonomy(item);

export const pickRelatedProperties = ({
  properties = [],
  context = {},
  limit = 4,
  excludeId = "",
  includeProjects = false,
}) =>
  properties
    .filter((property) => {
      if (!property?.id || property.id === excludeId) return false;
      const isProject =
        property?.propertyType === "local-project" ||
        property?.propertyType === "international-project";
      return includeProjects ? !isProject || isProject : !isProject;
    })
    .map((property) => ({
      property,
      score: scoreSignalsAgainstContext(getPropertySignals(property), context),
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map((entry) => toPropertyCardData(entry.property));

export const pickRelatedProjects = ({
  properties = [],
  context = {},
  limit = 3,
  excludeId = "",
}) =>
  properties
    .filter((property) => {
      const isProject =
        property?.propertyType === "local-project" ||
        property?.propertyType === "international-project";
      return isProject && property?.id && property.id !== excludeId;
    })
    .map((property) => ({
      property,
      score: scoreSignalsAgainstContext(getPropertySignals(property), context),
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map((entry) => toPropertyCardData(entry.property));

export const pickRelatedBlogs = ({
  blogs = [],
  context = {},
  limit = 4,
  excludeId = "",
  language = "en",
}) =>
  blogs
    .filter((blog) => blog?.id && blog.id !== excludeId)
    .map((blog) => ({
      blog,
      score: scoreSignalsAgainstContext(getContentTaxonomy(blog), context),
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map(({ blog }) => ({
      id: blog.id,
      path: resolveBlogPath(blog, { preferSlug: true }),
      title: getContentDisplayTitle(blog, language),
      excerpt: getContentDisplaySummary(blog, language),
      badge: pickText(getLocalizedValue(blog, "category", language), "Article"),
      meta: uniqueStrings([blog?.country, blog?.city, blog?.district]).join(" / "),
      tags: getContentTaxonomy(blog).tags.slice(0, 4),
    }));

export const pickRelatedGuides = ({
  guides = [],
  context = {},
  limit = 4,
  excludeSlug = "",
  language = "en",
}) =>
  guides
    .filter((guide) => guide?.slug && guide.slug !== excludeSlug)
    .map((guide) => ({
      guide,
      score: scoreSignalsAgainstContext(getContentTaxonomy(guide), context),
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map(({ guide }) => ({
      id: guide.slug,
      path: guide.canonicalPath || `/${guide.slug}`,
      title: getContentDisplayTitle(guide, language),
      excerpt: getContentDisplaySummary(guide, language),
      badge: pickText(guide?.pageType, guide?.contentType, "Guide"),
      meta: uniqueStrings([guide?.city, guide?.district, guide?.country]).join(" / "),
      tags: getContentTaxonomy(guide).tags.slice(0, 4),
    }));

export const toCategoryPath = (category = "") => {
  const slug = slugify(category);
  return slug ? `/blogs/category/${slug}` : "/blogs";
};

