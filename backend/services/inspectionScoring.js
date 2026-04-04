// ============================================================
// HB RealstateServices — Inspection Scoring Engine
// ============================================================
//
// Scoring methodology:
//   1. Each checklist section contains items with a `status` field.
//   2. Each status maps to a numeric value (0–100):
//        good=100, acceptable=75, risky=40, critical=10, not_checked=null (excluded)
//   3. A section score is the average of its checked items.
//   4. The total score is a weighted average of section scores using CHECKLIST_SECTIONS weights.
//   5. The risk label is derived from the total score using RISK_LABEL_THRESHOLDS.
//
// If a section has zero checked items, it receives null and its weight
// is redistributed proportionally among scored sections.

import {
  CHECKLIST_SECTIONS,
  RISK_LABEL_THRESHOLDS,
} from "../constants/inspection.js";

const STATUS_SCORES = {
  good: 100,
  acceptable: 75,
  risky: 40,
  critical: 10,
  not_checked: null,
};

const isValidItem = (item) =>
  item &&
  typeof item === "object" &&
  typeof item.status === "string" &&
  STATUS_SCORES[item.status] !== undefined;

/**
 * Compute the average score for an array of checklist items.
 * Items with status "not_checked" are excluded.
 * Returns null if no scoreable items exist.
 */
export const computeSectionScore = (items) => {
  if (!Array.isArray(items) || items.length === 0) return null;

  let sum = 0;
  let count = 0;

  for (const item of items) {
    if (!isValidItem(item)) continue;
    const value = STATUS_SCORES[item.status];
    if (value === null) continue;
    sum += value;
    count += 1;
  }

  return count > 0 ? Math.round((sum / count) * 100) / 100 : null;
};

/**
 * Compute the risk label from a total score.
 */
export const computeRiskLabel = (totalScore) => {
  if (totalScore === null || totalScore === undefined) return null;
  for (const { min, label } of RISK_LABEL_THRESHOLDS) {
    if (totalScore >= min) return label;
  }
  return "high_risk";
};

/**
 * Compute scores from a full checklist data object.
 *
 * @param {Object} checklistData — keys matching CHECKLIST_SECTIONS keys,
 *   each value is an array of checklist items.
 * @returns {{ sectionScores: Object, totalScore: number|null, riskLabel: string|null }}
 */
export const computeInspectionScores = (checklistData) => {
  if (!checklistData || typeof checklistData !== "object") {
    return { sectionScores: {}, totalScore: null, riskLabel: null };
  }

  const sectionScores = {};
  let weightedSum = 0;
  let totalWeight = 0;

  for (const [key, config] of Object.entries(CHECKLIST_SECTIONS)) {
    const items = checklistData[key];
    const score = computeSectionScore(items);
    sectionScores[key] = score;

    if (score !== null) {
      weightedSum += score * config.weight;
      totalWeight += config.weight;
    }
  }

  const totalScore =
    totalWeight > 0
      ? Math.round((weightedSum / totalWeight) * 100) / 100
      : null;

  const riskLabel = computeRiskLabel(totalScore);

  return { sectionScores, totalScore, riskLabel };
};
