import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { MdArrowForward, MdCalendarToday } from "react-icons/md";
import useBlogs from "../hooks/useBlogs";
import { BLOGS } from "../constant/data";
import blog1 from "../assets/blog1.jpg";
import blog2 from "../assets/blog2.jpg";
import blog3 from "../assets/blog3.jpg";
import blog4 from "../assets/blog4.jpg";

const placeholderImages = [blog1, blog2, blog3, blog4];

const BlogsPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { data: blogs, isLoading } = useBlogs();
  const language = i18n.language?.toLowerCase().startsWith("tr") ? "tr" : "en";

  const displayBlogs = Array.isArray(blogs) && blogs.length > 0 ? blogs : BLOGS;

  const getBlogImage = (blog, index) => {
    if (blog.image) return blog.image;
    if (Array.isArray(blog.images) && blog.images.length > 0) {
      return blog.images[0];
    }
    return placeholderImages[index % placeholderImages.length];
  };

  const getLocalizedTitle = (blog) => {
    if (language === "tr" && blog.title_tr) return blog.title_tr;
    if (language === "en" && blog.title_en) return blog.title_en;
    return blog.title || t("blogs.title", "Our Expert Blogs");
  };

  const getLocalizedCategory = (blog) => {
    if (language === "tr" && blog.category_tr) return blog.category_tr;
    if (language === "en" && blog.category_en) return blog.category_en;
    return blog.category || t("common.all", "All");
  };

  const getLocalizedSummary = (blog) => {
    if (language === "tr" && blog.summary_tr) return blog.summary_tr;
    if (language === "en" && blog.summary_en) return blog.summary_en;
    if (blog.summary) return blog.summary;
    return t("blogs.subtitle", "Stay Updated with the Latest News!");
  };

  const handleOpenBlog = (blog) => {
    if (blog.id) {
      navigate(`/blog/${blog.id}`);
    }
  };

  return (
    <section className="min-h-screen pt-24 pb-16 bg-slate-50 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-20 h-72 w-72 rounded-full bg-emerald-200/40 blur-3xl"></div>
        <div className="absolute top-20 right-0 h-80 w-80 rounded-full bg-lime-200/40 blur-3xl"></div>
        <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-sky-200/30 blur-3xl"></div>
      </div>

      <div className="max-padd-container relative z-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
              {t("blogs.subtitle", "Stay Updated with the Latest News!")}
            </span>
            <h1 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900">
              {t("blogs.title", "Our Expert Blogs")}
            </h1>
            <p className="mt-4 text-slate-600">
              {t(
                "blogs.pageIntro",
                "Explore market intelligence, investment strategies, and neighborhood deep dives curated by our experts."
              )}
            </p>
          </div>
          <div className="w-full max-w-sm rounded-3xl border border-white/70 bg-white/80 p-6 shadow-lg shadow-emerald-100/60">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">
              {t("common.total", "Total")}
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {displayBlogs.length}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              {t("blogs.pageNote", "Latest insights ready to explore.")}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flexCenter mt-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
          </div>
        ) : (
          <div className="mt-12 grid gap-8 md:grid-cols-2 xl:grid-cols-3">
            {displayBlogs.map((blog, index) => {
              const canNavigate = Boolean(blog.id);
              const title = getLocalizedTitle(blog);
              const summary = getLocalizedSummary(blog);
              const category = getLocalizedCategory(blog);

              return (
                <article
                  key={blog.id || `${title}-${index}`}
                  className={`group relative overflow-hidden rounded-3xl border border-white/70 bg-white/90 shadow-xl shadow-emerald-100/40 transition hover:-translate-y-1 hover:shadow-2xl ${
                    canNavigate ? "cursor-pointer" : "cursor-default"
                  }`}
                  onClick={() => handleOpenBlog(blog)}
                >
                  <div className="p-6 sm:p-7 flex flex-col items-center text-center">
                    <div className="relative">
                      <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full p-[6px] bg-white shadow-lg ring-1 ring-emerald-100 transition-transform duration-300 group-hover:-translate-y-1">
                        <div className="w-full h-full rounded-full overflow-hidden bg-slate-100">
                          <img
                            src={getBlogImage(blog, index)}
                            alt={title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        </div>
                      </div>
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-100 shadow-sm">
                        {category}
                      </span>
                    </div>
                    {blog.createdAt && (
                      <div className="mt-5 flex items-center justify-center gap-2 text-xs text-slate-500">
                        <MdCalendarToday className="text-emerald-500" />
                        <span>
                          {new Date(blog.createdAt).toLocaleDateString(
                            language === "tr" ? "tr-TR" : "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            }
                          )}
                        </span>
                      </div>
                    )}
                    <h3 className="mt-4 text-lg sm:text-xl font-semibold text-slate-900 transition-colors group-hover:text-emerald-600">
                      {title}
                    </h3>
                    <p className="mt-3 text-sm text-slate-600 leading-relaxed max-h-[72px] overflow-hidden">
                      {summary}
                    </p>
                    <button
                      type="button"
                      disabled={!canNavigate}
                      onClick={(event) => {
                        event.stopPropagation();
                        handleOpenBlog(blog);
                      }}
                      className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 hover:text-emerald-700 disabled:cursor-default disabled:opacity-50"
                    >
                      {t("blogs.continueReading", "continue reading")}
                      <MdArrowForward />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default BlogsPage;
