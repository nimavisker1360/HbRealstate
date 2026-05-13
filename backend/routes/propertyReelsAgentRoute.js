import express from "express";
import jwtCheck from "../config/authOConfig.js";
import { requireAdminUser } from "../middleware/requireAdminUser.js";
import {
  createPropertyReelsAgent,
  getPropertyReelsAgentSession,
  listPropertyReelsAgents,
  loginPropertyReelsAgent,
  updatePropertyReelsAgent,
} from "../controllers/propertyReelsAgentCntrl.js";

const router = express.Router();

router.post("/login", loginPropertyReelsAgent);
router.get("/session", getPropertyReelsAgentSession);
router.get("/", jwtCheck, requireAdminUser, listPropertyReelsAgents);
router.post("/", jwtCheck, requireAdminUser, createPropertyReelsAgent);
router.patch("/:agentId", jwtCheck, requireAdminUser, updatePropertyReelsAgent);

export { router as propertyReelsAgentRoute };
