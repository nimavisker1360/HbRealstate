import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPropertyBySlug } from "../../../lib/server/getProperties";
import {
  buildCityCanonicalUrl,
  buildPropertyCanonicalUrl,
  getSiteUrl,
  slugifySegment,
} from "../../../lib/seo";

export const dynamic = "force-dynamic";

interface PropertyPageProps {
  params: { slug: string } | Promise<{ slug: string }>;
}

const resolveParams = async (
  params: { slug: string } | Promise<{ slug: string }>,
): Promise<{ slug: string }> => Promise.resolve(params);

export async function generateMetadata({
  params,
}: PropertyPageProps): Promise<Metadata> {
  const { slug } = await resolveParams(params);
  const property = await getPropertyBySlug(slug);

  if (!property) {
    return {
      title: "Property Not Found",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const canonical = buildPropertyCanonicalUrl(property.slug);
  const description =
    property.description ||
    `Browse ${property.title} in ${property.city}. Price: ${property.price.toLocaleString(
      "en-US",
    )} ${property.currency}.`;

  return {
    title: `${property.title} in ${property.city}`,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title: `${property.title} | ${property.city}`,
      description,
      type: "article",
      url: canonical,
      images: property.image ? [{ url: property.image }] : undefined,
    },
  };
}

export default async function PropertyPage({ params }: PropertyPageProps) {
  const { slug } = await resolveParams(params);
  const property = await getPropertyBySlug(slug);

  if (!property) {
    notFound();
  }

  const canonical = buildPropertyCanonicalUrl(property.slug);
  const cityCanonical = buildCityCanonicalUrl(property.city);
  const siteUrl = getSiteUrl();

  const schema = {
    "@context": "https://schema.org",
    "@type": "Residence",
    name: property.title,
    description: property.description || property.title,
    url: canonical,
    datePosted: property.createdAt,
    address: {
      "@type": "PostalAddress",
      addressLocality: property.city,
      addressRegion: property.district,
      addressCountry: property.country,
    },
    offers: {
      "@type": "Offer",
      price: property.price,
      priceCurrency: property.currency,
      availability: "https://schema.org/InStock",
      url: canonical,
    },
    additionalProperty: [
      { "@type": "PropertyValue", name: "Rooms", value: property.rooms },
      { "@type": "PropertyValue", name: "Bathrooms", value: property.bathrooms },
      { "@type": "PropertyValue", name: "Area (m2)", value: property.areaM2 },
      { "@type": "PropertyValue", name: "Status", value: property.status },
    ],
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: `${siteUrl}/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Listing",
        item: `${siteUrl}/listing`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: property.city,
        item: cityCanonical,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: property.title,
        item: canonical,
      },
    ],
  };

  return (
    <main className="min-h-screen bg-slate-50 py-8">
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mb-5 flex flex-wrap gap-2 text-sm text-slate-500">
          <Link href="/" className="hover:text-slate-800">
            Home
          </Link>
          <span>/</span>
          <Link href="/listing" className="hover:text-slate-800">
            Listing
          </Link>
          <span>/</span>
          <Link
            href={`/city/${slugifySegment(property.city)}`}
            className="hover:text-slate-800"
          >
            {property.city}
          </Link>
          <span>/</span>
          <span className="text-slate-700">{property.title}</span>
        </div>

        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {property.image && (
            <div className="h-72 w-full bg-slate-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={property.image}
                alt={property.title}
                className="h-full w-full object-cover"
              />
            </div>
          )}

          <div className="p-6">
            <h1 className="text-3xl font-bold text-slate-900">{property.title}</h1>
            <p className="mt-2 text-slate-600">
              {property.district}, {property.city}, {property.country}
            </p>

            <p className="mt-4 text-2xl font-bold text-emerald-700">
              {property.price.toLocaleString("en-US")} {property.currency}
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg bg-slate-100 p-3 text-sm">
                <p className="text-slate-500">Status</p>
                <p className="font-semibold text-slate-900">{property.status}</p>
              </div>
              <div className="rounded-lg bg-slate-100 p-3 text-sm">
                <p className="text-slate-500">Rooms</p>
                <p className="font-semibold text-slate-900">{property.rooms}</p>
              </div>
              <div className="rounded-lg bg-slate-100 p-3 text-sm">
                <p className="text-slate-500">Bathrooms</p>
                <p className="font-semibold text-slate-900">{property.bathrooms}</p>
              </div>
              <div className="rounded-lg bg-slate-100 p-3 text-sm">
                <p className="text-slate-500">Area</p>
                <p className="font-semibold text-slate-900">{property.areaM2} m2</p>
              </div>
            </div>

            {property.description && (
              <p className="mt-6 leading-relaxed text-slate-700">{property.description}</p>
            )}

            {property.amenities.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {property.amenities.slice(0, 18).map((amenity) => (
                  <span
                    key={amenity}
                    className="rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-xs text-slate-700"
                  >
                    {amenity}
                  </span>
                ))}
              </div>
            )}
          </div>
        </article>
      </div>
    </main>
  );
}
