import asyncHandler from "express-async-handler";
import nodemailer from "nodemailer";
import { prisma } from "../config/prismaConfig.js";
import { getAuthenticatedEmail } from "../middleware/requireAdminUser.js";
import { extractLeadAttribution } from "../utils/leadAttribution.js";
import {
  validateStagingRequest,
  validateStagingUpdate,
  validateStagingStatusTransition,
  validateProjectUpdate,
} from "../validators/stagingValidator.js";

const normalizeEmail = (value = "") => String(value || "").trim().toLowerCase();

const humanizeToken = (value = "") =>
  String(value || "")
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const createTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return null;

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const getAppBaseUrl = () => {
  const candidates = [
    process.env.CLIENT_URL,
    process.env.FRONTEND_URL,
    process.env.APP_URL,
    process.env.PUBLIC_SITE_URL,
    "https://www.hbrealstate.com",
  ];

  for (const candidate of candidates) {
    const normalized = String(candidate || "").trim().replace(/\/+$/, "");
    if (normalized) return normalized;
  }

  return "https://www.hbrealstate.com";
};

const buildAbsoluteUrl = (path = "/") => {
  if (/^https?:\/\//i.test(path)) return path;
  const normalizedPath = String(path || "/").startsWith("/")
    ? String(path || "/")
    : `/${String(path || "")}`;
  return `${getAppBaseUrl()}${normalizedPath}`;
};

const buildPublicProjectPath = (project) => {
  if (!project?.published) return "";
  const identifier = project.slug || project.id;
  if (!identifier) return "";
  return `/services/home-staging/projects/${encodeURIComponent(identifier)}`;
};

const sendStagingUserNotification = async ({
  request,
  project = null,
  subject,
  heading,
  body,
  facts = [],
}) => {
  const recipientEmail = normalizeEmail(request?.email);
  if (!recipientEmail) {
    return { sent: false, reason: "missing_recipient_email" };
  }

  const transporter = createTransporter();
  if (!transporter) {
    return { sent: false, reason: "email_not_configured" };
  }

  const portalUrl = buildAbsoluteUrl("/my-staging-requests");
  const publicProjectUrl = buildPublicProjectPath(project)
    ? buildAbsoluteUrl(buildPublicProjectPath(project))
    : "";
  const factsHtml = facts
    .filter((item) => item && item.label && item.value)
    .map(
      (item) =>
        `<li style="margin:0 0 8px;"><strong>${item.label}:</strong> ${item.value}</li>`
    )
    .join("");
  const factsText = facts
    .filter((item) => item && item.label && item.value)
    .map((item) => `${item.label}: ${item.value}`)
    .join("\n");

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: recipientEmail,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 24px; color: #1f2937;">
          <div style="background: linear-gradient(135deg, #06a84e 0%, #048a3d 100%); border-radius: 16px 16px 0 0; padding: 24px;">
            <h1 style="margin: 0; color: #ffffff; font-size: 24px;">${heading}</h1>
          </div>
          <div style="border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 16px 16px; padding: 24px; background: #ffffff;">
            <p style="margin: 0 0 16px;">Hello ${request?.fullName || "there"},</p>
            <p style="margin: 0 0 16px; line-height: 1.6;">${body}</p>
            ${
              factsHtml
                ? `<ul style="margin: 0 0 20px; padding-left: 20px; line-height: 1.6;">${factsHtml}</ul>`
                : ""
            }
            <div style="margin-top: 24px;">
              <a href="${portalUrl}" style="display: inline-block; background: #06a84e; color: #ffffff; text-decoration: none; padding: 12px 18px; border-radius: 10px; font-weight: 700;">Open Your Private Request Panel</a>
            </div>
            ${
              publicProjectUrl
                ? `<p style="margin: 16px 0 0; line-height: 1.6;">Your public showcase is also live: <a href="${publicProjectUrl}" style="color: #06a84e;">${publicProjectUrl}</a></p>`
                : ""
            }
          </div>
        </div>
      `,
      text: [
        heading,
        "",
        `Hello ${request?.fullName || "there"},`,
        body,
        "",
        factsText,
        "",
        `Private panel: ${portalUrl}`,
        publicProjectUrl ? `Public showcase: ${publicProjectUrl}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    });

    return { sent: true, reason: "" };
  } catch (error) {
    console.error("Staging notification email failed:", error);
    return { sent: false, reason: error?.message || "email_send_failed" };
  }
};

// ──────────────────────────────────────────────────
// PUBLIC: Create staging / renovation request
// POST /api/staging/request
// ──────────────────────────────────────────────────
export const createStagingRequest = asyncHandler(async (req, res) => {
  const { valid, errors, data } = validateStagingRequest(req.body);

  if (!valid) {
    return res.status(400).json({ success: false, errors });
  }

  const attribution = extractLeadAttribution(req, {
    defaultLeadSource: "staging_form",
  });

  try {
    const record = await prisma.stagingRequest.create({
      data: {
        ...data,
        email: normalizeEmail(data.email),
        utmSource: attribution.utmSource,
        utmMedium: attribution.utmMedium,
        utmCampaign: attribution.utmCampaign,
        leadSource: attribution.leadSource,
        sourcePage: attribution.landingPage,
      },
    });

    res.status(201).json({ success: true, data: record });
  } catch (error) {
    console.error("Error creating staging request:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create staging request",
      error: error.message,
    });
  }
});

// ──────────────────────────────────────────────────
// ADMIN: List / filter staging requests
// GET /api/staging/all
// ──────────────────────────────────────────────────
const userFacingProjectPayload = {
  id: true,
  title: true,
  title_en: true,
  title_tr: true,
  title_ru: true,
  slug: true,
  city: true,
  district: true,
  propertyType: true,
  projectCategory: true,
  budgetEstimate: true,
  budgetCurrency: true,
  timelineEstimate: true,
  timelineEstimate_en: true,
  timelineEstimate_tr: true,
  timelineEstimate_ru: true,
  servicesIncluded: true,
  beforePhotos: true,
  beforeVideos: true,
  afterPhotos: true,
  afterVideos: true,
  floorPlanUrl: true,
  virtualTourUrl: true,
  droneFootageUrl: true,
  expectedValueUplift: true,
  expectedRentalUplift: true,
  expectedSaleSpeedDays: true,
  caseStudyContent: true,
  caseStudyContent_en: true,
  caseStudyContent_tr: true,
  caseStudyContent_ru: true,
  notes: true,
  published: true,
  status: true,
  updatedAt: true,
  package: {
    select: {
      id: true,
      name: true,
      name_en: true,
      name_tr: true,
      name_ru: true,
      slug: true,
      description: true,
      description_en: true,
      description_tr: true,
      description_ru: true,
      category: true,
      servicesIncluded: true,
      priceFrom: true,
      priceTo: true,
      priceCurrency: true,
      estimatedDays: true,
    },
  },
};

const userFacingRequestPayload = {
  id: true,
  fullName: true,
  email: true,
  phone: true,
  whatsapp: true,
  ownerType: true,
  preferredLanguage: true,
  propertyType: true,
  city: true,
  district: true,
  address: true,
  currentCondition: true,
  furnishedState: true,
  propertySize: true,
  roomCount: true,
  targetGoal: true,
  budgetRange: true,
  budgetCurrency: true,
  desiredTimeline: true,
  requestedServices: true,
  propertyUrl: true,
  notes: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  project: {
    select: userFacingProjectPayload,
  },
};

export const getMyStagingRequests = asyncHandler(async (req, res) => {
  const email = getAuthenticatedEmail(req);

  if (!email) {
    return res.status(403).json({
      success: false,
      message: "Authenticated email claim is required.",
    });
  }

  try {
    const requests = await prisma.stagingRequest.findMany({
      where: {
        email: {
          equals: email,
          mode: "insensitive",
        },
      },
      orderBy: { updatedAt: "desc" },
      select: userFacingRequestPayload,
    });

    res.status(200).json({
      success: true,
      total: requests.length,
      data: requests,
    });
  } catch (error) {
    console.error("Error fetching user staging requests:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch your staging requests",
      error: error.message,
    });
  }
});

export const getAllStagingRequests = asyncHandler(async (req, res) => {
  const { status, city, targetGoal, search } = req.query;
  const where = {};

  if (status) where.status = status;
  if (city) where.city = { contains: city, mode: "insensitive" };
  if (targetGoal) where.targetGoal = targetGoal;
  if (search) {
    where.OR = [
      { fullName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { city: { contains: search, mode: "insensitive" } },
    ];
  }

  try {
    const requests = await prisma.stagingRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        project: { select: { id: true, status: true, projectCategory: true, published: true } },
      },
    });

    res.status(200).json({
      success: true,
      total: requests.length,
      data: requests,
    });
  } catch (error) {
    console.error("Error fetching staging requests:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch staging requests",
      error: error.message,
    });
  }
});

// ──────────────────────────────────────────────────
// ADMIN: Get single staging request with project
// GET /api/staging/:id
// ──────────────────────────────────────────────────
export const getStagingRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const record = await prisma.stagingRequest.findUnique({
      where: { id },
      include: {
        project: { include: { package: true } },
      },
    });

    if (!record) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }

    res.status(200).json({ success: true, data: record });
  } catch (error) {
    console.error("Error fetching staging request:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch staging request",
      error: error.message,
    });
  }
});

// ──────────────────────────────────────────────────
// ADMIN: Update staging request
// PUT /api/staging/:id
// ──────────────────────────────────────────────────
export const updateStagingRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { data } = validateStagingUpdate(req.body);
  const normalizedData = data?.email ? { ...data, email: normalizeEmail(data.email) } : data;

  try {
    const record = await prisma.stagingRequest.update({
      where: { id },
      data: normalizedData,
    });

    res.status(200).json({ success: true, data: record });
  } catch (error) {
    console.error("Error updating staging request:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update staging request",
      error: error.message,
    });
  }
});

// ──────────────────────────────────────────────────
// ADMIN: Update staging request status (safe transitions)
// PUT /api/staging/:id/status
// ──────────────────────────────────────────────────
export const updateStagingStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status: nextStatus } = req.body;

  try {
    const existing = await prisma.stagingRequest.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }

    const transition = validateStagingStatusTransition(existing.status, nextStatus);
    if (!transition.valid) {
      return res.status(400).json({ success: false, message: transition.message });
    }

    const record = await prisma.stagingRequest.update({
      where: { id },
      data: { status: nextStatus },
      include: {
        project: {
          select: {
            id: true,
            slug: true,
            published: true,
          },
        },
      },
    });

    await sendStagingUserNotification({
      request: record,
      project: record.project,
      subject: "HB Staging & Renovation Request Update",
      heading: "Your request status has been updated",
      body:
        "We updated the status of your staging / renovation request. Sign in to your private request panel to review the latest company response, timeline, and media.",
      facts: [
        { label: "Request status", value: humanizeToken(nextStatus) },
        {
          label: "Requested goal",
          value: existing.targetGoal ? humanizeToken(existing.targetGoal) : "",
        },
      ],
    });

    res.status(200).json({ success: true, data: record });
  } catch (error) {
    console.error("Error updating staging status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update staging status",
      error: error.message,
    });
  }
});

// ──────────────────────────────────────────────────
// ADMIN: Delete staging request
// DELETE /api/staging/:id
// ──────────────────────────────────────────────────
export const deleteStagingRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.stagingRequest.delete({ where: { id } });
    res.status(200).json({ success: true, message: "Request deleted" });
  } catch (error) {
    console.error("Error deleting staging request:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete staging request",
      error: error.message,
    });
  }
});

// ──────────────────────────────────────────────────
// ADMIN: Create / update staging project
// PUT /api/staging/:id/project
// ──────────────────────────────────────────────────
export const upsertStagingProject = asyncHandler(async (req, res) => {
  const { id } = req.params; // staging request ID
  const { data } = validateProjectUpdate(req.body);

  const request = await prisma.stagingRequest.findUnique({
    where: { id },
    include: {
      project: {
        select: {
          published: true,
        },
      },
    },
  });
  if (!request) {
    return res.status(404).json({ success: false, message: "Staging request not found" });
  }

  try {
    const wasPublished = Boolean(request.project?.published);
    const project = await prisma.stagingProject.upsert({
      where: { requestId: id },
      create: {
        requestId: id,
        city: request.city,
        district: request.district,
        propertyType: request.propertyType,
        ...data,
      },
      update: data,
      include: {
        package: true,
      },
    });

    if (!wasPublished && project.published) {
      await sendStagingUserNotification({
        request,
        project,
        subject: "HB Staging Showcase Published",
        heading: "Your project showcase is now live",
        body:
          "We published your staging / renovation project showcase. You can review the full company story, media, and current scope from your private request panel.",
        facts: [
          {
            label: "Project",
            value:
              project.title ||
              project.caseStudyContent?.headline ||
              humanizeToken(project.projectCategory),
          },
          {
            label: "Project status",
            value: project.status ? humanizeToken(project.status) : "",
          },
        ],
      });
    }

    res.status(200).json({ success: true, data: project });
  } catch (error) {
    console.error("Error upserting staging project:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save staging project",
      error: error.message,
    });
  }
});

// ──────────────────────────────────────────────────
// ADMIN: Get staging project detail
// GET /api/staging/project/:projectId
// ──────────────────────────────────────────────────
export const getStagingProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  try {
    const project = await prisma.stagingProject.findUnique({
      where: { id: projectId },
      include: { request: true, package: true },
    });

    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    res.status(200).json({ success: true, data: project });
  } catch (error) {
    console.error("Error fetching staging project:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch project",
      error: error.message,
    });
  }
});

// ──────────────────────────────────────────────────
// ADMIN: Update project status
// PUT /api/staging/project/:projectId/status
// ──────────────────────────────────────────────────
export const updateProjectStatus = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { status } = req.body;

  try {
    const project = await prisma.stagingProject.update({
      where: { id: projectId },
      data: { status },
      include: {
        request: {
          select: {
            fullName: true,
            email: true,
          },
        },
        package: true,
      },
    });

    await sendStagingUserNotification({
      request: project.request,
      project,
      subject: "HB Project Progress Update",
      heading: "Your project progress has been updated",
      body:
        "We updated the progress stage of your staging / renovation project. Sign in to your private request panel to review the latest timeline, media, and company notes.",
      facts: [
        { label: "Project status", value: humanizeToken(status) },
        {
          label: "Project",
          value:
            project.title ||
            project.caseStudyContent?.headline ||
            humanizeToken(project.projectCategory),
        },
      ],
    });

    res.status(200).json({ success: true, data: project });
  } catch (error) {
    console.error("Error updating project status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update project status",
      error: error.message,
    });
  }
});

// ──────────────────────────────────────────────────
// ADMIN: CRUD for ServicePackage
// ──────────────────────────────────────────────────
export const getAllPackages = asyncHandler(async (_req, res) => {
  try {
    const packages = await prisma.servicePackage.findMany({
      orderBy: { order: "asc" },
    });
    res.status(200).json({ success: true, data: packages });
  } catch (error) {
    console.error("Error fetching packages:", error);
    res.status(500).json({ success: false, message: "Failed to fetch packages", error: error.message });
  }
});

export const getPackage = asyncHandler(async (req, res) => {
  const { packageId } = req.params;
  try {
    const pkg = await prisma.servicePackage.findUnique({ where: { id: packageId } });
    if (!pkg) return res.status(404).json({ success: false, message: "Package not found" });
    res.status(200).json({ success: true, data: pkg });
  } catch (error) {
    console.error("Error fetching package:", error);
    res.status(500).json({ success: false, message: "Failed to fetch package", error: error.message });
  }
});

export const createPackage = asyncHandler(async (req, res) => {
  const body = req.body;
  try {
    const pkg = await prisma.servicePackage.create({
      data: {
        name: body.name,
        name_en: body.name_en || null,
        name_tr: body.name_tr || null,
        name_ru: body.name_ru || null,
        slug: body.slug,
        description: body.description || null,
        description_en: body.description_en || null,
        description_tr: body.description_tr || null,
        description_ru: body.description_ru || null,
        category: body.category,
        servicesIncluded: Array.isArray(body.servicesIncluded) ? body.servicesIncluded : [],
        priceFrom: body.priceFrom ?? null,
        priceTo: body.priceTo ?? null,
        priceCurrency: body.priceCurrency || "USD",
        estimatedDays: body.estimatedDays ?? null,
        features: body.features || null,
        features_en: body.features_en || null,
        features_tr: body.features_tr || null,
        features_ru: body.features_ru || null,
        published: body.published ?? true,
        order: body.order ?? 0,
      },
    });
    res.status(201).json({ success: true, data: pkg });
  } catch (error) {
    console.error("Error creating package:", error);
    res.status(500).json({ success: false, message: "Failed to create package", error: error.message });
  }
});

export const updatePackage = asyncHandler(async (req, res) => {
  const { packageId } = req.params;
  const body = req.body;
  try {
    const pkg = await prisma.servicePackage.update({
      where: { id: packageId },
      data: body,
    });
    res.status(200).json({ success: true, data: pkg });
  } catch (error) {
    console.error("Error updating package:", error);
    res.status(500).json({ success: false, message: "Failed to update package", error: error.message });
  }
});

export const deletePackage = asyncHandler(async (req, res) => {
  const { packageId } = req.params;
  try {
    await prisma.servicePackage.delete({ where: { id: packageId } });
    res.status(200).json({ success: true, message: "Package deleted" });
  } catch (error) {
    console.error("Error deleting package:", error);
    res.status(500).json({ success: false, message: "Failed to delete package", error: error.message });
  }
});

// ──────────────────────────────────────────────────
// PUBLIC: Get published packages (for service pages)
// GET /api/staging/packages/public
// ──────────────────────────────────────────────────
export const getPublicPackages = asyncHandler(async (_req, res) => {
  try {
    const packages = await prisma.servicePackage.findMany({
      where: { published: true },
      orderBy: { order: "asc" },
    });
    res.status(200).json({ success: true, data: packages });
  } catch (error) {
    console.error("Error fetching public packages:", error);
    res.status(500).json({ success: false, message: "Failed to fetch packages", error: error.message });
  }
});

const publicProjectPayload = {
  id: true,
  title: true,
  title_en: true,
  title_tr: true,
  title_ru: true,
  slug: true,
  city: true,
  district: true,
  propertyType: true,
  projectCategory: true,
  budgetEstimate: true,
  budgetCurrency: true,
  timelineEstimate: true,
  timelineEstimate_en: true,
  timelineEstimate_tr: true,
  timelineEstimate_ru: true,
  servicesIncluded: true,
  beforePhotos: true,
  afterPhotos: true,
  beforeVideos: true,
  afterVideos: true,
  floorPlanUrl: true,
  virtualTourUrl: true,
  droneFootageUrl: true,
  expectedValueUplift: true,
  expectedRentalUplift: true,
  expectedSaleSpeedDays: true,
  caseStudyContent: true,
  caseStudyContent_en: true,
  caseStudyContent_tr: true,
  caseStudyContent_ru: true,
  notes: true,
  updatedAt: true,
  package: {
    select: {
      id: true,
      name: true,
      name_en: true,
      name_tr: true,
      name_ru: true,
      slug: true,
      description: true,
      description_en: true,
      description_tr: true,
      description_ru: true,
      category: true,
      servicesIncluded: true,
      priceFrom: true,
      priceTo: true,
      priceCurrency: true,
      estimatedDays: true,
    },
  },
};

// ──────────────────────────────────────────────────
// PUBLIC: Published staging projects (showcase)
// GET /api/staging/projects/public
// ──────────────────────────────────────────────────
export const getPublicPublishedProjects = asyncHandler(async (_req, res) => {
  try {
    const projects = await prisma.stagingProject.findMany({
      where: { published: true },
      orderBy: { updatedAt: "desc" },
      select: publicProjectPayload,
    });
    res.status(200).json({ success: true, data: projects });
  } catch (error) {
    console.error("Error fetching public staging projects:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch projects",
      error: error.message,
    });
  }
});

// ──────────────────────────────────────────────────
// PUBLIC: Single published project (by id or slug)
// GET /api/staging/projects/public/:projectIdOrSlug
// ──────────────────────────────────────────────────
export const getPublicPublishedProjectDetail = asyncHandler(async (req, res) => {
  const raw = String(req.params.projectIdOrSlug || "").trim();
  if (!raw) {
    return res.status(400).json({ success: false, message: "Invalid project identifier" });
  }

  const isObjectId = /^[a-f0-9]{24}$/i.test(raw);

  try {
    const project = await prisma.stagingProject.findFirst({
      where: isObjectId
        ? { id: raw, published: true }
        : { slug: raw, published: true },
      select: publicProjectPayload,
    });

    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    res.status(200).json({ success: true, data: project });
  } catch (error) {
    console.error("Error fetching public staging project:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch project",
      error: error.message,
    });
  }
});
