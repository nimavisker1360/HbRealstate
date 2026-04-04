import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ServicePageChrome from "../../components/services/ServicePageChrome";

const PropertyInspectionSampleReportPage = () => {
  const { t } = useTranslation();
  const path = "/services/property-inspection/sample-report";
  const title = t("services.inspection.seo.sampleTitle");
  const description = t("services.inspection.seo.sampleDescription");

  const rows = [1, 2, 3, 4, 5].map((i) => ({
    section: t(`services.inspection.sample.row${i}Section`),
    score: t(`services.inspection.sample.row${i}Score`),
    note: t(`services.inspection.sample.row${i}Note`),
  }));

  return (
    <ServicePageChrome
      title={title}
      description={description}
      canonicalPath={path}
      breadcrumbItems={[
        { label: t("services.breadcrumb.home"), to: "/" },
        { label: t("services.breadcrumb.services"), to: "/services" },
        { label: t("services.inspection.breadcrumb"), to: "/services/property-inspection" },
        { label: t("services.inspection.sampleBreadcrumb") },
      ]}
    >
      <h1 className="text-3xl font-bold text-white mb-4">{t("services.inspection.samplePage.title")}</h1>
      <p className="text-white/75 mb-8 max-w-2xl">{t("services.inspection.samplePage.intro")}</p>

      <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden mb-8">
        <div className="grid grid-cols-3 gap-4 text-xs sm:text-sm font-semibold text-white bg-[#2d3e50] p-3 border-b border-white/10">
          <span>{t("services.inspection.samplePage.colSection")}</span>
          <span>{t("services.inspection.samplePage.colScore")}</span>
          <span>{t("services.inspection.samplePage.colRisk")}</span>
        </div>
        {rows.map((r) => (
          <div
            key={r.section}
            className="grid grid-cols-1 sm:grid-cols-3 gap-2 border-t border-white/10 p-4 text-sm text-white/85"
          >
            <span className="font-medium text-white">{r.section}</span>
            <span className="text-[#06a84e]">{r.score}</span>
            <span className="text-white/70">{r.note}</span>
          </div>
        ))}
        <div className="border-t border-white/10 p-4 flex flex-wrap justify-between items-center gap-4">
          <div>
            <p className="text-xs text-white/50">{t("services.inspection.samplePage.totalLabel")}</p>
            <p className="text-2xl font-bold text-white">78 / 100</p>
          </div>
          <div>
            <p className="text-xs text-white/50">{t("services.inspection.samplePage.riskLabel")}</p>
            <p className="text-lg font-semibold text-amber-300">{t("services.inspection.samplePage.riskValue")}</p>
          </div>
        </div>
      </div>

      <p className="text-sm text-white/60 mb-6">{t("services.inspection.samplePage.disclaimer")}</p>

      <Link
        to="/services/property-inspection/request"
        className="inline-flex rounded-xl bg-[#06a84e] px-6 py-3 font-bold text-white hover:bg-[#059944]"
      >
        {t("services.inspection.landing.ctaRequest")}
      </Link>
    </ServicePageChrome>
  );
};

export default PropertyInspectionSampleReportPage;
