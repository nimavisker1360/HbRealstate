import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MdArrowBack } from "react-icons/md";
import useBlogs from "../hooks/useBlogs";
import SEO from "../components/SEO";
import Breadcrumbs from "../components/seo/Breadcrumbs";
import {
  SITE_URL,
  buildLanguageAlternates,
  resolveBlogPath,
  slugify,
} from "../utils/seo";
import { getContentDisplaySummary, getContentDisplayTitle, toCategoryPath } from "../utils/contentGraph";
import { fixMojibake } from "../utils/text";

const BlogCategory = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { categorySlug = "" } = useParams();
  const { data: blogs = [] } = useBlogs();
  const normalizedLang = i18n.language?.toLowerCase() || "en";
  const language = normalizedLang.startsWith("tr")
    ? "tr"
    : normalizedLang.startsWith("ru")
    ? "ru"
    : "en";

  const getLocalizedCategory = (blog) => {
    if (!blog) return "";
    const localizedValue =
      (language === "tr" && blog.category_tr) ||
      (language === "ru" && blog.category_ru) ||
      (language === "en" && blog.category_en) ||
      blog.category_en ||
      blog.category ||
      "";
    return fixMojibake(localizedValue);
  };

  const categoryBlogs = useMemo(
    () =>
      blogs.filter((blog) => slugify(blog?.category_en || blog?.category || "") === categorySlug),
    [blogs, categorySlug]
  );

  const categorySourceName =
    categoryBlogs[0]?.category_en ||
    categoryBlogs[0]?.category ||
    decodeURIComponent(categorySlug).replace(/-/g, " ");
  const categoryName = categoryBlogs[0]
    ? getLocalizedCategory(categoryBlogs[0])
    : categorySourceName;
  const canonicalPath = categorySourceName
    ? toCategoryPath(categorySourceName)
    : `/blogs/category/${categorySlug}`;
  const seoTitle = t("blogs.categorySeoTitle", {
    category: categoryName,
    defaultValue: "{{category}} Articles | HB International Real Estate",
  });
  const description = t("blogs.categorySeoDescription", {
    category: categoryName,
    defaultValue: "Read {{category}} articles and real estate guides.",
  });

  const breadcrumbItems = [
    { label: t("guidePage.home", "Home"), to: "/" },
    { label: t("blogs.breadcrumb", "Blogs"), to: "/blogs" },
    { label: categoryName },
  ];

  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: t("blogs.categorySchemaName", {
        category: categoryName,
        defaultValue: "{{category}} Articles",
      }),
      description,
      url: `${SITE_URL}${canonicalPath}`,
    },
  ];

  return (
    <>
      <SEO
        title={seoTitle}
        description={description}
        canonicalPath={canonicalPath}
        languageAlternates={buildLanguageAlternates(canonicalPath)}
        structuredData={structuredData}
      />

      <main className="min-h-screen bg-[#f7f3ea] py-24">
        <div className="max-padd-container">
          <button
            type="button"
            onClick={() => navigate("/blogs")}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/85 px-4 py-2 text-sm font-semibold text-slate-700 hover:text-emerald-700"
          >
            <MdArrowBack />
            {t("blogs.backToBlogs", "Back to blogs")}
          </button>

          <Breadcrumbs items={breadcrumbItems} />

          <section className="rounded-[30px] border border-white/70 bg-white/90 p-6 shadow-[0_28px_70px_-50px_rgba(15,23,42,0.5)] sm:p-8 lg:p-10">
            <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
              {categoryName}
            </h1>
            <p className="mt-4 text-base leading-8 text-slate-600">
              {t("blogs.categoryClusterDescription", {
                category: categoryName,
                defaultValue: "Articles connected to the {{category}} cluster.",
              })}
            </p>

            {categoryBlogs.length === 0 ? (
              <div className="mt-10 rounded-[24px] border border-slate-200 bg-slate-50/70 p-6 text-sm text-slate-600">
                {t("blogs.noCategoryPosts", "No posts found in this category yet.")}
              </div>
            ) : (
              <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {categoryBlogs.map((blog) => (
                  <button
                    key={blog.id}
                    type="button"
                    onClick={() => navigate(resolveBlogPath(blog, { preferSlug: true }))}
                    className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-5 text-left transition hover:-translate-y-1 hover:border-emerald-200 hover:bg-white"
                  >
                    <h2 className="text-lg font-semibold text-slate-900">
                      {getContentDisplayTitle(blog, language)}
                    </h2>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {getContentDisplaySummary(blog, language)}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
};

export default BlogCategory;
