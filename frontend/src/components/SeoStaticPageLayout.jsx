import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import SEO from "./SEO";
import Breadcrumbs from "./seo/Breadcrumbs";
import FaqSection, { buildFaqSchema } from "./seo/FaqSection";
import RelatedContentSection from "./seo/RelatedContentSection";
import SeoCtaSection from "./seo/SeoCtaSection";
import useProperties from "../hooks/useProperties";
import useBlogs from "../hooks/useBlogs";
import { SITE_URL } from "../utils/seo";
import {
  buildContentContext,
  pickRelatedBlogs,
  pickRelatedGuides,
  pickRelatedProjects,
  pickRelatedProperties,
} from "../utils/contentGraph";
import { contentHubPages } from "../data/contentHubPages";

const SeoStaticPageLayout = ({
  title,
  description,
  canonicalPath,
  breadcrumbLabel,
  introParagraphs = [],
  sections = [],
  faqs = [],
  relatedLinks = [],
  highlights = [],
  taxonomy = {},
  pageType = "Guide",
  cta,
}) => {
  const { data: properties = [] } = useProperties();
  const { data: blogs = [] } = useBlogs();

  const context = buildContentContext({
    title,
    description,
    introParagraphs,
    pageType,
    taxonomy,
  });

  const relatedProperties = pickRelatedProperties({
    properties,
    context,
    limit: 4,
  });

  const relatedProjects = pickRelatedProjects({
    properties,
    context,
    limit: 3,
  });

  const relatedArticles = pickRelatedBlogs({
    blogs,
    context,
    limit: 4,
  });

  const relatedGuides = pickRelatedGuides({
    guides: contentHubPages.filter((page) => page.canonicalPath !== canonicalPath),
    context,
    limit: 3,
  });

  const breadcrumbItems = [
    { label: "Home", to: "/" },
    { label: "Investment Guides", to: "/investment-guides" },
    { label: breadcrumbLabel || title },
  ];

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbItems.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      item: `${SITE_URL}${index === 0 ? "" : item.to || canonicalPath}`,
    })),
  };

  const faqSchema = buildFaqSchema(faqs);

  return (
    <>
      <SEO
        title={title}
        description={description}
        canonicalPath={canonicalPath}
        structuredData={[breadcrumbSchema, faqSchema]}
      />

      <main className="relative overflow-hidden bg-[#f7f3ea] py-24">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 -left-20 h-72 w-72 rounded-full bg-emerald-200/30 blur-3xl" />
          <div className="absolute top-10 right-0 h-80 w-80 rounded-full bg-amber-200/30 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-teal-200/20 blur-3xl" />
        </div>

        <div className="max-padd-container relative z-10">
          <div className="mx-auto max-w-6xl">
            <Breadcrumbs items={breadcrumbItems} />

            <article className="rounded-[30px] border border-white/70 bg-white/90 p-6 shadow-[0_28px_70px_-50px_rgba(15,23,42,0.5)] backdrop-blur sm:p-8 lg:p-10">
              <div className="max-w-4xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-emerald-700">
                  {pageType}
                </p>
                <h1 className="mt-3 text-3xl font-bold leading-tight text-slate-900 sm:text-4xl lg:text-5xl">
                  {title}
                </h1>
                <p className="mt-5 text-base leading-8 text-slate-600 sm:text-lg">
                  {description}
                </p>
              </div>

              {highlights.length > 0 && (
                <section className="mt-10">
                  <h2 className="text-2xl font-bold text-slate-900">Key Highlights</h2>
                  <div className="mt-5 grid gap-4 md:grid-cols-3">
                    {highlights.map((item) => (
                      <div
                        key={item}
                        className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5"
                      >
                        <p className="text-sm font-medium leading-7 text-slate-700">
                          {item}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <div className="mt-10 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-5">
                <p className="text-sm leading-7 text-slate-600 sm:text-base">
                  Looking for live inventory while you research? Explore{" "}
                  <Link to="/listing" className="font-semibold text-emerald-700 underline">
                    current property listings
                  </Link>{" "}
                  and compare them against the guidance on this page.
                </p>
              </div>

              {relatedLinks.length > 0 && (
                <section className="mt-10">
                  <h2 className="text-2xl font-bold text-slate-900">Explore Next</h2>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {relatedLinks.map((item) => (
                      <Link
                        key={`${item.to}-${item.label}`}
                        to={item.to}
                        className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              <section className="mt-10 space-y-5 text-slate-600">
                {introParagraphs.map((paragraph, index) => (
                  <p key={`intro-${index}`} className="text-base leading-8 sm:text-lg">
                    {paragraph}
                  </p>
                ))}
              </section>

              {sections.map((section) => (
                <section key={section.heading} className="mt-12">
                  <h2 className="text-2xl font-bold text-slate-900">{section.heading}</h2>
                  <div className="mt-4 space-y-4">
                    {section.paragraphs.map((paragraph, index) => (
                      <p key={`${section.heading}-${index}`} className="text-base leading-8 text-slate-600">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </section>
              ))}

              {cta ? (
                <SeoCtaSection
                  title={cta.title}
                  description={cta.description}
                  primaryAction={cta.primaryAction}
                  secondaryAction={cta.secondaryAction}
                />
              ) : null}

              <RelatedContentSection
                title="Related Properties"
                description="Commercial inventory connected to this topic."
                items={relatedProperties}
                type="property"
              />

              <RelatedContentSection
                title="Related Projects"
                description="Relevant project pages surfaced by city, district, and buyer intent."
                items={relatedProjects}
                type="property"
              />

              <RelatedContentSection
                title="Related Articles"
                description="Supporting informational content connected to this page."
                items={relatedArticles}
              />

              <RelatedContentSection
                title="Continue Through The Cluster"
                description="Next-best guide pages in the same topic graph."
                items={relatedGuides}
              />

              <FaqSection title="FAQ" items={faqs} />
            </article>
          </div>
        </div>
      </main>
    </>
  );
};

SeoStaticPageLayout.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  canonicalPath: PropTypes.string.isRequired,
  breadcrumbLabel: PropTypes.string.isRequired,
  introParagraphs: PropTypes.arrayOf(PropTypes.string),
  sections: PropTypes.arrayOf(
    PropTypes.shape({
      heading: PropTypes.string.isRequired,
      paragraphs: PropTypes.arrayOf(PropTypes.string).isRequired,
    })
  ),
  faqs: PropTypes.arrayOf(
    PropTypes.shape({
      question: PropTypes.string.isRequired,
      answer: PropTypes.string.isRequired,
    })
  ),
  relatedLinks: PropTypes.arrayOf(
    PropTypes.shape({
      to: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })
  ),
  highlights: PropTypes.arrayOf(PropTypes.string),
  taxonomy: PropTypes.object,
  pageType: PropTypes.string,
  cta: PropTypes.shape({
    title: PropTypes.string,
    description: PropTypes.string,
    primaryAction: PropTypes.object,
    secondaryAction: PropTypes.object,
  }),
};

export default SeoStaticPageLayout;
