import { Router } from "express";
import { encounterController } from "../controllers/encounter.controller.js";
import { intelligenceController } from "../controllers/intelligence.controller.js";
import { labController } from "../controllers/lab.controller.js";
import { patientController } from "../controllers/patient.controller.js";
import { asyncHandler } from "../utils/async-handler.js";

export const patientRouter = Router();

patientRouter.post("/", asyncHandler(patientController.create));
patientRouter.get("/", asyncHandler(patientController.list));

patientRouter.get(
  "/:id/events",
  asyncHandler(intelligenceController.listEvents),
);
patientRouter.get(
  "/:id/timeline",
  asyncHandler(intelligenceController.timeline),
);
patientRouter.get("/:id/state", asyncHandler(intelligenceController.state));
patientRouter.get(
  "/:id/conflicts",
  asyncHandler(intelligenceController.conflicts),
);
patientRouter.get("/:id/labs/:entity", asyncHandler(labController.history));

patientRouter.post(
  "/:id/encounters",
  asyncHandler(encounterController.create),
);
patientRouter.get("/:id/encounters", asyncHandler(encounterController.list));

patientRouter.get("/:id", asyncHandler(patientController.getById));
