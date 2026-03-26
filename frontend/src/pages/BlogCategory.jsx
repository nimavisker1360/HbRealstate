import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MdArrowBack } from "react-icons/md";
import useBlogs from "../hooks/useBlogs";
import SEO from "../components/SEO";
import Breadcrumbs from "../components/seo/Breadcrumbs";
import { SITE_URL, slugify } from "../utils/seo";
import { getContentDisplaySummary, getContentDisplayTitle, toCategoryPath } from "../utils/contentGraph";

const BlogCategory = () => {
  const navigate = useNavigate();
  const { categorySlug = "" } = useParams();
  const { data: blogs = [] } = useBlogs();

  const categoryBlogs = useMemo(
    () =>
      blogs.filter((blog) => slugify(blog?.category_en || blog?.category || "") === categorySlug),
    [blogs, categorySlug]
  );

  const categoryName =
    categoryBlogs[0]?.category_en ||
    categoryBlogs[0]?.category ||
    categorySlug.replace(/-/g, " ");

  const breadcrumbItems = [
    { label: "Home", to: "/" },
    { label: "Blogs", to: "/blogs" },
    { label: categoryName },
  ];

  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: `${categoryName} Articles`,
      description: `Read ${categoryName} articles and real estate guides.`,
      url: `${SITE_URL}${toCategoryPath(categoryName)}`,
    },
  ];

  return (
    <>
      <SEO
        title={`${categoryName} Articles | HB International Real Estate`}
        description={`Read ${categoryName} articles and real estate guides.`}
        canonicalPath={toCategoryPath(categoryName)}
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
            Back to blogs
          </button>

          <Breadcrumbs items={breadcrumbItems} />

          <section className="rounded-[30px] border border-white/70 bg-white/90 p-6 shadow-[0_28px_70px_-50px_rgba(15,23,42,0.5)] sm:p-8 lg:p-10">
            <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
              {categoryName}
            </h1>
            <p className="mt-4 text-base leading-8 text-slate-600">
              Articles connected to the {categoryName} cluster.
            </p>

            <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {categoryBlogs.map((blog) => (
                <button
                  key={blog.id}
                  type="button"
                  onClick={() => navigate(`/blog/${blog.slug || blog.id}`)}
                  className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-5 text-left transition hover:-translate-y-1 hover:border-emerald-200 hover:bg-white"
                >
                  <h2 className="text-lg font-semibold text-slate-900">
                    {getContentDisplayTitle(blog)}
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {getContentDisplaySummary(blog)}
                  </p>
                </button>
              ))}
            </div>
          </section>
        </div>
      </main>
    </>
  );
};

export default BlogCategory;
