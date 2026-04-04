import {
  INSPECTION_STATUS_SET,
  INSPECTION_STATUS_TRANSITIONS,
  INSPECTION_REQUEST_TYPES,
  INSPECTION_URGENCY_LEVELS,
  REQUESTER_TYPES,
  CHECKLIST_ITEM_STATUSES,
} from "../constants/inspection.js";

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

const oneOf = (value, allowed, fallback = null) => {
  const s = safeString(value);
  return s && allowed.includes(s) ? s : fallback;
};

export const validateInspectionRequest = (body = {}) => {
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
      requesterType: oneOf(body.requesterType, REQUESTER_TYPES, "owner"),
      preferredLanguage: safeString(body.preferredLanguage, 10) || "en",
      propertyType: safeString(body.propertyType, 80),
      city: safeString(body.city, 120),
      district: safeString(body.district, 120),
      address: safeString(body.address, 500),
      propertyUrl: safeString(body.propertyUrl, 500),
      referenceCode: safeString(body.referenceCode, 100),
      grossArea: safeFloat(body.grossArea),
      netArea: safeFloat(body.netArea),
      buildingAge: safeInt(body.buildingAge),
      floorNumber: safeInt(body.floorNumber),
      totalFloors: safeInt(body.totalFloors),
      occupancyStatus: safeString(body.occupancyStatus, 40),
      requestType: oneOf(body.requestType, INSPECTION_REQUEST_TYPES, "standard"),
      urgency: oneOf(body.urgency, INSPECTION_URGENCY_LEVELS, "normal"),
      notes: safeString(body.notes, 5000),
      uploadedImages: safeArray(body.uploadedImages),
      consentContact: safeBool(body.consentContact),
      consentDataUse: safeBool(body.consentDataUse),
    },
  };
};

export const validateInspectionUpdate = (body = {}) => {
  const data = {};

  if (body.fullName !== undefined) data.fullName = safeString(body.fullName, 200);
  if (body.phone !== undefined) data.phone = safeString(body.phone, 40);
  if (body.email !== undefined) data.email = safeString(body.email, 200);
  if (body.whatsapp !== undefined) data.whatsapp = safeString(body.whatsapp, 40);
  if (body.requesterType !== undefined) data.requesterType = oneOf(body.requesterType, REQUESTER_TYPES, "owner");
  if (body.preferredLanguage !== undefined) data.preferredLanguage = safeString(body.preferredLanguage, 10);
  if (body.propertyType !== undefined) data.propertyType = safeString(body.propertyType, 80);
  if (body.city !== undefined) data.city = safeString(body.city, 120);
  if (body.district !== undefined) data.district = safeString(body.district, 120);
  if (body.address !== undefined) data.address = safeString(body.address, 500);
  if (body.propertyUrl !== undefined) data.propertyUrl = safeString(body.propertyUrl, 500);
  if (body.referenceCode !== undefined) data.referenceCode = safeString(body.referenceCode, 100);
  if (body.grossArea !== undefined) data.grossArea = safeFloat(body.grossArea);
  if (body.netArea !== undefined) data.netArea = safeFloat(body.netArea);
  if (body.buildingAge !== undefined) data.buildingAge = safeInt(body.buildingAge);
  if (body.floorNumber !== undefined) data.floorNumber = safeInt(body.floorNumber);
  if (body.totalFloors !== undefined) data.totalFloors = safeInt(body.totalFloors);
  if (body.occupancyStatus !== undefined) data.occupancyStatus = safeString(body.occupancyStatus, 40);
  if (body.requestType !== undefined) data.requestType = oneOf(body.requestType, INSPECTION_REQUEST_TYPES, "standard");
  if (body.urgency !== undefined) data.urgency = oneOf(body.urgency, INSPECTION_URGENCY_LEVELS, "normal");
  if (body.notes !== undefined) data.notes = safeString(body.notes, 5000);
  if (body.uploadedImages !== undefined) data.uploadedImages = safeArray(body.uploadedImages);
  if (body.internalNotes !== undefined) data.internalNotes = safeString(body.internalNotes, 5000);
  if (body.assignedInspector !== undefined) data.assignedInspector = safeString(body.assignedInspector, 200);
  if (body.assignedPartner !== undefined) data.assignedPartner = safeString(body.assignedPartner, 200);
  if (body.scheduledDate !== undefined) {
    const d = new Date(body.scheduledDate);
    data.scheduledDate = Number.isNaN(d.getTime()) ? null : d;
  }

  return { data };
};

export const validateStatusTransition = (currentStatus, nextStatus) => {
  if (!INSPECTION_STATUS_SET.has(nextStatus)) {
    return { valid: false, message: `Invalid status: ${nextStatus}` };
  }
  const allowed = INSPECTION_STATUS_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(nextStatus)) {
    return {
      valid: false,
      message: `Cannot transition from "${currentStatus}" to "${nextStatus}". Allowed: ${allowed.join(", ") || "none"}`,
    };
  }
  return { valid: true };
};

export const validateChecklistItems = (items) => {
  if (!Array.isArray(items)) return [];
  return items
    .filter((item) => item && typeof item === "object")
    .map((item) => ({
      key: safeString(item.key, 100) || "unnamed",
      label: safeString(item.label, 200) || "",
      status: oneOf(item.status, CHECKLIST_ITEM_STATUSES, "not_checked"),
      note: safeString(item.note, 2000),
      severity: safeString(item.severity, 20),
      repairCostEstimate: safeFloat(item.repairCostEstimate),
      photoRefs: safeArray(item.photoRefs),
    }));
};
