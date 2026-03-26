import PropTypes from "prop-types";
import { Link } from "react-router-dom";

const SeoCtaSection = ({
  title,
  description,
  primaryAction,
  secondaryAction,
  className = "",
}) => {
  if (!title || !description) return null;

  return (
    <section
      className={`mt-12 overflow-hidden rounded-[28px] border border-emerald-200/70 bg-[linear-gradient(135deg,#ecfdf5_0%,#ffffff_42%,#f0fdfa_100%)] p-6 shadow-[0_24px_60px_-45px_rgba(15,23,42,0.35)] sm:p-8 ${className}`.trim()}
    >
      <div className="max-w-3xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-emerald-700">
          HB Real Estate
        </p>
        <h2 className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">
          {title}
        </h2>
        <p className="mt-3 text-base leading-7 text-slate-600">{description}</p>
      </div>

      {(primaryAction?.to || secondaryAction?.to) && (
        <div className="mt-6 flex flex-wrap items-center gap-3">
          {primaryAction?.to ? (
            <Link
              to={primaryAction.to}
              className="inline-flex items-center rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              {primaryAction.label}
            </Link>
          ) : null}

          {secondaryAction?.to ? (
            <Link
              to={secondaryAction.to}
              className="inline-flex items-center rounded-xl border border-emerald-200 bg-white px-5 py-3 text-sm font-semibold text-emerald-700 transition hover:border-emerald-400 hover:bg-emerald-50"
            >
              {secondaryAction.label}
            </Link>
          ) : null}
        </div>
      )}
    </section>
  );
};

SeoCtaSection.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  primaryAction: PropTypes.shape({
    label: PropTypes.string.isRequired,
    to: PropTypes.string.isRequired,
  }),
  secondaryAction: PropTypes.shape({
    label: PropTypes.string.isRequired,
    to: PropTypes.string.isRequired,
  }),
  className: PropTypes.string,
};

export default SeoCtaSection;

