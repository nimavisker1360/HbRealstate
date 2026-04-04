import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaWhatsapp } from "react-icons/fa";
import {
  MdArrowOutward,
  MdCheckCircle,
  MdFactCheck,
  MdHomeRepairService,
  MdTrendingUp,
} from "react-icons/md";
import ServicePageChrome from "../../components/services/ServicePageChrome";
import FaqSection, { buildFaqSchema } from "../../components/seo/FaqSection";
import { SITE_URL } from "../../utils/seo";
import { PRIMARY_CONTACT_PHONE } from "../../constant/data";
import { normalizeWhatsAppNumber } from "../../utils/common";

const PropertyInspectionLanding = () => {
  const { t } = useTranslation();
  const tx = (key, defaultValue) => t(key, { defaultValue });
  const path = "/services/property-inspection";
  const title = t("services.inspection.seo.landingTitle");
  const description = t("services.inspection.seo.landingDescription");
  const waHref = `https://wa.me/${normalizeWhatsAppNumber(PRIMARY_CONTACT_PHONE)}`;

  const faqItems = [1, 2, 3, 4, 5].map((i) => ({
    question: t(`services.inspection.faqInline.q${i}`),
    answer: t(`services.inspection.faqInline.a${i}`),
  }));

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: title,
    description,
    url: `${SITE_URL}${path}`,
    provider: {
      "@type": "Organization",
      name: "HB International Gayrimenkul",
      url: SITE_URL,
    },
    areaServed: { "@type": "Country", name: "Turkey" },
  };

  const faqSchema = buildFaqSchema(faqItems);

  const heroPoints = [
    tx("services.inspection.landing.heroPoint1", "Structured on-site checklist"),
    tx("services.inspection.landing.heroPoint2", "Weighted score with risk band"),
    tx("services.inspection.landing.heroPoint3", "Practical report for pricing and repairs"),
  ];

  const decisionCards = [
    {
      title: tx(
        "services.inspection.landing.decision1Title",
        "For buyers and investors"
      ),
      body: tx(
        "services.inspection.landing.decision1Body",
        "Understand visible condition issues before you commit price, capex, or negotiation strategy."
      ),
    },
    {
      title: tx(
        "services.inspection.landing.decision2Title",
        "For owners preparing to list"
      ),
      body: tx(
        "services.inspection.landing.decision2Body",
        "Prioritize the defects most likely to slow viewings, renegotiation, or buyer confidence."
      ),
    },
    {
      title: tx(
        "services.inspection.landing.decision3Title",
        "For remote due diligence"
      ),
      body: tx(
        "services.inspection.landing.decision3Body",
        "Get a structured site-level view when you cannot inspect the property yourself."
      ),
    },
  ];

  const reviewGroups = [
    {
      title: tx("services.inspection.landing.review1Title", "Structure and visible building integrity"),
      body: tx(
        "services.inspection.landing.review1Body",
        "Foundation, cracks, walls, roof lines, damp signals, and visible indicators that affect confidence in the asset."
      ),
    },
    {
      title: tx("services.inspection.landing.review2Title", "Utilities and service systems"),
      body: tx(
        "services.inspection.landing.review2Body",
        "Plumbing, drainage, heating, hot water, and other visible service components that can create hidden follow-on costs."
      ),
    },
    {
      title: tx("services.inspection.landing.review3Title", "Electrical and safety signals"),
      body: tx(
        "services.inspection.landing.review3Body",
        "Visible installation quality, panel condition, grounding signals, and practical safety observations."
      ),
    },
    {
      title: tx("services.inspection.landing.review4Title", "Comfort and compliance context"),
      body: tx(
        "services.inspection.landing.review4Body",
        "Windows, ventilation, insulation, occupancy clues, and visible legal-compliance signals that affect usability and resale confidence."
      ),
    },
  ];

  const scoringHighlights = [
    tx(
      "services.inspection.landing.scorePoint1",
      "Each section is scored separately so weaknesses do not disappear inside a generic summary."
    ),
    tx(
      "services.inspection.landing.scorePoint2",
      "Structure carries the heaviest weight, followed by utilities, electrical, comfort, and compliance."
    ),
    tx(
      "services.inspection.landing.scorePoint3",
      "The total score gives a fast reading, while notes and findings show where attention is actually needed."
    ),
    tx(
      "services.inspection.landing.scorePoint4",
      "Risk labels help non-technical decision-makers read urgency quickly."
    ),
  ];

  const riskLevels = [
    {
      label: tx("services.inspection.landing.riskStrong", "Strong"),
      body: tx(
        "services.inspection.landing.riskStrongBody",
        "Generally consistent visible condition with limited immediate concerns."
      ),
      tone: "border-emerald-400/30 bg-emerald-400/10",
    },
    {
      label: tx("services.inspection.landing.riskGood", "Good"),
      body: tx(
        "services.inspection.landing.riskGoodBody",
        "Solid overall picture with manageable issues worth noting."
      ),
      tone: "border-teal-400/30 bg-teal-400/10",
    },
    {
      label: tx("services.inspection.landing.riskAttention", "Needs Attention"),
      body: tx(
        "services.inspection.landing.riskAttentionBody",
        "Important items require budgeting, negotiation, or follow-up by specialist teams."
      ),
      tone: "border-amber-400/30 bg-amber-400/10",
    },
    {
      label: tx("services.inspection.landing.riskHigh", "High Risk"),
      body: tx(
        "services.inspection.landing.riskHighBody",
        "Multiple visible concerns or serious risk indicators suggest caution before proceeding."
      ),
      tone: "border-red-400/30 bg-red-400/10",
    },
  ];

  const steps = [1, 2, 3, 4].map((i) => ({
    title: t(`services.inspection.landing.step${i}Title`),
    text: t(`services.inspection.landing.step${i}Text`),
  }));

  const reportPreview = [
    {
      title: tx("services.inspection.landing.preview1Title", "Executive summary"),
      body: tx(
        "services.inspection.landing.preview1Body",
        "A fast read on overall condition, where risk concentrates, and what deserves follow-up."
      ),
    },
    {
      title: tx("services.inspection.landing.preview2Title", "Section-by-section scoring"),
      body: tx(
        "services.inspection.landing.preview2Body",
        "Weighted section scores make it easier to compare structural, utility, electrical, and comfort issues."
      ),
    },
    {
      title: tx("services.inspection.landing.preview3Title", "Key findings"),
      body: tx(
        "services.inspection.landing.preview3Body",
        "Clear notes on major observations, severity, and why the item matters commercially."
      ),
    },
    {
      title: tx("services.inspection.landing.preview4Title", "Repair and action priorities"),
      body: tx(
        "services.inspection.landing.preview4Body",
        "Practical next steps for budgeting, negotiation, remedial work, or specialist review."
      ),
    },
  ];

  return (
    <ServicePageChrome
      title={title}
      description={description}
      canonicalPath={path}
      structuredData={[serviceSchema, faqSchema].filter(Boolean)}
      breadcrumbItems={[
        { label: t("services.breadcrumb.home"), to: "/" },
        { label: t("services.breadcrumb.services"), to: "/services" },
        { label: t("services.inspection.breadcrumb") },
      ]}
    >
      <section className="relative mb-10 overflow-hidden rounded-[36px] border border-white/10 bg-gradient-to-br from-[#304153] via-[#29384a] to-[#1e2a38] p-8 sm:p-12 lg:p-14">
        <div className="pointer-events-none absolute -right-16 top-0 h-64 w-64 rounded-full bg-[#06a84e]/10 blur-3xl" />
        <div className="pointer-events-none absolute left-10 top-10 h-40 w-40 rounded-full bg-white/5 blur-3xl" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/10" />

        <div className="relative">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.32em] text-[#82f2ac]">
            {tx("services.inspection.landing.heroEyebrow", "Due diligence with commercial clarity")}
          </p>

          <div className="mb-8 rounded-[28px] border border-white/14 bg-[#314255]/55 p-5 shadow-[0_24px_70px_rgba(5,10,18,0.18)] backdrop-blur-sm sm:p-6 lg:p-7">
            <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)] xl:items-center">
              <div className="rounded-2xl border border-white/10 bg-[#273648]/65 p-5">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-300 shadow-[0_12px_30px_rgba(0,0,0,0.18)]">
                  <MdHomeRepairService className="text-3xl" />
                </div>
                <h2 className="max-w-sm text-xl font-bold leading-tight text-white sm:text-[1.55rem]">
                  {tx("services.inspection.landing.heroCardTitle", "What this service is built to answer")}
                </h2>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
              {[
                tx(
                  "services.inspection.landing.heroCardPoint1",
                  "Is the visible condition stronger or weaker than the asking narrative?"
                ),
                tx(
                  "services.inspection.landing.heroCardPoint2",
                  "Which issues affect pricing, negotiation, or immediate capex?"
                ),
                tx(
                  "services.inspection.landing.heroCardPoint3",
                  "Which parts of the asset deserve specialist follow-up before you proceed?"
                ),
              ].map((item) => (
                <div
                  key={item}
                  className="flex h-full rounded-2xl border border-white/12 bg-[#3a4c60]/55 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
                >
                  <div className="flex items-start gap-2 text-[15px] font-medium leading-relaxed text-white">
                    <MdCheckCircle className="mt-0.5 shrink-0 text-[#82f2ac]" />
                    <span>{item}</span>
                  </div>
                </div>
              ))}
              </div>
            </div>
          </div>

          <div className="max-w-5xl">
            <h1 className="max-w-4xl text-3xl font-bold text-white sm:text-5xl sm:leading-tight lg:text-[4.2rem] lg:leading-[1.03]">
            {tx(
              "services.inspection.landing.heroTitleStrong",
              "Know what you are buying, fixing, or listing before money and timing get exposed"
            )}
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-white/88 sm:text-lg">
              {t("services.inspection.landing.heroSubtitle")}
            </p>

            <div className="mt-6 flex flex-wrap gap-2.5">
              {heroPoints.map((item) => (
                <span
                  key={item}
                  className="whitespace-nowrap rounded-full border border-white/18 bg-[#2b3b4c]/70 px-4 py-1.5 text-sm font-medium text-white"
                >
                  {item}
                </span>
              ))}
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:max-w-4xl xl:grid-cols-3">
              <Link
                to="/services/property-inspection/request"
                className="inline-flex min-h-[64px] items-center justify-center rounded-2xl bg-[#06a84e] px-6 py-4 text-base font-bold text-white shadow-[0_18px_36px_rgba(6,168,78,0.22)] transition hover:bg-[#059944]"
              >
                {t("services.inspection.landing.ctaRequest")}
              </Link>
              <Link
                to="/services/property-inspection/sample-report"
                className="inline-flex min-h-[64px] items-center justify-center rounded-2xl border border-white/20 bg-[#2a3949]/78 px-6 py-4 text-base font-semibold text-white transition hover:bg-[#334456]"
              >
                {tx("services.inspection.landing.ctaSample", "Preview sample report")}
              </Link>
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[64px] items-center justify-center gap-2 whitespace-nowrap rounded-2xl border border-white/20 bg-[#2a3949]/78 px-6 py-4 text-base font-semibold text-white transition hover:bg-[#334456]"
              >
                <FaWhatsapp className="shrink-0 text-xl text-[#25D366]" />
                {t("services.common.whatsappQuick")}
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-12">
        <div className="mb-5 max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/45">
            {tx("services.inspection.landing.valueEyebrow", "Why clients request this")}
          </p>
          <h2 className="mt-2 text-2xl font-bold text-white">
            {tx("services.inspection.landing.valueHeading", "A report that supports actual decisions, not just observation")}
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {decisionCards.map((item) => (
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

      <section className="mb-12">
        <div className="mb-5 max-w-3xl">
          <h2 className="text-2xl font-bold text-white">
            {tx("services.inspection.landing.reviewHeading", "What we review on site")}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-white/68">
            {tx(
              "services.inspection.landing.reviewSubtitle",
              "The inspection is structured around the parts of the asset most likely to influence risk, pricing, repairs, and confidence."
            )}
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {reviewGroups.map((item) => (
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

      <section className="mb-12 rounded-3xl border border-[#06a84e]/25 bg-[#06a84e]/10 p-6 sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#9cffbe]">
              {tx("services.inspection.landing.midCtaEyebrow", "Move to the next step")}
            </p>
            <h2 className="mt-2 text-2xl font-bold text-white">
              {tx(
                "services.inspection.landing.midCtaTitle",
                "If the property matters financially, clarity should come before commitment"
              )}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-white/78">
              {tx(
                "services.inspection.landing.midCtaBody",
                "Share the basics now and we can confirm scope, timing, and the right inspection path."
              )}
            </p>
          </div>
          <Link
            to="/services/property-inspection/request"
            className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 font-semibold text-[#1e2a38] transition hover:bg-white/92"
          >
            {t("services.inspection.landing.ctaRequest")}
          </Link>
        </div>
      </section>

      <section className="mb-12 grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
        <div className="rounded-3xl border border-white/12 bg-white/[0.06] p-6 shadow-[0_18px_50px_rgba(8,14,24,0.12)] sm:p-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-[#9cffbe]">
              <MdFactCheck className="text-2xl" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#9cffbe]">
                {tx("services.inspection.landing.scoreEyebrow", "Scoring system")}
              </p>
              <h2 className="text-2xl font-bold text-[#9cffbe]">{t("services.inspection.landing.scoreTitle")}</h2>
            </div>
          </div>
          <p className="mt-4 text-sm font-medium leading-relaxed text-white/90">
            {t("services.inspection.landing.scoreBody")}
          </p>
          <div className="mt-5 space-y-3">
            {scoringHighlights.map((item) => (
              <div key={item} className="flex items-start gap-2 text-sm font-medium leading-relaxed text-white">
                <MdCheckCircle className="mt-0.5 shrink-0 text-[#82f2ac]" />
                <span>{item}</span>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <div className="mb-4 flex items-center gap-3">
              <MdTrendingUp className="text-2xl text-amber-300" />
              <h3 className="text-lg font-semibold text-[#9cffbe]">
                {tx("services.inspection.landing.riskHeading", "How to read the risk bands")}
              </h3>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {riskLevels.map((item) => (
                <div
                  key={item.label}
                  className={`rounded-2xl border p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] ${item.tone}`}
                >
                  <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#9cffbe]">
                    {item.label}
                  </p>
                  <p className="mt-2 text-sm font-medium leading-relaxed text-white/90">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#1d2835]/60 p-6 sm:p-8">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/8 text-indigo-300">
              <MdHomeRepairService className="text-2xl" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/45">
                {tx("services.inspection.landing.previewEyebrow", "Report teaser")}
              </p>
              <h2 className="text-2xl font-bold text-white">
                {tx("services.inspection.landing.previewHeading", "What the final report helps you see quickly")}
              </h2>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {reportPreview.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-white/8 bg-white/[0.04] p-4"
              >
                <h3 className="text-base font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/68">{item.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-white/8 bg-black/10 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-white/45">
              {tx("services.inspection.landing.previewScoreLabel", "Illustrative score view")}
            </p>
            <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
              <div className="rounded-xl bg-white/6 p-3">
                <p className="text-white/52">
                  {t("services.inspection.landing.previewMetricStructure")}
                </p>
                <p className="mt-1 font-semibold text-white">72 / 100</p>
              </div>
              <div className="rounded-xl bg-white/6 p-3">
                <p className="text-white/52">
                  {t("services.inspection.landing.previewMetricUtilities")}
                </p>
                <p className="mt-1 font-semibold text-white">81 / 100</p>
              </div>
              <div className="rounded-xl bg-white/6 p-3">
                <p className="text-white/52">
                  {t("services.inspection.landing.previewMetricRisk")}
                </p>
                <p className="mt-1 font-semibold text-amber-300">
                  {tx("services.inspection.landing.previewRiskValue", "Needs Attention")}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-4">
            <Link
              to="/services/property-inspection/sample-report"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#82f2ac] transition hover:text-[#9cffbe]"
            >
              {t("services.inspection.landing.linkSample")}
              <MdArrowOutward className="text-base" />
            </Link>
            <Link
              to="/services/property-inspection/request"
              className="inline-flex items-center gap-2 text-sm font-semibold text-white transition hover:text-[#82f2ac]"
            >
              {t("services.inspection.landing.ctaRequest")}
              <MdArrowOutward className="text-base" />
            </Link>
          </div>
        </div>
      </section>

      <section className="mb-12">
        <div className="mb-5 max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/45">
            {tx("services.inspection.landing.processEyebrow", "Delivery flow")}
          </p>
          <h2 className="mt-2 text-2xl font-bold text-white">
            {t("services.inspection.landing.processTitle")}
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {steps.map((step, idx) => (
            <div
              key={step.title}
              className="rounded-2xl border border-white/10 bg-white/5 p-5"
            >
              <span className="text-sm font-bold text-[#06a84e]">0{idx + 1}</span>
              <h3 className="mt-2 text-lg font-semibold text-white">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/82">{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-12 rounded-3xl border border-white/10 bg-white/5 p-6 text-center sm:p-8">
        <h2 className="text-xl font-bold text-white">{t("services.inspection.landing.trustTitle")}</h2>
        <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-white/70">
          {t("services.inspection.landing.trustBody")}
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-4 text-sm">
          <Link
            to="/services/property-inspection/sample-report"
            className="text-[#82f2ac] font-semibold hover:underline"
          >
            {t("services.inspection.landing.linkSample")}
          </Link>
          <Link
            to="/services/property-inspection/faq"
            className="text-[#82f2ac] font-semibold hover:underline"
          >
            {t("services.inspection.landing.linkFaq")}
          </Link>
        </div>
      </section>

      <div className="rounded-3xl bg-white p-6 sm:p-8">
        <FaqSection title={t("services.inspection.landing.faqTitle")} items={faqItems} />
      </div>

      <section className="mt-8 rounded-3xl border border-[#06a84e]/25 bg-[#06a84e]/10 p-6 sm:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#9cffbe]">
              {tx("services.inspection.landing.bottomCtaEyebrow", "Ready to start")}
            </p>
            <h2 className="mt-2 max-w-3xl text-2xl font-bold leading-tight text-white">
              {tx(
                "services.inspection.landing.bottomCtaTitle",
                "Request the inspection before hidden issues start shaping your decision for you"
              )}
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:flex xl:flex-none xl:flex-row">
            <Link
              to="/services/property-inspection/request"
              className="inline-flex min-h-[72px] items-center justify-center rounded-2xl bg-white px-6 py-4 text-base font-bold text-[#1e2a38] shadow-[0_14px_36px_rgba(10,18,28,0.12)] transition hover:bg-white/92 sm:whitespace-nowrap xl:min-w-[220px]"
            >
              {t("services.inspection.landing.ctaRequest")}
            </Link>
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[72px] items-center justify-center gap-2 whitespace-nowrap rounded-2xl border border-white/20 bg-white/[0.02] px-6 py-4 text-base font-bold text-white transition hover:bg-white/10 xl:min-w-[220px]"
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

export default PropertyInspectionLanding;
