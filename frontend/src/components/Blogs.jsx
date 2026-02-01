import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import useBlogs from "../hooks/useBlogs";
import { MdArticle, MdPublic, MdTrendingUp } from "react-icons/md";
import { BLOGS } from "../constant/data";
import blog1 from "../assets/blog1.jpg";
import blog2 from "../assets/blog2.jpg";
import blog3 from "../assets/blog3.jpg";
import blog4 from "../assets/blog4.jpg";

// Default placeholder image for blogs without images
const placeholderImages = [blog1, blog2, blog3, blog4];

const Blogs = ({ limit = null, showMore = false }) => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { data: blogs, isLoading } = useBlogs();
  const currentLang = i18n.language;

  // Use API data if available, otherwise fall back to static data
  const displayBlogs = Array.isArray(blogs) && blogs.length > 0 ? blogs : BLOGS;

  const handleContinueReading = (country) => {
    if (!country) return;
    navigate(`/blogs/${getCountrySlug(country)}`);
  };

  const getBlogImage = (blog, index) => {
    if (blog.image) return blog.image;
    // Fall back to placeholder images for blogs without images
    return placeholderImages[index % placeholderImages.length];
  };

  // Get localized content based on current language
  const getLocalizedTitle = (blog) => {
    if (currentLang === "tr" && blog.title_tr) return blog.title_tr;
    if (currentLang === "en" && blog.title_en) return blog.title_en;
    return blog.title;
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

  const countryMap = displayBlogs.reduce((acc, blog, index) => {
    const country = getCountryFromBlog(blog);
    if (!country) return acc;
    const key = country.toLowerCase();
    if (!acc[key]) {
      acc[key] = {
        country,
        coverBlog: blog,
        coverIndex: index,
        count: 0,
      };
    }
    acc[key].count += 1;
    return acc;
  }, {});

  const normalizeCountry = (value = "") =>
    value
      .toString()
      .toLowerCase()
      .replace(/\u0131/g, "i")
      .replace(/\u0130/g, "i")
      .replace(/\u00fc/g, "u")
      .replace(/\u00f6/g, "o")
      .replace(/\u015f/g, "s")
      .replace(/\u011f/g, "g")
      .replace(/\u00e7/g, "c")
      .replace(/\u00c4\u00b1/g, "i")
      .replace(/\u00c3\u00bc/g, "u")
      .replace(/\u00c3\u00b6/g, "o")
      .replace(/\u00c5\u017f/g, "s")
      .replace(/\u00c4\u009f/g, "g")
      .replace(/\u00c3\u00a7/g, "c");

  const isExcludedCountry = (name) => {
    const normalized = normalizeCountry(name);
    return normalized === "turkey" || normalized === "turkiye";
  };

  const countryCards = Object.values(countryMap)
    .filter(({ country }) => !isExcludedCountry(country))
    .sort((a, b) => a.country.localeCompare(b.country));
  const visibleCountries =
    typeof limit === "number" ? countryCards.slice(0, limit) : countryCards;

  return (
    <section className="max-padd-container overflow-x-hidden mb-16">
      <div className="relative rounded-[36px] border-2 border-slate-200/80 bg-white/95 p-6 sm:p-10 shadow-[0_16px_40px_-18px_rgba(203,213,225,0.9)]">
        <div className="pointer-events-none absolute -top-6 left-10 h-12 w-12 rounded-2xl border border-emerald-200 bg-white/90 shadow-sm flexCenter">
          <MdArticle className="text-emerald-500 text-xl" />
        </div>
        <div className="pointer-events-none absolute top-10 right-12 h-12 w-12 rounded-2xl border border-slate-200 bg-white/90 shadow-sm flexCenter">
          <MdPublic className="text-slate-500 text-xl" />
        </div>
        <div className="pointer-events-none absolute bottom-6 right-24 h-12 w-12 rounded-2xl border border-emerald-200 bg-white/90 shadow-sm flexCenter">
          <MdTrendingUp className="text-emerald-500 text-xl" />
        </div>
        <div className="py-10 xl:py-16 rounded-3xl">
          <div className="text-center">
            <span className="medium-18">{t('blogs.countriesSubtitle', 'Explore Countries')}</span>
            <h2 className="h2">{t('blogs.countriesTitle', 'Countries')}</h2>
          </div>
          {/* container */}
          {isLoading ? (
            <div className="flexCenter mt-24">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary"></div>
            </div>
          ) : (
            <div className="grid gap-8 sm:gap-10 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 mt-20 justify-items-center">
              {visibleCountries.map(({ country, coverBlog, coverIndex, count }) => (
                <div
                  key={country}
                  className="group flex flex-col items-center text-center cursor-pointer"
                  onClick={() => handleContinueReading(country)}
                >
                  <div className="relative w-36 h-36 sm:w-44 sm:h-44 lg:w-48 lg:h-48 rounded-full p-[6px] bg-white shadow-lg ring-1 ring-black/5 transition-transform duration-300 group-hover:-translate-y-1 group-hover:shadow-xl">
                    <div className="w-full h-full rounded-full overflow-hidden bg-gray-100">
                      <img
                        src={getBlogImage(coverBlog, coverIndex)}
                        alt={country}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  </div>

                  <h3 className="mt-4 text-sm sm:text-base font-semibold text-gray-800 max-w-[220px]">
                    {country}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    {count} {t("blogs.posts", "posts")}
                  </p>
                  <button
                    className="mt-3 bg-white rounded-full font-[500] text-[13px] sm:text-[14px] text-tertiary px-4 py-1.5 border border-gray-200 hover:bg-secondary hover:text-white hover:border-secondary transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleContinueReading(country);
                    }}
                  >
                    {t("blogs.continueReading", "continue reading")}
                  </button>
                </div>
              ))}
            </div>
          )}
          {showMore && !isLoading && (
            <div className="flex justify-center mt-10">
              <button
                type="button"
                onClick={() => navigate("/blogs")}
                className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-6 py-3 text-white text-sm sm:text-base font-semibold shadow-lg shadow-emerald-200/60 hover:bg-emerald-600 transition"
              >
                {t("blogs.viewAll", "More")}
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Blogs;

