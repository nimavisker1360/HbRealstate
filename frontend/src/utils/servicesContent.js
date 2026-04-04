const normalizeLang = (lang) => String(lang || "en").slice(0, 2).toLowerCase();

const normalizeText = (value) =>
  typeof value === "string" ? value.trim() : "";

const firstObject = (values) =>
  values.find((value) => value && typeof value === "object" && !Array.isArray(value)) || null;

const buildLocalizedKey = (baseKey, lang) => `${baseKey}_${normalizeLang(lang)}`;

export const normalizeStagingCategoryKey = (value) => {
  const normalized = normalizeText(value).toLowerCase().replace(/_/g, "-");
  if (!normalized) return "";
  if (normalized === "premium-listing-boost") return "premium-boost";
  return normalized;
};

export const translateStagingCategory = (value, t) => {
  const normalized = normalizeStagingCategoryKey(value);
  if (!normalized) return "";
  return t(`services.staging.landing.packageCategories.${normalized}.label`, {
    defaultValue: humanizeToken(normalized),
  });
};

export const pickProjectTitle = (project, lang) => {
  if (!project) return "";
  return (
    normalizeText(project[buildLocalizedKey("title", lang)]) || normalizeText(project.title)
  );
};

export const pickProjectTimeline = (project, lang) => {
  if (!project) return "";
  return (
    normalizeText(project[buildLocalizedKey("timelineEstimate", lang)]) ||
    normalizeText(project.timelineEstimate)
  );
};

export const pickPackageName = (pkg, lang) => {
  if (!pkg) return "";
  return normalizeText(pkg[buildLocalizedKey("name", lang)]) || normalizeText(pkg.name);
};

export const pickPackageDescription = (pkg, lang) => {
  if (!pkg) return "";
  return (
    normalizeText(pkg[buildLocalizedKey("description", lang)]) ||
    normalizeText(pkg.description)
  );
};

export const pickPackageFeatures = (pkg, lang) => {
  if (!pkg) return [];
  const localized = pkg[buildLocalizedKey("features", lang)];
  const source = Array.isArray(localized)
    ? localized
    : Array.isArray(pkg.features)
      ? pkg.features
      : [];

  return source
    .map((item, index) => {
      if (typeof item === "string") {
        const label = normalizeText(item);
        return label ? { id: `feature-${index}`, label, included: true } : null;
      }

      if (!item || typeof item !== "object") return null;

      const label = normalizeText(
        item.label || item.title || item.name || item.text || item.key
      );

      if (!label) return null;

      return {
        id: normalizeText(item.key) || `feature-${index}`,
        label,
        included: item.included !== false,
      };
    })
    .filter(Boolean);
};

export const pickCaseStudy = (project, lang) => {
  if (!project) return null;

  const l = normalizeLang(lang);
  const localizedCandidates =
    l === "tr"
      ? [project.caseStudyContent_tr, project.caseStudyContent_en, project.caseStudyContent]
      : l === "ru"
        ? [project.caseStudyContent_ru, project.caseStudyContent_en, project.caseStudyContent_tr, project.caseStudyContent]
        : [project.caseStudyContent_en, project.caseStudyContent_tr, project.caseStudyContent];

  return firstObject(localizedCandidates);
};

export const caseStudyHeadline = (cs) => {
  if (!cs || typeof cs !== "object") return "";
  return normalizeText(cs.headline || cs.title || cs.summary);
};

export const caseStudySummary = (cs) => {
  if (!cs || typeof cs !== "object") return "";
  return normalizeText(cs.summary || cs.subtitle || cs.excerpt);
};

export const caseStudyBody = (cs) => {
  if (!cs || typeof cs !== "object") return "";
  return normalizeText(cs.body || cs.text || cs.description || cs.summary);
};

export const caseStudyTestimonial = (cs) => {
  if (!cs || typeof cs !== "object") return null;

  if (typeof cs.testimonial === "string") {
    const quote = normalizeText(cs.testimonial);
    return quote ? { quote } : null;
  }

  if (!cs.testimonial || typeof cs.testimonial !== "object") return null;

  const quote = normalizeText(
    cs.testimonial.quote ||
      cs.testimonial.text ||
      cs.testimonial.body ||
      cs.testimonial.content
  );
  const author = normalizeText(
    cs.testimonial.author || cs.testimonial.name || cs.testimonial.client
  );
  const role = normalizeText(cs.testimonial.role || cs.testimonial.title);

  if (!quote && !author && !role) return null;

  return { quote, author, role };
};

export const humanizeToken = (value) =>
  normalizeText(value)
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export const formatCurrencyValue = (value, currency, locale = "en") => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "";

  const normalizedCurrency = normalizeText(currency).toUpperCase();
  const maximumFractionDigits = Number.isInteger(amount) ? 0 : 1;

  if (normalizedCurrency) {
    try {
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency: normalizedCurrency,
        maximumFractionDigits,
      }).format(amount);
    } catch {
      return `${normalizedCurrency} ${amount.toLocaleString(locale, {
        maximumFractionDigits,
      })}`;
    }
  }

  return amount.toLocaleString(locale, { maximumFractionDigits });
};

export const formatCurrencyRange = (source, locale = "en") => {
  if (!source || typeof source !== "object") return "";

  const from = Number(source.priceFrom);
  const to = Number(source.priceTo);
  const currency = source.priceCurrency;

  if (Number.isFinite(from) && Number.isFinite(to)) {
    return `${formatCurrencyValue(from, currency, locale)} - ${formatCurrencyValue(
      to,
      currency,
      locale
    )}`;
  }

  if (Number.isFinite(from)) return formatCurrencyValue(from, currency, locale);
  if (Number.isFinite(to)) return formatCurrencyValue(to, currency, locale);
  return "";
};

export const formatPercentValue = (value, locale = "en") => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "";

  return `${amount.toLocaleString(locale, {
    maximumFractionDigits: Number.isInteger(amount) ? 0 : 1,
  })}%`;
};

export const getProjectLocation = (project) =>
  [project?.city, project?.district].filter(Boolean).join(", ");

export const getProjectServices = (project) => {
  if (Array.isArray(project?.servicesIncluded) && project.servicesIncluded.length > 0) {
    return project.servicesIncluded;
  }

  if (Array.isArray(project?.package?.servicesIncluded) && project.package.servicesIncluded.length > 0) {
    return project.package.servicesIncluded;
  }

  return [];
};

export const getProjectComparisonPairs = (project, lang) => {
  const pairs = [];
  const seen = new Set();
  const caseStudy = pickCaseStudy(project, lang);

  if (Array.isArray(caseStudy?.beforeAfterPairs)) {
    caseStudy.beforeAfterPairs.forEach((pair, index) => {
      const beforeUrl = normalizeText(
        pair?.beforeUrl || pair?.before || pair?.beforeImage || pair?.beforePhoto
      );
      const afterUrl = normalizeText(
        pair?.afterUrl || pair?.after || pair?.afterImage || pair?.afterPhoto
      );
      const key = `${beforeUrl}|${afterUrl}`;

      if (!beforeUrl || !afterUrl || seen.has(key)) return;
      seen.add(key);

      pairs.push({
        beforeUrl,
        afterUrl,
        title: normalizeText(pair?.title),
        featured: Boolean(pair?.featured || pair?.cover || pair?.isCover || index === 0),
      });
    });
  }

  const beforePhotos = Array.isArray(project?.beforePhotos) ? project.beforePhotos : [];
  const afterPhotos = Array.isArray(project?.afterPhotos) ? project.afterPhotos : [];
  const maxLength = Math.max(beforePhotos.length, afterPhotos.length);

  for (let index = 0; index < maxLength; index += 1) {
    const beforeUrl = normalizeText(beforePhotos[index] || "");
    const afterUrl = normalizeText(afterPhotos[index] || "");
    const key = `${beforeUrl}|${afterUrl}`;

    if (!beforeUrl || !afterUrl || seen.has(key)) continue;
    seen.add(key);

    pairs.push({
      beforeUrl,
      afterUrl,
      title: "",
      featured: index === 0,
    });
  }

  return pairs;
};

export const pickFeaturedComparisonPair = (project, lang) => {
  const pairs = getProjectComparisonPairs(project, lang);
  return pairs.find((pair) => pair.featured) || pairs[0] || null;
};

export const getProjectHeadline = (project, lang, fallback = "") =>
  caseStudyHeadline(pickCaseStudy(project, lang)) ||
  pickProjectTitle(project, lang) ||
  fallback;

export const getProjectSummary = (project, lang) => {
  const caseStudy = pickCaseStudy(project, lang);
  return (
    caseStudySummary(caseStudy) ||
    caseStudyBody(caseStudy) ||
    normalizeText(project?.notes) ||
    pickProjectTitle(project, lang)
  );
};

export const buildStagingProjectPath = (project) =>
  `/services/home-staging/projects/${encodeURIComponent(project?.slug || project?.id || "")}`;

export const buildProjectMediaLinks = (project) =>
  [
    { key: "virtualTour", url: normalizeText(project?.virtualTourUrl) },
    { key: "droneFootage", url: normalizeText(project?.droneFootageUrl) },
    { key: "floorPlan", url: normalizeText(project?.floorPlanUrl) },
  ].filter((item) => item.url);
