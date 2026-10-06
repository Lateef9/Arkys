import type { Request, Response } from "express";
import { z } from "zod";
import { provenanceService } from "../services/provenance.service.js";

const eventIdParamSchema = z.object({
  id: z.string().uuid("id must be a valid UUID"),
});

export const eventController = {
  async getById(req: Request, res: Response) {
    const { id } = eventIdParamSchema.parse(req.params);
    const event = await provenanceService.getEvent(id);
    res.json({ success: true, data: event });
  },

  async getEvidence(req: Request, res: Response) {
    const { id } = eventIdParamSchema.parse(req.params);
    const result = await provenanceService.getEvidence(id);
    res.json({ success: true, data: result });
  },
};
