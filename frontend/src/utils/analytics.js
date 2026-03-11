const GOOGLE_ADS_WHATSAPP_SEND_TO = "536343459/GSI2CNrpzYYcEKPn3_8B";
const WHATSAPP_EVENT_FLAG = "__hbWhatsAppConversionTracked";
const WHATSAPP_HOSTS = new Set(["wa.me", "api.whatsapp.com"]);

export const isWhatsAppUrl = (value = "") => {
  const rawValue = String(value || "").trim();
  if (!rawValue) return false;

  if (/^whatsapp:\/\//i.test(rawValue)) {
    return true;
  }

  const normalizedValue = rawValue.startsWith("//")
    ? `https:${rawValue}`
    : rawValue;

  try {
    const baseUrl =
      typeof window !== "undefined" && window.location?.origin
        ? window.location.origin
        : "https://www.hbrealstate.com";
    const parsedUrl = new URL(normalizedValue, baseUrl);

    return (
      parsedUrl.protocol === "whatsapp:" ||
      WHATSAPP_HOSTS.has(parsedUrl.hostname.toLowerCase())
    );
  } catch {
    return /^(?:https?:\/\/)?(?:wa\.me|api\.whatsapp\.com)\//i.test(rawValue);
  }
};

export const getWhatsAppTrackingUrl = (target) => {
  if (!target || typeof target.closest !== "function") return "";

  const trackedElement = target.closest(
    '[data-track-whatsapp-click="true"], [data-whatsapp-url], a[href]'
  );
  if (!trackedElement) return "";

  if (trackedElement.getAttribute("data-track-whatsapp-click") === "true") {
    return "whatsapp-cta";
  }

  const candidateUrl =
    trackedElement.getAttribute("data-whatsapp-url") ||
    trackedElement.getAttribute("href") ||
    "";

  return isWhatsAppUrl(candidateUrl) ? candidateUrl : "";
};

export function trackWhatsAppConversion(event) {
  try {
    const nativeEvent = event?.nativeEvent || event;
    if (nativeEvent && typeof nativeEvent === "object") {
      if (nativeEvent[WHATSAPP_EVENT_FLAG]) return false;
      nativeEvent[WHATSAPP_EVENT_FLAG] = true;
    }

    if (typeof window !== "undefined" && typeof window.gtag === "function") {
      window.gtag("event", "conversion", {
        send_to: GOOGLE_ADS_WHATSAPP_SEND_TO,
      });
      return true;
    }
  } catch {
    // Fail silently so the WhatsApp CTA still works if tracking is unavailable.
  }

  return false;
}

export const trackWhatsAppConversionFromClick = (event) => {
  const whatsappUrl = getWhatsAppTrackingUrl(event?.target);
  if (!whatsappUrl) return false;
  return trackWhatsAppConversion(event);
};
