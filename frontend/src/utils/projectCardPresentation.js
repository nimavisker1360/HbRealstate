import {
  getPropertyDistrict,
  getPropertyIntents,
  isCitizenshipEligibleProperty,
  isInstallmentProperty,
} from "./contentGraph";
import {
  getPropertyComparablePrice,
  getPropertyDisplayPriceInfo,
} from "./propertyPricing";

const READY_STATUS_TOKENS = new Set([
  "ready",
  "hazir",
  "haz\u0131r",
  "completed",
  "tamamlandi",
  "tamamland\u0131",
]);

const TITLE_DEED_TOKENS = ["title deed", "tapu", "kat mulkiyeti", "kat m\u00fclkiyeti"];
const PRIME_LOCATION_KEYWORDS = [
  "prime",
  "prestige",
  "central",
  "center",
  "centre",
  "downtown",
  "marina",
  "waterfront",
  "seafront",
  "sea view",
  "bosphorus",
];

const normalizeText = (value = "") =>
  String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const pickText = (...values) => {
  for (const value of values) {
    if (value === null || value === undefined) continue;
    const normalized = String(value).trim();
    if (normalized) return normalized;
  }
  return "";
};

const toPositiveNumber = (value) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) && numericValue > 0 ? numericValue : 0;
};

const uniqueValues = (values = []) => {
  const seen = new Set();
  return values.filter((value) => {
    const normalized = normalizeText(value);
    if (!normalized || seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
};

const floorNumber = (value) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? Math.floor(numericValue) : 0;
};

const stripHtml = (value = "") => String(value || "").replace(/<[^>]*>/g, " ");

const truncateText = (value = "", maxLength = 136) => {
  const normalized = String(value || "").trim();
  if (!normalized || normalized.length <= maxLength) return normalized;

  const sliced = normalized.slice(0, maxLength + 1);
  const lastSpaceIndex = sliced.lastIndexOf(" ");
  const safeSlice =
    lastSpaceIndex > 60 ? sliced.slice(0, lastSpaceIndex) : sliced.slice(0, maxLength);
  return `${safeSlice.trim()}...`;
};

const normalizePriceDisplayMode = (value) => {
  const normalized = normalizeText(value).replace(/\s+/g, "_");
  if (
    normalized === "exact_price" ||
    normalized === "starting_from" ||
    normalized === "on_request" ||
    normalized === "hidden"
  ) {
    return normalized;
  }
  return "";
};

const isReadyProject = (project) => {
  if (project?.readyToMove === true) return true;
  const listingStatus = normalizeText(project?.listingStatus);
  const projectStatus = normalizeText(project?.projectStatus || project?.status);
  return READY_STATUS_TOKENS.has(listingStatus) || READY_STATUS_TOKENS.has(projectStatus);
};

const hasLimitedUnitsSignal = (project) => {
  if (project?.hasSpecialOffer) return true;

  const searchText = normalizeText(
    [
      project?.kampanya,
      project?.shortDescription,
      project?.shortDescription_en,
      project?.shortDescription_tr,
      project?.shortDescription_ru,
      project?.description,
      project?.description_en,
      project?.description_tr,
      project?.description_ru,
    ]
      .filter(Boolean)
      .join(" ")
  );

  return ["limited", "last units", "son daire", "sinirli", "s\u0131n\u0131rl\u0131"].some((token) =>
    searchText.includes(normalizeText(token))
  );
};

const isPrimeLocationProject = (
  project,
  { convertAmount, defaultCurrency = "USD" } = {}
) => {
  const locationHint = pickText(
    project?.specialOffer?.locationLabel,
    project?.district,
    getPropertyDistrict(project)
  );
  const locationSearch = normalizeText(
    [locationHint, project?.address, project?.kampanya].filter(Boolean).join(" ")
  );

  if (Number(project?.specialOffer?.locationMinutes || 0) > 0) return true;
  if (locationSearch && PRIME_LOCATION_KEYWORDS.some((token) => locationSearch.includes(token))) {
    return true;
  }

  return Boolean(locationHint) &&
    (project?.propertyType === "international-project" ||
      isLuxuryProject(project, { convertAmount, defaultCurrency }));
};

const hasTitleDeedReady = (project) => {
  const deedStatus = normalizeText(
    pickText(project?.titleDeedStatus, project?.deedStatus)
  );
  if (!deedStatus) return false;
  return TITLE_DEED_TOKENS.some((token) => deedStatus.includes(normalizeText(token)));
};

const getInstallmentMonths = (project) => {
  const offerMonths = Array.isArray(project?.specialOffers)
    ? project.specialOffers
        .map((offer) => toPositiveNumber(offer?.installmentMonths))
        .filter(Boolean)
    : [];

  return Math.max(
    toPositiveNumber(project?.specialOffer?.installmentMonths),
    ...offerMonths,
    toPositiveNumber(project?.installmentMonths)
  );
};

const getPriceCandidate = (
  project,
  type = "starting",
  { convertAmount, defaultCurrency = "USD" } = {}
) => {
  if (type === "exact") {
    const startingAmount = toPositiveNumber(project?.startingPrice);
    const directAmount = toPositiveNumber(
      project?.directPrice ||
        (!startingAmount && normalizePriceDisplayMode(project?.priceDisplayMode) === "exact_price"
          ? project?.price
          : 0)
    );
    const directCurrency = pickText(project?.directPriceCurrency, project?.currency, defaultCurrency);
    return {
      amount: directAmount,
      currency: directCurrency || defaultCurrency,
    };
  }

  if (toPositiveNumber(project?.startingPrice) > 0) {
    return {
      amount: toPositiveNumber(project.startingPrice),
      currency: pickText(project?.startingCurrency, project?.currency, defaultCurrency) || defaultCurrency,
    };
  }

  return getPropertyDisplayPriceInfo(project, {
    convertAmount,
    comparisonCurrency: defaultCurrency,
    defaultCurrency,
  });
};

const getComparablePriceInUsd = (
  project,
  { convertAmount, defaultCurrency = "USD" } = {}
) =>
  getPropertyComparablePrice(project, {
    convertAmount,
    comparisonCurrency: "USD",
    defaultCurrency,
  });

const HIGH_VALUE_CITIZENSHIP_THRESHOLD_USD = 400000;

const isHighValueOpportunityProject = (
  project,
  { convertAmount, defaultCurrency = "USD" } = {}
) => getComparablePriceInUsd(project, { convertAmount, defaultCurrency }) >= HIGH_VALUE_CITIZENSHIP_THRESHOLD_USD;

const isLuxuryProject = (
  project,
  { convertAmount, defaultCurrency = "USD" } = {}
) => {
  const intents = getPropertyIntents(project);
  return intents.includes("luxury") || getComparablePriceInUsd(project, { convertAmount, defaultCurrency }) >= 750000;
};

const isCitizenshipOpportunityProject = (
  project,
  { convertAmount, defaultCurrency = "USD" } = {}
) => isCitizenshipEligibleProperty(project) || isHighValueOpportunityProject(project, { convertAmount, defaultCurrency });

const isInvestmentProject = (
  project,
  { convertAmount, defaultCurrency = "USD" } = {}
) =>
  Boolean(project?.investmentSuitable) ||
  getPropertyIntents(project).includes("investment") ||
  isHighValueOpportunityProject(project, { convertAmount, defaultCurrency });

const getBadgeCandidates = (project, options = {}) => {
  const citizenshipOpportunity = isCitizenshipOpportunityProject(project, options);
  const investmentOpportunity = isInvestmentProject(project, options);
  const maxBadges = Math.min(Math.max(Number(options.maxBadges) || 2, 1), 2);
  const hasOffer = Boolean(project?.hasSpecialOffer);

  const candidates = [
    hasOffer
      ? { key: "specialOffer", priority: 100, tone: "rose" }
      : null,
    citizenshipOpportunity
      ? { key: "citizenship", priority: 96, tone: "emerald" }
      : null,
    isReadyProject(project)
      ? { key: "ready", priority: 92, tone: "slate" }
      : null,
    isInstallmentProperty(project)
      ? { key: "installment", priority: 88, tone: "sky" }
      : null,
    investmentOpportunity
      ? { key: "investment", priority: 84, tone: "amber" }
      : null,
    isPrimeLocationProject(project, options)
      ? { key: "primeLocation", priority: 80, tone: "stone" }
      : null,
    hasLimitedUnitsSignal(project) && !hasOffer
      ? { key: "limitedUnits", priority: 72, tone: "stone" }
      : null,
  ]
    .filter(Boolean)
    .sort((left, right) => right.priority - left.priority);

  if (candidates.length >= 2) {
    const keys = new Set(candidates.map((c) => c.key));
    if (keys.has("investment") && keys.has("citizenship")) {
      const idx = candidates.findIndex((c) => c.key === "investment");
      if (idx !== -1) candidates.splice(idx, 1);
    }
  }

  return candidates.slice(0, maxBadges);
};

export const getProjectBadges = (project, options = {}) =>
  getBadgeCandidates(project, options);

export const getProjectLocationLabel = (project) => {
  const district = pickText(project?.district, getPropertyDistrict(project));
  const city = pickText(project?.city);
  const country = pickText(project?.country);
  return [district, city, country].filter(Boolean).join(", ");
};

export const getProjectRoomMixLabel = (project) => {
  const roomTypes = uniqueValues(
    (Array.isArray(project?.propertyTypes) ? project.propertyTypes : project?.rooms || [])
      .map((item) => pickText(item))
      .filter(Boolean)
  );

  if (!roomTypes.length) return "";
  if (roomTypes.length === 1) return roomTypes[0];
  if (roomTypes.length === 2) return `${roomTypes[0]} - ${roomTypes[1]}`;
  return `${roomTypes[0]} - ${roomTypes[roomTypes.length - 1]}`;
};

export const getProjectAreaLabel = (project, t) => {
  const areaMin = toPositiveNumber(project?.areaMin);
  const areaMax = toPositiveNumber(project?.areaMax);
  if (!areaMin && !areaMax) return "";

  const grossLabel = t
    ? t("localProjects.gross", { defaultValue: "Gross" })
    : "Gross";

  if (areaMin && areaMax && areaMin !== areaMax) {
    return `${floorNumber(areaMin)}-${floorNumber(areaMax)} m2 ${grossLabel}`;
  }

  return `${floorNumber(areaMax || areaMin)} m2 ${grossLabel}`;
};

export const getProjectBenefitLine = (
  project,
  { t, language = "en", convertAmount, defaultCurrency = "USD" } = {}
) => {
  const normalizedLanguage = String(language || "en").toLowerCase();
  const citizenshipOpportunity = isCitizenshipOpportunityProject(project, {
    convertAmount,
    defaultCurrency,
  });
  const investmentOpportunity = isInvestmentProject(project, {
    convertAmount,
    defaultCurrency,
  });
  const localizedDescription = pickText(
    normalizedLanguage.startsWith("tr")
      ? project?.shortDescription_tr
      : normalizedLanguage.startsWith("ru")
      ? project?.shortDescription_ru
      : project?.shortDescription_en,
    normalizedLanguage.startsWith("tr")
      ? project?.description_tr
      : normalizedLanguage.startsWith("ru")
      ? project?.description_ru
      : project?.description_en,
    project?.shortDescription,
    project?.description,
    project?.kampanya
  );

  const cleanedDescription = truncateText(
    stripHtml(localizedDescription).replace(/\s+/g, " ").trim()
  );

  if (cleanedDescription) return cleanedDescription;

  const locationLabel = getProjectLocationLabel(project);
  const locationLead = pickText(
    project?.specialOffer?.locationLabel,
    project?.district,
    getPropertyDistrict(project),
    project?.city
  );
  const roomMix = getProjectRoomMixLabel(project);
  const installmentProperty = isInstallmentProperty(project);
  const readyProject = isReadyProject(project);

  if (citizenshipOpportunity && installmentProperty) {
    return t("localProjects.benefitCitizenshipInstallment", {
      defaultValue: "Citizenship-eligible homes paired with a structured payment plan.",
    });
  }

  if (citizenshipOpportunity && readyProject) {
    return t("localProjects.benefitCitizenshipReady", {
      defaultValue: "Citizenship-eligible inventory ready for a more immediate handover.",
    });
  }

  if (investmentOpportunity && readyProject) {
    return t("localProjects.benefitInvestmentReady", {
      defaultValue: "Ready residences positioned for faster rental activation and resale timing.",
    });
  }

  if (installmentProperty && locationLead) {
    return t("localProjects.benefitInstallmentLocation", {
      location: locationLead,
      defaultValue: "Flexible terms in a sought-after part of {{location}}.",
    });
  }

  if (readyProject && locationLead) {
    return t("localProjects.benefitReadyLocation", {
      location: locationLead,
      defaultValue: "Ready homes in {{location}} for buyers who want momentum, not waiting.",
    });
  }

  if (citizenshipOpportunity) {
    return t("localProjects.benefitCitizenship", {
      defaultValue: "Citizenship-focused inventory with advisor guidance built into the process.",
    });
  }

  if (investmentOpportunity) {
    return t("localProjects.benefitInvestment", {
      location: locationLabel,
      defaultValue: "Built for buyers prioritising rental demand and long-term exit quality.",
    });
  }

  if (installmentProperty) {
    return t("localProjects.benefitInstallment", {
      defaultValue: "A structured payment plan creates a smoother entry into the project.",
    });
  }

  if (readyProject) {
    return t("localProjects.benefitReady", {
      defaultValue: "Ready inventory suited to buyers who value earlier handover and clarity.",
    });
  }

  if (isPrimeLocationProject(project, { convertAmount, defaultCurrency }) && locationLead) {
    return t("localProjects.benefitPrimeLocation", {
      location: locationLead,
      defaultValue: "A more premium position within {{location}}, selected for daily convenience and profile.",
    });
  }

  if (roomMix) {
    return t("localProjects.benefitLayout", {
      roomMix,
      defaultValue: "A balanced unit mix designed for lifestyle flexibility and stronger long-term hold value.",
    });
  }

  if (locationLabel) {
    return t("localProjects.benefitLocation", {
      location: locationLabel,
      defaultValue: "Selected positioning in a well-connected location with strong day-to-day convenience.",
    });
  }

  return t("localProjects.benefitDefault", {
    defaultValue: "Curated project inventory with current availability and advisor support.",
  });
};

export const getProjectPricePresentation = (
  project,
  {
    t,
    language = "en",
    convertAmount,
    formatMoney,
    displayCurrency,
    defaultCurrency = "USD",
  } = {}
) => {
  const explicitMode = normalizePriceDisplayMode(project?.priceDisplayMode);
  const directPrice = getPriceCandidate(project, "exact", {
    convertAmount,
    defaultCurrency,
  });
  const startingPrice = getPriceCandidate(project, "starting", {
    convertAmount,
    defaultCurrency,
  });

  const shouldUseOnRequestFallback =
    isLuxuryProject(project, { convertAmount, defaultCurrency }) ||
    isInvestmentProject(project) ||
    isCitizenshipEligibleProperty(project);

  let mode = explicitMode;
  if (!mode) {
    if (shouldUseOnRequestFallback) {
      mode = startingPrice.amount > 0 && !isLuxuryProject(project, { convertAmount, defaultCurrency })
        ? "starting_from"
        : "on_request";
    } else if (startingPrice.amount > 0) {
      mode = "starting_from";
    } else {
      mode = "hidden";
    }
  }

  if (mode === "exact_price" && !directPrice.amount) {
    mode = "hidden";
  }

  if (mode === "starting_from" && !startingPrice.amount) {
    mode = "hidden";
  }

  const locale = language.startsWith("tr")
    ? "tr-TR"
    : language.startsWith("ru")
    ? "ru-RU"
    : "en-US";

  const formatDisplayPrice = ({ amount, currency }) => {
    if (!amount || typeof formatMoney !== "function") return "";
    const targetCurrency = displayCurrency || currency || defaultCurrency;
    const convertedAmount =
      typeof convertAmount === "function"
        ? convertAmount(amount, currency || defaultCurrency, targetCurrency)
        : amount;
    return formatMoney(Math.floor(convertedAmount), targetCurrency, locale);
  };

  if (mode === "exact_price") {
    return {
      mode,
      eyebrow: t("localProjects.priceExactLabel", {
        defaultValue: "Guide price",
      }),
      value: formatDisplayPrice(directPrice),
      caption: t("localProjects.priceExactCaption", {
        defaultValue: "Current public guide for this listing.",
      }),
      hasVisiblePrice: true,
    };
  }

  if (mode === "starting_from") {
    return {
      mode,
      eyebrow: t("localProjects.priceStartingFromLabel", {
        defaultValue: "Starting from",
      }),
      value: formatDisplayPrice(startingPrice),
      caption: t("localProjects.priceStartingFromCaption", {
        defaultValue: "Indicative entry point across currently released inventory.",
      }),
      hasVisiblePrice: true,
    };
  }

  if (mode === "on_request") {
    return {
      mode,
      eyebrow: t("localProjects.priceOnRequestLabel", {
        defaultValue: "Pricing",
      }),
      value: t("localProjects.priceOnRequestValue", {
        defaultValue: "Price on Request",
      }),
      caption: t("localProjects.priceOnRequestCaption", {
        defaultValue: "Request the latest unit list, payment plan, and advisor-led availability update.",
      }),
      hasVisiblePrice: false,
    };
  }

  return {
    mode: "hidden",
    eyebrow: t("localProjects.priceHiddenLabel", {
      defaultValue: "Pricing",
    }),
    value: t("localProjects.priceHiddenValue", {
      defaultValue: "Contact Advisor",
    }),
    caption: t("localProjects.priceHiddenCaption", {
      defaultValue: "Contact our team for current pricing, best-fit inventory, and purchase guidance.",
    }),
    hasVisiblePrice: false,
  };
};

export const getProjectPrimaryCTA = (project, { t } = {}) => {
  if (project?.hasSpecialOffer) {
    return t("localProjects.ctaPrimaryOffer", {
      defaultValue: "Explore Offer",
    });
  }
  if (isReadyProject(project)) {
    return t("localProjects.ctaPrimaryReady", {
      defaultValue: "View Project",
    });
  }
  return t("localProjects.ctaPrimaryDefault", {
    defaultValue: "Explore Project",
  });
};

export const getProjectSecondaryCTA = (
  project,
  {
    t,
    pricePresentation,
    hasWhatsApp = false,
    convertAmount,
    defaultCurrency = "USD",
  } = {}
) => {
  const citizenshipOpportunity = isCitizenshipOpportunityProject(project, {
    convertAmount,
    defaultCurrency,
  });
  const investmentOpportunity = isInvestmentProject(project, {
    convertAmount,
    defaultCurrency,
  });

  if (pricePresentation?.mode === "on_request") {
    return {
      action: hasWhatsApp ? "whatsapp" : "details",
      label: t("localProjects.ctaSecondaryPriceList", {
        defaultValue: "Request Price List",
      }),
    };
  }

  if (pricePresentation?.mode === "hidden") {
    return {
      action: hasWhatsApp ? "whatsapp" : "details",
      label: t("localProjects.ctaSecondaryLatestPrice", {
        defaultValue: "Get Latest Price",
      }),
    };
  }

  if (
    investmentOpportunity ||
    citizenshipOpportunity ||
    isInstallmentProperty(project)
  ) {
    return {
      action: hasWhatsApp ? "whatsapp" : "details",
      label: t("localProjects.ctaSecondaryPriceList", {
        defaultValue: "Request Price List",
      }),
    };
  }

  return {
    action: hasWhatsApp ? "whatsapp" : "details",
    label: hasWhatsApp
      ? t("localProjects.ctaSecondaryWhatsApp", {
          defaultValue: "Chat on WhatsApp",
        })
      : t("localProjects.ctaSecondaryAdvisor", {
          defaultValue: "Contact Advisor",
        }),
  };
};

export const getProjectSupportItems = (project, { t } = {}) => {
  const installmentMonths = getInstallmentMonths(project);
  const items = [];

  if (installmentMonths > 0) {
    items.push({
      key: "installment",
      priority: 100,
      label: t("localProjects.supportInstallments", {
        defaultValue: "Installments",
      }),
      value: t("localProjects.supportInstallmentsValue", {
        count: installmentMonths,
        defaultValue: `${installmentMonths} months`,
      }),
    });
  }

  if (project?.deliveryDate) {
    items.push({
      key: "delivery",
      priority: isReadyProject(project) ? 55 : 90,
      label: t("localProjects.supportDelivery", {
        defaultValue: "Delivery",
      }),
      value: project.deliveryDate,
    });
  }

  const deedStatus = pickText(project?.titleDeedStatus, project?.deedStatus);
  if (deedStatus) {
    items.push({
      key: "deed",
      priority: 80,
      label: t("localProjects.supportTitleDeed", {
        defaultValue: "Title deed",
      }),
      value: deedStatus,
    });
  } else if (hasTitleDeedReady(project)) {
    items.push({
      key: "deed-ready",
      priority: 80,
      label: t("localProjects.supportTitleDeed", {
        defaultValue: "Title deed",
      }),
      value: t("localProjects.supportTitleDeedReady", {
        defaultValue: "Ready",
      }),
    });
  }

  if (isInvestmentProject(project)) {
    items.push({
      key: "investment",
      priority: 42,
      label: t("localProjects.supportInvestment", {
        defaultValue: "Investor fit",
      }),
      value: t("localProjects.supportInvestmentValue", {
        defaultValue: "Suitable",
      }),
    });
  }

  return items
    .sort((left, right) => (right.priority || 0) - (left.priority || 0))
    .slice(0, 2)
    .map(({ priority, ...item }) => item);
};

export const buildProjectWhatsAppMessage = (
  project,
  { t } = {}
) => {
  const projectTitle = pickText(project?.title, project?.name, "this project");
  const locationLabel = getProjectLocationLabel(project);
  if (locationLabel) {
    return t("localProjects.whatsappInquiryMessage", {
      project: projectTitle,
      location: locationLabel,
      defaultValue: `Hello, I am interested in ${projectTitle} in ${locationLabel}. Please share the latest price and availability.`,
    });
  }

  return t("localProjects.whatsappInquiryMessageNoLocation", {
    project: projectTitle,
    defaultValue: `Hello, I am interested in ${projectTitle}. Please share the latest price and availability.`,
  });
};
