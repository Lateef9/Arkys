import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { isSupabaseConfigured } from "../src/db/supabase.js";

const app = createApp();
const describeIfDb = isSupabaseConfigured() ? describe : describe.skip;

describeIfDb("Evaluation API", () => {
  it("runs evaluation and returns calculated summary metrics", async () => {
    const runRes = await request(app).post("/api/evaluation/run");
    expect(runRes.status).toBe(201);
    expect(runRes.body.success).toBe(true);

    const data = runRes.body.data;
    expect(data.caseCount).toBeGreaterThan(0);
    expect(typeof data.precision).toBe("number");
    expect(typeof data.recall).toBe("number");
    expect(typeof data.f1).toBe("number");
    expect(typeof data.fieldAccuracy).toBe("number");
    expect(data.failedCount).toBeGreaterThan(0);
    expect(Array.isArray(data.failedCases)).toBe(true);

    // Prove values are not a hard-coded demo constant.
    expect([0.5, 0.89, 0.895, 0.9, 0.91]).not.toContain(data.f1);

    const summaryRes = await request(app).get("/api/evaluation/summary");
    expect(summaryRes.status).toBe(200);
    expect(summaryRes.body.data.hasRun).toBe(true);
    expect(summaryRes.body.data.f1).toBeCloseTo(data.f1, 5);
    expect(summaryRes.body.data.failedCases.length).toBe(data.failedCount);
  });

  it("lists evaluation cases", async () => {
    const response = await request(app).get("/api/evaluation/cases");
    expect(response.status).toBe(200);
    expect(response.body.data.length).toBeGreaterThanOrEqual(8);
  });
});
