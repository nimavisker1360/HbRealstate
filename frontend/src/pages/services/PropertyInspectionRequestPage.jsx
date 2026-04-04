import { useTranslation } from "react-i18next";
import ServicePageChrome from "../../components/services/ServicePageChrome";
import InspectionServiceForm from "../../components/services/InspectionServiceForm";
import { SITE_URL } from "../../utils/seo";

const PropertyInspectionRequestPage = () => {
  const { t } = useTranslation();
  const path = "/services/property-inspection/request";
  const title = t("services.inspection.seo.requestTitle");
  const description = t("services.inspection.seo.requestDescription");

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
        { label: t("services.inspection.breadcrumb"), to: "/services/property-inspection" },
        { label: t("services.inspection.requestBreadcrumb") },
      ]}
    >
      <h1 className="text-3xl font-bold text-white mb-2">{t("services.inspection.requestPage.title")}</h1>
      <p className="text-white/70 mb-8 max-w-xl">{t("services.inspection.requestPage.subtitle")}</p>
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8">
        <InspectionServiceForm />
      </div>
    </ServicePageChrome>
  );
};

export default PropertyInspectionRequestPage;
