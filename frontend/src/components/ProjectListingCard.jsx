import { useContext } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PropTypes from "prop-types";
import {
  FaArrowRightLong,
  FaCalendarCheck,
  FaPhone,
  FaWhatsapp,
} from "react-icons/fa6";
import { MdLocationOn, MdOutlineApartment, MdOutlineSell } from "react-icons/md";
import CurrencyContext from "../context/CurrencyContext";
import { PRIMARY_CONTACT_PHONE } from "../constant/data";
import { normalizeWhatsAppNumber } from "../utils/common";
import { getOptimizedImageUrl } from "../utils/media";
import {
  buildProjectWhatsAppMessage,
  getProjectAreaLabel,
  getProjectBadges,
  getProjectBenefitLine,
  getProjectLocationLabel,
  getProjectPrimaryCTA,
  getProjectPricePresentation,
  getProjectRoomMixLabel,
  getProjectSecondaryCTA,
  getProjectSupportItems,
} from "../utils/projectCardPresentation";
import HeartBtn from "./HeartBtn";
import PhoneLink from "./PhoneLink";

const BADGE_TONE_CLASSES = {
  emerald: "border-emerald-200/60 bg-white/90 text-emerald-700",
  amber: "border-amber-200/60 bg-white/90 text-amber-700",
  sky: "border-sky-200/60 bg-white/90 text-sky-700",
  slate: "border-slate-200/60 bg-white/90 text-slate-700",
  stone: "border-stone-200/60 bg-white/90 text-stone-700",
  rose: "border-rose-200/60 bg-white/90 text-rose-700",
};

const SUPPORT_ICON_MAP = {
  delivery: FaCalendarCheck,
  installment: MdOutlineSell,
  deed: MdOutlineSell,
  "deed-ready": MdOutlineSell,
  investment: MdOutlineApartment,
};

const ProjectListingCard = ({ project, compact = false }) => {
  const { t, i18n } = useTranslation();
  const { selectedCurrency, baseCurrency, rates, convertAmount, formatMoney } =
    useContext(CurrencyContext);

  const displayCurrency =
    selectedCurrency && (selectedCurrency === baseCurrency || rates?.[selectedCurrency])
      ? selectedCurrency
      : baseCurrency;

  const locationLabel = getProjectLocationLabel(project);
  const roomMixLabel = getProjectRoomMixLabel(project);
  const areaLabel = getProjectAreaLabel(project, t);
  const badges = getProjectBadges(project, {
    maxBadges: 2,
    convertAmount,
    defaultCurrency: baseCurrency,
  });
  const supportItems = getProjectSupportItems(project, { t });
  const pricePresentation = getProjectPricePresentation(project, {
    t,
    language: i18n.language,
    convertAmount,
    formatMoney,
    displayCurrency,
    defaultCurrency: baseCurrency,
  });
  const primaryCta = getProjectPrimaryCTA(project, { t });
  const fallbackPhone = project?.consultant?.phone || project?.phone || PRIMARY_CONTACT_PHONE;
  const whatsappNumber = normalizeWhatsAppNumber(
    project?.consultant?.whatsapp || project?.consultant?.phone || project?.phone || PRIMARY_CONTACT_PHONE
  );
  const secondaryCta = getProjectSecondaryCTA(project, {
    t,
    pricePresentation,
    hasWhatsApp: Boolean(whatsappNumber),
    convertAmount,
    defaultCurrency: baseCurrency,
  });
  const projectPath =
    project?.projectPath ||
    (project?.id ? `/projects/${encodeURIComponent(`project-${project.id}`)}` : "/projects");
  const projectTitle =
    project?.title ||
    project?.name ||
    t("localProjects.projectFallbackTitle", { defaultValue: "Project" });

  const whatsappHref = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
        buildProjectWhatsAppMessage(project, { t })
      )}`
    : "";

  const priceBoxClasses = pricePresentation.hasVisiblePrice
    ? "border-[#ecdfcb]/80 bg-[linear-gradient(180deg,#fffaf2_0%,#fdf7ee_100%)]"
    : "border-[#dbe6e1]/80 bg-[linear-gradient(180deg,#f8fbfa_0%,#f2f7f5_100%)]";
  const priceValueClasses = pricePresentation.hasVisiblePrice
    ? "text-[1.55rem] text-slate-900 sm:text-[1.65rem]"
    : "text-[1.05rem] text-slate-900 sm:text-[1.12rem]";

  return (
    <article
      className="group flex h-full flex-col overflow-hidden rounded-[28px] border border-[#e8decd]/90 bg-[linear-gradient(180deg,#ffffff_0%,#fbf8f2_100%)] shadow-[0_16px_48px_-32px_rgba(15,23,42,0.35)] transition duration-300 hover:-translate-y-0.5 hover:border-[#dac9ad] hover:shadow-[0_22px_60px_-28px_rgba(15,23,42,0.38)]"
    >
      {/* ── Image ── */}
      <div className="relative overflow-hidden">
        <Link
          to={projectPath}
          className="block overflow-hidden aspect-[16/10]"
          aria-label={`${primaryCta}: ${projectTitle}`}
          data-track="project-card-image"
          data-project-id={project.id}
        >
          <img
            src={getOptimizedImageUrl(project.image, {
              width: compact ? 920 : 1200,
              height: compact ? 620 : 780,
            })}
            alt={projectTitle}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.02]"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.02)_0%,rgba(15,23,42,0.10)_40%,rgba(15,23,42,0.48)_100%)]" />
        </Link>

        {/* ── Badges (max 2, top-left) ── */}
        {badges.length > 0 && (
          <div className="absolute left-3.5 top-3.5 z-10 flex max-w-[78%] flex-wrap gap-1.5">
            {badges.map((badge) => (
              <span
                key={badge.key}
                className={`inline-flex items-center rounded-full border px-2.5 py-[3px] text-[9.5px] font-semibold uppercase tracking-[0.12em] backdrop-blur-sm ${
                  BADGE_TONE_CLASSES[badge.tone] || BADGE_TONE_CLASSES.slate
                }`}
              >
                {t(`localProjects.badges.${badge.key}`)}
              </span>
            ))}
          </div>
        )}

        {/* ── Favorite (subdued, top-right) ── */}
        <div className="absolute right-3 top-3 z-20">
          <HeartBtn
            id={String(project.id)}
            size={13}
            className="rounded-full border border-white/50 bg-white/70 p-1 shadow-sm backdrop-blur-sm transition-opacity opacity-70 group-hover:opacity-100"
          />
        </div>
      </div>

      {/* ── Body ── */}
      <div className={`flex flex-1 flex-col ${compact ? "px-4 pt-3.5 pb-4" : "px-5 pt-4 pb-5"}`}>
        {/* Location */}
        {locationLabel ? (
          <div className="inline-flex min-w-0 items-center gap-1.5 text-[0.8rem] text-slate-500">
            <MdLocationOn className="h-3.5 w-3.5 shrink-0 text-[#b16b2d]/80" />
            <span className="line-clamp-1">{locationLabel}</span>
          </div>
        ) : null}

        {/* Title */}
        <h3 className="mt-2 line-clamp-2 text-[1.25rem] font-semibold leading-[1.22] tracking-[-0.025em] text-slate-900">
          <Link
            to={projectPath}
            className="transition group-hover:text-[#8f5a24]"
            data-track="project-card-title"
            data-project-id={project.id}
          >
            {projectTitle}
          </Link>
        </h3>

        {/* Benefit line */}
        <p className="mt-2 line-clamp-2 text-[0.85rem] leading-[1.55] text-slate-500">
          {getProjectBenefitLine(project, {
            t,
            language: i18n.language,
            convertAmount,
            defaultCurrency: baseCurrency,
          })}
        </p>

        {/* Room/area chips */}
        {(roomMixLabel || areaLabel) && (
          <div className="mt-3 flex flex-wrap gap-2 text-[0.7rem] text-slate-500">
            {roomMixLabel ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white px-2.5 py-1">
                <MdOutlineApartment className="h-3 w-3 shrink-0 text-slate-400" />
                <span className="font-medium">{roomMixLabel}</span>
              </span>
            ) : null}

            {areaLabel ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white px-2.5 py-1">
                <MdOutlineSell className="h-3 w-3 shrink-0 text-slate-400" />
                <span className="font-medium">{areaLabel}</span>
              </span>
            ) : null}
          </div>
        )}

        {/* ── Price box ── */}
        <div className={`mt-4 rounded-[20px] border p-3.5 ${priceBoxClasses}`}>
          <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            {pricePresentation.eyebrow}
          </p>
          <div className={`mt-1.5 font-semibold leading-tight tracking-[-0.03em] ${priceValueClasses}`}>
            {pricePresentation.value}
          </div>
          <p className="mt-2 text-[0.78rem] leading-[1.5] text-slate-500">
            {pricePresentation.caption}
          </p>
        </div>

        {/* Support items */}
        {supportItems.length > 0 ? (
          <div className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {supportItems.map((item) => {
              const SupportIcon = SUPPORT_ICON_MAP[item.key] || MdOutlineSell;
              return (
                <div
                  key={item.key}
                  className="rounded-[16px] border border-slate-200/70 bg-white px-3 py-2.5"
                >
                  <div className="flex items-start gap-2">
                    <SupportIcon className="mt-0.5 h-3 w-3 shrink-0 text-slate-400" />
                    <div className="min-w-0">
                      <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                        {item.label}
                      </p>
                      <p className="mt-0.5 text-[0.8rem] font-medium leading-5 text-slate-800">
                        {item.value}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}

        {/* ── CTA area ── */}
        <div className="mt-auto pt-4">
          <div className="flex flex-col gap-2">
            {/* Primary CTA → project page */}
            <Link
              to={projectPath}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_100%)] px-4 py-3 text-[0.82rem] font-semibold text-white shadow-[0_14px_28px_-16px_rgba(15,23,42,0.7)] transition hover:-translate-y-px hover:shadow-[0_18px_36px_-14px_rgba(15,23,42,0.75)]"
              data-track="project-card-primary-cta"
              data-project-id={project.id}
            >
              <span>{primaryCta}</span>
              <FaArrowRightLong className="h-3 w-3" />
            </Link>

            {/* Secondary CTA → inquiry action */}
            {secondaryCta.action === "whatsapp" && whatsappHref ? (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                data-whatsapp-url={whatsappHref}
                data-track="project-card-secondary-cta"
                data-project-id={project.id}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#25D366]/20 bg-[#25D366]/8 px-4 py-3 text-[0.82rem] font-semibold text-[#138f47] transition hover:border-[#25D366]/35 hover:bg-[#25D366]/12"
              >
                <FaWhatsapp className="h-3.5 w-3.5" />
                <span>{secondaryCta.label}</span>
              </a>
            ) : fallbackPhone ? (
              <PhoneLink
                phone={fallbackPhone}
                requireAuth={false}
                data-track="project-card-secondary-cta"
                data-project-id={project.id}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-[0.82rem] font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                <FaPhone className="h-3 w-3 text-[#b16b2d]/70" />
                <span>{secondaryCta.label}</span>
              </PhoneLink>
            ) : (
              <Link
                to={projectPath}
                data-track="project-card-secondary-cta"
                data-project-id={project.id}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-[0.82rem] font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                <span>{secondaryCta.label}</span>
              </Link>
            )}
          </div>

          {/* Tertiary links */}
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[0.78rem]">
            {secondaryCta.action === "whatsapp" && fallbackPhone ? (
              <PhoneLink
                phone={fallbackPhone}
                requireAuth={false}
                className="inline-flex items-center gap-1.5 text-slate-500 transition hover:text-slate-800"
                data-project-id={project.id}
              >
                <FaPhone className="h-3 w-3 text-[#b16b2d]/70" />
                <span>{t("localProjects.quickCall", { defaultValue: "Call advisor" })}</span>
              </PhoneLink>
            ) : whatsappHref ? (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                data-whatsapp-url={whatsappHref}
                data-track="project-card-whatsapp-inline"
                data-project-id={project.id}
                className="inline-flex items-center gap-1.5 text-[#138f47]/80 transition hover:text-[#0f7e3e]"
              >
                <FaWhatsapp className="h-3 w-3" />
                <span>{t("contact.whatsapp")}</span>
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
};

ProjectListingCard.propTypes = {
  project: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    title: PropTypes.string,
    name: PropTypes.string,
    image: PropTypes.string,
    projectPath: PropTypes.string,
    city: PropTypes.string,
    district: PropTypes.string,
    country: PropTypes.string,
    price: PropTypes.number,
    currency: PropTypes.string,
    propertyType: PropTypes.string,
    deliveryDate: PropTypes.string,
    consultant: PropTypes.shape({
      phone: PropTypes.string,
      whatsapp: PropTypes.string,
    }),
  }).isRequired,
  compact: PropTypes.bool,
};

export default ProjectListingCard;
