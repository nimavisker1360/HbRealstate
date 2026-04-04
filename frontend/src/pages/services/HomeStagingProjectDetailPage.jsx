import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MdArrowBack, MdArrowOutward, MdCheckCircle } from "react-icons/md";
import ServicePageChrome from "../../components/services/ServicePageChrome";
import BeforeAfterSlider from "../../components/services/BeforeAfterSlider";
import { getPublicStagingProjectDetail } from "../../utils/api";
import { SITE_URL } from "../../utils/seo";
import {
  buildProjectMediaLinks,
  caseStudyBody,
  caseStudyTestimonial,
  formatCurrencyRange,
  formatCurrencyValue,
  formatPercentValue,
  getProjectComparisonPairs,
  getProjectHeadline,
  getProjectLocation,
  getProjectServices,
  getProjectSummary,
  humanizeToken,
  pickCaseStudy,
  pickPackageDescription,
  pickPackageName,
  pickProjectTimeline,
  translateStagingCategory,
} from "../../utils/servicesContent";

const HomeStagingProjectDetailPage = () => {
  const { projectId } = useParams();
  const { t, i18n } = useTranslation();
  const tx = (key, defaultValue) => t(key, { defaultValue });
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const lang = i18n.language?.slice(0, 2) || "en";
  const locale = i18n.language || "en";

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!projectId) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setLoading(true);
      setNotFound(false);

      try {
        const res = await getPublicStagingProjectDetail(projectId);
        if (!cancelled && res?.data) {
          setProject(res.data);
        } else if (!cancelled) {
          setNotFound(true);
        }
      } catch {
        if (!cancelled) setNotFound(true);
      }

      if (!cancelled) setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const caseStudy = project ? pickCaseStudy(project, lang) : null;
  const headline = project
    ? getProjectHeadline(project, lang, t("services.staging.projectsPage.untitled"))
    : "";
  const summary = project ? getProjectSummary(project, lang) : "";
  const body = caseStudy ? caseStudyBody(caseStudy) : "";
  const testimonial = caseStudy ? caseStudyTestimonial(caseStudy) : null;
  const location = getProjectLocation(project);
  const services = getProjectServices(project);
  const comparisonPairs = useMemo(
    () => getProjectComparisonPairs(project, lang),
    [project, lang]
  );
  const featuredPair = comparisonPairs[0] || null;
  const extraPairs = comparisonPairs.slice(1);
  const mediaLinks = buildProjectMediaLinks(project);
  const resolvedPath =
    project && project.slug
      ? `/services/home-staging/projects/${project.slug}`
      : project
        ? `/services/home-staging/projects/${projectId}`
        : "/services/home-staging/projects";

  const title = project
    ? `${headline} | ${t("services.staging.seo.projectsTitle")}`
    : t("services.staging.projectDetail.notFoundTitle");
  const description =
    summary || t("services.staging.seo.projectsDescription");

  const creativeWorkSchema =
    project && headline
      ? {
          "@context": "https://schema.org",
          "@type": "CreativeWork",
          name: headline,
          description,
          url: `${SITE_URL}${resolvedPath}`,
        }
      : null;

  const metrics = [
    {
      label: t("services.staging.landing.showcase.metricValueUplift"),
      value: formatPercentValue(project?.expectedValueUplift, locale),
    },
    {
      label: t("services.staging.landing.showcase.metricRentalUplift"),
      value: formatPercentValue(project?.expectedRentalUplift, locale),
    },
    {
      label: t("services.staging.landing.showcase.metricSaleSpeed"),
      value:
        project?.expectedSaleSpeedDays != null
          ? t("services.staging.landing.showcase.saleSpeedValue", {
              days: project.expectedSaleSpeedDays,
            })
          : "",
    },
  ].filter((item) => item.value);

  const topFacts = [
    {
      label: t("services.staging.landing.showcase.metaPackage"),
      value: pickPackageName(project?.package, lang),
    },
    {
      label: t("services.staging.landing.showcase.metaLocation"),
      value: location,
    },
    {
      label: t("services.staging.landing.showcase.metaTimeline"),
      value: pickProjectTimeline(project, lang),
    },
    {
      label: t("services.staging.landing.showcase.metaBudget"),
      value: formatCurrencyValue(project?.budgetEstimate, project?.budgetCurrency, locale),
    },
  ].filter((item) => item.value);

  if (loading) {
    return (
      <ServicePageChrome
        title={t("services.staging.projectDetail.loadingTitle")}
        description={description}
        canonicalPath="/services/home-staging/projects"
        breadcrumbItems={[
          { label: t("services.breadcrumb.home"), to: "/" },
          { label: t("services.breadcrumb.services"), to: "/services" },
          { label: t("services.staging.breadcrumb"), to: "/services/home-staging" },
          {
            label: t("services.staging.projectsBreadcrumb"),
            to: "/services/home-staging/projects",
          },
          { label: "..." },
        ]}
      >
        <div className="space-y-4">
          <div className="h-4 w-28 rounded-full bg-white/8" />
          <div className="h-10 max-w-3xl rounded-2xl bg-white/8" />
          <div className="h-5 max-w-2xl rounded-xl bg-white/8" />
          <div className="aspect-[16/10] rounded-[2rem] bg-white/8" />
        </div>
      </ServicePageChrome>
    );
  }

  if (notFound || !project) {
    return (
      <ServicePageChrome
        title={t("services.staging.projectDetail.notFoundTitle")}
        description={t("services.staging.projectDetail.notFoundDesc")}
        canonicalPath="/services/home-staging/projects"
        breadcrumbItems={[
          { label: t("services.breadcrumb.home"), to: "/" },
          { label: t("services.breadcrumb.services"), to: "/services" },
          { label: t("services.staging.breadcrumb"), to: "/services/home-staging" },
          {
            label: t("services.staging.projectsBreadcrumb"),
            to: "/services/home-staging/projects",
          },
        ]}
      >
        <div className="rounded-[1.9rem] border border-dashed border-white/14 bg-white/[0.04] p-6 sm:p-8">
          <h1 className="text-2xl font-bold text-white">
            {t("services.staging.projectDetail.notFoundTitle")}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/68">
            {tx(
              "services.staging.projectDetail.notFoundBody",
              "This project may have been unpublished, renamed, or is not available for public viewing."
            )}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              to="/services/home-staging/projects"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-5 py-3 font-semibold text-white transition hover:bg-white/8"
            >
              {t("services.staging.projectDetail.backToList")}
            </Link>
            <Link
              to="/services/home-staging/request"
              className="inline-flex items-center gap-2 rounded-xl bg-[#06a84e] px-5 py-3 font-semibold text-white transition hover:bg-[#059944]"
            >
              {tx("services.staging.projectDetail.ctaConsultation", "Request consultation")}
              <MdArrowOutward className="text-lg" />
            </Link>
          </div>
        </div>
      </ServicePageChrome>
    );
  }

  return (
    <ServicePageChrome
      title={title}
      description={description}
      canonicalPath={resolvedPath}
      structuredData={creativeWorkSchema ? [creativeWorkSchema] : []}
      breadcrumbItems={[
        { label: t("services.breadcrumb.home"), to: "/" },
        { label: t("services.breadcrumb.services"), to: "/services" },
        { label: t("services.staging.breadcrumb"), to: "/services/home-staging" },
        { label: t("services.staging.projectsBreadcrumb"), to: "/services/home-staging/projects" },
        { label: headline },
      ]}
    >
      <Link
        to="/services/home-staging/projects"
        className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#82f2ac] transition hover:text-[#9cffbe]"
      >
        <MdArrowBack className="text-base" />
        {t("services.staging.projectDetail.backToList")}
      </Link>

      <section className="mb-8 rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#2d3e50] via-[#253546] to-[#1b2633] p-6 sm:p-8 lg:p-10">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div>
            <div className="flex flex-wrap gap-2">
              {project.projectCategory && (
                <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70">
                  {translateStagingCategory(project.projectCategory, t)}
                </span>
              )}
              {pickPackageName(project.package, lang) && (
                <span className="rounded-full border border-amber-400/25 bg-amber-300/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-100/85">
                  {pickPackageName(project.package, lang)}
                </span>
              )}
            </div>

            <h1 className="mt-4 text-3xl font-extrabold text-white sm:text-5xl sm:leading-tight">
              {headline}
            </h1>

            {summary && (
              <p className="mt-4 max-w-3xl text-base leading-relaxed text-white/74 sm:text-lg">
                {summary}
              </p>
            )}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/services/home-staging/request"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#06a84e] px-6 py-3 font-semibold text-white transition hover:bg-[#059944]"
              >
                {tx("services.staging.projectDetail.ctaConsultation", "Request consultation")}
                <MdArrowOutward className="text-lg" />
              </Link>
              <Link
                to="/services/home-staging/projects"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 px-6 py-3 font-semibold text-white transition hover:bg-white/8"
              >
                {t("services.staging.projectDetail.backToList")}
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {topFacts.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-white/8 bg-white/[0.05] p-4"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/42">
                  {item.label}
                </p>
                <p className="mt-2 text-sm font-semibold text-white">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {featuredPair ? (
        <section className="mb-8">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#82f2ac]">
                {tx("services.staging.projectDetail.beforeAfterEyebrow", "Before / after comparison")}
              </p>
              <h2 className="mt-2 text-2xl font-bold text-white">
                {tx("services.staging.projectDetail.beforeAfterTitle", "Primary transformation view")}
              </h2>
            </div>
          </div>

          <BeforeAfterSlider
            beforeUrl={featuredPair.beforeUrl}
            afterUrl={featuredPair.afterUrl}
            beforeAlt={t("services.staging.projectDetail.beforeAlt", { title: headline })}
            afterAlt={t("services.staging.projectDetail.afterAlt", { title: headline })}
            aspectRatio="16 / 10"
          />
        </section>
      ) : (
        <section className="mb-8 rounded-[1.8rem] border border-dashed border-white/12 bg-white/[0.04] p-6">
          <h2 className="text-xl font-bold text-white">
            {tx("services.staging.projectDetail.mediaPendingTitle", "Before / after media will appear here")}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-white/66">
            {tx(
              "services.staging.projectDetail.mediaPendingBody",
              "This project is published, but the public comparison media has not been attached yet."
            )}
          </p>
        </section>
      )}

      {extraPairs.length > 0 && (
        <section className="mb-8">
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-white">
              {tx("services.staging.projectDetail.galleryTitle", "Additional before / after views")}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-white/66">
              {tx(
                "services.staging.projectDetail.galleryBody",
                "Extra views help show how the scope carried across multiple spaces inside the property."
              )}
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {extraPairs.map((pair, index) => (
              <article
                key={`${pair.beforeUrl}-${pair.afterUrl}-${index}`}
                className="rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-4"
              >
                {pair.title && (
                  <h3 className="mb-3 text-lg font-semibold text-white">{pair.title}</h3>
                )}
                <div className="grid gap-3 sm:grid-cols-2">
                  <a href={pair.beforeUrl} target="_blank" rel="noopener noreferrer">
                    <div className="overflow-hidden rounded-2xl border border-white/8 bg-black/20">
                      <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/60">
                        {t("services.staging.showcase.before")}
                      </div>
                      <img
                        src={pair.beforeUrl}
                        alt=""
                        className="aspect-[4/3] w-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  </a>
                  <a href={pair.afterUrl} target="_blank" rel="noopener noreferrer">
                    <div className="overflow-hidden rounded-2xl border border-white/8 bg-black/20">
                      <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/60">
                        {t("services.staging.showcase.after")}
                      </div>
                      <img
                        src={pair.afterUrl}
                        alt=""
                        className="aspect-[4/3] w-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="mb-8 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          {(body || summary) && (
            <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6">
              <h2 className="text-2xl font-bold text-white">
                {t("services.staging.projectDetail.storyTitle")}
              </h2>
              <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-white/78 sm:text-[15px]">
                {body || summary}
              </p>
            </div>
          )}

          {testimonial && (
            <div className="rounded-[1.75rem] border border-[#06a84e]/18 bg-[#06a84e]/8 p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#9cffbe]">
                {tx("services.staging.projectDetail.testimonialEyebrow", "Client perspective")}
              </p>
              <h2 className="mt-2 text-2xl font-bold text-white">
                {tx("services.staging.projectDetail.testimonialTitle", "Testimonial")}
              </h2>
              {testimonial.quote && (
                <blockquote className="mt-4 text-base leading-relaxed text-white/86">
                  "{testimonial.quote}"
                </blockquote>
              )}
              {(testimonial.author || testimonial.role) && (
                <p className="mt-4 text-sm font-semibold text-white/78">
                  {[testimonial.author, testimonial.role].filter(Boolean).join(", ")}
                </p>
              )}
            </div>
          )}

          {mediaLinks.length > 0 && (
            <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6">
              <h2 className="text-2xl font-bold text-white">
                {tx("services.staging.projectDetail.mediaLinksTitle", "Published media links")}
              </h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {mediaLinks.map((item) => (
                  <a
                    key={item.key}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:bg-white/[0.08]"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45">
                      {tx(
                        `services.staging.projectDetail.mediaLink.${item.key}`,
                        humanizeToken(item.key)
                      )}
                    </p>
                    <p className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[#82f2ac]">
                      {tx("services.staging.projectDetail.openLink", "Open media")}
                      <MdArrowOutward className="text-base" />
                    </p>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {(pickPackageName(project.package, lang) || pickPackageDescription(project.package, lang)) && (
            <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#82f2ac]">
                {tx("services.staging.projectDetail.packageEyebrow", "Package context")}
              </p>
              <h2 className="mt-2 text-2xl font-bold text-white">
                {pickPackageName(project.package, lang) ||
                  tx("services.staging.projectDetail.packageTitle", "Selected package")}
              </h2>
              {pickPackageDescription(project.package, lang) && (
                <p className="mt-3 text-sm leading-relaxed text-white/74">
                  {pickPackageDescription(project.package, lang)}
                </p>
              )}
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {project.package?.estimatedDays != null && (
                  <div className="rounded-2xl border border-white/8 bg-[#1d2835]/55 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/46">
                      {t("services.staging.landing.showcase.metaTimeline")}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-white">
                      {project.package.estimatedDays} {tx("services.staging.landing.packageDaysSuffix", "days")}
                    </p>
                  </div>
                )}
                {formatCurrencyRange(project.package, locale) && (
                  <div className="rounded-2xl border border-white/8 bg-[#1d2835]/55 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/46">
                      {t("services.staging.landing.showcase.metaBudget")}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-white">
                      {formatCurrencyRange(project.package, locale)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {services.length > 0 && (
            <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6">
              <h2 className="text-2xl font-bold text-white">
                {t("services.staging.projectDetail.services")}
              </h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {services.map((service) => (
                  <span
                    key={service}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70"
                  >
                    {t(`services.enums.staging.service.${service}`, {
                      defaultValue: humanizeToken(service),
                    })}
                  </span>
                ))}
              </div>
            </div>
          )}

          {metrics.length > 0 && (
            <div className="rounded-[1.75rem] border border-[#06a84e]/18 bg-[#06a84e]/7 p-6">
              <h2 className="text-2xl font-bold text-white">
                {tx("services.staging.projectDetail.metricsTitle", "Published outcome signals")}
              </h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                {metrics.map((metric) => (
                  <div
                    key={metric.label}
                    className="rounded-2xl border border-white/10 bg-black/10 p-4"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/48">
                      {metric.label}
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">{metric.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-[1.75rem] border border-white/10 bg-[#1d2835]/55 p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#82f2ac]">
              {tx("services.staging.projectDetail.consultationEyebrow", "Discuss a similar scope")}
            </p>
            <h2 className="mt-2 text-2xl font-bold text-white">
              {tx(
                "services.staging.projectDetail.consultationTitle",
                "Brief your property and we can propose the right staging or renovation level."
              )}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/72">
              {tx(
                "services.staging.projectDetail.consultationBody",
                "Share the asset, timeline, and target outcome. The public showcase is real, but every scope is still matched to the property."
              )}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                to="/services/home-staging/request"
                className="inline-flex items-center gap-2 rounded-xl bg-[#06a84e] px-5 py-3 font-semibold text-white transition hover:bg-[#059944]"
              >
                {tx("services.staging.projectDetail.ctaConsultation", "Request consultation")}
                <MdArrowOutward className="text-lg" />
              </Link>
              <Link
                to="/services/home-staging/projects"
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-5 py-3 font-semibold text-white transition hover:bg-white/8"
              >
                {t("services.staging.projectDetail.backToList")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {!featuredPair && mediaLinks.length === 0 && services.length === 0 && metrics.length === 0 && (
        <section className="rounded-[1.75rem] border border-dashed border-white/14 bg-white/[0.04] p-6">
          <div className="flex items-start gap-3">
            <MdCheckCircle className="mt-0.5 text-xl text-[#82f2ac]" />
            <p className="text-sm leading-relaxed text-white/70">
              {tx(
                "services.staging.projectDetail.minimalState",
                "This published project currently includes limited public fields. As more media and narrative are added in admin, this page will enrich automatically."
              )}
            </p>
          </div>
        </section>
      )}
    </ServicePageChrome>
  );
};

export default HomeStagingProjectDetailPage;
