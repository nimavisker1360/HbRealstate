// ============================================================
// HB RealstateServices — Phase 2: Inspection Constants
// ============================================================

export const INSPECTION_STATUSES = [
  "new",
  "contacted",
  "scheduled",
  "in_review",
  "inspection_completed",
  "report_drafting",
  "report_ready",
  "delivered",
  "closed",
  "cancelled",
];

export const INSPECTION_STATUS_SET = new Set(INSPECTION_STATUSES);

// Allowed forward transitions (key = current status, value = allowed next statuses)
export const INSPECTION_STATUS_TRANSITIONS = {
  new: ["contacted", "scheduled", "cancelled"],
  contacted: ["scheduled", "cancelled"],
  scheduled: ["in_review", "cancelled"],
  in_review: ["inspection_completed", "cancelled"],
  inspection_completed: ["report_drafting"],
  report_drafting: ["report_ready"],
  report_ready: ["delivered"],
  delivered: ["closed"],
  closed: [],
  cancelled: ["new"],
};

export const INSPECTION_REQUEST_TYPES = [
  "standard",
  "premium",
  "pre-purchase",
  "investment",
];

export const INSPECTION_URGENCY_LEVELS = ["urgent", "normal", "flexible"];

export const REQUESTER_TYPES = [
  "owner",
  "buyer",
  "agent",
  "investor",
  "tenant",
  "other",
];

export const OCCUPANCY_STATUSES = [
  "occupied",
  "vacant",
  "under-construction",
  "unknown",
];

export const CHECKLIST_ITEM_STATUSES = [
  "good",
  "acceptable",
  "risky",
  "critical",
  "not_checked",
];

export const CHECKLIST_SEVERITY_LEVELS = [
  "none",
  "low",
  "medium",
  "high",
  "critical",
];

// Checklist sections with their scoring weights (must sum to 100)
export const CHECKLIST_SECTIONS = {
  structuralSafety: {
    key: "structuralSafety",
    label: "Structural Safety",
    weight: 35,
  },
  utilitiesPlumbing: {
    key: "utilitiesPlumbing",
    label: "Utilities / Plumbing / Heating",
    weight: 25,
  },
  electricalSafety: {
    key: "electricalSafety",
    label: "Electrical Safety",
    weight: 15,
  },
  comfortInsulation: {
    key: "comfortInsulation",
    label: "Comfort / Insulation",
    weight: 15,
  },
  legalCompliance: {
    key: "legalCompliance",
    label: "Legal / Compliance",
    weight: 10,
  },
};

// Risk label thresholds (evaluated top-down, first match wins)
export const RISK_LABEL_THRESHOLDS = [
  { min: 85, label: "strong" },
  { min: 70, label: "good" },
  { min: 50, label: "needs_attention" },
  { min: 0, label: "high_risk" },
];

export const REPORT_STATUSES = ["draft", "review", "final", "delivered"];
