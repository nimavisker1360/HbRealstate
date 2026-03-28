import asyncHandler from "express-async-handler";
import { prisma } from "../config/prismaConfig.js";
import { generateRealEstateBlog, generateMultipleBlogs } from "../services/aiBlogGenerator.js";

const toSlug = (value = "") =>
  value
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

const isObjectId = (value = "") =>
  /^[a-f0-9]{24}$/i.test(String(value || "").trim());

const pickBlogTitle = (blog = {}) =>
  blog?.title_en || blog?.title || blog?.title_tr || blog?.title_ru || "blog";

const normalizeAltLanguage = (language = "en") => {
  const normalized = String(language || "").toLowerCase();
  if (normalized.startsWith("tr")) return "tr";
  if (normalized.startsWith("ru")) return "ru";
  return "en";
};

const BLOG_ALT_TEMPLATES = {
  en: ({ title, index }) => `${title || "Blog article"} article image${index ? ` ${index}` : ""}`,
  tr: ({ title, index }) => `${title || "Blog yazisi"} icerik gorseli${index ? ` ${index}` : ""}`,
  ru: ({ title, index }) => `${title || "Статья блога"} изображение в статье${index ? ` ${index}` : ""}`,
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

const getBlogContentImageAlt = (language, title, index) => {
  const lang = normalizeAltLanguage(language);
  const template = BLOG_ALT_TEMPLATES[lang] || BLOG_ALT_TEMPLATES.en;
  return template({ title, index });
};

const ensureBlogImageAlts = (html, { language = "en", title = "" } = {}) => {
  if (typeof html !== "string" || !html.includes("<img")) return html || "";

  let imageIndex = 0;

  return html.replace(/<img\b[^>]*>/gi, (tag) => {
    imageIndex += 1;
    const nextAlt = htmlEscapeAttribute(
      getBlogContentImageAlt(language, title, imageIndex)
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

const resolveDefaultBlogLanguage = (blog = {}) => {
  if (pickText(blog.content_tr, blog.title_tr) && !pickText(blog.content_en, blog.title_en)) {
    return "tr";
  }
  if (pickText(blog.content_ru, blog.title_ru) && !pickText(blog.content_en, blog.title_en)) {
    return "ru";
  }
  return "en";
};

const normalizeBlogContentFields = (blog = {}) => {
  const titleBase = pickText(blog.title, blog.title_en, blog.title_tr, blog.title_ru, "Blog");
  const titleEn = pickText(blog.title_en, blog.title, blog.title_tr, blog.title_ru, titleBase);
  const titleTr = pickText(blog.title_tr, blog.title, blog.title_en, blog.title_ru, titleBase);
  const titleRu = pickText(blog.title_ru, blog.title, blog.title_en, blog.title_tr, titleBase);

  return {
    ...blog,
    content: ensureBlogImageAlts(blog.content || "", {
      language: resolveDefaultBlogLanguage(blog),
      title: titleBase,
    }),
    content_en: ensureBlogImageAlts(blog.content_en || "", {
      language: "en",
      title: titleEn,
    }),
    content_tr: ensureBlogImageAlts(blog.content_tr || "", {
      language: "tr",
      title: titleTr,
    }),
    content_ru: ensureBlogImageAlts(blog.content_ru || "", {
      language: "ru",
      title: titleRu,
    }),
  };
};

const resolveBlogSlug = (blog = {}) => {
  const existingSlug = String(blog?.slug || "").trim();
  if (existingSlug && !isObjectId(existingSlug)) return existingSlug;

  const baseSlug = toSlug(pickBlogTitle(blog)) || "blog";
  const id = String(blog?.id || "").trim().toLowerCase();
  return id ? `${baseSlug}-${id}` : baseSlug;
};

const withResolvedSlug = (blog) =>
  blog ? normalizeBlogContentFields({ ...blog, slug: resolveBlogSlug(blog) }) : blog;

const CITIZENSHIP_KEYWORDS = [
  "citizenship",
  "passport",
  "vatandaslik",
  "citizen",
];

const INSTALLMENT_KEYWORDS = [
  "installment",
  "payment plan",
  "taksit",
  "down payment",
];

const INVESTMENT_KEYWORDS = [
  "investment",
  "investor",
  "yield",
  "roi",
  "rental income",
  "yatirim",
];

const LEGAL_TAX_KEYWORDS = [
  "tax",
  "legal",
  "title deed",
  "valuation",
  "closing cost",
  "tapu",
  "vergi",
  "hukuk",
];

const FAMILY_KEYWORDS = ["family", "school", "hospital", "park", "aile"];
const RENTAL_KEYWORDS = ["rental", "rent", "lease", "tenant", "kira"];
const LUXURY_KEYWORDS = ["luxury", "premium", "exclusive", "sea view", "marina"];

const pickText = (...values) => {
  for (const value of values) {
    if (value === null || value === undefined) continue;
    const normalized = String(value).trim();
    if (normalized) return normalized;
  }
  return "";
};

const normalizeSearchText = (value = "") =>
  String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const uniqueStrings = (values = []) => {
  const seen = new Set();
  return values
    .map((value) => pickText(value))
    .filter(Boolean)
    .filter((value) => {
      const normalized = normalizeSearchText(value);
      if (!normalized || seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    });
};

const toStringArray = (value) => {
  if (Array.isArray(value)) {
    return uniqueStrings(value);
  }
  if (typeof value === "string") {
    return uniqueStrings(value.split(/\r?\n/));
  }
  return [];
};

const parseJsonObject = (value) => {
  if (!value) return null;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? parsed
        : null;
    } catch (_error) {
      return null;
    }
  }
  return typeof value === "object" && !Array.isArray(value) ? value : null;
};

const parseJsonArray = (value) => {
  if (!value) return null;
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : null;
    } catch (_error) {
      return null;
    }
  }
  return null;
};

const sanitizeFaqSection = (value) => {
  const parsed = parseJsonArray(value);
  if (!parsed || parsed.length === 0) return null;
  const entries = parsed
    .map((item) => ({
      question: pickText(item?.question),
      answer: pickText(item?.answer),
    }))
    .filter((item) => item.question && item.answer);
  return entries.length > 0 ? entries : null;
};

const includesKeyword = (text, keywords = []) => {
  const haystack = normalizeSearchText(text);
  return keywords.some((keyword) =>
    haystack.includes(normalizeSearchText(keyword))
  );
};

const deriveIntentsFromText = (text = "") => {
  const intents = [];
  if (includesKeyword(text, CITIZENSHIP_KEYWORDS)) intents.push("citizenship");
  if (includesKeyword(text, INSTALLMENT_KEYWORDS)) intents.push("installment");
  if (includesKeyword(text, INVESTMENT_KEYWORDS)) intents.push("investment");
  if (includesKeyword(text, LEGAL_TAX_KEYWORDS)) intents.push("legal-tax");
  if (includesKeyword(text, FAMILY_KEYWORDS)) intents.push("family-living");
  if (includesKeyword(text, RENTAL_KEYWORDS)) intents.push("rental-income");
  if (includesKeyword(text, LUXURY_KEYWORDS)) intents.push("luxury");
  return uniqueStrings(intents);
};

const buildBlogTaxonomy = ({ data = {}, marketData = {} } = {}) => {
  const providedTaxonomy = parseJsonObject(data.taxonomy) || {};
  const title = pickText(data.title_en, data.title, data.title_tr, data.title_ru);
  const summary = pickText(
    data.summary_en,
    data.summary,
    data.summary_tr,
    data.summary_ru,
    data.metaDescription_en,
    data.metaDescription,
    data.metaDescription_tr,
    data.metaDescription_ru
  );
  const category = pickText(providedTaxonomy.category, data.category);
  const subcategory = pickText(
    providedTaxonomy.subcategory,
    data.subcategory,
    data.menuKey
  );
  const city = pickText(
    providedTaxonomy.city,
    data.city,
    marketData?.city,
    marketData?.location?.city
  );
  const district = pickText(
    providedTaxonomy.district,
    data.district,
    marketData?.district,
    marketData?.location?.district
  );
  const country = pickText(
    providedTaxonomy.country,
    data.country,
    marketData?.country,
    marketData?.location?.country
  );

  const searchText = normalizeSearchText(
    [
      title,
      summary,
      category,
      subcategory,
      data.content_en,
      data.content,
      data.content_tr,
      data.content_ru,
      data.menuKey,
    ]
      .filter(Boolean)
      .join(" ")
  );

  const intents = uniqueStrings([
    ...toStringArray(providedTaxonomy.intents),
    ...deriveIntentsFromText(searchText),
  ]);

  return {
    contentType: pickText(providedTaxonomy.contentType, data.contentType, "blog article"),
    category,
    subcategory,
    city,
    district,
    country,
    tags: uniqueStrings([
      ...toStringArray(providedTaxonomy.tags),
      category,
      subcategory,
      city,
      district,
      country,
      data.menuKey,
      ...intents,
    ]),
    intents,
    citizenship: Boolean(
      providedTaxonomy.citizenship || intents.includes("citizenship")
    ),
    installment: Boolean(
      providedTaxonomy.installment || intents.includes("installment")
    ),
    luxury: Boolean(providedTaxonomy.luxury || intents.includes("luxury")),
    familyLiving: Boolean(
      providedTaxonomy.familyLiving || intents.includes("family-living")
    ),
    rentalIncome: Boolean(
      providedTaxonomy.rentalIncome || intents.includes("rental-income")
    ),
  };
};

const buildBlogPersistenceData = ({ data = {}, marketData = {}, order } = {}) => {
  const title = data.title;
  const titleEn = data.title_en || data.title || "";
  const titleTr = data.title_tr || "";
  const titleRu = data.title_ru || "";
  const defaultLanguage = resolveDefaultBlogLanguage({
    ...data,
    title: title || titleEn || titleTr || titleRu,
    title_en: titleEn,
    title_tr: titleTr,
    title_ru: titleRu,
  });
  const content = ensureBlogImageAlts(data.content || "", {
    language: defaultLanguage,
    title: title || titleEn || titleTr || titleRu || "Blog",
  });
  const contentEn = ensureBlogImageAlts(data.content_en || data.content || "", {
    language: "en",
    title: titleEn || title || titleTr || titleRu || "Blog",
  });
  const contentTr = ensureBlogImageAlts(data.content_tr || "", {
    language: "tr",
    title: titleTr || title || titleEn || titleRu || "Blog",
  });
  const contentRu = ensureBlogImageAlts(data.content_ru || "", {
    language: "ru",
    title: titleRu || title || titleEn || titleTr || "Blog",
  });

  return {
    title,
    title_en: titleEn,
    title_tr: titleTr,
    title_ru: titleRu,
    slug: data.slug,
    menuKey: data.menuKey?.trim() || null,
    category: data.category,
    category_en: data.category_en || data.category || "",
    category_tr: data.category_tr || "",
    category_ru: data.category_ru || "",
    content,
    content_en: contentEn,
    content_tr: contentTr,
    content_ru: contentRu,
    summary: data.summary || "",
    summary_en: data.summary_en || data.summary || "",
    summary_tr: data.summary_tr || "",
    summary_ru: data.summary_ru || "",
    metaDescription:
      pickText(data.metaDescription, data.metaDescription_en, data.summary_en, data.summary) ||
      null,
    metaDescription_en:
      pickText(data.metaDescription_en, data.metaDescription, data.summary_en, data.summary) ||
      null,
    metaDescription_tr:
      pickText(data.metaDescription_tr, data.summary_tr) || null,
    metaDescription_ru:
      pickText(data.metaDescription_ru, data.summary_ru) || null,
    image: data.image || "",
    video: data.video || "",
    images: Array.isArray(data.images) ? data.images : [],
    country: data.country?.trim() || null,
    published: data.published !== undefined ? data.published : true,
    faqSection: sanitizeFaqSection(data.faqSection),
    faqSection_en: sanitizeFaqSection(data.faqSection_en),
    faqSection_tr: sanitizeFaqSection(data.faqSection_tr),
    faqSection_ru: sanitizeFaqSection(data.faqSection_ru),
    internalLinks: toStringArray(data.internalLinks),
    taxonomy: buildBlogTaxonomy({ data, marketData }),
    marketData: marketData && Object.keys(marketData).length > 0 ? marketData : null,
    ...(typeof order === "number" ? { order } : {}),
  };
};

// Get all blogs (public)
export const getAllBlogs = asyncHandler(async (req, res) => {
  try {
    const blogs = await prisma.blog.findMany({
      where: { published: true },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    });
    res.status(200).send(blogs.map(withResolvedSlug));
  } catch (err) {
    console.error("Error fetching blogs:", err);
    res.status(500).send({ message: "Error fetching blogs" });
  }
});

// Get all blogs for admin (including unpublished)
export const getAllBlogsAdmin = asyncHandler(async (req, res) => {
  try {
    const blogs = await prisma.blog.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    });
    res
      .status(200)
      .send({ totalBlogs: blogs.length, blogs: blogs.map(withResolvedSlug) });
  } catch (err) {
    console.error("Error fetching blogs:", err);
    res.status(500).send({ message: "Error fetching blogs" });
  }
});

// Get single blog
export const getBlog = asyncHandler(async (req, res) => {
  const { id: idOrSlug } = req.params;
  const normalizedIdentifier = String(idOrSlug || "").trim().toLowerCase();

  try {
    let blog = null;

    if (isObjectId(idOrSlug)) {
      blog = await prisma.blog.findUnique({
        where: { id: idOrSlug },
      });
    }

    if (!blog) {
      blog = await prisma.blog.findUnique({
        where: { slug: idOrSlug },
      });
    }

    if (!blog && normalizedIdentifier) {
      const objectIdMatch = normalizedIdentifier.match(/([a-f0-9]{24})$/i);
      const fallbackObjectId = objectIdMatch?.[1] || "";
      if (fallbackObjectId) {
        const candidate = await prisma.blog.findUnique({
          where: { id: fallbackObjectId },
        });
        if (candidate) {
          const candidateFallbackSlug = resolveBlogSlug(candidate).toLowerCase();
          const hasMatchingIdSuffix = normalizedIdentifier.endsWith(
            `-${fallbackObjectId}`
          );
          if (candidateFallbackSlug === normalizedIdentifier || hasMatchingIdSuffix) {
            blog = candidate;
          }
        }
      }
    }

    if (!blog) {
      return res.status(404).send({ message: "Blog not found" });
    }

    res.status(200).send(withResolvedSlug(blog));
  } catch (err) {
    console.error("Error fetching blog:", err);
    res.status(500).send({ message: "Error fetching blog" });
  }
});

// Create blog (admin)
export const createBlog = asyncHandler(async (req, res) => {
  const { data } = req.body;

  if (!data.title || !data.category) {
    return res.status(400).send({ message: "Title and category are required" });
  }

  try {
    // Get the highest order number
    const maxOrder = await prisma.blog.findFirst({
      orderBy: { order: "desc" },
      select: { order: true },
    });

    let slugBase = toSlug(data.slug || data.title);
    if (!slugBase) {
      slugBase = `blog-${Date.now()}`;
    }
    let slug = slugBase;
    let slugExists = await prisma.blog.findUnique({ where: { slug } });
    let counter = 1;
    while (slugExists) {
      slug = `${slugBase}-${counter}`;
      slugExists = await prisma.blog.findUnique({ where: { slug } });
      counter++;
    }

    const blog = await prisma.blog.create({
      data: {
        ...buildBlogPersistenceData({
          data: {
            ...data,
            slug,
          },
          marketData: data.marketData,
        }),
        order: (maxOrder?.order || 0) + 1,
      },
    });

    res
      .status(201)
      .send({ message: "Blog created successfully", blog: withResolvedSlug(blog) });
  } catch (err) {
    console.error("Error creating blog:", err);
    res.status(500).send({
      message: "Error creating blog",
      error: err.message,
    });
  }
});

// Update blog (admin)
export const updateBlog = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { data } = req.body;

  try {
    const existingBlog = await prisma.blog.findUnique({
      where: { id },
    });

    if (!existingBlog) {
      return res.status(404).send({ message: "Blog not found" });
    }

    const mergedData = {
      ...existingBlog,
      ...data,
      faqSection:
        data?.faqSection !== undefined ? data.faqSection : existingBlog.faqSection,
      faqSection_en:
        data?.faqSection_en !== undefined
          ? data.faqSection_en
          : existingBlog.faqSection_en,
      faqSection_tr:
        data?.faqSection_tr !== undefined
          ? data.faqSection_tr
          : existingBlog.faqSection_tr,
      faqSection_ru:
        data?.faqSection_ru !== undefined
          ? data.faqSection_ru
          : existingBlog.faqSection_ru,
      internalLinks:
        data?.internalLinks !== undefined
          ? data.internalLinks
          : existingBlog.internalLinks,
      taxonomy:
        data?.taxonomy !== undefined ? data.taxonomy : existingBlog.taxonomy,
      marketData:
        data?.marketData !== undefined ? data.marketData : existingBlog.marketData,
    };

    const blog = await prisma.blog.update({
      where: { id },
      data: {
        ...buildBlogPersistenceData({
          data: {
            ...mergedData,
            slug: undefined,
          },
          marketData: mergedData.marketData,
        }),
      },
    });

    res
      .status(200)
      .send({ message: "Blog updated successfully", blog: withResolvedSlug(blog) });
  } catch (err) {
    console.error("Error updating blog:", err);
    res.status(500).send({ message: "Error updating blog" });
  }
});

// Delete blog (admin)
export const deleteBlog = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.blog.delete({
      where: { id },
    });

    res.status(200).send({ message: "Blog deleted successfully" });
  } catch (err) {
    console.error("Error deleting blog:", err);
    res.status(500).send({ message: "Error deleting blog" });
  }
});

// Toggle blog publish status (admin)
export const togglePublish = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const blog = await prisma.blog.findUnique({
      where: { id },
    });

    if (!blog) {
      return res.status(404).send({ message: "Blog not found" });
    }

    const updatedBlog = await prisma.blog.update({
      where: { id },
      data: { published: !blog.published },
    });

    res.status(200).send({ message: "Blog status updated", blog: updatedBlog });
  } catch (err) {
    console.error("Error toggling blog status:", err);
    res.status(500).send({ message: "Error toggling blog status" });
  }
});

// Reorder blogs (admin)
export const reorderBlogs = asyncHandler(async (req, res) => {
  const { orderedIds } = req.body;

  try {
    const updatePromises = orderedIds.map((id, index) =>
      prisma.blog.update({
        where: { id },
        data: { order: index },
      })
    );

    await Promise.all(updatePromises);

    res.status(200).send({ message: "Blogs reordered successfully" });
  } catch (err) {
    console.error("Error reordering blogs:", err);
    res.status(500).send({ message: "Error reordering blogs" });
  }
});

// Generate AI blog (admin)
export const generateAIBlog = asyncHandler(async (req, res) => {
  const { marketData = {}, autoPublish = false, blogMeta = {} } = req.body || {};

  // Market data is optional; AI can generate a general article if omitted.

  try {
    // Generate blog content using AI
    const result = await generateRealEstateBlog(marketData);

    if (!result.success) {
      return res.status(500).send({ 
        message: "AI generation failed",
        error: result.error 
      });
    }

    const normalize = (value) =>
      typeof value === "string" ? value.trim() : value;

    const overrides = {
      title_en: normalize(blogMeta.title_en),
      title_tr: normalize(blogMeta.title_tr),
      category: normalize(blogMeta.category),
      country: normalize(blogMeta.country),
      menuKey: normalize(blogMeta.menuKey),
      summary_en: normalize(blogMeta.summary_en),
      summary_tr: normalize(blogMeta.summary_tr),
      image: normalize(blogMeta.image),
    };

    const resolvedTitleEn = overrides.title_en || result.data.title_en;
    const resolvedTitleTr = overrides.title_tr || result.data.title_tr;
    const resolvedTitle =
      overrides.title_en || overrides.title_tr || result.data.title;
    const resolvedCategory = overrides.category || result.data.category;
    const resolvedCategoryEn = overrides.category
      ? overrides.category
      : result.data.category_en;
    const resolvedCategoryTr = overrides.category
      ? overrides.category
      : result.data.category_tr;
    const resolvedSummaryEn = overrides.summary_en || result.data.summary_en;
    const resolvedSummaryTr = overrides.summary_tr || result.data.summary_tr;
    const resolvedSummary =
      overrides.summary_en || overrides.summary_tr || result.data.summary;

    // Create a unique slug
    const slugBaseSource =
      overrides.title_en || overrides.title_tr || result.data.slug || "";
    let slugBase = toSlug(slugBaseSource);
    if (!slugBase) {
      slugBase = result.data.slug || `blog-${Date.now()}`;
    }
    let slug = slugBase;
    let slugExists = await prisma.blog.findUnique({ where: { slug } });
    let counter = 1;

    while (slugExists) {
      slug = `${slugBase}-${counter}`;
      slugExists = await prisma.blog.findUnique({ where: { slug } });
      counter++;
    }

    // Get the highest order number
    const maxOrder = await prisma.blog.findFirst({
      orderBy: { order: "desc" },
      select: { order: true },
    });

    // Create blog in database with bilingual content
    const blog = await prisma.blog.create({
      data: {
        ...buildBlogPersistenceData({
          data: {
            title: resolvedTitle,
            title_en: resolvedTitleEn,
            title_tr: resolvedTitleTr,
            slug,
            menuKey: overrides.menuKey || null,
            category: resolvedCategory,
            category_en: resolvedCategoryEn,
            category_tr: resolvedCategoryTr,
            country: overrides.country || null,
            content: result.data.content,
            content_en: result.data.content_en,
            content_tr: result.data.content_tr,
            summary: resolvedSummary,
            summary_en: resolvedSummaryEn,
            summary_tr: resolvedSummaryTr,
            metaDescription: result.data.metaDescription,
            metaDescription_en: result.data.metaDescription_en,
            metaDescription_tr: result.data.metaDescription_tr,
            image: overrides.image || "",
            faqSection: result.data.faqSection,
            faqSection_en: result.data.faqSection_en,
            faqSection_tr: result.data.faqSection_tr,
            internalLinks: result.data.internalLinks,
            taxonomy: blogMeta.taxonomy,
          },
          marketData: result.data.marketData,
        }),
        published: autoPublish,
        order: (maxOrder?.order || 0) + 1,
      },
    });

    res.status(201).send({ 
      message: "AI blog generated and saved successfully", 
      blog: withResolvedSlug(blog)
    });
  } catch (err) {
    console.error("Error generating AI blog:", err);
    res.status(500).send({ 
      message: "Error generating AI blog",
      error: err.message 
    });
  }
});

// Generate multiple AI blogs (admin)
export const generateMultipleAIBlogs = asyncHandler(async (req, res) => {
  const { marketDataArray, autoPublish = false } = req.body;

  if (!Array.isArray(marketDataArray) || marketDataArray.length === 0) {
    return res.status(400).send({ 
      message: "marketDataArray must be a non-empty array" 
    });
  }

  try {
    const results = await generateMultipleBlogs(marketDataArray);
    const createdBlogs = [];
    const errors = [];

    // Get the highest order number once
    const maxOrder = await prisma.blog.findFirst({
      orderBy: { order: "desc" },
      select: { order: true },
    });
    let currentOrder = (maxOrder?.order || 0) + 1;

    for (const result of results) {
      if (result.success) {
        try {
          // Create unique slug
          let slug = result.data.slug;
          let slugExists = await prisma.blog.findUnique({ where: { slug } });
          let counter = 1;
          
          while (slugExists) {
            slug = `${result.data.slug}-${counter}`;
            slugExists = await prisma.blog.findUnique({ where: { slug } });
            counter++;
          }

          const blog = await prisma.blog.create({
            data: {
              ...buildBlogPersistenceData({
                data: {
                  title: result.data.title,
                  title_en: result.data.title_en,
                  title_tr: result.data.title_tr,
                  slug,
                  category: result.data.category,
                  category_en: result.data.category_en,
                  category_tr: result.data.category_tr,
                  content: result.data.content,
                  content_en: result.data.content_en,
                  content_tr: result.data.content_tr,
                  summary: result.data.summary,
                  summary_en: result.data.summary_en,
                  summary_tr: result.data.summary_tr,
                  metaDescription: result.data.metaDescription,
                  metaDescription_en: result.data.metaDescription_en,
                  metaDescription_tr: result.data.metaDescription_tr,
                  faqSection: result.data.faqSection,
                  faqSection_en: result.data.faqSection_en,
                  faqSection_tr: result.data.faqSection_tr,
                  internalLinks: result.data.internalLinks,
                },
                marketData: result.data.marketData,
              }),
              published: autoPublish,
              order: currentOrder++,
            },
          });
          
          createdBlogs.push(withResolvedSlug(blog));
        } catch (dbError) {
          errors.push({
            marketData: result.data.marketData,
            error: dbError.message,
          });
        }
      } else {
        errors.push({
          marketData: result.marketData,
          error: result.error,
        });
      }
    }

    res.status(201).send({ 
      message: `Generated ${createdBlogs.length} blog(s) successfully`,
      createdBlogs,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    console.error("Error generating multiple AI blogs:", err);
    res.status(500).send({ 
      message: "Error generating multiple AI blogs",
      error: err.message 
    });
  }
});
