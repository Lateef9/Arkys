import { Router } from "express";
import { correctionController } from "../controllers/correction.controller.js";
import { eventController } from "../controllers/event.controller.js";
import { asyncHandler } from "../utils/async-handler.js";

export const eventRouter = Router();

eventRouter.get("/:id/evidence", asyncHandler(eventController.getEvidence));
eventRouter.post(
  "/:id/correction",
  asyncHandler(correctionController.create),
);
eventRouter.get("/:id", asyncHandler(eventController.getById));
