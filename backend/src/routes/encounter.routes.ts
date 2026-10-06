import { Router } from "express";
import { extractionController } from "../controllers/extraction.controller.js";
import { asyncHandler } from "../utils/async-handler.js";

export const encounterRouter = Router();

encounterRouter.post(
  "/:id/extract",
  asyncHandler(extractionController.extract),
);
