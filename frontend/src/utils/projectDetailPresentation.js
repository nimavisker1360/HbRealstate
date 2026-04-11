import {
  getProjectBadges,
  getProjectLocationLabel,
  getProjectPricePresentation,
  getProjectBenefitLine,
  getProjectSupportItems,
  buildProjectWhatsAppMessage,
} from "./projectCardPresentation";
import {
  isCitizenshipEligibleProperty,
  isInstallmentProperty,
} from "./contentGraph";

export {
  getProjectBadges,
  getProjectLocationLabel,
  getProjectPricePresentation,
  getProjectBenefitLine,
  getProjectSupportItems,
  buildProjectWhatsAppMessage,
};

export const getProjectQuickFacts = (
  project,
  { t, convertAmount, defaultCurrency = "USD" } = {}
) => {
  const facts = [];

  if (isCitizenshipEligibleProperty(project)) {
    facts.push({
      key: "citizenship",
      label: t("projectDetail.factCitizenship", {
        defaultValue: "Citizenship Eligible",
      }),
    });
  }

  if (isInstallmentProperty(project)) {
    const support = getProjectSupportItems(project, { t });
    const installItem = support.find((s) => s.key === "installment");
    facts.push({
      key: "installment",
      label: installItem
        ? `${installItem.label}: ${installItem.value}`
        : t("projectDetail.factInstallment", {
            defaultValue: "Installments Available",
          }),
    });
  }

  if (project?.deliveryDate) {
    facts.push({
      key: "delivery",
      label: `${t("projectDetail.deliveryDate", { defaultValue: "Delivery" })}: ${project.deliveryDate}`,
    });
  }

  const support = getProjectSupportItems(project, { t });
  const deedItem = support.find(
    (s) => s.key === "deed" || s.key === "deed-ready"
  );
  if (deedItem) {
    facts.push({
      key: "deed",
      label: `${deedItem.label}: ${deedItem.value}`,
    });
  }

  const location = getProjectLocationLabel(project);
  if (location) {
    facts.push({ key: "location", label: location });
  }

  return facts;
};

export const getProjectDetailCTAs = (
  project,
  { t, consultantWhatsApp, consultantPhone, isBookable = false } = {}
) => {
  const ctas = [];

  ctas.push({
    key: "priceList",
    label: t("projectDetail.ctaRequestPriceList", {
      defaultValue: "Request Price List",
    }),
    action: "inquiry",
    variant: "primary",
  });

  if (consultantWhatsApp) {
    const message = buildProjectWhatsAppMessage(project, { t });
    ctas.push({
      key: "whatsapp",
      label: t("projectDetail.ctaWhatsAppNow", {
        defaultValue: "WhatsApp Now",
      }),
      action: "whatsapp",
      href: `https://wa.me/${consultantWhatsApp}?text=${encodeURIComponent(message)}`,
      variant: "whatsapp",
    });
  }

  if (consultantPhone) {
    ctas.push({
      key: "call",
      label: t("projectDetail.ctaCallAdvisor", {
        defaultValue: "Call Advisor",
      }),
      action: "call",
      href: `tel:${consultantPhone}`,
      variant: "outline",
    });
  }

  if (isBookable) {
    ctas.push({
      key: "booking",
      label: t("projectDetail.ctaBookViewing", {
        defaultValue: "Book a Viewing",
      }),
      action: "booking",
      variant: "outline",
    });
  }

  return ctas;
};

export const getFloorPlanCTA = (plan, { t } = {}) => {
  const amount = Math.floor(Number(plan?.fiyat || 0));
  if (amount > 0) {
    return t("projectDetail.floorPlanCtaPriced", {
      defaultValue: "View Plan Details",
    });
  }
  return t("projectDetail.floorPlanCtaRequest", {
    defaultValue: "Request This Layout",
  });
};
