import express from "express";
import { assistantChat } from "../controllers/assistantCntrl.js";

const router = express.Router();

router.post("/chat", assistantChat);

export { router as assistantRoute };
