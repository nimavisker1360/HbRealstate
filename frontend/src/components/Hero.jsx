import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import heroBg from "../assets/img1.png";
import useProperties from "../hooks/useProperties";

const Hero = () => {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [filteredResults, setFilteredResults] = useState([]);
  const { data: properties, isLoading } = useProperties();
  const navigate = useNavigate();
  const searchRef = useRef(null);

  // Filter properties based on search query (exclude projects - they have their own pages)
  useEffect(() => {
    if (query.trim() && properties) {
      const filtered = properties.filter(
        (property) =>
          property.propertyType !== "local-project" &&
          property.propertyType !== "international-project" &&
          (property.title.toLowerCase().includes(query.toLowerCase()) ||
          property.city.toLowerCase().includes(query.toLowerCase()) ||
          property.country.toLowerCase().includes(query.toLowerCase()) ||
          property.address.toLowerCase().includes(query.toLowerCase()))
      );
      setFilteredResults(filtered);
      setShowResults(true);
    } else {
      setFilteredResults([]);
      setShowResults(false);
    }
  }, [query, properties]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/listing?search=${encodeURIComponent(query)}`);
    }
  };

  const handleResultClick = (property) => {
    setShowResults(false);
    setQuery("");
    // Navigate to listing page with property title to show only that property
    navigate(`/listing?search=${encodeURIComponent(property.title)}`);
  };

  return (
    <section className="relative h-[520px] sm:h-[600px] md:h-[720px] overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img
          src={heroBg}
          alt="city skyline"
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#101828]/70 via-[#101828]/40 to-[#101828]/80" />
      </div>

      {/* Content */}
      <div className="relative max-w-[1100px] mx-auto h-full px-6 sm:px-10 flex flex-col items-center justify-center text-white text-center gap-4">
        <h1 className="text-[36px] sm:text-[48px] md:text-[64px] font-semibold leading-tight italic">
          {t("hero.title")}
        </h1>
        <p className="text-lg sm:text-xl text-white/90 italic">
          {t("hero.subtitle")}
        </p>

        {/* Search Form */}
        <div ref={searchRef} className="relative w-full max-w-[560px] mt-6">
          <form
            onSubmit={handleSubmit}
            className="flex items-center bg-white rounded-full shadow-[0_14px_40px_rgba(15,23,42,0.25)]"
          >
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => query.trim() && setShowResults(true)}
              placeholder={t("hero.searchPlaceholder")}
              className="flex-1 rounded-full border-none py-3 px-5 text-sm text-gray-800 focus:outline-none"
            />
            <button
              type="submit"
              className="w-10 h-10 mr-1 rounded-full bg-[#06a84e] flex items-center justify-center text-white text-sm transition hover:bg-[#058a41]"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="w-5 h-5"
                fill="currentColor"
              >
                <path d="M10 4a6 6 0 014.472 10.04l4.744 4.744-1.415 1.415-4.744-4.744A6 6 0 1110 4zm0 2a4 4 0 100 8 4 4 0 000-8z" />
              </svg>
            </button>
          </form>

          {/* Search Results Dropdown */}
          {showResults && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl overflow-hidden z-50 max-h-[400px] overflow-y-auto">
              {isLoading ? (
                <div className="p-4 text-center text-gray-500">
                  {t("common.loading")}
                </div>
              ) : filteredResults.length > 0 ? (
                <ul>
                  {filteredResults.map((property) => (
                    <li
                      key={property.id}
                      onClick={() => handleResultClick(property)}
                      className="flex items-center gap-4 p-3 hover:bg-gray-50 cursor-pointer transition border-b border-gray-100 last:border-b-0"
                    >
                      <img
                        src={property.image}
                        alt={property.title}
                        className="w-16 h-12 object-cover rounded-lg flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0 text-left">
                        <h4 className="text-sm font-semibold text-gray-800 truncate">
                          {property.title}
                        </h4>
                        <p className="text-xs text-gray-500 truncate">
                          {property.city}, {property.country}
                        </p>
                      </div>
                      <div className="text-sm font-bold text-[#06a84e] flex-shrink-0">
                        ₺{property.price.toLocaleString()}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-4 text-center text-gray-500">
                  No properties found for &ldquo;{query}&rdquo;
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Hero;
