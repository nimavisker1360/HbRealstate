import { Link, useNavigate } from "react-router-dom";
import useProperties from "../hooks/useProperties";
import { useEffect, useState, useRef, useMemo, useContext } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import {
  MdChevronLeft,
  MdChevronRight,
  MdLocationOn,
  MdSearch,
  MdKeyboardArrowDown,
  MdFilterList,
  MdClose,
  MdList,
  MdLocationCity,
  MdPublic,
} from "react-icons/md";
import CurrencyContext from "../context/CurrencyContext";
import useConsultants from "../hooks/useConsultants";
import HeartBtn from "./HeartBtn";
import { getOptimizedImageUrl } from "../utils/media";
import { getPropertyComparablePrice } from "../utils/propertyPricing";
import { resolvePropertyPath, resolveProjectPath } from "../utils/seo";

const normalizeText = (value) =>
  String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const toArray = (value) => (Array.isArray(value) ? value : []);

const pickText = (...values) => {
  for (const value of values) {
    if (value === null || value === undefined) continue;
    const normalized = String(value).trim();
    if (normalized) return normalized;
  }
  return "";
};

const joinUniqueParts = (...values) => {
  const seen = new Set();

  return values
    .map((value) => String(value || "").trim())
    .filter((value) => {
      if (!value) return false;
      const normalized = value.toLowerCase();
      if (seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    })
    .join(", ");
};

const HOME_LISTING_PRICE_THRESHOLD_TRY = 18000000;

const HOME_CARD_BADGE_TONES = {
  emerald: "border-emerald-200/80 bg-white/95 text-emerald-700",
  amber: "border-amber-200/80 bg-white/95 text-amber-700",
  sky: "border-sky-200/80 bg-white/95 text-sky-700",
  slate: "border-slate-200/80 bg-white/95 text-slate-700",
  stone: "border-stone-200/80 bg-white/95 text-stone-700",
  rose: "border-rose-200/80 bg-white/95 text-rose-700",
};

const LISTING_CATEGORY_LABELS = {
  tr: {
    "local-project": "Yurt İçi Proje",
    "international-project": "Yurt Dışı Proje",
    residential: "Konut",
    commercial: "Ticari",
    land: "Arsa",
    building: "Bina",
    villa: "Villa",
    "tourist-facility": "Turistik Tesis",
    timeshare: "Devre Mülk",
    default: "Satılık",
  },
  en: {
    "local-project": "Local Project",
    "international-project": "International Project",
    residential: "Residential",
    commercial: "Commercial",
    land: "Land",
    building: "Building",
    villa: "Villa",
    "tourist-facility": "Tourist Facility",
    timeshare: "Timeshare",
    default: "For Sale",
  },
};

const getListingCategoryLabel = (category, propertyType, lang = "tr") => {
  const currentLabels = LISTING_CATEGORY_LABELS[lang] || LISTING_CATEGORY_LABELS.tr;

  if (propertyType === "local-project" || propertyType === "international-project") {
    return currentLabels[propertyType];
  }

  return currentLabels[category] || category || currentLabels.default;
};

const HOME_LISTING_FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1502005097973-6a7082348e28?w=400&h=300&fit=crop";

const HomeListingCard = ({ property }) => {
  const { t, i18n } = useTranslation();
  const { baseCurrency, convertAmount } = useContext(CurrencyContext);

  const propertyRoute =
    property?.propertyType === "local-project" ||
    property?.propertyType === "international-project"
      ? resolveProjectPath(property)
      : resolvePropertyPath(property);
  const title = pickText(
    property?.title,
    property?.name,
    property?.projectName,
    property?.district,
    property?.city,
    property?.country,
    "Property"
  );
  const districtLabel = pickText(
    property?.addressDetails?.district,
    property?.district,
    property?.ilce
  );
  const cityLabel = pickText(property?.city, property?.addressDetails?.city);
  const countryLabel = pickText(property?.country, property?.addressDetails?.country);
  const locationLabel = joinUniqueParts(
    pickText(property?.address, districtLabel),
    cityLabel,
    countryLabel
  );
  const categoryLabel = getListingCategoryLabel(
    property?.category,
    property?.propertyType,
    i18n.language
  );
  const priceInTry = getPropertyComparablePrice(property, {
    convertAmount,
    comparisonCurrency: "TRY",
    defaultCurrency: baseCurrency,
  });
  const premiumEligible = priceInTry >= HOME_LISTING_PRICE_THRESHOLD_TRY;
  const showOfferRibbon = Boolean(property?.offBadge || property?.hasSpecialOffer);
  const badges = premiumEligible
    ? [
        { key: "citizenship", tone: "emerald" },
        { key: "investment", tone: "sky" },
      ]
    : [];

  return (
    <article
      data-home-listing-card
      className="group flex h-full min-h-[388px] w-[82vw] flex-none snap-start overflow-hidden rounded-[28px] border border-[#e7dece] bg-[linear-gradient(180deg,#ffffff_0%,#fcfaf6_100%)] shadow-[0_22px_60px_-40px_rgba(15,23,42,0.4)] transition duration-300 hover:-translate-y-1 hover:border-[#d8c7aa] hover:shadow-[0_28px_72px_-36px_rgba(15,23,42,0.42)] sm:w-[max(15rem,min(18.75rem,calc((100cqw-5.5rem)/4)))]"
      style={{ scrollSnapAlign: "start", scrollSnapStop: "always" }}
    >
      <Link to={propertyRoute} className="flex h-full w-full flex-col" aria-label={title}>
        <div className="relative overflow-hidden">
          <div className="relative aspect-[16/10] overflow-hidden">
            <img
              src={getOptimizedImageUrl(
                property?.images?.[0] || property?.image || HOME_LISTING_FALLBACK_IMAGE,
                { width: 1200, height: 780 }
              )}
              alt={title}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.06)_0%,rgba(15,23,42,0.14)_34%,rgba(15,23,42,0.72)_100%)]" />
          </div>

          <div className="absolute left-4 top-4 z-10 flex max-w-[78%] flex-wrap gap-2">
            {badges.map((badge) => (
              <span
                key={badge.key}
                className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold tracking-[0.08em] backdrop-blur ${
                  HOME_CARD_BADGE_TONES[badge.tone] || HOME_CARD_BADGE_TONES.slate
                }`}
              >
                {t(`localProjects.badges.${badge.key}`)}
              </span>
            ))}
          </div>

          {showOfferRibbon && (
            <div className="pointer-events-none absolute right-[-42px] top-6 z-20 rotate-45 bg-rose-600 px-12 py-1.5 shadow-[0_10px_25px_-12px_rgba(244,63,94,0.85)]">
              <span className="block font-serif text-[11px] font-black italic uppercase tracking-[0.26em] text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.18)]">
                off
              </span>
            </div>
          )}

          <div className="absolute bottom-4 right-4 z-20">
            <HeartBtn
              id={String(property?.id)}
              size={18}
              className="rounded-full bg-white/96 p-2.5 shadow-[0_12px_24px_-16px_rgba(15,23,42,0.65)] backdrop-blur"
            />
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
          <div>
            <h3 className="line-clamp-2 text-[1rem] font-semibold leading-snug text-slate-800 sm:text-[1.05rem]">
              {title}
            </h3>

            <div className="mt-2 flex items-start gap-1.5 text-[13px] leading-snug text-slate-600">
              <MdLocationOn className="mt-0.5 h-4 w-4 shrink-0 text-[#b16b2d]" />
              <p className="line-clamp-2">{locationLabel || t("listing.locationPlaceholder")}</p>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <span className="inline-flex items-center rounded-full border border-[#ecdfcb] bg-white/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">
              {categoryLabel}
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
};

HomeListingCard.propTypes = {
  property: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    title: PropTypes.string,
    name: PropTypes.string,
    projectName: PropTypes.string,
    image: PropTypes.string,
    images: PropTypes.arrayOf(PropTypes.string),
    address: PropTypes.string,
    city: PropTypes.string,
    country: PropTypes.string,
    district: PropTypes.string,
    propertyType: PropTypes.string,
    category: PropTypes.string,
    currency: PropTypes.string,
    price: PropTypes.number,
    addressDetails: PropTypes.shape({
      city: PropTypes.string,
      country: PropTypes.string,
      district: PropTypes.string,
    }),
  }).isRequired,
};

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

const CITIZENSHIP_KEYWORDS = [
  "citizenship eligible",
  "turkish citizenship",
  "citizenship",
  "vatandaslik",
  "vatandasliga uygun",
  "passport",
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

const includesAnyKeyword = (text, keywords) =>
  keywords.some((keyword) => text.includes(keyword));

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

const getSpecialOffers = (property) => {
  const offers = toArray(property?.projeHakkinda?.specialOffers);
  const legacyOffer = property?.projeHakkinda?.specialOffer;
  if (legacyOffer && typeof legacyOffer === "object") {
    offers.push(legacyOffer);
  }
  return offers;
};

const collectPropertySearchText = (property) => {
  const directTexts = [
    property?.title,
    property?.description,
    property?.description_tr,
    property?.description_en,
    property?.description_ru,
    property?.address,
    property?.city,
    property?.country,
    property?.usageStatus,
    property?.projectStatus,
    property?.listingStatus,
    property?.deedStatus,
    property?.kampanya,
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

  const allValues = [
    ...directTexts,
    ...staticFeatureValues,
    ...ozelliklerValues,
    ...specialOfferValues,
  ];

  return normalizeText(allValues.filter(Boolean).join(" "));
};

const isSeaViewProperty = (searchableText) =>
  includesAnyKeyword(searchableText, SEA_VIEW_KEYWORDS);

const isInstallmentProperty = (property, searchableText) => {
  const hasInstallmentInOffers = getSpecialOffers(property).some(
    (offer) => Number(offer?.installmentMonths || 0) > 0
  );
  if (hasInstallmentInOffers) return true;
  return includesAnyKeyword(searchableText, INSTALLMENT_KEYWORDS);
};

const isCitizenshipEligibleProperty = (searchableText) =>
  includesAnyKeyword(searchableText, CITIZENSHIP_KEYWORDS);

const getReadyOffPlanState = (property, searchableText) => {
  const explicitStatus = normalizeListingStatus(property?.listingStatus);
  if (explicitStatus) return explicitStatus;

  const statusText = normalizeText(
    `${property?.usageStatus || ""} ${property?.projectStatus || ""}`
  );
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

  if (quickFilters.seaView && !isSeaViewProperty(searchableText)) {
    return false;
  }

  if (
    quickFilters.installmentAvailable &&
    !isInstallmentProperty(property, searchableText)
  ) {
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

// Animated Card wrapper with IntersectionObserver
const AnimatedCard = ({ children, delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [delay]);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        isVisible 
          ? 'opacity-100 translate-y-0 scale-100 blur-0' 
          : 'opacity-0 translate-y-6 scale-95 blur-sm'
      }`}
    >
      {children}
    </div>
  );
};

AnimatedCard.propTypes = {
  children: PropTypes.node.isRequired,
  delay: PropTypes.number,
};

const Properties = ({ properties, showControls = true } = {}) => {
  const { t, i18n } = useTranslation();
  const { data, isError, isLoading } = useProperties();
  const { data: consultants = [] } = useConsultants();
  const navigate = useNavigate();
  const [headerVisible, setHeaderVisible] = useState(false);
  const headerRef = useRef(null);
  const trackRef = useRef(null);
  const viewportRef = useRef(null);
  const { selectedCurrency, baseCurrency, rates, convertAmount, formatMoney } =
    useContext(CurrencyContext);
  const displayCurrency =
    selectedCurrency && (selectedCurrency === baseCurrency || rates?.[selectedCurrency])
      ? selectedCurrency
      : baseCurrency;

  const [searchValue, setSearchValue] = useState("");
  const [consultantFilter, setConsultantFilter] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState(null);
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [roomsFilter, setRoomsFilter] = useState("");
  const [quickFilters, setQuickFilters] = useState({
    seaView: false,
    installmentAvailable: false,
    citizenshipEligible: false,
    status: "",
  });
  const includeProjectsByQuickFilters =
    quickFilters.seaView ||
    quickFilters.installmentAvailable ||
    quickFilters.citizenshipEligible ||
    Boolean(quickFilters.status);

  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showPriceDropdown, setShowPriceDropdown] = useState(false);
  const [showRoomsDropdown, setShowRoomsDropdown] = useState(false);

  const typeRef = useRef(null);
  const categoryRef = useRef(null);
  const priceRef = useRef(null);
  const roomsRef = useRef(null);

  useEffect(() => {
    const frameId = requestAnimationFrame(() => setHeaderVisible(true));
    return () => cancelAnimationFrame(frameId);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (typeRef.current && !typeRef.current.contains(event.target)) {
        setShowTypeDropdown(false);
      }
      if (categoryRef.current && !categoryRef.current.contains(event.target)) {
        setShowCategoryDropdown(false);
      }
      if (priceRef.current && !priceRef.current.contains(event.target)) {
        setShowPriceDropdown(false);
      }
      if (roomsRef.current && !roomsRef.current.contains(event.target)) {
        setShowRoomsDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const roomOptions = [
    { value: "0", label: t("listing.studio") },
    { value: "1", label: t("listing.room1") },
    { value: "2", label: t("listing.room2") },
    { value: "3", label: t("listing.room3") },
    { value: "4", label: t("listing.room4") },
    { value: "5+", label: t("listing.room5plus") },
  ];

  const propertyCategories = [
    { value: "residential", label: t("categories.residential") },
    { value: "villa", label: t("categories.villa") },
    { value: "commercial", label: t("categories.commercial") },
    { value: "land", label: t("categories.land") },
    { value: "residentialProjects", label: t("categories.residentialProjects") },
    { value: "building", label: t("categories.building") },
    { value: "timeshare", label: t("categories.timeshare") },
    { value: "touristFacility", label: t("categories.touristFacility") },
  ];

  const formatCurrency = (num) =>
    formatMoney(
      Number(num || 0),
      displayCurrency,
      i18n.language === "tr" ? "tr-TR" : "en-US"
    );

  const getPropertyConsultantId = (property) =>
    property?.consultantId ||
    property?.consultant?.id ||
    property?.consultant?._id ||
    null;

  const normalizeId = (value) =>
    value === null || value === undefined ? "" : String(value);

  const consultantPropertyCounts = useMemo(() => {
    if (!Array.isArray(data)) return {};
    const query = searchValue.trim().toLowerCase();
    const counts = {};

    data
      .filter((property) => {
        if (includeProjectsByQuickFilters) return true;
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
        if (!priceRange.min && !priceRange.max) return true;
        const priceValue = getPropertyComparablePrice(property, {
          convertAmount,
          comparisonCurrency: displayCurrency,
          defaultCurrency: baseCurrency,
        });
        if (priceRange.min && priceValue < Number(priceRange.min)) return false;
        if (priceRange.max && priceValue > Number(priceRange.max)) return false;
        return true;
      })
      .filter((property) => {
        if (!roomsFilter) return true;

        if (property.rooms) {
          const roomsValue = property.rooms.toLowerCase();
          const normalizedRooms = roomsValue.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          const roomMatch = roomsValue.match(/^(\d+)/);
          const roomCount = roomMatch ? parseInt(roomMatch[1], 10) : 0;

          if (roomsFilter === "0") {
            return (
              normalizedRooms.includes("studyo") ||
              normalizedRooms.includes("studio") ||
              roomCount === 0
            );
          }
          if (roomsFilter === "5+") {
            return roomCount >= 5;
          }
          return roomCount === parseInt(roomsFilter, 10);
        }

        const bedrooms = property.facilities?.bedrooms || 0;
        if (roomsFilter === "0") return bedrooms === 0;
        if (roomsFilter === "5+") return bedrooms >= 5;
        return bedrooms === parseInt(roomsFilter, 10);
      })
      .filter((property) =>
        matchesQuickAccessFilters(property, quickFilters, {
          convertAmount,
          defaultCurrency: baseCurrency,
        })
      )
      .filter((property) => {
        if (!query) return true;
        const title = property.title?.toLowerCase() || "";
        const city = property.city?.toLowerCase() || "";
        const country = property.country?.toLowerCase() || "";
        const address = property.address?.toLowerCase() || "";
        return (
          title.includes(query) ||
          city.includes(query) ||
          country.includes(query) ||
          address.includes(query)
        );
      })
      .forEach((property) => {
        const consultantId = normalizeId(getPropertyConsultantId(property));
        if (!consultantId) return;
        counts[consultantId] = (counts[consultantId] || 0) + 1;
      });

    return counts;
  }, [
    data,
    searchValue,
    categoryFilter,
    priceRange,
    roomsFilter,
    quickFilters,
    includeProjectsByQuickFilters,
    baseCurrency,
    displayCurrency,
    convertAmount,
  ]);

  const consultantOptions = useMemo(() => {
    const list = Array.isArray(consultants) ? consultants : [];
    const mapped = list
      .map((consultant) => {
        const id = normalizeId(consultant?.id || consultant?._id);
        if (!id) return null;
        return {
          value: id,
          label: consultant?.name || consultant?.fullName || t("listing.consultantUnknown"),
          image: consultant?.image || consultant?.photo || consultant?.avatar || null,
          count: consultantPropertyCounts[id] || 0,
        };
      })
      .filter(Boolean);

    return [{ value: null, label: t("listing.all"), icon: MdList }, ...mapped];
  }, [consultants, consultantPropertyCounts, t]);

  const getConsultantLabel = () => {
    if (!consultantFilter) return t("listing.all");
    const current = consultantOptions.find(
      (option) => normalizeId(option.value) === normalizeId(consultantFilter)
    );
    return current ? current.label : t("listing.consultantUnknown");
  };

  const getCategoryLabel = () => {
    if (!categoryFilter) return t("listing.propertyUses");
    const current = propertyCategories.find((cat) => cat.value === categoryFilter);
    return current ? current.label : t("listing.propertyUses");
  };

  const getPriceLabel = () => {
    if (priceRange.min || priceRange.max) {
      if (priceRange.min && priceRange.max) {
        return `${formatCurrency(priceRange.min)} - ${formatCurrency(priceRange.max)}`;
      }
      if (priceRange.min) return `${formatCurrency(priceRange.min)}+`;
      return `${t("listing.maxPrice")}: ${formatCurrency(priceRange.max)}`;
    }
    return t("listing.price");
  };

  const getRoomsLabel = () => {
    if (roomsFilter) {
      const option = roomOptions.find((item) => item.value === roomsFilter);
      return option ? option.label : t("listing.rooms");
    }
    return t("listing.rooms");
  };

  const projectPageOptions = [
    {
      value: "local",
      label: t("nav.localProjects"),
      icon: MdLocationCity,
      route: "/projects?projectType=local",
    },
    {
      value: "international",
      label: t("nav.internationalProjects"),
      icon: MdPublic,
      route: "/projects?projectType=international",
    },
  ];

  const handleProjectPageNavigation = (route) => {
    setShowTypeDropdown(false);
    navigate(route);
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchValue.trim()) count += 1;
    if (consultantFilter) count += 1;
    if (categoryFilter) count += 1;
    if (priceRange.min || priceRange.max) count += 1;
    if (roomsFilter) count += 1;
    if (quickFilters.seaView) count += 1;
    if (quickFilters.installmentAvailable) count += 1;
    if (quickFilters.citizenshipEligible) count += 1;
    if (quickFilters.status) count += 1;
    return count;
  }, [searchValue, consultantFilter, categoryFilter, priceRange, roomsFilter, quickFilters]);

  const toggleQuickFlag = (key) => {
    setQuickFilters((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const toggleQuickStatus = (status) => {
    setQuickFilters((prev) => ({
      ...prev,
      status: prev.status === status ? "" : status,
    }));
  };

  const baseFilteredProperties = useMemo(() => {
    if (!Array.isArray(data)) return [];
    const query = searchValue.trim().toLowerCase();

    return data
      .filter((property) => {
        if (includeProjectsByQuickFilters) return true;
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
        if (!priceRange.min && !priceRange.max) return true;
        const priceValue = getPropertyComparablePrice(property, {
          convertAmount,
          comparisonCurrency: displayCurrency,
          defaultCurrency: baseCurrency,
        });
        if (priceRange.min && priceValue < Number(priceRange.min)) return false;
        if (priceRange.max && priceValue > Number(priceRange.max)) return false;
        return true;
      })
      .filter((property) => {
        if (!roomsFilter) return true;

        if (property.rooms) {
          const roomsValue = property.rooms.toLowerCase();
          const normalizedRooms = roomsValue.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          const roomMatch = roomsValue.match(/^(\d+)/);
          const roomCount = roomMatch ? parseInt(roomMatch[1], 10) : 0;

          if (roomsFilter === "0") {
            return (
              normalizedRooms.includes("studyo") ||
              normalizedRooms.includes("studio") ||
              roomCount === 0
            );
          }
          if (roomsFilter === "5+") {
            return roomCount >= 5;
          }
          return roomCount === parseInt(roomsFilter, 10);
        }

        const bedrooms = property.facilities?.bedrooms || 0;
        if (roomsFilter === "0") return bedrooms === 0;
        if (roomsFilter === "5+") return bedrooms >= 5;
        return bedrooms === parseInt(roomsFilter, 10);
      })
      .filter((property) =>
        matchesQuickAccessFilters(property, quickFilters, {
          convertAmount,
          defaultCurrency: baseCurrency,
        })
      )
      .filter((property) => {
        if (!query) return true;
        const title = property.title?.toLowerCase() || "";
        const city = property.city?.toLowerCase() || "";
        const country = property.country?.toLowerCase() || "";
        const address = property.address?.toLowerCase() || "";
        return (
          title.includes(query) ||
          city.includes(query) ||
          country.includes(query) ||
          address.includes(query)
        );
      });
  }, [
    data,
    searchValue,
    categoryFilter,
    priceRange,
    roomsFilter,
    quickFilters,
    includeProjectsByQuickFilters,
    baseCurrency,
    displayCurrency,
    convertAmount,
  ]);

  const internalFilteredProperties = useMemo(() => {
    if (!consultantFilter) return baseFilteredProperties;
    return baseFilteredProperties.filter((property) => {
      const consultantId = normalizeId(getPropertyConsultantId(property));
      return consultantId === normalizeId(consultantFilter);
    });
  }, [baseFilteredProperties, consultantFilter]);

  const displayedProperties = Array.isArray(properties)
    ? properties
    : internalFilteredProperties;
  const isHomeCarousel = !showControls;

  const canScroll = displayedProperties.length > 4;

  const handleScroll = (direction) => {
    const viewport = viewportRef.current;
    const track = trackRef.current;

    if (!viewport || !track) return;

    void viewport.offsetHeight;

    const card = track.querySelector("[data-home-listing-card]");
    if (!card) return;

    const cards = track.querySelectorAll("[data-home-listing-card]");
    if (!cards || cards.length === 0) return;

    const firstCard = cards[0];
    const cardWidth = firstCard.getBoundingClientRect().width;
    const computedGap =
      parseFloat(window.getComputedStyle(track).columnGap?.replace("px", "") || "0") || 0;
    const gap = computedGap || 16;
    const viewportWidth = viewport.clientWidth;
    const isMobile = viewportWidth < 768;
    const currentScroll = viewport.scrollLeft;
    const maxScroll = viewport.scrollWidth - viewport.clientWidth;

    if (maxScroll <= 0) return;

    let target;
    if (isMobile) {
      const scrollAmount = cardWidth + gap;
      const currentCardIndex = Math.round(currentScroll / scrollAmount);

      if (direction === -1) {
        target = Math.max(0, (currentCardIndex - 1) * scrollAmount);
      } else {
        target = Math.min(maxScroll, (currentCardIndex + 1) * scrollAmount);
      }
    } else {
      const scrollAmount = (cardWidth + gap) * 1.5;
      if (direction === -1) {
        target = Math.max(0, currentScroll - scrollAmount);
      } else {
        target = Math.min(maxScroll, currentScroll + scrollAmount);
      }
    }

    viewport.scrollTo({
      left: target,
      behavior: "smooth",
    });
  };

  const handleAllFilters = () => {
    const params = new URLSearchParams();
    if (searchValue.trim()) params.set("search", searchValue.trim());
    if (consultantFilter) params.set("consultantId", consultantFilter);
    if (categoryFilter) params.set("category", categoryFilter);
    if (priceRange.min) params.set("minPrice", priceRange.min);
    if (priceRange.max) params.set("maxPrice", priceRange.max);
    if (roomsFilter) params.set("rooms", roomsFilter);
    if (quickFilters.seaView) params.set("seaView", "true");
    if (quickFilters.installmentAvailable) params.set("installmentAvailable", "true");
    if (quickFilters.citizenshipEligible) params.set("citizenshipEligible", "true");
    if (quickFilters.status) params.set("status", quickFilters.status);
    const queryString = params.toString();
    navigate(`/listing${queryString ? `?${queryString}` : ""}`);
  };

  if (isError) {
    return (
      <div className="max-padd-container py-16">
        <span className="text-red-500">{t("listing.errorFetching")}</span>
      </div>
    );
  }

  if (isLoading) {
    return (
      <section id="featured-properties" className="relative py-20 xl:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white via-slate-50 to-white" />
        <div className="max-padd-container relative z-10">
          {/* Loading Header */}
          <div className="text-center mb-14">
            <div className="h-8 w-48 bg-gray-200 rounded-full mx-auto mb-4 animate-pulse" />
            <div className="h-12 w-80 bg-gray-200 rounded-lg mx-auto mb-4 animate-pulse" />
            <div className="h-4 w-64 bg-gray-200 rounded mx-auto animate-pulse" />
          </div>
          {/* Loading Cards */}
          <div className="flex gap-4 overflow-hidden px-2 [container-type:inline-size]">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-[360px] w-[82vw] flex-none animate-pulse overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm sm:w-[max(15rem,min(18.75rem,calc((100cqw-5.5rem)/4)))]"
              >
                <div className="h-[65%] bg-slate-200" />
                <div className="space-y-3 p-5">
                  <div className="h-4 w-4/5 rounded bg-slate-200" />
                  <div className="h-10 rounded-2xl bg-slate-200" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      id="featured-properties"
      className={`relative overflow-visible ${isHomeCarousel ? "py-16 sm:py-20" : "py-20 xl:py-28"}`}
    >
      {/* Background - Clean White with subtle tint */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className={`absolute inset-0 ${
            isHomeCarousel
              ? "bg-gradient-to-b from-[#fdfcf9] via-[#f8f6f1] to-[#fdfcf9]"
              : "bg-gradient-to-br from-white via-slate-50 to-white"
          }`}
        />
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />
      </div>
      
      <div
        className={`relative z-10 ${
          isHomeCarousel
            ? "mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8"
            : "max-padd-container"
        }`}
      >
        {showControls && (
          <>
            {/* Section Header */}
            <div 
              ref={headerRef}
              className={`text-center mb-14 transition-all duration-1000 ${headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
            >
              <span className="investment-opportunities-pill relative mb-4 inline-block overflow-hidden rounded-md bg-emerald-500 px-4 py-1.5 text-sm font-medium text-white shadow-md">
                <span className="relative z-[1]">{t("properties.futureHomeAwaits")}</span>
              </span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800 mb-4">
                {t("properties.findDreamHere")}
              </h2>
              <p className="text-gray-500 max-w-2xl mx-auto">
                {t("properties.subtitle")}
              </p>
            </div>

            {/* Filter Bar */}
            <div className="relative z-30 mb-6 -mb-8 md:mb-8 md:-mb-10">
              <div className="rounded-2xl border border-gray-200/80 bg-white/90 shadow-[0_18px_40px_rgba(15,23,42,0.08)] backdrop-blur isolation-isolate">
            <div className="flex flex-col gap-3 p-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-3 sm:p-4">
              <div className="flex items-center gap-2 w-full sm:flex-1 sm:min-w-[260px]">
                {/* Location Search */}
                <div className="flex items-center gap-2 w-full min-w-0 bg-white border border-gray-200 rounded-xl px-3 py-2.5 shadow-sm focus-within:border-emerald-300 focus-within:ring-2 focus-within:ring-emerald-100">
                  <MdLocationOn className="text-gray-400 text-lg flex-shrink-0" />
                  <input
                    type="text"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    placeholder={t("listing.locationPlaceholder")}
                    className="w-full bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400"
                  />
                  {searchValue && (
                    <button
                      type="button"
                      onClick={() => setSearchValue("")}
                      className="text-gray-400 hover:text-gray-600"
                      aria-label={t("listing.clear")}
                    >
                      <MdClose size={16} />
                    </button>
                  )}
                  <MdSearch className="text-gray-400 text-lg flex-shrink-0" />
                </div>

                {/* Project Type Dropdown */}
                <div ref={typeRef} className="relative w-[132px] shrink-0 sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setShowTypeDropdown((prev) => !prev)}
                    className="flex w-full items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 transition hover:border-emerald-200 hover:bg-emerald-50"
                  >
                    <span className="flex-1 text-left">{t("nav.projects")}</span>
                    <MdKeyboardArrowDown
                      className={`transition-transform ${showTypeDropdown ? "rotate-180" : ""}`}
                    />
                  </button>

                  <div
                    className={`absolute top-full right-0 mt-2 w-[220px] max-w-[calc(100vw-2rem)] rounded-lg bg-white z-30 sm:left-0 sm:right-auto sm:min-w-[220px] sm:w-auto origin-top transition-all duration-300 ease-out ${
                      showTypeDropdown
                        ? "max-h-[320px] translate-y-0 opacity-100 border border-gray-200 shadow-lg py-1 pointer-events-auto"
                        : "max-h-0 -translate-y-2 opacity-0 border border-transparent shadow-none py-0 pointer-events-none"
                    }`}
                  >
                    <div className="max-h-[320px] overflow-y-auto">
                      {projectPageOptions.map((option) => {
                        const IconComponent = option.icon;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                              handleProjectPageNavigation(option.route);
                            }}
                            className="w-full px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-emerald-50"
                          >
                            <div className="flex items-center gap-3">
                              <div className="h-7 w-7 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center">
                                <IconComponent className="text-base" />
                              </div>
                              <span className="flex-1 text-left leading-tight whitespace-normal break-words">{option.label}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:flex-wrap sm:items-center sm:gap-3">
                {/* Category Filter Dropdown */}
                <div ref={categoryRef} className="relative col-span-2 sm:col-span-1 sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setShowCategoryDropdown((prev) => !prev)}
                    className="flex w-full items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 transition hover:border-emerald-200 hover:bg-emerald-50"
                  >
                    <span className="min-w-0 flex-1 truncate">{getCategoryLabel()}</span>
                    <MdKeyboardArrowDown
                      className={`transition-transform ${showCategoryDropdown ? "rotate-180" : ""}`}
                    />
                  </button>

                  {showCategoryDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-2 rounded-lg border border-gray-200 bg-white py-1 shadow-lg z-30 max-h-[280px] overflow-y-auto sm:right-auto sm:min-w-[220px]">
                      <button
                        type="button"
                        onClick={() => {
                          setCategoryFilter(null);
                          setShowCategoryDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                          !categoryFilter
                            ? "bg-emerald-50 text-emerald-700 font-medium"
                            : "text-gray-700 hover:bg-emerald-50"
                        }`}
                      >
                        {t("listing.allCategories")}
                      </button>
                      {propertyCategories.map((cat) => (
                        <button
                          key={cat.value}
                          type="button"
                          onClick={() => {
                            setCategoryFilter(cat.value);
                            setShowCategoryDropdown(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                            categoryFilter === cat.value
                              ? "bg-emerald-50 text-emerald-700 font-medium"
                              : "text-gray-700 hover:bg-emerald-50"
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Price Filter Dropdown */}
                <div ref={priceRef} className="relative col-span-1 sm:col-span-1 sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setShowPriceDropdown((prev) => !prev)}
                    className="flex w-full items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 transition hover:border-emerald-200 hover:bg-emerald-50"
                  >
                    <span className="min-w-0 flex-1 truncate">{getPriceLabel()}</span>
                    <MdKeyboardArrowDown
                      className={`transition-transform ${showPriceDropdown ? "rotate-180" : ""}`}
                    />
                  </button>

                  {showPriceDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-2 rounded-lg border border-gray-200 bg-white p-3 shadow-lg z-30 sm:right-auto sm:w-[260px]">
                      <h4 className="text-sm font-medium text-gray-800 mb-3">
                        {t("listing.priceRange")}
                      </h4>
                      <div className="flex items-center gap-2 mb-3">
                        <input
                          type="number"
                          value={priceRange.min}
                          onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                          placeholder={t("listing.minPrice")}
                          className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
                        />
                        <span className="text-gray-400">-</span>
                        <input
                          type="number"
                          value={priceRange.max}
                          onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                          placeholder={t("listing.maxPrice")}
                          className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowPriceDropdown(false)}
                        className="w-full py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 transition"
                      >
                        {t("listing.applyFilters")}
                      </button>
                    </div>
                  )}
                </div>

                {/* Rooms Filter Dropdown */}
                <div ref={roomsRef} className="relative col-span-1 sm:col-span-1 sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setShowRoomsDropdown((prev) => !prev)}
                    className="flex w-full items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 transition hover:border-emerald-200 hover:bg-emerald-50"
                  >
                    <span className="min-w-0 flex-1 truncate">{getRoomsLabel()}</span>
                    <MdKeyboardArrowDown
                      className={`transition-transform ${showRoomsDropdown ? "rotate-180" : ""}`}
                    />
                  </button>

                  {showRoomsDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-2 rounded-lg border border-gray-200 bg-white py-1 shadow-lg z-30 sm:right-auto sm:min-w-[160px]">
                      <button
                        type="button"
                        onClick={() => {
                          setRoomsFilter("");
                          setShowRoomsDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                          !roomsFilter
                            ? "bg-emerald-50 text-emerald-700 font-medium"
                            : "text-gray-700 hover:bg-emerald-50"
                        }`}
                      >
                        {t("listing.all")}
                      </button>
                      {roomOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            setRoomsFilter(option.value);
                            setShowRoomsDropdown(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                            roomsFilter === option.value
                              ? "bg-emerald-50 text-emerald-700 font-medium"
                              : "text-gray-700 hover:bg-emerald-50"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* All Filters Button */}
              <div className="w-full sm:w-auto flex justify-center">
                <button
                  type="button"
                  onClick={handleAllFilters}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-500 sm:w-auto"
                >
                  <MdFilterList />
                  <span>{t("listing.allFilters")}</span>
                  {activeFiltersCount > 0 && (
                    <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 border-t border-gray-200/80 px-3 pb-3 sm:px-4 sm:pb-4">
              <button
                type="button"
                onClick={() => toggleQuickFlag("seaView")}
                aria-pressed={quickFilters.seaView}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                  quickFilters.seaView
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                    : "border-gray-200 bg-white text-gray-600 hover:border-emerald-200 hover:bg-emerald-50"
                }`}
              >
                {t("listing.quickSeaView")}
              </button>

              <button
                type="button"
                onClick={() => toggleQuickFlag("installmentAvailable")}
                aria-pressed={quickFilters.installmentAvailable}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                  quickFilters.installmentAvailable
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                    : "border-gray-200 bg-white text-gray-600 hover:border-emerald-200 hover:bg-emerald-50"
                }`}
              >
                {t("listing.quickInstallmentAvailable")}
              </button>

              <div className="inline-flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => toggleQuickStatus("ready")}
                  aria-pressed={quickFilters.status === "ready"}
                  className={`rounded-md border px-2 py-1 text-[11px] font-semibold transition ${
                    quickFilters.status === "ready"
                      ? "border-emerald-500 bg-emerald-100 text-emerald-700"
                      : "border-gray-200 bg-white text-gray-600 hover:border-emerald-200 hover:bg-emerald-50"
                  }`}
                >
                  {t("listing.quickReady")}
                </button>
                <button
                  type="button"
                  onClick={() => toggleQuickStatus("offplan")}
                  aria-pressed={quickFilters.status === "offplan"}
                  className={`rounded-md border px-2 py-1 text-[11px] font-semibold transition ${
                    quickFilters.status === "offplan"
                      ? "border-emerald-500 bg-emerald-100 text-emerald-700"
                      : "border-gray-200 bg-white text-gray-600 hover:border-emerald-200 hover:bg-emerald-50"
                  }`}
                >
                  {t("listing.quickOffPlan")}
                </button>
              </div>

              <button
                type="button"
                onClick={() => toggleQuickFlag("citizenshipEligible")}
                aria-pressed={quickFilters.citizenshipEligible}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                  quickFilters.citizenshipEligible
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                    : "border-gray-200 bg-white text-gray-600 hover:border-emerald-200 hover:bg-emerald-50"
                }`}
              >
                {t("listing.quickCitizenshipEligible")}
              </button>
            </div>
              </div>
            </div>
          </>
        )}

        {/* Properties Carousel - Match the project section experience */}
        {displayedProperties.length > 0 ? (
          <>
            <div className="relative z-10 pt-8 md:pt-10">
              {canScroll && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleScroll(-1);
                    }}
                    className="absolute -left-3 top-1/2 z-30 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-md transition hover:bg-gray-100"
                    aria-label="Scroll left"
                  >
                    <MdChevronLeft size={22} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleScroll(1);
                    }}
                    className="absolute -right-3 top-1/2 z-30 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-md transition hover:bg-gray-100"
                    aria-label="Scroll right"
                  >
                    <MdChevronRight size={22} />
                  </button>
                </>
              )}

              <div
                className={`pointer-events-none absolute inset-y-0 left-0 z-10 w-8 sm:w-12 ${
                  isHomeCarousel
                    ? "bg-gradient-to-r from-[#fdfcf9] via-[#fdfcf9]/80 to-transparent"
                    : "bg-gradient-to-r from-white via-white/80 to-transparent"
                }`}
              />
              <div
                className={`pointer-events-none absolute inset-y-0 right-0 z-10 w-8 sm:w-12 ${
                  isHomeCarousel
                    ? "bg-gradient-to-l from-[#fdfcf9] via-[#fdfcf9]/80 to-transparent"
                    : "bg-gradient-to-l from-white via-white/80 to-transparent"
                }`}
              />

              <div
                ref={viewportRef}
                className="overflow-x-auto overflow-y-hidden pb-2 scroll-smooth scrollbar-hide w-full snap-x snap-mandatory px-2 [container-type:inline-size]"
                style={{
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                  WebkitOverflowScrolling: "touch",
                  scrollBehavior: "smooth",
                  scrollSnapType: "x mandatory",
                }}
              >
                <div
                  ref={trackRef}
                  className="flex gap-4 sm:gap-6"
                  style={{ width: "max-content", minWidth: "100%" }}
                >
                  {displayedProperties.map((property) => (
                    <HomeListingCard key={property.id} property={property} />
                  ))}
                </div>
              </div>
            </div>

            {isHomeCarousel && (
              <div className="mt-8 flex justify-center">
                <Link
                  to="/listing"
                  className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-7 py-3 text-sm font-semibold text-white shadow-[0_14px_28px_-16px_rgba(5,150,105,0.9)] transition hover:bg-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2"
                >
                  {t("properties.showMoreListingsButton")}
                </Link>
              </div>
            )}
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 px-6 py-16 text-center text-slate-500">
            {t("properties.noProperties")}
          </div>
        )}

      </div>
    </section>
  );
};

export default Properties;
