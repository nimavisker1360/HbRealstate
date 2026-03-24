import express from "express";
import jwtCheck from "../config/authOConfig.js";
import { requireAdminUser } from "../middleware/requireAdminUser.js";
import {
  getAllTestimonials,
  submitTestimonial,
  getAllTestimonialsAdmin,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
  toggleTestimonialPublish,
  reorderTestimonials,
} from "../controllers/testimonialCntrl.js";

const router = express.Router();

// Public
router.get("/all", getAllTestimonials);
router.post("/submit", submitTestimonial);

// Admin (protected)
router.get("/admin/all", jwtCheck, requireAdminUser, getAllTestimonialsAdmin);
router.post("/create", jwtCheck, requireAdminUser, createTestimonial);
router.put("/update/:id", jwtCheck, requireAdminUser, updateTestimonial);
router.delete("/delete/:id", jwtCheck, requireAdminUser, deleteTestimonial);
router.patch("/toggle/:id", jwtCheck, requireAdminUser, toggleTestimonialPublish);
router.put("/reorder", jwtCheck, requireAdminUser, reorderTestimonials);

export { router as testimonialRoute };
