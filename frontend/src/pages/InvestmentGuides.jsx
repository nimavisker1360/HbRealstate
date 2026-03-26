import { useMemo } from "react";
import { Link } from "react-router-dom";
import SEO from "../components/SEO";
import Breadcrumbs from "../components/seo/Breadcrumbs";
import { contentHubPages } from "../data/contentHubPages";
import { SITE_URL } from "../utils/seo";

const InvestmentGuides = () => {
  const groupedPages = useMemo(() => {
    const groups = {
      "Pillar Pages": [],
      "City & District Guides": [],
      "Process, Legal & Cost Guides": [],
    };

    contentHubPages.forEach((page) => {
      if (page.pageType === "pillar page") {
        groups["Pillar Pages"].push(page);
      } else if (page.pageType === "city page" || page.pageType === "district page") {
        groups["City & District Guides"].push(page);
      } else {
        groups["Process, Legal & Cost Guides"].push(page);
      }
    });

    return groups;
  }, []);

  const breadcrumbItems = [
    { label: "Home", to: "/" },
    { label: "Investment Guides" },
  ];

  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Investment Guides",
      description:
        "Discover property investment, citizenship, tax, legal, and city guides for Turkey and nearby markets.",
      url: `${SITE_URL}/investment-guides`,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        {
          "@type": "ListItem",
          position: 2,
          name: "Investment Guides",
          item: `${SITE_URL}/investment-guides`,
        },
      ],
    },
  ];

  return (
    <>
      <SEO
        title="Investment Guides | HB International Real Estate"
        description="Discover property investment, citizenship, tax, legal, and city guides for Turkey and nearby markets."
        canonicalPath="/investment-guides"
        structuredData={structuredData}
      />

      <main className="min-h-screen bg-[#f7f3ea] py-24">
        <div className="max-padd-container">
          <Breadcrumbs items={breadcrumbItems} />

          <section className="rounded-[30px] border border-white/70 bg-white/90 p-6 shadow-[0_28px_70px_-50px_rgba(15,23,42,0.5)] sm:p-8 lg:p-10">
            <div className="max-w-3xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-emerald-700">
                Content Hub
              </p>
              <h1 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl lg:text-5xl">
                Investment Guides
              </h1>
              <p className="mt-4 text-base leading-8 text-slate-600">
                Explore the informational layer supporting properties, projects,
                and market decisions across Turkey and nearby regions.
              </p>
            </div>

            <div className="mt-10 space-y-10">
              {Object.entries(groupedPages).map(([label, pages]) => (
                <section key={label}>
                  <h2 className="text-2xl font-bold text-slate-900">{label}</h2>
                  <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {pages.map((page) => (
                      <Link
                        key={page.slug}
                        to={page.canonicalPath}
                        className="block rounded-[24px] border border-slate-200 bg-slate-50/70 p-5 transition hover:-translate-y-1 hover:border-emerald-200 hover:bg-white hover:shadow-[0_20px_45px_-35px_rgba(15,23,42,0.45)]"
                      >
                        <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                          {page.pageType}
                        </span>
                        <h3 className="mt-3 text-lg font-semibold text-slate-900">
                          {page.title}
                        </h3>
                        <p className="mt-3 text-sm leading-6 text-slate-600">
                          {page.description}
                        </p>
                      </Link>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </section>
        </div>
      </main>
    </>
  );
};

export default InvestmentGuides;

