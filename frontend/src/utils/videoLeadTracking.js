import { getStoredAttributionData } from "./attribution";
import { api } from "./api";

const ANONYMOUS_VIDEO_USER_KEY = "__hbVideoAnonymousUserId";
const HB_WHATSAPP_NUMBER = "905303871050";

const normalizeString = (value, fallback = "") => {
  const normalized = String(value || "").trim();
  return normalized || fallback;
};

const getSafeWindow = () =>
  typeof window !== "undefined" ? window : null;

export const getAnonymousVideoUserId = () => {
  const safeWindow = getSafeWindow();
  if (!safeWindow) return "server-render";

  const existing = normalizeString(
    safeWindow.localStorage.getItem(ANONYMOUS_VIDEO_USER_KEY)
  );
  if (existing) return existing;

  const generated =
    safeWindow.crypto?.randomUUID?.() ||
    `anon_${Math.random().toString(36).slice(2, 10)}`;
  safeWindow.localStorage.setItem(ANONYMOUS_VIDEO_USER_KEY, generated);
  return generated;
};

export const buildVideoTrackingPayload = ({
  videoId,
  leadId = "",
  propertyId = "",
  projectId = "",
  eventType,
  watchPercent = 0,
  source = "video",
  context = {},
} = {}) => {
  const attribution = getStoredAttributionData();

  return {
    anonymousUserId: getAnonymousVideoUserId(),
    leadId: normalizeString(leadId) || null,
    propertyId: normalizeString(propertyId) || null,
    projectId: normalizeString(projectId) || null,
    videoId: normalizeString(videoId),
    eventType: normalizeString(eventType),
    watchPercent: Number(watchPercent) || 0,
    source: normalizeString(source, "video"),
    gclid: attribution.gclid,
    gbraid: attribution.gbraid,
    wbraid: attribution.wbraid,
    utm_source: attribution.utm_source,
    utm_medium: attribution.utm_medium,
    utm_campaign: attribution.utm_campaign,
    utm_term: attribution.utm_term,
    utm_content: attribution.utm_content,
    landing_page: attribution.landing_page,
    referrer: attribution.referrer,
    context,
  };
};

export const trackVideoEngagementEvent = async (payload = {}) => {
  if (!normalizeString(payload.videoId) || !normalizeString(payload.eventType)) {
    return null;
  }

  try {
    const response = await api.post("/video-events", payload, {
      timeout: 10000,
    });
    return response.data;
  } catch (_error) {
    return null;
  }
};

export const buildVideoWhatsAppUrl = ({
  title = "",
  location = "",
  priceLabel = "",
  detailUrl = "",
  source = "video_ai_assistant",
} = {}) => {
  const attribution = getStoredAttributionData();
  const safeWindow = getSafeWindow();
  const resolvedDetailUrl =
    detailUrl && /^https?:\/\//i.test(detailUrl)
      ? detailUrl
      : detailUrl && safeWindow?.location?.origin
      ? `${safeWindow.location.origin}${detailUrl.startsWith("/") ? detailUrl : `/${detailUrl}`}`
      : detailUrl;
  const messageLines = [
    `Hello, I'm interested in: ${normalizeString(title, "Property / Project")}`,
    location ? `Location: ${location}` : "",
    priceLabel ? `Price: ${priceLabel}` : "",
    resolvedDetailUrl ? `Page: ${resolvedDetailUrl}` : "",
    `Source: ${source}`,
    attribution.utm_source ? `utm_source=${attribution.utm_source}` : "",
    attribution.utm_medium ? `utm_medium=${attribution.utm_medium}` : "",
    attribution.utm_campaign ? `utm_campaign=${attribution.utm_campaign}` : "",
    attribution.gclid ? `gclid=${attribution.gclid}` : "",
  ].filter(Boolean);

  return `https://wa.me/${HB_WHATSAPP_NUMBER}?text=${encodeURIComponent(
    messageLines.join("\n")
  )}`;
};

export const openAiAssistantForSimilarProperties = (message) => {
  const safeWindow = getSafeWindow();
  if (!safeWindow) return;

  safeWindow.dispatchEvent(
    new CustomEvent("hb:ai-agent:video-intent", {
      detail: {
        message: normalizeString(message),
      },
    })
  );
};
