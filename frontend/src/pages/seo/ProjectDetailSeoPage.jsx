import { useEffect, useMemo } from "react";
import { useQuery } from "react-query";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import ProjectDetail from "../ProjectDetail";
import SEO from "../../components/SEO";
import Breadcrumbs from "../../components/seo/Breadcrumbs";
import RelatedContentSection from "../../components/seo/RelatedContentSection";
import SeoCtaSection from "../../components/seo/SeoCtaSection";
import useProperties from "../../hooks/useProperties";
import useBlogs from "../../hooks/useBlogs";
import { getProperty } from "../../utils/api";
import { contentHubPages } from "../../data/contentHubPages";
import {
  buildPropertyContext,
  pickRelatedBlogs,
  pickRelatedGuides,
  pickRelatedProjects,
  pickRelatedProperties,
} from "../../utils/contentGraph";
import {
  SITE_URL,
  extractObjectId,
  resolveProjectPath,
  stripHtml,
  toAbsoluteUrl,
  truncateText,
} from "../../utils/seo";

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const toPositiveNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const pickText = (...values) => {
  for (const value of values) {
    if (value === null || value === undefined) continue;
    const normalized = String(value).trim();
    if (normalized) return normalized;
  }
  return "";
};

const normalizePathname = (pathname, fallbackPath) => {
  const value = String(pathname || fallbackPath || "/").trim();
  if (!value) return fallbackPath || "/";
  return value.startsWith("/") ? value : `/${value}`;
};

const getDistrictFromAddress = (address) => {
  const addressText = pickText(address);
  if (!addressText) return "";
  const [firstPart] = addressText.split(",");
  return pickText(firstPart);
};

const toRoomSummary = (plans = []) => {
  const roomTypes = Array.from(
    new Set(
      plans
        .map((item) => pickText(item?.tip, item?.roomType))
        .filter(Boolean)
    )
  );
  return roomTypes.slice(0, 3).join(", ");
};

const toMainArea = (property) => {
  const planAreas =
    property?.dairePlanlari
      ?.map((item) => toPositiveNumber(item?.metrekare))
      .filter(Boolean) || [];
  if (planAreas.length > 0) return Math.min(...planAreas);
  return (
    toPositiveNumber(property?.area?.gross) ||
    toPositiveNumber(property?.area?.net) ||
    toPositiveNumber(property?.area?.m2) ||
    toPositiveNumber(property?.m2)
  );
};

const resolveProjectSchemaType = (project) => {
  const explicitSchemaType = pickText(
    project?.schemaType,
    project?.schema?.type
  ).toLowerCase();
  if (explicitSchemaType === "apartmentcomplex") return "ApartmentComplex";
  if (explicitSchemaType === "residence") return "Residence";

  const planCount = Array.isArray(project?.dairePlanlari)
    ? project.dairePlanlari.length
    : 0;
  const unitCount = toPositiveNumber(
    project?.unitCount ?? project?.totalUnits ?? project?.numberOfUnits
  );
  if (planCount > 1 || (unitCount !== null && unitCount > 1)) {
    return "ApartmentComplex";
  }
  return "Residence";
};

const extractGeo = (property) => {
  const candidates = [
    property?.geo,
    property?.coordinates,
    property?.location,
    property?.iletisim?.koordinatlar,
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    if (Array.isArray(candidate) && candidate.length >= 2) {
      const lat = toNumber(candidate[0]);
      const lng = toNumber(candidate[1]);
      if (lat !== null && lng !== null) return { lat, lng };
    }
    const lat = toNumber(
      candidate?.lat ?? candidate?.latitude ?? candidate?.y ?? candidate?.Lat
    );
    const lng = toNumber(
      candidate?.lng ??
        candidate?.lon ??
        candidate?.long ??
        candidate?.longitude ??
        candidate?.x ??
        candidate?.Lng
    );
    if (lat !== null && lng !== null) return { lat, lng };
  }

  const fallbackLat = toNumber(property?.lat ?? property?.latitude);
  const fallbackLng = toNumber(
    property?.lng ?? property?.lon ?? property?.long ?? property?.longitude
  );
  if (fallbackLat !== null && fallbackLng !== null) {
    return { lat: fallbackLat, lng: fallbackLng };
  }

  return null;
};

const resolveAvailability = (property) => {
  const explicitAvailability = pickText(property?.availability);
  if (explicitAvailability) {
    return explicitAvailability.startsWith("http")
      ? explicitAvailability
      : `https://schema.org/${explicitAvailability}`;
  }

  const listingStatus = pickText(property?.listingStatus).toLowerCase();
  if (listingStatus === "ready") return "https://schema.org/InStock";
  if (listingStatus === "offplan") return "https://schema.org/PreOrder";
  return "";
};

const ProjectDetailSeoPage = () => {
  const { projectSlugOrId: routeProjectSlugOrId = "" } = useParams();
  const navigate = useNavigate();
  const projectLookupKey = useMemo(() => {
    const normalized = String(routeProjectSlugOrId || "").trim();
    if (!normalized) return "";
    return extractObjectId(normalized) || normalized;
  }, [routeProjectSlugOrId]);
  const location = useLocation();
  const { data: project } = useQuery(
    ["project-seo", projectLookupKey],
    () => getProperty(projectLookupKey),
    {
      enabled: Boolean(projectLookupKey),
    }
  );
  const { data: allProperties = [] } = useProperties();
  const { data: blogs = [] } = useBlogs();
  useEffect(() => {
    const routeValue = String(routeProjectSlugOrId || "").trim();
    if (!routeValue || !project) return;
    const targetPath = resolveProjectPath(project);
    if (!targetPath || targetPath === location.pathname) return;
    navigate(targetPath, { replace: true });
  }, [location.pathname, navigate, project, routeProjectSlugOrId]);

  const city = pickText(project?.city, project?.addressDetails?.city);
  const district = pickText(
    project?.addressDetails?.district,
    project?.district,
    getDistrictFromAddress(project?.address)
  );
  const projectTitle = pickText(
    project?.projectName,
    project?.title,
    project?.name,
    "Project"
  );
  const locationLabel = pickText(`${city} ${district}`) || "Turkey";

  const normalizedPathname = normalizePathname(
    location.pathname,
    `/projects/${routeProjectSlugOrId}`
  );
  const canonicalUrl = `${SITE_URL}${normalizedPathname}`;

  const fallbackTitle = "Project Detail | Turkey | HB Real Estate";
  const seoTitle = project
    ? `${projectTitle} | ${locationLabel} | Project | HB Real Estate`
    : fallbackTitle;

  const sourceDescription = pickText(
    project?.projeHakkinda?.description_en,
    project?.projeHakkinda?.description,
    project?.projeHakkinda?.description_tr,
    project?.projeHakkinda?.description_ru,
    project?.description_en,
    project?.description,
    project?.description_tr,
    project?.description_ru
  );

  const roomSummary = toRoomSummary(project?.dairePlanlari);
  const areaValue = toMainArea(project);
  const numericPrice = toPositiveNumber(project?.price);
  const priceLabel =
    numericPrice && pickText(project?.currency)
      ? `${numericPrice.toLocaleString()} ${pickText(project?.currency)}`
      : numericPrice
      ? `${numericPrice.toLocaleString()}`
      : "";
  const projectStatus = pickText(project?.projectStatus, project?.listingStatus);
  const deliveryDate = pickText(project?.deliveryDate);

  const descriptionParts = [
    roomSummary ? `Layouts: ${roomSummary}` : "",
    areaValue ? `Area from ${areaValue} m2` : "",
    locationLabel ? `in ${locationLabel}` : "",
    priceLabel ? `Starting from ${priceLabel}` : "",
    projectStatus ? `Status: ${projectStatus}` : "",
    deliveryDate ? `Delivery: ${deliveryDate}` : "",
    sourceDescription ? stripHtml(sourceDescription) : "",
  ].filter(Boolean);

  const seoDescription =
    truncateText(descriptionParts.join(". "), 170) ||
    "Explore this project detail and contact HB Real Estate for current availability and pricing.";

  const primaryImage = project?.images?.[0] || project?.image || "/og-image.png";

  const projectSchema = useMemo(() => {
    if (!project) return null;

    const geo = extractGeo(project);
    const images = [
      ...(Array.isArray(project?.images) ? project.images : []),
      pickText(project?.image),
    ]
      .filter(Boolean)
      .map((item) => toAbsoluteUrl(item));

    const schema = {
      "@context": "https://schema.org",
      "@type": resolveProjectSchemaType(project),
    };

    const name = pickText(project?.projectName, project?.title, project?.name);
    if (name) schema.name = name;
    if (sourceDescription) schema.description = stripHtml(sourceDescription);
    schema.url = canonicalUrl;
    if (images.length > 0) schema.image = images;

    const address = {
      "@type": "PostalAddress",
    };
    const streetAddress = pickText(project?.address);
    const addressLocality = city;
    const addressRegion = district;
    const addressCountry = pickText(project?.country);
    if (streetAddress) address.streetAddress = streetAddress;
    if (addressLocality) address.addressLocality = addressLocality;
    if (addressRegion) address.addressRegion = addressRegion;
    if (addressCountry) address.addressCountry = addressCountry;
    if (Object.keys(address).length > 1) schema.address = address;

    if (geo) {
      schema.geo = {
        "@type": "GeoCoordinates",
        latitude: geo.lat,
        longitude: geo.lng,
      };
    }

    const offers = {
      "@type": "Offer",
    };
    const price = toPositiveNumber(project?.price);
    if (price) offers.price = price;
    const priceCurrency = pickText(project?.currency);
    if (priceCurrency) offers.priceCurrency = priceCurrency;
    const availability = resolveAvailability(project);
    if (availability) offers.availability = availability;
    offers.url = canonicalUrl;
    if (Object.keys(offers).length > 1) schema.offers = offers;

    const roomCount = toPositiveNumber(
      project?.dairePlanlari?.[0]?.tip?.split("+")?.[0]
    );
    if (roomCount) schema.numberOfRooms = roomCount;
    if (areaValue) {
      schema.floorSize = {
        "@type": "QuantitativeValue",
        value: Number(areaValue),
        unitCode: "MTK",
      };
    }

    return schema;
  }, [areaValue, canonicalUrl, city, district, project, sourceDescription]);

  const breadcrumbSchema = useMemo(
    () => {
      const itemListElement = [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: SITE_URL,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Projects",
          item: `${SITE_URL}/projects`,
        },
      ];

      if (city) {
        itemListElement.push({
          "@type": "ListItem",
          position: 3,
          name: city,
          item: `${SITE_URL}/listing?search=${encodeURIComponent(city)}`,
        });
      }

      if (district) {
        itemListElement.push({
          "@type": "ListItem",
          position: city ? 4 : 3,
          name: district,
          item: `${SITE_URL}/listing?search=${encodeURIComponent(district)}`,
        });
      }

      itemListElement.push({
        "@type": "ListItem",
        position: district ? (city ? 5 : 4) : city ? 4 : 3,
        name: projectTitle,
        item: canonicalUrl,
      });

      return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement,
      };
    },
    [canonicalUrl, city, district, projectTitle]
  );

  const projectContext = useMemo(
    () => (project ? buildPropertyContext(project) : {}),
    [project]
  );

  const relatedProjects = useMemo(
    () =>
      project
        ? pickRelatedProjects({
            properties: allProperties,
            context: projectContext,
            excludeId: project.id,
            limit: 3,
          })
        : [],
    [allProperties, project, projectContext]
  );

  const relatedProperties = useMemo(
    () =>
      project
        ? pickRelatedProperties({
            properties: allProperties,
            context: projectContext,
            excludeId: project.id,
            limit: 4,
          })
        : [],
    [allProperties, project, projectContext]
  );

  const relatedArticles = useMemo(
    () =>
      project
        ? pickRelatedBlogs({
            blogs,
            context: projectContext,
            limit: 3,
          })
        : [],
    [blogs, project, projectContext]
  );

  const relatedGuides = useMemo(
    () =>
      project
        ? pickRelatedGuides({
            guides: contentHubPages,
            context: projectContext,
            limit: 3,
          })
        : [],
    [project, projectContext]
  );

  const breadcrumbItems = [
    { label: "Home", to: "/" },
    { label: "Projects", to: "/projects" },
    ...(city ? [{ label: city, to: `/listing?search=${encodeURIComponent(city)}` }] : []),
    ...(district
      ? [{ label: district, to: `/listing?search=${encodeURIComponent(district)}` }]
      : []),
    { label: projectTitle },
  ];

  const ctaBlock = project?.gyo
    ? {
        title: "Compare this project with other citizenship-eligible options",
        description:
          "Projects should still be compared by district quality, pricing logic, and compliance readiness before you move forward.",
        primaryAction: {
          label: "See eligible listings",
          to: "/listing?citizenshipEligible=true",
        },
        secondaryAction: {
          label: "Read the citizenship guide",
          to: "/turkish-citizenship-real-estate-guide",
        },
      }
    : projectContext.installment
    ? {
        title: "Looking for more installment-based projects?",
        description:
          "Use this project as a benchmark and compare payment-plan inventory against ready stock in the same market.",
        primaryAction: {
          label: "Explore installment listings",
          to: "/listing?installmentAvailable=true",
        },
        secondaryAction: {
          label: "See installment guide",
          to: "/installment-property-in-turkey",
        },
      }
    : {
        title: "Need a broader project shortlist?",
        description:
          "Compare this project against related inventory, investment guides, and district-level context before you schedule the next call.",
        primaryAction: {
          label: "Browse all projects",
          to: "/projects",
        },
        secondaryAction: {
          label: "Request project advice",
          to: "/consultants",
        },
      };

  return (
    <>
      <SEO
        title={seoTitle}
        description={seoDescription}
        canonical={canonicalUrl}
        ogImage={primaryImage}
        type="product"
        structuredData={[projectSchema, breadcrumbSchema].filter(Boolean)}
      />
      <ProjectDetail topSlot={<Breadcrumbs items={breadcrumbItems} />} />

      <section className="max-padd-container pb-20">
        <RelatedContentSection
          title="Related Articles"
          titleKey="relatedContent.projectPage.relatedArticlesTitle"
          description="Commercial and informational content aligned with this project's location and buyer intent."
          descriptionKey="relatedContent.projectPage.relatedArticlesDescription"
          items={relatedArticles}
          contentLayout="horizontal"
        />

        <RelatedContentSection
          title="Related Projects"
          titleKey="relatedContent.projectPage.relatedProjectsTitle"
          description="Projects in similar locations, investment contexts, or payment-plan profiles."
          descriptionKey="relatedContent.projectPage.relatedProjectsDescription"
          items={relatedProjects}
          type="property"
        />

        <RelatedContentSection
          title="Related Properties"
          titleKey="relatedContent.projectPage.relatedPropertiesTitle"
          description="Ready stock and non-project listings that support commercial comparison."
          descriptionKey="relatedContent.projectPage.relatedPropertiesDescription"
          items={relatedProperties}
          type="property"
        />

        <RelatedContentSection
          title="Relevant Guides"
          titleKey="relatedContent.projectPage.relatedGuidesTitle"
          description="Tax, buying-process, district, and investment pages linked semantically to this project."
          descriptionKey="relatedContent.projectPage.relatedGuidesDescription"
          items={relatedGuides}
          contentLayout="horizontal"
        />

        <SeoCtaSection
          title={ctaBlock.title}
          description={ctaBlock.description}
          primaryAction={ctaBlock.primaryAction}
          secondaryAction={ctaBlock.secondaryAction}
        />
      </section>
    </>
  );
};

export default ProjectDetailSeoPage;
