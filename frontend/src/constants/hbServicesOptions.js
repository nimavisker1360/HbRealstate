/** Values must match backend validators (inspection / staging). */

export const INSPECTION_REQUESTER_TYPES = [
  "owner",
  "buyer",
  "agent",
  "investor",
  "tenant",
  "other",
];

export const INSPECTION_REQUEST_TYPES = [
  "standard",
  "premium",
  "pre-purchase",
  "investment",
];

export const INSPECTION_URGENCY = ["urgent", "normal", "flexible"];

export const INSPECTION_OCCUPANCY = [
  "occupied",
  "vacant",
  "under-construction",
  "unknown",
];

export const STAGING_OWNER_TYPES = ["owner", "agent", "investor", "developer"];

export const STAGING_PROPERTY_CONDITIONS = [
  "new",
  "excellent",
  "good",
  "needs-minor",
  "needs-major",
  "renovation-required",
];

export const STAGING_FURNISHED = [
  "furnished",
  "semi-furnished",
  "unfurnished",
];

export const STAGING_TARGET_GOALS = [
  "sell-faster",
  "increase-value",
  "rental-income",
  "portfolio-upgrade",
];

export const STAGING_BUDGET_RANGES = [
  "under-5k",
  "5k-15k",
  "15k-30k",
  "30k-50k",
  "50k-plus",
  "flexible",
];

export const STAGING_TIMELINES = [
  "1-month",
  "3-months",
  "6-months",
  "flexible",
];

export const STAGING_SERVICE_TYPES = [
  "renovation",
  "staging",
  "photography",
  "video",
  "drone",
  "virtual-tour",
  "floor-plan",
];
