import { useState, useMemo, useContext, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import CurrencyContext from "../context/CurrencyContext";
import { useMutation, useQuery } from "react-query";
import {
  Container,
  Grid,
  Paper,
  Button,
  Modal,
  Loader,
  Avatar,
} from "@mantine/core";
import {
  MdLocationOn,
  MdImage,
  MdPlayCircle,
  MdDescription,
  MdArrowBack,
  MdZoomIn,
  MdCampaign,
  MdPlayCircleOutline,
  MdVideocam,
  MdShowChart,
  MdCheck,
  MdClose,
  MdChevronLeft,
  MdChevronRight,
} from "react-icons/md";
import { FaKey } from "react-icons/fa";
import { FaCalendarPlus, FaPhone, FaRegClock, FaWhatsapp } from "react-icons/fa6";
import { 
  BsHouseDoor, 
  BsTree, 
  BsPeople, 
  BsCart4, 
  BsShieldCheck, 
  BsEye, 
  BsGeoAlt 
} from "react-icons/bs";
import { useAuth0 } from "@auth0/auth0-react";
import { toast } from "react-toastify";
import { getProperty, removeBooking } from "../utils/api";
import useAuthCheck from "../hooks/useAuthCheck";
import useConsultants from "../hooks/useConsultants";
import UserDetailContext from "../context/UserDetailContext";
import { normalizeWhatsAppNumber } from "../utils/common";
import { bilingualKey } from "../utils/bilingualToast";
import PhoneLink from "../components/PhoneLink";
import BookingModal from "../components/BookingModal";
import {
  getOptimizedImageUrl,
  getOptimizedVideoPosterUrl,
  getOptimizedVideoUrl,
} from "../utils/media";
import { extractObjectId, resolveProjectPath } from "../utils/seo";
import IstanbulMarketAnalytics from "../components/market/IstanbulMarketAnalytics";
import InquirySidebarCard from "../components/InquirySidebarCard";
import { getLocalizedAlt } from "../utils/mediaAlt";
import {
  buildCurrentReturnTo,
  consumePostLoginResume,
  savePostLoginResume,
} from "../utils/postLoginResume";
import {
  getProjectBadges,
  getProjectPricePresentation,
  getProjectBenefitLine,
  getProjectQuickFacts,
  getProjectDetailCTAs,
  getFloorPlanCTA,
  buildProjectWhatsAppMessage,
} from "../utils/projectDetailPresentation";
import { getProjectSpecialOfferPriceInfo } from "../utils/projectPriceUtils";

// All possible Bina Özellikleri (Building Features)
const ALL_BINA_OZELLIKLERI = [
  "Akıllı Ev",
  "Alarm (Yangın)",
  "Intercom Sistemi",
  "Kablo TV",
  "Jeneratör",
  "Ses Yalıtımı",
  "Su Deposu",
];

// All possible Dış Özellikler (Exterior Features)
const ALL_DIS_OZELLIKLER = [
  "Bahçe",
  "Buhar Odası",
  "Sauna",
  "Türk Hamamı",
  "SPA",
  "Otopark",
  "Havuz",
  "Çocuk Parkı",
  "Spor Alanı",
  "Peyzaj",
];

// All possible Engelli/Yaşlıya Uygun (Accessibility Features)
const ALL_ENGELLI_UYGUN = [
  "Engelli Asansörü",
  "Engelli Rampası",
  "Engelli WC",
  "Yaşlı Dostu Tasarım",
  "Görme Engelli Yardımcıları",
];

// All possible Eğlence & Alışveriş (Entertainment/Shopping)
const ALL_EGLENCE_ALISVERIS = [
  "AVM",
  "Restoran",
  "Cafe",
  "Sinema",
  "Fitness Salonu",
  "Çocuk Kulübü",
];

// All possible Güvenlik (Security Features)
const ALL_GUVENLIK = [
  "24 Saat Güvenlik",
  "Güvenlik Kamerası",
  "Kartlı Giriş Sistemi",
  "Yangın Merdiveni",
  "Yangın Söndürme Sistemi",
];

// All possible Manzara (View Features)
const ALL_MANZARA = [
  "Şehir Manzarası",
  "Deniz Manzarası",
  "Göl Manzarası",
  "Orman Manzarası",
  "Havuz Manzarası",
  "Bahçe Manzarası",
];

// All possible Muhit (Neighborhood Features)
const ALL_MUHIT = [
  "Metro",
  "Metrobüs",
  "Otobüs Durağı",
  "Okul",
  "Hastane",
  "Market",
  "Eczane",
  "Banka",
  "Park",
  "Cami",
  "Üniversite",
  "Alışveriş Merkezi",
  "Fuar",
  "İlkokul-Ortaokul",
  "Sağlık Ocağı",
];

// Feature translations (Turkish to English)
const FEATURE_TRANSLATIONS = {
  // Bina Özellikleri
  "Akıllı Ev": "Smart Home",
  "Alarm (Yangın)": "Fire Alarm",
  "Intercom Sistemi": "Intercom System",
  "Kablo TV": "Cable TV",
  "Jeneratör": "Generator",
  "Ses Yalıtımı": "Sound Insulation",
  "Su Deposu": "Water Tank",
  // Dış Özellikler
  "Bahçe": "Garden",
  "Buhar Odası": "Steam Room",
  "Otopark": "Parking",
  "Havuz": "Pool",
  "Çocuk Parkı": "Playground",
  "Spor Alanı": "Sports Area",
  "Peyzaj": "Landscaping",
  // Engelli/Yaşlıya Uygun
  "Engelli Asansörü": "Disabled Elevator",
  "Engelli Rampası": "Disabled Ramp",
  "Engelli WC": "Disabled WC",
  "Yaşlı Dostu Tasarım": "Elderly Friendly Design",
  "Görme Engelli Yardımcıları": "Visually Impaired Aids",
  // Eğlence/Alışveriş
  "AVM": "Shopping Mall",
  "Restoran": "Restaurant",
  "Cafe": "Cafe",
  "Sinema": "Cinema",
  "Fitness Salonu": "Fitness Center",
  "SPA": "SPA",
  "Sauna": "Sauna",
  "Türk Hamamı": "Turkish Bath",
  "Çocuk Kulübü": "Kids Club",
  // Güvenlik
  "24 Saat Güvenlik": "24/7 Security",
  "Güvenlik Kamerası": "Security Camera",
  "Kartlı Giriş Sistemi": "Card Access System",
  "Yangın Merdiveni": "Fire Escape",
  "Yangın Söndürme Sistemi": "Fire Suppression System",
  // Manzara
  "Şehir Manzarası": "City View",
  "Deniz Manzarası": "Sea View",
  "Göl Manzarası": "Lake View",
  "Orman Manzarası": "Forest View",
  "Havuz Manzarası": "Pool View",
  "Bahçe Manzarası": "Garden View",
  // Muhit
  "Metro": "Metro",
  "Metrobüs": "Metrobus",
  "Otobüs Durağı": "Bus Stop",
  "Okul": "School",
  "Hastane": "Hospital",
  "Market": "Market",
  "Eczane": "Pharmacy",
  "Banka": "Bank",
  "Park": "Park",
  "Cami": "Mosque",
  "Üniversite": "University",
  "Alışveriş Merkezi": "Shopping Center",
  "Fuar": "Fair",
  "İlkokul-Ortaokul": "Primary-Middle School",
  "Sağlık Ocağı": "Health Center",
};

// Helper function to get translated feature
const getTranslatedFeature = (feature, language) => {
  // Check if feature is bilingual format (e.g., "Havuz / Pool")
  if (feature && feature.includes(" / ")) {
    const parts = feature.split(" / ");
    if (language === "en") {
      return parts[1] || parts[0]; // Return English part
    }
    return parts[0]; // Return Turkish part
  }
  
  // Fallback to translation dictionary
  if (language === "en") {
    return FEATURE_TRANSLATIONS[feature] || feature;
  }
  return feature;
};

const formatDate = (dateString, showFullDate = false, locale = "en") => {
  if (!dateString) return null;
  const date = new Date(dateString);
  const localeCode = locale === "tr" ? "tr-TR" : "en-US";

  if (showFullDate) {
    return date.toLocaleDateString(localeCode, {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return date.toLocaleDateString(localeCode, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const getYouTubeEmbedUrl = (url) => {
  if (!url) return null;
  let videoId = null;
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtube.com")) {
      videoId = parsed.searchParams.get("v");
    } else if (parsed.hostname === "youtu.be") {
      videoId = parsed.pathname.slice(1);
    }
  } catch {
    return null;
  }
  return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
};

const hasSpecialOfferData = (specialOffer) =>
  Boolean(
    specialOffer &&
      (specialOffer.enabled ||
        specialOffer.title ||
        specialOffer.roomType ||
        Number(specialOffer.areaM2 || 0) > 0 ||
        Number(
          specialOffer.priceUSD ||
            specialOffer.priceGBP ||
            specialOffer.priceEUR ||
            specialOffer.priceTRY ||
            0
        ) > 0 ||
        Number(specialOffer.downPaymentAmount || 0) > 0 ||
        Number(specialOffer.downPaymentPercent || 0) > 0 ||
        Number(specialOffer.installmentMonths || 0) > 0 ||
        specialOffer.locationLabel ||
        Number(specialOffer.locationMinutes || 0) > 0)
  );

const inferDistrictFromRawProperty = (propertyData) => {
  const direct = String(
    propertyData?.district || propertyData?.addressDetails?.district || ""
  ).trim();
  if (direct) return direct;

  const city = String(
    propertyData?.city || propertyData?.addressDetails?.city || ""
  )
    .toLowerCase()
    .trim();

  const address = String(propertyData?.address || "").trim();
  if (!address) return "";

  const parts = address
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length <= 1) {
    const slashParts = address
      .split("/")
      .map((part) => part.trim())
      .filter(Boolean);
    if (slashParts.length > 0) return slashParts[0];
    const words = address.split(/\s+/).filter(Boolean);
    return words[0] || "";
  }

  const withoutCity = parts.filter((part) => part.toLowerCase() !== city);
  const districtCandidate =
    withoutCity.length > 1
      ? withoutCity[withoutCity.length - 1]
      : withoutCity[0] || "";

  return districtCandidate;
};

const ProjectDetail = ({ topSlot = null }) => {
  const { projectSlugOrId: routeProjectSlugOrId = "" } = useParams();
  const projectLookupKey = useMemo(() => {
    const normalized = String(routeProjectSlugOrId || "").trim();
    if (!normalized) return "";
    return extractObjectId(normalized) || normalized;
  }, [routeProjectSlugOrId]);
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const { validateLogin } = useAuthCheck();
  const { user, isAuthenticated } = useAuth0();
  const {
    currencies,
    selectedCurrency,
    baseCurrency,
    rates,
    convertAmount,
    formatMoney,
  } = useContext(CurrencyContext);
  const {
    userDetails: { token, bookings },
    setUserDetails,
  } = useContext(UserDetailContext);
  const displayCurrency =
    selectedCurrency && (selectedCurrency === baseCurrency || rates?.[selectedCurrency])
      ? selectedCurrency
      : baseCurrency;
  const priceLocale = i18n.language === "tr" ? "tr-TR" : "en-US";
  const currencyCodes = useMemo(() => {
    if (Array.isArray(currencies) && currencies.length > 0) {
      return currencies.map((currency) => currency.code);
    }
    return ["TRY", "USD", "EUR", "GBP"];
  }, [currencies]);
  const secondaryCurrencyCodes = useMemo(
    () => currencyCodes.filter((code) => code !== displayCurrency),
    [currencyCodes, displayCurrency]
  );

  const getSecondaryPrices = (amount, sourceCurrency) =>
    secondaryCurrencyCodes.map((code) => ({
      code,
      label: formatMoney(
        Math.floor(convertAmount(amount, sourceCurrency, code)),
        code,
        priceLocale
      ),
    }));

  const getFloorPlanPriceSummary = (plan) => {
    const amount = Math.floor(Number(plan?.fiyat || 0));
    const sourceCurrency = project.currency || baseCurrency;

    if (amount > 0) {
      const convertedAmount = Math.floor(
        convertAmount(amount, sourceCurrency, displayCurrency)
      );
      return {
        label: t("projectDetail.startingFromEyebrow", {
          defaultValue: "STARTING FROM",
        }),
        value: formatMoney(convertedAmount, displayCurrency, priceLocale),
        actionLabel: t("projectDetail.viewPlan", {
          defaultValue: "View Plan",
        }),
        isAvailable: true,
      };
    }

    return {
      label: t("projectDetail.price", { defaultValue: "Price" }),
      value: t("projectDetail.contactForDetails", {
        defaultValue: "Contact for Details",
      }),
      actionLabel: t("projectDetail.contactForDetails", {
        defaultValue: "Contact for Details",
      }),
      isAvailable: false,
    };
  };
  
  const [activeTab, setActiveTab] = useState("all");
  const [featuresTab, setFeaturesTab] = useState("binaOzellikleri");
  const [selectedImage, setSelectedImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [floorPlanModal, setFloorPlanModal] = useState({ open: false, plan: null });
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [showYouTube, setShowYouTube] = useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isLightboxMediaLoaded, setIsLightboxMediaLoaded] = useState(true);
  const [isMainVideoPreviewActive, setIsMainVideoPreviewActive] = useState(false);
  const [isMainVideoPreviewReady, setIsMainVideoPreviewReady] = useState(false);
  const [bookingModalOpened, setBookingModalOpened] = useState(false);
  const [inquiryModalOpen, setInquiryModalOpen] = useState(false);
  const [activeOverviewTab, setActiveOverviewTab] = useState("description");
  const openBookingModal = () => {
    if (!isAuthenticated || !project?.id) {
      savePostLoginResume({
        type: "project-booking",
        propertyId: project?.id || "",
        returnTo: buildCurrentReturnTo(),
      });
      validateLogin({ openModal: true });
      return;
    }
    setBookingModalOpened(true);
  };
  const scrollToInquirySidebar = () => {
    const inquirySection = document.querySelector("[data-inquiry-sidebar]");
    if (inquirySection) {
      inquirySection.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    setInquiryModalOpen(true);
  };
  const mainVideoPreviewRef = useRef(null);
  const mainGalleryTouchStartXRef = useRef(null);
  const lightboxTouchStartXRef = useRef(null);
  const mainGallerySwipeHandledRef = useRef(false);
  const lightboxSwipeHandledRef = useRef(false);
  const descriptionSectionRef = useRef(null);
  const marketSectionRef = useRef(null);

  // Fetch project data from API
  const { data: propertyData, isLoading, isError } = useQuery(
    ["project", projectLookupKey],
    () => getProperty(projectLookupKey),
    { enabled: Boolean(projectLookupKey) }
  );
  const { data: consultants, isLoading: consultantsLoading } = useConsultants();

  useEffect(() => {
    const routeValue = String(routeProjectSlugOrId || "").trim();
    if (!routeValue || !propertyData) return;
    const targetPath = resolveProjectPath(propertyData);
    if (!targetPath || targetPath === location.pathname) return;
    navigate(targetPath, { replace: true });
  }, [location.pathname, navigate, propertyData, routeProjectSlugOrId]);

  // Transform property data to project format
  const project = useMemo(() => {
    if (!propertyData) return null;
    
    // Combine images and videos into a single gallery array
    const images = propertyData.images || [];
    const videos = propertyData.videos || [];
    
    // Create gallery items with type indicator
    const galleryItems = [
      ...videos.map(url => ({ url, type: 'video' })),  // Videos first
      ...images.map(url => ({ url, type: 'image' })),
    ];
    
    // Build ozellikler from individual fields or existing ozellikler object
    const ozellikler = {
      binaOzellikleri: propertyData.binaOzellikleri || propertyData.ozellikler?.binaOzellikleri || [],
      disOzellikler: propertyData.disOzellikler || propertyData.ozellikler?.disOzellikler || [],
      engelliUygun: propertyData.engelliYasliUygun || propertyData.ozellikler?.engelliUygun || [],
      eglenceAlisveris: propertyData.eglenceAlisveris || propertyData.ozellikler?.eglenceAlisveris || [],
      guvenlik: propertyData.guvenlik || propertyData.ozellikler?.guvenlik || [],
      manzara: propertyData.manzara || propertyData.ozellikler?.manzara || [],
      muhit: propertyData.muhit || propertyData.ozellikler?.muhit || [],
    };
    
    const specialOffersFromArray = Array.isArray(propertyData.projeHakkinda?.specialOffers)
      ? propertyData.projeHakkinda.specialOffers.filter((offer) =>
          hasSpecialOfferData(offer)
        )
      : [];
    const legacySpecialOffer = propertyData.projeHakkinda?.specialOffer;
    const specialOffers =
      specialOffersFromArray.length > 0
        ? specialOffersFromArray
        : hasSpecialOfferData(legacySpecialOffer)
        ? [legacySpecialOffer]
        : [];

    const normalizedProjectPrice =
      Number(propertyData.price || 0) > 0
        ? Math.round(
            convertAmount(
              Number(propertyData.price || 0),
              propertyData.currency || baseCurrency,
              "USD"
            )
          )
        : 0;

    return {
      id: propertyData.id,
      name: propertyData.title,
      projectName: propertyData.projectName || "",
      propertyType: propertyData.propertyType || "",
      city: propertyData.city,
      district: inferDistrictFromRawProperty(propertyData),
      price: normalizedProjectPrice,
      currency: "USD",
      deliveryDate: propertyData.deliveryDate || "",
      images: propertyData.images || [],
      videos: propertyData.videos || [],
      galleryItems, // Combined gallery
      projeHakkinda: propertyData.projeHakkinda,
      dairePlanlari: propertyData.dairePlanlari || [],
      brochureUrl: propertyData.brochureUrl || "",
      ozellikler,
      kampanya: propertyData.kampanya,
      mapImage: propertyData.mapImage,
      ilanNo: propertyData.ilanNo || "",
      consultantId: propertyData.consultant?.id || propertyData.consultantId || "",
      gyo: Boolean(propertyData.gyo),
      specialOffer: specialOffers[0] || null,
      specialOffers,
      createdAt: propertyData.createdAt || "",
      updatedAt: propertyData.updatedAt || "",
    };
  }, [baseCurrency, convertAmount, propertyData]);

  const isBookableProject =
    project?.propertyType === "local-project" ||
    project?.propertyType === "international-project";
  const hasBookingMeta =
    Boolean(project?.createdAt) ||
    Boolean(project?.updatedAt && project?.updatedAt !== project?.createdAt);
  const bookedProjectVisit = bookings?.find((booking) => booking?.id === project?.id);

  useEffect(() => {
    if (!isAuthenticated || !project?.id) return;

    const resumeState = consumePostLoginResume(
      (entry) =>
        entry?.type === "project-booking" &&
        entry?.propertyId === project.id &&
        entry?.returnTo === buildCurrentReturnTo()
    );

    if (resumeState) {
      setBookingModalOpened(true);
    }
  }, [isAuthenticated, project?.id]);

  const { mutate: cancelBooking, isLoading: cancelling } = useMutation({
    mutationFn: () => removeBooking(project?.id, user?.email, token),
    onSuccess: () => {
      if (!project?.id) return;

      setUserDetails((prev) => ({
        ...prev,
        bookings: prev.bookings.filter((booking) => booking?.id !== project.id),
      }));

      toast.success(bilingualKey("booking.bookingCancelled"), {
        position: "bottom-right",
      });
    },
  });

  const projectConsultant = useMemo(() => {
    if (!propertyData) return null;
    if (propertyData.consultant) return propertyData.consultant;
    const consultantId = propertyData.consultantId;
    if (!consultantId || !Array.isArray(consultants)) return null;
    return consultants.find((consultant) => consultant.id === consultantId) || null;
  }, [propertyData, consultants]);

  const consultantTitle =
    projectConsultant &&
    (i18n.language === "tr"
      ? projectConsultant.title_tr || projectConsultant.title
      : projectConsultant.title_en || projectConsultant.title);

  const consultantWhatsApp = normalizeWhatsAppNumber(projectConsultant?.whatsapp);

  // Filter floor plans by room type
  const filteredPlans = useMemo(() => {
    if (!project?.dairePlanlari) return [];
    if (activeTab === "all") return project.dairePlanlari;
    return project.dairePlanlari.filter((plan) => plan.tip === activeTab);
  }, [project, activeTab]);

  // Get unique room types for tabs
  const roomTypes = useMemo(() => {
    if (!project?.dairePlanlari) return [];
    return [...new Set(project.dairePlanlari.map((plan) => plan.tip))];
  }, [project]);

  const getMainImageUrl = (url) =>
    getOptimizedImageUrl(url, { width: 1280, height: 860, quality: "auto:good" });
  const getThumbnailImageUrl = (url) =>
    getOptimizedImageUrl(url, { width: 320, height: 240, quality: "auto:good" });
  const getLightboxImageUrl = (url) =>
    getOptimizedImageUrl(url, {
      width: 1800,
      height: 1400,
      crop: "limit",
      quality: "auto:good",
    });
  const withOriginalSrcFallback = (originalUrl) => (event) => {
    if (!originalUrl) return;
    const currentSrc = event.currentTarget.getAttribute("src");
    if (currentSrc === originalUrl) {
      event.currentTarget.onerror = null;
      return;
    }
    event.currentTarget.setAttribute("src", originalUrl);
  };
  const getMainVideoPosterUrl = (url) =>
    getOptimizedVideoPosterUrl(url, { width: 1280, height: 860, quality: "auto:good" });
  const getThumbnailVideoPosterUrl = (url) =>
    getOptimizedVideoPosterUrl(url, { width: 320, height: 240, quality: "auto:good" });
  const getOptimizedProjectVideoUrl = (url) =>
    getOptimizedVideoUrl(url, { width: 1600, quality: "auto:good" });

  useEffect(() => {
    if (!project?.galleryItems?.length) return;

    const firstVideoIndex = project.galleryItems.findIndex(
      (item) => item?.type === "video" && item?.url
    );
    const firstImageIndex = project.galleryItems.findIndex(
      (item) => item?.type === "image" && item?.url
    );

    // Prefer video on initial load, then fallback to first image.
    if (firstVideoIndex >= 0) {
      setSelectedImage(firstVideoIndex);
      return;
    }

    setSelectedImage(firstImageIndex >= 0 ? firstImageIndex : 0);
  }, [project?.id, project?.galleryItems]);

  useEffect(() => {
    setIsMainVideoPreviewActive(false);
    setIsMainVideoPreviewReady(false);

    if (mainVideoPreviewRef.current) {
      mainVideoPreviewRef.current.pause();
      mainVideoPreviewRef.current.currentTime = 0;
    }
  }, [selectedImage, project?.id]);

  useEffect(() => {
    if (!project?.galleryItems?.length) return;

    const totalItems = project.galleryItems.length;
    const preloadIndexes = [selectedImage, selectedImage + 1, selectedImage + 2]
      .map((index) => index % totalItems)
      .filter((index, current, items) => items.indexOf(index) === current);

    preloadIndexes.forEach((index) => {
      const item = project.galleryItems[index];
      if (!item?.url) return;

      const preloadedImage = new Image();
      preloadedImage.src =
        item.type === "video"
          ? getMainVideoPosterUrl(item.url) || getThumbnailVideoPosterUrl(item.url)
          : getMainImageUrl(item.url);
    });
  }, [project, selectedImage]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const currentType = project?.galleryItems?.[selectedImage]?.type;
    setIsLightboxMediaLoaded(currentType === "video");
  }, [lightboxOpen, selectedImage, project]);

  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <Loader size="xl" />
      </div>
    );
  }

  if (isError || !project) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">{t("localProjects.noProjectsFound")}</p>
          <Button onClick={() => navigate("/projects")}>{t("common.back")}</Button>
        </div>
      </div>
    );
  }

  const specialOffersData = (project.specialOffers || []).filter((offer) =>
    hasSpecialOfferData(offer)
  );
  const primarySpecialOffer = specialOffersData[0] || null;
  const isSpecialOfferProject = Boolean(primarySpecialOffer);
  const showMarketAnalytics = project.propertyType !== "international-project";

  const goToPrevGalleryItem = () => {
    const totalItems = project?.galleryItems?.length || 0;
    if (totalItems <= 1) return;
    setSelectedImage((prev) => (prev === 0 ? totalItems - 1 : prev - 1));
  };

  const goToNextGalleryItem = () => {
    const totalItems = project?.galleryItems?.length || 0;
    if (totalItems <= 1) return;
    setSelectedImage((prev) => (prev === totalItems - 1 ? 0 : prev + 1));
  };

  const navigateBySwipe = (startX, endX) => {
    if (typeof startX !== "number" || typeof endX !== "number") return false;
    const deltaX = endX - startX;
    const swipeThreshold = 45;
    if (Math.abs(deltaX) < swipeThreshold) return false;

    if (deltaX > 0) {
      goToPrevGalleryItem();
    } else {
      goToNextGalleryItem();
    }
    return true;
  };

  const handleMainGalleryTouchStart = (event) => {
    mainGalleryTouchStartXRef.current = event.touches?.[0]?.clientX ?? null;
    mainGallerySwipeHandledRef.current = false;
  };

  const handleMainGalleryTouchEnd = (event) => {
    const startX = mainGalleryTouchStartXRef.current;
    const endX = event.changedTouches?.[0]?.clientX;
    mainGalleryTouchStartXRef.current = null;
    mainGallerySwipeHandledRef.current = navigateBySwipe(startX, endX);
  };

  const handleLightboxTouchStart = (event) => {
    lightboxTouchStartXRef.current = event.touches?.[0]?.clientX ?? null;
    lightboxSwipeHandledRef.current = false;
  };

  const handleLightboxTouchEnd = (event) => {
    const startX = lightboxTouchStartXRef.current;
    const endX = event.changedTouches?.[0]?.clientX;
    lightboxTouchStartXRef.current = null;
    lightboxSwipeHandledRef.current = navigateBySwipe(startX, endX);
  };

  const handleLightboxImageClick = (event) => {
    if (lightboxSwipeHandledRef.current) {
      lightboxSwipeHandledRef.current = false;
      return;
    }

    const totalItems = project?.galleryItems?.length || 0;
    if (totalItems <= 1) return;

    const { left, width } = event.currentTarget.getBoundingClientRect();
    const clickPosition = event.clientX - left;

    if (clickPosition < width / 2) {
      goToPrevGalleryItem();
      return;
    }

    goToNextGalleryItem();
  };

  const handleMainGalleryClick = (event) => {
    if (mainGallerySwipeHandledRef.current) {
      mainGallerySwipeHandledRef.current = false;
      return;
    }

    const currentItem = project?.galleryItems?.[selectedImage];
    if (currentItem?.type === "video") {
      stopMainVideoPreview();
      setCurrentVideoIndex(selectedImage);
      setVideoModalOpen(true);
      return;
    }

    const totalItems = project?.galleryItems?.length || 0;
    if (totalItems <= 1) return;

    const { left, width } = event.currentTarget.getBoundingClientRect();
    const clickPosition = event.clientX - left;

    if (clickPosition < width / 2) {
      goToPrevGalleryItem();
      return;
    }

    goToNextGalleryItem();
  };

  const scrollToSection = (sectionKey) => {
    setActiveOverviewTab(sectionKey);

    const sectionMap = {
      description: descriptionSectionRef,
      market: marketSectionRef,
    };
    sectionMap[sectionKey]?.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const selectedGalleryItem = project.galleryItems[selectedImage];
  const selectedVideoPoster =
    selectedGalleryItem?.type === "video"
      ? getMainVideoPosterUrl(selectedGalleryItem.url) ||
        getMainImageUrl(project.images?.[0] || "")
      : "";

  const startMainVideoPreview = () => {
    if (selectedGalleryItem?.type !== "video" || !selectedGalleryItem?.url) return;
    setIsMainVideoPreviewReady(false);
    setIsMainVideoPreviewActive(true);
  };

  const stopMainVideoPreview = () => {
    setIsMainVideoPreviewActive(false);
    setIsMainVideoPreviewReady(false);

    if (mainVideoPreviewRef.current) {
      mainVideoPreviewRef.current.pause();
      mainVideoPreviewRef.current.currentTime = 0;
    }
  };

  const detailBadges = getProjectBadges(project || propertyData, {
    convertAmount,
    defaultCurrency: baseCurrency,
    maxBadges: 2,
  });

  const detailPricePresentation = getProjectPricePresentation(
    project || propertyData,
    {
      t,
      language: i18n.language,
      convertAmount,
      formatMoney,
      displayCurrency,
      defaultCurrency: baseCurrency,
    }
  );

  const detailBenefitLine = getProjectBenefitLine(project || propertyData, {
    t,
    language: i18n.language,
    convertAmount,
    defaultCurrency: baseCurrency,
  });

  const detailQuickFacts = getProjectQuickFacts(project || propertyData, {
    t,
    convertAmount,
    defaultCurrency: baseCurrency,
  });

  const detailCTAs = getProjectDetailCTAs(propertyData, {
    t,
    consultantWhatsApp,
    consultantPhone: projectConsultant?.phone,
    isBookable: isBookableProject,
  });

  const galleryItemCount = project.galleryItems?.length || 0;
  const hasGalleryNav = galleryItemCount > 1;
  const hasYouTubeVideo = Boolean(getYouTubeEmbedUrl(project.brochureUrl));
  const secondaryCtas = detailCTAs.filter((cta) => cta.variant !== "primary");

  const BADGE_TONE_CLASSES = {
    rose: "bg-rose-50 text-rose-700 ring-rose-200",
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    slate: "bg-slate-100 text-slate-700 ring-slate-200",
    sky: "bg-sky-50 text-sky-700 ring-sky-200",
    amber: "bg-amber-50 text-amber-700 ring-amber-200",
    stone: "bg-stone-50 text-stone-600 ring-stone-200",
  };

  return (
    <div className="min-h-screen pt-20 bg-white">
      {/* Header */}
      <div className="border-b border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#fbfaf6_100%)]">
        <Container size="lg" className="py-4 sm:py-6">
          {topSlot ? <div className="mb-4">{topSlot}</div> : null}
          <div className="flex items-start gap-3 sm:gap-5">
            <button
              onClick={() => navigate(-1)}
              className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 sm:h-11 sm:w-11"
            >
              <MdArrowBack size={22} />
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex flex-col gap-3 sm:gap-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-start sm:gap-3">
                  {(project.projectName || project.name) && (
                    <h1 className="max-w-4xl text-[1.9rem] font-semibold leading-[1.08] tracking-[-0.035em] text-slate-900 sm:text-[2rem] lg:text-[2.2rem]">
                      {project.projectName || project.name}
                    </h1>
                  )}
                  {project.ilanNo && (
                    <span className="inline-flex w-fit items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold tracking-[0.14em] text-slate-500 shadow-sm sm:mt-1">
                      {project.ilanNo}
                    </span>
                  )}
                </div>

                {detailBadges.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    {detailBadges.map((badge) => (
                      <span
                        key={badge.key}
                        className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold ring-1 ring-inset ${
                          BADGE_TONE_CLASSES[badge.tone] || BADGE_TONE_CLASSES.slate
                        }`}
                      >
                        {t(`localProjects.badges.${badge.key}`, {
                          defaultValue: badge.key,
                        })}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 shadow-sm">
                    <MdLocationOn className="text-[#b16b2d]" />
                    <span>{[project.city, project.district].filter(Boolean).join(" / ")}</span>
                  </span>
                </div>

                {detailBenefitLine && (
                  <div className="max-w-4xl rounded-2xl border border-amber-200/70 bg-[linear-gradient(180deg,rgba(255,251,235,0.92)_0%,rgba(255,247,237,0.92)_100%)] px-4 py-3 text-sm leading-6 text-slate-700 shadow-[0_12px_28px_-22px_rgba(15,23,42,0.38)]">
                    <span className="mr-2 text-base">✨</span>
                    <span>{detailBenefitLine}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Container>
      </div>

      <Container size="lg" className="py-6">
        <Grid gutter="xl" align="flex-start">
          {/* Left Column - Main Content */}
          <Grid.Col span={{ base: 12, md: 8 }}>
            {/* Image Gallery */}
            <div className="mb-6 rounded-[28px] border border-slate-200 bg-white p-3 shadow-[0_22px_70px_-48px_rgba(15,23,42,0.32)] sm:p-4">
              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_132px] md:items-stretch">
                {/* Main Image/Video */}
                <div
                  className="group relative cursor-pointer overflow-hidden rounded-[22px] bg-slate-100"
                  onMouseEnter={startMainVideoPreview}
                  onMouseLeave={stopMainVideoPreview}
                  onTouchStart={handleMainGalleryTouchStart}
                  onTouchEnd={handleMainGalleryTouchEnd}
                  onClick={handleMainGalleryClick}
                >
                  {selectedGalleryItem?.type === "video" ? (
                    <>
                      {selectedVideoPoster ? (
                        <img
                          src={selectedVideoPoster}
                          alt={getLocalizedAlt(i18n.language, "projectVideoPreview", {
                            title: project.name,
                          })}
                          className="h-[280px] w-full object-cover sm:h-[360px] md:h-[460px]"
                          loading="eager"
                          fetchPriority="high"
                          decoding="async"
                        />
                      ) : (
                        <video
                          src={getOptimizedProjectVideoUrl(selectedGalleryItem?.url)}
                          className="h-[280px] w-full object-cover sm:h-[360px] md:h-[460px]"
                          muted
                          preload="metadata"
                          playsInline
                        />
                      )}
                      {isMainVideoPreviewActive && selectedGalleryItem?.url && (
                        <video
                          ref={mainVideoPreviewRef}
                          src={getOptimizedProjectVideoUrl(selectedGalleryItem.url)}
                          className={`absolute inset-0 h-[280px] w-full object-cover transition-opacity duration-150 sm:h-[360px] md:h-[460px] ${
                            isMainVideoPreviewReady ? "opacity-100" : "opacity-0"
                          }`}
                          muted
                          autoPlay
                          preload="metadata"
                          playsInline
                          onLoadedData={(event) => {
                            event.currentTarget.currentTime = 0;
                            setIsMainVideoPreviewReady(true);
                          }}
                          onTimeUpdate={(event) => {
                            if (event.currentTarget.currentTime >= 3) {
                              event.currentTarget.currentTime = 0;
                            }
                          }}
                          onError={stopMainVideoPreview}
                        />
                      )}
                      {/* Video Play Button Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="rounded-full bg-black/50 p-4 transition-colors group-hover:bg-black/65">
                          <MdPlayCircle className="text-white" size={64} />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <img
                        src={
                          getMainImageUrl(selectedGalleryItem?.url || project.images[0]) ||
                          project.images[0]
                        }
                        alt={getLocalizedAlt(i18n.language, "projectImage", {
                          title: project.name,
                          index: selectedImage + 1,
                        })}
                        className="h-[280px] w-full object-cover sm:h-[360px] md:h-[460px]"
                        loading="eager"
                        fetchPriority="high"
                        decoding="async"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/20 via-transparent to-transparent opacity-80 transition-opacity group-hover:opacity-100" />
                    </>
                  )}

                  <div className="pointer-events-none absolute inset-x-3 bottom-3 flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/92 px-3 py-1.5 text-[11px] font-semibold text-slate-700 shadow-sm backdrop-blur">
                      <MdZoomIn size={15} />
                      <span className="hidden sm:inline">{t("projectDetail.clickToEnlarge")}</span>
                    </span>
                    <span className="inline-flex items-center rounded-full bg-slate-950/70 px-3 py-1.5 text-[11px] font-semibold text-white backdrop-blur">
                      {selectedImage + 1} / {galleryItemCount}
                    </span>
                  </div>

                  {hasGalleryNav && (
                    <>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          goToPrevGalleryItem();
                        }}
                        className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white transition-colors hover:bg-black/65 md:opacity-0 md:group-hover:opacity-100"
                        aria-label="Previous image"
                      >
                        <MdChevronLeft size={24} />
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          goToNextGalleryItem();
                        }}
                        className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white transition-colors hover:bg-black/65 md:opacity-0 md:group-hover:opacity-100"
                        aria-label="Next image"
                      >
                        <MdChevronRight size={24} />
                      </button>
                    </>
                  )}
                </div>
                
                {/* Thumbnails */}
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:flex md:h-[460px] md:flex-col md:gap-3">
                  {project.galleryItems.slice(0, 5).map((item, index) => (
                    <div
                      key={index}
                      className={`relative aspect-[4/3] cursor-pointer overflow-hidden rounded-[16px] border bg-slate-100 md:flex-1 ${
                        selectedImage === index
                          ? "border-blue-500 ring-2 ring-blue-500/20"
                          : "border-slate-200"
                      }`}
                      onClick={() => setSelectedImage(index)}
                    >
                      {item.type === "video" ? (
                        <>
                          {getThumbnailVideoPosterUrl(item.url) ? (
                            <img
                              src={getThumbnailVideoPosterUrl(item.url)}
                              alt={getLocalizedAlt(i18n.language, "projectVideo", {
                                title: project.name,
                                index: index + 1,
                              })}
                              className="absolute inset-0 h-full w-full object-cover"
                              loading="lazy"
                              decoding="async"
                            />
                          ) : (
                            <video
                              src={getOptimizedProjectVideoUrl(item.url)}
                              className="absolute inset-0 h-full w-full object-cover"
                              muted
                              preload="metadata"
                              playsInline
                            />
                          )}
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                            <MdPlayCircleOutline className="text-white" size={24} />
                          </div>
                        </>
                      ) : (
                        <img
                          src={getThumbnailImageUrl(item.url)}
                          alt={getLocalizedAlt(i18n.language, "projectImage", {
                            title: project.name,
                            index: index + 1,
                          })}
                          className="absolute inset-0 h-full w-full object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                      )}
                      {index === 4 && project.galleryItems.length > 5 && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-medium text-center">
                          +{project.galleryItems.length - 5}
                          <br />
                          <span className="text-xs">{t("projectDetail.morePhotos")}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Facts Strip */}
              {detailQuickFacts.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {detailQuickFacts.map((fact) => (
                    <span
                      key={fact.key}
                      className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700"
                    >
                      {fact.key === "citizenship" && <BsShieldCheck className="text-emerald-600" size={12} />}
                      {fact.key === "installment" && <FaRegClock className="text-sky-600" size={11} />}
                      {fact.key === "delivery" && <FaKey className="text-amber-600" size={11} />}
                      {fact.key === "deed" && <MdDescription className="text-slate-500" size={13} />}
                      {fact.key === "location" && <MdLocationOn className="text-slate-400" size={13} />}
                      {fact.label}
                    </span>
                  ))}
                </div>
              )}

              {/* Price + Gallery Links + CTA Row */}
              <div className="mt-4 flex flex-col gap-4 rounded-[24px] border border-slate-200 bg-slate-50/80 p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  {/* Gallery/Video/Brochure — right on large screens */}
                  <div className="flex flex-wrap gap-2 lg:order-2">
                    <button
                      onClick={() => setLightboxOpen(true)}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                    >
                      <MdImage size={18} className="text-blue-600" />
                      <span>{t("projectDetail.gallery")}</span>
                      <span className="text-xs text-slate-500">
                        ({galleryItemCount})
                      </span>
                    </button>
                    {hasYouTubeVideo ? (
                      <button
                        type="button"
                        onClick={() => setShowYouTube((prev) => !prev)}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                      >
                        <MdPlayCircle size={18} className="text-rose-500" />
                        <span>YouTube</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          if (project.brochureUrl) {
                            window.open(project.brochureUrl, "_blank", "noopener,noreferrer");
                          }
                        }}
                        disabled={!project.brochureUrl}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <MdDescription size={18} className="text-slate-500" />
                        <span>{t("projectDetail.brochure")}</span>
                      </button>
                    )}
                  </div>

                  {/* Price — left on large screens */}
                  <div className="flex w-full min-w-0 flex-col gap-4 rounded-2xl border border-slate-200/90 bg-white p-5 text-left shadow-sm ring-1 ring-slate-950/[0.03] lg:order-1 lg:max-w-[min(100%,22.5rem)]">
                    {project.gyo && (
                      <span className="inline-flex w-fit max-w-full items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold leading-snug text-emerald-800 ring-1 ring-inset ring-emerald-200/80">
                        {t("projectDetail.factCitizenship", { defaultValue: "Citizenship Eligible" })}
                      </span>
                    )}
                    <div className="flex min-w-0 flex-col gap-3">
                      <div className="flex min-w-0 flex-col gap-1.5">
                        <p className="text-[11px] font-semibold uppercase leading-normal tracking-[0.12em] text-slate-400">
                          {detailPricePresentation.eyebrow}
                        </p>
                        <p
                          className={`text-xl font-bold leading-snug tracking-tight text-balance sm:text-2xl ${detailPricePresentation.hasVisiblePrice ? "text-blue-600" : "text-slate-900"}`}
                        >
                          {detailPricePresentation.value}
                        </p>
                      </div>
                      <p className="text-sm font-normal leading-relaxed text-slate-600">
                        {detailPricePresentation.caption}
                      </p>
                    </div>
                  </div>
                </div>

                {/* CTA Bar */}
                <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
                  {detailCTAs.map((cta) => {
                    if (cta.variant === "whatsapp") {
                      return (
                        <a
                          key={cta.key}
                          href={cta.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#20bd5a] sm:w-auto"
                        >
                          <FaWhatsapp size={16} />
                          {cta.label}
                        </a>
                      );
                    }
                        if (cta.action === "call") {
                          return (
                            <a
                              key={cta.key}
                              href={cta.href}
                              className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-2xl border border-[#cbd5e1] bg-[#0f172a] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#111c33] sm:w-auto"
                            >
                              <FaPhone size={14} />
                              {cta.label}
                            </a>
                          );
                    }
                        if (cta.action === "booking") {
                          return (
                            <button
                              key={cta.key}
                              type="button"
                              onClick={openBookingModal}
                              className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-2xl border border-sky-200 bg-sky-50 px-5 py-3 text-sm font-semibold text-sky-800 shadow-sm transition hover:border-sky-300 hover:bg-sky-100 sm:w-auto"
                            >
                              <FaCalendarPlus size={14} />
                              {cta.label}
                            </button>
                          );
                    }
                    return null;
                  })}
                </div>
              </div>
            </div>

            {showYouTube && getYouTubeEmbedUrl(project.brochureUrl) && (
              <div className="mb-6 overflow-hidden rounded-xl border border-slate-200 shadow-sm">
                <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                  <iframe
                    className="absolute inset-0 h-full w-full"
                    src={getYouTubeEmbedUrl(project.brochureUrl)}
                    title={project.projectName || project.name || "YouTube Video"}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            )}

            {isBookableProject && (
              <div className="mb-8 rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_22px_70px_-48px_rgba(15,23,42,0.28)]">
                {hasBookingMeta && (
                  <div className="flex flex-wrap gap-4 rounded-xl bg-primary p-4">
                    {project.createdAt && (
                      <div className="flex items-center gap-2 text-sm">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/10">
                          <FaCalendarPlus className="text-secondary" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-30">{t("propertyDetails.listedOn")}</p>
                          <p className="font-medium text-tertiary">
                            {formatDate(project.createdAt, true, i18n.language)}
                          </p>
                        </div>
                      </div>
                    )}
                    {project.updatedAt && project.updatedAt !== project.createdAt && (
                      <div className="flex items-center gap-2 text-sm">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                          <FaRegClock className="text-blue-500" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-30">{t("propertyDetails.lastUpdated")}</p>
                          <p className="font-medium text-tertiary">
                            {formatDate(project.updatedAt, true, i18n.language)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className={`${hasBookingMeta ? "mt-4" : ""} space-y-3`}>
                  {bookedProjectVisit ? (
                    <>
                      <Button
                        onClick={() => cancelBooking()}
                        variant="outline"
                        color="red"
                        className="w-full"
                        disabled={cancelling}
                      >
                        {t("propertyDetails.cancelBooking")}
                      </Button>
                      <p className="flex items-center gap-2 text-green-600">
                        <MdCheck className="text-lg" />
                        {t("propertyDetails.bookedVisit")} {bookedProjectVisit.date}
                      </p>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={openBookingModal}
                      className="btn-secondary w-full rounded-xl !px-5 !py-[7px] shadow-sm"
                    >
                      {t("propertyDetails.bookVisit")}
                    </button>
                  )}
                </div>

                <BookingModal
                  opened={bookingModalOpened}
                  setOpened={setBookingModalOpened}
                  propertyId={project.id}
                  email={user?.email || ""}
                  onBooked={() => setInquiryModalOpen(true)}
                />
              </div>
            )}

            <div className="mb-8 flex justify-center">
              <div className="inline-flex flex-wrap items-center justify-center gap-2 rounded-full border border-slate-200 bg-slate-50 p-1">
                <button
                  type="button"
                  onClick={() => scrollToSection("description")}
                  className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-colors ${
                    activeOverviewTab === "description"
                      ? "bg-[#0b4f93] text-white"
                      : "text-slate-700 hover:text-slate-900"
                  }`}
                >
                  <MdDescription size={16} />
                  {i18n.language?.startsWith("tr") ? "Açıklama" : "Description"}
                </button>
                {showMarketAnalytics && (
                  <button
                    type="button"
                    onClick={() => scrollToSection("market")}
                    className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-colors ${
                      activeOverviewTab === "market"
                        ? "bg-[#0b4f93] text-white"
                        : "text-slate-700 hover:text-slate-900"
                    }`}
                  >
                    <MdShowChart size={16} />
                    {i18n.language?.startsWith("tr") ? "Emlak Endeksi" : "Market Index"}
                  </button>
                )}
              </div>
            </div>

            {/* About Project */}
            <section ref={descriptionSectionRef} className="mb-8 scroll-mt-28">
              <h2 className="text-xl font-bold text-gray-900 mb-6">{t("projectDetail.aboutProject")}</h2>
              
              {/* Project Stats */}
              {project.projeHakkinda && (
                <div className="flex flex-wrap items-center gap-8 md:gap-16 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-gray-300 rounded"></div>
                    <div>
                      <div className="text-sm text-gray-500">{t("projectDetail.projectArea")}</div>
                      <div className="font-bold text-gray-900">{project.projeHakkinda.projeAlani?.toLocaleString("tr-TR")} m<sup>2</sup></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-gray-300 rounded"></div>
                    <div>
                      <div className="text-sm text-gray-500">{t("projectDetail.greenArea")}</div>
                      <div className="font-bold text-gray-900">{project.projeHakkinda.yesilAlan?.toLocaleString("tr-TR")} m<sup>2</sup></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-gray-300 rounded"></div>
                    <div>
                      <div className="text-sm text-gray-500">{t("projectDetail.unitCount")}</div>
                      <div className="font-bold text-gray-900">{project.projeHakkinda.konutSayisi?.toLocaleString("tr-TR")}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Campaign Banner */}
              {project.kampanya && (
                <div className="bg-gray-600 rounded p-4 mb-6 flex items-center gap-3">
                  <MdCampaign className="text-yellow-400 text-xl shrink-0" />
                  <span className="text-sm text-white">{project.kampanya}</span>
                </div>
              )}

              {isSpecialOfferProject && primarySpecialOffer && (() => {
                const offer = primarySpecialOffer;
                const specialOfferPriceInfo = getProjectSpecialOfferPriceInfo(
                  offer,
                  {
                    convertAmount,
                    fallbackCurrency: project.currency || baseCurrency,
                    targetCurrency: "USD",
                  }
                );
                const specialOfferPriceAmount =
                  specialOfferPriceInfo.amount || Number(project.price || 0);
                const specialOfferPriceCurrency =
                  specialOfferPriceAmount > 0
                    ? specialOfferPriceInfo.currency
                    : project.currency || baseCurrency;
                const locale = i18n.language === "tr" ? "tr-TR" : "en-US";
                const locationMinutesLabel = i18n.language?.startsWith("tr")
                  ? "dk"
                  : i18n.language?.startsWith("ru")
                  ? "мин"
                  : "min";
                const specialOfferDownPaymentAmount = Number(offer.downPaymentAmount || 0);
                const specialOfferDownPaymentPercent = Number(offer.downPaymentPercent || 0);
                const specialOfferDownPaymentValue =
                  specialOfferDownPaymentPercent > 0 &&
                  specialOfferDownPaymentPercent <= 100 &&
                  (specialOfferDownPaymentAmount <= 0 ||
                    specialOfferDownPaymentAmount === specialOfferDownPaymentPercent)
                    ? `${specialOfferDownPaymentPercent}%`
                    : specialOfferDownPaymentAmount > 0
                    ? formatMoney(
                        Math.floor(
                          convertAmount(
                            specialOfferDownPaymentAmount,
                            specialOfferPriceCurrency,
                            displayCurrency
                          )
                        ),
                        displayCurrency,
                        locale
                      )
                    : "";
                const specialOfferLocationText =
                  offer.locationLabel || offer.locationMinutes
                    ? `${offer.locationLabel || ""} ${
                        Number(offer.locationMinutes || 0) > 0
                          ? `${offer.locationMinutes} ${locationMinutesLabel}`
                          : ""
                      }`.trim()
                    : "";

                return (
                  <div className="mb-6">
                    <div className="rounded-2xl border border-[#e7dece] bg-[linear-gradient(180deg,#ffffff_0%,#fcfaf6_100%)] p-5 text-red-600 shadow-[0_16px_44px_-36px_rgba(15,23,42,0.35)]">
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <div>
                          <span className="inline-flex items-center rounded-full bg-rose-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-600 ring-1 ring-inset ring-rose-200">
                            {t("localProjects.badges.specialOffer", { defaultValue: "Special Offer" })}
                          </span>
                          <h3 className="mt-2 text-lg font-semibold text-red-600">
                            {offer.title || project.projectName || project.name}
                          </h3>
                        </div>
                        {specialOfferPriceAmount > 0 && (
                          <div className="shrink-0 text-right">
                            <div className="text-[10px] font-semibold uppercase tracking-wider text-red-600">
                              {t("projectDetail.startingFromEyebrow", {
                                defaultValue: "STARTING FROM",
                              })}
                            </div>
                            <div className="text-xl font-bold text-red-600">
                              {formatMoney(
                                Math.floor(
                                  convertAmount(
                                    specialOfferPriceAmount,
                                    specialOfferPriceCurrency,
                                    displayCurrency
                                  )
                                ),
                                displayCurrency,
                                locale
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-red-600">
                        {offer.roomType && (
                          <div>
                            <span className="text-red-600">{t("projectDetail.offerLayout", { defaultValue: "Layout" })}:</span>{" "}
                            <span className="font-medium text-red-600">{offer.roomType}</span>
                          </div>
                        )}
                        {Number(offer.areaM2 || 0) > 0 && (
                          <div>
                            <span className="text-red-600">{t("projectDetail.area")}:</span>{" "}
                            <span className="font-medium text-red-600">{Math.floor(Number(offer.areaM2))} m2</span>
                          </div>
                        )}
                        {specialOfferDownPaymentAmount > 0 && (
                          <div>
                            <span className="text-red-600">{t("projectDetail.offerDownPayment", { defaultValue: "Down payment" })}:</span>{" "}
                            <span className="font-medium text-red-600">
                              {specialOfferDownPaymentValue}
                            </span>
                          </div>
                        )}
                        {Number(offer.installmentMonths || 0) > 0 && (
                          <div>
                            <span className="text-red-600">{t("projectDetail.supportInstallments", { defaultValue: "Installments" })}:</span>{" "}
                            <span className="font-medium text-red-600">
                              {t("projectDetail.supportInstallmentsValue", {
                                count: offer.installmentMonths,
                                defaultValue: "{{count}} months",
                              })}
                            </span>
                          </div>
                        )}
                        {specialOfferLocationText && (
                          <div>
                            <span className="text-red-600">{t("projectDetail.location")}:</span>{" "}
                            <span className="font-medium text-red-600">{specialOfferLocationText}</span>
                          </div>
                        )}
                      </div>

                      {specialOfferPriceAmount > 0 && (
                        <div className="mt-3 flex flex-wrap gap-3 border-t border-slate-100 pt-3 text-xs text-red-600">
                          <span className="text-red-600">
                            {formatMoney(
                              convertAmount(
                                specialOfferPriceAmount,
                                specialOfferPriceCurrency,
                                "TRY"
                              ),
                              "TRY",
                              locale
                            )}
                          </span>
                          <span className="text-red-600">|</span>
                          <span className="text-red-600">
                            {formatMoney(
                              convertAmount(
                                specialOfferPriceAmount,
                                specialOfferPriceCurrency,
                                "USD"
                              ),
                              "USD",
                              locale
                            )}
                          </span>
                          <span className="text-red-600">|</span>
                          <span className="text-red-600">
                            {formatMoney(
                              convertAmount(
                                specialOfferPriceAmount,
                                specialOfferPriceCurrency,
                                "EUR"
                              ),
                              "EUR",
                              locale
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Description - Bilingual */}
              {(() => {
                const description = i18n.language?.startsWith("ru")
                  ? (
                      project.projeHakkinda?.description_ru ||
                      project.projeHakkinda?.description_en ||
                      project.projeHakkinda?.description_tr ||
                      project.projeHakkinda?.description
                    )
                  : i18n.language?.startsWith("en")
                  ? (project.projeHakkinda?.description_en || project.projeHakkinda?.description)
                  : (project.projeHakkinda?.description_tr || project.projeHakkinda?.description);
                
                if (!description) return null;
                
                return (
                  <div className="mb-6 text-sm text-gray-700 leading-relaxed">
                    {description.split('\n\n').map((paragraph, index) => {
                      // Check if paragraph starts with a bold-like text
                      const isBoldStart = paragraph.includes('!') || paragraph.includes('...') || paragraph.startsWith('Siz') || paragraph.startsWith('Hayallerini') || paragraph.startsWith('Ayrıca') || paragraph.startsWith('Kartal');
                      if (isBoldStart && index < 6) {
                        const lines = paragraph.split('\n');
                        return (
                          <div key={index} className="mb-4">
                            {lines.map((line, lineIndex) => {
                              if (lineIndex === 0 && (line.includes('!') || line.includes('...'))) {
                                return <p key={lineIndex} className="font-bold text-gray-900 mb-1">{line}</p>;
                              }
                              return <p key={lineIndex} className="mb-1">{line}</p>;
                            })}
                          </div>
                        );
                      }
                      return <p key={index} className="mb-4">{paragraph}</p>;
                    })}
                  </div>
                );
              })()}

              {/* Features Section */}
              <section className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="text-lg" aria-hidden>
                    {"\u2728"}
                  </span>
                  {t("projectDetail.features")}
                </h2>
                
                {/* Feature Category Tabs with Icons */}
                <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-2 border-b">
                  <button
                    className={`flex items-center gap-2 px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                      featuresTab === "binaOzellikleri"
                        ? "border-b-2 border-gray-900 text-gray-900"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                    onClick={() => setFeaturesTab("binaOzellikleri")}
                  >
                    <BsHouseDoor />
                    {t("projectDetail.buildingFeatures")}
                  </button>
                  <button
                    className={`flex items-center gap-2 px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                      featuresTab === "disOzellikler"
                        ? "border-b-2 border-gray-900 text-gray-900"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                    onClick={() => setFeaturesTab("disOzellikler")}
                  >
                    <BsTree />
                    {t("projectDetail.exteriorFeatures")}
                  </button>
                  <button
                    className={`flex items-center gap-2 px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                      featuresTab === "engelliUygun"
                        ? "border-b-2 border-gray-900 text-gray-900"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                    onClick={() => setFeaturesTab("engelliUygun")}
                  >
                    <BsPeople />
                    {t("projectDetail.accessibility")}
                  </button>
                  <button
                    className={`flex items-center gap-2 px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                      featuresTab === "eglenceAlisveris"
                        ? "border-b-2 border-gray-900 text-gray-900"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                    onClick={() => setFeaturesTab("eglenceAlisveris")}
                  >
                    <BsCart4 />
                    {t("projectDetail.entertainment")}
                  </button>
                  <button
                    className={`flex items-center gap-2 px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                      featuresTab === "guvenlik"
                        ? "border-b-2 border-gray-900 text-gray-900"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                    onClick={() => setFeaturesTab("guvenlik")}
                  >
                    <BsShieldCheck />
                    {t("projectDetail.security")}
                  </button>
                  <button
                    className={`flex items-center gap-2 px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                      featuresTab === "manzara"
                        ? "border-b-2 border-gray-900 text-gray-900"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                    onClick={() => setFeaturesTab("manzara")}
                  >
                    <BsEye />
                    {t("projectDetail.view")}
                  </button>
                  <button
                    className={`flex items-center gap-2 px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                      featuresTab === "muhit"
                        ? "border-b-2 border-gray-900 text-gray-900"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                    onClick={() => setFeaturesTab("muhit")}
                  >
                    <BsGeoAlt />
                    {t("projectDetail.neighborhood")}
                  </button>
                </div>

                {/* Features Grid - Show all possible features with check/uncheck */}
                <div className="p-5 bg-white border border-gray-100 rounded-xl">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {/* Bina Özellikleri */}
                    {featuresTab === "binaOzellikleri" && ALL_BINA_OZELLIKLERI.map((feature, index) => {
                      const hasFeature = project.ozellikler?.binaOzellikleri?.some(f => 
                        f === feature || f.includes(feature) || feature.includes(f.split(" / ")[0])
                      );
                      return (
                        <div
                          key={index}
                          className={`flex items-center gap-2 text-sm ${!hasFeature ? "opacity-50" : ""}`}
                        >
                          {hasFeature ? (
                            <MdCheck className="text-green-500 flex-shrink-0" size={18} />
                          ) : (
                            <MdClose className="text-red-400 flex-shrink-0" size={18} />
                          )}
                          <span className={hasFeature ? "text-gray-700 font-medium" : "text-gray-400"}>
                            {getTranslatedFeature(feature, i18n.language)}
                          </span>
                        </div>
                      );
                    })}

                    {/* Dış Özellikler */}
                    {featuresTab === "disOzellikler" && ALL_DIS_OZELLIKLER.map((feature, index) => {
                      const hasFeature = project.ozellikler?.disOzellikler?.some(f => 
                        f === feature || f.includes(feature) || feature.includes(f.split(" / ")[0])
                      );
                      return (
                        <div
                          key={index}
                          className={`flex items-center gap-2 text-sm ${!hasFeature ? "opacity-50" : ""}`}
                        >
                          {hasFeature ? (
                            <MdCheck className="text-green-500 flex-shrink-0" size={18} />
                          ) : (
                            <MdClose className="text-red-400 flex-shrink-0" size={18} />
                          )}
                          <span className={hasFeature ? "text-gray-700 font-medium" : "text-gray-400"}>
                            {getTranslatedFeature(feature, i18n.language)}
                          </span>
                        </div>
                      );
                    })}

                    {/* Engelli/Yaşlıya Uygun */}
                    {featuresTab === "engelliUygun" && ALL_ENGELLI_UYGUN.map((feature, index) => {
                      const hasFeature = project.ozellikler?.engelliUygun?.some(f => 
                        f === feature || f.includes(feature) || feature.includes(f.split(" / ")[0])
                      );
                      return (
                        <div
                          key={index}
                          className={`flex items-center gap-2 text-sm ${!hasFeature ? "opacity-50" : ""}`}
                        >
                          {hasFeature ? (
                            <MdCheck className="text-green-500 flex-shrink-0" size={18} />
                          ) : (
                            <MdClose className="text-red-400 flex-shrink-0" size={18} />
                          )}
                          <span className={hasFeature ? "text-gray-700 font-medium" : "text-gray-400"}>
                            {getTranslatedFeature(feature, i18n.language)}
                          </span>
                        </div>
                      );
                    })}

                    {/* Eğlence & Alışveriş */}
                    {featuresTab === "eglenceAlisveris" && ALL_EGLENCE_ALISVERIS.map((feature, index) => {
                      const hasFeature = project.ozellikler?.eglenceAlisveris?.some(f => 
                        f === feature || f.includes(feature) || feature.includes(f.split(" / ")[0])
                      );
                      return (
                        <div
                          key={index}
                          className={`flex items-center gap-2 text-sm ${!hasFeature ? "opacity-50" : ""}`}
                        >
                          {hasFeature ? (
                            <MdCheck className="text-green-500 flex-shrink-0" size={18} />
                          ) : (
                            <MdClose className="text-red-400 flex-shrink-0" size={18} />
                          )}
                          <span className={hasFeature ? "text-gray-700 font-medium" : "text-gray-400"}>
                            {getTranslatedFeature(feature, i18n.language)}
                          </span>
                        </div>
                      );
                    })}

                    {/* Güvenlik */}
                    {featuresTab === "guvenlik" && ALL_GUVENLIK.map((feature, index) => {
                      const hasFeature = project.ozellikler?.guvenlik?.some(f => 
                        f === feature || f.includes(feature) || feature.includes(f.split(" / ")[0])
                      );
                      return (
                        <div
                          key={index}
                          className={`flex items-center gap-2 text-sm ${!hasFeature ? "opacity-50" : ""}`}
                        >
                          {hasFeature ? (
                            <MdCheck className="text-green-500 flex-shrink-0" size={18} />
                          ) : (
                            <MdClose className="text-red-400 flex-shrink-0" size={18} />
                          )}
                          <span className={hasFeature ? "text-gray-700 font-medium" : "text-gray-400"}>
                            {getTranslatedFeature(feature, i18n.language)}
                          </span>
                        </div>
                      );
                    })}

                    {/* Manzara */}
                    {featuresTab === "manzara" && ALL_MANZARA.map((feature, index) => {
                      const hasFeature = project.ozellikler?.manzara?.some(f => 
                        f === feature || f.includes(feature) || feature.includes(f.split(" / ")[0])
                      );
                      return (
                        <div
                          key={index}
                          className={`flex items-center gap-2 text-sm ${!hasFeature ? "opacity-50" : ""}`}
                        >
                          {hasFeature ? (
                            <MdCheck className="text-green-500 flex-shrink-0" size={18} />
                          ) : (
                            <MdClose className="text-red-400 flex-shrink-0" size={18} />
                          )}
                          <span className={hasFeature ? "text-gray-700 font-medium" : "text-gray-400"}>
                            {getTranslatedFeature(feature, i18n.language)}
                          </span>
                        </div>
                      );
                    })}

                    {/* Muhit */}
                    {featuresTab === "muhit" && ALL_MUHIT.map((feature, index) => {
                      const hasFeature = project.ozellikler?.muhit?.some(f => 
                        f === feature || f.includes(feature) || feature.includes(f.split(" / ")[0])
                      );
                      return (
                        <div
                          key={index}
                          className={`flex items-center gap-2 text-sm ${!hasFeature ? "opacity-50" : ""}`}
                        >
                          {hasFeature ? (
                            <MdCheck className="text-green-500 flex-shrink-0" size={18} />
                          ) : (
                            <MdClose className="text-red-400 flex-shrink-0" size={18} />
                          )}
                          <span className={hasFeature ? "text-gray-700 font-medium" : "text-gray-400"}>
                            {getTranslatedFeature(feature, i18n.language)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
              {/* Nearby Distances */}
              {project.projeHakkinda?.yakinMesafeler && (
                <div className="mt-4">
                  {project.projeHakkinda.yakinMesafeler.map((item, index) => (
                    <div key={index} className="text-sm text-gray-700 mb-1">
                      {item.yer} <span className="text-blue-600">{item.mesafe}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {showMarketAnalytics && (
              <section ref={marketSectionRef} className="mb-8 scroll-mt-28">
                <IstanbulMarketAnalytics districtHint={project.district} />
              </section>
            )}

            {/* Floor Plans */}
            {project.dairePlanlari && project.dairePlanlari.length > 0 && (
              <section className="mb-8">
                {/* Room Type Tabs */}
                <div className="mb-4 flex items-center gap-6 border-b">
                  <button
                    className={`px-2 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                      activeTab === "all"
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                    onClick={() => setActiveTab("all")}
                  >
                    Hepsi
                  </button>
                  {roomTypes.map((type) => (
                    <button
                      key={type}
                      className={`px-2 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                        activeTab === type
                          ? "border-blue-500 text-blue-600"
                          : "border-transparent text-gray-500 hover:text-gray-700"
                      }`}
                      onClick={() => setActiveTab(type)}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                {/* Floor Plan Cards */}
                <div className="grid grid-cols-1 gap-4 min-[1200px]:grid-cols-2">
                  {filteredPlans.map((plan) => {
                    const floorPlanPrice = getFloorPlanPriceSummary(plan);
                    const floorArea = Math.floor(Number(plan.metrekare || 0));
                    const planCtaLabel = getFloorPlanCTA(plan, { t });
                    return (
                      <div
                        key={plan.id}
                        className="group rounded-2xl border border-[#e7dece] bg-[linear-gradient(180deg,#ffffff_0%,#fcfaf6_100%)] shadow-[0_16px_44px_-36px_rgba(15,23,42,0.35)] transition duration-300 hover:border-[#d8c7aa] hover:shadow-[0_22px_52px_-32px_rgba(15,23,42,0.4)]"
                      >
                        <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-[minmax(11rem,1fr)_minmax(10rem,13rem)] sm:items-stretch sm:gap-x-4 md:p-5 md:gap-x-5">
                          <div className="min-w-0">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 pr-1">
                                <div className="inline-flex items-center rounded-full border border-[#e7dcc8] bg-white px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8f5a24]">
                                  {plan.tip}
                                </div>
                                <h3 className="mt-2 break-words text-base font-semibold tracking-[-0.02em] text-slate-900 sm:text-lg">
                                  {plan.tip} - {plan.varyant}
                                </h3>
                                <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-slate-600 sm:text-sm sm:leading-6">
                                  {floorPlanPrice.isAvailable
                                    ? t("projectDetail.floorPlanSupportPriced", {
                                        defaultValue: "Priced layout available — view details or request the full unit list.",
                                      })
                                    : t("projectDetail.floorPlanSupportRequest", {
                                        defaultValue: "Pricing not yet published — request the latest availability from our team.",
                                      })}
                                </p>
                              </div>
                              <div className="flex shrink-0 flex-col items-end gap-1">
                                <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                                  {t("projectDetail.area", { defaultValue: "Area" })}
                                </span>
                                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 ring-1 ring-inset ring-slate-200">
                                  {floorArea} m2
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex min-w-0 flex-col rounded-xl border border-[#ecdfcb] bg-[linear-gradient(180deg,#fffaf2_0%,#fdf7ee_100%)] px-3 py-2.5 sm:self-center">
                            <div
                              className={`text-[10px] font-semibold uppercase tracking-[0.14em] ${
                                floorPlanPrice.isAvailable ? "text-red-600" : "text-slate-500"
                              }`}
                            >
                              {floorPlanPrice.label}
                            </div>
                            <div
                              className={`mt-1 max-w-full break-all text-base font-semibold tabular-nums leading-snug tracking-tight sm:break-normal sm:text-[1.05rem] ${
                                floorPlanPrice.isAvailable ? "text-blue-600" : "text-slate-900"
                              }`}
                            >
                              {floorPlanPrice.value}
                            </div>
                            {floorPlanPrice.isAvailable ? (
                              <span className="mt-1.5 inline-flex w-fit max-w-full items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold leading-snug text-emerald-700 ring-1 ring-inset ring-emerald-100">
                                {t("projectDetail.startingFrom", {
                                  defaultValue: "Starting from",
                                })}
                              </span>
                            ) : null}
                            <button
                              type="button"
                              className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-[#0f172a] px-3 py-2 text-xs font-semibold text-white shadow-[0_12px_24px_-16px_rgba(15,23,42,0.75)] transition hover:-translate-y-0.5 hover:bg-slate-800 sm:text-sm"
                              onClick={() => setFloorPlanModal({ open: true, plan })}
                            >
                              {planCtaLabel}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

          </Grid.Col>

          {/* Right Column - Contact Form */}
          <Grid.Col span={{ base: 12, md: 4 }}>
            <div className="sticky top-24" data-inquiry-sidebar>
              <InquirySidebarCard
                propertyId={project.id}
                propertyTitle={project.name}
                listingNo={project.ilanNo || propertyData?.listingNo || ""}
                locationLabel={[project.city, project.district].filter(Boolean).join(" / ")}
                consultantId={project.consultantId || projectConsultant?.id || ""}
                subjectPrefix="Project Inquiry"
                resumeKey={`project-inquiry-sidebar-${project.id}`}
              />
            </div>

            {(projectConsultant || project.consultantId) && (
              <Paper
                shadow="sm"
                className="mt-6 overflow-hidden rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_22px_70px_-48px_rgba(15,23,42,0.35)]"
              >
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {t("projectDetail.consultant")}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {t("projectDetail.consultantDescription")}
                </p>

                {consultantsLoading && !projectConsultant && (
                  <div className="flex items-center justify-center py-6">
                    <Loader size="sm" />
                  </div>
                )}

                {!consultantsLoading && !projectConsultant && (
                  <p className="text-sm text-gray-500">
                    {t("projectDetail.consultantUnavailable")}
                  </p>
                )}

                {projectConsultant && (
                  <>
                    <div className="flex items-center gap-4 mb-4">
                      <Avatar
                        src={projectConsultant.image}
                        alt={getLocalizedAlt(i18n.language, "consultantPhoto", {
                          name: projectConsultant.name,
                        })}
                        size="lg"
                        radius="xl"
                      />
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">
                          {projectConsultant.name}
                        </h4>
                        {consultantTitle && (
                          <p className="text-sm text-gray-600">
                            {consultantTitle}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <PhoneLink
                        phone={projectConsultant.phone}
                        className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 transition-colors hover:border-green-500 hover:text-green-600"
                      >
                        <FaPhone className="text-gray-500" />
                        <span dir="ltr">{projectConsultant.phone}</span>
                      </PhoneLink>
                      {consultantWhatsApp && (
                        <a
                          href={`https://wa.me/${consultantWhatsApp}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 rounded-lg bg-[#25D366] px-3 py-2 text-sm font-medium text-white hover:bg-[#20bd5a] transition-colors"
                        >
                          <FaWhatsapp />
                          WhatsApp
                        </a>
                      )}
                    </div>
                  </>
                )}
              </Paper>
            )}
          </Grid.Col>
        </Grid>
      </Container>

      {/* Inquiry Modal */}
      <Modal
        opened={inquiryModalOpen}
        onClose={() => setInquiryModalOpen(false)}
        centered
        size={460}
        padding={0}
        withCloseButton={false}
        overlayProps={{
          backgroundOpacity: 0.45,
          blur: 8,
        }}
      >
        <div className="relative">
          <button
            type="button"
            onClick={() => setInquiryModalOpen(false)}
            className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-600 shadow-sm transition hover:bg-white hover:text-slate-900"
            aria-label="Close inquiry form"
          >
            <MdClose size={20} />
          </button>
          <InquirySidebarCard
            propertyId={project?.id}
            propertyTitle={project?.name}
            listingNo={project?.ilanNo || propertyData?.listingNo || ""}
            locationLabel={[project?.city, project?.district].filter(Boolean).join(" / ")}
            consultantId={project?.consultantId || projectConsultant?.id || ""}
            subjectPrefix="Project Inquiry"
            className="border-0 shadow-none"
            onSuccess={() => setInquiryModalOpen(false)}
            resumeKey={`project-inquiry-modal-${project?.id || "unknown"}`}
          />
        </div>
      </Modal>

      {/* Image/Video Lightbox */}
      <Modal
        opened={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        size="xl"
        centered
        withCloseButton
      >
        <div className="relative">
          {selectedGalleryItem?.type === "video" ? (
            <video
              src={getOptimizedProjectVideoUrl(selectedGalleryItem?.url)}
              poster={getMainVideoPosterUrl(selectedGalleryItem?.url) || undefined}
              className="w-full h-auto rounded-lg"
              controls
              autoPlay
              preload="metadata"
              playsInline
            />
          ) : (
            <img
              src={
                getLightboxImageUrl(selectedGalleryItem?.url || project.images[0]) ||
                project.images[0]
              }
              alt={getLocalizedAlt(i18n.language, "projectImage", {
                title: project.name,
                index: selectedImage + 1,
              })}
              className={`w-full h-auto cursor-pointer select-none transition-opacity duration-200 ${
                isLightboxMediaLoaded ? "opacity-100" : "opacity-0"
              }`}
              onTouchStart={handleLightboxTouchStart}
              onTouchEnd={handleLightboxTouchEnd}
              onClick={handleLightboxImageClick}
              onLoad={() => setIsLightboxMediaLoaded(true)}
              onError={() => setIsLightboxMediaLoaded(true)}
              decoding="async"
            />
          )}

          {selectedGalleryItem?.type === "image" && !isLightboxMediaLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100/60 rounded-lg">
              <Loader size="sm" />
            </div>
          )}

          {project.galleryItems.length > 1 && (
            <>
              <button
                type="button"
                onClick={goToPrevGalleryItem}
                className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/45 text-white hover:bg-black/65 transition-colors flex items-center justify-center"
                aria-label="Previous image"
              >
                <MdChevronLeft size={24} />
              </button>
              <button
                type="button"
                onClick={goToNextGalleryItem}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/45 text-white hover:bg-black/65 transition-colors flex items-center justify-center"
                aria-label="Next image"
              >
                <MdChevronRight size={24} />
              </button>
            </>
          )}
        </div>
        <div className="flex justify-center gap-2 mt-4 flex-wrap">
          {project.galleryItems.map((item, index) => (
            <button
              key={index}
              className={`w-16 h-12 rounded overflow-hidden relative ${
                selectedImage === index ? "ring-2 ring-blue-500" : ""
              }`}
              onClick={() => setSelectedImage(index)}
            >
              {item.type === "video" ? (
                <>
                  {getThumbnailVideoPosterUrl(item.url) ? (
                    <img
                      src={getThumbnailVideoPosterUrl(item.url)}
                      alt={getLocalizedAlt(i18n.language, "projectVideo", {
                        title: project.name,
                        index: index + 1,
                      })}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <video
                      src={getOptimizedProjectVideoUrl(item.url)}
                      className="w-full h-full object-cover"
                      muted
                      preload="metadata"
                      playsInline
                    />
                  )}
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <MdPlayCircleOutline className="text-white" size={16} />
                  </div>
                </>
              ) : (
                <img
                  src={getThumbnailImageUrl(item.url)}
                  alt={getLocalizedAlt(i18n.language, "projectThumbnail", {
                    title: project.name,
                    index: index + 1,
                  })}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              )}
            </button>
          ))}
        </div>
      </Modal>

      {/* Floor Plan Modal */}
      <Modal
        opened={floorPlanModal.open}
        onClose={() => setFloorPlanModal({ open: false, plan: null })}
        size="lg"
        centered
        withCloseButton
        title={
          floorPlanModal.plan && (
            <div className="font-bold text-lg">
              {floorPlanModal.plan.tip} - {floorPlanModal.plan.varyant}
            </div>
          )
        }
      >
        {floorPlanModal.plan && (
          <div className="space-y-4">
            {floorPlanModal.plan.image ? (
              <img
                src={floorPlanModal.plan.image}
                alt={getLocalizedAlt(i18n.language, "floorPlan", {
                  title: floorPlanModal.plan.tip,
                  variant: floorPlanModal.plan.varyant,
                })}
                className="w-full h-auto rounded-lg"
              />
            ) : (
              <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
                <p className="text-gray-500">
                  {t("projectDetail.noFloorPlanImage", {
                    defaultValue: "No image available",
                  })}
                </p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              {floorPlanModal.plan.fiyat > 0 && (() => {
                const modalSecondaryPrices = getSecondaryPrices(
                  floorPlanModal.plan.fiyat,
                  project.currency || baseCurrency
                );
                return (
                  <div>
                    <p className="text-sm text-gray-500">{t("projectDetail.price") || "Fiyat"}</p>
                    <p className="font-bold text-blue-600 text-lg">
                      {formatMoney(
                        Math.floor(
                          convertAmount(
                            floorPlanModal.plan.fiyat,
                            project.currency || baseCurrency,
                            displayCurrency
                          )
                        ),
                        displayCurrency,
                        priceLocale
                      )}
                    </p>
                    {modalSecondaryPrices.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
                        {modalSecondaryPrices.map((price) => (
                          <span key={price.code} className="whitespace-nowrap">
                            <span className="font-medium text-gray-600">{price.code}</span>{" "}
                            {price.label}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
              <div>
                <p className="text-sm text-gray-500">{t("projectDetail.area") || "Alan"}</p>
                <p className="font-bold text-gray-900 text-lg">
                  {Math.floor(Number(floorPlanModal.plan.metrekare || 0))} m2
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Video Modal - Full Screen */}
      {videoModalOpen && project?.galleryItems[currentVideoIndex]?.type === 'video' && (
        <div className="fixed inset-0 bg-black/95 z-[300] flex items-center justify-center">
          {/* Close Button */}
          <button
            onClick={() => setVideoModalOpen(false)}
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white text-2xl z-10"
          >
            {"\u00D7"}
          </button>

          {/* Video Info */}
          <div className="absolute top-4 left-4 text-white/80 text-sm flex items-center gap-2">
            <MdVideocam />
            Video
          </div>

          {/* Main Video */}
          <video
            key={currentVideoIndex}
            src={getOptimizedProjectVideoUrl(project.galleryItems[currentVideoIndex]?.url)}
            poster={
              getMainVideoPosterUrl(project.galleryItems[currentVideoIndex]?.url) || undefined
            }
            className="max-h-[85vh] max-w-[90vw] rounded-lg"
            controls
            autoPlay
            preload="metadata"
            playsInline
          />
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;
