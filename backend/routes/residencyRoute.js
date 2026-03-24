import express from "express";
import {
  createResidency,
  getAllResidencies,
  getResidency,
  getResidenciesByConsultant,
  updateResidency,
  deleteResidency,
} from "../controllers/resdCntrl.js";
import jwtCheck from "../config/authOConfig.js";
import { requireAdminUser } from "../middleware/requireAdminUser.js";

const router = express.Router();

router.post("/create", jwtCheck, requireAdminUser, createResidency);
router.get("/allresd", getAllResidencies);
router.get("/consultant/:consultantId", getResidenciesByConsultant);
router.get("/:id", getResidency);
router.put("/update/:id", jwtCheck, requireAdminUser, updateResidency);
router.delete("/delete/:id", jwtCheck, requireAdminUser, deleteResidency);

export { router as residencyRoute };
