import PropertyGridCard from "./PropertyGridCard";
import { Link } from "react-router-dom";
import useProperties from "../hooks/useProperties";
import { useEffect, useState, useRef } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";

// Animated Card wrapper with IntersectionObserver
const AnimatedCard = ({ children, delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [delay]);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        isVisible 
          ? 'opacity-100 translate-y-0 scale-100 blur-0' 
          : 'opacity-0 translate-y-6 scale-95 blur-sm'
      }`}
    >
      {children}
    </div>
  );
};

AnimatedCard.propTypes = {
  children: PropTypes.node.isRequired,
  delay: PropTypes.number,
};

const Properties = () => {
  const { t } = useTranslation();
  const { data, isError, isLoading } = useProperties();
  const [headerVisible, setHeaderVisible] = useState(false);
  const headerRef = useRef(null);

  useEffect(() => {
    const headerEl = headerRef.current;
    if (!headerEl) return;

    const isInViewport = () => {
      const rect = headerEl.getBoundingClientRect();
      return rect.top < window.innerHeight && rect.bottom > 0;
    };

    // Fallback for browsers that don't fire the observer immediately
    if (isInViewport()) {
      setHeaderVisible(true);
      return;
    }

    if (!("IntersectionObserver" in window)) {
      setHeaderVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHeaderVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(headerEl);

    return () => observer.disconnect();
  }, []);

  if (isError) {
    return (
      <div className="max-padd-container py-16">
        <span className="text-red-500">{t("listing.errorFetching")}</span>
      </div>
    );
  }

  if (isLoading) {
    return (
      <section className="relative py-20 xl:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white via-slate-50 to-white" />
        <div className="max-padd-container relative z-10">
          {/* Loading Header */}
          <div className="text-center mb-14">
            <div className="h-8 w-48 bg-gray-200 rounded-full mx-auto mb-4 animate-pulse" />
            <div className="h-12 w-80 bg-gray-200 rounded-lg mx-auto mb-4 animate-pulse" />
            <div className="h-4 w-64 bg-gray-200 rounded mx-auto animate-pulse" />
          </div>
          {/* Loading Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl overflow-hidden animate-pulse shadow-sm border border-gray-100">
                <div className="h-[140px] bg-gray-200" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                  <div className="h-3 bg-gray-200 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section 
      className="relative py-20 xl:py-28 overflow-hidden"
    >
      {/* Background - Clean White with subtle tint */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-slate-50 to-white" />
      
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />
      
      <div className="max-padd-container relative z-10">
        {/* Section Header */}
        <div 
          ref={headerRef}
          className={`text-center mb-14 transition-all duration-1000 ${headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
        >
          <span className="inline-block px-4 py-1.5 bg-emerald-500 text-white text-sm font-medium rounded-full mb-4 shadow-md">
            {t("properties.futureHomeAwaits")}
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800 mb-4">
            {t("properties.findDreamHere")}
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            {t("properties.subtitle")}
          </p>
        </div>

        {/* Properties Grid - Exclude projects (they have their own pages) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.isArray(data) && data
            .filter(property => property.propertyType !== "local-project" && property.propertyType !== "international-project")
            .slice(0, 12)
            .map((property, index) => (
              <AnimatedCard key={property.id} delay={index * 100}>
                <PropertyGridCard property={property} />
              </AnimatedCard>
            ))}
        </div>

        {/* View More Button */}
        <AnimatedCard delay={800}>
          <div className="flex justify-center mt-14">
            <Link
              to="/listing"
              className="group relative px-8 py-3.5 bg-emerald-500 text-white font-medium rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/25"
            >
              <span className="relative z-10 flex items-center gap-2">
                {t("properties.viewAll")}
                <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </Link>
          </div>
        </AnimatedCard>
      </div>
    </section>
  );
};

export default Properties;
