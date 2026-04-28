import { getVideosForEntityMap } from "../models/videoModel.js";

const normalizeString = (value, fallback = "") => {
  const normalized = String(value || "").trim();
  return normalized || fallback;
};

const normalizeRecommendationType = (item = {}) => {
  const propertyType = normalizeString(item.property_type).toLowerCase();
  if (["local-project", "international-project", "project", "projects"].includes(propertyType)) {
    return "project";
  }
  return "property";
};

export const attachVideosToRecommendations = async (items = []) => {
  const recommendations = Array.isArray(items) ? items : [];
  if (recommendations.length === 0) return [];

  const entityKeys = recommendations.map((item) => ({
    type: normalizeRecommendationType(item),
    entityId: normalizeString(item.id),
  }));
  const videosByEntity = await getVideosForEntityMap(entityKeys);

  return recommendations.map((item) => {
    const entityType = normalizeRecommendationType(item);
    const entityKey = `${entityType}:${normalizeString(item.id)}`;
    const videos = videosByEntity.get(entityKey) || [];
    return {
      ...item,
      videos,
      heroVideo: videos.find((video) => video.isHeroVideo) || videos[0] || null,
    };
  });
};
