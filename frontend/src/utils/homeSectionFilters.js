import { getPropertyDistrict } from "./contentGraph";
import { getPropertyComparablePrice } from "./propertyPricing";

const normalizeText = (value) =>
  String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const toArray = (value) => (Array.isArray(value) ? value : []);

const includesAnyKeyword = (text, keywords) => keywords.some((keyword) => text.includes(keyword));

const SEA_VIEW_KEYWORDS = [
  "sea view",
  "deniz manzara",
  "denize sifir",
  "denize yakin",
  "ocean view",
  "waterfront",
  "marina view",
  "bogaz manzara",
];

const INSTALLMENT_KEYWORDS = [
  "installment",
  "payment plan",
  "taksit",
  "taksitli",
  "down payment",
];

const READY_KEYWORDS = [
  "ready",
  "move in",
  "completed",
  "tamamlandi",
  "teslime hazir",
  "oturuma hazir",
  "anahtar teslim",
  "bos",
  "kiraci",
  "mulk sahibi",
  "mulk-sahibi",
];

const OFFPLAN_KEYWORDS = [
  "off plan",
  "off-plan",
  "offplan",
  "under construction",
  "construction",
  "insaat halinde",
  "devam ediyor",
  "devam-ediyor",
  "pre sale",
];

const CITIZENSHIP_MIN_USD = 400000;

const getSpecialOffers = (property) => {
  const offers = toArray(property?.projeHakkinda?.specialOffers);
  const legacyOffer = property?.projeHakkinda?.specialOffer;
  if (legacyOffer && typeof legacyOffer === "object") {
    offers.push(legacyOffer);
  }
  return offers;
};

const getRoomTypeValues = (property) => {
  const directRoomValues = [
    property?.rooms,
    ...(Array.isArray(property?.propertyTypes) ? property.propertyTypes : []),
  ];

  const specialOfferRoomValues = getSpecialOffers(property).flatMap((offer) => [
    offer?.roomType,
    offer?.title,
  ]);

  return [...directRoomValues, ...specialOfferRoomValues]
    .flatMap((value) => {
      if (Array.isArray(value)) return value;
      if (value && typeof value === "object") {
        return [value?.roomType, value?.tip, value?.type, value?.label, value?.name];
      }
      return [value];
    })
    .filter(Boolean);
};

const parseRoomCount = (value) => {
  const normalized = normalizeText(value).replace(/\s+/g, "");
  if (!normalized) return null;

  if (normalized.includes("studio") || normalized.includes("studyo")) {
    return 0;
  }

  const plusMatch = normalized.match(/(\d+)\+/);
  if (plusMatch) {
    return parseInt(plusMatch[1], 10);
  }

  const numericMatch = normalized.match(/^(\d+)/);
  if (numericMatch) {
    return parseInt(numericMatch[1], 10);
  }

  return null;
};

const collectPropertySearchText = (property) => {
  const directTexts = [
    property?.title,
    property?.name,
    property?.projectName,
    property?.description,
    property?.description_tr,
    property?.description_en,
    property?.description_ru,
    property?.address,
    property?.district,
    property?.ilce,
    property?.city,
    property?.country,
    property?.addressDetails?.district,
    property?.addressDetails?.city,
    property?.addressDetails?.country,
    getPropertyDistrict(property),
    property?.category,
    property?.propertyType,
    property?.usageStatus,
    property?.projectStatus,
    property?.listingStatus,
    property?.deedStatus,
    property?.kampanya,
    property?.projeHakkinda?.locationLabel,
  ];

  const staticFeatureValues = [
    ...toArray(property?.interiorFeatures),
    ...toArray(property?.exteriorFeatures),
    ...toArray(property?.muhitFeatures),
    ...toArray(property?.manzaraFeatures),
    ...toArray(property?.binaOzellikleri),
    ...toArray(property?.disOzellikler),
    ...toArray(property?.engelliYasliUygun),
    ...toArray(property?.eglenceAlisveris),
    ...toArray(property?.guvenlik),
    ...toArray(property?.manzara),
    ...toArray(property?.muhit),
  ];

  const ozelliklerValues =
    property?.ozellikler && typeof property.ozellikler === "object"
      ? Object.values(property.ozellikler).flatMap((value) => toArray(value))
      : [];

  const specialOfferValues = getSpecialOffers(property).flatMap((offer) => [
    offer?.title,
    offer?.roomType,
    offer?.locationLabel,
    offer?.description,
    offer?.paymentPlan,
  ]);

  const roomTypeValues = getRoomTypeValues(property);

  return normalizeText([
    ...directTexts,
    ...staticFeatureValues,
    ...ozelliklerValues,
    ...roomTypeValues,
    ...specialOfferValues,
  ].filter(Boolean).join(" "));
};

const normalizeListingStatus = (value) => {
  const normalized = normalizeText(value);
  if (["ready", "hazir", "tamamlandi", "completed"].includes(normalized)) {
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
      "under-construction",
      "insaat halinde",
      "insaat-halinde",
    ].includes(normalized)
  ) {
    return "offplan";
  }
  return "";
};

const isInstallmentProperty = (property, searchableText) => {
  const hasInstallmentInOffers = getSpecialOffers(property).some(
    (offer) => Number(offer?.installmentMonths || 0) > 0
  );
  if (hasInstallmentInOffers) return true;
  return includesAnyKeyword(searchableText, INSTALLMENT_KEYWORDS);
};

const getReadyOffPlanState = (property, searchableText) => {
  const explicitStatus = normalizeListingStatus(property?.listingStatus);
  if (explicitStatus) return explicitStatus;

  const statusText = normalizeText(`${property?.usageStatus || ""} ${property?.projectStatus || ""}`);
  if (includesAnyKeyword(statusText, OFFPLAN_KEYWORDS)) return "offplan";
  if (includesAnyKeyword(statusText, READY_KEYWORDS)) return "ready";
  if (includesAnyKeyword(searchableText, OFFPLAN_KEYWORDS)) return "offplan";
  if (includesAnyKeyword(searchableText, READY_KEYWORDS)) return "ready";
  return null;
};

const matchesQuickAccessFilters = (
  property,
  quickFilters,
  { convertAmount, defaultCurrency = "USD" } = {}
) => {
  const searchableText = collectPropertySearchText(property);

  if (quickFilters.seaView && !includesAnyKeyword(searchableText, SEA_VIEW_KEYWORDS)) {
    return false;
  }

  if (quickFilters.installmentAvailable && !isInstallmentProperty(property, searchableText)) {
    return false;
  }

  if (quickFilters.citizenshipEligible) {
    const priceInUsd = getPropertyComparablePrice(property, {
      convertAmount,
      comparisonCurrency: "USD",
      defaultCurrency,
    });

    if (!property.gyo || priceInUsd < CITIZENSHIP_MIN_USD) {
      return false;
    }
  }

  if (quickFilters.status) {
    const resolvedStatus = getReadyOffPlanState(property, searchableText);
    if (resolvedStatus !== quickFilters.status) {
      return false;
    }
  }

  return true;
};

const getPropertyRoomsCount = (property, roomsFilter) => {
  const targetRoomCount = roomsFilter === "5+" ? 5 : parseInt(roomsFilter, 10);
  const roomCandidates = getRoomTypeValues(property);

  const hasMatchingRoomCandidate = roomCandidates.some((candidate) => {
    const roomCount = parseRoomCount(candidate);
    if (roomCount === null) return false;

    if (roomsFilter === "0") return roomCount === 0;
    if (roomsFilter === "5+") return roomCount >= 5;
    return roomCount === targetRoomCount;
  });

  if (hasMatchingRoomCandidate) {
    return true;
  }

  const bedrooms = Number(property?.facilities?.bedrooms || 0);
  if (roomsFilter === "0") return bedrooms === 0;
  if (roomsFilter === "5+") return bedrooms >= 5;
  return bedrooms === targetRoomCount;
};

const matchesTextQuery = (property, query) => {
  if (!query) return true;
  return collectPropertySearchText(property).includes(query);
};

export const filterHomeSectionProperties = (
  data,
  {
    searchValue = "",
    categoryFilter = null,
    priceRange = { min: "", max: "" },
    roomsFilter = "",
    quickFilters = {
      seaView: false,
      installmentAvailable: false,
      citizenshipEligible: false,
      status: "",
    },
  } = {},
  {
    section = "listings",
    convertAmount,
    defaultCurrency = "USD",
    comparisonCurrency = defaultCurrency,
  } = {}
) => {
  if (!Array.isArray(data)) return [];

  const query = normalizeText(searchValue);
  return data
    .filter((property) => {
      if (section === "local-projects") {
        return property.propertyType === "local-project";
      }

      return (
        property.propertyType !== "local-project" &&
        property.propertyType !== "international-project"
      );
    })
    .filter((property) => {
      if (categoryFilter) {
        return property.category === categoryFilter;
      }
      return true;
    })
    .filter((property) => {
      if (!priceRange?.min && !priceRange?.max) return true;
      const priceValue = getPropertyComparablePrice(property, {
        convertAmount,
        comparisonCurrency,
        defaultCurrency,
      });
      if (priceRange.min && priceValue < Number(priceRange.min)) return false;
      if (priceRange.max && priceValue > Number(priceRange.max)) return false;
      return true;
    })
    .filter((property) => {
      if (!roomsFilter) return true;
      return getPropertyRoomsCount(property, roomsFilter);
    })
    .filter((property) =>
      matchesQuickAccessFilters(property, quickFilters, {
        convertAmount,
        defaultCurrency,
      })
    )
    .filter((property) => matchesTextQuery(property, query));
};

export const getHomeSectionActiveFiltersCount = ({
  searchValue = "",
  categoryFilter = null,
  priceRange = { min: "", max: "" },
  roomsFilter = "",
  quickFilters = {},
} = {}) => {
  let count = 0;
  if (searchValue.trim()) count += 1;
  if (categoryFilter) count += 1;
  if (priceRange?.min || priceRange?.max) count += 1;
  if (roomsFilter) count += 1;
  if (quickFilters?.seaView) count += 1;
  if (quickFilters?.installmentAvailable) count += 1;
  if (quickFilters?.citizenshipEligible) count += 1;
  if (quickFilters?.status) count += 1;
  return count;
};
