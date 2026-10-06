import { env } from "../config/env.js";
import type { ExtractionOutput } from "../schemas/extraction.schema.js";

/**
 * Deterministic mock responses keyed by exact seeded encounter texts.
 * No network calls. No API key required.
 */
const MOCK_BY_TEXT: Record<string, ExtractionOutput> = {
  "Hypertension history. Takes Amlodipine 5mg once daily.": {
    events: [
      {
        eventType: "DIAGNOSIS",
        entity: "hypertension",
        value: { note: "history of hypertension" },
        status: "ACTIVE",
        confidence: 0.92,
        evidenceText: "Hypertension history.",
      },
      {
        eventType: "MEDICATION",
        entity: "amlodipine",
        value: { dose: "5mg", frequency: "once daily" },
        status: "ACTIVE",
        confidence: 0.95,
        evidenceText: "Takes Amlodipine 5mg once daily.",
      },
    ],
  },
  "Labs: HbA1c 7.4 percent. LDL cholesterol 168 mg/dL. Creatinine 1.1 mg/dL.": {
    events: [
      {
        eventType: "LAB_RESULT",
        entity: "hba1c",
        value: { value: 7.4, unit: "percent" },
        status: "ACTIVE",
        confidence: 0.97,
        evidenceText: "HbA1c 7.4 percent.",
      },
      {
        eventType: "LAB_RESULT",
        entity: "ldl_cholesterol",
        value: { value: 168, unit: "mg/dL" },
        status: "ACTIVE",
        confidence: 0.96,
        evidenceText: "LDL cholesterol 168 mg/dL.",
      },
      {
        eventType: "LAB_RESULT",
        entity: "creatinine",
        value: { value: 1.1, unit: "mg/dL" },
        status: "ACTIVE",
        confidence: 0.96,
        evidenceText: "Creatinine 1.1 mg/dL.",
      },
    ],
  },
  "Hinglish: headache 3 days. Patient still takes Amlodipine 5mg.": {
    events: [
      {
        eventType: "SYMPTOM",
        entity: "headache",
        value: { duration: "3 days" },
        status: "ACTIVE",
        confidence: 0.9,
        evidenceText: "headache 3 days.",
      },
      {
        eventType: "MEDICATION",
        entity: "amlodipine",
        value: { dose: "5mg" },
        status: "ACTIVE",
        confidence: 0.93,
        evidenceText: "Patient still takes Amlodipine 5mg.",
      },
    ],
  },
  "Patient stopped taking Amlodipine.": {
    events: [
      {
        eventType: "MEDICATION",
        entity: "amlodipine",
        value: { note: "stopped" },
        status: "INACTIVE",
        confidence: 0.94,
        evidenceText: "Patient stopped taking Amlodipine.",
      },
    ],
  },
};

export type LlmMessage = {
  role: "system" | "user";
  content: string;
};

export async function completeExtractionJson(
  _messages: LlmMessage[],
  rawText: string,
): Promise<unknown> {
  const provider = env.LLM_PROVIDER.toLowerCase();

  if (provider === "mock") {
    const mock = MOCK_BY_TEXT[rawText.trim()];
    if (!mock) {
      throw new Error(
        "Mock LLM has no fixture for this encounter text. Add a mock mapping or use a real provider later.",
      );
    }
    return mock;
  }

  throw new Error(
    `LLM provider "${env.LLM_PROVIDER}" is not implemented. Use LLM_PROVIDER=mock for this prototype.`,
  );
}
