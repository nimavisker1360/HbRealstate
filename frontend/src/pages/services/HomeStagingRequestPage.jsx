import { useTranslation } from "react-i18next";
import ServicePageChrome from "../../components/services/ServicePageChrome";
import StagingServiceForm from "../../components/services/StagingServiceForm";
import { SITE_URL } from "../../utils/seo";

const HomeStagingRequestPage = () => {
  const { t } = useTranslation();
  const path = "/services/home-staging/request";
  const title = t("services.staging.seo.requestTitle");
  const description = t("services.staging.seo.requestDescription");

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: title,
    description,
    url: `${SITE_URL}${path}`,
    provider: { "@type": "Organization", name: "HB International Gayrimenkul", url: SITE_URL },
  };

  return (
    <ServicePageChrome
      title={title}
      description={description}
      canonicalPath={path}
      structuredData={[serviceSchema]}
      breadcrumbItems={[
        { label: t("services.breadcrumb.home"), to: "/" },
        { label: t("services.breadcrumb.services"), to: "/services" },
        { label: t("services.staging.breadcrumb"), to: "/services/home-staging" },
        { label: t("services.staging.requestBreadcrumb") },
      ]}
    >
      <h1 className="text-3xl font-bold text-white mb-2">{t("services.staging.requestPage.title")}</h1>
      <p className="text-white/70 mb-8 max-w-xl">{t("services.staging.requestPage.subtitle")}</p>
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8">
        <StagingServiceForm />
      </div>
    </ServicePageChrome>
  );
};

export default HomeStagingRequestPage;
