import Link from "next/link";
import type { Metadata } from "next";
import {
  getAvailableCities,
  getAvailablePropertyTypes,
  getProperties,
} from "../lib/server/getProperties";
import { slugifySegment } from "../lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Global Real Estate Listings",
  description:
    "Explore city landing pages, property-type categories, and verified listings optimized for organic search.",
  alternates: {
    canonical: "/",
  },
};

export default async function HomePage() {
  const [featured, cities, propertyTypes] = await Promise.all([
    getProperties({ page: 1, limit: 6, sort: "newest" }).catch(() => ({
      items: [],
      total: 0,
      page: 1,
      pages: 1,
    })),
    getAvailableCities().catch(() => []),
    getAvailablePropertyTypes().catch(() => []),
  ]);

  return (
    <main className="min-h-screen bg-slate-50 py-10">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-emerald-200 bg-white px-6 py-10 shadow-sm sm:px-10">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
            SEO Hub
          </p>
          <h1 className="mt-3 text-4xl font-bold text-slate-900">
            Real Estate Search Built For Organic Growth
          </h1>
          <p className="mt-4 max-w-3xl text-slate-600">
            The new architecture is centered on indexable city and property-type
            pages. This gives search engines stable landing pages and gives
            users direct access to high-intent listings.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/listing"
              className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Open Listing
            </Link>
            <Link
              href="/city"
              className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Browse Cities
            </Link>
          </div>
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Top Cities</h2>
            <p className="mt-2 text-sm text-slate-600">
              Indexable city pages designed for geo-intent queries.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {cities.slice(0, 12).map((city) => (
                <Link
                  key={city}
                  href={`/city/${slugifySegment(city)}`}
                  className="rounded-full border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50"
                >
                  {city}
                </Link>
              ))}
              {cities.length === 0 && (
                <span className="text-sm text-slate-500">No cities available yet.</span>
              )}
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Property Types</h2>
            <p className="mt-2 text-sm text-slate-600">
              Dedicated URLs for transactional type keywords.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {propertyTypes.slice(0, 12).map((propertyType) => (
                <Link
                  key={propertyType}
                  href={`/type/${slugifySegment(propertyType)}`}
                  className="rounded-full border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50"
                >
                  {propertyType}
                </Link>
              ))}
              {propertyTypes.length === 0 && (
                <span className="text-sm text-slate-500">No types available yet.</span>
              )}
            </div>
          </article>
        </section>

        <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="text-xl font-semibold text-slate-900">Latest Listings</h2>
            <Link
              href="/listing"
              className="text-sm font-semibold text-emerald-700 transition hover:text-emerald-800"
            >
              View all
            </Link>
          </div>

          {featured.items.length === 0 ? (
            <p className="text-sm text-slate-500">No listings found.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {featured.items.map((item) => (
                <Link
                  key={item._id}
                  href={`/property/${encodeURIComponent(item.slug)}`}
                  className="rounded-xl border border-slate-200 p-4 transition hover:border-emerald-300 hover:bg-emerald-50/50"
                >
                  <p className="line-clamp-2 text-base font-semibold text-slate-900">
                    {item.title}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {item.city}, {item.country}
                  </p>
                  <p className="mt-3 text-sm font-medium text-emerald-700">
                    {item.price.toLocaleString("en-US")} {item.currency}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
