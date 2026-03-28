import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PropTypes from "prop-types";
import { MdLocationOn } from "react-icons/md";
import { useContext } from "react";
import CurrencyContext from "../context/CurrencyContext";
import { getOptimizedImageUrl } from "../utils/media";
import { getPropertyDisplayPriceInfo } from "../utils/propertyPricing";
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

const PropertyGridCard = ({ property }) => {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const { selectedCurrency, baseCurrency, rates, convertAmount, formatMoney } =
    useContext(CurrencyContext);
  const displayCurrency =
    selectedCurrency && (selectedCurrency === baseCurrency || rates?.[selectedCurrency])
      ? selectedCurrency
      : baseCurrency;
  const sourceCurrency = property.currency || baseCurrency;
  const displayPriceInfo = getPropertyDisplayPriceInfo(property, {
    convertAmount,
    comparisonCurrency: baseCurrency,
    defaultCurrency: baseCurrency,
  });
  const convertedPrice = convertAmount(
    displayPriceInfo.amount,
    displayPriceInfo.currency || sourceCurrency,
    displayCurrency
  );
  const formattedPrice = formatMoney(
    convertedPrice,
    displayCurrency,
    i18n.language === "tr" ? "tr-TR" : "en-US"
  );
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

  return (
    <div
      className="group bg-white rounded-xl overflow-hidden cursor-pointer transition-all duration-500 hover:shadow-xl hover:shadow-gray-300/50 border border-gray-400 hover:border-gray-500"
      onClick={() => navigate(propertyRoute)}
    >
      {/* Image */}
      <div className="relative overflow-hidden">
        <img
          src={getOptimizedImageUrl(property.image, { width: 520, height: 320 })}
          alt={displayTitle}
          loading="lazy"
          decoding="async"
          className="w-full h-[140px] object-cover transition-transform duration-500 group-hover:scale-110"
        />
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Price badge */}
        <div className="absolute top-2 right-2 px-2 py-1 bg-emerald-500 text-white text-xs font-semibold rounded-md shadow-lg">
          {formattedPrice}
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        {/* Title */}
        <h3 className="text-sm font-semibold text-gray-800 mb-1.5 line-clamp-1 group-hover:text-emerald-600 transition-colors duration-300">
          {displayTitle}
        </h3>

        {/* Address */}
        <div className="flex items-start gap-1 mb-2">
          <MdLocationOn className="text-emerald-500 mt-0.5 flex-shrink-0" size={14} />
          <p className="text-xs text-gray-500 line-clamp-1">
            {displayLocation}
          </p>
        </div>

        {/* Category Badge */}
        <div className="flex items-center pt-2 border-t border-gray-100">
          <div className="ml-auto">
            <span className="text-[10px] text-emerald-600 font-medium px-1.5 py-0.5 bg-emerald-50 rounded-full">
              {getCategoryLabel(property.category, property.propertyType, i18n.language)}
            </span>
          </div>
        </div>
      </div>
    </div>
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
    price: PropTypes.number,
    currency: PropTypes.string,
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
