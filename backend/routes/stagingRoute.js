import express from "express";
import jwtCheck from "../config/authOConfig.js";
import { requireAdminUser } from "../middleware/requireAdminUser.js";
import {
  createStagingRequest,
  getMyStagingRequests,
  getAllStagingRequests,
  getStagingRequest,
  updateStagingRequest,
  updateStagingStatus,
  deleteStagingRequest,
  upsertStagingProject,
  getStagingProject,
  updateProjectStatus,
  getAllPackages,
  getPackage,
  createPackage,
  updatePackage,
  deletePackage,
  getPublicPackages,
  getPublicPublishedProjects,
  getPublicPublishedProjectDetail,
} from "../controllers/stagingCntrl.js";

const router = express.Router();

// Public
router.post("/request", createStagingRequest);
router.get("/packages/public", getPublicPackages);
router.get("/projects/public", getPublicPublishedProjects);
router.get("/projects/public/:projectIdOrSlug", getPublicPublishedProjectDetail);
router.get("/mine", jwtCheck, getMyStagingRequests);

// Admin — Service Packages
router.get("/packages", jwtCheck, requireAdminUser, getAllPackages);
router.get("/packages/:packageId", jwtCheck, requireAdminUser, getPackage);
router.post("/packages", jwtCheck, requireAdminUser, createPackage);
router.put("/packages/:packageId", jwtCheck, requireAdminUser, updatePackage);
router.delete("/packages/:packageId", jwtCheck, requireAdminUser, deletePackage);

// Admin — Staging Requests
router.get("/all", jwtCheck, requireAdminUser, getAllStagingRequests);
router.get("/:id", jwtCheck, requireAdminUser, getStagingRequest);
router.put("/:id", jwtCheck, requireAdminUser, updateStagingRequest);
router.put("/:id/status", jwtCheck, requireAdminUser, updateStagingStatus);
router.delete("/:id", jwtCheck, requireAdminUser, deleteStagingRequest);

// Admin — Staging Projects
router.put("/:id/project", jwtCheck, requireAdminUser, upsertStagingProject);
router.get("/project/:projectId", jwtCheck, requireAdminUser, getStagingProject);
router.put("/project/:projectId/status", jwtCheck, requireAdminUser, updateProjectStatus);

export { router as stagingRoute };
