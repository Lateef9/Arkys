import type { Request, Response } from "express";
import { patientIdParamSchema } from "../schemas/patient.schema.js";
import { intelligenceService } from "../services/intelligence.service.js";

export const intelligenceController = {
  async listEvents(req: Request, res: Response) {
    const { id } = patientIdParamSchema.parse(req.params);
    const events = await intelligenceService.listEvents(id);
    res.json({ success: true, data: events });
  },

  async timeline(req: Request, res: Response) {
    const { id } = patientIdParamSchema.parse(req.params);
    const timeline = await intelligenceService.getTimeline(id);
    res.json({ success: true, data: timeline });
  },

  async state(req: Request, res: Response) {
    const { id } = patientIdParamSchema.parse(req.params);
    const state = await intelligenceService.getState(id);
    res.json({ success: true, data: state });
  },

  async conflicts(req: Request, res: Response) {
    const { id } = patientIdParamSchema.parse(req.params);
    const conflicts = await intelligenceService.getConflicts(id);
    res.json({ success: true, data: conflicts });
  },
};
