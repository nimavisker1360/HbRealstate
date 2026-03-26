import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import PropertyGridCard from "../PropertyGridCard";

const RelatedCard = ({ item }) => (
  <Link
    to={item.path}
    className="group block overflow-hidden rounded-[24px] border border-white/70 bg-white/90 p-5 shadow-[0_24px_60px_-42px_rgba(15,23,42,0.35)] transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-[0_30px_70px_-42px_rgba(15,23,42,0.45)]"
  >
    {item.badge ? (
      <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
        {item.badge}
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
};

const RelatedContentSection = ({
  title,
  description,
  items = [],
  type = "content",
  className = "",
}) => {
  if (!Array.isArray(items) || items.length === 0) return null;

  return (
    <section className={`mt-12 ${className}`.trim()}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
        {description ? (
          <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
        ) : null}
      </div>

      {type === "property" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {items.map((item) => (
            <PropertyGridCard key={item.id} property={item} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <RelatedCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </section>
  );
};

RelatedContentSection.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  items: PropTypes.array.isRequired,
  type: PropTypes.oneOf(["property", "content"]),
  className: PropTypes.string,
};

export default RelatedContentSection;

