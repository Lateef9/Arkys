import { extractFromText } from "../ai/extractor.js";
import { AppError } from "../middleware/error.middleware.js";
import { encounterRepository } from "../repositories/encounter.repository.js";
import { eventRepository } from "../repositories/event.repository.js";
import { normalizeExtractedEvents } from "./normalization.service.js";

export const extractionService = {
  async extractEncounter(encounterId: string) {
    const encounter = await encounterRepository.findById(encounterId);
    if (!encounter) {
      throw new AppError("ENCOUNTER_NOT_FOUND", "Encounter not found", 404);
    }

    const extracted = await extractFromText(encounter.rawText);
    const normalized = normalizeExtractedEvents(extracted.events);

    // Re-extract replaces prior events for this encounter only (history of other encounters kept).
    await eventRepository.deleteByEncounterId(encounterId);

    const saved = [];
    for (const event of normalized) {
      const record = await eventRepository.createWithEvidence({
        patientId: encounter.patientId,
        encounterId: encounter.id,
        eventType: event.eventType,
        entity: event.entity,
        value: event.value,
        status: event.status,
        confidence: event.confidence ?? null,
        occurredAt: encounter.occurredAt,
        evidenceText: event.evidenceText,
        evidenceSourceId: encounter.id,
      });
      saved.push(record);
    }

    // Explicit guarantee for Phase 4: extractor never writes patient_state.
    const stateCount = await eventRepository.countPatientState(
      encounter.patientId,
    );

    return {
      encounterId: encounter.id,
      patientId: encounter.patientId,
      events: saved,
      patientStateRows: stateCount,
    };
  },
};
