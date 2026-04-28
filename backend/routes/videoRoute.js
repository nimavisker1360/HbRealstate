import express from "express";
import jwtCheck from "../config/authOConfig.js";
import { requireAdminUser } from "../middleware/requireAdminUser.js";
import {
  createVideoEventRecord,
  createVideoUpload,
  getProjectVideos,
  getPropertyVideos,
  handleVideoWebhook,
  listAdminVideos,
  updateAdminVideo,
} from "../controllers/videoController.js";

const router = express.Router();

router.post("/create-upload", jwtCheck, requireAdminUser, createVideoUpload);
router.post("/webhook", handleVideoWebhook);
router.get("/property/:propertyId", getPropertyVideos);
router.get("/project/:projectId", getProjectVideos);
router.get("/admin/all", jwtCheck, requireAdminUser, listAdminVideos);
router.patch("/:videoId", jwtCheck, requireAdminUser, updateAdminVideo);

export { router as videoRoute };

const videoEventRouter = express.Router();
videoEventRouter.post("/", createVideoEventRecord);

export { videoEventRouter };
