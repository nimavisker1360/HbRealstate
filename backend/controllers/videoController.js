import asyncHandler from "express-async-handler";
import { ObjectId } from "mongodb";
import { getMongoDb } from "../config/prismaConfig.js";
import {
  createVideo,
  listReadyVideosByEntity,
  listVideosForAdmin,
  updateVideoById,
  updateVideoByProviderRef,
} from "../models/videoModel.js";
import {
  createVideoEvent,
  listVideoEventsForScoring,
} from "../models/videoEventModel.js";
import {
  createVidmoxUploadSession,
  normalizeVidmoxWebhookPayload,
  verifyVidmoxWebhook,
} from "../services/videoProvider.js";
import { scoreLeadFromVideoEvents } from "../utils/leadScoring.js";
import { extractLeadAttribution } from "../utils/leadAttribution.js";

const normalizeString = (value, fallback = "") => {
  const normalized = String(value || "").trim();
  return normalized || fallback;
};

const normalizeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const convertToUsd = (amount, currency = "USD") => {
  const value = normalizeNumber(amount, 0);
  if (value <= 0) return 0;

  const normalizedCurrency = normalizeString(currency, "USD").toUpperCase();
  const tryPerUsd = normalizeNumber(process.env.ASSISTANT_TRY_PER_USD, 36);
  const usdPerEur = normalizeNumber(process.env.ASSISTANT_USD_PER_EUR, 1.08);
  const usdPerGbp = normalizeNumber(process.env.ASSISTANT_USD_PER_GBP, 1.27);

  if (normalizedCurrency === "USD") return value;
  if (normalizedCurrency === "TRY") return Math.round(value / tryPerUsd);
  if (normalizedCurrency === "EUR") return Math.round(value * usdPerEur);
  if (normalizedCurrency === "GBP") return Math.round(value * usdPerGbp);
  return 0;
};

const normalizeVideoStatusFromWebhook = (status = "") => {
  const normalized = normalizeString(status).toLowerCase();
  if (
    ["ready", "completed", "processed", "playable", "video.ready"].includes(normalized)
  ) {
    return "ready";
  }
  if (
    ["failed", "error", "video.failed", "processing_failed"].includes(normalized)
  ) {
    return "failed";
  }
  if (["uploading", "uploaded", "video.uploaded"].includes(normalized)) {
    return "uploading";
  }
  return "processing";
};

const getResidencyCollection = async () => {
  const db = await getMongoDb();
  return db.collection("Residency");
};

const getEventScoringContext = async ({
  propertyId = "",
  projectId = "",
  context = {},
} = {}) => {
  const collection = await getResidencyCollection();
  const entityId = normalizeString(projectId || propertyId);
  let entity = null;

  if (entityId) {
    try {
      entity = await collection.findOne({
        _id: ObjectId.isValid(entityId) ? new ObjectId(entityId) : entityId,
      });
    } catch {
      entity = null;
    }
  }

  return {
    priceUsd: normalizeNumber(
      context?.priceUsd,
      normalizeNumber(entity?.price_usd, 0) ||
        convertToUsd(entity?.price, entity?.currency)
    ),
    userIntentCitizenship: context?.userIntentCitizenship === true,
    userIntentInstallment: context?.userIntentInstallment === true,
    userIntent: normalizeString(context?.userIntent),
    isInstallmentProperty:
      context?.isInstallmentProperty === true ||
      /installment|payment|taksit/i.test(
        normalizeString(entity?.paymentPlan || entity?.kampanya)
      ),
  };
};

export const createVideoUpload = asyncHandler(async (req, res) => {
  const {
    title,
    type,
    propertyId,
    projectId,
    language,
    isHeroVideo,
    playbackUrl,
    thumbnailUrl,
    duration,
    fileName,
    mimeType,
    fileSize,
  } = req.body || {};

  const uploadSession = await createVidmoxUploadSession({
    title,
    type,
    propertyId,
    projectId,
    language,
    fileName,
    mimeType,
    fileSize,
    playbackUrl,
    thumbnailUrl,
  });

  const initialStatus = playbackUrl
    ? "ready"
    : uploadSession.manualUploadRequired
    ? "uploading"
    : normalizeVideoStatusFromWebhook(uploadSession.status);

  const video = await createVideo({
    title,
    type,
    propertyId,
    projectId,
    language,
    isHeroVideo,
    status: initialStatus,
    vidmoxVideoId: uploadSession.videoId,
    providerUploadId: uploadSession.uploadId,
    playbackUrl: playbackUrl || uploadSession.playbackUrl,
    thumbnailUrl: thumbnailUrl || uploadSession.thumbnailUrl,
    duration,
    sourceFileName: fileName,
    mimeType,
    fileSize,
    providerName: "vidmox",
    providerState: uploadSession.raw
      ? uploadSession.raw
      : {
          mode: uploadSession.mode,
          manualUploadRequired: uploadSession.manualUploadRequired,
          reason: uploadSession.reason,
        },
  });

  res.status(201).json({
    success: true,
    video,
    uploadSession,
  });
});

export const handleVideoWebhook = asyncHandler(async (req, res) => {
  const verified = verifyVidmoxWebhook({
    headers: req.headers || {},
    rawBody: req.rawBody || "",
    body: req.body || {},
  });

  if (!verified) {
    return res.status(401).json({
      success: false,
      message: "Invalid video webhook signature.",
    });
  }

  const payload = normalizeVidmoxWebhookPayload(req.body || {});
  const updated = await updateVideoByProviderRef(
    {
      vidmoxVideoId: payload.vidmoxVideoId,
      providerUploadId: payload.providerUploadId,
    },
    {
      vidmoxVideoId: payload.vidmoxVideoId,
      providerUploadId: payload.providerUploadId,
      status: normalizeVideoStatusFromWebhook(payload.status),
      playbackUrl: payload.playbackUrl,
      thumbnailUrl: payload.thumbnailUrl,
      duration: payload.duration,
      errorMessage: payload.errorMessage,
      providerState: payload.raw,
    }
  );

  res.status(200).json({
    success: true,
    updated,
  });
});

export const getPropertyVideos = asyncHandler(async (req, res) => {
  const videos = await listReadyVideosByEntity({
    type: "property",
    propertyId: req.params.propertyId,
    language: req.query.language,
  });
  res.status(200).json({ success: true, videos });
});

export const getProjectVideos = asyncHandler(async (req, res) => {
  const videos = await listReadyVideosByEntity({
    type: "project",
    projectId: req.params.projectId,
    language: req.query.language,
  });
  res.status(200).json({ success: true, videos });
});

export const createVideoEventRecord = asyncHandler(async (req, res) => {
  const attribution = extractLeadAttribution(req, {
    defaultLeadSource: normalizeString(req.body?.source, "video"),
  });

  const event = await createVideoEvent({
    anonymousUserId: req.body?.anonymousUserId,
    leadId: req.body?.leadId,
    propertyId: req.body?.propertyId,
    projectId: req.body?.projectId,
    videoId: req.body?.videoId,
    eventType: req.body?.eventType,
    watchPercent: req.body?.watchPercent,
    source: normalizeString(req.body?.source, "video"),
    gclid: req.body?.gclid ?? attribution.gclid,
    gbraid: req.body?.gbraid ?? attribution.gbraid,
    wbraid: req.body?.wbraid ?? attribution.wbraid,
    utm_source: req.body?.utm_source ?? attribution.utmSource,
    utm_medium: req.body?.utm_medium ?? attribution.utmMedium,
    utm_campaign: req.body?.utm_campaign ?? attribution.utmCampaign,
    utm_term: req.body?.utm_term ?? attribution.utmTerm,
    utm_content: req.body?.utm_content ?? attribution.utmContent,
    landing_page: req.body?.landing_page ?? attribution.landingPage,
    referrer: req.body?.referrer ?? attribution.referrer,
  });

  const events = await listVideoEventsForScoring({
    anonymousUserId: event.anonymousUserId,
    leadId: event.leadId,
  });
  const scoringContext = await getEventScoringContext({
    propertyId: event.propertyId,
    projectId: event.projectId,
    context: req.body?.context || {},
  });
  const leadScore = scoreLeadFromVideoEvents({
    events,
    context: scoringContext,
  });

  res.status(201).json({
    success: true,
    event,
    leadScore,
  });
});

export const listAdminVideos = asyncHandler(async (req, res) => {
  const videos = await listVideosForAdmin({
    type: req.query.type,
    status: req.query.status,
  });
  res.status(200).json({ success: true, videos });
});

export const updateAdminVideo = asyncHandler(async (req, res) => {
  const updated = await updateVideoById(req.params.videoId, req.body || {});
  res.status(200).json({ success: true, video: updated });
});
