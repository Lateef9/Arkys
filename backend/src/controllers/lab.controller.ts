import type { Request, Response } from "express";
import { z } from "zod";
import { patientIdParamSchema } from "../schemas/patient.schema.js";
import { labService } from "../services/lab.service.js";

const labParamsSchema = patientIdParamSchema.extend({
  entity: z.string().trim().min(1),
});

export const labController = {
  async history(req: Request, res: Response) {
    const { id, entity } = labParamsSchema.parse(req.params);
    const history = await labService.getHistory(id, entity);
    res.json({ success: true, data: history });
  },
};
