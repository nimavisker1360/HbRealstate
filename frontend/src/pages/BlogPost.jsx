import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "react-query";
import { getBlog } from "../utils/api";
import { MdArrowBack, MdCalendarToday, MdCategory, MdErrorOutline, MdTranslate, MdAccessTime, MdShare, MdClose, MdChevronLeft, MdChevronRight } from "react-icons/md";
import { useEffect, useState } from "react";
import HousingSalesChart from "../components/HousingSalesChart";
import ForeignSalesChart from "../components/ForeignSalesChart";
import { MdPhotoLibrary } from "react-icons/md";

const BlogPost = () => {
  const { blogId } = useParams();
  const navigate = useNavigate();
  const [language, setLanguage] = useState("en"); // Default to English
  const [selectedImage, setSelectedImage] = useState(null); // For lightbox
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const { data: blog, isLoading, isError } = useQuery(
    ["blog", blogId],
    () => getBlog(blogId),
    {
      enabled: !!blogId,
      refetchOnWindowFocus: false,
    }
  );

  // Get content based on selected language
  const getLocalizedContent = (field) => {
    if (!blog) return "";
    const langField = `${field}_${language}`;
    return blog[langField] || blog[field] || "";
  };

  const getLocalizedFaq = () => {
    if (!blog) return [];
    const langField = `faqSection_${language}`;
    const faq = blog[langField] || blog.faqSection;
    return Array.isArray(faq) ? faq : [];
  };

  // Check if bilingual content exists
  const hasBilingualContent = blog?.content_en || blog?.content_tr;

  // Update meta tags for SEO
  useEffect(() => {
    if (blog) {
      // Set page title
      document.title = getLocalizedContent("title") || "Blog Post";
      
      // Set meta description
      const metaDesc = getLocalizedContent("metaDescription") || getLocalizedContent("summary");
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute("content", metaDesc);
      } else {
        const meta = document.createElement("meta");
        meta.name = "description";
        meta.content = metaDesc;
        document.head.appendChild(meta);
      }
    }
    
    // Cleanup
    return () => {
      document.title = "Real Estate Turkey";
    };
  }, [blog, language]);

  // Calculate reading time
  const calculateReadingTime = (content) => {
    if (!content) return 0;
    const text = content.replace(/<[^>]*>/g, "");
    const words = text.split(/\s+/).length;
    return Math.ceil(words / 200); // Average reading speed
  };

  // Share functionality
  const handleShare = async () => {
    const url = window.location.href;
    const title = getLocalizedContent("title");
    
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch (err) {
        console.log("Share cancelled");
      }
    } else {
      navigator.clipboard.writeText(url);
      alert(language === "tr" ? "Link kopyalandı!" : "Link copied!");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flexCenter bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pt-24">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-indigo-200 rounded-full animate-pulse"></div>
            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-600 mt-4 font-medium">Loading article...</p>
        </div>
      </div>
    );
  }

  if (isError || !blog) {
    return (
      <div className="min-h-screen flexCenter bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pt-24">
        <div className="text-center bg-white p-10 rounded-3xl shadow-xl max-w-md mx-4">
          <div className="mb-6 flex justify-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
              <MdErrorOutline className="text-red-500 text-4xl" />
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-3 text-gray-800">Blog post not found</h2>
          <p className="text-gray-500 mb-8">The blog post you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => navigate("/")}
            className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-8 py-3 rounded-xl hover:from-indigo-700 hover:to-blue-700 transition-all duration-300 font-medium shadow-lg shadow-indigo-200"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // Check if this is a stats blog
  const isHousingStatsBlog = blog.content?.includes('<!-- HOUSING_STATS_CHART -->');
  const isForeignSalesBlog = blog.content?.includes('<!-- FOREIGN_SALES_CHART -->');
  const readingTime = calculateReadingTime(getLocalizedContent("content"));

  return (
    <div className={`min-h-screen pt-24 pb-16 relative overflow-hidden ${(isHousingStatsBlog || isForeignSalesBlog) ? 'bg-slate-900' : 'bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50'}`}>
      {!isHousingStatsBlog && !isForeignSalesBlog && (
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 -left-16 h-72 w-72 rounded-full bg-indigo-200/40 blur-3xl"></div>
          <div className="absolute top-24 -right-24 h-80 w-80 rounded-full bg-amber-200/40 blur-3xl"></div>
          <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-blue-200/30 blur-3xl"></div>
        </div>
      )}
      <div className="max-padd-container relative z-10">
        {/* Top Bar with Back & Language Switcher */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate(-1)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 ${
              (isHousingStatsBlog || isForeignSalesBlog) 
                ? 'text-slate-400 hover:text-white hover:bg-slate-800' 
                : 'text-gray-600 hover:text-indigo-600 hover:bg-white hover:shadow-md'
            }`}
          >
            <MdArrowBack size={20} />
            <span className="font-medium">{language === "tr" ? "Geri" : "Back"}</span>
          </button>

          {/* Language Switcher - Only show if bilingual content exists */}
          {hasBilingualContent && !isHousingStatsBlog && !isForeignSalesBlog && (
            <div className="flex items-center gap-2 bg-white rounded-xl p-1.5 shadow-lg shadow-gray-200/50 border border-gray-100">
              <button
                onClick={() => setLanguage("en")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                  language === "en"
                    ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <span className="text-lg">🇬🇧</span>
                <span>English</span>
              </button>
              <button
                onClick={() => setLanguage("tr")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                  language === "tr"
                    ? "bg-gradient-to-r from-red-600 to-red-500 text-white shadow-md"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <span className="text-lg">🇹🇷</span>
                <span>Türkçe</span>
              </button>
            </div>
          )}
        </div>

        {/* Image Lightbox Modal */}
        {selectedImage && (
          <div 
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
          >
            <button 
              className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
              onClick={() => setSelectedImage(null)}
            >
              <MdClose size={32} />
            </button>
            
            {/* Navigation arrows for gallery */}
            {blog.images && blog.images.length > 1 && (
              <>
                <button 
                  className="absolute left-4 text-white hover:text-gray-300 transition-colors p-2 bg-black/30 rounded-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    const newIndex = currentImageIndex > 0 ? currentImageIndex - 1 : blog.images.length - 1;
                    setCurrentImageIndex(newIndex);
                    setSelectedImage(blog.images[newIndex]);
                  }}
                >
                  <MdChevronLeft size={40} />
                </button>
                <button 
                  className="absolute right-4 text-white hover:text-gray-300 transition-colors p-2 bg-black/30 rounded-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    const newIndex = currentImageIndex < blog.images.length - 1 ? currentImageIndex + 1 : 0;
                    setCurrentImageIndex(newIndex);
                    setSelectedImage(blog.images[newIndex]);
                  }}
                >
                  <MdChevronRight size={40} />
                </button>
              </>
            )}
            
            <img 
              src={selectedImage} 
              alt="Full size" 
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            
            {/* Image counter */}
            {blog.images && blog.images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white bg-black/50 px-4 py-2 rounded-full text-sm">
                {currentImageIndex + 1} / {blog.images.length}
              </div>
            )}
          </div>
        )}

        {/* Main Article Card */}
        <article className={`rounded-3xl overflow-hidden relative ${
          (isHousingStatsBlog || isForeignSalesBlog) 
            ? 'bg-slate-800 shadow-2xl shadow-slate-900/50 ring-1 ring-white/5' 
            : 'bg-white shadow-2xl shadow-gray-200/50 border border-white/60 ring-1 ring-black/5'
        }`}>
          {/* Hero Image Section - Smaller */}
          {blog.image && (
            <div className="relative h-[200px] md:h-[280px] lg:h-[350px] overflow-hidden">
              <img
                src={blog.image}
                alt={getLocalizedContent("title")}
                className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700 cursor-pointer"
                onClick={() => {
                  setSelectedImage(blog.image);
                  setCurrentImageIndex(0);
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none"></div>
              
              {/* Category Badge */}
              <div className="absolute top-4 left-4">
                <span className="inline-block bg-white/20 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-xs font-medium border border-white/30">
                  {getLocalizedContent("category")}
                </span>
              </div>

              {/* Gallery indicator */}
              {blog.images && blog.images.length > 1 && (
                <div className="absolute top-4 right-4">
                  <span className="inline-flex items-center gap-1.5 bg-black/50 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-xs font-medium">
                    <MdPhotoLibrary size={14} />
                    {blog.images.length} {language === "tr" ? "fotoğraf" : "photos"}
                  </span>
                </div>
              )}

              {/* Title Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-5 md:p-8">
                <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-white leading-tight mb-2 drop-shadow-lg">
                  {getLocalizedContent("title")}
                </h1>
                
                {/* Meta Info */}
                <div className="flex flex-wrap items-center gap-3 text-white/80 text-xs md:text-sm">
                  <div className="flex items-center gap-1.5">
                    <MdCalendarToday size={14} />
                    <span>
                      {new Date(blog.createdAt).toLocaleDateString(language === "tr" ? "tr-TR" : "en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MdAccessTime size={14} />
                    <span>
                      {readingTime} {language === "tr" ? "dk okuma" : "min read"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Image Gallery Thumbnails */}
          {blog.images && blog.images.length > 1 && (
            <div className="px-4 md:px-8 py-4 bg-white/70 backdrop-blur-md border-b border-gray-100">
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300">
                {blog.images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSelectedImage(img);
                      setCurrentImageIndex(index);
                    }}
                    className={`flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border-2 transition-all duration-200 hover:opacity-100 ${
                      index === 0 ? 'border-indigo-500' : 'border-transparent opacity-70 hover:border-gray-300'
                    }`}
                  >
                    <img 
                      src={img} 
                      alt={`Gallery ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* No Image Header */}
          {!blog.image && !isHousingStatsBlog && !isForeignSalesBlog && (
            <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 p-8 md:p-12">
              <span className="inline-block bg-white/20 backdrop-blur-md text-white px-5 py-2 rounded-full text-sm font-medium mb-4 border border-white/30">
                {getLocalizedContent("category")}
              </span>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight mb-4">
                {getLocalizedContent("title")}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-white/80">
                <div className="flex items-center gap-2">
                  <MdCalendarToday size={16} />
                  <span className="text-sm">
                    {new Date(blog.createdAt).toLocaleDateString(language === "tr" ? "tr-TR" : "en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MdAccessTime size={16} />
                  <span className="text-sm">
                    {readingTime} {language === "tr" ? "dk okuma" : "min read"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Content Area */}
          <div className="p-6 md:p-10 lg:p-14">
            {/* Summary Card */}
            {getLocalizedContent("summary") && !isHousingStatsBlog && !isForeignSalesBlog && (
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl p-6 md:p-8 mb-10 border-l-4 border-indigo-500">
                <p className="text-lg md:text-xl text-gray-700 italic leading-relaxed">
                  {getLocalizedContent("summary")}
                </p>
              </div>
            )}

            {/* Share Button */}
            {!isHousingStatsBlog && !isForeignSalesBlog && (
              <div className="flex justify-end mb-8">
                <button
                  onClick={handleShare}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white/80 hover:bg-white rounded-xl transition-all duration-300 text-gray-700 font-medium shadow-sm hover:shadow-md border border-gray-200"
                >
                  <MdShare size={18} />
                  <span>{language === "tr" ? "Paylaş" : "Share"}</span>
                </button>
              </div>
            )}

            {/* Main Content */}
            <div className="prose prose-lg max-w-none">
              {blog.content?.includes('<!-- HOUSING_STATS_CHART -->') ? (
                <HousingSalesChart />
              ) : blog.content?.includes('<!-- FOREIGN_SALES_CHART -->') ? (
                <ForeignSalesChart />
              ) : (
                <div
                  className={`leading-relaxed ${
                    (isHousingStatsBlog || isForeignSalesBlog) 
                      ? 'text-slate-300' 
                      : 'text-gray-700'
                  } 
                  [&_h2]:text-2xl [&_h2]:md:text-3xl [&_h2]:font-bold [&_h2]:mt-12 [&_h2]:mb-6 [&_h2]:text-gray-800 [&_h2]:border-b-2 [&_h2]:border-indigo-100 [&_h2]:pb-3
                  [&_h3]:text-xl [&_h3]:md:text-2xl [&_h3]:font-semibold [&_h3]:mt-8 [&_h3]:mb-4 [&_h3]:text-gray-800
                  [&_p]:mb-6 [&_p]:text-base [&_p]:md:text-lg
                  [&_ul]:my-6 [&_ul]:space-y-3
                  [&_li]:pl-2 [&_li]:text-base [&_li]:md:text-lg
                  [&_strong]:text-gray-900 [&_strong]:font-semibold
                  [&_a]:text-indigo-600 [&_a]:hover:text-indigo-800 [&_a]:underline [&_a]:decoration-indigo-300 [&_a]:hover:decoration-indigo-600 [&_a]:transition-colors
                  [&_div.not-prose]:rounded-2xl [&_div.not-prose]:border [&_div.not-prose]:border-slate-100 [&_div.not-prose]:bg-slate-50/80 [&_div.not-prose]:p-6 [&_div.not-prose]:shadow-sm
                  [&_div.not-prose_img]:rounded-2xl [&_div.not-prose_img]:shadow-md
                  `}
                  dangerouslySetInnerHTML={{ __html: getLocalizedContent("content") }}
                />
              )}
            </div>

            {/* FAQ Section */}
            {getLocalizedFaq().length > 0 && !isHousingStatsBlog && !isForeignSalesBlog && (
              <div className="mt-16 pt-10 border-t-2 border-gray-100">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">❓</span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
                    {language === "tr" ? "Sık Sorulan Sorular" : "Frequently Asked Questions"}
                  </h2>
                </div>
                <div className="space-y-4">
                  {getLocalizedFaq().map((faq, index) => (
                    <details
                      key={index}
                      className="group bg-white rounded-2xl overflow-hidden border border-gray-200 hover:shadow-lg hover:border-indigo-200 transition-all duration-300"
                    >
                      <summary className="font-semibold text-gray-800 cursor-pointer p-6 flex items-center justify-between hover:bg-indigo-50/50 transition-colors">
                        <span className="pr-4 text-lg">{faq.question}</span>
                        <span className="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 group-open:rotate-180 transition-transform duration-300">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </span>
                      </summary>
                      <div className="px-6 pb-6 bg-indigo-50/30">
                        <p className="text-gray-600 leading-relaxed text-base md:text-lg">
                          {faq.answer}
                        </p>
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            )}

            {/* Internal Links / Related Articles */}
            {blog.internalLinks && blog.internalLinks.length > 0 && !isHousingStatsBlog && !isForeignSalesBlog && (
              <div className="mt-12 p-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <span className="text-xl">📚</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">
                    {language === "tr" ? "İlgili Makaleler" : "Related Articles"}
                  </h3>
                </div>
                <ul className="space-y-3">
                  {blog.internalLinks.map((link, index) => (
                    <li key={index} className="flex items-center gap-3 text-blue-700 hover:text-blue-900 transition-colors cursor-pointer group">
                      <span className="w-2 h-2 bg-blue-400 rounded-full group-hover:bg-blue-600 transition-colors"></span>
                      <span className="text-base md:text-lg group-hover:underline">{link}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </article>

        {/* Bottom CTA */}
        {!isHousingStatsBlog && !isForeignSalesBlog && (
          <div className="mt-12 text-center">
            <div className="inline-flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => navigate("/")}
                className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-8 py-4 rounded-xl hover:from-indigo-700 hover:to-blue-700 transition-all duration-300 font-medium shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300"
              >
                {language === "tr" ? "Daha Fazla Makale" : "View More Articles"}
              </button>
              <button
                onClick={() => navigate("/listing")}
                className="bg-white text-indigo-600 border-2 border-indigo-200 px-8 py-4 rounded-xl hover:bg-indigo-50 hover:border-indigo-300 transition-all duration-300 font-medium"
              >
                {language === "tr" ? "Mülkleri Keşfet" : "Explore Properties"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogPost;
