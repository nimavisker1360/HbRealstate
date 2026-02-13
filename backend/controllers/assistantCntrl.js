import asyncHandler from "express-async-handler";
import { runRealEstateAssistant } from "../services/realEstateAssistant.js";

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
