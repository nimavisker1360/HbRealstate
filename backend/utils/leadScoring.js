const EVENT_SCORES = {
  progress_25: 5,
  progress_50: 15,
  progress_75: 25,
  progress_90: 40,
  completed: 50,
  cta_clicked: 60,
};

const normalizeString = (value, fallback = "") => {
  const normalized = String(value || "").trim();
  return normalized || fallback;
};

const normalizeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const getCategoryFromScore = (score) => {
  if (score >= 71) return "hot";
  if (score >= 31) return "warm";
  return "cold";
};

export const scoreLeadFromVideoEvents = ({
  events = [],
  context = {},
} = {}) => {
  const normalizedEvents = Array.isArray(events) ? events : [];
  const dedupedMilestones = new Set();
  const watchedEntityBuckets = new Map();
  const reasons = [];
  let score = 0;

  normalizedEvents.forEach((event) => {
    const eventType = normalizeString(event?.eventType).toLowerCase();
    const videoId = normalizeString(event?.videoId);
    const milestoneKey = `${videoId}:${eventType}`;

    if (EVENT_SCORES[eventType] && !dedupedMilestones.has(milestoneKey)) {
      dedupedMilestones.add(milestoneKey);
      score += EVENT_SCORES[eventType];
      reasons.push(eventType);
    }

    const entityKey =
      normalizeString(event?.projectId) || normalizeString(event?.propertyId);
    if (!entityKey || !videoId) return;

    if (!watchedEntityBuckets.has(entityKey)) {
      watchedEntityBuckets.set(entityKey, new Set());
    }
    if (
      ["play", "progress_25", "progress_50", "progress_75", "progress_90", "completed"].includes(
        eventType
      )
    ) {
      watchedEntityBuckets.get(entityKey).add(videoId);
    }
  });

  if (
    Array.from(watchedEntityBuckets.values()).some((videoIds) => videoIds.size >= 2)
  ) {
    score += 30;
    reasons.push("watched_multiple_videos_same_entity");
  }

  const priceUsd = normalizeNumber(context?.priceUsd, 0);
  const citizenshipIntent =
    context?.userIntentCitizenship === true ||
    normalizeString(context?.userIntent).toLowerCase() === "citizenship";
  if (priceUsd > 400000 && citizenshipIntent) {
    score += 30;
    reasons.push("citizenship_price_fit");
  }

  const installmentIntent =
    context?.userIntentInstallment === true ||
    normalizeString(context?.userIntent).toLowerCase() === "installment";
  if (context?.isInstallmentProperty === true && installmentIntent) {
    score += 25;
    reasons.push("installment_fit");
  }

  return {
    score,
    category: getCategoryFromScore(score),
    reasons,
  };
};
