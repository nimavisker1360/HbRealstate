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

// Get all blogs (public)
export const getAllBlogs = asyncHandler(async (req, res) => {
  try {
    const blogs = await prisma.blog.findMany({
      where: { published: true },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    });
    res.status(200).send(blogs);
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
    res.status(200).send({ totalBlogs: blogs.length, blogs });
  } catch (err) {
    console.error("Error fetching blogs:", err);
    res.status(500).send({ message: "Error fetching blogs" });
  }
});

// Get single blog
export const getBlog = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const blog = await prisma.blog.findUnique({
      where: { id },
    });

    if (!blog) {
      return res.status(404).send({ message: "Blog not found" });
    }

    res.status(200).send(blog);
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

    let slugBase = toSlug(data.title);
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
        title: data.title,
        category: data.category,
        content: data.content || "",
        summary: data.summary || "",
        image: data.image || "",
        images: data.images || [],
        slug: slug,
        published: data.published !== undefined ? data.published : true,
        order: (maxOrder?.order || 0) + 1,
      },
    });

    res.status(201).send({ message: "Blog created successfully", blog });
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
    const blog = await prisma.blog.update({
      where: { id },
      data: {
        title: data.title,
        category: data.category,
        content: data.content,
        summary: data.summary,
        image: data.image,
        published: data.published,
        // Note: 'images' field requires running 'npx prisma generate' first
      },
    });

    res.status(200).send({ message: "Blog updated successfully", blog });
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
  const { marketData, autoPublish = false } = req.body;

  // Validate required fields
  if (!marketData || !marketData.city || !marketData.district) {
    return res.status(400).send({ 
      message: "Market data with city and district is required" 
    });
  }

  try {
    // Generate blog content using AI
    const result = await generateRealEstateBlog(marketData);

    if (!result.success) {
      return res.status(500).send({ 
        message: "AI generation failed",
        error: result.error 
      });
    }

    // Create a unique slug
    let slug = result.data.slug;
    let slugExists = await prisma.blog.findUnique({ where: { slug } });
    let counter = 1;
    
    while (slugExists) {
      slug = `${result.data.slug}-${counter}`;
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
        title: result.data.title,
        title_en: result.data.title_en,
        title_tr: result.data.title_tr,
        slug: slug,
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
        marketData: result.data.marketData,
        published: autoPublish,
        order: (maxOrder?.order || 0) + 1,
      },
    });

    res.status(201).send({ 
      message: "AI blog generated and saved successfully", 
      blog 
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
              title: result.data.title,
              title_en: result.data.title_en,
              title_tr: result.data.title_tr,
              slug: slug,
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
              marketData: result.data.marketData,
              published: autoPublish,
              order: currentOrder++,
            },
          });
          
          createdBlogs.push(blog);
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
