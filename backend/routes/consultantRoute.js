import express from "express";
import {
  getAllConsultants,
  getConsultant,
  createConsultant,
  updateConsultant,
  deleteConsultant,
  toggleAvailability,
  reorderConsultants,
} from "../controllers/consultantCntrl.js";
import jwtCheck from "../config/authOConfig.js";
import { requireAdminUser } from "../middleware/requireAdminUser.js";

const router = express.Router();

// Public routes
router.get("/all", getAllConsultants);
router.get("/:id", getConsultant);

// Protected routes (admin only)
router.post("/create", jwtCheck, requireAdminUser, createConsultant);
router.put("/update/:id", jwtCheck, requireAdminUser, updateConsultant);
router.delete("/delete/:id", jwtCheck, requireAdminUser, deleteConsultant);
router.patch("/toggle/:id", jwtCheck, requireAdminUser, toggleAvailability);
router.put("/reorder", jwtCheck, requireAdminUser, reorderConsultants);

export { router as consultantRoute };
