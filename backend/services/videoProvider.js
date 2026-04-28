import crypto from "node:crypto";

const normalizeString = (value, fallback = "") => {
  const normalized = String(value || "").trim();
  return normalized || fallback;
};

const getConfig = () => ({
  apiKey: normalizeString(process.env.VIDMOX_API_KEY),
  webhookSecret: normalizeString(process.env.VIDMOX_WEBHOOK_SECRET),
  baseUrl: normalizeString(process.env.VIDMOX_BASE_URL),
  accountId: normalizeString(process.env.VIDMOX_ACCOUNT_ID),
});

export const isVidmoxConfigured = () => {
  const config = getConfig();
  return Boolean(
    config.apiKey && config.webhookSecret && config.baseUrl && config.accountId
  );
};

const buildPlaceholderUploadSession = (input = {}, reason = "vidmox_not_configured") => ({
  provider: "vidmox",
  mode: "placeholder",
  uploadId: `manual_${crypto.randomUUID()}`,
  videoId: normalizeString(input.existingVideoId) || null,
  uploadUrl: "",
  playbackUrl: normalizeString(input.playbackUrl) || "",
  thumbnailUrl: normalizeString(input.thumbnailUrl) || "",
  status: normalizeString(input.playbackUrl) ? "ready" : "uploading",
  manualUploadRequired: true,
  reason,
  raw: null,
});

export const createVidmoxUploadSession = async (input = {}) => {
  const config = getConfig();

  if (!isVidmoxConfigured()) {
    return buildPlaceholderUploadSession(input);
  }

  // TODO: Confirm the exact Vidmox upload-session endpoint and payload shape
  // against the official API docs. Vidmox public API docs were not available
  // during this integration pass, so this request intentionally stays isolated
  // behind the adapter and falls back cleanly when the contract differs.
  const endpoint = `${config.baseUrl.replace(/\/+$/, "")}/accounts/${config.accountId}/uploads`;
  const payload = {
    title: normalizeString(input.title),
    fileName: normalizeString(input.fileName),
    mimeType: normalizeString(input.mimeType),
    fileSize: Number(input.fileSize) || 0,
    language: normalizeString(input.language) || "en",
    type: normalizeString(input.type),
    metadata: input.metadata && typeof input.metadata === "object" ? input.metadata : {},
  };

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return buildPlaceholderUploadSession(
        input,
        `vidmox_request_failed:${response.status}:${errorText.slice(0, 120)}`
      );
    }

    const raw = await response.json();
    return {
      provider: "vidmox",
      mode: "api",
      uploadId:
        normalizeString(raw.uploadId) ||
        normalizeString(raw.id) ||
        normalizeString(raw.upload_id) ||
        "",
      videoId:
        normalizeString(raw.videoId) ||
        normalizeString(raw.video_id) ||
        "",
      uploadUrl:
        normalizeString(raw.uploadUrl) ||
        normalizeString(raw.upload_url) ||
        "",
      playbackUrl:
        normalizeString(raw.playbackUrl) ||
        normalizeString(raw.playback_url) ||
        "",
      thumbnailUrl:
        normalizeString(raw.thumbnailUrl) ||
        normalizeString(raw.thumbnail_url) ||
        "",
      status: normalizeString(raw.status) || "uploading",
      manualUploadRequired: false,
      reason: "",
      raw,
    };
  } catch (error) {
    return buildPlaceholderUploadSession(
      input,
      `vidmox_request_error:${String(error?.message || "unknown_error")}`
    );
  }
};

export const verifyVidmoxWebhook = ({ headers = {}, rawBody = "", body = null } = {}) => {
  const config = getConfig();
  if (!config.webhookSecret) return false;

  const candidates = [
    headers["x-vidmox-webhook-secret"],
    headers["x-webhook-secret"],
    headers.authorization?.replace(/^Bearer\s+/i, ""),
  ]
    .map((value) => normalizeString(value))
    .filter(Boolean);

  if (candidates.includes(config.webhookSecret)) {
    return true;
  }

  const signature = normalizeString(headers["x-vidmox-signature"] || headers["x-signature"]);
  if (!signature || !rawBody) {
    return false;
  }

  // TODO: Replace this with the official Vidmox signature algorithm once the
  // provider publishes webhook verification details.
  const computed = crypto
    .createHmac("sha256", config.webhookSecret)
    .update(typeof rawBody === "string" ? rawBody : JSON.stringify(body || {}))
    .digest("hex");

  return signature === computed;
};

export const normalizeVidmoxWebhookPayload = (payload = {}) => ({
  vidmoxVideoId:
    normalizeString(payload.videoId) ||
    normalizeString(payload.video_id) ||
    normalizeString(payload.id),
  providerUploadId:
    normalizeString(payload.uploadId) ||
    normalizeString(payload.upload_id),
  status:
    normalizeString(payload.status) ||
    normalizeString(payload.event) ||
    "processing",
  playbackUrl:
    normalizeString(payload.playbackUrl) ||
    normalizeString(payload.playback_url),
  thumbnailUrl:
    normalizeString(payload.thumbnailUrl) ||
    normalizeString(payload.thumbnail_url),
  duration: Number(payload.duration) || 0,
  errorMessage:
    normalizeString(payload.errorMessage) ||
    normalizeString(payload.error) ||
    "",
  raw: payload,
});
