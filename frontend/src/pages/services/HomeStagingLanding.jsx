import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaWhatsapp } from "react-icons/fa";
import {
  MdArrowOutward,
  MdCheckCircle,
  MdDesignServices,
  MdHomeRepairService,
  MdOutlineHandshake,
  MdTrendingUp,
} from "react-icons/md";
import ServicePageChrome from "../../components/services/ServicePageChrome";
import StagingTransformationShowcase from "../../components/services/StagingTransformationShowcase";
import FaqSection, { buildFaqSchema } from "../../components/seo/FaqSection";
import { getPublicServicePackages } from "../../utils/api";
import { SITE_URL } from "../../utils/seo";
import {
  formatCurrencyRange,
  humanizeToken,
  pickPackageDescription,
  pickPackageFeatures,
  pickPackageName,
  translateStagingCategory,
} from "../../utils/servicesContent";
import { PRIMARY_CONTACT_PHONE } from "../../constant/data";
import { normalizeWhatsAppNumber } from "../../utils/common";

const HomeStagingLanding = () => {
  const { t, i18n } = useTranslation();
  const tx = (key, defaultValue) => t(key, { defaultValue });
  const path = "/services/home-staging";
  const title = t("services.staging.seo.landingTitle");
  const description = t("services.staging.seo.landingDescription");
  const [packages, setPackages] = useState([]);
  const [packagesLoading, setPackagesLoading] = useState(true);
  const waHref = `https://wa.me/${normalizeWhatsAppNumber(PRIMARY_CONTACT_PHONE)}`;
  const lang = i18n.language?.slice(0, 2) || "en";
  const locale = i18n.language || "en";

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!cancelled) setPackagesLoading(true);
      try {
        const res = await getPublicServicePackages();
        if (!cancelled && res?.data) setPackages(res.data);
      } catch {
        if (!cancelled) setPackages([]);
      } finally {
        if (!cancelled) setPackagesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const faqItems = [1, 2, 3, 4].map((i) => ({
    question: t(`services.staging.faqInline.q${i}`),
    answer: t(`services.staging.faqInline.a${i}`),
  }));

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: title,
    description,
    url: `${SITE_URL}${path}`,
    provider: { "@type": "Organization", name: "HB International Gayrimenkul", url: SITE_URL },
  };

  const serviceBlocks = [
    {
      title: t("services.staging.landing.blockStagingTitle"),
      body: t("services.staging.landing.blockStagingBody"),
    },
    {
      title: t("services.staging.landing.blockRenoTitle"),
      body: t("services.staging.landing.blockRenoBody"),
    },
    {
      title: t("services.staging.landing.blockPremiumTitle"),
      body: t("services.staging.landing.blockPremiumBody"),
    },
  ];

  const benefitCards = [
    {
      Icon: MdHomeRepairService,
      title: tx("services.staging.landing.benefit1Title", "For owners who need a stronger listing"),
      body: tx(
        "services.staging.landing.benefit1Body",
        "Improve visual trust, reduce the \"needs work\" impression, and present the asset more clearly online and in viewings."
      ),
    },
    {
      Icon: MdTrendingUp,
      title: tx("services.staging.landing.benefit2Title", "For investors focused on speed and value"),
      body: tx(
        "services.staging.landing.benefit2Body",
        "Use targeted spend on staging, cosmetic upgrades, and media where the presentation gap is costing enquiries or pricing power."
      ),
    },
    {
      Icon: MdOutlineHandshake,
      title: tx("services.staging.landing.benefit3Title", "For teams who want scope, not guesswork"),
      body: tx(
        "services.staging.landing.benefit3Body",
        "We help separate simple presentation fixes from heavier work so the project stays commercially sensible."
      ),
    },
  ];

  const processSteps = [
    {
      step: "01",
      title: tx("services.staging.landing.step1Title", "Brief and property review"),
      text: tx(
        "services.staging.landing.step1Body",
        "We review your goal, asset condition, photos, and timing to identify the right level of intervention."
      ),
    },
    {
      step: "02",
      title: tx("services.staging.landing.step2Title", "Scope and package recommendation"),
      text: tx(
        "services.staging.landing.step2Body",
        "You receive a clearer plan around staging, light renovation, media production, or a bundled approach."
      ),
    },
    {
      step: "03",
      title: tx("services.staging.landing.step3Title", "Execution and content delivery"),
      text: tx(
        "services.staging.landing.step3Body",
        "The property is prepared, captured, and positioned with stronger visual confidence for sale or rental marketing."
      ),
    },
  ];

  const packageCategorySummary = {
    "visual-refresh": tx(
      "services.staging.landing.packageCategories.visual-refresh.summary",
      "A lighter scope focused on presentation quality, cleaner visuals, and faster listing readiness."
    ),
    "sale-ready": tx(
      "services.staging.landing.packageCategories.sale-ready.summary",
      "A broader package that blends selective renovation, staging, and media for stronger pricing power."
    ),
    "premium-boost": tx(
      "services.staging.landing.packageCategories.premium-boost.summary",
      "A premium launch scope for assets where finish, content, and visibility need to move together."
    ),
    custom: tx(
      "services.staging.landing.packageCategories.custom.summary",
      "A tailored scope built around the asset, timeline, and commercial objective."
    ),
  };

  return (
    <ServicePageChrome
      title={title}
      description={description}
      canonicalPath={path}
      structuredData={[serviceSchema, buildFaqSchema(faqItems)].filter(
        (x) => x != null
      )}
      breadcrumbItems={[
        { label: t("services.breadcrumb.home"), to: "/" },
        { label: t("services.breadcrumb.services"), to: "/services" },
        { label: t("services.staging.breadcrumb") },
      ]}
    >
      <section className="mb-10 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#2d3e50] to-[#1e2a38] p-8 sm:p-12">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
          <div>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.32em] text-[#82f2ac]">
              {tx("services.staging.landing.heroEyebrow", "Presentation that supports conversion")}
            </p>
            <h1 className="text-3xl font-extrabold text-white sm:text-5xl sm:leading-tight">
              {tx(
                "services.staging.landing.heroTitleStrong",
                "Turn good property into a listing that looks easier to trust, tour, and choose"
              )}
            </h1>
            <p className="mt-4 max-w-2xl text-base font-medium leading-relaxed text-white/88 sm:text-lg">
              {t("services.staging.landing.heroSubtitle")}
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              {[
                tx("services.staging.landing.heroChip1", "Staging direction"),
                tx("services.staging.landing.heroChip2", "Light renovation scope"),
                tx("services.staging.landing.heroChip3", "Premium photo and video content"),
              ].map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-green-300/40 bg-green-300/10 px-3 py-1 text-xs font-semibold text-green-300"
                >
                  {item}
                </span>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/services/home-staging/request"
                className="inline-flex items-center justify-center rounded-xl bg-[#06a84e] px-6 py-3 font-bold text-white transition hover:bg-[#059944]"
              >
                {t("services.staging.landing.ctaRequest")}
              </Link>
              <Link
                to="/services/home-staging/projects"
                className="inline-flex items-center justify-center rounded-xl border border-white/20 px-6 py-3 font-semibold text-white transition hover:bg-white/8"
              >
                {tx("services.staging.landing.ctaProjects", "View transformations")}
              </Link>
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-white/20 px-6 py-3 font-semibold text-white transition hover:bg-white/8"
              >
                <FaWhatsapp className="shrink-0 text-xl text-[#25D366]" />
                {t("services.common.whatsappQuick")}
              </a>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#1d2835]/60 p-6">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-300">
              <MdDesignServices className="text-3xl" />
            </div>
            <h2 className="text-xl font-bold text-white">
              {tx("services.staging.landing.heroCardTitle", "What this service can cover")}
            </h2>
            <div className="mt-4 space-y-3">
              {[
                tx(
                  "services.staging.landing.heroCardPoint1",
                  "Rooms that feel larger, cleaner, and more premium in photos"
                ),
                tx(
                  "services.staging.landing.heroCardPoint2",
                  "Targeted cosmetic upgrades where visible ROI is clearer than full renovation"
                ),
                tx(
                  "services.staging.landing.heroCardPoint3",
                  "Marketing assets that help international and remote buyers evaluate the property faster"
                ),
              ].map((item) => (
                <div key={item} className="flex items-start gap-2 text-sm font-medium text-white">
                  <MdCheckCircle className="mt-0.5 shrink-0 text-[#82f2ac]" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mb-10">
        <div className="mb-5 max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/45">
            {tx("services.staging.landing.scopeEyebrow", "Service scope")}
          </p>
          <h2 className="mt-2 text-2xl font-bold text-white">
            {tx("services.staging.landing.scopeTitle", "Clearer separation between staging, cosmetic works, and premium content")}
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {serviceBlocks.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-white/10 bg-white/5 p-5"
            >
              <h3 className="text-lg font-semibold text-white">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/68">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-10 grid gap-4 md:grid-cols-3">
        {benefitCards.map(({ Icon, title: cardTitle, body }) => (
          <div
            key={cardTitle}
            className="rounded-2xl border border-white/10 bg-white/5 p-5"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/8 text-[#82f2ac]">
              <Icon className="text-2xl" />
            </div>
            <h2 className="text-lg font-semibold text-white">{cardTitle}</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/68">{body}</p>
          </div>
        ))}
      </section>

      <StagingTransformationShowcase />

      <section className="mb-10 rounded-3xl border border-[#06a84e]/25 bg-[#06a84e]/10 p-6 sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#9cffbe]">
              {tx("services.staging.landing.midCtaEyebrow", "Before / after matters")}
            </p>
            <h2 className="mt-2 text-2xl font-bold text-white">
              {tx(
                "services.staging.landing.midCtaTitle",
                "If the asset already has demand potential, presentation is often the fastest lever"
              )}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-white/78">
              {tx(
                "services.staging.landing.midCtaBody",
                "Use the showcase to benchmark quality, then request a scope matched to your goal and budget."
              )}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              to="/services/home-staging/projects"
              className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 font-semibold text-[#1e2a38] transition hover:bg-white/92"
            >
              {t("services.staging.landing.linkProjects")}
            </Link>
            <Link
              to="/services/home-staging/request"
              className="inline-flex items-center justify-center rounded-xl border border-white/20 px-5 py-3 font-semibold text-white transition hover:bg-white/10"
            >
              {t("services.staging.landing.ctaRequest")}
            </Link>
          </div>
        </div>
      </section>

      <section className="mb-10">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold text-white">{t("services.staging.landing.packagesTitle")}</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/68">
              {tx(
                "services.staging.landing.packagesSubtitle",
                "Published packages show how scope, timing, and deliverables can be structured. Final scope is confirmed after review."
              )}
            </p>
          </div>
          <Link
            to="/services/home-staging/request"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#82f2ac] transition hover:text-[#9cffbe]"
          >
            {tx("services.staging.landing.packagesLink", "Request tailored scope")}
            <MdArrowOutward className="text-base" />
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {packagesLoading &&
            Array.from({ length: 3 }).map((_, index) => (
              <div
                key={`pkg-skeleton-${index}`}
                className="min-h-[320px] rounded-2xl border border-white/10 bg-white/5 p-5"
              >
                <div className="h-5 w-28 rounded-full bg-white/8" />
                <div className="mt-4 h-8 w-2/3 rounded-xl bg-white/8" />
                <div className="mt-3 h-16 rounded-2xl bg-white/7" />
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="h-16 rounded-2xl bg-white/7" />
                  <div className="h-16 rounded-2xl bg-white/7" />
                  <div className="h-16 rounded-2xl bg-white/7" />
                </div>
                <div className="mt-5 space-y-2">
                  <div className="h-4 rounded-full bg-white/7" />
                  <div className="h-4 rounded-full bg-white/7" />
                  <div className="h-4 w-5/6 rounded-full bg-white/7" />
                </div>
              </div>
            ))}

          {!packagesLoading &&
            packages.map((pkg, index) => {
              const categoryLabel = tx(
                `services.staging.landing.packageCategories.${pkg.category}.label`,
                translateStagingCategory(pkg.category, t)
              );
              const categorySummary =
                packageCategorySummary[pkg.category] ||
                tx(
                  "services.staging.landing.packageCategories.default.summary",
                  "Scope is adapted to the asset, visibility target, and delivery timeline."
                );
              const priceLabel = formatCurrencyRange(pkg, locale);
              const packageFeatures = pickPackageFeatures(pkg, lang).slice(0, 4);
              const includedServices = Array.isArray(pkg.servicesIncluded)
                ? pkg.servicesIncluded
                : [];

              return (
                <div
                  key={pkg.id}
                  className="rounded-[1.6rem] border border-amber-500/20 bg-[linear-gradient(180deg,rgba(245,158,11,0.10),rgba(255,255,255,0.04))] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.18)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full border border-amber-200/20 bg-amber-300/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-100/90">
                          {categoryLabel}
                        </span>
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/60">
                          {tx("services.staging.landing.packageOrderLabel", "Package")} {index + 1}
                        </span>
                      </div>
                      <h3 className="mt-4 text-xl font-bold text-white">
                        {pickPackageName(pkg, lang)}
                      </h3>
                    </div>

                    {pkg.estimatedDays != null && (
                      <span className="rounded-full border border-white/12 bg-white/8 px-3 py-1 text-xs font-semibold text-white/82">
                        {pkg.estimatedDays} {tx("services.staging.landing.packageDaysSuffix", "days")}
                      </span>
                    )}
                  </div>

                  <p className="mt-4 text-sm leading-relaxed text-white/74">
                    {pickPackageDescription(pkg, lang) || categorySummary}
                  </p>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-white/8 bg-[#1d2835]/55 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/46">
                        {tx("services.staging.landing.packageMetaBudget", "Indicative budget")}
                      </p>
                      <p className="mt-2 text-sm font-semibold text-white">
                        {priceLabel || tx("services.staging.landing.packageMetaCustom", "Custom")}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-[#1d2835]/55 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/46">
                        {tx("services.staging.landing.packageMetaTimeline", "Estimated timeline")}
                      </p>
                      <p className="mt-2 text-sm font-semibold text-white">
                        {pkg.estimatedDays != null
                          ? `${pkg.estimatedDays} ${tx("services.staging.landing.packageDaysSuffix", "days")}`
                          : tx("services.staging.landing.packageMetaFlexible", "Depends on scope")}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-[#1d2835]/55 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/46">
                        {tx("services.staging.landing.packageMetaIncluded", "Included services")}
                      </p>
                      <p className="mt-2 text-sm font-semibold text-white">
                        {includedServices.length} {tx("services.staging.landing.packageServicesSuffix", "items")}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#82f2ac]">
                      {tx("services.staging.landing.packageFitTitle", "Where this package fits")}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-white/72">{categorySummary}</p>
                  </div>

                  {includedServices.length > 0 && (
                    <div className="mt-5 flex flex-wrap gap-2">
                      {includedServices.map((service) => (
                        <span
                          key={`${pkg.id}-${service}`}
                          className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/65"
                        >
                          {t(`services.enums.staging.service.${service}`, {
                            defaultValue: humanizeToken(service),
                          })}
                        </span>
                      ))}
                    </div>
                  )}

                  {packageFeatures.length > 0 && (
                    <div className="mt-5 space-y-2">
                      {packageFeatures.map((feature) => (
                        <div
                          key={`${pkg.id}-${feature.id}`}
                          className="flex items-start gap-2 text-sm text-white/84"
                        >
                          <MdCheckCircle className="mt-0.5 shrink-0 text-[#82f2ac]" />
                          <span>{feature.label}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <Link
                    to="/services/home-staging/request"
                    className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#82f2ac] transition hover:text-[#9cffbe]"
                  >
                    {tx("services.staging.landing.packageCta", "Discuss this package")}
                    <MdArrowOutward className="text-base" />
                  </Link>
                </div>
              );
            })}

          {!packagesLoading && packages.length === 0 && (
            <div className="col-span-full rounded-2xl border border-white/10 bg-white/5 p-6">
              <h3 className="text-lg font-semibold text-white">
                {tx("services.staging.landing.packagesFallbackTitle", "Packages are tailored when scope is still open")}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/68">
                {t("services.staging.landing.packagesEmpty")}
              </p>
              <Link
                to="/services/home-staging/request"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#06a84e] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#059944]"
              >
                {t("services.staging.landing.ctaRequest")}
                <MdArrowOutward className="text-base" />
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="mb-10 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-white">{t("services.staging.landing.budgetTitle")}</h2>
          <p className="mt-3 text-sm leading-relaxed text-white/88">
            {t("services.staging.landing.budgetBody")}
          </p>

          <div className="mt-6 space-y-3">
            {[
              tx(
                "services.staging.landing.budgetPoint1",
                "Smaller scopes usually focus on styling, decluttering, and media production."
              ),
              tx(
                "services.staging.landing.budgetPoint2",
                "Mid-range scopes often combine presentation work with selective cosmetic upgrades."
              ),
              tx(
                "services.staging.landing.budgetPoint3",
                "Larger scopes are best reserved for visible improvements that materially change how the asset is perceived."
              ),
            ].map((item) => (
              <div key={item} className="flex items-start gap-2 text-sm font-medium text-white">
                <MdCheckCircle className="mt-0.5 shrink-0 text-[#82f2ac]" />
                <span>{item}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/8 bg-[#1d2835]/55 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/70">
                {tx("services.staging.landing.timelineCard1Label", "Typical quick scope")}
              </p>
              <p className="mt-2 text-base font-semibold text-white">
                {tx("services.staging.landing.timelineCard1Value", "Days to a few weeks")}
              </p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-[#1d2835]/55 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/70">
                {tx("services.staging.landing.timelineCard2Label", "Broader scope")}
              </p>
              <p className="mt-2 text-base font-semibold text-white">
                {tx("services.staging.landing.timelineCard2Value", "Multi-step planning and execution")}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#1d2835]/60 p-6 sm:p-8">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/8 text-[#82f2ac]">
              <MdDesignServices className="text-2xl" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/45">
                {tx("services.staging.landing.processEyebrow", "Process")}
              </p>
              <h2 className="text-2xl font-bold text-white">
                {tx("services.staging.landing.processTitle", "How staging and renovation scope is shaped")}
              </h2>
            </div>
          </div>
          <div className="space-y-4">
            {processSteps.map((item) => (
              <div
                key={item.step}
                className="rounded-2xl border border-white/8 bg-white/[0.04] p-4"
              >
                <span className="text-sm font-bold text-[#82f2ac]">{item.step}</span>
                <h3 className="mt-2 text-lg font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/68">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mb-10 flex flex-wrap gap-4">
        <Link
          to="/services/home-staging/projects"
          className="text-[#06a84e] font-semibold hover:underline"
        >
          {t("services.staging.landing.linkProjects")}
        </Link>
        <Link
          to="/services/home-staging/faq"
          className="text-[#06a84e] font-semibold hover:underline"
        >
          {t("services.staging.landing.linkFaq")}
        </Link>
      </div>

      <div className="rounded-3xl bg-white p-6 sm:p-8">
        <FaqSection title={t("services.staging.landing.faqTitle")} items={faqItems} />
      </div>

      <section className="mt-8 rounded-3xl border border-[#06a84e]/25 bg-[#06a84e]/10 p-6 sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#9cffbe]">
                {tx("services.staging.landing.bottomCtaEyebrow", "Ready to brief the project")}
              </p>
              <h2 className="mt-2 text-2xl font-bold text-white">
              {tx(
                "services.staging.landing.bottomCtaTitle",
                "Start with the asset, the goal, and the timeline. We can shape the rest with you."
              )}
              </h2>
            </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center lg:shrink-0">
            <Link
              to="/services/home-staging/request"
              className="inline-flex w-full items-center justify-center whitespace-nowrap rounded-xl bg-white px-6 py-3.5 font-semibold text-[#1e2a38] transition hover:bg-white/92 sm:w-auto sm:min-w-[220px]"
            >
              {t("services.staging.landing.ctaRequest")}
            </Link>
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-white/20 bg-white/[0.03] px-6 py-3.5 font-semibold text-white transition hover:bg-white/10 sm:w-auto sm:min-w-[220px]"
            >
              <FaWhatsapp className="shrink-0 text-xl text-[#25D366]" />
              {t("services.common.whatsappQuick")}
            </a>
          </div>
        </div>
      </section>
    </ServicePageChrome>
  );
};

export default HomeStagingLanding;
