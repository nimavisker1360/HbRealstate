import express from "express";
import {
  sendEmail,
  getAllMessages,
  deleteMessage,
  markAsRead,
} from "../controllers/emailCntrl.js";

const router = express.Router();

// POST /api/email/send
router.post("/send", sendEmail);

// GET /api/email/messages
router.get("/messages", getAllMessages);

// DELETE /api/email/messages/:id
router.delete("/messages/:id", deleteMessage);

// PUT /api/email/messages/:id/read
router.put("/messages/:id/read", markAsRead);

export { router as emailRoute };
