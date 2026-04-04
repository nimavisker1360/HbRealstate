import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MdArrowOutward } from "react-icons/md";
import BeforeAfterSlider from "./BeforeAfterSlider";
import { getPublicStagingProjects } from "../../utils/api";
import {
  pickCaseStudy,
  pickProjectTimeline,
  pickProjectTitle,
  pickPackageName,
  caseStudyHeadline,
  caseStudyBody,
  translateStagingCategory,
} from "../../utils/servicesContent";

const FALLBACK_COMPARISON = {
  beforeUrl: "/room01.jpg",
  afterUrl: "/room02.jpg",
};

const FALLBACK_PREVIEW_PAIRS = [
  {
    id: "room-secondary",
    beforeUrl: "/room03.jpg",
    afterUrl: "/room04.jpeg",
  },
  {
    id: "kitchen-refresh",
    beforeUrl: "/kichen01.jpg",
    afterUrl: "/kichen02.jpg",
  },
];

const normalizeUrl = (value) => {
  if (typeof value !== "string") return "";
  return value.trim();
};

const truncateText = (value, maxLength = 150) => {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength - 1).trimEnd()}...`;
};

const formatBudget = (project, locale) => {
  const amount = Number(project?.budgetEstimate);
  if (!Number.isFinite(amount)) return "";

  const currency = normalizeUrl(project?.budgetCurrency).toUpperCase();
  const maximumFractionDigits = Number.isInteger(amount) ? 0 : 1;

  if (currency) {
    try {
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        maximumFractionDigits,
      }).format(amount);
    } catch {
      return `${currency} ${amount.toLocaleString(locale, { maximumFractionDigits })}`;
    }
  }

  return amount.toLocaleString(locale, { maximumFractionDigits });
};

const formatPercent = (value, locale) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "";
  return `${amount.toLocaleString(locale, {
    maximumFractionDigits: Number.isInteger(amount) ? 0 : 1,
  })}%`;
};

const getProjectLocation = (project) => [project?.city, project?.district].filter(Boolean).join(", ");

const getProjectSummary = (project, lang) => {
  const caseStudy = pickCaseStudy(project, lang);
  const summary =
    normalizeUrl(caseStudy?.summary) ||
    normalizeUrl(caseStudyBody(caseStudy)) ||
    normalizeUrl(pickProjectTitle(project, lang));

  return summary;
};

const getComparisonPairs = (project, lang) => {
  const pairs = [];
  const seen = new Set();
  const caseStudy = pickCaseStudy(project, lang);

  if (Array.isArray(caseStudy?.beforeAfterPairs)) {
    caseStudy.beforeAfterPairs.forEach((pair, index) => {
      const beforeUrl = normalizeUrl(
        pair?.beforeUrl || pair?.before || pair?.beforeImage || pair?.beforePhoto
      );
      const afterUrl = normalizeUrl(
        pair?.afterUrl || pair?.after || pair?.afterImage || pair?.afterPhoto
      );
      const key = `${beforeUrl}|${afterUrl}`;

      if (!beforeUrl || !afterUrl || seen.has(key)) return;
      seen.add(key);
      pairs.push({
        beforeUrl,
        afterUrl,
        title: normalizeUrl(pair?.title),
        featured: Boolean(pair?.featured || pair?.cover || pair?.isCover || index === 0),
      });
    });
  }

  const beforePhotos = Array.isArray(project?.beforePhotos) ? project.beforePhotos : [];
  const afterPhotos = Array.isArray(project?.afterPhotos) ? project.afterPhotos : [];
  const maxLength = Math.max(beforePhotos.length, afterPhotos.length);

  for (let index = 0; index < maxLength; index += 1) {
    const beforeUrl = normalizeUrl(beforePhotos[index] || (index === 0 ? beforePhotos[0] : ""));
    const afterUrl = normalizeUrl(afterPhotos[index] || (index === 0 ? afterPhotos[0] : ""));
    const key = `${beforeUrl}|${afterUrl}`;

    if (!beforeUrl || !afterUrl || seen.has(key)) continue;
    seen.add(key);
    pairs.push({
      beforeUrl,
      afterUrl,
      title: "",
      featured: index === 0,
    });
  }

  return pairs;
};

const pickFeaturedPair = (project, lang) => {
  const pairs = getComparisonPairs(project, lang);
  return pairs.find((pair) => pair.featured) || pairs[0] || null;
};

const getProjectCardImage = (project, lang) => {
  const pair = pickFeaturedPair(project, lang);
  return pair?.afterUrl || normalizeUrl(project?.afterPhotos?.[0]) || normalizeUrl(project?.beforePhotos?.[0]);
};

const scoreProject = (project, lang) => {
  const pair = pickFeaturedPair(project, lang);
  if (!pair) return -1;

  const caseStudy = pickCaseStudy(project, lang);
  let score = 100;

  if (project?.featured || project?.isFeatured || caseStudy?.featured) score += 500;
  if (caseStudyHeadline(caseStudy) || pickProjectTitle(project, lang)) score += 14;
  if (getProjectSummary(project, lang)) score += 10;
  if (project?.package) score += 7;
  if (getProjectLocation(project)) score += 6;
  if (project?.projectCategory) score += 4;
  if (project?.timelineEstimate) score += 4;
  if (project?.budgetEstimate != null) score += 4;
  if (project?.expectedValueUplift != null) score += 3;
  if (project?.expectedRentalUplift != null) score += 3;
  if (project?.expectedSaleSpeedDays != null) score += 3;
  if ((project?.servicesIncluded || []).length > 0) score += 2;

  return score;
};

const buildMetadata = (project, lang, locale, t) => {
  if (!project) return [];

  const packageName = pickPackageName(project.package, lang);
  const location = getProjectLocation(project);
  const budget = formatBudget(project, locale);

  return [
    {
      label: t("services.staging.landing.showcase.metaProject"),
      value: normalizeUrl(pickProjectTitle(project, lang)),
    },
    { label: t("services.staging.landing.showcase.metaLocation"), value: location },
    {
      label: t("services.staging.landing.showcase.metaCategory"),
      value: translateStagingCategory(project.projectCategory, t),
    },
    { label: t("services.staging.landing.showcase.metaPackage"), value: packageName },
    {
      label: t("services.staging.landing.showcase.metaTimeline"),
      value: normalizeUrl(pickProjectTimeline(project, lang)),
    },
    { label: t("services.staging.landing.showcase.metaBudget"), value: budget },
  ].filter((item) => item.value);
};

const buildMetrics = (project, locale, t) => {
  if (!project) return [];

  return [
    {
      label: t("services.staging.landing.showcase.metricValueUplift"),
      value: formatPercent(project.expectedValueUplift, locale),
    },
    {
      label: t("services.staging.landing.showcase.metricRentalUplift"),
      value: formatPercent(project.expectedRentalUplift, locale),
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
};

const projectDetailPath = (project) =>
  `/services/home-staging/projects/${encodeURIComponent(project?.slug || project?.id || "")}`;

const StagingTransformationShowcase = () => {
  const { t, i18n } = useTranslation();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const lang = i18n.language?.slice(0, 2) || "en";
  const locale = i18n.language || "en";

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const response = await getPublicStagingProjects();
        if (!cancelled && Array.isArray(response?.data)) {
          setProjects(response.data);
        }
      } catch {
        if (!cancelled) setProjects([]);
      }

      if (!cancelled) setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const usableProjects = [...projects]
    .filter((project) => Boolean(pickFeaturedPair(project, lang)))
    .sort((left, right) => scoreProject(right, lang) - scoreProject(left, lang));

  const featuredProject = usableProjects[0] || null;
  const featuredPair = featuredProject ? pickFeaturedPair(featuredProject, lang) : FALLBACK_COMPARISON;
  const featuredCaseStudy = featuredProject ? pickCaseStudy(featuredProject, lang) : null;
  const featuredTitle = featuredProject
    ? caseStudyHeadline(featuredCaseStudy) ||
      normalizeUrl(featuredPair?.title) ||
      normalizeUrl(pickProjectTitle(featuredProject, lang)) ||
      t("services.staging.projectsPage.untitled")
    : t("services.staging.landing.showcase.previewTitle");
  const featuredSummary = featuredProject
    ? getProjectSummary(featuredProject, lang) ||
      t("services.staging.landing.showcase.defaultProjectSummary")
    : t("services.staging.landing.showcase.previewBody");
  const metadataItems = buildMetadata(featuredProject, lang, locale, t);
  const metricItems = buildMetrics(featuredProject, locale, t);
  const previewProjects = usableProjects.filter((project) => project.id !== featuredProject?.id).slice(0, 3);

  return (
    <section className="mb-12 rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[0.08] via-white/[0.04] to-white/[0.02] p-5 sm:p-8 lg:p-10 shadow-[0_32px_90px_rgba(0,0,0,0.26)]">
      <div className="mb-8 max-w-3xl">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.34em] text-amber-200/75">
          {t("services.staging.landing.showcase.eyebrow")}
        </p>
        <h2 className="text-2xl font-bold text-white sm:text-3xl">
          {t("services.staging.landing.showcase.title")}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-white/72 sm:text-base">
          {t("services.staging.landing.showcase.subtitle")}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.9fr)] lg:items-start">
        <div className="rounded-[1.75rem] border border-white/10 bg-black/20 p-3 sm:p-4">
          <BeforeAfterSlider
            beforeUrl={featuredPair.beforeUrl}
            afterUrl={featuredPair.afterUrl}
            className="bg-black/10"
            aspectRatio="16 / 10"
          />
        </div>

        <div className="rounded-[1.75rem] border border-white/10 bg-[#0b1520]/75 p-5 sm:p-6">
          <div className="mb-5 flex flex-wrap gap-2">
            {featuredProject ? (
              <>
                {featuredProject.package && (
                  <span className="rounded-full border border-amber-400/25 bg-amber-300/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-100/85">
                    {pickPackageName(featuredProject.package, lang)}
                  </span>
                )}
                {featuredProject.projectCategory && (
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/70">
                    {translateStagingCategory(featuredProject.projectCategory, t)}
                  </span>
                )}
              </>
            ) : (
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/70">
                {loading
                  ? t("services.common.loading")
                  : t("services.staging.landing.showcase.previewBadge")}
              </span>
            )}
          </div>

          <h3 className="text-2xl font-bold text-white">{featuredTitle}</h3>

          {featuredProject && getProjectLocation(featuredProject) && (
            <p className="mt-2 text-sm text-white/55">{getProjectLocation(featuredProject)}</p>
          )}

          <p className="mt-4 text-sm leading-relaxed text-white/72 sm:text-[15px]">
            {featuredSummary}
          </p>

          {metadataItems.length > 0 && (
            <dl className="mt-6 grid gap-3 sm:grid-cols-2">
              {metadataItems.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-white/8 bg-white/[0.04] p-3"
                >
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/42">
                    {item.label}
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-white/88">{item.value}</dd>
                </div>
              ))}
            </dl>
          )}

          {metricItems.length > 0 && (
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {metricItems.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-white/8 bg-white/[0.04] p-3"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/42">
                    {item.label}
                  </p>
                  <p className="mt-1 text-lg font-semibold text-white">{item.value}</p>
                </div>
              ))}
            </div>
          )}

          <div className="mt-7 flex flex-wrap gap-3">
            {featuredProject ? (
              <Link
                to={projectDetailPath(featuredProject)}
                className="inline-flex items-center gap-2 rounded-xl bg-[#06a84e] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#059944]"
              >
                {t("services.staging.landing.showcase.ctaProject")}
                <MdArrowOutward className="text-lg" />
              </Link>
            ) : (
              <Link
                to="/services/home-staging/request"
                className="inline-flex items-center gap-2 rounded-xl bg-[#06a84e] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#059944]"
              >
                {t("services.staging.landing.showcase.ctaConsultation")}
                <MdArrowOutward className="text-lg" />
              </Link>
            )}

            <Link
              to="/services/home-staging/projects"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-white/88 transition hover:bg-white/8"
            >
              {t("services.staging.landing.showcase.ctaAllProjects")}
              <MdArrowOutward className="text-lg" />
            </Link>
          </div>
        </div>
      </div>

      {!featuredProject && (
        <div className="mt-10">
          <div className="mb-5">
            <h3 className="text-xl font-bold text-white">
              {t("services.staging.landing.showcase.gridTitle")}
            </h3>
            <p className="mt-1 text-sm text-white/62">
              {t("services.staging.landing.showcase.gridSubtitle")}
            </p>
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            {FALLBACK_PREVIEW_PAIRS.map((pair) => (
              <article
                key={pair.id}
                className="rounded-[1.75rem] border border-white/10 bg-[#0b1520]/72 p-3 sm:p-4 shadow-[0_18px_55px_rgba(0,0,0,0.24)]"
              >
                <BeforeAfterSlider
                  beforeUrl={pair.beforeUrl}
                  afterUrl={pair.afterUrl}
                  className="bg-black/10"
                  aspectRatio="16 / 10"
                />
              </article>
            ))}
          </div>
        </div>
      )}

      {previewProjects.length > 0 && (
        <div className="mt-10">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-xl font-bold text-white">
                {t("services.staging.landing.showcase.gridTitle")}
              </h3>
              <p className="mt-1 text-sm text-white/62">
                {t("services.staging.landing.showcase.gridSubtitle")}
              </p>
            </div>
            <Link
              to="/services/home-staging/projects"
              className="text-sm font-semibold text-[#82f2ac] transition hover:text-[#9cffbe]"
            >
              {t("services.staging.landing.showcase.ctaAllProjects")}
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {previewProjects.map((project) => {
              const packageName = project.package ? pickPackageName(project.package, lang) : "";
              const imageUrl = getProjectCardImage(project, lang);
              const services = (project.servicesIncluded || []).slice(0, 2);
              const title =
                caseStudyHeadline(pickCaseStudy(project, lang)) ||
                normalizeUrl(pickProjectTitle(project, lang)) ||
                t("services.staging.projectsPage.untitled");
              const summary = truncateText(getProjectSummary(project, lang), 150);

              return (
                <article
                  key={project.id}
                  className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#0b1520]/72 transition hover:-translate-y-1 hover:border-white/16"
                >
                  {imageUrl && (
                    <div className="aspect-[16/10] overflow-hidden">
                      <img
                        src={imageUrl}
                        alt=""
                        className="h-full w-full object-cover transition duration-500 hover:scale-[1.03]"
                        loading="lazy"
                      />
                    </div>
                  )}

                  <div className="p-5">
                    <div className="mb-3 flex flex-wrap gap-2">
                      {packageName && (
                        <span className="rounded-full border border-amber-400/25 bg-amber-300/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-100/80">
                          {packageName}
                        </span>
                      )}
                      {services.map((service) => (
                        <span
                          key={`${project.id}-${service}`}
                          className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/65"
                        >
                          {t(`services.enums.staging.service.${service}`, service)}
                        </span>
                      ))}
                    </div>

                    <h4 className="text-lg font-bold text-white">{title}</h4>
                    {getProjectLocation(project) && (
                      <p className="mt-1 text-sm text-white/52">{getProjectLocation(project)}</p>
                    )}
                    {summary && (
                      <p className="mt-4 text-sm leading-relaxed text-white/72">{summary}</p>
                    )}

                    <Link
                      to={projectDetailPath(project)}
                      className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#82f2ac] transition hover:text-[#9cffbe]"
                    >
                      {t("services.staging.landing.showcase.ctaCard")}
                      <MdArrowOutward className="text-base" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}

      {!loading && usableProjects.length === 0 && (
        <div className="mt-8 rounded-[1.75rem] border border-dashed border-white/14 bg-black/15 p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <h3 className="text-xl font-bold text-white">
                {t("services.staging.landing.showcase.emptyTitle")}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/68">
                {t("services.staging.landing.showcase.emptyBody")}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/services/home-staging/request"
                className="inline-flex items-center gap-2 rounded-xl bg-[#06a84e] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#059944]"
              >
                {t("services.staging.landing.showcase.ctaConsultation")}
                <MdArrowOutward className="text-lg" />
              </Link>
              <Link
                to="/services/home-staging/projects"
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-white/88 transition hover:bg-white/8"
              >
                {t("services.staging.landing.showcase.ctaAllProjects")}
                <MdArrowOutward className="text-lg" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default StagingTransformationShowcase;
