import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MdArrowOutward, MdCheckCircle } from "react-icons/md";
import ServicePageChrome from "../../components/services/ServicePageChrome";
import BeforeAfterSlider from "../../components/services/BeforeAfterSlider";
import { getPublicStagingProjects } from "../../utils/api";
import { SITE_URL } from "../../utils/seo";
import {
  buildStagingProjectPath,
  formatCurrencyValue,
  formatPercentValue,
  getProjectComparisonPairs,
  getProjectHeadline,
  getProjectLocation,
  getProjectServices,
  getProjectSummary,
  humanizeToken,
  pickProjectTimeline,
  pickPackageName,
  translateStagingCategory,
} from "../../utils/servicesContent";

const truncateText = (value, maxLength = 180) => {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength - 1).trimEnd()}...`;
};

const HomeStagingProjectsPage = () => {
  const { t, i18n } = useTranslation();
  const tx = (key, defaultValue) => t(key, { defaultValue });
  const path = "/services/home-staging/projects";
  const title = t("services.staging.seo.projectsTitle");
  const description = t("services.staging.seo.projectsDescription");
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const lang = i18n.language?.slice(0, 2) || "en";
  const locale = i18n.language || "en";

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await getPublicStagingProjects();
        if (!cancelled && Array.isArray(res?.data)) setProjects(res.data);
      } catch {
        if (!cancelled) setProjects([]);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: title,
    description,
    url: `${SITE_URL}${path}`,
  };

  return (
    <ServicePageChrome
      title={title}
      description={description}
      canonicalPath={path}
      structuredData={[collectionSchema]}
      breadcrumbItems={[
        { label: t("services.breadcrumb.home"), to: "/" },
        { label: t("services.breadcrumb.services"), to: "/services" },
        { label: t("services.staging.breadcrumb"), to: "/services/home-staging" },
        { label: t("services.staging.projectsBreadcrumb") },
      ]}
    >
      <section className="mb-8 rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#2d3e50] via-[#253546] to-[#1b2633] p-6 sm:p-8 lg:p-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#82f2ac]">
              {tx("services.staging.projectsPage.eyebrow", "Published transformations")}
            </p>
            <h1 className="mt-3 text-3xl font-extrabold text-white sm:text-5xl sm:leading-tight">
              {t("services.staging.projectsPage.title")}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/72 sm:text-lg">
              {t("services.staging.projectsPage.subtitle")}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45">
                {tx("services.staging.projectsPage.countLabel", "Published case studies")}
              </p>
              <p className="mt-2 text-2xl font-bold text-white">
                {loading ? "..." : projects.length}
              </p>
            </div>
            <Link
              to="/services/home-staging/request"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#06a84e] px-5 py-3 font-semibold text-white transition hover:bg-[#059944]"
            >
              {tx("services.staging.projectsPage.ctaRequest", "Request consultation")}
              <MdArrowOutward className="text-lg" />
            </Link>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="grid gap-5 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={`showcase-skeleton-${index}`}
              className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/5"
            >
              <div className="aspect-[16/10] bg-white/8" />
              <div className="space-y-4 p-6">
                <div className="h-4 w-24 rounded-full bg-white/8" />
                <div className="h-8 w-2/3 rounded-xl bg-white/8" />
                <div className="h-4 w-1/2 rounded-full bg-white/8" />
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="h-16 rounded-2xl bg-white/8" />
                  <div className="h-16 rounded-2xl bg-white/8" />
                  <div className="h-16 rounded-2xl bg-white/8" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded-[1.9rem] border border-dashed border-white/14 bg-white/[0.04] p-6 sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-bold text-white">
                {tx(
                  "services.staging.projectsPage.emptyTitle",
                  "Published staging projects will appear here as soon as they go live"
                )}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-white/68">
                {tx(
                  "services.staging.projectsPage.emptyBody",
                  "This showcase only uses published projects from the admin system. If none are live yet, request a consultation and we can still propose the right scope."
                )}
              </p>
            </div>
            <Link
              to="/services/home-staging/request"
              className="inline-flex items-center gap-2 rounded-xl bg-[#06a84e] px-5 py-3 font-semibold text-white transition hover:bg-[#059944]"
            >
              {tx("services.staging.projectsPage.ctaRequest", "Request consultation")}
              <MdArrowOutward className="text-lg" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {projects.map((project) => {
            const comparisonPairs = getProjectComparisonPairs(project, lang);
            const featuredPair = comparisonPairs[0] || null;
            const headline = getProjectHeadline(
              project,
              lang,
              t("services.staging.projectsPage.untitled")
            );
            const summary = truncateText(getProjectSummary(project, lang));
            const location = getProjectLocation(project);
            const packageName = pickPackageName(project.package, lang);
            const services = getProjectServices(project).slice(0, 4);
            const budgetLabel = formatCurrencyValue(
              project.budgetEstimate,
              project.budgetCurrency,
              locale
            );
            const metrics = [
              {
                label: t("services.staging.landing.showcase.metricValueUplift"),
                value: formatPercentValue(project.expectedValueUplift, locale),
              },
              {
                label: t("services.staging.landing.showcase.metricRentalUplift"),
                value: formatPercentValue(project.expectedRentalUplift, locale),
              },
              {
                label: t("services.staging.landing.showcase.metricSaleSpeed"),
                value:
                  project.expectedSaleSpeedDays != null
                    ? t("services.staging.landing.showcase.saleSpeedValue", {
                        days: project.expectedSaleSpeedDays,
                      })
                    : "",
              },
            ].filter((item) => item.value);

            return (
              <article
                key={project.id}
                className="overflow-hidden rounded-[1.85rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] shadow-[0_24px_70px_rgba(0,0,0,0.18)]"
              >
                <div className="border-b border-white/8 bg-black/10 p-4 sm:p-5">
                  {featuredPair ? (
                    <BeforeAfterSlider
                      beforeUrl={featuredPair.beforeUrl}
                      afterUrl={featuredPair.afterUrl}
                      aspectRatio="16 / 10"
                    />
                  ) : (
                    <div className="flex aspect-[16/10] items-end rounded-[1.5rem] border border-white/8 bg-gradient-to-br from-[#34465a] to-[#1f2b39] p-5">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#82f2ac]">
                          {tx("services.staging.projectsPage.previewLabel", "Published project")}
                        </p>
                        <h2 className="mt-3 text-2xl font-bold text-white">{headline}</h2>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-6">
                  <div className="flex flex-wrap gap-2">
                    {project.projectCategory && (
                      <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70">
                        {translateStagingCategory(project.projectCategory, t)}
                      </span>
                    )}
                    {packageName && (
                      <span className="rounded-full border border-amber-400/25 bg-amber-300/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-100/85">
                        {packageName}
                      </span>
                    )}
                  </div>

                  <h2 className="mt-4 text-2xl font-bold text-white">{headline}</h2>

                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/42">
                        {t("services.staging.landing.showcase.metaLocation")}
                      </p>
                      <p className="mt-1 text-sm font-medium text-white/88">
                        {location || tx("services.staging.projectsPage.metaFallback", "Shared on request")}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/42">
                        {t("services.staging.landing.showcase.metaTimeline")}
                      </p>
                      <p className="mt-1 text-sm font-medium text-white/88">
                        {pickProjectTimeline(project, lang) ||
                          tx("services.staging.projectsPage.timelineFallback", "Depends on scope")}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/42">
                        {t("services.staging.landing.showcase.metaBudget")}
                      </p>
                      <p className="mt-1 text-sm font-medium text-white/88">
                        {budgetLabel ||
                          tx("services.staging.projectsPage.budgetFallback", "Tailored to the project")}
                      </p>
                    </div>
                  </div>

                  {summary && (
                    <p className="mt-5 text-sm leading-relaxed text-white/72">{summary}</p>
                  )}

                  {services.length > 0 && (
                    <div className="mt-5 flex flex-wrap gap-2">
                      {services.map((service) => (
                        <span
                          key={`${project.id}-${service}`}
                          className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/68"
                        >
                          {t(`services.enums.staging.service.${service}`, {
                            defaultValue: humanizeToken(service),
                          })}
                        </span>
                      ))}
                    </div>
                  )}

                  {metrics.length > 0 && (
                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                      {metrics.map((metric) => (
                        <div
                          key={`${project.id}-${metric.label}`}
                          className="rounded-2xl border border-[#06a84e]/18 bg-[#06a84e]/7 p-3"
                        >
                          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/48">
                            {metric.label}
                          </p>
                          <p className="mt-1 text-base font-semibold text-white">{metric.value}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-1 text-sm text-white/62">
                      {comparisonPairs.length > 0 && (
                        <div className="flex items-center gap-2">
                          <MdCheckCircle className="text-[#82f2ac]" />
                          <span>
                            {tx("services.staging.projectsPage.beforeAfterReady", "Before / after media published")}
                          </span>
                        </div>
                      )}
                    </div>

                    <Link
                      to={buildStagingProjectPath(project)}
                      className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                    >
                      {t("services.staging.projectsPage.viewDetail")}
                      <MdArrowOutward className="text-lg" />
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </ServicePageChrome>
  );
};

export default HomeStagingProjectsPage;
