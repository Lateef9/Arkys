import type { Request, Response } from "express";
import {
  createPatientSchema,
  patientIdParamSchema,
} from "../schemas/patient.schema.js";
import { patientService } from "../services/patient.service.js";

export const patientController = {
  async create(req: Request, res: Response) {
    const input = createPatientSchema.parse(req.body);
    const patient = await patientService.create(input);
    res.status(201).json({ success: true, data: patient });
  },

  async list(_req: Request, res: Response) {
    const patients = await patientService.list();
    res.json({ success: true, data: patients });
  },

  async getById(req: Request, res: Response) {
    const { id } = patientIdParamSchema.parse(req.params);
    const patient = await patientService.getById(id);
    res.json({ success: true, data: patient });
  },
};
