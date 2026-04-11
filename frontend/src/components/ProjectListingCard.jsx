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
  emerald: "border-emerald-200/80 bg-white/95 text-emerald-700",
  amber: "border-amber-200/80 bg-white/95 text-amber-700",
  sky: "border-sky-200/80 bg-white/95 text-sky-700",
  slate: "border-slate-200/80 bg-white/95 text-slate-700",
  stone: "border-stone-200/80 bg-white/95 text-stone-700",
  rose: "border-rose-200/80 bg-white/95 text-rose-700",
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
    ? "border-[#ecdfcb] bg-[linear-gradient(180deg,#fffaf2_0%,#fdf7ee_100%)]"
    : "border-[#dbe6e1] bg-[linear-gradient(180deg,#f8fbfa_0%,#f2f7f5_100%)]";
  const priceValueClasses = pricePresentation.hasVisiblePrice
    ? "text-[1.7rem] text-slate-900 sm:text-[1.82rem]"
    : "text-[1.12rem] text-slate-900 sm:text-[1.2rem]";

  return (
    <article
      className="group flex h-full flex-col overflow-hidden rounded-[30px] border border-[#e8decd] bg-[linear-gradient(180deg,#ffffff_0%,#fbf8f2_100%)] shadow-[0_20px_54px_-38px_rgba(15,23,42,0.42)] transition duration-300 hover:-translate-y-1 hover:border-[#dac9ad] hover:shadow-[0_26px_70px_-34px_rgba(15,23,42,0.4)]"
    >
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
            className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.025]"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.04)_0%,rgba(15,23,42,0.14)_42%,rgba(15,23,42,0.54)_100%)]" />
        </Link>

        <div className="absolute left-4 top-4 z-10 flex max-w-[76%] flex-wrap gap-2">
          {badges.map((badge) => (
            <span
              key={badge.key}
              className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] backdrop-blur ${
                BADGE_TONE_CLASSES[badge.tone] || BADGE_TONE_CLASSES.slate
              }`}
            >
              {t(`localProjects.badges.${badge.key}`)}
            </span>
          ))}
        </div>

        <div className="absolute bottom-4 right-4 z-20">
          <HeartBtn
            id={String(project.id)}
            size={15}
            className="rounded-full border border-white/65 bg-white/82 p-1.5 shadow-[0_12px_24px_-18px_rgba(15,23,42,0.55)] backdrop-blur"
          />
        </div>
      </div>

      <div className={`flex flex-1 flex-col ${compact ? "p-4" : "p-5"}`}>
        {locationLabel ? (
          <div className="inline-flex min-w-0 items-center gap-1.5 text-sm text-slate-600">
            <MdLocationOn className="h-4 w-4 shrink-0 text-[#b16b2d]" />
            <span className="line-clamp-1">{locationLabel}</span>
          </div>
        ) : null}

        <h3 className="mt-3 line-clamp-2 text-[1.35rem] font-semibold leading-[1.18] tracking-[-0.03em] text-slate-900">
          <Link
            to={projectPath}
            className="transition group-hover:text-[#8f5a24]"
            data-track="project-card-title"
            data-project-id={project.id}
          >
            {projectTitle}
          </Link>
        </h3>

        <p className="mt-3 line-clamp-2 text-[0.95rem] leading-6 text-slate-600">
          {getProjectBenefitLine(project, {
            t,
            language: i18n.language,
            convertAmount,
            defaultCurrency: baseCurrency,
          })}
        </p>

        {(roomMixLabel || areaLabel) && (
          <div className="mt-4 flex flex-wrap gap-2.5 text-xs text-slate-600">
            {roomMixLabel ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5">
                <MdOutlineApartment className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <span className="font-medium">{roomMixLabel}</span>
              </span>
            ) : null}

            {areaLabel ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5">
                <MdOutlineSell className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <span className="font-medium">{areaLabel}</span>
              </span>
            ) : null}
          </div>
        )}

        <div className={`mt-5 rounded-[24px] border p-4 ${priceBoxClasses}`}>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            {pricePresentation.eyebrow}
          </p>
          <div className={`mt-2 font-semibold leading-tight tracking-[-0.04em] ${priceValueClasses}`}>
            {pricePresentation.value}
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {pricePresentation.caption}
          </p>
        </div>

        {supportItems.length > 0 ? (
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {supportItems.map((item) => {
              const SupportIcon = SUPPORT_ICON_MAP[item.key] || MdOutlineSell;
              return (
                <div
                  key={item.key}
                  className="rounded-[18px] border border-slate-200 bg-white px-3.5 py-3"
                >
                  <div className="flex items-start gap-2.5">
                    <SupportIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                        {item.label}
                      </p>
                      <p className="mt-1 text-sm font-medium leading-5 text-slate-800">
                        {item.value}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}

        <div className="mt-auto pt-5">
          <div className="flex flex-col gap-2.5">
            <Link
              to={projectPath}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#0f172a_0%,#1f2937_100%)] px-4 py-3.5 text-sm font-semibold text-white shadow-[0_20px_34px_-22px_rgba(15,23,42,0.78)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_42px_-18px_rgba(15,23,42,0.8)]"
              data-track="project-card-primary-cta"
              data-project-id={project.id}
            >
              <span>{primaryCta}</span>
              <FaArrowRightLong className="h-3.5 w-3.5" />
            </Link>

            {secondaryCta.action === "whatsapp" && whatsappHref ? (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                data-whatsapp-url={whatsappHref}
                data-track="project-card-secondary-cta"
                data-project-id={project.id}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#25D366]/25 bg-[#25D366]/10 px-4 py-3.5 text-sm font-semibold text-[#138f47] transition hover:border-[#25D366]/40 hover:bg-[#25D366]/14"
              >
                <FaWhatsapp className="h-4 w-4" />
                <span>{secondaryCta.label}</span>
              </a>
            ) : (
              <Link
                to={projectPath}
                data-track="project-card-secondary-cta"
                data-project-id={project.id}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                <span>{secondaryCta.label}</span>
              </Link>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            <PhoneLink
              phone={fallbackPhone}
              requireAuth={false}
              className="inline-flex items-center gap-2 text-slate-600 transition hover:text-slate-900"
              data-project-id={project.id}
            >
              <FaPhone className="h-3.5 w-3.5 text-[#b16b2d]" />
              <span>{t("localProjects.quickCall", { defaultValue: "Call advisor" })}</span>
            </PhoneLink>

            {secondaryCta.action !== "whatsapp" && whatsappHref ? (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                data-whatsapp-url={whatsappHref}
                data-track="project-card-whatsapp-inline"
                data-project-id={project.id}
                className="inline-flex items-center gap-2 text-[#138f47] transition hover:text-[#0f7e3e]"
              >
                <FaWhatsapp className="h-3.5 w-3.5" />
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
