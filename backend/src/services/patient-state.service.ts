import type { TemporalEvent } from "./temporal-engine.service.js";
import { orderEventsChronologically } from "./temporal-engine.service.js";

export type DerivedPatientState = {
  patientId: string;
  entityType: string;
  entity: string;
  currentValue: Record<string, unknown>;
  status: string;
  sourceEventId: string;
  validFrom: string;
  validUntil: string | null;
  confidence: number | null;
};

function entityTypeFromEventType(eventType: string): string {
  switch (eventType) {
    case "MEDICATION":
      return "medication";
    case "DIAGNOSIS":
    case "OBSERVATION":
      return "condition";
    case "LAB_RESULT":
      return "lab";
    case "SYMPTOM":
      return "symptom";
    default:
      return eventType.toLowerCase();
  }
}

/**
 * Reconstruct current patient state from clinical events.
 * Latest event per (entityType, entity) wins. History is not mutated.
 */
export function derivePatientState(
  patientId: string,
  events: TemporalEvent[],
): DerivedPatientState[] {
  const ordered = orderEventsChronologically(events);
  const latestByKey = new Map<string, TemporalEvent>();

  for (const event of ordered) {
    const entityType = entityTypeFromEventType(event.eventType);
    const key = `${entityType}::${event.entity}`;
    latestByKey.set(key, event);
  }

  return [...latestByKey.values()]
    .map((event) => ({
      patientId,
      entityType: entityTypeFromEventType(event.eventType),
      entity: event.entity,
      currentValue: event.value,
      status: event.status,
      sourceEventId: event.id,
      validFrom: event.occurredAt,
      validUntil: null,
      confidence: event.confidence,
    }))
    .sort((a, b) => a.entity.localeCompare(b.entity));
}
