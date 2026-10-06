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

describeIfDb("Corrections + Labs API", () => {
  beforeAll(async () => {
    execSync("npm run db:seed", { stdio: "inherit" });
    for (const id of ENCOUNTER_IDS) {
      const res = await request(app).post(`/api/encounters/${id}/extract`);
      expect(res.status).toBe(201);
    }
  }, 60_000);

  it("records clinician edit, keeps original event, recomputes state", async () => {
    const eventsRes = await request(app).get(
      `/api/patients/${RAJESH_ID}/events`,
    );
    const aprilAmlo = eventsRes.body.data.find(
      (e: { entity: string; status: string; occurredAt: string }) =>
        e.entity === "amlodipine" &&
        e.status === "INACTIVE" &&
        e.occurredAt.startsWith("2026-04-05"),
    );
    expect(aprilAmlo).toBeTruthy();

    const correctionRes = await request(app)
      .post(`/api/events/${aprilAmlo.id}/correction`)
      .send({
        field: "status",
        newValue: "ACTIVE",
        reason: "Incorrect extraction for demo correction",
      });

    expect(correctionRes.status).toBe(201);
    expect(correctionRes.body.success).toBe(true);
    expect(correctionRes.body.data.edit.field).toBe("status");
    expect(correctionRes.body.data.edit.newValue).toBe("ACTIVE");

    // Original immutable row remains INACTIVE.
    const originalRes = await request(app).get(
      `/api/events/${aprilAmlo.id}`,
    );
    expect(originalRes.status).toBe(200);
    expect(originalRes.body.data.id).toBe(aprilAmlo.id);
    expect(originalRes.body.data.status).toBe("INACTIVE");

    // Derived state uses the clinician correction.
    const stateRes = await request(app).get(
      `/api/patients/${RAJESH_ID}/state`,
    );
    const amlo = stateRes.body.data.find(
      (s: { entity: string }) => s.entity === "amlodipine",
    );
    expect(amlo.status).toBe("ACTIVE");
  });

  it("returns HbA1c lab history chronologically", async () => {
    const response = await request(app).get(
      `/api/patients/${RAJESH_ID}/labs/hba1c`,
    );

    expect(response.status).toBe(200);
    expect(response.body.data.entity).toBe("hba1c");
    expect(response.body.data.points.length).toBeGreaterThanOrEqual(1);
    expect(response.body.data.points[0].occurredAt.startsWith("2026-02-15")).toBe(
      true,
    );
    expect(response.body.data.points[0].value).toBe(7.4);
  });

  it("returns 404 for unknown event correction", async () => {
    const response = await request(app)
      .post("/api/events/99999999-9999-9999-9999-999999999999/correction")
      .send({ field: "dose", newValue: "5mg" });

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("EVENT_NOT_FOUND");
  });

  it("rejects invalid correction body", async () => {
    const eventsRes = await request(app).get(
      `/api/patients/${RAJESH_ID}/events`,
    );
    const eventId = eventsRes.body.data[0].id as string;

    const response = await request(app)
      .post(`/api/events/${eventId}/correction`)
      .send({ field: "not_allowed", newValue: "x" });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });
});
