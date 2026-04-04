// ============================================================
// HB RealstateServices — Phase 3: Staging / Renovation Constants
// ============================================================

export const STAGING_STATUSES = [
  "new",
  "qualified",
  "proposal_sent",
  "approved",
  "planning",
  "in_progress",
  "content_pending",
  "completed",
  "published",
  "closed",
  "cancelled",
];

export const STAGING_STATUS_SET = new Set(STAGING_STATUSES);

export const STAGING_STATUS_TRANSITIONS = {
  new: ["qualified", "cancelled"],
  qualified: ["proposal_sent", "cancelled"],
  proposal_sent: ["approved", "cancelled"],
  approved: ["planning", "cancelled"],
  planning: ["in_progress", "cancelled"],
  in_progress: ["content_pending", "completed", "cancelled"],
  content_pending: ["completed"],
  completed: ["published", "closed"],
  published: ["closed"],
  closed: [],
  cancelled: ["new"],
};

export const STAGING_PROJECT_STATUSES = [
  "planning",
  "in_progress",
  "content_pending",
  "completed",
  "published",
  "on_hold",
  "cancelled",
];

export const OWNER_TYPES = ["owner", "agent", "investor", "developer"];

export const PROPERTY_CONDITIONS = [
  "new",
  "excellent",
  "good",
  "needs-minor",
  "needs-major",
  "renovation-required",
];

export const FURNISHED_STATES = [
  "furnished",
  "semi-furnished",
  "unfurnished",
];

export const TARGET_GOALS = [
  "sell-faster",
  "increase-value",
  "rental-income",
  "portfolio-upgrade",
];

export const BUDGET_RANGES = [
  "under-5k",
  "5k-15k",
  "15k-30k",
  "30k-50k",
  "50k-plus",
  "flexible",
];

export const DESIRED_TIMELINES = [
  "1-month",
  "3-months",
  "6-months",
  "flexible",
];

export const SERVICE_TYPES = [
  "renovation",
  "staging",
  "photography",
  "video",
  "drone",
  "virtual-tour",
  "floor-plan",
];

export const PACKAGE_CATEGORIES = [
  "visual-refresh",
  "sale-ready",
  "premium-boost",
];

// Default package definitions (used to seed ServicePackage collection)
export const DEFAULT_PACKAGES = [
  {
    name: "Visual Refresh",
    slug: "visual-refresh",
    category: "visual-refresh",
    servicesIncluded: ["staging", "photography"],
    priceFrom: 1500,
    priceTo: 5000,
    priceCurrency: "USD",
    estimatedDays: 7,
    description:
      "Light staging, professional photography, and minor cosmetic improvements to boost online appeal.",
  },
  {
    name: "Sale Ready",
    slug: "sale-ready",
    category: "sale-ready",
    servicesIncluded: [
      "renovation",
      "staging",
      "photography",
      "video",
      "floor-plan",
    ],
    priceFrom: 5000,
    priceTo: 25000,
    priceCurrency: "USD",
    estimatedDays: 30,
    description:
      "Strategic renovation, full staging, professional photo/video, and floor plans to maximize sale price.",
  },
  {
    name: "Premium Listing Boost",
    slug: "premium-boost",
    category: "premium-boost",
    servicesIncluded: [
      "renovation",
      "staging",
      "photography",
      "video",
      "drone",
      "virtual-tour",
      "floor-plan",
    ],
    priceFrom: 25000,
    priceTo: 75000,
    priceCurrency: "USD",
    estimatedDays: 60,
    description:
      "Complete transformation with premium renovation, luxury staging, drone footage, virtual tours, and full content package.",
  },
];
