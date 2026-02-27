import Link from "next/link";
import type { Metadata } from "next";
import { getAvailablePropertyTypes } from "../../lib/server/getProperties";
import { slugifySegment } from "../../lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Property Types",
  description: "Browse indexable landing pages by property type.",
  alternates: {
    canonical: "/type",
  },
};

export default async function TypeIndexPage() {
  const propertyTypes = await getAvailablePropertyTypes().catch(() => []);

  return (
    <main className="min-h-screen bg-slate-50 py-8">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-slate-900">Property Types</h1>
        <p className="mt-2 text-slate-600">
          SEO landing pages for high-intent type-specific queries.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {propertyTypes.map((propertyType) => (
            <Link
              key={propertyType}
              href={`/type/${slugifySegment(propertyType)}`}
              className="rounded-xl border border-slate-200 bg-white p-4 text-slate-800 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50"
            >
              {propertyType}
            </Link>
          ))}
        </div>

        {propertyTypes.length === 0 && (
          <p className="mt-8 text-sm text-slate-500">
            No property types available yet.
          </p>
        )}
      </div>
    </main>
  );
}
