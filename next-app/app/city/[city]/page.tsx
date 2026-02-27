import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ListingClient from "../../../components/listing/ListingClient";
import { readListingFilters } from "../../../lib/listingParams";
import { getProperties, resolveCityBySlug } from "../../../lib/server/getProperties";
import {
  buildCityCanonicalUrl,
  getSiteUrl,
  shouldIndexListingPage,
} from "../../../lib/seo";
import type { PropertiesApiResponse } from "../../../types/property";

export const dynamic = "force-dynamic";

type PageSearchParams = Record<string, string | string[] | undefined>;

interface CityPageProps {
  params: { city: string } | Promise<{ city: string }>;
  searchParams: PageSearchParams | Promise<PageSearchParams>;
}

const resolveParams = async (
  params: { city: string } | Promise<{ city: string }>,
): Promise<{ city: string }> => Promise.resolve(params);

const resolveSearchParams = async (
  searchParams: PageSearchParams | Promise<PageSearchParams>,
): Promise<PageSearchParams> => Promise.resolve(searchParams);

const mergeCityIntoParams = (
  rawSearchParams: PageSearchParams,
  cityName: string,
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

  merged.set("city", cityName);
  return merged;
};

export async function generateMetadata({
  params,
  searchParams,
}: CityPageProps): Promise<Metadata> {
  const { city } = await resolveParams(params);
  const cityName = await resolveCityBySlug(city);

  if (!cityName) {
    return {
      title: "City Not Found",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const mergedParams = mergeCityIntoParams(await resolveSearchParams(searchParams), cityName);
  const filters = readListingFilters(mergedParams);
  const shouldIndex = shouldIndexListingPage(filters);
  const canonical = buildCityCanonicalUrl(cityName);

  return {
    title: `Properties in ${cityName}`,
    description: `Browse verified real estate listings in ${cityName}.`,
    alternates: {
      canonical,
    },
    openGraph: {
      title: `Properties in ${cityName}`,
      description: `Browse verified real estate listings in ${cityName}.`,
      url: canonical,
      type: "website",
    },
    robots: {
      index: shouldIndex,
      follow: true,
    },
  };
}

export default async function CityPage({ params, searchParams }: CityPageProps) {
  const { city } = await resolveParams(params);
  const cityName = await resolveCityBySlug(city);

  if (!cityName) {
    notFound();
  }

  const mergedParams = mergeCityIntoParams(await resolveSearchParams(searchParams), cityName);
  const filters = readListingFilters(mergedParams);
  const initialQueryString = mergedParams.toString();
  const canonicalUrl = buildCityCanonicalUrl(cityName);
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
    console.error("City listing fetch failed:", error);
  }

  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Properties in ${cityName}`,
    description: `City landing page for ${cityName} real estate listings.`,
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
          Properties in {cityName}
        </h1>
        <p className="mb-6 text-sm text-slate-600">
          Indexable city page with server-rendered inventory and crawlable
          internal links.
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
