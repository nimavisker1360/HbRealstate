const normalizeLanguage = (language = "en") => {
  const normalized = String(language || "").toLowerCase();
  if (normalized.startsWith("tr")) return "tr";
  if (normalized.startsWith("ru")) return "ru";
  return "en";
};

const toDisplayLabel = (value = "") => {
  const normalized = String(value || "").trim();
  if (!normalized) return "";
  return normalized
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const ALT_TEMPLATES = {
  en: {
    featuredPropertyFilm: "HB International featured property film",
    featuredResidence: "HB International featured residence",
    locationHero: ({ location }) => `${toDisplayLabel(location) || "Property"} hero image`,
    countryArticles: ({ country }) => `Real estate articles about ${country || "this market"}`,
    consultantsBanner: "Real estate consultants banner",
    consultantPhoto: ({ name }) => (name ? `${name} consultant photo` : "Consultant photo"),
    moreAgents: ({ count }) =>
      count ? `${count}+ more real estate consultants` : "More real estate consultants",
    modernBuilding: "Modern residential building exterior at night",
    localProjectsHero: "Local housing projects hero image",
    aboutArnavutkoyCard: "Arnavutkoy investment area",
    aboutSalamisCard: "Salamis Holiday Home project",
    aboutFeaturedPropertyCard: "Featured property",
    blogImage: ({ title, index }) =>
      `${title || "Blog article"} image${index ? ` ${index}` : ""}`,
    blogThumbnail: ({ title, index }) =>
      `${title || "Blog article"} thumbnail ${index || 1}`,
    blogArticleImage: ({ title, index }) =>
      `${title || "Blog article"} article image${index ? ` ${index}` : ""}`,
    propertyImage: ({ title, index }) =>
      `${title || "Property"} image${index ? ` ${index}` : ""}`,
    propertyThumbnail: ({ title, index }) =>
      `${title || "Property"} thumbnail ${index || 1}`,
    projectImage: ({ title, index }) =>
      `${title || "Project"} image${index ? ` ${index}` : ""}`,
    projectThumbnail: ({ title, index }) =>
      `${title || "Project"} thumbnail ${index || 1}`,
    projectVideoPreview: ({ title }) =>
      `${title || "Project"} video preview`,
    projectVideo: ({ title, index }) =>
      `${title || "Project"} video ${index || 1}`,
    projectLocationMap: ({ title }) =>
      `${title || "Project"} location map`,
    projectSitePlan: ({ title }) =>
      `${title || "Project"} site plan`,
    floorPlan: ({ title, variant }) =>
      [title, variant].filter(Boolean).join(" - ") || "Floor plan",
  },
  tr: {
    featuredPropertyFilm: "HB International one cikan gayrimenkul videosu",
    featuredResidence: "HB International one cikan konut gorseli",
    locationHero: ({ location }) => `${toDisplayLabel(location) || "Gayrimenkul"} hero gorseli`,
    countryArticles: ({ country }) => `${country || "bu pazar"} hakkinda emlak yazilari`,
    consultantsBanner: "Gayrimenkul danismanlari banner gorseli",
    consultantPhoto: ({ name }) => (name ? `${name} danisman fotografi` : "Danisman fotografi"),
    moreAgents: ({ count }) =>
      count ? `${count}+ ek gayrimenkul danismani` : "Daha fazla gayrimenkul danismani",
    modernBuilding: "Gece cekilmis modern konut binasi dis cephe gorseli",
    localProjectsHero: "Yurt ici konut projeleri hero gorseli",
    aboutArnavutkoyCard: "Arnavutkoy yatirim bolgesi",
    aboutSalamisCard: "Salamis Holiday Home projesi",
    aboutFeaturedPropertyCard: "One cikan gayrimenkul",
    blogImage: ({ title, index }) =>
      `${title || "Blog yazisi"} gorseli${index ? ` ${index}` : ""}`,
    blogThumbnail: ({ title, index }) =>
      `${title || "Blog yazisi"} kucuk gorseli ${index || 1}`,
    blogArticleImage: ({ title, index }) =>
      `${title || "Blog yazisi"} icerik gorseli${index ? ` ${index}` : ""}`,
    propertyImage: ({ title, index }) =>
      `${title || "Gayrimenkul"} gorseli${index ? ` ${index}` : ""}`,
    propertyThumbnail: ({ title, index }) =>
      `${title || "Gayrimenkul"} kucuk gorseli ${index || 1}`,
    projectImage: ({ title, index }) =>
      `${title || "Proje"} gorseli${index ? ` ${index}` : ""}`,
    projectThumbnail: ({ title, index }) =>
      `${title || "Proje"} kucuk gorseli ${index || 1}`,
    projectVideoPreview: ({ title }) =>
      `${title || "Proje"} video onizlemesi`,
    projectVideo: ({ title, index }) =>
      `${title || "Proje"} videosu ${index || 1}`,
    projectLocationMap: ({ title }) =>
      `${title || "Proje"} konum haritasi`,
    projectSitePlan: ({ title }) =>
      `${title || "Proje"} vaziyet plani`,
    floorPlan: ({ title, variant }) =>
      [title, variant].filter(Boolean).join(" - ") || "Kat plani",
  },
  ru: {
    featuredPropertyFilm: "Видео о рекомендуемой недвижимости HB International",
    featuredResidence: "Изображение рекомендуемого жилого объекта HB International",
    locationHero: ({ location }) => `${toDisplayLabel(location) || "Недвижимость"} на главном баннере`,
    countryArticles: ({ country }) => `Статьи о недвижимости в ${country || "этом рынке"}`,
    consultantsBanner: "Баннер с консультантами по недвижимости",
    consultantPhoto: ({ name }) =>
      name ? `Фотография консультанта ${name}` : "Фотография консультанта",
    moreAgents: ({ count }) =>
      count ? `Еще ${count}+ консультантов по недвижимости` : "Больше консультантов по недвижимости",
    modernBuilding: "Современный жилой комплекс ночью",
    localProjectsHero: "Главный баннер местных жилых проектов",
    aboutArnavutkoyCard: "Инвестиционный район Арнавуткёй",
    aboutSalamisCard: "Проект Salamis Holiday Home",
    aboutFeaturedPropertyCard: "Рекомендуемая недвижимость",
    blogImage: ({ title, index }) =>
      `${title || "Статья блога"} изображение${index ? ` ${index}` : ""}`,
    blogThumbnail: ({ title, index }) =>
      `${title || "Статья блога"} миниатюра ${index || 1}`,
    blogArticleImage: ({ title, index }) =>
      `${title || "Статья блога"} изображение в статье${index ? ` ${index}` : ""}`,
    propertyImage: ({ title, index }) =>
      `${title || "Недвижимость"} изображение${index ? ` ${index}` : ""}`,
    propertyThumbnail: ({ title, index }) =>
      `${title || "Недвижимость"} миниатюра ${index || 1}`,
    projectImage: ({ title, index }) =>
      `${title || "Проект"} изображение${index ? ` ${index}` : ""}`,
    projectThumbnail: ({ title, index }) =>
      `${title || "Проект"} миниатюра ${index || 1}`,
    projectVideoPreview: ({ title }) =>
      `${title || "Проект"} предпросмотр видео`,
    projectVideo: ({ title, index }) =>
      `${title || "Проект"} видео ${index || 1}`,
    projectLocationMap: ({ title }) =>
      `${title || "Проект"} карта расположения`,
    projectSitePlan: ({ title }) =>
      `${title || "Проект"} генплан`,
    floorPlan: ({ title, variant }) =>
      [title, variant].filter(Boolean).join(" - ") || "План этажа",
  },
};

const AUTO_GENERATED_ALT_PATTERNS = [
  /^blog block\b/i,
  /^block \d+\b/i,
  /^line \d+\b/i,
  /^gallery \d+\b/i,
  /^blog\b/i,
];

const htmlEscapeAttribute = (value) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const shouldReplaceAlt = (value = "") => {
  const normalized = String(value || "").trim();
  if (!normalized) return true;
  return AUTO_GENERATED_ALT_PATTERNS.some((pattern) => pattern.test(normalized));
};

export const getLocalizedAlt = (language, key, params = {}) => {
  const lang = normalizeLanguage(language);
  const template = ALT_TEMPLATES[lang]?.[key] ?? ALT_TEMPLATES.en[key];
  if (typeof template === "function") {
    return template(params);
  }
  return template || "";
};

export const ensureHtmlImageAlts = (
  html,
  { language = "en", title = "", key = "blogArticleImage" } = {}
) => {
  if (typeof html !== "string" || !html.includes("<img")) return html || "";

  let imageIndex = 0;

  return html.replace(/<img\b[^>]*>/gi, (tag) => {
    imageIndex += 1;
    const nextAlt = htmlEscapeAttribute(
      getLocalizedAlt(language, key, {
        title,
        index: imageIndex,
      })
    );
    const altMatch = tag.match(/\balt\s*=\s*(['"])([\s\S]*?)\1/i);

    if (altMatch) {
      if (!shouldReplaceAlt(altMatch[2])) {
        return tag;
      }
      return tag.replace(altMatch[0], `alt="${nextAlt}"`);
    }

    return tag.replace(/\s*\/?>$/, (ending) => ` alt="${nextAlt}"${ending}`);
  });
};
