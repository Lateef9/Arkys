import type { TemporalEvent } from "./temporal-engine.service.js";
import { orderEventsChronologically } from "./temporal-engine.service.js";

export type DerivedConflict = {
  patientId: string;
  entity: string;
  existingEventId: string;
  newEventId: string;
  conflictType: string;
  resolution: string | null;
};

/**
 * Conflict rules (deterministic):
 * - MEDICATION_STATE_TRANSITION: same med ACTIVE → later INACTIVE/RESOLVED
 * - MEDICATION_DOSE_CONFLICT: same med, same timestamp, different doses, both ACTIVE
 */
export function detectConflicts(
  patientId: string,
  events: TemporalEvent[],
): DerivedConflict[] {
  const ordered = orderEventsChronologically(events);
  const meds = ordered.filter((e) => e.eventType === "MEDICATION");
  const conflicts: DerivedConflict[] = [];

  const byEntity = new Map<string, TemporalEvent[]>();
  for (const event of meds) {
    const list = byEntity.get(event.entity) ?? [];
    list.push(event);
    byEntity.set(event.entity, list);
  }

  for (const [entity, list] of byEntity) {
    for (let i = 0; i < list.length; i += 1) {
      for (let j = i + 1; j < list.length; j += 1) {
        const earlier = list[i]!;
        const later = list[j]!;

        if (
          earlier.status === "ACTIVE" &&
          (later.status === "INACTIVE" || later.status === "RESOLVED")
        ) {
          conflicts.push({
            patientId,
            entity,
            existingEventId: earlier.id,
            newEventId: later.id,
            conflictType: "MEDICATION_STATE_TRANSITION",
            resolution: "later_status_wins",
          });
        }

        const sameTime =
          new Date(earlier.occurredAt).getTime() ===
          new Date(later.occurredAt).getTime();
        const doseA = String(earlier.value.dose ?? "");
        const doseB = String(later.value.dose ?? "");
        if (
          sameTime &&
          earlier.status === "ACTIVE" &&
          later.status === "ACTIVE" &&
          doseA &&
          doseB &&
          doseA !== doseB
        ) {
          conflicts.push({
            patientId,
            entity,
            existingEventId: earlier.id,
            newEventId: later.id,
            conflictType: "MEDICATION_DOSE_CONFLICT",
            resolution: null,
          });
        }
      }
    }
  }

  return conflicts;
}
