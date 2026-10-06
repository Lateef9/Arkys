import { encounterRepository } from "../repositories/encounter.repository.js";
import type { CreateEncounterInput } from "../schemas/encounter.schema.js";
import { patientService } from "./patient.service.js";

export const encounterService = {
  async create(patientId: string, input: CreateEncounterInput) {
    await patientService.getById(patientId);
    return encounterRepository.create(patientId, {
      type: input.type,
      occurredAt: input.occurredAt,
      language: input.language ?? null,
      source: input.source,
      rawText: input.rawText,
    });
  },

  async listByPatientId(patientId: string) {
    await patientService.getById(patientId);
    return encounterRepository.listByPatientId(patientId);
  },
};
