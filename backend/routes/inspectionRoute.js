import express from "express";
import jwtCheck from "../config/authOConfig.js";
import { requireAdminUser } from "../middleware/requireAdminUser.js";
import {
  createInspectionRequest,
  getMyInspectionRequests,
  getAllInspectionRequests,
  getInspectionRequest,
  updateInspectionRequest,
  updateInspectionStatus,
  deleteInspectionRequest,
  saveChecklist,
  saveReport,
} from "../controllers/inspectionCntrl.js";

const router = express.Router();

// Public
router.post("/request", createInspectionRequest);
router.get("/mine", jwtCheck, getMyInspectionRequests);

// Admin-only
router.get("/all", jwtCheck, requireAdminUser, getAllInspectionRequests);
router.get("/:id", jwtCheck, requireAdminUser, getInspectionRequest);
router.put("/:id", jwtCheck, requireAdminUser, updateInspectionRequest);
router.put("/:id/status", jwtCheck, requireAdminUser, updateInspectionStatus);
router.delete("/:id", jwtCheck, requireAdminUser, deleteInspectionRequest);
router.put("/:id/checklist", jwtCheck, requireAdminUser, saveChecklist);
router.put("/:id/report", jwtCheck, requireAdminUser, saveReport);

export { router as inspectionRoute };
