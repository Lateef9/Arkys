import { conflictRepository } from "../repositories/conflict.repository.js";
import { correctionRepository } from "../repositories/correction.repository.js";
import { eventRepository } from "../repositories/event.repository.js";
import { stateRepository } from "../repositories/state.repository.js";
import { detectConflicts } from "./conflict-engine.service.js";
import {
  applyClinicianEdits,
  toTemporalEvents,
} from "./effective-events.service.js";
import { derivePatientState } from "./patient-state.service.js";
import {
  groupTimelineByDate,
  orderEventsChronologically,
} from "./temporal-engine.service.js";
import { patientService } from "./patient.service.js";

/**
 * Deterministic intelligence layer.
 * Never uses LLM. Recomputes state + conflicts from stored events + clinician edits.
 */
export const intelligenceService = {
  async loadEffectiveEvents(patientId: string) {
    const events = await eventRepository.listByPatientId(patientId);
    const edits = await correctionRepository.listByPatientId(patientId);
    return applyClinicianEdits(events, edits);
  },

  async recompute(patientId: string) {
    await patientService.getById(patientId);

    const effective = await this.loadEffectiveEvents(patientId);
    const temporal = orderEventsChronologically(toTemporalEvents(effective));

    const state = derivePatientState(patientId, temporal);
    const conflicts = detectConflicts(patientId, temporal);

    const savedState = await stateRepository.replaceForPatient(patientId, state);
    const savedConflicts = await conflictRepository.replaceForPatient(
      patientId,
      conflicts,
    );

    return {
      events: temporal,
      state: savedState,
      conflicts: savedConflicts,
    };
  },

  async listEvents(patientId: string) {
    await patientService.getById(patientId);
    // Return original immutable events (edits are separate).
    const events = await eventRepository.listByPatientId(patientId);
    return orderEventsChronologically(toTemporalEvents(events));
  },

  async getTimeline(patientId: string) {
    await patientService.getById(patientId);
    const events = await eventRepository.listByPatientId(patientId);
    const temporal = toTemporalEvents(events);
    return {
      patientId,
      groups: groupTimelineByDate(temporal),
      events: orderEventsChronologically(temporal),
    };
  },

  async getState(patientId: string) {
    await patientService.getById(patientId);
    const recomputed = await this.recompute(patientId);
    return recomputed.state.map((row) => ({
      ...row,
      displayStatus:
        row.entityType === "medication" && row.status === "INACTIVE"
          ? "Stopped"
          : row.status,
    }));
  },

  async getConflicts(patientId: string) {
    await patientService.getById(patientId);
    const recomputed = await this.recompute(patientId);
    return recomputed.conflicts;
  },
};
