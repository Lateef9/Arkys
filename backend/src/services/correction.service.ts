import { AppError } from "../middleware/error.middleware.js";
import { correctionRepository } from "../repositories/correction.repository.js";
import { eventRepository } from "../repositories/event.repository.js";
import type { CreateCorrectionInput } from "../schemas/correction.schema.js";
import {
  applyClinicianEdits,
  getFieldValue,
} from "./effective-events.service.js";
import { intelligenceService } from "./intelligence.service.js";

export const correctionService = {
  async correctEvent(eventId: string, input: CreateCorrectionInput) {
    const original = await eventRepository.findById(eventId);
    if (!original) {
      throw new AppError("EVENT_NOT_FOUND", "Event not found", 404);
    }

    const existingEdits = await correctionRepository.listByEventId(eventId);
    const [effective] = applyClinicianEdits([original], existingEdits);
    const oldValue = getFieldValue(effective ?? original, input.field);

    const edit = await correctionRepository.create({
      eventId,
      field: input.field,
      oldValue,
      newValue: input.newValue,
      reason: input.reason ?? null,
    });

    // Original clinical_events row is intentionally unchanged.
    const stillThere = await eventRepository.findById(eventId);
    if (!stillThere) {
      throw new AppError("EVENT_NOT_FOUND", "Original event missing", 500);
    }

    const recomputed = await intelligenceService.recompute(original.patientId);

    return {
      originalEvent: stillThere,
      edit,
      patientState: recomputed.state,
      message:
        "Original event preserved. Correction recorded. Patient state recomputed.",
    };
  },
};
