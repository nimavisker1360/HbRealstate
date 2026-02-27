import Link from "next/link";
import type { Metadata } from "next";
import { getAvailableCities } from "../../lib/server/getProperties";
import { slugifySegment } from "../../lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Cities",
  description: "Browse all city landing pages for organic real estate traffic.",
  alternates: {
    canonical: "/city",
  },
};

export default async function CityIndexPage() {
  const cities = await getAvailableCities().catch(() => []);

  return (
    <main className="min-h-screen bg-slate-50 py-8">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-slate-900">All Cities</h1>
        <p className="mt-2 text-slate-600">
          Each city page is an indexable landing page with server-rendered
          listings.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cities.map((city) => (
            <Link
              key={city}
              href={`/city/${slugifySegment(city)}`}
              className="rounded-xl border border-slate-200 bg-white p-4 text-slate-800 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50"
            >
              {city}
            </Link>
          ))}
        </div>

        {cities.length === 0 && (
          <p className="mt-8 text-sm text-slate-500">No city pages available yet.</p>
        )}
      </div>
    </main>
  );
}
