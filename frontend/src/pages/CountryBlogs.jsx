import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { MdArrowBack, MdArrowForward, MdCalendarToday } from "react-icons/md";
import useBlogs from "../hooks/useBlogs";
import { BLOGS } from "../constant/data";
import blog1 from "../assets/blog1.jpg";
import blog2 from "../assets/blog2.jpg";
import blog3 from "../assets/blog3.jpg";
import blog4 from "../assets/blog4.jpg";

const placeholderImages = [blog1, blog2, blog3, blog4];

const CountryBlogs = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { countrySlug } = useParams();
  const { data: blogs, isLoading } = useBlogs();
  const language = i18n.language?.toLowerCase().startsWith("tr") ? "tr" : "en";

  const displayBlogs = Array.isArray(blogs) && blogs.length > 0 ? blogs : BLOGS;
  const normalizedSlug = (countrySlug || "").toLowerCase();

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

  const toSlug = (value = "") =>
    value
      .toString()
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");

  const extractCountryTitle = (rawTitle) => {
    if (!rawTitle || typeof rawTitle !== "string") return "";
    const cleaned = rawTitle.replace(/[?!\u061f]+$/g, "").trim();
    const lower = cleaned.toLowerCase();
    const inIndex = lower.lastIndexOf(" in ");
    if (inIndex !== -1 && inIndex + 4 < cleaned.length) {
      return cleaned.slice(inIndex + 4).trim();
    }
    return "";
  };

  const getCountryFromBlog = (blog) => {
    if (blog.country) return blog.country;
    const candidates = [
      blog.title_en,
      blog.title_tr,
      blog.title,
      getLocalizedTitle(blog),
    ].filter(Boolean);
    for (const candidate of candidates) {
      const extracted = extractCountryTitle(candidate);
      if (extracted) return extracted;
    }
    return "";
  };

  const getCountrySlug = (country) => {
    if (!country) return "";
    const trimmed = country.toString().trim();
    const asciiSlug = toSlug(trimmed);
    return (asciiSlug || encodeURIComponent(trimmed.toLowerCase())).toLowerCase();
  };

  const getSummaryItems = (text) => {
    if (!text || typeof text !== "string") return [];
    const items = text
      .split(/\r?\n|\s*\|\s*/g)
      .map((item) => item.replace(/^\s*[-\u2022]\s*/, "").trim())
      .filter(Boolean);
    return items.length > 1 ? items : [];
  };

  const countryBlogs = displayBlogs
    .map((blog, index) => ({ blog, index }))
    .filter(({ blog }) => {
      const country = getCountryFromBlog(blog);
      if (!country) return false;
      return getCountrySlug(country) === normalizedSlug;
    });

  const countryName = countryBlogs.length
    ? getCountryFromBlog(countryBlogs[0].blog)
    : decodeURIComponent(normalizedSlug || "").replace(/-/g, " ");

  return (
    <section className="min-h-screen pt-24 pb-16 bg-slate-50 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-20 h-72 w-72 rounded-full bg-emerald-200/40 blur-3xl"></div>
        <div className="absolute top-20 right-0 h-80 w-80 rounded-full bg-lime-200/40 blur-3xl"></div>
        <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-sky-200/30 blur-3xl"></div>
      </div>

      <div className="max-padd-container relative z-10">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate("/blogs")}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm hover:border-emerald-200 hover:text-emerald-600"
          >
            <MdArrowBack />
            {t("blogs.back", "Back to countries")}
          </button>
        </div>

        <div className="mt-6 flex flex-col gap-4">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">
            {countryName || t("blogs.title", "Our Expert Blogs")}
          </h1>
          <p className="text-slate-600">
            {t("blogs.countryIntro", "Articles related to this country.")}
          </p>
        </div>

        {isLoading ? (
          <div className="flexCenter mt-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
          </div>
        ) : countryBlogs.length === 0 ? (
          <div className="mt-16 rounded-3xl border border-white/70 bg-white/90 p-10 text-center shadow-xl shadow-emerald-100/40">
            <p className="text-slate-600">
              {t("blogs.noCountryPosts", "No posts found for this country yet.")}
            </p>
            <button
              type="button"
              onClick={() => navigate("/blogs")}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-emerald-500 px-6 py-3 text-white text-sm font-semibold shadow-lg shadow-emerald-200/60 hover:bg-emerald-600 transition"
            >
              {t("blogs.viewAll", "More")}
            </button>
          </div>
        ) : (
          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {countryBlogs.map(({ blog, index }) => {
              const canNavigate = Boolean(blog.id);
              const postTitle = getLocalizedTitle(blog);
              const summary = getLocalizedSummary(blog);
              const summaryItems = getSummaryItems(summary);
              const category = getLocalizedCategory(blog);

              return (
                <article
                  key={blog.id || `${postTitle}-${index}`}
                  className={`group rounded-2xl border border-slate-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                    canNavigate ? "cursor-pointer" : "cursor-default"
                  }`}
                  onClick={() => {
                    if (canNavigate) {
                      navigate(`/blog/${blog.id}`);
                    }
                  }}
                >
                  <div className="p-5 flex flex-col h-full">
                    <div className="flex items-start gap-3">
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100">
                        <img
                          src={getBlogImage(blog, index)}
                          alt={postTitle}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600">
                          {category}
                        </p>
                        <h4 className="mt-1 text-base font-semibold text-slate-900 leading-snug">
                          {postTitle}
                        </h4>
                        {blog.createdAt && (
                          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
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
                      </div>
                    </div>

                    {summaryItems.length > 1 ? (
                      <div className="mt-4 grid gap-2">
                        {summaryItems.map((item, itemIndex) => (
                          <div
                            key={`${blog.id || postTitle}-${itemIndex}`}
                            className="rounded-xl border border-emerald-100/80 bg-emerald-50/70 px-3 py-2 text-xs text-slate-600 shadow-sm"
                          >
                            {item}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-4 text-xs text-slate-600 leading-relaxed line-clamp-4">
                        {summary}
                      </p>
                    )}

                    <button
                      type="button"
                      disabled={!canNavigate}
                      onClick={(event) => {
                        event.stopPropagation();
                        if (canNavigate) {
                          navigate(`/blog/${blog.id}`);
                        }
                      }}
                      className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-emerald-600 hover:text-emerald-700 disabled:cursor-default disabled:opacity-50"
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

export default CountryBlogs;
