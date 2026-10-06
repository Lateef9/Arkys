import { describe, expect, it } from "vitest";
import {
  aggregateScores,
  scoreExtractionCase,
} from "../src/services/evaluation-metrics.service.js";

describe("evaluation metrics (pure)", () => {
  it("scores a perfect match as passed with F1 = 1", () => {
    const score = scoreExtractionCase(
      [
        {
          eventType: "MEDICATION",
          entity: "amlodipine",
          status: "ACTIVE",
          value: { dose: "5mg" },
        },
      ],
      [
        {
          eventType: "MEDICATION",
          entity: "amlodipine",
          status: "ACTIVE",
          value: { dose: "5mg" },
        },
      ],
    );

    expect(score.precision).toBe(1);
    expect(score.recall).toBe(1);
    expect(score.f1).toBe(1);
    expect(score.fieldAccuracy).toBe(1);
    expect(score.passed).toBe(true);
  });

  it("lowers field accuracy and F1 when dose mismatches", () => {
    const perfect = scoreExtractionCase(
      [
        {
          eventType: "MEDICATION",
          entity: "amlodipine",
          status: "ACTIVE",
          value: { dose: "5mg" },
        },
      ],
      [
        {
          eventType: "MEDICATION",
          entity: "amlodipine",
          status: "ACTIVE",
          value: { dose: "5mg" },
        },
      ],
    );

    const mismatched = scoreExtractionCase(
      [
        {
          eventType: "MEDICATION",
          entity: "amlodipine",
          status: "ACTIVE",
          value: { dose: "5mg" },
        },
      ],
      [
        {
          eventType: "MEDICATION",
          entity: "amlodipine",
          status: "ACTIVE",
          value: { dose: "10mg" },
        },
      ],
    );

    expect(mismatched.fieldAccuracy).toBeLessThan(perfect.fieldAccuracy);
    expect(mismatched.passed).toBe(false);
    expect(mismatched.fieldDiffs.some((d) => d.field === "dose")).toBe(true);
  });

  it("aggregate metrics change when a failing case is added", () => {
    const pass = scoreExtractionCase(
      [{ eventType: "SYMPTOM", entity: "headache", status: "ACTIVE", value: {} }],
      [{ eventType: "SYMPTOM", entity: "headache", status: "ACTIVE", value: {} }],
    );
    const fail = scoreExtractionCase(
      [{ eventType: "SYMPTOM", entity: "headache", status: "ACTIVE", value: {} }],
      [],
    );

    const onlyPass = aggregateScores([pass]);
    const withFail = aggregateScores([pass, fail]);

    expect(withFail.f1).toBeLessThan(onlyPass.f1);
    expect(withFail.failedCount).toBe(1);
  });
});
