import { ObjectId } from "mongodb";
import { getMongoDb } from "../config/prismaConfig.js";

export const VIDEO_EVENT_COLLECTION_NAME = "VideoEvent";
export const VIDEO_EVENT_TYPES = [
  "play",
  "progress_25",
  "progress_50",
  "progress_75",
  "progress_90",
  "completed",
  "cta_clicked",
];

const VIDEO_EVENT_TYPE_SET = new Set(VIDEO_EVENT_TYPES);
let indexesPromise = null;

const normalizeString = (value, fallback = "") => {
  const normalized = String(value || "").trim();
  return normalized || fallback;
};

const normalizeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeEntityId = (value) => {
  const normalized = normalizeString(value);
  if (!normalized) return "";
  return ObjectId.isValid(normalized)
    ? new ObjectId(normalized).toString()
    : normalized;
};

const normalizeEventType = (value) => {
  const normalized = normalizeString(value).toLowerCase();
  return VIDEO_EVENT_TYPE_SET.has(normalized) ? normalized : "";
};

export const serializeVideoEvent = (event = null) => {
  if (!event) return null;
  return {
    id: event._id?.toString?.() || normalizeString(event.id),
    anonymousUserId: normalizeString(event.anonymousUserId),
    leadId: normalizeEntityId(event.leadId) || null,
    propertyId: normalizeEntityId(event.propertyId) || null,
    projectId: normalizeEntityId(event.projectId) || null,
    videoId: normalizeEntityId(event.videoId),
    eventType: normalizeEventType(event.eventType),
    watchPercent: normalizeNumber(event.watchPercent, 0),
    source: normalizeString(event.source),
    gclid: normalizeString(event.gclid) || null,
    gbraid: normalizeString(event.gbraid) || null,
    wbraid: normalizeString(event.wbraid) || null,
    utm_source: normalizeString(event.utm_source) || null,
    utm_medium: normalizeString(event.utm_medium) || null,
    utm_campaign: normalizeString(event.utm_campaign) || null,
    utm_term: normalizeString(event.utm_term) || null,
    utm_content: normalizeString(event.utm_content) || null,
    landing_page: normalizeString(event.landing_page) || null,
    referrer: normalizeString(event.referrer) || null,
    createdAt: event.createdAt || null,
  };
};

const getVideoEventCollection = async () => {
  const db = await getMongoDb();
  return db.collection(VIDEO_EVENT_COLLECTION_NAME);
};

export const ensureVideoEventIndexes = async () => {
  if (!indexesPromise) {
    indexesPromise = (async () => {
      const collection = await getVideoEventCollection();
      await Promise.all([
        collection.createIndex({ anonymousUserId: 1, createdAt: -1 }),
        collection.createIndex({ leadId: 1, createdAt: -1 }, { sparse: true }),
        collection.createIndex({ videoId: 1, eventType: 1, createdAt: -1 }),
        collection.createIndex({ propertyId: 1, projectId: 1, createdAt: -1 }),
      ]);
    })();
  }
  return indexesPromise;
};

export const normalizeVideoEventInput = (input = {}) => {
  const normalized = {
    anonymousUserId: normalizeString(input.anonymousUserId),
    leadId: normalizeEntityId(input.leadId),
    propertyId: normalizeEntityId(input.propertyId),
    projectId: normalizeEntityId(input.projectId),
    videoId: normalizeEntityId(input.videoId),
    eventType: normalizeEventType(input.eventType),
    watchPercent: normalizeNumber(input.watchPercent, 0),
    source: normalizeString(input.source),
    gclid: normalizeString(input.gclid),
    gbraid: normalizeString(input.gbraid),
    wbraid: normalizeString(input.wbraid),
    utm_source: normalizeString(input.utm_source),
    utm_medium: normalizeString(input.utm_medium),
    utm_campaign: normalizeString(input.utm_campaign),
    utm_term: normalizeString(input.utm_term),
    utm_content: normalizeString(input.utm_content),
    landing_page: normalizeString(input.landing_page),
    referrer: normalizeString(input.referrer),
  };

  if (!normalized.anonymousUserId) {
    throw new Error("anonymousUserId is required.");
  }
  if (!normalized.videoId) {
    throw new Error("videoId is required.");
  }
  if (!normalized.eventType) {
    throw new Error("Unsupported video event type.");
  }

  return normalized;
};

export const createVideoEvent = async (input = {}) => {
  await ensureVideoEventIndexes();
  const collection = await getVideoEventCollection();
  const normalized = normalizeVideoEventInput(input);
  const document = {
    ...normalized,
    leadId: normalized.leadId || null,
    propertyId: normalized.propertyId || null,
    projectId: normalized.projectId || null,
    gclid: normalized.gclid || null,
    gbraid: normalized.gbraid || null,
    wbraid: normalized.wbraid || null,
    utm_source: normalized.utm_source || null,
    utm_medium: normalized.utm_medium || null,
    utm_campaign: normalized.utm_campaign || null,
    utm_term: normalized.utm_term || null,
    utm_content: normalized.utm_content || null,
    landing_page: normalized.landing_page || null,
    referrer: normalized.referrer || null,
    createdAt: new Date(),
  };
  const result = await collection.insertOne(document);
  const created = await collection.findOne({ _id: result.insertedId });
  return serializeVideoEvent(created);
};

export const listVideoEventsForScoring = async ({
  anonymousUserId = "",
  leadId = "",
} = {}) => {
  await ensureVideoEventIndexes();
  const collection = await getVideoEventCollection();
  const filters = [];
  const normalizedAnonymousUserId = normalizeString(anonymousUserId);
  const normalizedLeadId = normalizeEntityId(leadId);

  if (normalizedAnonymousUserId) {
    filters.push({ anonymousUserId: normalizedAnonymousUserId });
  }
  if (normalizedLeadId) {
    filters.push({ leadId: normalizedLeadId });
  }
  if (filters.length === 0) return [];

  const events = await collection
    .find({ $or: filters })
    .sort({ createdAt: 1 })
    .toArray();
  return events.map(serializeVideoEvent);
};
