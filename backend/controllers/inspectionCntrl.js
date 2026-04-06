import asyncHandler from "express-async-handler";
import { prisma } from "../config/prismaConfig.js";
import { getAuthenticatedEmail } from "../middleware/requireAdminUser.js";
import { extractLeadAttribution } from "../utils/leadAttribution.js";
import {
  validateInspectionRequest,
  validateInspectionUpdate,
  validateStatusTransition,
  validateChecklistItems,
} from "../validators/inspectionValidator.js";
import { computeInspectionScores } from "../services/inspectionScoring.js";

const normalizeEmail = (value = "") => String(value || "").trim().toLowerCase();

const REQUEST_TO_REPORT_STATUS = {
  report_drafting: "draft",
  report_ready: "final",
  delivered: "delivered",
};

const REPORT_TO_REQUEST_STATUS = {
  final: "report_ready",
  delivered: "delivered",
};

const buildInspectionReportSnapshot = (request, existingReport, nextReportStatus) => ({
  summary: existingReport?.summary || null,
  totalScore: existingReport?.totalScore ?? request.checklist?.totalScore ?? null,
  sectionScores: existingReport?.sectionScores ?? request.checklist?.sectionScores ?? null,
  riskLabel: existingReport?.riskLabel ?? request.checklist?.riskLabel ?? null,
  keyFindings: existingReport?.keyFindings ?? null,
  repairEstimates: existingReport?.repairEstimates ?? null,
  recommendation: existingReport?.recommendation ?? null,
  disclaimer: existingReport?.disclaimer || null,
  reportFiles: Array.isArray(existingReport?.reportFiles) ? existingReport.reportFiles.filter(Boolean) : [],
  reportPhotos: Array.isArray(existingReport?.reportPhotos) ? existingReport.reportPhotos.filter(Boolean) : [],
  status: nextReportStatus || existingReport?.status || "draft",
  generatedAt: existingReport?.generatedAt || new Date(),
  deliveredAt:
    nextReportStatus === "delivered" ? existingReport?.deliveredAt || new Date() : null,
});

// ──────────────────────────────────────────────────
// PUBLIC: Create inspection request
// POST /api/inspection/request
// ──────────────────────────────────────────────────
export const createInspectionRequest = asyncHandler(async (req, res) => {
  const { valid, errors, data } = validateInspectionRequest(req.body);

  if (!valid) {
    return res.status(400).json({ success: false, errors });
  }

  const attribution = extractLeadAttribution(req, {
    defaultLeadSource: "inspection_form",
  });

  try {
    const record = await prisma.inspectionRequest.create({
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
    console.error("Error creating inspection request:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create inspection request",
      error: error.message,
    });
  }
});

const userFacingInspectionRequestPayload = {
  id: true,
  fullName: true,
  email: true,
  phone: true,
  whatsapp: true,
  requesterType: true,
  preferredLanguage: true,
  propertyType: true,
  city: true,
  district: true,
  address: true,
  propertyUrl: true,
  uploadedImages: true,
  referenceCode: true,
  grossArea: true,
  netArea: true,
  buildingAge: true,
  floorNumber: true,
  totalFloors: true,
  occupancyStatus: true,
  requestType: true,
  urgency: true,
  notes: true,
  status: true,
  scheduledDate: true,
  visitScheduledAt: true,
  visitScheduleNotes: true,
  completedDate: true,
  createdAt: true,
  updatedAt: true,
  checklist: {
    select: {
      structuralSafety: true,
      legalCompliance: true,
      utilitiesPlumbing: true,
      electricalSafety: true,
      comfortInsulation: true,
      overallRecommendation: true,
      sectionScores: true,
      totalScore: true,
      riskLabel: true,
      completedAt: true,
    },
  },
  report: {
    select: {
      summary: true,
      totalScore: true,
      sectionScores: true,
      riskLabel: true,
      recommendation: true,
      disclaimer: true,
      keyFindings: true,
      repairEstimates: true,
      reportFiles: true,
      reportPhotos: true,
      status: true,
      generatedAt: true,
      deliveredAt: true,
      updatedAt: true,
    },
  },
};

export const getMyInspectionRequests = asyncHandler(async (req, res) => {
  const email = getAuthenticatedEmail(req);

  if (!email) {
    return res.status(403).json({
      success: false,
      message: "Authenticated email claim is required.",
    });
  }

  try {
    const requests = await prisma.inspectionRequest.findMany({
      where: {
        email: {
          equals: email,
          mode: "insensitive",
        },
      },
      orderBy: { updatedAt: "desc" },
      select: userFacingInspectionRequestPayload,
    });

    res.status(200).json({
      success: true,
      total: requests.length,
      data: requests,
    });
  } catch (error) {
    console.error("Error fetching user inspection requests:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch your inspection requests",
      error: error.message,
    });
  }
});

// ──────────────────────────────────────────────────
// ADMIN: List / filter inspection requests
// GET /api/inspection/all
// ──────────────────────────────────────────────────
export const getAllInspectionRequests = asyncHandler(async (req, res) => {
  const { status, city, urgency, search } = req.query;
  const where = {};

  if (status) where.status = status;
  if (city) where.city = { contains: city, mode: "insensitive" };
  if (urgency) where.urgency = urgency;
  if (search) {
    where.OR = [
      { fullName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { referenceCode: { contains: search, mode: "insensitive" } },
      { city: { contains: search, mode: "insensitive" } },
    ];
  }

  try {
    const requests = await prisma.inspectionRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        checklist: { select: { totalScore: true, riskLabel: true } },
        report: { select: { status: true, generatedAt: true } },
      },
    });

    res.status(200).json({
      success: true,
      total: requests.length,
      data: requests,
    });
  } catch (error) {
    console.error("Error fetching inspection requests:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch inspection requests",
      error: error.message,
    });
  }
});

// ──────────────────────────────────────────────────
// ADMIN: Get single inspection request with full relations
// GET /api/inspection/:id
// ──────────────────────────────────────────────────
export const getInspectionRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const record = await prisma.inspectionRequest.findUnique({
      where: { id },
      include: { checklist: true, report: true },
    });

    if (!record) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }

    res.status(200).json({ success: true, data: record });
  } catch (error) {
    console.error("Error fetching inspection request:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch inspection request",
      error: error.message,
    });
  }
});

// ──────────────────────────────────────────────────
// ADMIN: Update inspection request (fields, assignment, notes)
// PUT /api/inspection/:id
// ──────────────────────────────────────────────────
export const updateInspectionRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { data } = validateInspectionUpdate(req.body);
  const normalizedData = data?.email ? { ...data, email: normalizeEmail(data.email) } : data;

  try {
    const record = await prisma.inspectionRequest.update({
      where: { id },
      data: normalizedData,
    });

    res.status(200).json({ success: true, data: record });
  } catch (error) {
    console.error("Error updating inspection request:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update inspection request",
      error: error.message,
    });
  }
});

// ──────────────────────────────────────────────────
// ADMIN: Update inspection status (safe transitions)
// PUT /api/inspection/:id/status
// ──────────────────────────────────────────────────
export const updateInspectionStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status: nextStatus } = req.body;

  try {
    const existing = await prisma.inspectionRequest.findUnique({
      where: { id },
      include: {
        checklist: {
          select: {
            totalScore: true,
            sectionScores: true,
            riskLabel: true,
          },
        },
        report: true,
      },
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }

    const transition = validateStatusTransition(existing.status, nextStatus);
    if (!transition.valid) {
      return res.status(400).json({ success: false, message: transition.message });
    }

    const updateData = { status: nextStatus };
    if (nextStatus === "inspection_completed" && !existing.completedDate) {
      updateData.completedDate = new Date();
    }

    const syncedReportStatus = REQUEST_TO_REPORT_STATUS[nextStatus] || null;
    const operations = [
      prisma.inspectionRequest.update({
        where: { id },
        data: updateData,
      }),
    ];

    if (syncedReportStatus) {
      const reportSnapshot = buildInspectionReportSnapshot(existing, existing.report, syncedReportStatus);
      operations.push(
        prisma.inspectionReport.upsert({
          where: { requestId: id },
          create: {
            requestId: id,
            ...reportSnapshot,
          },
          update: reportSnapshot,
        })
      );
    }

    const [record] = await prisma.$transaction(operations);

    res.status(200).json({ success: true, data: record });
  } catch (error) {
    console.error("Error updating inspection status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update inspection status",
      error: error.message,
    });
  }
});

// ──────────────────────────────────────────────────
// ADMIN: Delete inspection request
// DELETE /api/inspection/:id
// ──────────────────────────────────────────────────
export const deleteInspectionRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.inspectionRequest.delete({ where: { id } });
    res.status(200).json({ success: true, message: "Request deleted" });
  } catch (error) {
    console.error("Error deleting inspection request:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete inspection request",
      error: error.message,
    });
  }
});

// ──────────────────────────────────────────────────
// ADMIN: Save / update checklist (with auto-scoring)
// PUT /api/inspection/:id/checklist
// ──────────────────────────────────────────────────
export const saveChecklist = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const body = req.body;

  const existing = await prisma.inspectionRequest.findUnique({ where: { id } });
  if (!existing) {
    return res.status(404).json({ success: false, message: "Request not found" });
  }

  const sections = {
    structuralSafety: validateChecklistItems(body.structuralSafety),
    legalCompliance: validateChecklistItems(body.legalCompliance),
    utilitiesPlumbing: validateChecklistItems(body.utilitiesPlumbing),
    electricalSafety: validateChecklistItems(body.electricalSafety),
    comfortInsulation: validateChecklistItems(body.comfortInsulation),
    overallRecommendation: body.overallRecommendation || null,
  };

  const { sectionScores, totalScore, riskLabel } = computeInspectionScores(sections);

  try {
    const checklist = await prisma.inspectionChecklist.upsert({
      where: { requestId: id },
      create: {
        requestId: id,
        ...sections,
        sectionScores,
        totalScore,
        riskLabel,
        completedBy: body.completedBy || null,
        completedAt: body.markComplete ? new Date() : null,
      },
      update: {
        ...sections,
        sectionScores,
        totalScore,
        riskLabel,
        completedBy: body.completedBy || undefined,
        completedAt: body.markComplete ? new Date() : undefined,
      },
    });

    res.status(200).json({ success: true, data: checklist });
  } catch (error) {
    console.error("Error saving checklist:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save checklist",
      error: error.message,
    });
  }
});

// ──────────────────────────────────────────────────
// ADMIN: Generate / update report
// PUT /api/inspection/:id/report
// ──────────────────────────────────────────────────
export const saveReport = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const body = req.body;

  const existing = await prisma.inspectionRequest.findUnique({
    where: { id },
    include: { checklist: true },
  });

  if (!existing) {
    return res.status(404).json({ success: false, message: "Request not found" });
  }

  const reportData = {
    summary: body.summary || null,
    totalScore: existing.checklist?.totalScore ?? body.totalScore ?? null,
    sectionScores: existing.checklist?.sectionScores ?? body.sectionScores ?? null,
    riskLabel: existing.checklist?.riskLabel ?? body.riskLabel ?? null,
    keyFindings: body.keyFindings || null,
    repairEstimates: body.repairEstimates || null,
    recommendation: body.recommendation || null,
    disclaimer: body.disclaimer || null,
    reportFiles: Array.isArray(body.reportFiles) ? body.reportFiles.filter(Boolean) : [],
    reportPhotos: Array.isArray(body.reportPhotos) ? body.reportPhotos.filter(Boolean) : [],
    status: body.status || "draft",
    generatedAt: body.generatedAt ? new Date(body.generatedAt) : new Date(),
    deliveredAt: body.status === "delivered" ? new Date() : undefined,
  };

  try {
    const syncedRequestStatus = REPORT_TO_REQUEST_STATUS[reportData.status] || null;
    const requestUpdateData =
      syncedRequestStatus && syncedRequestStatus !== existing.status
        ? {
            status: syncedRequestStatus,
            ...(!existing.completedDate ? { completedDate: new Date() } : {}),
          }
        : null;

    const operations = [];

    if (requestUpdateData) {
      operations.push(
        prisma.inspectionRequest.update({
          where: { id },
          data: requestUpdateData,
        })
      );
    }

    operations.push(
      prisma.inspectionReport.upsert({
        where: { requestId: id },
        create: { requestId: id, ...reportData },
        update: reportData,
      })
    );

    const results = await prisma.$transaction(operations);
    const report = results[results.length - 1];

    res.status(200).json({ success: true, data: report });
  } catch (error) {
    console.error("Error saving report:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save report",
      error: error.message,
    });
  }
});
