import PropTypes from "prop-types";
import SmartPropertyVideo from "../video/SmartPropertyVideo";
import {
  buildVideoTrackingPayload,
  buildVideoWhatsAppUrl,
  openAiAssistantForSimilarProperties,
  trackVideoEngagementEvent,
} from "../../utils/videoLeadTracking";

const MATCH_REASON_LABELS = {
  project_match: "Exact project match",
  district_match: "Near preferred area",
  city_match: "Same city",
  page_context_match: "Related area",
  room_type_match: "Matches room type",
  property_type_match: "Matches property type",
  installment_match: "Installment available",
  citizenship_fit: "Eligible for citizenship",
  investment_fit: "Investment-friendly",
  within_budget: "Within budget",
  below_budget_range: "Below budget range",
  above_budget: "Slightly above budget",
  delivery_match: "Matches delivery preference",
  family_friendly: "Family-friendly concept",
  amenity_match: "Matches your priorities",
  title_deed_ready: "Ready title deed",
  sea_view_match: "Sea view available",
  preferred_side_match: "Preferred side of Istanbul",
};

const formatReason = (reason) =>
  MATCH_REASON_LABELS[reason] || reason.replace(/_/g, " ");

const normalizeString = (value, fallback = "") => {
  const normalized = String(value || "").trim();
  return normalized || fallback;
};

const isProjectRecommendation = (item = {}) =>
  ["local-project", "international-project", "project", "projects"].includes(
    normalizeString(item?.property_type).toLowerCase()
  );

const RecommendationCards = ({ items, labels, lead, leadId }) => {
  if (!Array.isArray(items) || items.length === 0) return null;

  return (
    <div className="mt-3 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          {labels.recommendations}
        </p>
      </div>
      <div className="space-y-3">
        {items.map((item) => {
          const reasons = Array.isArray(item.whyItMatches) && item.whyItMatches.length > 0
            ? item.whyItMatches
            : Array.isArray(item.matchReasons) && item.matchReasons.length > 0
            ? item.matchReasons.map(formatReason)
            : [];
          const locationLabel = [item.city, item.district].filter(Boolean).join(" / ");
          const primaryVideo = item.heroVideo || item.videos?.[0] || null;
          const projectScoped = isProjectRecommendation(item);
          const propertyId = projectScoped ? "" : item.id;
          const projectId = projectScoped ? item.id : "";
          const detailUrl = normalizeString(item.detail_url);
          const priceLabel = item.price_usd
            ? `$${Number(item.price_usd).toLocaleString()}`
            : labels.priceOnRequest || "Price on request";

          const handleWhatsAppClick = async () => {
            if (!primaryVideo?.id) return;

            await trackVideoEngagementEvent(
              buildVideoTrackingPayload({
                videoId: primaryVideo.id,
                leadId,
                propertyId,
                projectId,
                eventType: "cta_clicked",
                watchPercent: 100,
                source: "video_ai_assistant",
                context: {
                  userIntentCitizenship:
                    lead?.purpose === "citizenship" || lead?.citizenshipInterest === true,
                  userIntentInstallment: lead?.paymentPlan === "installment",
                  userIntent:
                    lead?.purpose === "citizenship"
                      ? "citizenship"
                      : lead?.paymentPlan === "installment"
                      ? "installment"
                      : "",
                  priceUsd: Number(item.price_usd) || 0,
                  isInstallmentProperty: /installment|payment|taksit/i.test(
                    normalizeString(item.payment_plan)
                  ),
                },
              })
            );

            const whatsappUrl = buildVideoWhatsAppUrl({
              title: item.title,
              location: locationLabel,
              priceLabel,
              detailUrl,
              source: "video_ai_assistant",
            });
            window.open(whatsappUrl, "_blank", "noopener,noreferrer");
          };

          const handleSimilarPropertiesClick = () => {
            const prompt = `Show me similar properties to ${item.title}${
              locationLabel ? ` in ${locationLabel}` : ""
            }`;
            openAiAssistantForSimilarProperties(prompt);
          };

          return (
            <div
              key={item.id || item.title}
              className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_22px_60px_-44px_rgba(15,23,42,0.45)]"
            >
              {item.image_url ? (
                <div className="relative h-36 overflow-hidden">
                  <img
                    src={item.image_url}
                    alt={item.title || "property"}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent" />
                </div>
              ) : null}
              {primaryVideo ? (
                <SmartPropertyVideo
                  video={primaryVideo}
                  propertyId={propertyId}
                  projectId={projectId}
                  leadId={leadId}
                  placement="ai_assistant"
                  context={{
                    userIntentCitizenship:
                      lead?.purpose === "citizenship" || lead?.citizenshipInterest === true,
                    userIntentInstallment: lead?.paymentPlan === "installment",
                    userIntent:
                      lead?.purpose === "citizenship"
                        ? "citizenship"
                        : lead?.paymentPlan === "installment"
                        ? "installment"
                        : "",
                    priceUsd: Number(item.price_usd) || 0,
                    isInstallmentProperty: /installment|payment|taksit/i.test(
                      normalizeString(item.payment_plan)
                    ),
                  }}
                  ctaMessage={
                    labels.videoCtaPrompt ||
                    "Looks like this project matches your interest. Would you like full price details or similar options on WhatsApp?"
                  }
                  ctaLabels={{
                    whatsapp: labels.whatsapp,
                    similarProperties: labels.similarProperties,
                    bookViewing: labels.bookViewing,
                  }}
                  onWhatsAppClick={handleWhatsAppClick}
                  onSimilarPropertiesClick={handleSimilarPropertiesClick}
                  onBookViewingClick={
                    detailUrl
                      ? () => window.open(detailUrl, "_blank", "noopener,noreferrer")
                      : null
                  }
                />
              ) : null}
              <div className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                    <p className="text-xs text-slate-500">
                      {[item.city, item.district].filter(Boolean).join(" / ")}
                    </p>
                  </div>
                  {item.price_usd ? (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                      ${Number(item.price_usd).toLocaleString()}
                    </span>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-2 text-[11px] text-slate-600">
                  {item.rooms ? (
                    <span className="rounded-full bg-slate-100 px-2 py-1">{item.rooms}</span>
                  ) : null}
                  {item.size_m2 ? (
                    <span className="rounded-full bg-slate-100 px-2 py-1">
                      {item.size_m2} m2
                    </span>
                  ) : null}
                  {item.payment_plan ? (
                    <span className="rounded-full bg-slate-100 px-2 py-1">
                      {item.payment_plan}
                    </span>
                  ) : null}
                </div>

                {reasons.length > 0 ? (
                  <div className="space-y-1">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                      {labels.matchReasons}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {reasons.map((reason, reasonIndex) => (
                        <span
                          key={`${reason}-${reasonIndex}`}
                          className="rounded-full bg-[#fff3e8] px-2 py-1 text-[10px] font-semibold text-[#c75d1b]"
                        >
                          {reason}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                {item.recommendationNote ? (
                  <p className="text-xs leading-5 text-slate-600">{item.recommendationNote}</p>
                ) : null}

                <div className="flex flex-wrap gap-2 pt-1">
                  {detailUrl ? (
                    <a
                      href={detailUrl}
                      className="inline-flex rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800"
                    >
                      {labels.viewDetails}
                    </a>
                  ) : null}
                  {primaryVideo ? (
                    <button
                      type="button"
                      onClick={handleWhatsAppClick}
                      className="inline-flex rounded-full bg-[#25D366] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#20bd5a]"
                    >
                      {labels.whatsapp}
                    </button>
                  ) : null}
                  {detailUrl ? (
                    <a
                      href={detailUrl}
                      className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                    >
                      {labels.bookViewing}
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

RecommendationCards.propTypes = {
  items: PropTypes.arrayOf(PropTypes.object),
  lead: PropTypes.object,
  leadId: PropTypes.string,
  labels: PropTypes.shape({
    recommendations: PropTypes.string.isRequired,
    matchReasons: PropTypes.string.isRequired,
    viewDetails: PropTypes.string.isRequired,
    whatsapp: PropTypes.string,
    bookViewing: PropTypes.string,
    similarProperties: PropTypes.string,
    videoCtaPrompt: PropTypes.string,
    priceOnRequest: PropTypes.string,
  }).isRequired,
};

export default RecommendationCards;
