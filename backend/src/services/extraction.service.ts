import { extractFromText } from "../ai/extractor.js";
import { AppError } from "../middleware/error.middleware.js";
import { conflictRepository } from "../repositories/conflict.repository.js";
import { encounterRepository } from "../repositories/encounter.repository.js";
import { eventRepository } from "../repositories/event.repository.js";
import { stateRepository } from "../repositories/state.repository.js";
import { intelligenceService } from "./intelligence.service.js";
import { normalizeExtractedEvents } from "./normalization.service.js";

export const extractionService = {
  async extractEncounter(encounterId: string) {
    const encounter = await encounterRepository.findById(encounterId);
    if (!encounter) {
      throw new AppError("ENCOUNTER_NOT_FOUND", "Encounter not found", 404);
    }

    const extracted = await extractFromText(encounter.rawText);
    const normalized = normalizeExtractedEvents(extracted.events);

    // Clear derived rows before mutating events so FKs never block deletes.
    await conflictRepository.replaceForPatient(encounter.patientId, []);
    await stateRepository.replaceForPatient(encounter.patientId, []);

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

    // Deterministic recompute — LLM never writes patient_state.
    const recomputed = await intelligenceService.recompute(encounter.patientId);

    return {
      encounterId: encounter.id,
      patientId: encounter.patientId,
      events: saved,
      patientState: recomputed.state,
      conflicts: recomputed.conflicts,
    };
  },
};
