import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import useProperties from "../hooks/useProperties";
import PropertyGridCard from "./PropertyGridCard";

const PROJECT_FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&h=300&fit=crop";

const HomeLocalProjectsSection = () => {
  const { t } = useTranslation();
  const { data, isLoading } = useProperties();

  const previewProjects = useMemo(() => {
    if (!Array.isArray(data)) return [];

    return data
      .filter((property) => property?.propertyType === "local-project")
      .map((property) => ({
        ...property,
        image: property?.images?.[0] || property?.image || PROJECT_FALLBACK_IMAGE,
        country: property?.country || "Turkey",
      }))
      .slice(0, 12);
  }, [data]);

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#fdfcf9] via-[#f8f6f1] to-[#fdfcf9] py-16 sm:py-20">
      <div className="pointer-events-none absolute left-1/2 top-10 h-44 w-44 -translate-x-1/2 rounded-full bg-emerald-100/50 blur-3xl" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-200/80 to-transparent" />

      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-10 flex max-w-3xl flex-col items-center gap-3 text-center sm:mb-12 sm:gap-3.5">
          <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-slate-500 sm:text-[11px]">
            {t("nav.projects")}
          </p>
          <div className="hero-project-pill inline-flex items-center rounded-lg px-3.5 py-2 text-[11px] font-semibold text-white shadow-sm shadow-emerald-500/20 sm:px-4 sm:py-2.5 sm:text-xs">
            <span className="hero-project-pill__label">
              {t("nav.localProjects")}
            </span>
          </div>
          <h2 className="max-w-[34rem] text-balance text-[1.35rem] font-semibold leading-snug tracking-[-0.02em] text-slate-800 sm:max-w-[36rem] sm:text-[1.55rem] md:text-[1.75rem] lg:text-[1.9rem]">
            {t("localProjects.heroTitle")}
          </h2>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 12 }).map((_, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="h-[140px] animate-pulse bg-slate-200" />
                <div className="space-y-3 p-4">
                  <div className="h-4 w-4/5 animate-pulse rounded bg-slate-200" />
                  <div className="h-3 w-3/5 animate-pulse rounded bg-slate-200" />
                  <div className="h-3 w-1/4 animate-pulse rounded bg-slate-200" />
                </div>
              </div>
            ))}
          </div>
        ) : previewProjects.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {previewProjects.map((project) => (
                <PropertyGridCard key={project.id} property={project} />
              ))}
            </div>

            <div className="mt-14 flex justify-center">
              <Link
                to="/projects#local-projects"
                className="investment-opportunities-pill group relative overflow-hidden rounded-xl bg-emerald-500 px-8 py-3.5 font-medium text-white transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/25"
              >
                <span className="relative z-10 flex items-center gap-2">
                  {t("common.viewAll", { defaultValue: "View All" })}
                  <svg
                    className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-emerald-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              </Link>
            </div>
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 px-6 py-16 text-center text-slate-500">
            {t("properties.noProperties")}
          </div>
        )}
      </div>
    </section>
  );
};

export default HomeLocalProjectsSection;
