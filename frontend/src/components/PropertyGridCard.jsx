import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PropTypes from "prop-types";
import { MdLocationOn } from "react-icons/md";
import HeartBtn from "./HeartBtn";
import { getOptimizedImageUrl } from "../utils/media";
import { getPropertySignals } from "../utils/contentGraph";
import { resolveProjectPath, resolvePropertyPath } from "../utils/seo";

// Get category display name (bilingual)
const getCategoryLabel = (category, propertyType, lang = "tr") => {
  const labels = {
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
  
  const currentLabels = labels[lang] || labels.tr;
  
  if (propertyType === "local-project" || propertyType === "international-project") {
    return currentLabels[propertyType];
  }
  
  return currentLabels[category] || category || currentLabels.default;
};

const pickText = (...values) => {
  for (const value of values) {
    if (value === null || value === undefined) continue;
    const normalized = String(value).trim();
    if (normalized) return normalized;
  }
  return "";
};

const getDistrictLabel = (property) => {
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

const BADGE_TONE_CLASSES = {
  emerald: "border-emerald-200/80 bg-white/95 text-emerald-700",
  amber: "border-amber-200/80 bg-white/95 text-amber-700",
  sky: "border-sky-200/80 bg-white/95 text-sky-700",
  slate: "border-slate-200/80 bg-white/95 text-slate-700",
  stone: "border-stone-200/80 bg-white/95 text-stone-700",
  rose: "border-rose-200/80 bg-white/95 text-rose-700",
};

const normalizeText = (value = "") =>
  String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const hasReadyStatus = (property) => {
  if (property?.readyToMove === true) return true;
  const statusText = normalizeText(
    [property?.listingStatus, property?.projectStatus, property?.status]
      .filter(Boolean)
      .join(" ")
  );
  return ["ready", "hazir", "tamamlandi", "completed"].some((token) =>
    statusText.includes(token)
  );
};

const hasTitleDeedReady = (property) => {
  const deedStatus = normalizeText([property?.titleDeedStatus, property?.deedStatus].filter(Boolean).join(" "));
  return ["title deed", "tapu", "kat mulkiyeti"].some((token) =>
    deedStatus.includes(token)
  );
};

const hasSpecialOffer = (property) => Boolean(property?.hasSpecialOffer || property?.offBadge);

const buildBadges = (property) => {
  const signals = getPropertySignals(property);
  const badges = [
    hasSpecialOffer(property)
      ? { key: "specialOffer", tone: "rose" }
      : null,
    signals.citizenship
      ? { key: "citizenship", tone: "emerald" }
      : null,
    signals.installment
      ? { key: "installment", tone: "sky" }
      : null,
    signals.intents.includes("investment")
      ? { key: "investment", tone: "amber" }
      : null,
    hasReadyStatus(property)
      ? { key: "ready", tone: "slate" }
      : null,
    hasTitleDeedReady(property)
      ? { key: "titleDeed", tone: "emerald" }
      : null,
  ]
    .filter(Boolean)
    .slice(0, 3);

  return badges;
};

const PropertyGridCard = ({ property }) => {
  const { i18n } = useTranslation();
  const propertyRoute =
    property?.propertyType === "local-project" ||
    property?.propertyType === "international-project"
      ? resolveProjectPath(property)
      : resolvePropertyPath(property);
  const isProject =
    property?.propertyType === "local-project" ||
    property?.propertyType === "international-project";
  const districtLabel = getDistrictLabel(property);
  const cityLabel = pickText(property?.city, property?.addressDetails?.city);
  const countryLabel = pickText(property?.country, property?.addressDetails?.country);
  const displayTitle = isProject
    ? pickText(
        property?.projectName,
        property?.title,
        property?.name,
        districtLabel,
        cityLabel,
        countryLabel,
        "Project"
      )
    : pickText(
        property?.title,
        property?.name,
        property?.projectName,
        districtLabel,
        cityLabel,
        countryLabel,
        "Property"
      );
  const displayLocation = isProject
    ? joinUniqueParts(districtLabel, cityLabel, countryLabel)
    : joinUniqueParts(
        pickText(property?.address, districtLabel),
        cityLabel,
        countryLabel
      );
  const badges = buildBadges(property);
  const showOfferRibbon = hasSpecialOffer(property);

  return (
    <article
      className="group flex h-full min-h-[388px] flex-col overflow-hidden rounded-[28px] border border-[#e7dece] bg-[linear-gradient(180deg,#ffffff_0%,#fcfaf6_100%)] shadow-[0_22px_60px_-40px_rgba(15,23,42,0.4)] transition duration-300 hover:-translate-y-1 hover:border-[#d8c7aa] hover:shadow-[0_28px_72px_-36px_rgba(15,23,42,0.42)]"
    >
      <div className="relative overflow-hidden">
        <Link
          to={propertyRoute}
          className="block overflow-hidden"
          aria-label={displayTitle}
        >
          <div className="relative aspect-[16/10] overflow-hidden">
            <img
              src={getOptimizedImageUrl(property.image, { width: 1200, height: 780 })}
              alt={displayTitle}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.06)_0%,rgba(15,23,42,0.14)_34%,rgba(15,23,42,0.72)_100%)]" />
          </div>
        </Link>

        <div className="absolute left-4 top-4 z-10 flex max-w-[78%] flex-wrap gap-2">
          {badges.map((badge) => (
            <span
              key={badge.key}
              className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold tracking-[0.08em] backdrop-blur ${
                BADGE_TONE_CLASSES[badge.tone] || BADGE_TONE_CLASSES.slate
              }`}
            >
              {i18n.t(`localProjects.badges.${badge.key}`)}
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
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div>
          <Link to={propertyRoute} aria-label={displayTitle}>
            <h3 className="line-clamp-2 text-[1rem] font-semibold leading-snug text-slate-800 transition group-hover:text-slate-900 sm:text-[1.05rem]">
              {displayTitle}
            </h3>
          </Link>

          <div className="mt-2 flex items-start gap-1.5 text-[13px] leading-snug text-slate-600">
            <MdLocationOn className="mt-0.5 h-4 w-4 shrink-0 text-[#b16b2d]" />
            <p className="line-clamp-2">
              {displayLocation || i18n.t("listing.locationPlaceholder")}
            </p>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <span className="inline-flex items-center rounded-full border border-[#ecdfcb] bg-white/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">
            {getCategoryLabel(property.category, property.propertyType, i18n.language)}
          </span>
        </div>
      </div>

      <div className="absolute bottom-4 right-4 z-20">
        <HeartBtn
          id={String(property?.id)}
          size={18}
          className="rounded-full bg-white/96 p-2.5 shadow-[0_12px_24px_-16px_rgba(15,23,42,0.65)] backdrop-blur"
        />
      </div>
    </article>
  );
};

PropertyGridCard.propTypes = {
  property: PropTypes.shape({
    id: PropTypes.string,
    image: PropTypes.string,
    title: PropTypes.string,
    projectName: PropTypes.string,
    name: PropTypes.string,
    address: PropTypes.string,
    district: PropTypes.string,
    city: PropTypes.string,
    country: PropTypes.string,
    propertyType: PropTypes.string,
    category: PropTypes.string,
    addressDetails: PropTypes.shape({
      city: PropTypes.string,
      country: PropTypes.string,
      district: PropTypes.string,
    }),
    facilities: PropTypes.shape({
      bedrooms: PropTypes.number,
      bathrooms: PropTypes.number,
      parkings: PropTypes.number,
    }),
  }).isRequired,
};

export default PropertyGridCard;
