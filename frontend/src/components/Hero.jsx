import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import heroBg from "../assets/img1.png";
import heroCyprus from "../assets/hero/Cyprus.jpg";
import heroDubai from "../assets/hero/Dubai.jpg";
import heroGeorgia from "../assets/hero/Georgia.jpg";
import heroGreece from "../assets/hero/greece.jpg";
import heroIstanbul from "../assets/hero/Istanbul.jpg";
import iconIstanbul from "../assets/icons/istanbul.png";
import iconGreece from "../assets/icons/Greece.png";
import iconDubai from "../assets/icons/dubai.png";
import iconGeorgia from "../assets/icons/boat.png";
import iconCyprus from "../assets/icons/cyprus.png";
import HeroDownloadModal from "./HeroDownloadModal";

const ALL_SLIDE_INTERVAL_MS = 10000;
const ALL_SLIDE_TRANSITION_MS = 900;

const ALL_HERO_SLIDES = [
  {
    type: "video",
    src: "/citizen.mp4",
    alt: "HB International featured property film",
    showContent: false,
    showDownloadButton: true,
  },
  {
    type: "image",
    src: heroBg,
    alt: "HB International featured residence",
    showContent: true,
    showDownloadButton: false,
  },
  // Add new slides here, for example: { src: "/new-slide.jpg", alt: "New slide" },
];

const Hero = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("ALL");
  const [activeAllSlideIndex, setActiveAllSlideIndex] = useState(0);
  const [nextAllSlideIndex, setNextAllSlideIndex] = useState(null);
  const [isAllSlidesAnimating, setIsAllSlidesAnimating] = useState(false);
  const [allSlideDirection, setAllSlideDirection] = useState("next");
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

  useEffect(() => {
    if (
      activeTab !== "ALL" ||
      ALL_HERO_SLIDES.length <= 1 ||
      isAllSlidesAnimating ||
      isDownloadModalOpen
    ) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setAllSlideDirection("next");
      setNextAllSlideIndex(
        (activeAllSlideIndex + 1) % ALL_HERO_SLIDES.length
      );
      setIsAllSlidesAnimating(true);
    }, ALL_SLIDE_INTERVAL_MS);

    return () => window.clearTimeout(timeoutId);
  }, [activeAllSlideIndex, activeTab, isAllSlidesAnimating, isDownloadModalOpen]);

  useEffect(() => {
    if (!isAllSlidesAnimating || nextAllSlideIndex === null) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setActiveAllSlideIndex(nextAllSlideIndex);
      setNextAllSlideIndex(null);
      setIsAllSlidesAnimating(false);
    }, ALL_SLIDE_TRANSITION_MS);

    return () => window.clearTimeout(timeoutId);
  }, [isAllSlidesAnimating, nextAllSlideIndex]);

  const heroImages = {
    ISTANBUL: heroIstanbul,
    GREECE: heroGreece,
    DUBAI: heroDubai,
    GEORGIA: heroGeorgia,
    CYPRUS: heroCyprus,
  };
  const visibleAllSlideIndex =
    nextAllSlideIndex !== null ? nextAllSlideIndex : activeAllSlideIndex;
  const activeHeroMedia =
    activeTab === "ALL"
      ? ALL_HERO_SLIDES[visibleAllSlideIndex]
      : {
          src: heroImages[activeTab] || heroBg,
          alt: `${activeTab} hero background`,
          showContent: true,
          showDownloadButton: false,
        };
  const shouldShowHeroContent =
    activeTab === "ALL"
      ? !isAllSlidesAnimating && activeHeroMedia.showContent
      : activeHeroMedia.showContent;
  const shouldShowDownloadButton =
    activeTab === "ALL" &&
    !isAllSlidesAnimating &&
    activeHeroMedia.showDownloadButton;
  const locationTabs = [
    {
      label: "ALL",
      icon: (
        <svg
          viewBox="0 0 24 24"
          className="h-8 w-8 sm:h-9 sm:w-9"
          aria-hidden="true"
        >
          <circle
            cx="10"
            cy="10"
            r="6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
          />
          <path
            d="M15 15l5 5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
    {
      label: "ISTANBUL",
      icon: (
        <img
          src={iconIstanbul}
          alt=""
          aria-hidden="true"
          className="h-8 w-8 sm:h-9 sm:w-9 object-contain"
        />
      ),
    },
    {
      label: "GREECE",
      icon: (
        <img
          src={iconGreece}
          alt=""
          aria-hidden="true"
          className="h-8 w-8 sm:h-9 sm:w-9 object-contain"
        />
      ),
    },
    {
      label: "DUBAI",
      icon: (
        <img
          src={iconDubai}
          alt=""
          aria-hidden="true"
          className="h-8 w-8 sm:h-9 sm:w-9 object-contain"
        />
      ),
    },
    {
      label: "GEORGIA",
      icon: (
        <img
          src={iconGeorgia}
          alt=""
          aria-hidden="true"
          className="h-8 w-8 sm:h-9 sm:w-9 object-contain"
        />
      ),
    },
    {
      label: "CYPRUS",
      icon: (
        <img
          src={iconCyprus}
          alt=""
          aria-hidden="true"
          className="h-8 w-8 sm:h-9 sm:w-9 object-contain"
        />
      ),
    },
  ];

  const handleTabClick = (label) => {
    setActiveTab(label);
    setNextAllSlideIndex(null);
    setIsAllSlidesAnimating(false);
    setAllSlideDirection("next");
    if (label === "ALL") {
      setActiveAllSlideIndex(0);
    }
  };

  const handlePreviousSlide = () => {
    if (
      activeTab !== "ALL" ||
      ALL_HERO_SLIDES.length <= 1 ||
      isAllSlidesAnimating ||
      isDownloadModalOpen
    ) {
      return;
    }

    setAllSlideDirection("prev");
    setNextAllSlideIndex(
      (activeAllSlideIndex - 1 + ALL_HERO_SLIDES.length) %
        ALL_HERO_SLIDES.length
    );
    setIsAllSlidesAnimating(true);
  };

  const handleNextSlide = () => {
    if (
      activeTab !== "ALL" ||
      ALL_HERO_SLIDES.length <= 1 ||
      isAllSlidesAnimating ||
      isDownloadModalOpen
    ) {
      return;
    }

    setAllSlideDirection("next");
    setNextAllSlideIndex(
      (activeAllSlideIndex + 1) % ALL_HERO_SLIDES.length
    );
    setIsAllSlidesAnimating(true);
  };

  const handleDownloadClick = () => {
    setIsDownloadModalOpen(true);
  };

  const renderSlideMedia = (slide, className) => {
    if (slide.type === "video") {
      return (
        <video
          key={slide.src}
          className={className}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
        >
          <source src={slide.src} type="video/mp4" />
        </video>
      );
    }

    return (
      <img
        key={slide.src}
        src={slide.src}
        alt={slide.alt}
        loading="eager"
        decoding="async"
        fetchpriority="high"
        className={className}
      />
    );
  };

  return (
    <section className="relative h-[520px] sm:h-[600px] md:h-[720px] overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        {activeTab === "ALL" ? (
          <>
            {renderSlideMedia(
              ALL_HERO_SLIDES[activeAllSlideIndex],
              `absolute inset-0 h-full w-full object-cover object-center hero-bg ${
                isAllSlidesAnimating
                  ? allSlideDirection === "next"
                    ? "animate-hero-slide-out-left"
                    : "animate-hero-slide-out-right"
                  : ""
              }`
            )}
            {nextAllSlideIndex !== null && (
              renderSlideMedia(
                ALL_HERO_SLIDES[nextAllSlideIndex],
                `absolute inset-0 h-full w-full object-cover object-center hero-bg ${
                  allSlideDirection === "next"
                    ? "animate-hero-slide-in-right"
                    : "animate-hero-slide-in-left"
                }`
              )
            )}
          </>
        ) : (
          <img
            key={activeTab}
            src={activeHeroMedia.src}
            alt={activeHeroMedia.alt}
            loading="eager"
            decoding="async"
            fetchpriority="high"
            className="h-full w-full object-cover object-center hero-bg"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f172a]/55 via-[#0f172a]/25 to-[#0f172a]/60" />
      </div>

      {/* Content */}
      {shouldShowHeroContent && (
        <div
          key={activeTab === "ALL" ? `content-${activeAllSlideIndex}` : `content-${activeTab}`}
          className="relative max-w-[1100px] mx-auto h-full px-6 sm:px-10 flex flex-col items-center justify-center text-white text-center gap-4 animate-hero-fade"
        >
          <h1 className="text-[36px] sm:text-[48px] md:text-[64px] font-semibold leading-tight italic">
            {t("hero.title")}
          </h1>
          <p className="text-lg sm:text-xl text-white/90 italic">
            {t("hero.subtitle")}
          </p>
        </div>
      )}

      {shouldShowDownloadButton && (
        <div className="pointer-events-none absolute inset-x-0 bottom-[92px] z-10 flex justify-center px-6 sm:bottom-[108px]">
          <button
            type="button"
            onClick={handleDownloadClick}
            className="hero-download-button pointer-events-auto inline-flex h-[54px] min-w-[230px] items-center justify-center rounded-[10px] border border-[#7e1716] px-8 text-[16px] font-extrabold uppercase tracking-[0.04em] text-white transition hover:bg-[#8e1d1a] animate-hero-fade"
          >
            {t("hero.downloadNow", { defaultValue: "Download Now" })}
          </button>
        </div>
      )}

      {activeTab === "ALL" && ALL_HERO_SLIDES.length > 1 && (
        <div className="pointer-events-none absolute inset-x-0 top-1/2 z-10 flex -translate-y-1/2 items-center justify-between px-4 sm:px-8">
          <button
            type="button"
            onClick={handlePreviousSlide}
            className="pointer-events-auto inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-black/25 text-white backdrop-blur-sm transition hover:bg-black/40"
            aria-label="Previous slide"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={handleNextSlide}
            className="pointer-events-auto inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-black/25 text-white backdrop-blur-sm transition hover:bg-black/40"
            aria-label="Next slide"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      )}

      {/* Location Tabs */}
      <div className="absolute inset-x-0 bottom-0">
        <div className="max-w-[1100px] mx-auto px-6 sm:px-10">
          <div className="overflow-hidden">
            <div className="flex justify-center">
              <div className="flex w-full sm:inline-flex sm:w-auto flex-nowrap bg-[#8b1c1c] shadow-[0_18px_40px_rgba(120,22,22,0.35)]">
                {locationTabs.map((item, index) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => handleTabClick(item.label)}
                    className={`flex flex-1 sm:flex-none min-w-0 flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-[11px] sm:text-base font-semibold tracking-normal sm:tracking-wide uppercase leading-tight transition
                      ${
                        activeTab === item.label
                          ? "bg-white text-[#8b1c1c]"
                          : "text-white hover:bg-white/10"
                      } ${index === locationTabs.length - 1 ? "" : "border-r border-white/10"}`}
                    aria-current={activeTab === item.label ? "true" : "false"}
                  >
                    <span
                      className={`${
                        activeTab === item.label
                          ? "text-[#8b1c1c]"
                          : "text-white"
                      }`}
                    >
                      {item.icon}
                    </span>
                    <span className="w-full truncate text-center sm:w-auto sm:text-left">
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <HeroDownloadModal
        opened={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
      />
    </section>
  );
};

export default Hero;
