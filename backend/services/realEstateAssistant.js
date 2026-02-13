import OpenAI from "openai";
import { toFile } from "openai";
import { ObjectId } from "mongodb";
import { getMongoDb } from "../config/prismaConfig.js";

let openaiClient = null;

const FALLBACK_MESSAGES = {
  en: {
    noData: "I don't have that information in the system right now.",
    noMatch: "No matching records were found in the current system data.",
    found: "I found matching records in the system.",
    leadPrompt:
      "To proceed, please share your name, country, WhatsApp or email, and budget range.",
  },
  tr: {
    noData: "Bu bilgi su anda sistemde mevcut degil.",
    noMatch: "Mevcut sistem verisinde eslesen bir kayit bulunamadi.",
    found: "Sistemde eslesen kayitlar bulundu.",
    leadPrompt:
      "Ilerlemek icin lutfen adinizi, ulkenizi, WhatsApp veya e-posta bilginizi ve butce araliginizi paylasin.",
  },
  ru: {
    noData: "Seychas v sisteme net etoy informatsii.",
    noMatch: "V tekushchikh dannykh sistemy net podkhodyashchikh zapisey.",
    found: "V sisteme naydeny podkhodyashchie dannye.",
    leadPrompt:
      "Dlya prodolzheniya ukazhite, pozhaluysta, imya, stranu, WhatsApp ili email i byudzhetnyy diapazon.",
  },
};

const TOOL_NAMES = {
  searchProperties: "searchProperties",
  getPropertyById: "getPropertyById",
  searchConsultants: "searchConsultants",
  searchBlogs: "searchBlogs",
  createLead: "createLead",
};

const PROJECT_PROPERTY_TYPES = new Set(["local-project", "international-project"]);
const SUPPORTED_BUDGET_CURRENCIES = new Set(["USD", "TRY", "EUR"]);

const readPositiveEnvNumber = (name, fallback) => {
  const parsed = Number(process.env[name]);
  if (Number.isFinite(parsed) && parsed > 0) return parsed;
  return fallback;
};

// Exchange assumptions for chat budget filtering (override via backend/.env).
// ASSISTANT_TRY_PER_USD: how many TRY for 1 USD.
// ASSISTANT_USD_PER_EUR: how many USD for 1 EUR.
const ASSISTANT_TRY_PER_USD = readPositiveEnvNumber("ASSISTANT_TRY_PER_USD", 36);
const ASSISTANT_USD_PER_EUR = readPositiveEnvNumber("ASSISTANT_USD_PER_EUR", 1.08);

function getOpenAIClient() {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "OPENAI_API_KEY is not set in environment variables. Please add it to backend/.env."
      );
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

function mapTranscriptionLanguage(language = "") {
  const normalized = normalizeString(language).toLowerCase();
  if (normalized.startsWith("tr")) return "tr";
  if (normalized.startsWith("ru")) return "ru";
  if (normalized.startsWith("en")) return "en";
  return "";
}

function getTranscriptionPrompt(language = "en") {
  if (language === "tr") {
    return "Gayrimenkul konusmasi. Dogru yazim kullan: Istanbul, Bahcesehir, Kozapark, Basaksehir, Esenyurt, Beylikduzu, 1+1, 2+1, USD, EUR, TRY, TL, tapu, taksit, proje, daire, villa.";
  }
  if (language === "ru") {
    return "Tema: nedvizhimost v Turcii. Sokhranyay tochnye nazvaniya: Istanbul, Bahcesehir, Kozapark, Basaksehir, Esenyurt, Beylikduzu, 1+1, 2+1, USD, EUR, TRY, tapu, rassrochka, proekt, kvartira, villa.";
  }
  return "Real-estate conversation. Keep spelling accurate for: Istanbul, Bahcesehir, Kozapark, Basaksehir, Esenyurt, Beylikduzu, 1+1, 2+1, USD, EUR, TRY, title deed, installment, project, apartment, villa.";
}

function mimeTypeToExtension(mimeType = "") {
  const normalized = normalizeString(mimeType).toLowerCase();
  if (normalized.includes("webm")) return "webm";
  if (normalized.includes("mp4")) return "mp4";
  if (normalized.includes("mpeg")) return "mp3";
  if (normalized.includes("wav")) return "wav";
  if (normalized.includes("ogg")) return "ogg";
  if (normalized.includes("m4a")) return "m4a";
  return "webm";
}

function decodeBase64Audio(value = "") {
  const raw = normalizeString(value);
  if (!raw) return Buffer.alloc(0);
  const base64Part = raw.includes(",") ? raw.split(",").pop() : raw;
  return Buffer.from(base64Part || "", "base64");
}

async function createTranscriptionWithFallback(openai, payload) {
  const preferred = process.env.REAL_ESTATE_STT_MODEL || "gpt-4o-transcribe";
  const candidates = [preferred, "gpt-4o-mini-transcribe", "whisper-1"];
  let lastError = null;

  for (const model of candidates) {
    try {
      return await openai.audio.transcriptions.create({
        ...payload,
        model,
      });
    } catch (error) {
      lastError = error;
      const msg = String(error?.message || "").toLowerCase();
      const modelRelated =
        msg.includes("model") || msg.includes("not found") || msg.includes("does not exist");
      if (!modelRelated || model === candidates[candidates.length - 1]) {
        throw error;
      }
    }
  }

  throw lastError;
}

function detectLanguage(text = "") {
  if (!text) return "en";

  if (/[\u0400-\u04FF]/.test(text)) return "ru";

  const turkishHint =
    /[\u00E7\u011F\u0131\u00F6\u015F\u00FC\u00C7\u011E\u0130\u00D6\u015E\u00DC]/.test(text) ||
    /\b(merhaba|istanbul|ev|daire|yatirim|taksit|fiyat|odeme|satilik|kredi)\b/i.test(
      text
    );

  if (turkishHint) return "tr";
  return "en";
}

function safeJsonParse(value, fallback = null) {
  if (typeof value !== "string") return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function normalizeString(value, fallback = "") {
  if (typeof value !== "string") return fallback;
  return value.trim();
}

function normalizeNumber(value, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^\d.-]/g, ""));
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function normalizeCurrencyCode(value) {
  const code = normalizeString(value).toUpperCase();
  return SUPPORTED_BUDGET_CURRENCIES.has(code) ? code : "";
}

function convertPrice(value, fromCurrency, toCurrency) {
  const amount = normalizeNumber(value, NaN);
  const from = normalizeCurrencyCode(fromCurrency);
  const to = normalizeCurrencyCode(toCurrency);
  if (!Number.isFinite(amount) || !from || !to) return NaN;
  if (from === to) return amount;

  let usdValue = NaN;
  if (from === "USD") usdValue = amount;
  if (from === "TRY") usdValue = amount / ASSISTANT_TRY_PER_USD;
  if (from === "EUR") usdValue = amount * ASSISTANT_USD_PER_EUR;
  if (!Number.isFinite(usdValue)) return NaN;

  if (to === "USD") return usdValue;
  if (to === "TRY") return usdValue * ASSISTANT_TRY_PER_USD;
  if (to === "EUR") return usdValue / ASSISTANT_USD_PER_EUR;
  return NaN;
}

function extractDistrict(property) {
  if (property?.addressDetails && typeof property.addressDetails === "object") {
    const district = property.addressDetails.district;
    if (typeof district === "string" && district.trim()) return district.trim();
  }
  return "";
}

function extractSizeM2(property) {
  const area = property?.area;
  if (typeof area === "number" && Number.isFinite(area)) return area;
  if (!area || typeof area !== "object") return 0;

  const net = normalizeNumber(area.net, NaN);
  const gross = normalizeNumber(area.gross, NaN);
  if (Number.isFinite(net)) return net;
  if (Number.isFinite(gross)) return gross;
  return 0;
}

function toPriceFields(property) {
  const price = normalizeNumber(property?.price, 0);
  const currency = normalizeString(property?.currency).toUpperCase();
  const asUsd = convertPrice(price, currency, "USD");
  const asTry = convertPrice(price, currency, "TRY");

  return {
    price_usd: Number.isFinite(asUsd) ? Math.round(asUsd) : 0,
    price_try: Number.isFinite(asTry) ? Math.round(asTry) : 0,
  };
}

function normalizeDateLike(value) {
  if (!value) return "";
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === "string") return value;
  return "";
}

function collectFeatures(property) {
  const merged = [
    ...(Array.isArray(property?.interiorFeatures) ? property.interiorFeatures : []),
    ...(Array.isArray(property?.exteriorFeatures) ? property.exteriorFeatures : []),
    ...(Array.isArray(property?.muhitFeatures) ? property.muhitFeatures : []),
    ...(Array.isArray(property?.manzaraFeatures) ? property.manzaraFeatures : []),
    ...(Array.isArray(property?.genelOzellikler) ? property.genelOzellikler : []),
    ...(Array.isArray(property?.konumFeatures) ? property.konumFeatures : []),
  ];

  const seen = new Set();
  const result = [];
  for (const item of merged) {
    const value = normalizeString(item);
    if (!value) continue;
    if (seen.has(value.toLowerCase())) continue;
    seen.add(value.toLowerCase());
    result.push(value);
    if (result.length >= 8) break;
  }
  return result;
}

function normalizePropertyType(value) {
  const normalized = normalizeString(value).toLowerCase();
  return normalized;
}

function buildDetailUrl(id, propertyType) {
  if (!id) return "";
  if (PROJECT_PROPERTY_TYPES.has(normalizePropertyType(propertyType))) {
    return `/projects/${id}`;
  }
  return `/listing/${id}`;
}

function normalizePropertyRecord(property) {
  const id = property?._id?.toString?.() || property?.id || "";
  const district = extractDistrict(property);
  const { price_usd, price_try } = toPriceFields(property);
  const propertyType = normalizePropertyType(property?.propertyType);
  const paymentPlanRaw =
    normalizeString(property?.paymentPlan) ||
    normalizeString(property?.kampanya) ||
    "";
  const imageUrl =
    normalizeString(property?.image) ||
    (Array.isArray(property?.images) ? normalizeString(property.images[0]) : "");

  return {
    id,
    title: normalizeString(property?.title),
    city: normalizeString(property?.city),
    district,
    price_usd,
    price_try,
    rooms: normalizeString(property?.rooms),
    size_m2: normalizeNumber(extractSizeM2(property), 0),
    delivery_date: normalizeDateLike(property?.deliveryDate || property?.listingDate),
    payment_plan: paymentPlanRaw,
    tapu_status: normalizeString(property?.deedStatus),
    features: collectFeatures(property),
    image_url: imageUrl,
    detail_url: buildDetailUrl(id, propertyType),
    property_type: propertyType,
  };
}

function getLocalizedConsultantField(consultant, field, language = "en") {
  const lang = normalizeString(language).toLowerCase();
  const localizedKey = `${field}_${lang}`;
  const localizedValue = normalizeString(consultant?.[localizedKey]);
  if (localizedValue) return localizedValue;
  return normalizeString(consultant?.[field]);
}

function normalizeConsultantRecord(consultant, language = "en") {
  const id = consultant?._id?.toString?.() || consultant?.id || "";
  const title = getLocalizedConsultantField(consultant, "title", language);
  const specialty = getLocalizedConsultantField(consultant, "specialty", language);
  const bio = getLocalizedConsultantField(consultant, "bio", language);

  return {
    id: normalizeString(id),
    name: normalizeString(consultant?.name),
    title,
    specialty,
    experience: normalizeString(consultant?.experience),
    languages: Array.isArray(consultant?.languages)
      ? consultant.languages.map((x) => normalizeString(x)).filter(Boolean)
      : [],
    rating: normalizeNumber(consultant?.rating, 0),
    reviews: normalizeNumber(consultant?.reviews, 0),
    deals: normalizeNumber(consultant?.deals, 0),
    phone: normalizeString(consultant?.phone),
    whatsapp: normalizeString(consultant?.whatsapp),
    email: normalizeString(consultant?.email),
    image_url: normalizeString(consultant?.image),
    bio,
    available: Boolean(consultant?.available),
    linkedin: normalizeString(consultant?.linkedin),
    profile_url: "/consultants",
  };
}

function getLocalizedBlogField(blog, field, language = "en") {
  const lang = normalizeString(language).toLowerCase();
  const localizedKey = `${field}_${lang}`;
  const localizedValue = normalizeString(blog?.[localizedKey]);
  if (localizedValue) return localizedValue;
  return normalizeString(blog?.[field]);
}

function normalizeBlogRecord(blog, language = "en") {
  const id = blog?._id?.toString?.() || blog?.id || "";
  const title = getLocalizedBlogField(blog, "title", language);
  const summary =
    getLocalizedBlogField(blog, "summary", language) ||
    getLocalizedBlogField(blog, "metaDescription", language);
  const category = getLocalizedBlogField(blog, "category", language);
  const imageUrl =
    normalizeString(blog?.image) ||
    (Array.isArray(blog?.images) ? normalizeString(blog.images[0]) : "");

  return {
    id: normalizeString(id),
    title,
    summary,
    category,
    country: normalizeString(blog?.country),
    image_url: imageUrl,
    blog_url: id ? `/blog/${id}` : "",
    published_at: normalizeDateLike(blog?.createdAt),
  };
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseDeliveryDate(value) {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === "string") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return null;
}

function normalizeSearchArgs(args = {}) {
  const mapped = {
    budgetMin: args?.budgetMin ?? args?.budget_min,
    budgetMax: args?.budgetMax ?? args?.budget_max,
    budgetCurrency:
      args?.budgetCurrency ?? args?.budget_currency ?? args?.currency,
    rooms: args?.rooms,
    city: args?.city,
    district: args?.district,
    neighborhood:
      args?.neighborhood ??
      args?.neighbourhood ??
      args?.location ??
      args?.location_query,
    deliveryDate: args?.deliveryDate ?? args?.delivery_date,
    installmentPlan: args?.installmentPlan ?? args?.installment_plan,
    keywords: Array.isArray(args?.keywords) ? args.keywords : [],
    limit: args?.limit,
  };
  return mapped;
}

function normalizeConsultantSearchArgs(args = {}) {
  return {
    name: args?.name,
    specialty: args?.specialty,
    language: args?.language ?? args?.spoken_language,
    available: args?.available,
    keywords: Array.isArray(args?.keywords) ? args.keywords : [],
    limit: args?.limit,
  };
}

function normalizeBlogSearchArgs(args = {}) {
  return {
    query: args?.query,
    country: args?.country,
    category: args?.category,
    keywords: Array.isArray(args?.keywords) ? args.keywords : [],
    limit: args?.limit,
  };
}

function inferLocationTokensFromText(text = "") {
  const normalized = String(text || "")
    .toLowerCase()
    .replace(/[^0-9a-z\u00c0-\u024f\u0400-\u04ff\s-]/gi, " ");

  const stopwords = new Set([
    "i",
    "me",
    "my",
    "want",
    "with",
    "for",
    "in",
    "the",
    "and",
    "or",
    "to",
    "a",
    "an",
    "under",
    "over",
    "budget",
    "price",
    "project",
    "facility",
    "facilities",
    "usd",
    "eur",
    "euro",
    "try",
    "tl",
    "dollar",
    "merhaba",
    "istanbul",
    "daire",
    "ev",
    "fiyat",
    "butce",
    "bütçe",
    "ve",
    "ile",
    "icin",
    "için",
    "satilik",
    "satılık",
    "proje",
    "sosyal",
    "donati",
    "donatı",
    "хочу",
    "купить",
    "бюджет",
    "цена",
  ]);

  return normalized
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3)
    .filter((token) => !/^\d+$/.test(token))
    .filter((token) => !stopwords.has(token))
    .slice(0, 3);
}

function inferBlogKeywordsFromText(text = "") {
  const normalized = String(text || "")
    .toLowerCase()
    .replace(/[^0-9a-z\u00c0-\u024f\u0400-\u04ff\u0600-\u06ff\s-]/gi, " ");

  const stopwords = new Set([
    "what",
    "which",
    "where",
    "tell",
    "about",
    "show",
    "find",
    "blog",
    "article",
    "guide",
    "law",
    "legal",
    "tax",
    "and",
    "the",
    "for",
    "with",
    "turkey",
    "turkish",
    "istanbul",
    "nedir",
    "hakkinda",
    "blog",
    "makale",
    "rehber",
    "vergi",
    "kanun",
    "yasa",
  ]);

  return normalized
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3)
    .filter((token) => !/^\d+$/.test(token))
    .filter((token) => !stopwords.has(token))
    .slice(0, 8);
}

function toAsciiSearchForm(value = "") {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u0131/g, "i")
    .trim();
}

function expandKeywordVariants(rawKeyword = "") {
  const keyword = normalizeString(rawKeyword);
  if (!keyword) return [];

  const variants = new Set();
  const lower = keyword.toLowerCase();
  const ascii = toAsciiSearchForm(lower);

  variants.add(keyword);
  variants.add(lower);
  if (ascii) variants.add(ascii);

  const normalized = ascii || lower;
  const isFacilityLike =
    /(facility|facilit|amenit|social|sosyal|donat|ozellik|tesis)/i.test(normalized);
  if (isFacilityLike) {
    [
      "facility",
      "facilities",
      "amenity",
      "amenities",
      "social",
      "sosyal",
      "donati",
      "donat",
    ].forEach((v) => variants.add(v));
  }

  const isProjectLike = /(project|proje)/i.test(normalized);
  if (isProjectLike) {
    ["project", "proje"].forEach((v) => variants.add(v));
  }

  return Array.from(variants).filter(Boolean);
}

async function searchProperties(rawArgs = {}) {
  const args = normalizeSearchArgs(rawArgs);
  const db = await getMongoDb();

  const baseAndConditions = [];
  const budgetMin = normalizeNumber(args.budgetMin, NaN);
  const budgetMax = normalizeNumber(args.budgetMax, NaN);
  const hasBudgetFilter = Number.isFinite(budgetMin) || Number.isFinite(budgetMax);
  const budgetCurrency = normalizeCurrencyCode(args.budgetCurrency) || "USD";

  // Budget filtering is applied after fetch so mixed listing currencies (USD/TRY/EUR)
  // can be normalized to one budget currency reliably.

  if (normalizeString(args.rooms)) {
    baseAndConditions.push({
      rooms: { $regex: `^${escapeRegex(normalizeString(args.rooms))}$`, $options: "i" },
    });
  }

  if (normalizeString(args.city)) {
    baseAndConditions.push({
      city: { $regex: escapeRegex(normalizeString(args.city)), $options: "i" },
    });
  }

  if (normalizeString(args.district)) {
    const districtPattern = escapeRegex(normalizeString(args.district));
    baseAndConditions.push({
      $or: [
        { "addressDetails.district": { $regex: districtPattern, $options: "i" } },
        { address: { $regex: districtPattern, $options: "i" } },
      ],
    });
  }

  if (normalizeString(args.neighborhood)) {
    const neighborhoodPattern = escapeRegex(normalizeString(args.neighborhood));
    baseAndConditions.push({
      $or: [
        {
          "addressDetails.neighborhood": {
            $regex: neighborhoodPattern,
            $options: "i",
          },
        },
        { siteName: { $regex: neighborhoodPattern, $options: "i" } },
        { projectName: { $regex: neighborhoodPattern, $options: "i" } },
        { title: { $regex: neighborhoodPattern, $options: "i" } },
        { address: { $regex: neighborhoodPattern, $options: "i" } },
      ],
    });
  }

  if (typeof args.installmentPlan === "boolean" && args.installmentPlan) {
    baseAndConditions.push({
      $or: [
        { kampanya: { $regex: "taksit|installment|payment", $options: "i" } },
        { paymentPlan: { $regex: "taksit|installment|payment", $options: "i" } },
      ],
    });
  }

  const rawKeywords = (Array.isArray(args.keywords) ? args.keywords : [])
    .map((k) => normalizeString(k))
    .filter(Boolean);
  const expandedKeywords = Array.from(
    new Set(rawKeywords.flatMap((keyword) => expandKeywordVariants(keyword)))
  );
  const keywordConditions = [];

  if (expandedKeywords.length > 0) {
    for (const keyword of expandedKeywords) {
      const pattern = escapeRegex(keyword);
      keywordConditions.push(
        { title: { $regex: pattern, $options: "i" } },
        { description: { $regex: pattern, $options: "i" } },
        { city: { $regex: pattern, $options: "i" } },
        { address: { $regex: pattern, $options: "i" } },
        { projectName: { $regex: pattern, $options: "i" } },
        { siteName: { $regex: pattern, $options: "i" } },
        { "addressDetails.neighborhood": { $regex: pattern, $options: "i" } },
        { "addressDetails.district": { $regex: pattern, $options: "i" } },
        { propertyType: { $regex: pattern, $options: "i" } },
        { muhit: { $regex: pattern, $options: "i" } },
        { interiorFeatures: { $elemMatch: { $regex: pattern, $options: "i" } } },
        { exteriorFeatures: { $elemMatch: { $regex: pattern, $options: "i" } } },
        { muhitFeatures: { $elemMatch: { $regex: pattern, $options: "i" } } },
        { manzaraFeatures: { $elemMatch: { $regex: pattern, $options: "i" } } },
        { genelOzellikler: { $elemMatch: { $regex: pattern, $options: "i" } } },
        { konumFeatures: { $elemMatch: { $regex: pattern, $options: "i" } } }
      );
    }
  }

  const buildQuery = (useKeywordConditions) => {
    const andConditions = [...baseAndConditions];
    if (useKeywordConditions && keywordConditions.length > 0) {
      andConditions.push({ $or: keywordConditions });
    }
    return andConditions.length > 0 ? { $and: andConditions } : {};
  };
  const fetchLimit = Math.min(Math.max(normalizeNumber(args.limit, 6), 1), 20);

  let docs = await db
    .collection("Residency")
    .find(buildQuery(true))
    .sort({ createdAt: -1 })
    .limit(40)
    .toArray();

  // Retry with base filters if keyword matching is too strict for mixed languages.
  if (docs.length === 0 && keywordConditions.length > 0) {
    docs = await db
      .collection("Residency")
      .find(buildQuery(false))
      .sort({ createdAt: -1 })
      .limit(40)
      .toArray();
  }

  const budgetFiltered = hasBudgetFilter
    ? docs.filter((doc) => {
        const converted = convertPrice(doc?.price, doc?.currency, budgetCurrency);
        if (!Number.isFinite(converted)) return false;
        if (Number.isFinite(budgetMin) && converted < budgetMin) return false;
        if (Number.isFinite(budgetMax) && converted > budgetMax) return false;
        return true;
      })
    : docs;

  const deliveryDate = parseDeliveryDate(args.deliveryDate);
  const filtered = deliveryDate
    ? budgetFiltered.filter((doc) => {
        const d = parseDeliveryDate(doc?.deliveryDate || doc?.listingDate);
        if (!d) return false;
        return d.getTime() <= deliveryDate.getTime();
      })
    : budgetFiltered;

  return filtered.slice(0, fetchLimit).map(normalizePropertyRecord);
}

async function searchConsultants(rawArgs = {}, language = "en") {
  const args = normalizeConsultantSearchArgs(rawArgs);
  const db = await getMongoDb();

  const andConditions = [];

  if (typeof args.available === "boolean") {
    andConditions.push({ available: args.available });
  }

  if (normalizeString(args.name)) {
    const pattern = escapeRegex(normalizeString(args.name));
    andConditions.push({
      $or: [
        { name: { $regex: pattern, $options: "i" } },
        { title: { $regex: pattern, $options: "i" } },
        { title_en: { $regex: pattern, $options: "i" } },
        { title_tr: { $regex: pattern, $options: "i" } },
      ],
    });
  }

  if (normalizeString(args.specialty)) {
    const pattern = escapeRegex(normalizeString(args.specialty));
    andConditions.push({
      $or: [
        { specialty: { $regex: pattern, $options: "i" } },
        { specialty_en: { $regex: pattern, $options: "i" } },
        { specialty_tr: { $regex: pattern, $options: "i" } },
        { bio: { $regex: pattern, $options: "i" } },
        { bio_en: { $regex: pattern, $options: "i" } },
        { bio_tr: { $regex: pattern, $options: "i" } },
      ],
    });
  }

  if (normalizeString(args.language)) {
    const pattern = escapeRegex(normalizeString(args.language));
    andConditions.push({
      languages: { $elemMatch: { $regex: pattern, $options: "i" } },
    });
  }

  const keywords = (Array.isArray(args.keywords) ? args.keywords : [])
    .map((k) => normalizeString(k))
    .filter(Boolean)
    .slice(0, 6);
  if (keywords.length > 0) {
    const keywordConditions = [];
    for (const keyword of keywords) {
      const pattern = escapeRegex(keyword);
      keywordConditions.push(
        { name: { $regex: pattern, $options: "i" } },
        { title: { $regex: pattern, $options: "i" } },
        { title_en: { $regex: pattern, $options: "i" } },
        { title_tr: { $regex: pattern, $options: "i" } },
        { specialty: { $regex: pattern, $options: "i" } },
        { specialty_en: { $regex: pattern, $options: "i" } },
        { specialty_tr: { $regex: pattern, $options: "i" } },
        { bio: { $regex: pattern, $options: "i" } },
        { bio_en: { $regex: pattern, $options: "i" } },
        { bio_tr: { $regex: pattern, $options: "i" } },
        { languages: { $elemMatch: { $regex: pattern, $options: "i" } } }
      );
    }
    andConditions.push({ $or: keywordConditions });
  }

  const query = andConditions.length > 0 ? { $and: andConditions } : {};
  const limit = Math.min(Math.max(normalizeNumber(args.limit, 4), 1), 10);

  const docs = await db
    .collection("Consultant")
    .find(query)
    .sort({ available: -1, rating: -1, reviews: -1, order: 1, createdAt: -1 })
    .limit(limit)
    .toArray();

  return docs.map((item) => normalizeConsultantRecord(item, language));
}

async function searchBlogs(rawArgs = {}, language = "en") {
  const args = normalizeBlogSearchArgs(rawArgs);
  const db = await getMongoDb();
  const andConditions = [{ published: true }];

  if (normalizeString(args.country)) {
    const pattern = escapeRegex(normalizeString(args.country));
    andConditions.push({ country: { $regex: pattern, $options: "i" } });
  }

  if (normalizeString(args.category)) {
    const pattern = escapeRegex(normalizeString(args.category));
    andConditions.push({
      $or: [
        { category: { $regex: pattern, $options: "i" } },
        { category_en: { $regex: pattern, $options: "i" } },
        { category_tr: { $regex: pattern, $options: "i" } },
        { category_ru: { $regex: pattern, $options: "i" } },
      ],
    });
  }

  const explicitKeywords = (Array.isArray(args.keywords) ? args.keywords : [])
    .map((k) => normalizeString(k))
    .filter(Boolean)
    .slice(0, 8);
  const queryKeywords = [
    ...inferBlogKeywordsFromText(args.query),
    normalizeString(args.query),
  ].filter(Boolean);
  const mergedKeywords = Array.from(new Set([...explicitKeywords, ...queryKeywords]));

  if (mergedKeywords.length > 0) {
    const keywordConditions = [];

    for (const rawKeyword of mergedKeywords) {
      const variants = expandKeywordVariants(rawKeyword);
      for (const variant of variants) {
        const pattern = escapeRegex(variant);
        keywordConditions.push(
          { title: { $regex: pattern, $options: "i" } },
          { title_en: { $regex: pattern, $options: "i" } },
          { title_tr: { $regex: pattern, $options: "i" } },
          { title_ru: { $regex: pattern, $options: "i" } },
          { summary: { $regex: pattern, $options: "i" } },
          { summary_en: { $regex: pattern, $options: "i" } },
          { summary_tr: { $regex: pattern, $options: "i" } },
          { summary_ru: { $regex: pattern, $options: "i" } },
          { content: { $regex: pattern, $options: "i" } },
          { content_en: { $regex: pattern, $options: "i" } },
          { content_tr: { $regex: pattern, $options: "i" } },
          { content_ru: { $regex: pattern, $options: "i" } },
          { metaDescription: { $regex: pattern, $options: "i" } },
          { metaDescription_en: { $regex: pattern, $options: "i" } },
          { metaDescription_tr: { $regex: pattern, $options: "i" } },
          { metaDescription_ru: { $regex: pattern, $options: "i" } },
          { category: { $regex: pattern, $options: "i" } },
          { category_en: { $regex: pattern, $options: "i" } },
          { category_tr: { $regex: pattern, $options: "i" } },
          { category_ru: { $regex: pattern, $options: "i" } },
          { country: { $regex: pattern, $options: "i" } }
        );
      }
    }

    andConditions.push({ $or: keywordConditions });
  }

  const query = andConditions.length > 0 ? { $and: andConditions } : {};
  const limit = Math.min(Math.max(normalizeNumber(args.limit, 3), 1), 8);

  const docs = await db
    .collection("Blog")
    .find(query)
    .sort({ order: 1, createdAt: -1 })
    .limit(limit)
    .toArray();

  return docs.map((item) => normalizeBlogRecord(item, language));
}

async function getPropertyById(id) {
  if (!ObjectId.isValid(id)) return null;
  const db = await getMongoDb();
  const property = await db.collection("Residency").findOne({ _id: new ObjectId(id) });
  if (!property) return null;
  return normalizePropertyRecord(property);
}

async function createLead(data = {}) {
  const db = await getMongoDb();

  const lead = {
    name: normalizeString(data.name),
    country: normalizeString(data.country),
    whatsapp_or_email: normalizeString(data.whatsapp_or_email || data.whatsappOrEmail),
    budget_range: normalizeString(data.budget_range || data.budgetRange),
    note: normalizeString(data.note),
    source: "ai_assistant",
    createdAt: new Date(),
  };

  const insertResult = await db.collection("AiLead").insertOne(lead);
  return {
    id: insertResult.insertedId.toString(),
    ...lead,
    createdAt: lead.createdAt.toISOString(),
  };
}

export async function transcribeAssistantAudio({
  audio_base64,
  mime_type,
  language,
} = {}) {
  const base64Audio = normalizeString(audio_base64);
  if (!base64Audio) {
    throw new Error("audio_base64 is required");
  }

  const audioBuffer = decodeBase64Audio(base64Audio);
  if (!audioBuffer.length) {
    throw new Error("audio payload is empty");
  }

  const maxBytes = 15 * 1024 * 1024;
  if (audioBuffer.length > maxBytes) {
    throw new Error("audio payload is too large");
  }

  const contentType = normalizeString(mime_type) || "audio/webm";
  const extension = mimeTypeToExtension(contentType);
  const file = await toFile(audioBuffer, `voice-input.${extension}`, {
    type: contentType,
  });

  const transcriptionLanguage = mapTranscriptionLanguage(language);
  const promptLanguage = transcriptionLanguage || detectLanguage(language || "");
  const openai = getOpenAIClient();
  const response = await createTranscriptionWithFallback(openai, {
    file,
    language: transcriptionLanguage || undefined,
    prompt: getTranscriptionPrompt(promptLanguage || "en"),
    response_format: "json",
    temperature: 0,
  });

  const text = normalizeString(response?.text);
  return { text };
}

function normalizeHistory(history = []) {
  if (!Array.isArray(history)) return [];
  return history
    .filter((item) => item && (item.role === "user" || item.role === "assistant"))
    .slice(-8)
    .map((item) => ({
      role: item.role,
      content: typeof item.content === "string" ? item.content : JSON.stringify(item.content || {}),
    }));
}

function getSystemPrompt(language) {
  const noData = FALLBACK_MESSAGES[language]?.noData || FALLBACK_MESSAGES.en.noData;

  return `You are a multilingual AI real estate assistant integrated with MongoDB property and blog databases.

Supported languages: English (EN), Turkish (TR), Russian (RU).
Language rules:
- Detect user language from the latest user message and respond fully in that language.
- If user changes language, follow it immediately.
- Never mix languages in one reply.

Data rules:
- You MUST use available tools for all factual property or lead information.
- Never fabricate prices, features, delivery dates, payment plans, or legal eligibility.
- If data is unavailable, clearly say: "${noData}"

Intents to handle:
- Property search
- Property details
- Consultant search / advisor recommendation
- Blog content questions (tax, legal, market insights, guides)
- Payment plan inquiry
- Investment/citizenship eligibility
- Location questions
- Ready-to-buy signals

Behavior rules:
- Extract filters where possible (budget, rooms, city/district/neighborhood/site name, delivery date, installment, feature keywords).
- For consultant intent, call searchConsultants and return consultant profiles in "consultants".
- For blog/legal/tax content requests, call searchBlogs and return matching posts in "blogs".
- If user asks for property search, price, rooms, budget, payment plan, or location, do NOT call searchBlogs and keep "blogs" as [].
- Detect budget currency among USD, TRY, EUR and pass it as "budget_currency" in search tool calls.
- If required details are missing, ask maximum one short clarification question using "next_question".
- If user shows buying intent, include a short "lead_prompt" asking for name, country, WhatsApp/email, and budget range.
- Keep tone concise, professional, investor-oriented, trustworthy, with clear numbers.

Output rules:
- Return ONLY valid JSON.
- Use exactly this top-level shape:
{
  "reply": "string",
  "results": [
    {
      "id": "property_id",
      "title": "...",
      "city": "...",
      "district": "...",
      "price_usd": 0,
      "price_try": 0,
      "rooms": "2+1",
      "size_m2": 0,
      "delivery_date": "...",
      "payment_plan": "...",
      "tapu_status": "...",
      "features": ["...", "..."],
      "image_url": "...",
      "detail_url": "...",
      "property_type": "..."
    }
  ],
  "consultants": [
    {
      "id": "consultant_id",
      "name": "...",
      "title": "...",
      "specialty": "...",
      "experience": "...",
      "languages": ["..."],
      "rating": 0,
      "reviews": 0,
      "phone": "...",
      "whatsapp": "...",
      "email": "...",
      "image_url": "...",
      "bio": "...",
      "available": true,
      "profile_url": "..."
    }
  ],
  "blogs": [
    {
      "id": "blog_id",
      "title": "...",
      "summary": "...",
      "category": "...",
      "country": "...",
      "image_url": "...",
      "blog_url": "...",
      "published_at": "..."
    }
  ],
  "next_question": "...",
  "lead_prompt": "..."
}
- If no matches: "results" must be [] and "consultants" must be [] and "blogs" must be [] and reply must politely explain no match.
- Keep data fields grounded in tool outputs only.`;
}

function hasBuyingIntent(text = "") {
  const normalized = text.toLowerCase();
  return (
    /\b(i want to buy|how can i proceed|book|reserve|buy now|ready to buy)\b/.test(normalized) ||
    /\b(satin almak istiyorum|nasil ilerleyebilirim|hemen almak)\b/.test(normalized) ||
    /\b(hochu kupit|kak prodolzhit|gotov kupit)\b/.test(normalized)
  );
}

function hasConsultantIntent(text = "") {
  const normalized = String(text || "").toLowerCase();
  return (
    /\b(consultant|advisor|agent|broker|expert|team)\b/.test(normalized) ||
    /\b(meslek|uzman|danisman|danışman|emlakci|emlakçı|satis temsilcisi)\b/.test(normalized) ||
    /\b(konsultant|agent)\b/.test(normalized) ||
    /\b(مشاور|کارشناس|ادمین فروش|ایجنت)\b/.test(normalized)
  );
}

function hasBlogIntent(text = "") {
  const normalized = String(text || "").toLowerCase();
  return (
    /\b(blog|article|news)\b/.test(normalized) ||
    /\b(tax|taxes|taxation|legal|law|laws|regulation|regulations|citizenship law)\b/.test(
      normalized
    ) ||
    /\b(blog|makale|rehber|haber|yazi|yazı|yazilar|yazılar)\b/.test(normalized) ||
    /\b(vergi|vergiler|vergilendirme|kanun|kanunlar|yasa|mevzuat)\b/.test(normalized) ||
    /\b(مالیات|قانون|مقاله|بلاگ|خبر|راهنما)\b/.test(normalized) ||
    /[\u0400-\u04FF]/.test(normalized) &&
      /\b(блог|статья|новость|гайд|налог|налоги|закон|законы|право|регламент)\b/.test(
        normalized
      )
  );
}

function inferConsultantKeywordsFromText(text = "") {
  return String(text || "")
    .toLowerCase()
    .replace(/[^0-9a-z\u00c0-\u024f\u0400-\u04ff\u0600-\u06ff\s-]/gi, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3)
    .filter((token) => !/^\d+$/.test(token))
    .filter(
      (token) =>
        ![
          "consultant",
          "advisor",
          "agent",
          "broker",
          "team",
          "danisman",
          "danışman",
          "مشاور",
        ].includes(token)
    )
    .slice(0, 5);
}

function normalizeResultItem(item = {}) {
  const normalizedId = normalizeString(item.id);
  const normalizedPropertyType = normalizePropertyType(item.property_type);
  const normalizedDetailUrl =
    normalizeString(item.detail_url) || buildDetailUrl(normalizedId, normalizedPropertyType);

  return {
    id: normalizedId,
    title: normalizeString(item.title),
    city: normalizeString(item.city),
    district: normalizeString(item.district),
    price_usd: normalizeNumber(item.price_usd, 0),
    price_try: normalizeNumber(item.price_try, 0),
    rooms: normalizeString(item.rooms),
    size_m2: normalizeNumber(item.size_m2, 0),
    delivery_date: normalizeString(item.delivery_date),
    payment_plan: normalizeString(item.payment_plan),
    tapu_status: normalizeString(item.tapu_status),
    features: Array.isArray(item.features)
      ? item.features.map((x) => normalizeString(x)).filter(Boolean)
      : [],
    image_url: normalizeString(item.image_url),
    detail_url: normalizedDetailUrl,
    property_type: normalizedPropertyType,
  };
}

function normalizeConsultantItem(item = {}) {
  return {
    id: normalizeString(item.id),
    name: normalizeString(item.name),
    title: normalizeString(item.title),
    specialty: normalizeString(item.specialty),
    experience: normalizeString(item.experience),
    languages: Array.isArray(item.languages)
      ? item.languages.map((x) => normalizeString(x)).filter(Boolean)
      : [],
    rating: normalizeNumber(item.rating, 0),
    reviews: normalizeNumber(item.reviews, 0),
    deals: normalizeNumber(item.deals, 0),
    phone: normalizeString(item.phone),
    whatsapp: normalizeString(item.whatsapp),
    email: normalizeString(item.email),
    image_url: normalizeString(item.image_url),
    bio: normalizeString(item.bio),
    available: Boolean(item.available),
    linkedin: normalizeString(item.linkedin),
    profile_url: normalizeString(item.profile_url) || "/consultants",
  };
}

function normalizeBlogItem(item = {}) {
  return {
    id: normalizeString(item.id),
    title: normalizeString(item.title),
    summary: normalizeString(item.summary),
    category: normalizeString(item.category),
    country: normalizeString(item.country),
    image_url: normalizeString(item.image_url),
    blog_url: normalizeString(item.blog_url),
    published_at: normalizeString(item.published_at),
  };
}

async function enrichAssistantResults(results = []) {
  const enriched = await Promise.all(
    results.map(async (item) => {
      if (!item?.id) return item;

      const needsEnrichment =
        !normalizeString(item.image_url) ||
        !normalizeString(item.detail_url) ||
        !normalizeString(item.property_type);

      if (!needsEnrichment) return item;

      try {
        const property = await getPropertyById(item.id);
        if (!property) return item;

        return {
          ...item,
          image_url: normalizeString(item.image_url) || property.image_url,
          detail_url: normalizeString(item.detail_url) || property.detail_url,
          property_type:
            normalizeString(item.property_type) || normalizePropertyType(property.property_type),
        };
      } catch {
        return item;
      }
    })
  );

  return enriched;
}

function normalizeAssistantPayload(payload) {
  const normalized = {
    reply: normalizeString(payload?.reply),
    results: Array.isArray(payload?.results) ? payload.results.map(normalizeResultItem) : [],
    consultants: Array.isArray(payload?.consultants)
      ? payload.consultants.map(normalizeConsultantItem)
      : [],
    blogs: Array.isArray(payload?.blogs) ? payload.blogs.map(normalizeBlogItem) : [],
  };

  const nextQuestion = normalizeString(payload?.next_question);
  const leadPrompt = normalizeString(payload?.lead_prompt);

  if (nextQuestion) normalized.next_question = nextQuestion;
  if (leadPrompt) normalized.lead_prompt = leadPrompt;

  return normalized;
}

const tools = [
  {
    type: "function",
    function: {
      name: TOOL_NAMES.searchProperties,
      description: "Search properties by filters in the database.",
      parameters: {
        type: "object",
        properties: {
          budget_min: { type: "number" },
          budget_max: { type: "number" },
          budget_currency: { type: "string", enum: ["USD", "TRY", "EUR"] },
          rooms: { type: "string" },
          city: { type: "string" },
          district: { type: "string" },
          neighborhood: { type: "string" },
          delivery_date: { type: "string" },
          installment_plan: { type: "boolean" },
          keywords: {
            type: "array",
            items: { type: "string" },
          },
          limit: { type: "number" },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: TOOL_NAMES.getPropertyById,
      description: "Get one property by id.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string" },
        },
        required: ["id"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: TOOL_NAMES.searchConsultants,
      description: "Search real estate consultants by specialty, language, availability or name.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          specialty: { type: "string" },
          language: { type: "string" },
          available: { type: "boolean" },
          keywords: {
            type: "array",
            items: { type: "string" },
          },
          limit: { type: "number" },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: TOOL_NAMES.searchBlogs,
      description:
        "Search published blog posts by topic, tax/legal keywords, market insights, category or country.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string" },
          country: { type: "string" },
          category: { type: "string" },
          keywords: {
            type: "array",
            items: { type: "string" },
          },
          limit: { type: "number" },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: TOOL_NAMES.createLead,
      description: "Create a lead when user shares contact and budget details.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          country: { type: "string" },
          whatsapp_or_email: { type: "string" },
          budget_range: { type: "string" },
          note: { type: "string" },
        },
        required: ["name", "country", "whatsapp_or_email", "budget_range"],
        additionalProperties: false,
      },
    },
  },
];

async function createChatCompletionWithFallback(openai, basePayload) {
  const preferred = process.env.REAL_ESTATE_ASSISTANT_MODEL || "gpt-5.3-codex";
  const candidates = [preferred, "gpt-4o-mini"];
  let lastError = null;

  for (const model of candidates) {
    try {
      return await openai.chat.completions.create({
        ...basePayload,
        model,
      });
    } catch (error) {
      lastError = error;
      const msg = String(error?.message || "").toLowerCase();
      const modelRelated =
        msg.includes("model") || msg.includes("not found") || msg.includes("does not exist");
      if (!modelRelated || model === candidates[candidates.length - 1]) {
        throw error;
      }
    }
  }

  throw lastError;
}

function detectBudgetCurrencyFromText(text = "") {
  const value = String(text || "").toLowerCase();

  if (/\$|\busd\b|\bdollar\b|\bdolar\b/.test(value)) return "USD";
  if (/\u20ac|\beur\b|\beuro\b/.test(value)) return "EUR";
  if (/\u20ba|\btry\b|\btl\b|\blira\b/.test(value)) return "TRY";

  return "";
}

export async function runRealEstateAssistant({ message, history = [] }) {
  const userMessage = normalizeString(message);
  if (!userMessage) {
    throw new Error("message is required");
  }

  const language = detectLanguage(userMessage);
  const consultantIntent = hasConsultantIntent(userMessage);
  const blogIntent = hasBlogIntent(userMessage);
  const safeHistory = normalizeHistory(history);
  const fallback = FALLBACK_MESSAGES[language] || FALLBACK_MESSAGES.en;
  const inferredBudgetCurrency = detectBudgetCurrencyFromText(userMessage);

  const openai = getOpenAIClient();
  const messages = [
    { role: "system", content: getSystemPrompt(language) },
    ...safeHistory,
    { role: "user", content: userMessage },
  ];

  let usedTool = false;

  for (let step = 0; step < 6; step += 1) {
    const completion = await createChatCompletionWithFallback(openai, {
      messages,
      tools,
      tool_choice: "auto",
      temperature: 0.1,
      response_format: { type: "json_object" },
    });

    const assistantMessage = completion?.choices?.[0]?.message;
    if (!assistantMessage) break;

    const toolCalls = Array.isArray(assistantMessage.tool_calls)
      ? assistantMessage.tool_calls
      : [];

    if (toolCalls.length === 0) {
      const parsed = safeJsonParse(assistantMessage.content, {});
      const normalized = normalizeAssistantPayload(parsed);
      normalized.results = await enrichAssistantResults(normalized.results);

      if (!blogIntent) {
        normalized.blogs = [];
      }

      if (!usedTool && normalized.results.length > 0) {
        normalized.results = [];
      }
      if (!usedTool && normalized.consultants.length > 0) {
        normalized.consultants = [];
      }
      if (!usedTool && normalized.blogs.length > 0) {
        normalized.blogs = [];
      }

      if (consultantIntent && normalized.consultants.length === 0) {
        const consultantFallback = await searchConsultants(
          {
            keywords: inferConsultantKeywordsFromText(userMessage),
            limit: 4,
          },
          language
        );
        if (consultantFallback.length > 0) {
          normalized.consultants = consultantFallback;
        }
      }
      if (blogIntent && normalized.blogs.length === 0) {
        const blogFallback = await searchBlogs(
          {
            query: userMessage,
            keywords: inferBlogKeywordsFromText(userMessage),
            limit: 3,
          },
          language
        );
        if (blogFallback.length > 0) {
          normalized.blogs = blogFallback;
        }
      }

      if (!normalized.reply) {
        normalized.reply =
          normalized.results.length > 0 ||
          normalized.consultants.length > 0 ||
          normalized.blogs.length > 0
          ? fallback.found
          : fallback.noMatch;
      }
      if (hasBuyingIntent(userMessage) && !normalized.lead_prompt) {
        normalized.lead_prompt = fallback.leadPrompt;
      }
      return normalized;
    }

    usedTool = true;
    messages.push(assistantMessage);

    for (const call of toolCalls) {
      const name = call?.function?.name;
      const args = safeJsonParse(call?.function?.arguments, {}) || {};
      let toolOutput;

      if (name === TOOL_NAMES.searchProperties) {
        const hasBudget =
          args?.budget_min !== undefined ||
          args?.budget_max !== undefined ||
          args?.budgetMin !== undefined ||
          args?.budgetMax !== undefined;

        let searchArgs =
          hasBudget && inferredBudgetCurrency && !args?.budget_currency && !args?.budgetCurrency
            ? { ...args, budget_currency: inferredBudgetCurrency }
            : args;

        const hasExplicitLocation =
          normalizeString(searchArgs?.city) ||
          normalizeString(searchArgs?.district) ||
          normalizeString(searchArgs?.neighborhood);
        const existingKeywords = Array.isArray(searchArgs?.keywords)
          ? searchArgs.keywords.map((k) => normalizeString(k)).filter(Boolean)
          : [];

        // Single-term location queries like "kozapark" should still hit the DB.
        if (!hasExplicitLocation && existingKeywords.length === 0) {
          const inferredTokens = inferLocationTokensFromText(userMessage);
          if (inferredTokens.length > 0) {
            searchArgs = {
              ...searchArgs,
              keywords: inferredTokens,
            };
            if (inferredTokens.length === 1 && !normalizeString(searchArgs.neighborhood)) {
              searchArgs.neighborhood = inferredTokens[0];
            }
          }
        }

        toolOutput = await searchProperties(searchArgs);
      } else if (name === TOOL_NAMES.getPropertyById) {
        toolOutput = await getPropertyById(args.id);
      } else if (name === TOOL_NAMES.searchConsultants) {
        toolOutput = await searchConsultants(args, language);
      } else if (name === TOOL_NAMES.searchBlogs) {
        toolOutput = blogIntent ? await searchBlogs(args, language) : [];
      } else if (name === TOOL_NAMES.createLead) {
        toolOutput = await createLead(args);
      } else {
        toolOutput = { error: "Unknown tool" };
      }

      messages.push({
        role: "tool",
        tool_call_id: call.id,
        content: JSON.stringify(toolOutput),
      });
    }
  }

  const response = {
    reply: fallback.noData,
    results: [],
    consultants: [],
    blogs: [],
  };
  if (consultantIntent) {
    response.consultants = await searchConsultants({ limit: 4 }, language);
    response.reply =
      response.consultants.length > 0 ? fallback.found : fallback.noMatch;
  }
  if (blogIntent) {
    response.blogs = await searchBlogs(
      {
        query: userMessage,
        keywords: inferBlogKeywordsFromText(userMessage),
        limit: 3,
      },
      language
    );
    if (!response.consultants.length) {
      response.reply = response.blogs.length > 0 ? fallback.found : fallback.noMatch;
    }
  }
  if (hasBuyingIntent(userMessage)) {
    response.lead_prompt = fallback.leadPrompt;
  }
  return response;
}


