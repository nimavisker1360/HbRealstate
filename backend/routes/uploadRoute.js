import express from "express";
import jwtCheck from "../config/authOConfig.js";
import { uploadMiddleware, handleUpload } from "../controllers/uploadCntrl.js";

const router = express.Router();

router.post("/", jwtCheck, uploadMiddleware, handleUpload);

export { router as uploadRoute };
