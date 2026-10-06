import { describe, expect, it } from "vitest";
import { detectConflicts } from "../src/services/conflict-engine.service.js";
import { derivePatientState } from "../src/services/patient-state.service.js";
import {
  orderEventsChronologically,
  type TemporalEvent,
} from "../src/services/temporal-engine.service.js";

const sampleEvents: TemporalEvent[] = [
  {
    id: "e3",
    occurredAt: "2026-03-12T09:00:00.000Z",
    entity: "amlodipine",
    eventType: "MEDICATION",
    status: "ACTIVE",
    value: { dose: "5mg" },
    encounterId: "enc3",
    confidence: 0.9,
  },
  {
    id: "e1",
    occurredAt: "2026-01-10T09:00:00.000Z",
    entity: "amlodipine",
    eventType: "MEDICATION",
    status: "ACTIVE",
    value: { dose: "5mg" },
    encounterId: "enc1",
    confidence: 0.9,
  },
  {
    id: "e4",
    occurredAt: "2026-04-05T09:00:00.000Z",
    entity: "amlodipine",
    eventType: "MEDICATION",
    status: "INACTIVE",
    value: { note: "stopped" },
    encounterId: "enc4",
    confidence: 0.9,
  },
  {
    id: "e2",
    occurredAt: "2026-02-15T09:00:00.000Z",
    entity: "hba1c",
    eventType: "LAB_RESULT",
    status: "ACTIVE",
    value: { value: 7.4 },
    encounterId: "enc2",
    confidence: 0.9,
  },
];

describe("temporal engine", () => {
  it("orders events chronologically", () => {
    const ordered = orderEventsChronologically(sampleEvents);
    expect(ordered.map((e) => e.id)).toEqual(["e1", "e2", "e3", "e4"]);
  });
});

describe("patient state engine", () => {
  it("sets amlodipine current status to INACTIVE while history remains in events", () => {
    const state = derivePatientState("patient-1", sampleEvents);
    const amlo = state.find((s) => s.entity === "amlodipine");

    expect(amlo?.status).toBe("INACTIVE");
    expect(amlo?.sourceEventId).toBe("e4");

    const activeHistory = sampleEvents.filter(
      (e) => e.entity === "amlodipine" && e.status === "ACTIVE",
    );
    expect(activeHistory).toHaveLength(2);
  });
});

describe("conflict engine", () => {
  it("detects medication state transition ACTIVE → INACTIVE", () => {
    const conflicts = detectConflicts("patient-1", sampleEvents);
    const transition = conflicts.find(
      (c) => c.conflictType === "MEDICATION_STATE_TRANSITION",
    );

    expect(transition).toBeTruthy();
    expect(transition?.entity).toBe("amlodipine");
    expect(transition?.newEventId).toBe("e4");
  });
});
