import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import useBlogs from "../hooks/useBlogs";
import { BLOGS } from "../constant/data";
import blog1 from "../assets/blog1.jpg";
import blog2 from "../assets/blog2.jpg";
import blog3 from "../assets/blog3.jpg";
import blog4 from "../assets/blog4.jpg";

// Default placeholder image for blogs without images
const placeholderImages = [blog1, blog2, blog3, blog4];

const Blogs = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { data: blogs, isLoading } = useBlogs();
  const currentLang = i18n.language;

  // Use API data if available, otherwise fall back to static data
  const displayBlogs = Array.isArray(blogs) && blogs.length > 0 ? blogs : BLOGS;

  const handleContinueReading = (blog) => {
    // If blog has an id (from API), navigate to the blog page
    if (blog.id) {
      navigate(`/blog/${blog.id}`);
    }
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

  const getLocalizedCategory = (blog) => {
    if (currentLang === "tr" && blog.category_tr) return blog.category_tr;
    if (currentLang === "en" && blog.category_en) return blog.category_en;
    return blog.category;
  };

  return (
    <section className="max-padd-container overflow-x-hidden">
      <div className="py-16 xl:py-28 rounded-3xl">
        <div className="text-center">
          <span className="medium-18">{t('blogs.subtitle', 'Stay Updated with the Latest News!')}</span>
          <h2 className="h2">{t('blogs.title', 'Our Expert Blogs')}</h2>
        </div>
        {/* container */}
        {isLoading ? (
          <div className="flexCenter mt-24">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary"></div>
          </div>
        ) : (
          <div className="grid gap-8 sm:gap-10 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 mt-20 justify-items-center">
            {displayBlogs.map((blog, index) => (
              <div
                key={blog.id || blog.title}
                className="group flex flex-col items-center text-center cursor-pointer"
                onClick={() => handleContinueReading(blog)}
              >
                <div className="relative w-36 h-36 sm:w-44 sm:h-44 lg:w-48 lg:h-48 rounded-full p-[6px] bg-white shadow-lg ring-1 ring-black/5 transition-transform duration-300 group-hover:-translate-y-1 group-hover:shadow-xl">
                  <div className="w-full h-full rounded-full overflow-hidden bg-gray-100">
                    <img
                      src={getBlogImage(blog, index)}
                      alt={getLocalizedTitle(blog)}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                </div>

                <h3 className="mt-4 text-sm sm:text-base font-semibold text-gray-800 max-w-[220px]">
                  {getLocalizedTitle(blog)}
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  {getLocalizedCategory(blog)}
                </p>
                <button
                  className="mt-3 bg-white rounded-full font-[500] text-[13px] sm:text-[14px] text-tertiary px-4 py-1.5 border border-gray-200 hover:bg-secondary hover:text-white hover:border-secondary transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleContinueReading(blog);
                  }}
                >
                  {t("blogs.continueReading", "continue reading")}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Blogs;
