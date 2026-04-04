import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  MdArrowOutward,
  MdCheckCircle,
  MdDesignServices,
  MdFactCheck,
  MdHomeRepairService,
  MdOutlineHandshake,
  MdTrendingUp,
} from "react-icons/md";
import ServicePageChrome from "../../components/services/ServicePageChrome";
import { SITE_URL } from "../../utils/seo";

const ServicesHubPage = () => {
  const { t } = useTranslation();
  const tx = (key, defaultValue) => t(key, { defaultValue });
  const title = t("services.hub.seoTitle");
  const description = t("services.hub.seoDescription");
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: title,
    description,
    url: `${SITE_URL}/services`,
    numberOfItems: 2,
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        item: {
          "@type": "Service",
          name: t("services.hub.cardInspectionTitle"),
          url: `${SITE_URL}/services/property-inspection`,
        },
      },
      {
        "@type": "ListItem",
        position: 2,
        item: {
          "@type": "Service",
          name: t("services.hub.cardStagingTitle"),
          url: `${SITE_URL}/services/home-staging`,
        },
      },
    ],
  };

  const benefitCards = [
    {
      Icon: MdFactCheck,
      title: tx(
        "services.hub.benefit1Title",
        "Reduce uncertainty before you spend or list"
      ),
      body: tx(
        "services.hub.benefit1Body",
        "Use inspection and presentation work to make clearer pricing, repair, and timing decisions."
      ),
    },
    {
      Icon: MdTrendingUp,
      title: tx(
        "services.hub.benefit2Title",
        "Improve buyer confidence and listing performance"
      ),
      body: tx(
        "services.hub.benefit2Body",
        "Clear condition reporting and sharper presentation help serious buyers move with less hesitation."
      ),
    },
    {
      Icon: MdOutlineHandshake,
      title: tx(
        "services.hub.benefit3Title",
        "Coordinate the right next step faster"
      ),
      body: tx(
        "services.hub.benefit3Body",
        "Whether you need due diligence or sale-ready presentation, the service path is easy to understand from the first call."
      ),
    },
  ];

  const serviceCards = [
    {
      Icon: MdHomeRepairService,
      title: t("services.hub.cardInspectionTitle"),
      description: tx(
        "services.hub.cardInspectionLong",
        "Independent on-site review with structured notes, weighted scoring, and decision-ready reporting for buyers, owners, and investors."
      ),
      href: "/services/property-inspection",
      cta: tx("services.hub.cardInspectionCta", "Explore inspection"),
      highlights: [
        tx("services.hub.cardInspectionPoint1", "Best for pre-purchase and risk checks"),
        tx("services.hub.cardInspectionPoint2", "Clarifies condition, priorities, and likely capex"),
        tx("services.hub.cardInspectionPoint3", "Includes score logic and report structure"),
      ],
      accentClass: "bg-indigo-500/20 text-indigo-300",
    },
    {
      Icon: MdDesignServices,
      title: t("services.hub.cardStagingTitle"),
      description: tx(
        "services.hub.cardStagingLong",
        "Staging, light renovation, and premium marketing content designed to improve first impressions and help listings convert faster."
      ),
      href: "/services/home-staging",
      cta: tx("services.hub.cardStagingCta", "Explore staging"),
      highlights: [
        tx("services.hub.cardStagingPoint1", "Best for owners preparing to sell or rent"),
        tx("services.hub.cardStagingPoint2", "Combines presentation, media, and practical upgrades"),
        tx("services.hub.cardStagingPoint3", "Can scale from visual refresh to premium showcase"),
      ],
      accentClass: "bg-amber-500/20 text-amber-300",
    },
  ];

  const howItWorks = [
    {
      step: "01",
      title: tx("services.hub.step1Title", "Choose the right service"),
      text: tx(
        "services.hub.step1Body",
        "Inspection helps you understand condition and risk. Staging helps you improve presentation and market response."
      ),
    },
    {
      step: "02",
      title: tx("services.hub.step2Title", "Share the property basics"),
      text: tx(
        "services.hub.step2Body",
        "Send the essentials first. Extra photos, URLs, and timing details can follow once we review scope."
      ),
    },
    {
      step: "03",
      title: tx("services.hub.step3Title", "Receive a practical next step"),
      text: tx(
        "services.hub.step3Body",
        "We move you toward a report, a presentation plan, or a clearly scoped service recommendation."
      ),
    },
  ];

  return (
    <ServicePageChrome
      title={title}
      description={description}
      canonicalPath="/services"
      structuredData={[serviceSchema]}
      breadcrumbItems={[
        { label: t("services.breadcrumb.home"), to: "/" },
        { label: t("services.breadcrumb.services") },
      ]}
    >
      <section className="mb-10 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#2d3e50] to-[#1e2a38] p-8 sm:p-12">
        <div className="max-w-3xl">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.32em] text-[#82f2ac]">
            {tx("services.hub.heroEyebrow", "Commercial support for better property decisions")}
          </p>
          <h1 className="text-3xl font-bold text-white sm:text-5xl sm:leading-tight">
            {tx(
              "services.hub.heroTitle",
              "Inspection and presentation services built around real transactions"
            )}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/74 sm:text-lg">
            {tx(
              "services.hub.heroSubtitle",
              "HB Real Estate Services helps buyers reduce hidden risk and helps owners present property more convincingly, with clear service paths for inspection and staging."
            )}
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            {[
              tx("services.hub.heroChip1", "Independent inspection flow"),
              tx("services.hub.heroChip2", "Presentation-led sale support"),
              tx("services.hub.heroChip3", "Multilingual coordination"),
            ].map((item) => (
              <span
                key={item}
                className="rounded-full border border-green-300/40 bg-green-300/10 px-3 py-1 text-xs font-medium text-green-300"
              >
                {item}
              </span>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/services/property-inspection/request"
              className="inline-flex items-center justify-center rounded-xl bg-[#06a84e] px-6 py-3 font-bold text-white transition hover:bg-[#059944]"
            >
              {tx("services.hub.heroPrimaryCta", "Request inspection")}
            </Link>
          </div>
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

      <section className="mb-10 rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/45">
              {tx("services.hub.comparisonEyebrow", "Choose the right path")}
            </p>
            <h2 className="mt-2 text-2xl font-bold text-white">
              {tx("services.hub.comparisonTitle", "Two services, two different commercial goals")}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-white/68">
              {tx(
                "services.hub.comparisonSubtitle",
                "Use inspection when you need clarity on condition and risk. Use staging when you need a stronger first impression and a sharper listing story."
              )}
            </p>
          </div>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#82f2ac] transition hover:text-[#9cffbe]"
          >
            {tx("services.hub.comparisonLink", "Discuss your property")}
            <MdArrowOutward className="text-base" />
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {serviceCards.map(
            ({ Icon, title: cardTitle, description: cardDescription, href, cta, highlights, accentClass }) => (
              <Link
                key={cardTitle}
                to={href}
                className="group rounded-3xl border border-white/10 bg-[#1d2835]/60 p-7 transition-all hover:border-[#06a84e]/45 hover:bg-[#202d3b]"
              >
                <div
                  className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${accentClass}`}
                >
                  <Icon className="text-3xl" />
                </div>
                <h3 className="text-2xl font-bold text-white transition group-hover:text-[#82f2ac]">
                  {cardTitle}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-white/68">
                  {cardDescription}
                </p>
                <div className="mt-5 space-y-2">
                  {highlights.map((item) => (
                    <div key={item} className="flex items-start gap-2 text-sm text-green-300">
                      <MdCheckCircle className="mt-0.5 shrink-0 text-[#82f2ac]" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#82f2ac]">
                  {cta}
                  <MdArrowOutward className="text-base" />
                </span>
              </Link>
            )
          )}
        </div>
      </section>

      <section className="mb-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/45">
            {tx("services.hub.processEyebrow", "How it works")}
          </p>
          <h2 className="mt-2 text-2xl font-bold text-white">
            {tx("services.hub.processTitle", "Simple intake, practical outcome")}
          </h2>
          <div className="mt-6 space-y-4">
            {howItWorks.map((item) => (
              <div
                key={item.step}
                className="rounded-2xl border border-white/8 bg-[#1d2835]/55 p-4"
              >
                <span className="text-sm font-bold text-[#82f2ac]">{item.step}</span>
                <h3 className="mt-2 text-lg font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/68">{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-[#06a84e]/20 bg-[#06a84e]/8 p-6 sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#9cffbe]">
            {tx("services.hub.trustEyebrow", "Why clients start here")}
          </p>
          <h2 className="mt-2 text-2xl font-bold text-white">
            {tx("services.hub.trustTitle", "A clearer path from uncertainty to action")}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-white/74">
            {tx(
              "services.hub.trustBody",
              "These services are designed to answer practical commercial questions: what condition am I really buying, what should I fix before listing, and how do I make the asset present better without wasting scope."
            )}
          </p>
          <div className="mt-6 space-y-3">
            {[
              tx("services.hub.trustPoint1", "Independent condition review for buyers and investors"),
              tx("services.hub.trustPoint2", "Presentation-focused upgrades for owners and developers"),
              tx("services.hub.trustPoint3", "Clear next steps instead of vague consultancy"),
            ].map((item) => (
              <div key={item} className="flex items-start gap-2 text-sm text-green-300">
                <MdCheckCircle className="mt-0.5 shrink-0 text-[#9cffbe]" />
                <span>{item}</span>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-col gap-3">
            <Link
              to="/listing"
              className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 font-semibold text-[#1e2a38] transition hover:bg-white/92"
            >
              {t("services.hub.linkListings")}
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center justify-center rounded-xl border border-white/20 px-5 py-3 font-semibold text-white transition hover:bg-white/10"
            >
              {t("services.hub.linkContact")}
            </Link>
          </div>
        </div>
      </section>
    </ServicePageChrome>
  );
};

export default ServicesHubPage;
