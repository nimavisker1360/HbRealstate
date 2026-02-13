import asyncHandler from "express-async-handler";
import {
  runRealEstateAssistant,
  transcribeAssistantAudio,
} from "../services/realEstateAssistant.js";

export const assistantChat = asyncHandler(async (req, res) => {
  const { message, history } = req.body || {};

  if (!message || typeof message !== "string") {
    return res.status(400).json({
      message: "message is required",
    });
  }

  try {
    const result = await runRealEstateAssistant({ message, history });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      message: "Assistant request failed",
      error: error.message,
    });
  }
});

export const assistantTranscribe = asyncHandler(async (req, res) => {
  const { audio_base64, mime_type, language } = req.body || {};

  if (!audio_base64 || typeof audio_base64 !== "string") {
    return res.status(400).json({
      message: "audio_base64 is required",
    });
  }

  try {
    const result = await transcribeAssistantAudio({
      audio_base64,
      mime_type,
      language,
    });
    return res.status(200).json(result);
  } catch (error) {
    const msg = String(error?.message || "");
    if (msg.includes("audio payload is too large")) {
      return res.status(413).json({
        message: "Assistant transcription failed",
        error: msg,
      });
    }
    if (msg.includes("audio payload is empty")) {
      return res.status(400).json({
        message: "Assistant transcription failed",
        error: msg,
      });
    }
    return res.status(500).json({
      message: "Assistant transcription failed",
      error: msg || "Unknown transcription error",
    });
  }
});
