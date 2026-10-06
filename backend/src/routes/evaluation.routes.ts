import { Router } from "express";
import { evaluationController } from "../controllers/evaluation.controller.js";
import { asyncHandler } from "../utils/async-handler.js";

export const evaluationRouter = Router();

evaluationRouter.get(
  "/summary",
  asyncHandler(evaluationController.summary),
);
evaluationRouter.get("/cases", asyncHandler(evaluationController.listCases));
evaluationRouter.post("/run", asyncHandler(evaluationController.run));
