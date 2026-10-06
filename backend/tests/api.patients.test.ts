import { execSync } from "node:child_process";
import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { isSupabaseConfigured } from "../src/db/supabase.js";

const app = createApp();
const RAJESH_ID = "11111111-1111-1111-1111-111111111111";

const describeIfDb = isSupabaseConfigured() ? describe : describe.skip;

describe("Patients API validation", () => {
  it("rejects invalid create patient body", async () => {
    const response = await request(app).post("/api/patients").send({});

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("rejects invalid patient id format", async () => {
    const response = await request(app).get("/api/patients/not-a-uuid");

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });
});

describeIfDb("Patients + Encounters API (Supabase)", () => {
  beforeAll(() => {
    if (!isSupabaseConfigured()) {
      throw new Error("Supabase env required for integration tests");
    }
    execSync("npm run db:seed", { stdio: "inherit" });
  });

  it("lists patients including Rajesh Kumar", async () => {
    const response = await request(app).get("/api/patients");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);

    const names = response.body.data.map((p: { name: string }) => p.name);
    expect(names).toContain("Rajesh Kumar");
  });

  it("gets Rajesh by id", async () => {
    const response = await request(app).get(`/api/patients/${RAJESH_ID}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.name).toBe("Rajesh Kumar");
  });

  it("returns 404 for unknown patient", async () => {
    const response = await request(app).get(
      "/api/patients/99999999-9999-9999-9999-999999999999",
    );

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      error: {
        code: "PATIENT_NOT_FOUND",
        message: "Patient not found",
      },
    });
  });

  it("creates a patient", async () => {
    const response = await request(app).post("/api/patients").send({
      name: `Test Patient ${Date.now()}`,
      gender: "unknown",
    });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBeTruthy();
    expect(response.body.data.name).toContain("Test Patient");
  });

  it("lists Rajesh encounters (4 seeded)", async () => {
    const response = await request(app).get(
      `/api/patients/${RAJESH_ID}/encounters`,
    );

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(4);
  });

  it("creates an encounter for Rajesh", async () => {
    const response = await request(app)
      .post(`/api/patients/${RAJESH_ID}/encounters`)
      .send({
        type: "OTHER",
        occurredAt: "2026-05-01",
        language: "en",
        rawText: "Phase 3 API test encounter.",
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.rawText).toBe("Phase 3 API test encounter.");
    expect(response.body.data.patientId).toBe(RAJESH_ID);
  });

  it("rejects invalid encounter body", async () => {
    const response = await request(app)
      .post(`/api/patients/${RAJESH_ID}/encounters`)
      .send({ type: "CONSULTATION" });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });
});
