import { useMemo } from "react";
import { useQuery } from "react-query";
import { useParams } from "react-router-dom";
import Property from "../Property";
import PropertyGridCard from "../../components/PropertyGridCard";
import SEO from "../../components/SEO";
import useProperties from "../../hooks/useProperties";
import { getProperty } from "../../utils/api";
import {
  SITE_URL,
  stripHtml,
  toAbsoluteUrl,
  truncateText,
  resolvePropertySlug,
} from "../../utils/seo";

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
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

const PropertySeoPage = () => {
  const { propertyId = "" } = useParams();
  const { data: property } = useQuery(["resd", propertyId], () =>
    getProperty(propertyId)
  );
  const { data: allProperties = [] } = useProperties();

  const slug = resolvePropertySlug(property) || propertyId;
  const canonicalPath = `/listing/${slug}`;
  const canonicalUrl = toAbsoluteUrl(canonicalPath);
  const propertyTitle = property?.title
    ? `${property.title} | HB International Real Estate`
    : "Property Detail | HB International Real Estate";
  const sourceDescription =
    property?.description_en ||
    property?.description ||
    property?.description_tr ||
    property?.description_ru ||
    "";
  const propertyDescription =
    truncateText(sourceDescription, 170) ||
    "Explore this property detail and contact HB International Real Estate for current price and availability.";

  const primaryImage = property?.images?.[0] || property?.image || "/og-image.png";

  const realEstateSchema = useMemo(() => {
    if (!property) return null;

    const geo = extractGeo(property);
    const numberOfRooms = property?.rooms || property?.facilities?.bedrooms || null;
    const areaValue = property?.area?.gross || property?.area?.net || null;

    const schema = {
      "@context": "https://schema.org",
      "@type": "RealEstateListing",
      name: property.title,
      description: stripHtml(sourceDescription),
      image: property?.images?.length
        ? property.images.map((item) => toAbsoluteUrl(item))
        : [toAbsoluteUrl(primaryImage)],
      url: canonicalUrl,
      address: {
        "@type": "PostalAddress",
        streetAddress: property?.address || "",
        addressLocality: property?.city || "",
        addressCountry: property?.country || "TR",
      },
      price: property?.price,
      currency: property?.currency || "USD",
      numberOfRooms: numberOfRooms || undefined,
      floorSize: areaValue
        ? {
            "@type": "QuantitativeValue",
            value: Number(areaValue),
            unitCode: "MTK",
          }
        : undefined,
    };

    if (geo) {
      schema.geo = {
        "@type": "GeoCoordinates",
        latitude: geo.lat,
        longitude: geo.lng,
      };
    }

    return schema;
  }, [
    canonicalUrl,
    primaryImage,
    property,
    sourceDescription,
  ]);

  const breadcrumbSchema = useMemo(() => {
    if (!property) return null;
    return {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: SITE_URL,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Listing",
          item: `${SITE_URL}/listing`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: property?.title || "Property",
          item: canonicalUrl,
        },
      ],
    };
  }, [canonicalUrl, property]);

  const relatedProperties = useMemo(() => {
    if (!property || !Array.isArray(allProperties)) return [];
    if (
      property.propertyType === "local-project" ||
      property.propertyType === "international-project"
    ) {
      return [];
    }

    const ranked = allProperties
      .filter(
        (item) =>
          item?.id &&
          item.id !== property.id &&
          item.propertyType !== "local-project" &&
          item.propertyType !== "international-project"
      )
      .map((item) => {
        let score = 0;
        if (item.city && property.city && item.city === property.city) score += 3;
        if (item.country && property.country && item.country === property.country)
          score += 2;
        if (item.category && property.category && item.category === property.category)
          score += 2;
        return { item, score };
      })
      .sort((a, b) => b.score - a.score);

    return ranked.slice(0, 4).map((entry) => entry.item);
  }, [allProperties, property]);

  return (
    <>
      <SEO
        title={propertyTitle}
        description={propertyDescription}
        canonicalPath={canonicalPath}
        image={primaryImage}
        type="product"
        structuredData={[realEstateSchema, breadcrumbSchema]}
      />

      <Property />

      {relatedProperties.length > 0 && (
        <section className="max-padd-container pb-16">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Related properties</h2>
            <p className="text-sm text-gray-500">
              Similar options in nearby locations and price ranges.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {relatedProperties.map((item) => (
              <PropertyGridCard key={item.id} property={item} />
            ))}
          </div>
        </section>
      )}
    </>
  );
};

export default PropertySeoPage;
