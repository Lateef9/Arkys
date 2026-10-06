import type { Request, Response } from "express";
import { evaluationService } from "../services/evaluation.service.js";

export const evaluationController = {
  async listCases(_req: Request, res: Response) {
    const cases = await evaluationService.listCases();
    res.json({ success: true, data: cases });
  },

  async run(_req: Request, res: Response) {
    const result = await evaluationService.run();
    res.status(201).json({ success: true, data: result });
  },

  async summary(_req: Request, res: Response) {
    const summary = await evaluationService.summary();
    res.json({ success: true, data: summary });
  },
};
