import type { ClinicianEditRow } from "../repositories/correction.repository.js";
import type { ClinicalEventRecord } from "../repositories/event.repository.js";
import { normalizeEntity } from "./normalization.service.js";
import type { TemporalEvent } from "./temporal-engine.service.js";

function readField(event: ClinicalEventRecord, field: string): unknown {
  if (field === "status") return event.status;
  if (field === "entity") return event.entity;
  if (field === "dose") return event.value.dose ?? null;
  if (field === "value") return event.value;
  if (field.startsWith("value.")) {
    const key = field.slice("value.".length);
    return event.value[key] ?? null;
  }
  return null;
}

function writeField(
  event: ClinicalEventRecord,
  field: string,
  newValue: unknown,
): ClinicalEventRecord {
  const next: ClinicalEventRecord = {
    ...event,
    value: { ...event.value },
  };

  if (field === "status") {
    next.status = String(newValue);
    return next;
  }

  if (field === "entity") {
    next.entity = normalizeEntity(String(newValue));
    return next;
  }

  if (field === "dose") {
    next.value.dose =
      typeof newValue === "string"
        ? newValue.trim().toLowerCase().replace(/\s+/g, "")
        : newValue;
    return next;
  }

  if (field === "value") {
    next.value =
      typeof newValue === "object" && newValue !== null
        ? (newValue as Record<string, unknown>)
        : { value: newValue };
    return next;
  }

  if (field.startsWith("value.")) {
    const key = field.slice("value.".length);
    next.value[key] = newValue;
    return next;
  }

  return next;
}

/**
 * Apply clinician_edits onto immutable clinical_events copies.
 * Original DB rows are never mutated.
 */
export function applyClinicianEdits(
  events: ClinicalEventRecord[],
  edits: ClinicianEditRow[],
): ClinicalEventRecord[] {
  const byEvent = new Map<string, ClinicianEditRow[]>();
  for (const edit of edits) {
    const list = byEvent.get(edit.eventId) ?? [];
    list.push(edit);
    byEvent.set(edit.eventId, list);
  }

  return events.map((event) => {
    const eventEdits = byEvent.get(event.id) ?? [];
    let current = { ...event, value: { ...event.value } };
    for (const edit of eventEdits) {
      current = writeField(current, edit.field, edit.newValue);
    }
    return current;
  });
}

export function toTemporalEvents(
  events: ClinicalEventRecord[],
): TemporalEvent[] {
  return events.map((event) => ({
    id: event.id,
    occurredAt: event.occurredAt,
    entity: event.entity,
    eventType: event.eventType,
    status: event.status,
    value: event.value,
    encounterId: event.encounterId,
    confidence: event.confidence,
  }));
}

export function getFieldValue(
  event: ClinicalEventRecord,
  field: string,
): unknown {
  return readField(event, field);
}
