import { execSync } from "node:child_process";
import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { isSupabaseConfigured } from "../src/db/supabase.js";

const app = createApp();
const RAJESH_ID = "11111111-1111-1111-1111-111111111111";
const ENCOUNTER_IDS = [
  "22222222-2222-2222-2222-222222222201",
  "22222222-2222-2222-2222-222222222202",
  "22222222-2222-2222-2222-222222222203",
  "22222222-2222-2222-2222-222222222204",
];

const describeIfDb = isSupabaseConfigured() ? describe : describe.skip;

describeIfDb("Timeline / state / conflicts API", () => {
  beforeAll(async () => {
    execSync("npm run db:seed", { stdio: "inherit" });
    for (const id of ENCOUNTER_IDS) {
      const res = await request(app).post(`/api/encounters/${id}/extract`);
      expect(res.status).toBe(201);
    }
  }, 60_000);

  it("returns chronological timeline Jan → Apr", async () => {
    const response = await request(app).get(
      `/api/patients/${RAJESH_ID}/timeline`,
    );

    expect(response.status).toBe(200);
    const dates = response.body.data.groups.map(
      (g: { date: string }) => g.date,
    );
    expect(dates).toEqual([
      "2026-01-10",
      "2026-02-15",
      "2026-03-12",
      "2026-04-05",
    ]);
  });

  it("current state shows amlodipine Stopped/INACTIVE with ACTIVE history retained", async () => {
    const stateRes = await request(app).get(
      `/api/patients/${RAJESH_ID}/state`,
    );
    expect(stateRes.status).toBe(200);

    const amlo = stateRes.body.data.find(
      (s: { entity: string }) => s.entity === "amlodipine",
    );
    expect(amlo.status).toBe("INACTIVE");
    expect(amlo.displayStatus).toBe("Stopped");

    const eventsRes = await request(app).get(
      `/api/patients/${RAJESH_ID}/events`,
    );
    const activeAmlo = eventsRes.body.data.filter(
      (e: { entity: string; status: string }) =>
        e.entity === "amlodipine" && e.status === "ACTIVE",
    );
    expect(activeAmlo.length).toBeGreaterThanOrEqual(2);
  });

  it("returns medication state transition conflict", async () => {
    const response = await request(app).get(
      `/api/patients/${RAJESH_ID}/conflicts`,
    );

    expect(response.status).toBe(200);
    const types = response.body.data.map(
      (c: { conflictType: string }) => c.conflictType,
    );
    expect(types).toContain("MEDICATION_STATE_TRANSITION");
  });

  it("returns evidence for an event", async () => {
    const eventsRes = await request(app).get(
      `/api/patients/${RAJESH_ID}/events`,
    );
    const eventId = eventsRes.body.data[0].id as string;

    const evidenceRes = await request(app).get(
      `/api/events/${eventId}/evidence`,
    );

    expect(evidenceRes.status).toBe(200);
    expect(evidenceRes.body.data.evidence.length).toBeGreaterThan(0);
    expect(evidenceRes.body.data.evidence[0].sourceText).toBeTruthy();
  });
});
