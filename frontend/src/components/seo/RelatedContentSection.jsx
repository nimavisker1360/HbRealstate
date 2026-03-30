import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PropertyGridCard from "../PropertyGridCard";

const BADGE_TRANSLATION_KEYS = {
  article: "article",
  guide: "guide",
  blog: "blog",
  blogs: "blogs",
  "city page": "cityPage",
  "pillar page": "pillarPage",
  "district page": "districtPage",
  "supporting article": "supportingArticle",
};

const translateBadge = (badge, t) => {
  const rawBadge = String(badge || "").trim();
  if (!rawBadge) return "";

  const key = BADGE_TRANSLATION_KEYS[rawBadge.toLowerCase()];
  return key ? t(`relatedContent.badges.${key}`, rawBadge) : rawBadge;
};

const RelatedCard = ({ item, horizontal = false }) => {
  const { t } = useTranslation();
  const translatedBadge = translateBadge(item.badge, t);

  if (horizontal) {
    return (
      <Link
        to={item.path}
        className="group block overflow-hidden rounded-[24px] border border-white/75 bg-white/92 shadow-[0_24px_60px_-42px_rgba(15,23,42,0.28)] transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-[0_30px_70px_-42px_rgba(15,23,42,0.38)]"
      >
        <div className="flex flex-col md:flex-row">
          <div className="border-b border-slate-100 bg-slate-50/70 p-5 md:w-[220px] md:border-b-0 md:border-r">
            {translatedBadge ? (
              <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                {translatedBadge}
              </span>
            ) : null}
            {item.meta ? (
              <p className="mt-4 text-xs font-medium uppercase tracking-[0.24em] text-slate-400">
                {item.meta}
              </p>
            ) : null}
            <p className="mt-3 text-sm leading-6 text-slate-500">
              {t(
                "relatedContent.internalPageHint",
                "Related internal page from the same content cluster."
              )}
            </p>
          </div>

          <div className="flex min-w-0 flex-1 flex-col p-5 md:px-6 md:py-5">
            <h3 className="text-lg font-semibold leading-8 text-slate-900 transition group-hover:text-emerald-700 md:text-[1.35rem]">
              {item.title}
            </h3>

            {item.excerpt ? (
              <p className="mt-3 line-clamp-3 max-w-3xl text-sm leading-7 text-slate-600">
                {item.excerpt}
              </p>
            ) : null}

            <div className="mt-5 flex flex-col gap-4 border-t border-slate-100 pt-4 md:flex-row md:items-center md:justify-between">
              {Array.isArray(item.tags) && item.tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {item.tags.slice(0, 4).map((tag) => (
                    <span
                      key={`${item.id}-${tag}`}
                      className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] text-slate-500"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                  {t("relatedContent.internalPage", "Internal page")}
                </span>
              )}

              <span className="text-sm font-semibold text-emerald-700 transition-transform duration-300 group-hover:translate-x-1">
                {t("relatedContent.readMore", "Read more")}
              </span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={item.path}
      className="group block overflow-hidden rounded-[24px] border border-white/70 bg-white/90 p-5 shadow-[0_24px_60px_-42px_rgba(15,23,42,0.35)] transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-[0_30px_70px_-42px_rgba(15,23,42,0.45)]"
    >
      {translatedBadge ? (
        <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
          {translatedBadge}
        </span>
      ) : null}
      <h3 className="mt-3 text-lg font-semibold leading-snug text-slate-900 transition group-hover:text-emerald-700">
        {item.title}
      </h3>
      {item.excerpt ? (
        <p className="mt-3 text-sm leading-6 text-slate-600">{item.excerpt}</p>
      ) : null}
      {item.meta ? (
        <p className="mt-3 text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
          {item.meta}
        </p>
      ) : null}
      {Array.isArray(item.tags) && item.tags.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {item.tags.slice(0, 4).map((tag) => (
            <span
              key={`${item.id}-${tag}`}
              className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] text-slate-500"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}
    </Link>
  );
};

RelatedCard.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    path: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    excerpt: PropTypes.string,
    badge: PropTypes.string,
    meta: PropTypes.string,
    tags: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
  horizontal: PropTypes.bool,
};

const RelatedContentSection = ({
  title,
  titleKey,
  description,
  descriptionKey,
  items = [],
  type = "content",
  contentLayout = "auto",
  className = "",
}) => {
  const { t } = useTranslation();
  if (!Array.isArray(items) || items.length === 0) return null;

  const autoHorizontal =
    type !== "property" && /article|articles|read|guide|guides/i.test(String(title || ""));
  const useHorizontalCards =
    type !== "property" &&
    (contentLayout === "horizontal" || (contentLayout === "auto" && autoHorizontal));
  const resolvedTitle = titleKey ? t(titleKey, title) : title;
  const resolvedDescription = descriptionKey ? t(descriptionKey, description) : description;

  return (
    <section className={`mt-12 ${className}`.trim()}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">{resolvedTitle}</h2>
        {resolvedDescription ? (
          <p className="mt-2 text-sm leading-6 text-slate-500">{resolvedDescription}</p>
        ) : null}
      </div>

      {type === "property" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {items.map((item) => (
            <PropertyGridCard key={item.id} property={item} />
          ))}
        </div>
      ) : (
        <div
          className={
            useHorizontalCards
              ? "space-y-4"
              : "grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
          }
        >
          {items.map((item) => (
            <RelatedCard key={item.id} item={item} horizontal={useHorizontalCards} />
          ))}
        </div>
      )}
    </section>
  );
};

RelatedContentSection.propTypes = {
  title: PropTypes.string.isRequired,
  titleKey: PropTypes.string,
  description: PropTypes.string,
  descriptionKey: PropTypes.string,
  items: PropTypes.array.isRequired,
  type: PropTypes.oneOf(["property", "content"]),
  contentLayout: PropTypes.oneOf(["auto", "grid", "horizontal"]),
  className: PropTypes.string,
};

export default RelatedContentSection;
