import type { ExtractedEvent } from "../schemas/extraction.schema.js";

const ENTITY_ALIASES: Record<string, string> = {
  "high blood pressure": "hypertension",
  htn: "hypertension",
  amlodipin: "amlodipine",
  "hb a1c": "hba1c",
  "hba1c": "hba1c",
  "ldl": "ldl_cholesterol",
  "ldl cholesterol": "ldl_cholesterol",
  "ldl_cholesterol": "ldl_cholesterol",
  creatinine: "creatinine",
  headache: "headache",
  hypertension: "hypertension",
  amlodipine: "amlodipine",
};

export function normalizeEntity(entity: string): string {
  const key = entity.trim().toLowerCase();
  return ENTITY_ALIASES[key] ?? key.replace(/\s+/g, "_");
}

function normalizeDose(value: Record<string, unknown>): Record<string, unknown> {
  if (typeof value.dose === "string") {
    return {
      ...value,
      dose: value.dose.trim().toLowerCase().replace(/\s+/g, ""),
    };
  }
  return value;
}

export function normalizeExtractedEvents(
  events: ExtractedEvent[],
): ExtractedEvent[] {
  return events.map((event) => ({
    ...event,
    entity: normalizeEntity(event.entity),
    value: normalizeDose({ ...event.value }),
    status: event.status,
  }));
}
