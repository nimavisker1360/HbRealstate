import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ListingClient from "../../../components/listing/ListingClient";
import { readListingFilters } from "../../../lib/listingParams";
import {
  getProperties,
  resolvePropertyTypeFromSlug,
} from "../../../lib/server/getProperties";
import {
  buildTypeCanonicalUrl,
  getSiteUrl,
  shouldIndexListingPage,
} from "../../../lib/seo";
import type { PropertiesApiResponse } from "../../../types/property";

export const dynamic = "force-dynamic";

type PageSearchParams = Record<string, string | string[] | undefined>;

interface TypePageProps {
  params: { type: string } | Promise<{ type: string }>;
  searchParams: PageSearchParams | Promise<PageSearchParams>;
}

const resolveParams = async (
  params: { type: string } | Promise<{ type: string }>,
): Promise<{ type: string }> => Promise.resolve(params);

const resolveSearchParams = async (
  searchParams: PageSearchParams | Promise<PageSearchParams>,
): Promise<PageSearchParams> => Promise.resolve(searchParams);

const mergeTypeIntoParams = (
  rawSearchParams: PageSearchParams,
  propertyType: string,
): URLSearchParams => {
  const merged = new URLSearchParams();

  for (const [key, value] of Object.entries(rawSearchParams)) {
    if (typeof value === "string") {
      merged.set(key, value);
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) merged.append(key, item);
    }
  }

  merged.delete("propertyType");
  merged.append("propertyType", propertyType);
  return merged;
};

export async function generateMetadata({
  params,
  searchParams,
}: TypePageProps): Promise<Metadata> {
  const { type } = await resolveParams(params);
  const propertyType = resolvePropertyTypeFromSlug(type);

  if (!propertyType) {
    return {
      title: "Type Not Found",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const mergedParams = mergeTypeIntoParams(
    await resolveSearchParams(searchParams),
    propertyType,
  );
  const filters = readListingFilters(mergedParams);
  const shouldIndex = shouldIndexListingPage(filters);
  const canonical = buildTypeCanonicalUrl(propertyType);

  return {
    title: `${propertyType} listings`,
    description: `Browse ${propertyType} real estate listings with crawlable, server-rendered pages.`,
    alternates: {
      canonical,
    },
    openGraph: {
      title: `${propertyType} listings`,
      description: `Browse ${propertyType} real estate listings.`,
      url: canonical,
      type: "website",
    },
    robots: {
      index: shouldIndex,
      follow: true,
    },
  };
}

export default async function TypePage({ params, searchParams }: TypePageProps) {
  const { type } = await resolveParams(params);
  const propertyType = resolvePropertyTypeFromSlug(type);

  if (!propertyType) {
    notFound();
  }

  const mergedParams = mergeTypeIntoParams(
    await resolveSearchParams(searchParams),
    propertyType,
  );
  const filters = readListingFilters(mergedParams);
  const initialQueryString = mergedParams.toString();
  const canonicalUrl = buildTypeCanonicalUrl(propertyType);
  const siteUrl = getSiteUrl();

  let initialData: PropertiesApiResponse = {
    items: [],
    total: 0,
    page: 1,
    pages: 1,
  };

  try {
    initialData = await getProperties(filters);
  } catch (error) {
    console.error("Type listing fetch failed:", error);
  }

  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${propertyType} listings`,
    description: `Property type landing page for ${propertyType}.`,
    url: canonicalUrl,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: initialData.total,
      itemListElement: initialData.items.slice(0, 20).map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.title,
        url: `${siteUrl}/property/${encodeURIComponent(item.slug)}`,
      })),
    },
  };

  return (
    <main className="min-h-screen bg-slate-50 py-8">
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <h1 className="mb-2 text-3xl font-semibold text-slate-900">
          {propertyType} listings
        </h1>
        <p className="mb-6 text-sm text-slate-600">
          Dedicated type landing page for transactional search intent.
        </p>

        <ListingClient
          initialQueryString={initialQueryString}
          initialData={initialData}
          searchVariant="default"
        />
      </div>
    </main>
  );
}
