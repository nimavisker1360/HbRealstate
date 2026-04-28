import { ObjectId } from "mongodb";
import { getMongoDb } from "../config/prismaConfig.js";

export const VIDEO_COLLECTION_NAME = "Video";
export const VIDEO_TYPES = ["property", "project"];
export const VIDEO_STATUSES = ["uploading", "processing", "ready", "failed"];
export const VIDEO_LANGUAGES = ["en", "tr", "ru"];

const VIDEO_TYPE_SET = new Set(VIDEO_TYPES);
const VIDEO_STATUS_SET = new Set(VIDEO_STATUSES);
const VIDEO_LANGUAGE_SET = new Set(VIDEO_LANGUAGES);

let indexesPromise = null;

const normalizeString = (value, fallback = "") => {
  const normalized = String(value || "").trim();
  return normalized || fallback;
};

const normalizeBoolean = (value, fallback = false) => {
  if (value === undefined || value === null) return fallback;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "on"].includes(normalized)) return true;
    if (["false", "0", "no", "off"].includes(normalized)) return false;
  }
  return Boolean(value);
};

const normalizeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeType = (value) => {
  const normalized = normalizeString(value).toLowerCase();
  return VIDEO_TYPE_SET.has(normalized) ? normalized : "";
};

const normalizeStatus = (value, fallback = "uploading") => {
  const normalized = normalizeString(value).toLowerCase();
  return VIDEO_STATUS_SET.has(normalized) ? normalized : fallback;
};

const normalizeLanguage = (value, fallback = "en") => {
  const normalized = normalizeString(value).toLowerCase();
  return VIDEO_LANGUAGE_SET.has(normalized) ? normalized : fallback;
};

const normalizeEntityId = (value) => {
  const normalized = normalizeString(value);
  if (!normalized) return "";
  return ObjectId.isValid(normalized)
    ? new ObjectId(normalized).toString()
    : normalized;
};

export const serializeVideo = (video = null) => {
  if (!video) return null;
  return {
    id: video._id?.toString?.() || normalizeString(video.id),
    title: normalizeString(video.title),
    type: normalizeType(video.type),
    propertyId: normalizeEntityId(video.propertyId) || null,
    projectId: normalizeEntityId(video.projectId) || null,
    vidmoxVideoId: normalizeString(video.vidmoxVideoId) || null,
    providerUploadId: normalizeString(video.providerUploadId) || null,
    playbackUrl: normalizeString(video.playbackUrl) || null,
    thumbnailUrl: normalizeString(video.thumbnailUrl) || null,
    duration: normalizeNumber(video.duration, 0),
    status: normalizeStatus(video.status),
    language: normalizeLanguage(video.language),
    isHeroVideo: normalizeBoolean(video.isHeroVideo, false),
    sourceFileName: normalizeString(video.sourceFileName) || null,
    mimeType: normalizeString(video.mimeType) || null,
    fileSize: normalizeNumber(video.fileSize, 0) || null,
    providerName: normalizeString(video.providerName) || "vidmox",
    providerState:
      video.providerState && typeof video.providerState === "object"
        ? video.providerState
        : null,
    errorMessage: normalizeString(video.errorMessage) || null,
    createdAt: video.createdAt || null,
    updatedAt: video.updatedAt || null,
  };
};

const getVideoCollection = async () => {
  const db = await getMongoDb();
  return db.collection(VIDEO_COLLECTION_NAME);
};

const clearHeroFlagForSiblings = async (
  collection,
  { type, propertyId = null, projectId = null, excludeId = null } = {}
) => {
  if (!type) return;
  const filter = {
    type,
    ...(type === "property" ? { propertyId } : { projectId }),
  };
  if (excludeId && ObjectId.isValid(excludeId)) {
    filter._id = { $ne: new ObjectId(excludeId) };
  }
  await collection.updateMany(filter, { $set: { isHeroVideo: false } });
};

export const ensureVideoIndexes = async () => {
  if (!indexesPromise) {
    indexesPromise = (async () => {
      const collection = await getVideoCollection();
      await Promise.all([
        collection.createIndex({ type: 1, propertyId: 1, status: 1, language: 1 }),
        collection.createIndex({ type: 1, projectId: 1, status: 1, language: 1 }),
        collection.createIndex({ vidmoxVideoId: 1 }, { sparse: true }),
        collection.createIndex({ providerUploadId: 1 }, { sparse: true }),
        collection.createIndex({ createdAt: -1 }),
      ]);
    })();
  }
  return indexesPromise;
};

export const normalizeVideoInput = (input = {}, { partial = false } = {}) => {
  const hasField = (field) =>
    Object.prototype.hasOwnProperty.call(input || {}, field);
  const normalized = {
    title: hasField("title") ? normalizeString(input.title) : undefined,
    type: hasField("type") ? normalizeType(input.type) : undefined,
    propertyId: hasField("propertyId")
      ? normalizeEntityId(input.propertyId)
      : undefined,
    projectId: hasField("projectId")
      ? normalizeEntityId(input.projectId)
      : undefined,
    vidmoxVideoId: hasField("vidmoxVideoId")
      ? normalizeString(input.vidmoxVideoId)
      : undefined,
    providerUploadId: hasField("providerUploadId")
      ? normalizeString(input.providerUploadId)
      : undefined,
    playbackUrl: hasField("playbackUrl")
      ? normalizeString(input.playbackUrl)
      : undefined,
    thumbnailUrl: hasField("thumbnailUrl")
      ? normalizeString(input.thumbnailUrl)
      : undefined,
    duration: hasField("duration")
      ? normalizeNumber(input.duration, 0)
      : undefined,
    status: hasField("status")
      ? normalizeStatus(input.status, partial ? "" : "uploading")
      : undefined,
    language: hasField("language")
      ? normalizeLanguage(input.language, partial ? "" : "en")
      : undefined,
    isHeroVideo: hasField("isHeroVideo")
      ? normalizeBoolean(input.isHeroVideo, false)
      : undefined,
    sourceFileName: hasField("sourceFileName")
      ? normalizeString(input.sourceFileName)
      : undefined,
    mimeType: hasField("mimeType") ? normalizeString(input.mimeType) : undefined,
    fileSize: hasField("fileSize")
      ? normalizeNumber(input.fileSize, 0)
      : undefined,
    providerName: hasField("providerName")
      ? normalizeString(input.providerName) || "vidmox"
      : undefined,
    providerState: hasField("providerState")
      ? input.providerState && typeof input.providerState === "object"
        ? input.providerState
        : null
      : undefined,
    errorMessage: hasField("errorMessage")
      ? normalizeString(input.errorMessage)
      : undefined,
  };

  if (!partial) {
    if (!normalized.title) {
      throw new Error("Video title is required.");
    }
    if (!normalized.type) {
      throw new Error("Video type must be property or project.");
    }
    if (
      (normalized.type === "property" && !normalized.propertyId) ||
      (normalized.type === "project" && !normalized.projectId)
    ) {
      throw new Error(
        normalized.type === "property"
          ? "propertyId is required for property videos."
          : "projectId is required for project videos."
      );
    }
  }

  if (normalized.type === "property" && normalized.projectId) {
    normalized.projectId = "";
  }
  if (normalized.type === "project" && normalized.propertyId) {
    normalized.propertyId = "";
  }

  return normalized;
};

export const createVideo = async (input = {}) => {
  await ensureVideoIndexes();
  const collection = await getVideoCollection();
  const normalized = normalizeVideoInput(input);
  const now = new Date();
  const document = {
    ...normalized,
    status: normalized.status || "uploading",
    language: normalized.language || "en",
    isHeroVideo: normalizeBoolean(normalized.isHeroVideo, false),
    providerName: normalized.providerName || "vidmox",
    propertyId: normalized.propertyId || null,
    projectId: normalized.projectId || null,
    vidmoxVideoId: normalized.vidmoxVideoId || null,
    providerUploadId: normalized.providerUploadId || null,
    playbackUrl: normalized.playbackUrl || null,
    thumbnailUrl: normalized.thumbnailUrl || null,
    sourceFileName: normalized.sourceFileName || null,
    mimeType: normalized.mimeType || null,
    fileSize: normalized.fileSize || null,
    providerState: normalized.providerState || null,
    errorMessage: normalized.errorMessage || null,
    createdAt: now,
    updatedAt: now,
  };
  if (document.isHeroVideo) {
    await clearHeroFlagForSiblings(collection, {
      type: document.type,
      propertyId: document.propertyId,
      projectId: document.projectId,
    });
  }
  const result = await collection.insertOne(document);
  const created = await collection.findOne({ _id: result.insertedId });
  return serializeVideo(created);
};

export const updateVideoById = async (videoId, input = {}) => {
  await ensureVideoIndexes();
  const collection = await getVideoCollection();
  if (!ObjectId.isValid(videoId)) {
    throw new Error("Invalid video id.");
  }
  const normalized = normalizeVideoInput(input, { partial: true });
  const update = Object.entries(normalized).reduce((accumulator, [key, value]) => {
    if (value === "" && !["playbackUrl", "thumbnailUrl", "errorMessage"].includes(key)) {
      return accumulator;
    }
    if (value === null || value === undefined) return accumulator;
    accumulator[key] = value;
    return accumulator;
  }, {});
  update.updatedAt = new Date();

  if (Object.prototype.hasOwnProperty.call(input, "playbackUrl")) {
    update.playbackUrl = normalizeString(input.playbackUrl) || null;
  }
  if (Object.prototype.hasOwnProperty.call(input, "thumbnailUrl")) {
    update.thumbnailUrl = normalizeString(input.thumbnailUrl) || null;
  }
  if (Object.prototype.hasOwnProperty.call(input, "errorMessage")) {
    update.errorMessage = normalizeString(input.errorMessage) || null;
  }

  const existing = await collection.findOne({ _id: new ObjectId(videoId) });
  if (!existing) {
    throw new Error("Video not found.");
  }
  if (update.isHeroVideo === true) {
    await clearHeroFlagForSiblings(collection, {
      type: update.type || existing.type,
      propertyId:
        update.propertyId !== undefined ? update.propertyId : existing.propertyId,
      projectId:
        update.projectId !== undefined ? update.projectId : existing.projectId,
      excludeId: videoId,
    });
  }

  await collection.updateOne(
    { _id: new ObjectId(videoId) },
    { $set: update }
  );
  const updated = await collection.findOne({ _id: new ObjectId(videoId) });
  return serializeVideo(updated);
};

export const updateVideoByProviderRef = async (
  providerRef = {},
  input = {}
) => {
  await ensureVideoIndexes();
  const collection = await getVideoCollection();
  const filter = {};
  const vidmoxVideoId = normalizeString(providerRef.vidmoxVideoId);
  const providerUploadId = normalizeString(providerRef.providerUploadId);

  if (vidmoxVideoId) {
    filter.vidmoxVideoId = vidmoxVideoId;
  } else if (providerUploadId) {
    filter.providerUploadId = providerUploadId;
  } else {
    return null;
  }

  const normalized = normalizeVideoInput(input, { partial: true });
  const update = Object.entries(normalized).reduce((accumulator, [key, value]) => {
    if (value === "" && !["playbackUrl", "thumbnailUrl", "errorMessage"].includes(key)) {
      return accumulator;
    }
    if (value === null || value === undefined) return accumulator;
    accumulator[key] = value;
    return accumulator;
  }, {});
  update.updatedAt = new Date();

  if (Object.prototype.hasOwnProperty.call(input, "playbackUrl")) {
    update.playbackUrl = normalizeString(input.playbackUrl) || null;
  }
  if (Object.prototype.hasOwnProperty.call(input, "thumbnailUrl")) {
    update.thumbnailUrl = normalizeString(input.thumbnailUrl) || null;
  }
  if (Object.prototype.hasOwnProperty.call(input, "errorMessage")) {
    update.errorMessage = normalizeString(input.errorMessage) || null;
  }

  const existing = await collection.findOne(filter);
  if (!existing) return null;
  if (update.isHeroVideo === true) {
    await clearHeroFlagForSiblings(collection, {
      type: update.type || existing.type,
      propertyId:
        update.propertyId !== undefined ? update.propertyId : existing.propertyId,
      projectId:
        update.projectId !== undefined ? update.projectId : existing.projectId,
      excludeId: existing._id?.toString?.(),
    });
  }

  await collection.updateOne(filter, { $set: update });
  const updated = await collection.findOne(filter);
  return serializeVideo(updated);
};

export const listReadyVideosByEntity = async ({
  type,
  propertyId = "",
  projectId = "",
  language = "",
} = {}) => {
  await ensureVideoIndexes();
  const collection = await getVideoCollection();
  const normalizedType = normalizeType(type);
  if (!normalizedType) return [];

  const entityId =
    normalizedType === "property"
      ? normalizeEntityId(propertyId)
      : normalizeEntityId(projectId);
  if (!entityId) return [];

  const filter = {
    type: normalizedType,
    status: "ready",
    ...(normalizedType === "property"
      ? { propertyId: entityId }
      : { projectId: entityId }),
  };

  const normalizedLanguage = normalizeString(language).toLowerCase();
  if (VIDEO_LANGUAGE_SET.has(normalizedLanguage)) {
    filter.language = normalizedLanguage;
  }

  const videos = await collection
    .find(filter)
    .sort({ isHeroVideo: -1, createdAt: -1 })
    .toArray();
  return videos.map(serializeVideo);
};

export const listVideosForAdmin = async ({ type = "", status = "" } = {}) => {
  await ensureVideoIndexes();
  const collection = await getVideoCollection();
  const filter = {};
  const normalizedType = normalizeType(type);
  const normalizedStatus = normalizeString(status).toLowerCase();

  if (normalizedType) filter.type = normalizedType;
  if (VIDEO_STATUS_SET.has(normalizedStatus)) filter.status = normalizedStatus;

  const videos = await collection
    .find(filter)
    .sort({ createdAt: -1 })
    .limit(200)
    .toArray();
  return videos.map(serializeVideo);
};

export const getVideosForEntityMap = async (entityKeys = []) => {
  await ensureVideoIndexes();
  const collection = await getVideoCollection();
  const normalizedKeys = entityKeys
    .map((item) => ({
      type: normalizeType(item?.type),
      entityId: normalizeEntityId(item?.entityId),
    }))
    .filter((item) => item.type && item.entityId);

  if (normalizedKeys.length === 0) {
    return new Map();
  }

  const propertyIds = normalizedKeys
    .filter((item) => item.type === "property")
    .map((item) => item.entityId);
  const projectIds = normalizedKeys
    .filter((item) => item.type === "project")
    .map((item) => item.entityId);

  const filters = [];
  if (propertyIds.length > 0) {
    filters.push({ type: "property", propertyId: { $in: propertyIds } });
  }
  if (projectIds.length > 0) {
    filters.push({ type: "project", projectId: { $in: projectIds } });
  }

  const videos = await collection
    .find({
      status: "ready",
      $or: filters,
    })
    .sort({ isHeroVideo: -1, createdAt: -1 })
    .toArray();

  const grouped = new Map();
  videos.forEach((video) => {
    const serialized = serializeVideo(video);
    const key =
      serialized.type === "property"
        ? `property:${serialized.propertyId}`
        : `project:${serialized.projectId}`;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key).push(serialized);
  });
  return grouped;
};
