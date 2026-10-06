import { correctionRepository } from "../repositories/correction.repository.js";
import { eventRepository } from "../repositories/event.repository.js";
import {
  applyClinicianEdits,
  toTemporalEvents,
} from "./effective-events.service.js";
import { normalizeEntity } from "./normalization.service.js";
import { orderEventsChronologically } from "./temporal-engine.service.js";
import { patientService } from "./patient.service.js";

export const labService = {
  async getHistory(patientId: string, entityRaw: string) {
    await patientService.getById(patientId);

    const entity = normalizeEntity(entityRaw);
    const events = await eventRepository.listByPatientId(patientId);
    const edits = await correctionRepository.listByPatientId(patientId);
    const effective = applyClinicianEdits(events, edits);
    const labs = orderEventsChronologically(
      toTemporalEvents(
        effective.filter(
          (e) => e.eventType === "LAB_RESULT" && e.entity === entity,
        ),
      ),
    );

    return {
      patientId,
      entity,
      points: labs.map((lab) => ({
        eventId: lab.id,
        occurredAt: lab.occurredAt,
        value: lab.value.value ?? lab.value,
        unit: lab.value.unit ?? null,
        status: lab.status,
      })),
    };
  },
};
