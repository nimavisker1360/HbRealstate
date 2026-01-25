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
          <div
            className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
             xl:grid-cols-4 mt-24"
          >
            {displayBlogs.map((blog, index) => (
              <div
                key={blog.id || blog.title}
                className="rounded-3xl border-8 border-primary shadow-sm overflow-hidden relative group cursor-pointer"
                onClick={() => handleContinueReading(blog)}
              >
                <img 
                  src={getBlogImage(blog, index)} 
                  alt={getLocalizedTitle(blog)}
                  className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
                />
                {/* overlay */}
                <div className="absolute top-0 left-0 h-full w-full bg-black/25 group-hover:bg-black/40 transition-colors"></div>
                <div className="absolute bottom-3 left-3 text-white text-[15px]">
                  <h3 className="font-[600] text-[16px] pr-4 leading-5">{getLocalizedTitle(blog)}</h3>
                  <h4 className="medium-14 pb-3 pt-1">{getLocalizedCategory(blog)}</h4>
                  <button 
                    className="bg-white rounded-xl font-[500] text-[15px] text-tertiary px-3 py-1 hover:bg-secondary hover:text-white transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleContinueReading(blog);
                    }}
                  >
                    {t('blogs.continueReading', 'continue reading')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Blogs;
