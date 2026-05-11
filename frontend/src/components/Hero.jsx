import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth0 } from "@auth0/auth0-react";
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
import useAuthCheck from "../hooks/useAuthCheck";
import { getLocalizedAlt } from "../utils/mediaAlt";
import { requestLiveStream } from "../utils/liveStream";
import {
  buildCurrentReturnTo,
  getPostLoginResume,
  POST_LOGIN_AUTH_COMPLETE_EVENT,
  savePostLoginResume,
} from "../utils/postLoginResume";

const MOBILE_BREAKPOINT_QUERY = "(max-width: 639px)";
const MOBILE_SLIDE_INTERVAL_MS = 6000;
const DESKTOP_SLIDE_INTERVAL_MS = 6500;
const ALL_SLIDE_TRANSITION_MS = 900;
const HERO_GUIDE_VIDEO_SOURCE = "/citizen.mp4";
const HERO_SERVICES_VIDEO_SOURCE = "/final.mp4";
const HERO_REELS_VIDEO_SOURCE = "/reels2.mp4";
const HERO_VIDEO_SOURCES = [
  HERO_GUIDE_VIDEO_SOURCE,
  HERO_SERVICES_VIDEO_SOURCE,
  HERO_REELS_VIDEO_SOURCE,
];
const HERO_VIDEO_POSTER = heroBg;
const HERO_SERVICES_CTA_LABEL = "HB RealstateServices";

const ALL_HERO_SLIDES = [
  {
    type: "video",
    src: HERO_GUIDE_VIDEO_SOURCE,
    altKey: "featuredPropertyFilm",
    showContent: false,
    showDownloadButton: true,
    showServicesButton: false,
    showReelsButton: false,
  },
  {
    type: "video",
    src: HERO_SERVICES_VIDEO_SOURCE,
    altKey: "featuredPropertyFilm",
    showContent: false,
    showDownloadButton: false,
    showServicesButton: true,
    showReelsButton: false,
  },
  {
    type: "video",
    src: HERO_REELS_VIDEO_SOURCE,
    altKey: "featuredPropertyFilm",
    showContent: false,
    showDownloadButton: false,
    showServicesButton: false,
    showReelsButton: true,
  },
  {
    type: "image",
    src: heroBg,
    altKey: "featuredResidence",
    showContent: true,
    showDownloadButton: false,
    showServicesButton: false,
    showReelsButton: false,
  },
  // Add new slides here, for example: { src: "/new-slide.jpg", alt: "New slide" },
];

const HERO_LOCATION_IMAGES = {
  ISTANBUL: heroIstanbul,
  GREECE: heroGreece,
  DUBAI: heroDubai,
  GEORGIA: heroGeorgia,
  CYPRUS: heroCyprus,
};

const HERO_PRELOAD_IMAGE_SOURCES = [
  heroBg,
  ...Object.values(HERO_LOCATION_IMAGES),
];

const preloadHeroImage = (src, fetchPriority = "auto") => {
  const image = new Image();
  image.loading = "eager";
  image.decoding = fetchPriority === "high" ? "sync" : "async";

  if ("fetchPriority" in image) {
    image.fetchPriority = fetchPriority;
  }

  image.src = src;
  return image;
};

const appendPreloadLink = ({ href, as, type, fetchPriority = "auto" }) => {
  const link = document.createElement("link");
  link.rel = "preload";
  link.as = as;
  link.href = href;

  if (type) {
    link.type = type;
  }

  if ("fetchPriority" in link) {
    link.fetchPriority = fetchPriority;
  }

  document.head.appendChild(link);

  return () => {
    if (link.parentNode) {
      link.parentNode.removeChild(link);
    }
  };
};

const Hero = () => {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState("ALL");
  const [activeAllSlideIndex, setActiveAllSlideIndex] = useState(0);
  const [nextAllSlideIndex, setNextAllSlideIndex] = useState(null);
  const [isAllSlidesAnimating, setIsAllSlidesAnimating] = useState(false);
  const [allSlideDirection, setAllSlideDirection] = useState("next");
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [readyVideoSources, setReadyVideoSources] = useState(() => new Set());
  const { isAuthenticated, isLoading } = useAuth0();
  const { validateLogin } = useAuthCheck();

  const allHeroSlides = ALL_HERO_SLIDES.map((slide) => ({
    ...slide,
    alt: getLocalizedAlt(i18n.language, slide.altKey),
  }));

  useEffect(() => {
    const preloadedImages = HERO_PRELOAD_IMAGE_SOURCES.map((src, index) =>
      preloadHeroImage(src, index === 0 ? "high" : "auto")
    );
    const cleanupVideoPreloads = HERO_VIDEO_SOURCES.map((href, index) =>
      appendPreloadLink({
        href,
        as: "video",
        type: "video/mp4",
        fetchPriority: index === 0 ? "high" : "auto",
      })
    );

    return () => {
      preloadedImages.length = 0;
      cleanupVideoPreloads.forEach((cleanup) => cleanup());
    };
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_BREAKPOINT_QUERY);
    const syncViewport = (event) => {
      setIsMobileViewport(event.matches);
    };

    setIsMobileViewport(mediaQuery.matches);

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", syncViewport);
      return () => mediaQuery.removeEventListener("change", syncViewport);
    }

    mediaQuery.addListener(syncViewport);
    return () => mediaQuery.removeListener(syncViewport);
  }, []);

  const allSlideIntervalMs = isMobileViewport
    ? MOBILE_SLIDE_INTERVAL_MS
    : DESKTOP_SLIDE_INTERVAL_MS;

  useEffect(() => {
    if (
      activeTab !== "ALL" ||
      allHeroSlides.length <= 1 ||
      isAllSlidesAnimating ||
      isDownloadModalOpen
    ) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setAllSlideDirection("next");
      setNextAllSlideIndex(
        (activeAllSlideIndex + 1) % allHeroSlides.length
      );
      setIsAllSlidesAnimating(true);
    }, allSlideIntervalMs);

    return () => window.clearTimeout(timeoutId);
  }, [
    activeAllSlideIndex,
    activeTab,
    allSlideIntervalMs,
    allHeroSlides.length,
    isAllSlidesAnimating,
    isDownloadModalOpen,
  ]);

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

  const markVideoReady = (src) => {
    setReadyVideoSources((currentSources) => {
      if (currentSources.has(src)) {
        return currentSources;
      }

      const nextSources = new Set(currentSources);
      nextSources.add(src);
      return nextSources;
    });
  };

  const visibleAllSlideIndex =
    nextAllSlideIndex !== null ? nextAllSlideIndex : activeAllSlideIndex;
  const activeHeroMedia =
    activeTab === "ALL"
      ? allHeroSlides[visibleAllSlideIndex]
      : {
          src: HERO_LOCATION_IMAGES[activeTab] || heroBg,
          alt: getLocalizedAlt(i18n.language, "locationHero", {
            location: activeTab,
          }),
          showContent: true,
          showDownloadButton: false,
          showServicesButton: false,
          showReelsButton: false,
        };
  const shouldShowHeroContent =
    activeTab === "ALL"
      ? !isAllSlidesAnimating && activeHeroMedia.showContent
      : activeHeroMedia.showContent;
  const shouldShowDownloadButton =
    activeTab === "ALL" &&
    !isAllSlidesAnimating &&
    activeHeroMedia.showDownloadButton;
  const shouldShowServicesButton =
    activeTab === "ALL" &&
    !isAllSlidesAnimating &&
    activeHeroMedia.showServicesButton;
  const shouldShowReelsButton =
    activeTab === "ALL" &&
    !isAllSlidesAnimating &&
    activeHeroMedia.showReelsButton;
  const activeHeroLocationKey = activeTab === "ALL" ? "ISTANBUL" : activeTab;
  const heroHeading = t(`hero.locationTitles.${activeHeroLocationKey}`, {
    defaultValue: t("hero.h1", {
      defaultValue: "Property for Sale in Istanbul",
    }),
  });
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
      allHeroSlides.length <= 1 ||
      isAllSlidesAnimating ||
      isDownloadModalOpen
    ) {
      return;
    }

    setAllSlideDirection("prev");
    setNextAllSlideIndex(
      (activeAllSlideIndex - 1 + allHeroSlides.length) %
        allHeroSlides.length
    );
    setIsAllSlidesAnimating(true);
  };

  const handleNextSlide = () => {
    if (
      activeTab !== "ALL" ||
      allHeroSlides.length <= 1 ||
      isAllSlidesAnimating ||
      isDownloadModalOpen
    ) {
      return;
    }

    setAllSlideDirection("next");
    setNextAllSlideIndex(
      (activeAllSlideIndex + 1) % allHeroSlides.length
    );
    setIsAllSlidesAnimating(true);
  };

  const handleDownloadClick = () => {
    if (isLoading || !isAuthenticated) {
      setIsDownloadModalOpen(false);
      savePostLoginResume({
        type: "hero-download",
        returnTo: buildCurrentReturnTo(),
      });
      validateLogin({ openModal: true });
      return;
    }

    setIsDownloadModalOpen(true);
  };

  const handleWatchReelsClick = () => {
    requestLiveStream({ source: "hero-reels-slide" });
  };

  useEffect(() => {
    const handlePostLoginComplete = () => {
      if (isLoading || !isAuthenticated) return;

      const resumeState = getPostLoginResume();
      if (
        resumeState?.type === "hero-download" &&
        resumeState?.returnTo === buildCurrentReturnTo()
      ) {
        setIsDownloadModalOpen(true);
      }
    };

    window.addEventListener(
      POST_LOGIN_AUTH_COMPLETE_EVENT,
      handlePostLoginComplete
    );

    return () => {
      window.removeEventListener(
        POST_LOGIN_AUTH_COMPLETE_EVENT,
        handlePostLoginComplete
      );
    };
  }, [isAuthenticated, isLoading]);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsDownloadModalOpen(false);
    }
  }, [isAuthenticated]);

  const renderSlideMedia = (slide, className) => {
    if (slide.type === "video") {
      const isVideoReady = readyVideoSources.has(slide.src);

      return (
        <div
          key={slide.src}
          className={`${className} overflow-hidden bg-[radial-gradient(circle_at_center,rgba(165,28,28,0.26)_0%,rgba(40,7,7,0.92)_52%,rgba(9,11,17,1)_100%)]`}
        >
          {!isVideoReady && (
            <img
              src={HERO_VIDEO_POSTER}
              alt=""
              aria-hidden="true"
              loading="eager"
              decoding="sync"
              fetchPriority="high"
              className="absolute inset-0 h-full w-full object-cover object-center hero-bg"
            />
          )}
          <video
            className={`absolute inset-0 h-full w-full scale-[1.14] object-contain object-center transition-opacity duration-300 sm:scale-100 sm:object-cover ${
              isVideoReady ? "opacity-100" : "opacity-0"
            }`}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            poster={HERO_VIDEO_POSTER}
            onLoadedData={() => markVideoReady(slide.src)}
            onCanPlay={() => markVideoReady(slide.src)}
            aria-hidden="true"
          >
            <source src={slide.src} type="video/mp4" />
          </video>
        </div>
      );
    }

    return (
      <img
        key={slide.src}
        src={slide.src}
        alt={slide.alt}
        loading="eager"
        decoding="sync"
        fetchPriority="high"
        className={className}
      />
    );
  };

  return (
    <section className="relative h-[360px] min-[430px]:h-[410px] sm:h-[600px] md:h-[720px] overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        {activeTab === "ALL" ? (
          <>
            {renderSlideMedia(
              allHeroSlides[activeAllSlideIndex],
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
                allHeroSlides[nextAllSlideIndex],
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
            decoding="sync"
            fetchPriority="high"
            className="h-full w-full object-cover object-center hero-bg"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f172a]/55 via-[#0f172a]/25 to-[#0f172a]/60" />
      </div>

      {/* Content */}
      {shouldShowHeroContent && (
        <div
          key={activeTab === "ALL" ? `content-${activeAllSlideIndex}` : `content-${activeTab}`}
          className="relative w-full max-w-[1400px] mx-auto h-full px-6 sm:px-10 flex flex-col items-center justify-center text-white text-center gap-4 animate-hero-fade"
        >
          <h1 className="text-[clamp(1.2rem,4.6vw,4rem)] font-semibold leading-none italic whitespace-nowrap tracking-[-0.03em]">
            {heroHeading}
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
            className="hero-download-button pointer-events-auto inline-flex h-[44px] min-w-[170px] items-center justify-center rounded-[10px] border border-[#7e1716] px-5 text-[13px] font-extrabold uppercase tracking-[0.03em] text-white transition hover:bg-[#8e1d1a] animate-hero-fade sm:h-[54px] sm:min-w-[230px] sm:px-8 sm:text-[16px] sm:tracking-[0.04em]"
          >
            {t("hero.downloadNow", { defaultValue: "Download Now" })}
          </button>
        </div>
      )}

      {shouldShowServicesButton && (
        <div className="pointer-events-none absolute inset-x-0 bottom-[92px] z-10 flex justify-center px-6 sm:bottom-[112px]">
          <Link
            to="/services"
            aria-label="Open services page"
            className="hero-services-button pointer-events-auto inline-flex min-h-[44px] items-center justify-center rounded-[10px] px-4 py-2 text-[13px] font-extrabold text-white transition duration-300 hover:-translate-y-0.5 hover:brightness-110 sm:min-h-[60px] sm:px-8 sm:py-3 sm:text-[18px]"
          >
            <span className="hero-services-button__label">
              {HERO_SERVICES_CTA_LABEL}
            </span>
          </Link>
        </div>
      )}

      {shouldShowReelsButton && (
        <div className="pointer-events-none absolute inset-x-0 bottom-[92px] z-10 flex justify-center px-6 sm:bottom-[108px]">
          <button
            type="button"
            onClick={handleWatchReelsClick}
            className="pointer-events-auto inline-flex h-[44px] min-w-[170px] items-center justify-center gap-2.5 rounded-[10px] bg-[#e5bd58] px-5 text-[13px] font-extrabold uppercase tracking-[0.03em] text-black shadow-[0_10px_30px_rgba(229,189,88,0.35)] transition hover:bg-[#f0cf79] animate-hero-fade sm:h-[54px] sm:min-w-[230px] sm:px-8 sm:text-[16px] sm:tracking-[0.04em]"
          >
            <span className="relative flex size-2.5 shrink-0" aria-hidden="true">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-500 opacity-70" />
              <span className="relative inline-flex size-2.5 rounded-full bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.85)]" />
            </span>
            {t("reels.watch", { defaultValue: "Watch Reels" })}
          </button>
        </div>
      )}

      {activeTab === "ALL" && allHeroSlides.length > 1 && (
        <div className="pointer-events-none absolute inset-x-0 top-1/2 z-10 flex -translate-y-1/2 items-center justify-between px-4 sm:px-8">
          <button
            type="button"
            onClick={handlePreviousSlide}
            className="pointer-events-auto inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-black/25 text-white backdrop-blur-sm transition hover:bg-black/40 sm:h-11 sm:w-11"
            aria-label="Previous slide"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5 sm:h-6 sm:w-6"
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
            className="pointer-events-auto inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-black/25 text-white backdrop-blur-sm transition hover:bg-black/40 sm:h-11 sm:w-11"
            aria-label="Next slide"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5 sm:h-6 sm:w-6"
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
