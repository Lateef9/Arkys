import { execSync } from "node:child_process";
import request from "supertest";
import { beforeAll, describe, expect, it, vi } from "vitest";
import * as llmClient from "../src/ai/client.js";
import { createApp } from "../src/app.js";
import { isSupabaseConfigured } from "../src/db/supabase.js";
import { env } from "../src/config/env.js";

const app = createApp();

const JAN_ID = "22222222-2222-2222-2222-222222222201";
const APR_ID = "22222222-2222-2222-2222-222222222204";

const describeIfDb = isSupabaseConfigured() ? describe : describe.skip;

describe("Extraction mock unit", () => {
  it("uses mock provider without requiring API key", async () => {
    expect(env.LLM_PROVIDER.toLowerCase()).toBe("mock");
    expect(env.LLM_API_KEY === "" || typeof env.LLM_API_KEY === "string").toBe(
      true,
    );

    const spy = vi.spyOn(globalThis, "fetch");
    const result = await llmClient.completeExtractionJson(
      [],
      "Patient stopped taking Amlodipine.",
    );

    expect(result).toMatchObject({
      events: [
        {
          entity: "amlodipine",
          status: "INACTIVE",
        },
      ],
    });
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});

describeIfDb("POST /api/encounters/:id/extract", () => {
  beforeAll(() => {
    if (!isSupabaseConfigured()) {
      throw new Error("Supabase env required");
    }
    execSync("npm run db:seed", { stdio: "inherit" });
  });

  it("returns 404 for unknown encounter", async () => {
    const response = await request(app).post(
      "/api/encounters/99999999-9999-9999-9999-999999999999/extract",
    );

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("ENCOUNTER_NOT_FOUND");
  });

  it("extracts January encounter into events + evidence", async () => {
    const response = await request(app).post(
      `/api/encounters/${JAN_ID}/extract`,
    );

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);

    const events = response.body.data.events as Array<{
      entity: string;
      status: string;
      value: { dose?: string };
      evidence: { sourceText: string };
    }>;

    const entities = events.map((e) => e.entity);
    expect(entities).toContain("hypertension");
    expect(entities).toContain("amlodipine");

    const amlo = events.find((e) => e.entity === "amlodipine");
    expect(amlo?.status).toBe("ACTIVE");
    expect(amlo?.value.dose).toBe("5mg");
    expect(amlo?.evidence.sourceText).toBeTruthy();

    // Deterministic state recompute runs after extract (not LLM-written).
    expect(Array.isArray(response.body.data.patientState)).toBe(true);
  });

  it("extracts April encounter as amlodipine INACTIVE", async () => {
    const response = await request(app).post(
      `/api/encounters/${APR_ID}/extract`,
    );

    expect(response.status).toBe(201);
    const events = response.body.data.events as Array<{
      entity: string;
      status: string;
    }>;

    expect(events).toHaveLength(1);
    expect(events[0]?.entity).toBe("amlodipine");
    expect(events[0]?.status).toBe("INACTIVE");
  });
});
