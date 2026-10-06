import type { Request, Response } from "express";
import {
  createCorrectionSchema,
  eventIdParamSchema,
} from "../schemas/correction.schema.js";
import { correctionService } from "../services/correction.service.js";

export const correctionController = {
  async create(req: Request, res: Response) {
    const { id } = eventIdParamSchema.parse(req.params);
    const input = createCorrectionSchema.parse(req.body);
    const result = await correctionService.correctEvent(id, input);
    res.status(201).json({ success: true, data: result });
  },
};
