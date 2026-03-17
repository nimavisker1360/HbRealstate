import asyncHandler from "express-async-handler";
import multer from "multer";
import { uploadToBlob } from "../services/blobUpload.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 500 * 1024 * 1024,
    files: 30,
  },
});

const multerUpload = upload.array("files", 30);

export const uploadMiddleware = (req, res, next) => {
  multerUpload(req, res, (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({
          message: `File too large. Maximum size is 500MB.`,
        });
      }
      if (err.code === "LIMIT_FILE_COUNT") {
        return res.status(400).json({
          message: "Too many files. Maximum is 30 files per request.",
        });
      }
      return res.status(400).json({
        message: err.message || "File upload error",
      });
    }
    next();
  });
};

export const handleUpload = asyncHandler(async (req, res) => {
  const files = req.files;
  if (!files || files.length === 0) {
    return res.status(400).json({ message: "No files provided" });
  }

  const folder = req.body.folder || "uploads";
  const results = [];
  const errors = [];

  for (const file of files) {
    try {
      const result = await uploadToBlob(file, folder);
      results.push(result);
    } catch (err) {
      errors.push({ file: file.originalname, error: err.message });
    }
  }

  if (results.length === 0 && errors.length > 0) {
    return res.status(400).json({ message: "All uploads failed", errors });
  }

  res.json({
    files: results,
    ...(errors.length > 0 ? { errors } : {}),
  });
});
