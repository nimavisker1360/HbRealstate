import express from "express";
import { assistantChat, assistantTranscribe } from "../controllers/assistantCntrl.js";

const router = express.Router();

router.post("/chat", assistantChat);
router.post("/transcribe", assistantTranscribe);

export { router as assistantRoute };
