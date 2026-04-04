import { useTranslation } from "react-i18next";
import ServicePageChrome from "../../components/services/ServicePageChrome";
import FaqSection, { buildFaqSchema } from "../../components/seo/FaqSection";

const HomeStagingFaqPage = () => {
  const { t } = useTranslation();
  const path = "/services/home-staging/faq";
  const title = t("services.staging.seo.faqTitle");
  const description = t("services.staging.seo.faqDescription");

  const items = [1, 2, 3, 4, 5, 6].map((i) => ({
    question: t(`services.staging.faqPage.q${i}`),
    answer: t(`services.staging.faqPage.a${i}`),
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
        { label: t("services.staging.breadcrumb"), to: "/services/home-staging" },
        { label: t("services.staging.faqBreadcrumb") },
      ]}
    >
      <h1 className="text-3xl font-bold text-white mb-6">{t("services.staging.faqPage.heading")}</h1>
      <div className="rounded-3xl bg-white p-6 sm:p-8">
        <FaqSection title={t("services.staging.faqPage.heading")} items={items} />
      </div>
    </ServicePageChrome>
  );
};

export default HomeStagingFaqPage;
