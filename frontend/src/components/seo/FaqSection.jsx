import PropTypes from "prop-types";

export const buildFaqSchema = (items = []) => {
  if (!Array.isArray(items) || items.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
};

const FaqSection = ({ title = "FAQ", items = [], className = "" }) => {
  if (!Array.isArray(items) || items.length === 0) return null;

  return (
    <section className={`mt-12 ${className}`.trim()}>
      <div className="flex items-center gap-3 mb-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-lg font-bold text-emerald-700">
          ?
        </div>
        <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
      </div>

      <div className="space-y-3">
        {items.map((item, index) => (
          <details
            key={`${item.question}-${index}`}
            className="overflow-hidden rounded-2xl border border-emerald-100/80 bg-white/90 transition hover:border-emerald-300 hover:shadow-md"
          >
            <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold text-slate-800 hover:bg-emerald-50/70 sm:text-base">
              <span>{item.question}</span>
              <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                +
              </span>
            </summary>
            <div className="bg-emerald-50/35 px-5 pb-5">
              <p className="text-sm leading-7 text-slate-600 sm:text-base">
                {item.answer}
              </p>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
};

FaqSection.propTypes = {
  title: PropTypes.string,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      question: PropTypes.string.isRequired,
      answer: PropTypes.string.isRequired,
    })
  ),
  className: PropTypes.string,
};

export default FaqSection;

