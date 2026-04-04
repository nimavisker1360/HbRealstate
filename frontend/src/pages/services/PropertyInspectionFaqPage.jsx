import { useTranslation } from "react-i18next";
import ServicePageChrome from "../../components/services/ServicePageChrome";
import FaqSection, { buildFaqSchema } from "../../components/seo/FaqSection";
const PropertyInspectionFaqPage = () => {
  const { t } = useTranslation();
  const path = "/services/property-inspection/faq";
  const title = t("services.inspection.seo.faqTitle");
  const description = t("services.inspection.seo.faqDescription");

  const items = [1, 2, 3, 4, 5, 6].map((i) => ({
    question: t(`services.inspection.faqPage.q${i}`),
    answer: t(`services.inspection.faqPage.a${i}`),
  }));

  const faqSchema = buildFaqSchema(items);

  return (
    <ServicePageChrome
      title={title}
      description={description}
      canonicalPath={path}
      structuredData={faqSchema ? [faqSchema] : []}
      breadcrumbItems={[
        { label: t("services.breadcrumb.home"), to: "/" },
        { label: t("services.breadcrumb.services"), to: "/services" },
        { label: t("services.inspection.breadcrumb"), to: "/services/property-inspection" },
        { label: t("services.inspection.faqBreadcrumb") },
      ]}
    >
      <h1 className="text-3xl font-bold text-white mb-6">{t("services.inspection.faqPage.heading")}</h1>
      <div className="rounded-3xl bg-white p-6 sm:p-8">
        <FaqSection title={t("services.inspection.faqPage.heading")} items={items} />
      </div>
    </ServicePageChrome>
  );
};

export default PropertyInspectionFaqPage;
