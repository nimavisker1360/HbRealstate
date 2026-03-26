import PropTypes from "prop-types";
import { Link } from "react-router-dom";

const Breadcrumbs = ({ items = [], className = "" }) => {
  if (!Array.isArray(items) || items.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={`mb-6 flex flex-wrap items-center gap-2 text-sm text-slate-500 ${className}`.trim()}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const key = `${item.label}-${index}`;
        return (
          <span key={key} className="flex items-center gap-2">
            {item.to && !isLast ? (
              <Link to={item.to} className="transition hover:text-emerald-700">
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? "font-medium text-slate-700" : ""}>
                {item.label}
              </span>
            )}
            {!isLast ? <span className="text-slate-300">/</span> : null}
          </span>
        );
      })}
    </nav>
  );
};

Breadcrumbs.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      to: PropTypes.string,
    })
  ),
  className: PropTypes.string,
};

export default Breadcrumbs;

