import type { Request, Response } from "express";
import { createEncounterSchema } from "../schemas/encounter.schema.js";
import { patientIdParamSchema } from "../schemas/patient.schema.js";
import { encounterService } from "../services/encounter.service.js";

export const encounterController = {
  async create(req: Request, res: Response) {
    const { id } = patientIdParamSchema.parse(req.params);
    const input = createEncounterSchema.parse(req.body);
    const encounter = await encounterService.create(id, input);
    res.status(201).json({ success: true, data: encounter });
  },

  async list(req: Request, res: Response) {
    const { id } = patientIdParamSchema.parse(req.params);
    const encounters = await encounterService.listByPatientId(id);
    res.json({ success: true, data: encounters });
  },
};
