import { useContext, useMemo, useRef } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MdChevronLeft, MdChevronRight } from "react-icons/md";
import HeartBtn from "./HeartBtn";
import CurrencyContext from "../context/CurrencyContext";
import useProperties from "../hooks/useProperties";
import { getOptimizedImageUrl } from "../utils/media";
import { resolveProjectPath } from "../utils/seo";
import { getProjectBadges } from "../utils/projectCardPresentation";

const PROJECT_FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&h=300&fit=crop";

const ALLOWED_BADGE_KEYS = new Set(["citizenship", "specialOffer", "investment"]);
const BADGE_TONE_CLASSES = {
  emerald: "border-emerald-200/80 bg-white/95 text-emerald-700",
  amber: "border-amber-200/80 bg-white/95 text-amber-700",
  sky: "border-sky-200/80 bg-white/95 text-sky-700",
  slate: "border-slate-200/80 bg-white/95 text-slate-700",
  stone: "border-stone-200/80 bg-white/95 text-stone-700",
  rose: "border-rose-200/80 bg-white/95 text-rose-700",
};

const hasSpecialOfferData = (specialOffer) =>
  Boolean(
    specialOffer &&
      (specialOffer.enabled ||
        specialOffer.title ||
        specialOffer.roomType ||
        Number(specialOffer.areaM2 || 0) > 0 ||
        Number(specialOffer.priceGBP || specialOffer.priceUSD || 0) > 0 ||
        Number(specialOffer.downPaymentAmount || 0) > 0 ||
        Number(specialOffer.downPaymentPercent || 0) > 0 ||
        Number(specialOffer.installmentMonths || 0) > 0 ||
        specialOffer.locationLabel ||
        Number(specialOffer.locationMinutes || 0) > 0)
  );

const pickText = (...values) => {
  for (const value of values) {
    if (value === null || value === undefined) continue;
    const normalized = String(value).trim();
    if (normalized) return normalized;
  }
  return "";
};

const HomeProjectCard = ({ property, badges }) => {
  const { t } = useTranslation();
  const projectPath = property.projectPath || resolveProjectPath(property);
  const title = pickText(
    property.projectName,
    property.title,
    property.name,
    property.city,
    property.district,
    "Project"
  );

  return (
    <article
      data-home-project-card
      className="group flex h-full w-[82vw] flex-none snap-start overflow-hidden rounded-[28px] border border-[#e7dece] bg-[linear-gradient(180deg,#ffffff_0%,#fcfaf6_100%)] shadow-[0_22px_60px_-40px_rgba(15,23,42,0.4)] transition duration-300 hover:-translate-y-1 hover:border-[#d8c7aa] hover:shadow-[0_28px_72px_-36px_rgba(15,23,42,0.42)] sm:w-[max(15rem,min(18.75rem,calc((100cqw-5.5rem)/4)))]"
      style={{ scrollSnapAlign: "start", scrollSnapStop: "always" }}
    >
      <Link to={projectPath} className="flex h-full w-full flex-col" aria-label={title}>
        <div className="relative overflow-hidden">
          <div className="relative aspect-[16/10] overflow-hidden">
            <img
              src={getOptimizedImageUrl(property.image, { width: 1200, height: 780 })}
              alt={title}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.06)_0%,rgba(15,23,42,0.14)_34%,rgba(15,23,42,0.72)_100%)]" />
          </div>

          <div className="absolute left-4 top-4 z-10 flex max-w-[78%] flex-wrap gap-2">
            {badges.map((badge) => (
              <span
                key={badge.key}
                className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold tracking-[0.08em] backdrop-blur ${
                  BADGE_TONE_CLASSES[badge.tone] || BADGE_TONE_CLASSES.slate
                }`}
              >
                {t(`localProjects.badges.${badge.key}`)}
              </span>
            ))}
          </div>

          {property.hasSpecialOffer && (
            <div className="pointer-events-none absolute right-[-42px] top-6 z-20 rotate-45 bg-rose-600 px-12 py-1.5 shadow-[0_10px_25px_-12px_rgba(244,63,94,0.85)]">
              <span className="block font-serif text-[11px] font-black italic uppercase tracking-[0.26em] text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.18)]">
                off
              </span>
            </div>
          )}

          <div className="absolute bottom-4 right-4 z-20">
            <HeartBtn
              id={String(property.id)}
              size={18}
              className="rounded-full bg-white/96 p-2.5 shadow-[0_12px_24px_-16px_rgba(15,23,42,0.65)] backdrop-blur"
            />
          </div>
        </div>

        <div className="flex flex-1 items-end p-4 sm:p-5">
          <h3 className="line-clamp-2 text-[1rem] font-semibold leading-snug text-slate-800 sm:text-[1.05rem]">
            {title}
          </h3>
        </div>
      </Link>
    </article>
  );
};

const HomeLocalProjectsSection = ({ properties } = {}) => {
  const { t } = useTranslation();
  const { data, isLoading } = useProperties();
  const { convertAmount, baseCurrency } = useContext(CurrencyContext);
  const trackRef = useRef(null);
  const viewportRef = useRef(null);

  const previewProjects = useMemo(() => {
    const source = Array.isArray(properties) ? properties : data;
    if (!Array.isArray(source)) return [];

    return source
      .filter((property) => property?.propertyType === "local-project")
      .map((property) => {
        const specialOffers = Array.isArray(property?.projeHakkinda?.specialOffers)
          ? property.projeHakkinda.specialOffers.filter((offer) => hasSpecialOfferData(offer))
          : [];
        const legacySpecialOffer = property?.projeHakkinda?.specialOffer || {};
        const hasSpecialOffer = specialOffers.length > 0 || hasSpecialOfferData(legacySpecialOffer);
        const project = {
          ...property,
          image: property?.images?.[0] || property?.image || PROJECT_FALLBACK_IMAGE,
          country: property?.country || "Turkey",
          hasSpecialOffer,
        };
        const badges = getProjectBadges(project, {
          maxBadges: 3,
          convertAmount,
          defaultCurrency: baseCurrency,
        }).filter((badge) => ALLOWED_BADGE_KEYS.has(badge.key));

        return { ...project, badges };
      })
      .filter((project) => project.badges.length > 0);
  }, [data, properties, baseCurrency, convertAmount]);

  const handleScroll = (direction) => {
    const viewport = viewportRef.current;
    const track = trackRef.current;

    if (!viewport || !track) return;

    void viewport.offsetHeight;

    const card = track.querySelector("[data-home-project-card]");
    if (!card) return;

    const cards = track.querySelectorAll("[data-home-project-card]");
    if (!cards || cards.length === 0) return;

    const firstCard = cards[0];
    const cardWidth = firstCard.getBoundingClientRect().width;
    const computedGap =
      parseFloat(window.getComputedStyle(track).columnGap?.replace("px", "") || "0") || 0;
    const gap = computedGap || 16;
    const viewportWidth = viewport.clientWidth;
    const isMobile = viewportWidth < 768;
    const currentScroll = viewport.scrollLeft;
    const maxScroll = viewport.scrollWidth - viewport.clientWidth;

    if (maxScroll <= 0) return;

    let target;
    if (isMobile) {
      const scrollAmount = cardWidth + gap;
      const currentCardIndex = Math.round(currentScroll / scrollAmount);

      if (direction === -1) {
        target = Math.max(0, (currentCardIndex - 1) * scrollAmount);
      } else {
        target = Math.min(maxScroll, (currentCardIndex + 1) * scrollAmount);
      }
    } else {
      const scrollAmount = (cardWidth + gap) * 1.5;
      if (direction === -1) {
        target = Math.max(0, currentScroll - scrollAmount);
      } else {
        target = Math.min(maxScroll, currentScroll + scrollAmount);
      }
    }

    viewport.scrollTo({
      left: target,
      behavior: "smooth",
    });
  };

  const canScroll = previewProjects.length > 4;

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#fdfcf9] via-[#f8f6f1] to-[#fdfcf9] py-16 sm:py-20">
      <div className="pointer-events-none absolute left-1/2 top-10 h-44 w-44 -translate-x-1/2 rounded-full bg-emerald-100/50 blur-3xl" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-200/80 to-transparent" />

      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        {isLoading ? (
          <div className="flex gap-4 overflow-hidden px-2 [container-type:inline-size]">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-[420px] w-[82vw] flex-none animate-pulse overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm sm:w-[max(15rem,min(18.75rem,calc((100cqw-5.5rem)/4)))]"
              >
                <div className="h-[65%] bg-slate-200" />
                <div className="space-y-3 p-5">
                  <div className="h-4 w-4/5 rounded bg-slate-200" />
                  <div className="h-10 rounded-2xl bg-slate-200" />
                </div>
              </div>
            ))}
          </div>
        ) : previewProjects.length > 0 ? (
          <>
            <div className="relative">
              {canScroll && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleScroll(-1);
                    }}
                    className="absolute -left-3 top-1/2 z-30 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-md transition hover:bg-gray-100"
                    aria-label="Scroll left"
                  >
                    <MdChevronLeft size={22} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleScroll(1);
                    }}
                    className="absolute -right-3 top-1/2 z-30 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-md transition hover:bg-gray-100"
                    aria-label="Scroll right"
                  >
                    <MdChevronRight size={22} />
                  </button>
                </>
              )}

              <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-[#fdfcf9] via-[#fdfcf9]/80 to-transparent sm:w-12" />
              <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-[#fdfcf9] via-[#fdfcf9]/80 to-transparent sm:w-12" />

              <div
                ref={viewportRef}
                className="overflow-x-auto overflow-y-hidden pb-2 scroll-smooth scrollbar-hide w-full snap-x snap-mandatory px-2 [container-type:inline-size]"
                style={{
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                  WebkitOverflowScrolling: "touch",
                  scrollBehavior: "smooth",
                  scrollSnapType: "x mandatory",
                }}
              >
                <div
                  ref={trackRef}
                  className="flex gap-4 sm:gap-6"
                  style={{ width: "max-content", minWidth: "100%" }}
                >
                  {previewProjects.map((project) => (
                    <HomeProjectCard
                      key={project.id}
                      property={project}
                      badges={project.badges}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-center">
              <Link
                to="/projects"
                className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-7 py-3 text-sm font-semibold text-white shadow-[0_14px_28px_-16px_rgba(5,150,105,0.9)] transition hover:bg-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2"
              >
                {t("localProjects.showMoreProjectsButton")}
              </Link>
            </div>
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 px-6 py-16 text-center text-slate-500">
            {t("properties.noProperties")}
          </div>
        )}
      </div>
    </section>
  );
};

HomeLocalProjectsSection.propTypes = {
  properties: PropTypes.array,
};

export default HomeLocalProjectsSection;
