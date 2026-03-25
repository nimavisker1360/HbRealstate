import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  MdSell,
  MdEmail,
} from "react-icons/md";
import { FaWhatsapp } from "react-icons/fa";
import PropTypes from "prop-types";
import CurrencyContext from "../context/CurrencyContext";
import { useContext } from "react";
import { getOptimizedImageUrl } from "../utils/media";
import { getPropertyDisplayPriceInfo } from "../utils/propertyPricing";
import { resolveProjectPath, resolvePropertyPath } from "../utils/seo";
import HeartBtn from "./HeartBtn";

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

const PropertyCard = ({ property, onCardClick }) => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { selectedCurrency, baseCurrency, rates, convertAmount, formatMoney } =
    useContext(CurrencyContext);
  const isForSale = property.propertyType === "sale" || !property.propertyType;
  const isLocalProject = property.propertyType === "local-project";
  const isInternationalProject = property.propertyType === "international-project";
  const isProject = isLocalProject || isInternationalProject;
  const getPropertyRoute = (targetProperty) =>
    targetProperty?.propertyType === "local-project" ||
    targetProperty?.propertyType === "international-project"
      ? resolveProjectPath(targetProperty)
      : resolvePropertyPath(targetProperty);

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
  const displayPrice = displayPriceInfo.amount;
  const displayPriceCurrency = displayPriceInfo.currency || sourceCurrency;
  const convertedDisplayPrice = convertAmount(
    displayPrice,
    displayPriceCurrency,
    displayCurrency
  );
  const convertedPrice = convertAmount(
    property.price,
    sourceCurrency,
    displayCurrency
  );
  const formattedDisplayPrice = formatMoney(
    convertedDisplayPrice,
    displayCurrency,
    i18n.language === "tr" ? "tr-TR" : "en-US"
  );
  const formattedPrice = formatMoney(
    convertedPrice,
    displayCurrency,
    i18n.language === "tr" ? "tr-TR" : "en-US"
  );

  // Get description based on current language
  const getDescription = () => {
    if (i18n.language?.startsWith("tr")) {
      return property.description_tr || property.description;
    }
    if (i18n.language?.startsWith("ru")) {
      return (
        property.description_ru ||
        property.description_en ||
        property.description_tr ||
        property.description
      );
    }
    return property.description_en || property.description_tr || property.description;
  };

  const handleCardClick = () => {
    if (onCardClick) {
      onCardClick(property.id, property.propertyType);
    } else {
      navigate(getPropertyRoute(property));
    }
  };

  const whatsappHref = `https://wa.me/905551234567?text=${encodeURIComponent(
    `Hi, I'm interested in the property: ${property.title} - ${formattedPrice}`
  )}`;

  const handleWhatsAppClick = (e) => {
    e.stopPropagation();
    window.open(whatsappHref, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      className="bg-white border-b border-gray-100 p-4 hover:bg-emerald-100/70 cursor-pointer transition-colors"
      onClick={handleCardClick}
    >
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Property Image */}
        <div className="relative w-full h-[200px] sm:w-[280px] sm:h-[180px] flex-shrink-0">
          <img
            src={getOptimizedImageUrl(property.image, { width: 760, height: 480 })}
            alt={property.title}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover rounded-lg"
          />
          {property.offBadge && (
            <div className="absolute top-3 right-3 z-10 rounded-md bg-rose-600 px-2.5 py-1 text-[11px] font-bold tracking-wide text-white shadow-sm">
              OFF
            </div>
          )}
          {/* Category Badge */}
          <div className="absolute top-3 left-3">
            <span className="flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold bg-green-500 text-white">
              <MdSell size={12} />
              {getCategoryLabel(property.category, property.propertyType, i18n.language)}
            </span>
          </div>
        </div>

        {/* Property Details */}
        <div className="flex-1 min-w-0">
          {/* Title Row */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 truncate">
                {property.title}
              </h3>
              <p className="text-sm text-gray-500">
                {property.address}, {property.city}, {property.country}
              </p>
            </div>
            {/* Favorite Button */}
            <HeartBtn
              id={property.id}
              size={20}
              className="relative z-10 flex-shrink-0 p-1"
            />
          </div>

          {/* Price */}
          <div className="mt-2">
            {isProject ? (
              // For projects - show "Starting from" price
              displayPrice > 0 ? (
                <div>
                  <span className="text-sm text-gray-500">{t("propertyCard.startingFrom", "Başlangıç fiyatı")}</span>
                  <span className="text-2xl font-bold text-green-600 ml-2">
                    {formattedDisplayPrice}
                  </span>
                </div>
              ) : (
                <span className="text-lg font-medium text-gray-500">{t("propertyCard.contactForPrice", "Fiyat için iletişime geçin")}</span>
              )
            ) : (
              // For regular properties
              <>
                <span className="text-2xl font-bold text-green-600">
                  {formattedPrice}
                </span>
                {!isForSale && (
                  <span className="text-sm text-gray-500 ml-1">/mo</span>
                )}
              </>
            )}
          </div>

          {/* Facilities */}
          {/* Description */}
          <p className="mt-2 text-sm text-gray-500 line-clamp-2">
            {getDescription()}
          </p>

          {/* Contact Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-3">
            <button
              onClick={handleWhatsAppClick}
              data-whatsapp-url={whatsappHref}
              className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#25D366] rounded-lg hover:bg-[#1da851] transition-colors"
            >
              <FaWhatsapp className="w-4 h-4" />
              WhatsApp
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(getPropertyRoute(property));
              }}
              className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors"
            >
              <MdEmail className="w-4 h-4" />
              Contact
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

PropertyCard.propTypes = {
  property: PropTypes.shape({
    id: PropTypes.string,
    image: PropTypes.string,
    title: PropTypes.string,
    address: PropTypes.string,
    city: PropTypes.string,
    country: PropTypes.string,
    description: PropTypes.string,
    price: PropTypes.number,
    currency: PropTypes.string,
    propertyType: PropTypes.string,
    offBadge: PropTypes.bool,
    facilities: PropTypes.shape({
      bedrooms: PropTypes.number,
      bathrooms: PropTypes.number,
      parkings: PropTypes.number,
    }),
    dairePlanlari: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        tip: PropTypes.string,
        varyant: PropTypes.string,
        metrekare: PropTypes.number,
        fiyat: PropTypes.number,
      })
    ),
  }).isRequired,
  onCardClick: PropTypes.func,
};

export default PropertyCard;
