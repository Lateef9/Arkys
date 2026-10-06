import { Router } from "express";
import { encounterController } from "../controllers/encounter.controller.js";
import { patientController } from "../controllers/patient.controller.js";
import { asyncHandler } from "../utils/async-handler.js";

export const patientRouter = Router();

patientRouter.post("/", asyncHandler(patientController.create));
patientRouter.get("/", asyncHandler(patientController.list));
patientRouter.get("/:id", asyncHandler(patientController.getById));

patientRouter.post(
  "/:id/encounters",
  asyncHandler(encounterController.create),
);
patientRouter.get("/:id/encounters", asyncHandler(encounterController.list));
