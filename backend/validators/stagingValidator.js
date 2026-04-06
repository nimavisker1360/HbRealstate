import {
  STAGING_STATUS_SET,
  STAGING_STATUS_TRANSITIONS,
  OWNER_TYPES,
  PROPERTY_CONDITIONS,
  FURNISHED_STATES,
  TARGET_GOALS,
  BUDGET_RANGES,
  DESIRED_TIMELINES,
  SERVICE_TYPES,
} from "../constants/staging.js";

const safeString = (value, maxLen = 2000) => {
  if (value === undefined || value === null) return null;
  return String(value).replace(/\s+/g, " ").trim().slice(0, maxLen) || null;
};

const safeFloat = (value) => {
  if (value === undefined || value === null) return null;
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : null;
};

const safeInt = (value) => {
  if (value === undefined || value === null) return null;
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? n : null;
};

const safeBool = (value, fallback = false) => {
  if (value === undefined || value === null) return fallback;
  if (typeof value === "boolean") return value;
  return value === "true" || value === 1;
};

const safeArray = (value) =>
  Array.isArray(value) ? value.filter(Boolean).map(String) : [];

const safeArrayOneOf = (value, allowed) =>
  safeArray(value).filter((v) => allowed.includes(v));

const oneOf = (value, allowed, fallback = null) => {
  const s = safeString(value);
  return s && allowed.includes(s) ? s : fallback;
};

export const validateStagingRequest = (body = {}) => {
  const errors = [];

  const fullName = safeString(body.fullName, 200);
  if (!fullName) errors.push("fullName is required");

  const phone = safeString(body.phone, 40);
  if (!phone) errors.push("phone is required");

  const email = safeString(body.email, 200);
  if (!email) errors.push("email is required");

  if (errors.length > 0) {
    return { valid: false, errors, data: null };
  }

  return {
    valid: true,
    errors: [],
    data: {
      fullName,
      phone,
      email,
      whatsapp: safeString(body.whatsapp, 40),
      ownerType: oneOf(body.ownerType, OWNER_TYPES, "owner"),
      preferredLanguage: safeString(body.preferredLanguage, 10) || "en",
      propertyType: safeString(body.propertyType, 80),
      city: safeString(body.city, 120),
      district: safeString(body.district, 120),
      address: safeString(body.address, 500),
      currentCondition: oneOf(body.currentCondition, PROPERTY_CONDITIONS, null),
      furnishedState: oneOf(body.furnishedState, FURNISHED_STATES, null),
      propertySize: safeFloat(body.propertySize),
      roomCount: safeString(body.roomCount, 20),
      targetGoal: oneOf(body.targetGoal, TARGET_GOALS, null),
      budgetRange: oneOf(body.budgetRange, BUDGET_RANGES, null),
      budgetCurrency: safeString(body.budgetCurrency, 10) || "USD",
      desiredTimeline: oneOf(body.desiredTimeline, DESIRED_TIMELINES, null),
      requestedServices: safeArrayOneOf(body.requestedServices, SERVICE_TYPES),
      propertyUrl: safeString(body.propertyUrl, 500),
      notes: safeString(body.notes, 5000),
      uploadedImages: safeArray(body.uploadedImages),
      consentContact: safeBool(body.consentContact),
      consentDataUse: safeBool(body.consentDataUse),
    },
  };
};

export const validateStagingUpdate = (body = {}) => {
  const data = {};

  if (body.fullName !== undefined) data.fullName = safeString(body.fullName, 200);
  if (body.phone !== undefined) data.phone = safeString(body.phone, 40);
  if (body.email !== undefined) data.email = safeString(body.email, 200);
  if (body.whatsapp !== undefined) data.whatsapp = safeString(body.whatsapp, 40);
  if (body.ownerType !== undefined) data.ownerType = oneOf(body.ownerType, OWNER_TYPES, "owner");
  if (body.preferredLanguage !== undefined) data.preferredLanguage = safeString(body.preferredLanguage, 10);
  if (body.propertyType !== undefined) data.propertyType = safeString(body.propertyType, 80);
  if (body.city !== undefined) data.city = safeString(body.city, 120);
  if (body.district !== undefined) data.district = safeString(body.district, 120);
  if (body.address !== undefined) data.address = safeString(body.address, 500);
  if (body.currentCondition !== undefined) data.currentCondition = oneOf(body.currentCondition, PROPERTY_CONDITIONS, null);
  if (body.furnishedState !== undefined) data.furnishedState = oneOf(body.furnishedState, FURNISHED_STATES, null);
  if (body.propertySize !== undefined) data.propertySize = safeFloat(body.propertySize);
  if (body.roomCount !== undefined) data.roomCount = safeString(body.roomCount, 20);
  if (body.targetGoal !== undefined) data.targetGoal = oneOf(body.targetGoal, TARGET_GOALS, null);
  if (body.budgetRange !== undefined) data.budgetRange = oneOf(body.budgetRange, BUDGET_RANGES, null);
  if (body.desiredTimeline !== undefined) data.desiredTimeline = oneOf(body.desiredTimeline, DESIRED_TIMELINES, null);
  if (body.requestedServices !== undefined) data.requestedServices = safeArrayOneOf(body.requestedServices, SERVICE_TYPES);
  if (body.propertyUrl !== undefined) data.propertyUrl = safeString(body.propertyUrl, 500);
  if (body.notes !== undefined) data.notes = safeString(body.notes, 5000);
  if (body.uploadedImages !== undefined) data.uploadedImages = safeArray(body.uploadedImages);
  if (body.internalNotes !== undefined) data.internalNotes = safeString(body.internalNotes, 5000);
  if (body.assignedConsultantId !== undefined) data.assignedConsultantId = safeString(body.assignedConsultantId, 80);
  if (body.visitScheduleNotes !== undefined) data.visitScheduleNotes = safeString(body.visitScheduleNotes, 2000);
  if (body.visitScheduledAt !== undefined) {
    if (body.visitScheduledAt === null || body.visitScheduledAt === "") {
      data.visitScheduledAt = null;
    } else {
      const d = new Date(body.visitScheduledAt);
      data.visitScheduledAt = Number.isNaN(d.getTime()) ? null : d;
    }
  }

  return { data };
};

export const validateStagingStatusTransition = (currentStatus, nextStatus) => {
  if (!STAGING_STATUS_SET.has(nextStatus)) {
    return { valid: false, message: `Invalid status: ${nextStatus}` };
  }
  const allowed = STAGING_STATUS_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(nextStatus)) {
    return {
      valid: false,
      message: `Cannot transition from "${currentStatus}" to "${nextStatus}". Allowed: ${allowed.join(", ") || "none"}`,
    };
  }
  return { valid: true };
};

export const validateProjectUpdate = (body = {}) => {
  const data = {};

  if (body.title !== undefined) data.title = safeString(body.title, 300);
  if (body.title_en !== undefined) data.title_en = safeString(body.title_en, 300);
  if (body.title_tr !== undefined) data.title_tr = safeString(body.title_tr, 300);
  if (body.title_ru !== undefined) data.title_ru = safeString(body.title_ru, 300);
  if (body.slug !== undefined) data.slug = safeString(body.slug, 200);
  if (body.city !== undefined) data.city = safeString(body.city, 120);
  if (body.district !== undefined) data.district = safeString(body.district, 120);
  if (body.propertyType !== undefined) data.propertyType = safeString(body.propertyType, 80);
  if (body.projectCategory !== undefined) data.projectCategory = safeString(body.projectCategory, 80);
  if (body.packageId !== undefined) data.packageId = safeString(body.packageId, 80) || undefined;
  if (body.assignedPartners !== undefined) data.assignedPartners = body.assignedPartners;
  if (body.budgetEstimate !== undefined) data.budgetEstimate = safeFloat(body.budgetEstimate);
  if (body.budgetCurrency !== undefined) data.budgetCurrency = safeString(body.budgetCurrency, 10);
  if (body.timelineEstimate !== undefined) data.timelineEstimate = safeString(body.timelineEstimate, 80);
  if (body.timelineEstimate_en !== undefined) data.timelineEstimate_en = safeString(body.timelineEstimate_en, 80);
  if (body.timelineEstimate_tr !== undefined) data.timelineEstimate_tr = safeString(body.timelineEstimate_tr, 80);
  if (body.timelineEstimate_ru !== undefined) data.timelineEstimate_ru = safeString(body.timelineEstimate_ru, 80);
  if (body.servicesIncluded !== undefined) data.servicesIncluded = safeArrayOneOf(body.servicesIncluded, SERVICE_TYPES);
  if (body.beforePhotos !== undefined) data.beforePhotos = safeArray(body.beforePhotos);
  if (body.beforeVideos !== undefined) data.beforeVideos = safeArray(body.beforeVideos);
  if (body.afterPhotos !== undefined) data.afterPhotos = safeArray(body.afterPhotos);
  if (body.afterVideos !== undefined) data.afterVideos = safeArray(body.afterVideos);
  if (body.floorPlanUrl !== undefined) data.floorPlanUrl = safeString(body.floorPlanUrl, 500);
  if (body.virtualTourUrl !== undefined) data.virtualTourUrl = safeString(body.virtualTourUrl, 500);
  if (body.droneFootageUrl !== undefined) data.droneFootageUrl = safeString(body.droneFootageUrl, 500);
  if (body.expectedValueUplift !== undefined) data.expectedValueUplift = safeFloat(body.expectedValueUplift);
  if (body.expectedRentalUplift !== undefined) data.expectedRentalUplift = safeFloat(body.expectedRentalUplift);
  if (body.expectedSaleSpeedDays !== undefined) data.expectedSaleSpeedDays = safeInt(body.expectedSaleSpeedDays);
  if (body.caseStudyContent !== undefined) data.caseStudyContent = body.caseStudyContent;
  if (body.caseStudyContent_en !== undefined) data.caseStudyContent_en = body.caseStudyContent_en;
  if (body.caseStudyContent_tr !== undefined) data.caseStudyContent_tr = body.caseStudyContent_tr;
  if (body.caseStudyContent_ru !== undefined) data.caseStudyContent_ru = body.caseStudyContent_ru;
  if (body.published !== undefined) data.published = safeBool(body.published);
  if (body.notes !== undefined) data.notes = safeString(body.notes, 5000);
  if (body.status !== undefined) data.status = safeString(body.status, 40);

  if (body.actualStartDate !== undefined) {
    const d = new Date(body.actualStartDate);
    data.actualStartDate = Number.isNaN(d.getTime()) ? null : d;
  }
  if (body.actualEndDate !== undefined) {
    const d = new Date(body.actualEndDate);
    data.actualEndDate = Number.isNaN(d.getTime()) ? null : d;
  }

  return { data };
};
