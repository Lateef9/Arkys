import type { Request, Response } from "express";
import { encounterIdParamSchema } from "../schemas/extraction.schema.js";
import { extractionService } from "../services/extraction.service.js";

export const extractionController = {
  async extract(req: Request, res: Response) {
    const { id } = encounterIdParamSchema.parse(req.params);
    const result = await extractionService.extractEncounter(id);
    res.status(201).json({ success: true, data: result });
  },
};
