import express from "express";
import {
  getAllBlogs,
  getAllBlogsAdmin,
  getBlog,
  createBlog,
  updateBlog,
  deleteBlog,
  togglePublish,
  reorderBlogs,
  generateAIBlog,
  generateMultipleAIBlogs,
} from "../controllers/blogCntrl.js";
import jwtCheck from "../config/authOConfig.js";
import { requireAdminUser } from "../middleware/requireAdminUser.js";

const router = express.Router();

// Public routes
router.get("/all", getAllBlogs);
router.get("/:id", getBlog);

// Admin routes (protected)
router.get("/admin/all", jwtCheck, requireAdminUser, getAllBlogsAdmin);
router.post("/create", jwtCheck, requireAdminUser, createBlog);
router.put("/update/:id", jwtCheck, requireAdminUser, updateBlog);
router.delete("/delete/:id", jwtCheck, requireAdminUser, deleteBlog);
router.patch("/toggle/:id", jwtCheck, requireAdminUser, togglePublish);
router.put("/reorder", jwtCheck, requireAdminUser, reorderBlogs);

// AI Generation routes (protected)
router.post("/generate-ai", jwtCheck, requireAdminUser, generateAIBlog);
router.post("/generate-ai-multiple", jwtCheck, requireAdminUser, generateMultipleAIBlogs);

export { router as blogRoute };
