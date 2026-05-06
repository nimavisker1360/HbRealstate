import { useContext, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  FaArrowRight,
  FaBuildingColumns,
  FaCheck,
  FaCircleCheck,
  FaClock,
  FaEnvelope,
  FaGem,
  FaHandshake,
  FaLocationDot,
  FaPassport,
  FaPhone,
  FaShieldHalved,
  FaWhatsapp,
} from "react-icons/fa6";
import { toast } from "react-toastify";
import SEO from "../components/SEO";
import CurrencyContext from "../context/CurrencyContext";
import useProperties from "../hooks/useProperties";
import istanbulHero from "../assets/hero/Istanbul.jpg";
import { PRIMARY_CONTACT_PHONE } from "../constant/data";
import { normalizeWhatsAppNumber } from "../utils/common";
import { sendEmail } from "../utils/api";
import { trackFormSubmitConversion } from "../utils/analytics";
import { getOptimizedImageUrl } from "../utils/media";
import { getPropertyDisplayPriceInfo } from "../utils/propertyPricing";
import { getProjectBadges } from "../utils/projectCardPresentation";
import { resolveProjectPath } from "../utils/seo";
import { isCitizenshipEligibleProperty, isInstallmentProperty } from "../utils/contentGraph";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CITIZENSHIP_SEO_BASE_URL = "https://hbrealstate.com";
const CITIZENSHIP_SEO_PATH = "/citizenship";
const CITIZENSHIP_LANGUAGES = ["en", "tr", "ru"];
const CITIZENSHIP_CONTACT_PHONE = "+905303871050";
const CITIZENSHIP_WHATSAPP_URL = "https://wa.me/905303871050";
const CITIZENSHIP_EMAIL = "hbrealstate2019@gmail.com";
const CITIZENSHIP_LOCALES = {
  en: "en_US",
  tr: "tr_TR",
  ru: "ru_RU",
};
const PROJECT_BADGE_TONE_CLASSES = {
  emerald: "border-[#bdebd8]/90 bg-white/95 text-[#008f5a]",
  amber: "border-[#f4d6a8]/90 bg-white/95 text-[#9a5b12]",
  sky: "border-sky-200/90 bg-white/95 text-sky-700",
  slate: "border-slate-200/90 bg-white/95 text-slate-700",
  stone: "border-[#e8decd]/90 bg-white/95 text-[#8f5a24]",
  rose: "border-[#f0c4c6]/80 bg-white/95 text-[#971b1e]",
};

const fallbackArray = (value, fallback) => (Array.isArray(value) ? value : fallback);

const pickText = (...values) => {
  for (const value of values) {
    const normalized = String(value || "").trim();
    if (normalized) return normalized;
  }
  return "";
};

const getSupportedLanguage = (language) => {
  const normalized = String(language || "en").toLowerCase();
  return CITIZENSHIP_LANGUAGES.find((lang) => normalized.startsWith(lang)) || "en";
};

const buildCitizenshipUrl = (language = "en") =>
  `${CITIZENSHIP_SEO_BASE_URL}/${language}${CITIZENSHIP_SEO_PATH}`;

const citizenshipLanguageAlternates = [
  ...CITIZENSHIP_LANGUAGES.map((language) => ({
    hrefLang: language,
    href: buildCitizenshipUrl(language),
  })),
  {
    hrefLang: "x-default",
    href: buildCitizenshipUrl("en"),
  },
];

const normalizeText = (value) =>
  String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const isProject = (property) =>
  property?.propertyType === "local-project" ||
  property?.propertyType === "international-project";

const hasTruthyEligibilityField = (item) =>
  [
    item?.citizenshipEligible,
    item?.eligibleForCitizenship,
    item?.gyo,
    item?.projeHakkinda?.citizenshipEligible,
    item?.projeHakkinda?.eligibleForCitizenship,
  ].some((value) => {
    if (typeof value === "string") {
      return ["true", "yes", "1", "eligible"].includes(normalizeText(value));
    }
    return Boolean(value);
  });

const hasProjectSpecialOffer = (property) => {
  const offers = Array.isArray(property?.projeHakkinda?.specialOffers)
    ? property.projeHakkinda.specialOffers
    : [];

  return Boolean(
    property?.hasSpecialOffer ||
      property?.offBadge ||
      property?.specialOffer ||
      property?.projeHakkinda?.specialOffer ||
      offers.length > 0
  );
};

const getLowestFloorPlanPriceInfo = (property) => {
  const plans = Array.isArray(property?.dairePlanlari) ? property.dairePlanlari : [];
  const pricedPlans = plans
    .map((plan) => Number(plan?.fiyat || 0))
    .filter((amount) => Number.isFinite(amount) && amount > 0);

  if (!pricedPlans.length) {
    return {
      amount: 0,
      currency: property?.currency || "USD",
    };
  }

  return {
    amount: Math.min(...pricedPlans),
    currency: property?.currency || "USD",
  };
};

const getProjectCardPriceInfo = (property, options) => {
  const floorPlanPrice = getLowestFloorPlanPriceInfo(property);
  if (floorPlanPrice.amount > 0) {
    return floorPlanPrice;
  }

  return getPropertyDisplayPriceInfo(property, options);
};

const isCitizenshipEligible = (property) =>
  hasTruthyEligibilityField(property) || isCitizenshipEligibleProperty(property);

const getCitizenshipProjectBadges = (project, options = {}) => {
  const badges = getProjectBadges(project, options);
  const hasCitizenshipBadge = badges.some((badge) => badge.key === "citizenship");

  if (!project?.citizenshipLandingEligible || hasCitizenshipBadge) {
    return badges;
  }

  const secondaryBadges = badges
    .filter((badge) => badge.key !== "citizenship" && badge.key !== "investment")
    .slice(0, 1);

  return [{ key: "citizenship", tone: "emerald" }, ...secondaryBadges];
};

const getLocalizedDescription = (property, language) => {
  if (language?.startsWith("tr")) {
    return property?.description_tr || property?.description || property?.description_en;
  }
  if (language?.startsWith("ru")) {
    return (
      property?.description_ru ||
      property?.description_en ||
      property?.description_tr ||
      property?.description
    );
  }
  return property?.description_en || property?.description || property?.description_tr;
};

const buildProjectWhatsAppUrl = (project, message) => {
  const whatsappNumber = normalizeWhatsAppNumber(
    project?.consultant?.whatsapp ||
      project?.consultant?.phone ||
      project?.phone ||
      PRIMARY_CONTACT_PHONE
  );

  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
};

const Field = ({ label, children }) => (
  <label className="block">
    <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#008f5a]">
      {label}
    </span>
    {children}
  </label>
);

const CitizenshipLanding = () => {
  const { t, i18n } = useTranslation();
  const { data: properties = [], isLoading } = useProperties();
  const { selectedCurrency, baseCurrency, rates, convertAmount, formatMoney } =
    useContext(CurrencyContext);
  const [openFaq, setOpenFaq] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    budget: "",
    preferredLanguage: "",
    message: "",
  });

  const tx = (key, fallback, options = {}) =>
    t(`citizenshipLanding.${key}`, { defaultValue: fallback, ...options });

  const trustBadges = fallbackArray(t("citizenshipLanding.trustBadges", { returnObjects: true }), [
    "Citizenship-focused property shortlist",
    "Multilingual advisor team",
    "Due diligence minded process",
  ]);
  const stats = fallbackArray(t("citizenshipLanding.stats", { returnObjects: true }), []);
  const benefits = fallbackArray(t("citizenshipLanding.benefits.items", { returnObjects: true }), []);
  const steps = fallbackArray(t("citizenshipLanding.process.steps", { returnObjects: true }), []);
  const authorityItems = fallbackArray(t("citizenshipLanding.authority.items", { returnObjects: true }), []);
  const faqs = fallbackArray(t("citizenshipLanding.faq.items", { returnObjects: true }), []);
  const currentLanguage = getSupportedLanguage(i18n.language);
  const currentCanonicalUrl = buildCitizenshipUrl(currentLanguage);

  const whatsappHref = CITIZENSHIP_WHATSAPP_URL;
  const phoneHref = `tel:${CITIZENSHIP_CONTACT_PHONE}`;
  const emailHref = `mailto:${CITIZENSHIP_EMAIL}`;

  const eligibleProjects = useMemo(() => {
    if (!Array.isArray(properties)) return [];

    return properties
      .filter((property) => isProject(property))
      .filter((property) => isCitizenshipEligible(property))
      .map((property) => {
        const displayCurrency =
          selectedCurrency && (selectedCurrency === baseCurrency || rates?.[selectedCurrency])
            ? selectedCurrency
            : baseCurrency;
        const priceInfo = getProjectCardPriceInfo(property, {
          convertAmount,
          comparisonCurrency: displayCurrency,
          defaultCurrency: baseCurrency,
        });
        const displayAmount =
          priceInfo.amount && typeof convertAmount === "function"
            ? convertAmount(priceInfo.amount, priceInfo.currency, displayCurrency)
            : priceInfo.amount;

        const hasSpecialOffer = hasProjectSpecialOffer(property);
        const hasInstallment = Boolean(
          property?.specialOffer ||
            property?.projeHakkinda?.specialOffer ||
            (Array.isArray(property?.projeHakkinda?.specialOffers) &&
              property.projeHakkinda.specialOffers.length > 0) ||
            isInstallmentProperty(property)
        );
        const projectForBadges = {
          ...property,
          gyo: property?.gyo || hasTruthyEligibilityField(property),
          citizenshipLandingEligible: true,
          hasSpecialOffer,
          specialOffer: property?.specialOffer || property?.projeHakkinda?.specialOffer,
          specialOffers: Array.isArray(property?.specialOffers)
            ? property.specialOffers
            : property?.projeHakkinda?.specialOffers,
        };

        return {
          ...property,
          title: pickText(property?.projectName, property?.title, property?.name, "Project"),
          location: [
            property?.city || property?.addressDetails?.city,
            property?.district || property?.addressDetails?.district || property?.areaName,
          ]
            .filter(Boolean)
            .join(", "),
          image: property?.images?.[0] || property?.image,
          path: resolveProjectPath(property),
          description: getLocalizedDescription(property, i18n.language),
          hasInstallment,
          hasSpecialOffer,
          badges: getCitizenshipProjectBadges(projectForBadges, {
            maxBadges: 2,
            convertAmount,
            defaultCurrency: baseCurrency,
          }),
          priceLabel: displayAmount
            ? formatMoney(displayAmount, displayCurrency, i18n.language?.startsWith("tr") ? "tr-TR" : "en-US")
            : tx("projects.priceOnRequest", "Price on request"),
        };
      })
      .slice(0, 3);
  }, [
    properties,
    convertAmount,
    selectedCurrency,
    baseCurrency,
    rates,
    formatMoney,
    i18n.language,
    t,
  ]);

  const handleChange = (field) => (event) => {
    setFormError("");
    setSubmitted(false);
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      const message = tx("form.nameError", "Please enter your name.");
      setFormError(message);
      toast.error(message);
      return;
    }
    if (!form.email.trim() && !form.phone.trim()) {
      const message = tx("form.contactError", "Please enter your email or phone number.");
      setFormError(message);
      toast.error(message);
      return;
    }
    if (form.email.trim() && !EMAIL_REGEX.test(form.email.trim())) {
      const message = tx("form.emailError", "Please enter a valid email address.");
      setFormError(message);
      toast.error(message);
      return;
    }

    setFormError("");
    setLoading(true);
    try {
      const result = await sendEmail({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        subject: tx("form.emailSubject", "Turkish Citizenship Investment Lead"),
        message:
          form.message.trim() ||
          [
            tx("form.defaultMessage", "I want a citizenship-eligible property shortlist."),
            form.budget ? `${tx("form.budget", "Budget")}: ${form.budget}` : null,
            form.preferredLanguage
              ? `${tx("form.preferredLanguage", "Preferred Language")}: ${form.preferredLanguage}`
              : null,
          ]
            .filter(Boolean)
            .join(" "),
        budget: form.budget.trim(),
        preferredLanguage: form.preferredLanguage.trim(),
        leadSource: "citizenship_ads_landing",
      });

      trackFormSubmitConversion(result?.id || result?.messageId || `citizenship-${Date.now()}`);
      setSubmitted(true);
      setForm({ name: "", email: "", phone: "", budget: "", preferredLanguage: "", message: "" });
      toast.success(tx("form.success", "Thank you. An advisor will contact you shortly."));
    } catch (error) {
      const message = tx("form.error", "Could not send your request. Please try again.");
      setFormError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const faqSchema = faqs.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "@id": `${currentCanonicalUrl}#faq`,
        mainEntity: faqs.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      }
    : null;
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "@id": `${currentCanonicalUrl}#breadcrumb`,
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: tx("schema.home", "Home"),
        item: buildCitizenshipUrl(currentLanguage).replace(CITIZENSHIP_SEO_PATH, ""),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: tx("hero.title", "Turkish Citizenship by Real Estate Investment"),
        item: currentCanonicalUrl,
      },
    ],
  };
  const realEstateAgentSchema = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    "@id": `${CITIZENSHIP_SEO_BASE_URL}/#real-estate-agent`,
    name: "HB Real Estate",
    url: CITIZENSHIP_SEO_BASE_URL,
    telephone: CITIZENSHIP_CONTACT_PHONE,
    email: CITIZENSHIP_EMAIL,
    priceRange: "$$$",
    areaServed: [
      {
        "@type": "City",
        name: "Istanbul",
      },
      {
        "@type": "Country",
        name: "Turkey",
      },
    ],
    knowsLanguage: ["English", "Turkish", "Russian"],
    makesOffer: {
      "@type": "Offer",
      name: tx("schema.offerName", "Turkish citizenship real estate investment consultation"),
      url: currentCanonicalUrl,
    },
  };

  return (
    <>
      <SEO
        title={tx("seoTitle", "Turkish Citizenship by Investment | HB Real Estate")}
        description={tx(
          "seoDescription",
          "Get Turkish citizenship by real estate investment starting from $400,000. Discover verified Istanbul properties, legal guidance, and free consultation with HB Real Estate."
        )}
        canonical={currentCanonicalUrl}
        image={istanbulHero}
        locale={CITIZENSHIP_LOCALES[currentLanguage]}
        localeAlternates={Object.entries(CITIZENSHIP_LOCALES)
          .filter(([language]) => language !== currentLanguage)
          .map(([, locale]) => locale)}
        languageAlternates={citizenshipLanguageAlternates}
        structuredData={[faqSchema, breadcrumbSchema, realEstateAgentSchema].filter(Boolean)}
      />

      <main className="bg-[#f8fbfa] text-slate-900">
        <section
          className="relative overflow-hidden pt-24"
          style={{
            backgroundImage: `linear-gradient(90deg, rgba(248,251,250,0.97) 0%, rgba(248,251,250,0.9) 46%, rgba(248,251,250,0.42) 100%), linear-gradient(180deg, rgba(248,251,250,0.2) 0%, #f8fbfa 100%), url(${istanbulHero})`,
            backgroundPosition: "center",
            backgroundSize: "cover",
          }}
        >
          <div className="mx-auto grid min-h-[calc(100svh-5rem)] max-w-[1320px] items-center gap-10 px-4 pb-12 pt-8 sm:px-6 lg:grid-cols-[1fr_430px] lg:px-8">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 border border-[#dbeee7] bg-white/90 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#008f5a] shadow-sm backdrop-blur">
                <FaPassport />
                {tx("hero.eyebrow", "Turkish Citizenship by Investment")}
              </div>
              <h1 className="mt-5 text-4xl font-semibold leading-[1.03] tracking-normal text-slate-950 sm:text-5xl lg:text-7xl">
                {tx("hero.title", "Invest in Turkish real estate. Build your citizenship path.")}
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-700 sm:text-lg">
                {tx(
                  "hero.subtitle",
                  "Get a curated shortlist of citizenship-eligible Istanbul projects, guided by an advisor who understands compliance, valuation, and resale quality."
                )}
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#citizenship-lead"
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 bg-[#00A86B] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#00A86B]/25 transition hover:bg-[#009A61]"
                >
                  {tx("hero.primaryCta", "Get my shortlist")}
                  <FaArrowRight />
                </a>
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-whatsapp-url={whatsappHref}
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 border border-[#dbeee7] bg-white/90 px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm backdrop-blur transition hover:border-[#00A86B]/35 hover:bg-white"
                >
                  <FaWhatsapp className="text-[#25D366]" />
                  {tx("hero.whatsappCta", "Talk on WhatsApp")}
                </a>
              </div>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <a
                  href={phoneHref}
                  className="inline-flex min-h-[42px] items-center justify-center gap-2 border border-[#dbeee7] bg-white/85 px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm backdrop-blur transition hover:border-[#00A86B]/35 hover:bg-white"
                >
                  <FaPhone className="text-[#00A86B]" />
                  {CITIZENSHIP_CONTACT_PHONE}
                </a>
                <a
                  href={emailHref}
                  className="inline-flex min-h-[42px] items-center justify-center gap-2 border border-[#dbeee7] bg-white/85 px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm backdrop-blur transition hover:border-[#00A86B]/35 hover:bg-white"
                >
                  <FaEnvelope className="text-[#971b1e]" />
                  {CITIZENSHIP_EMAIL}
                </a>
              </div>
              <div className="mt-8 flex flex-wrap gap-2">
                {trustBadges.map((badge) => (
                  <span
                    key={badge}
                    className="inline-flex items-center gap-2 border border-[#dbeee7] bg-white/90 px-3 py-2 text-xs font-medium text-slate-700 shadow-sm backdrop-blur"
                  >
                    <FaCircleCheck className="text-[#00A86B]" />
                    {badge}
                  </span>
                ))}
              </div>
            </div>

            <section
              id="citizenship-lead"
              className="border border-[#dbeee7] bg-white/95 p-5 shadow-[0_28px_70px_-45px_rgba(0,120,78,0.35)] backdrop-blur-md sm:p-6"
            >
              <div className="mb-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#008f5a]">
                  {tx("form.eyebrow", "Private consultation")}
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                  {tx("form.title", "Request eligible projects")}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {tx("form.subtitle", "Share your contact details and investment range.")}
                </p>
              </div>

              {submitted ? (
                <div className="border border-[#dbeee7] bg-[#f1fbf7] p-4 text-sm leading-6 text-slate-700">
                  <FaCheck className="mb-3 text-[#00A86B]" />
                  {tx("form.submitted", "Your request was received. Our team will prepare the next step.")}
                </div>
              ) : null}
              {formError ? (
                <div className="border border-[#f0c7c7] bg-[#fff5f5] p-4 text-sm leading-6 text-[#971b1e]">
                  {formError}
                </div>
              ) : null}

              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                <Field label={tx("form.name", "Full name")}>
                  <input
                    value={form.name}
                    onChange={handleChange("name")}
                    className="h-12 w-full border border-[#dbeee7] bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#00A86B]"
                    placeholder={tx("form.namePlaceholder", "Your name")}
                  />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label={tx("form.phone", "Phone / WhatsApp")}>
                    <input
                      value={form.phone}
                      onChange={handleChange("phone")}
                      className="h-12 w-full border border-[#dbeee7] bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#00A86B]"
                      placeholder="+90..."
                    />
                  </Field>
                  <Field label={tx("form.email", "Email")}>
                    <input
                      type="email"
                      value={form.email}
                      onChange={handleChange("email")}
                      className="h-12 w-full border border-[#dbeee7] bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#00A86B]"
                      placeholder="name@example.com"
                    />
                  </Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label={tx("form.budget", "Budget")}>
                    <select
                      value={form.budget}
                      onChange={handleChange("budget")}
                      className="h-12 w-full border border-[#dbeee7] bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-[#00A86B]"
                    >
                      <option value="">{tx("form.select", "Select")}</option>
                      <option>$400k - $600k</option>
                      <option>$600k - $1M</option>
                      <option>$1M+</option>
                    </select>
                  </Field>
                  <Field label={tx("form.preferredLanguage", "Preferred Language")}>
                    <select
                      value={form.preferredLanguage}
                      onChange={handleChange("preferredLanguage")}
                      className="h-12 w-full border border-[#dbeee7] bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-[#00A86B]"
                    >
                      <option value="">{tx("form.select", "Select")}</option>
                      <option value="English">{tx("form.languageEnglish", "English")}</option>
                      <option value="Turkish">{tx("form.languageTurkish", "Turkish")}</option>
                      <option value="Russian">{tx("form.languageRussian", "Russian")}</option>
                    </select>
                  </Field>
                </div>
                <Field label={tx("form.message", "Notes")}>
                  <textarea
                    value={form.message}
                    onChange={handleChange("message")}
                    rows={3}
                    className="w-full resize-none border border-[#dbeee7] bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#00A86B]"
                    placeholder={tx("form.messagePlaceholder", "Preferred city, unit type, or family needs")}
                  />
                </Field>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex min-h-[50px] w-full items-center justify-center gap-2 bg-[#00A86B] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#00A86B]/20 transition hover:bg-[#009A61] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? tx("form.sending", "Sending...") : tx("form.submit", "Send request")}
                  <FaArrowRight />
                </button>
                <p className="text-xs leading-5 text-slate-500">
                  {tx("form.privacy", "Your details are used only to respond to this investment request.")}
                </p>
              </form>
            </section>
          </div>
        </section>

        <section className="border-y border-[#dbeee7] bg-white">
          <div className="mx-auto grid max-w-[1320px] grid-cols-2 gap-px bg-[#dbeee7] px-0 sm:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-white px-4 py-6 text-center">
                <p className="text-2xl font-semibold text-[#00A86B] sm:text-3xl">{stat.value}</p>
                <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1320px]">
            <div className="max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#008f5a]">
                {tx("benefits.eyebrow", "Why this route")}
              </p>
              <h2 className="mt-3 text-3xl font-semibold text-slate-950 sm:text-4xl">
                {tx("benefits.title", "A property purchase should work beyond the passport.")}
              </h2>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {benefits.map((benefit, index) => {
                const Icon = [FaShieldHalved, FaGem, FaHandshake][index] || FaCheck;
                return (
                  <article key={benefit.title} className="border border-[#dbeee7] bg-white p-6 shadow-[0_18px_50px_-38px_rgba(0,120,78,0.25)]">
                    <Icon className="text-2xl text-[#00A86B]" />
                    <h3 className="mt-5 text-xl font-semibold text-slate-950">{benefit.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-600">{benefit.body}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-white px-4 py-16 text-slate-950 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1320px]">
            <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#008f5a]">
                  {tx("process.eyebrow", "5-step process")}
                </p>
                <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">
                  {tx("process.title", "From first shortlist to compliant ownership.")}
                </h2>
              </div>
              <div className="grid gap-4">
                {steps.map((step, index) => (
                  <div key={step.title} className="grid grid-cols-[48px_1fr] gap-4 border border-[#dbeee7] bg-white p-4">
                    <div className="flex h-12 w-12 items-center justify-center bg-[#00A86B] text-sm font-bold text-white">
                      {String(index + 1).padStart(2, "0")}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{step.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{step.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1320px]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-2xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#008f5a]">
                  {tx("projects.eyebrow", "Eligible projects")}
                </p>
                <h2 className="mt-3 text-3xl font-semibold text-slate-950 sm:text-4xl">
                  {tx("projects.title", "Citizenship-focused Istanbul opportunities")}
                </h2>
              </div>
              <Link
                to="/listing?citizenshipEligible=true"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#008f5a] hover:text-[#971b1e]"
              >
                {tx("projects.viewAll", "View all eligible listings")}
                <FaArrowRight />
              </Link>
            </div>

            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {eligibleProjects.map((project) => (
                <article key={project.id} className="overflow-hidden border border-[#dbeee7] bg-white shadow-[0_18px_50px_-38px_rgba(0,120,78,0.25)]">
                  <Link to={project.path} className="block">
                    <div className="relative aspect-[16/10] overflow-hidden bg-[#f1fbf7]">
                      {project.image ? (
                        <img
                          src={getOptimizedImageUrl(project.image, { width: 900, height: 560 })}
                          alt={project.title}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover transition duration-500 hover:scale-[1.03]"
                        />
                      ) : null}
                      {project.badges?.length > 0 ? (
                        <div className="absolute left-3.5 top-3.5 z-10 flex max-w-[78%] flex-wrap gap-2">
                          {project.badges.map((badge) => (
                            <span
                              key={badge.key}
                              className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] shadow-[0_10px_22px_-16px_rgba(15,23,42,0.75)] backdrop-blur-sm ${
                                PROJECT_BADGE_TONE_CLASSES[badge.tone] ||
                                PROJECT_BADGE_TONE_CLASSES.slate
                              }`}
                            >
                              {t(`localProjects.badges.${badge.key}`, { defaultValue: badge.key })}
                            </span>
                          ))}
                        </div>
                      ) : null}
                      {project.hasSpecialOffer ? (
                        <div className="pointer-events-none absolute right-[-46px] top-6 z-20 rotate-45 bg-[#971b1e] px-10 py-1.5 shadow-[0_10px_25px_-12px_rgba(151,27,30,0.85)]">
                          <span className="block max-w-[6.5rem] truncate font-serif text-[10px] font-black italic uppercase tracking-[0.18em] text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.18)]">
                            {t("localProjects.badges.specialOffer", { defaultValue: "Special Offer" })}
                          </span>
                        </div>
                      ) : null}
                    </div>
                    <div className="p-5">
                      <p className="flex items-center gap-2 text-xs text-slate-500">
                        <FaLocationDot className="text-[#00A86B]" />
                        {project.location || tx("projects.locationFallback", "Istanbul, Turkey")}
                      </p>
                      <h3 className="mt-3 line-clamp-2 text-xl font-semibold text-slate-950">
                        {project.title}
                      </h3>
                      <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">
                        {project.description || tx("projects.descriptionFallback", "Selected development for citizenship-led buyers.")}
                      </p>
                      <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        {tx("projects.startingPrice", "Starting price")}
                      </p>
                      <p className="mt-1 text-lg font-semibold text-[#971b1e]">{project.priceLabel}</p>
                    </div>
                  </Link>
                  <div className="grid grid-cols-2 gap-2 border-t border-[#dbeee7] p-4">
                    <Link
                      to={project.path}
                      className="inline-flex min-h-[42px] items-center justify-center bg-[#00A86B] px-3 text-sm font-bold text-white transition hover:bg-[#009A61]"
                    >
                      {tx("projects.viewDetails", "View Details")}
                    </Link>
                    <a
                      href={buildProjectWhatsAppUrl(
                        project,
                        tx("projects.whatsappMessage", "Hello, I am interested in this citizenship eligible project: {{project}}", {
                          project: project.title,
                        })
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-whatsapp-url={buildProjectWhatsAppUrl(
                        project,
                        tx("projects.whatsappMessage", "Hello, I am interested in this citizenship eligible project: {{project}}", {
                          project: project.title,
                        })
                      )}
                      className="inline-flex min-h-[42px] items-center justify-center gap-2 border border-[#dbeee7] px-3 text-sm font-semibold text-slate-800 transition hover:border-[#00A86B]/40"
                    >
                      <FaWhatsapp className="text-[#25D366]" />
                      {tx("projects.whatsapp", "WhatsApp")}
                    </a>
                  </div>
                </article>
              ))}
              {!isLoading && eligibleProjects.length === 0 ? (
                <div className="border border-[#dbeee7] bg-white p-6 text-sm leading-7 text-slate-600 md:col-span-3">
                  {tx("projects.empty", "Eligible project inventory changes often. Request a private shortlist for current options.")}
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <section className="border-y border-[#dbeee7] bg-[#f1fbf7] px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-[1320px] gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#008f5a]">
                {tx("authority.eyebrow", "Trust and authority")}
              </p>
              <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">
                {tx("authority.title", "Built for serious international buyers.")}
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                {tx(
                  "authority.body",
                  "HB International combines real estate selection, local market context, and multilingual client coordination for buyers who need clarity before committing capital."
                )}
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {authorityItems.map((item, index) => {
                const Icon = [FaBuildingColumns, FaClock, FaPhone][index] || FaCheck;
                return (
                  <div key={item.title} className="border border-[#dbeee7] bg-white p-5">
                    <Icon className="text-xl text-[#00A86B]" />
                    <h3 className="mt-4 font-semibold text-slate-950">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{item.body}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-white px-4 py-16 text-slate-950 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#008f5a]">
              {tx("faq.eyebrow", "FAQ")}
            </p>
            <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">
              {tx("faq.title", "Questions buyers ask before they move.")}
            </h2>
            <div className="mt-8 divide-y divide-[#dbeee7] border-y border-[#dbeee7]">
              {faqs.map((item, index) => (
                <button
                  key={item.question}
                  type="button"
                  onClick={() => setOpenFaq(openFaq === index ? -1 : index)}
                  className="block w-full py-5 text-left"
                >
                  <span className="flex items-center justify-between gap-4">
                    <span className="text-base font-semibold">{item.question}</span>
                    <span className="text-xl text-[#00A86B]">{openFaq === index ? "-" : "+"}</span>
                  </span>
                  {openFaq === index ? (
                    <span className="mt-3 block text-sm leading-7 text-slate-600">{item.answer}</span>
                  ) : null}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#f8fbfa] px-4 py-16 pb-28 text-center sm:px-6 lg:px-8 lg:pb-16">
          <div className="mx-auto max-w-4xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#008f5a]">
              {tx("finalCta.eyebrow", "Start with clarity")}
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-slate-950 sm:text-5xl">
              {tx("finalCta.title", "Get a private citizenship property shortlist.")}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-600">
              {tx("finalCta.body", "Tell us your budget and timing. We will respond with the most relevant next step.")}
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <a
                href="#citizenship-lead"
                className="inline-flex min-h-[50px] items-center justify-center gap-2 bg-[#00A86B] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[#00A86B]/20 transition hover:bg-[#009A61]"
              >
                {tx("finalCta.primary", "Request shortlist")}
                <FaArrowRight />
              </a>
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                data-whatsapp-url={whatsappHref}
                className="inline-flex min-h-[50px] items-center justify-center gap-2 border border-[#dbeee7] bg-white px-6 py-3 text-sm font-semibold text-slate-800 transition hover:border-[#00A86B]/40"
              >
                <FaWhatsapp className="text-[#25D366]" />
                {tx("finalCta.whatsapp", "WhatsApp advisor")}
              </a>
              <a
                href={phoneHref}
                className="inline-flex min-h-[50px] items-center justify-center gap-2 border border-[#dbeee7] bg-white px-6 py-3 text-sm font-semibold text-slate-800 transition hover:border-[#00A86B]/40"
              >
                <FaPhone className="text-[#00A86B]" />
                {tx("finalCta.phone", "Call now")}
              </a>
              <a
                href={emailHref}
                className="inline-flex min-h-[50px] items-center justify-center gap-2 border border-[#dbeee7] bg-white px-6 py-3 text-sm font-semibold text-slate-800 transition hover:border-[#971b1e]/30"
              >
                <FaEnvelope className="text-[#971b1e]" />
                {tx("finalCta.email", "Email us")}
              </a>
            </div>
          </div>
        </section>

        <div className="fixed inset-x-0 bottom-0 z-[90] border-t border-[#dbeee7] bg-white/95 p-3 shadow-[0_-12px_30px_-24px_rgba(0,120,78,0.35)] backdrop-blur lg:hidden">
          <div className="grid grid-cols-3 gap-2">
            <a
              href="#citizenship-lead"
              className="inline-flex min-h-[46px] items-center justify-center bg-[#00A86B] px-3 text-sm font-bold text-white"
            >
              {tx("sticky.form", "Get shortlist")}
            </a>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              data-whatsapp-url={whatsappHref}
              className="inline-flex min-h-[46px] items-center justify-center gap-2 border border-[#dbeee7] px-3 text-sm font-semibold text-slate-800"
            >
              <FaWhatsapp className="text-[#25D366]" />
              WhatsApp
            </a>
            <a
              href={phoneHref}
              className="inline-flex min-h-[46px] items-center justify-center gap-2 border border-[#dbeee7] px-3 text-sm font-semibold text-slate-800"
            >
              <FaPhone className="text-[#00A86B]" />
              {tx("sticky.phone", "Call")}
            </a>
          </div>
        </div>
      </main>
    </>
  );
};

export default CitizenshipLanding;
