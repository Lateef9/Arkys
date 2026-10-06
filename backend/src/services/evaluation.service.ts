import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { extractFromText } from "../ai/extractor.js";
import { evaluationRepository } from "../repositories/evaluation.repository.js";
import { normalizeExtractedEvents } from "./normalization.service.js";
import {
  aggregateScores,
  scoreExtractionCase,
  type CaseScore,
  type EvalEvent,
} from "./evaluation-metrics.service.js";

type FileCase = {
  id: string;
  inputText: string;
  expectedOutput: {
    events: EvalEvent[];
  };
};

function resolveCasesPath(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  const candidates = [
    resolve(process.cwd(), "../data/evaluation/cases.json"),
    resolve(process.cwd(), "data/evaluation/cases.json"),
    resolve(here, "../../../../data/evaluation/cases.json"),
  ];

  for (const candidate of candidates) {
    try {
      readFileSync(candidate, "utf8");
      return candidate;
    } catch {
      // try next
    }
  }

  throw new Error(
    "Could not find data/evaluation/cases.json. Run from repo root or backend/.",
  );
}

function loadFileCases(): FileCase[] {
  const raw = JSON.parse(readFileSync(resolveCasesPath(), "utf8")) as FileCase[];
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new Error("evaluation cases file is empty");
  }
  return raw;
}

export const evaluationService = {
  async listCases() {
    let cases = await evaluationRepository.listCases();
    if (cases.length === 0) {
      const fileCases = loadFileCases();
      cases = await evaluationRepository.replaceCases(
        fileCases.map((c) => ({
          id: c.id,
          inputText: c.inputText,
          expectedOutput: c.expectedOutput,
        })),
      );
    }
    return cases;
  },

  async run() {
    const fileCases = loadFileCases();
    const cases = await evaluationRepository.replaceCases(
      fileCases.map((c) => ({
        id: c.id,
        inputText: c.inputText,
        expectedOutput: c.expectedOutput,
      })),
    );

    const perCase: Array<{
      caseId: string;
      inputText: string;
      expectedOutput: unknown;
      actualOutput: unknown;
      score: CaseScore;
      error?: string;
    }> = [];

    for (const evaluationCase of cases) {
      const expectedEvents = (evaluationCase.expectedOutput.events ??
        []) as EvalEvent[];

      try {
        const extracted = await extractFromText(evaluationCase.inputText);
        const normalized = normalizeExtractedEvents(extracted.events);
        const actualEvents: EvalEvent[] = normalized.map((e) => ({
          eventType: e.eventType,
          entity: e.entity,
          status: e.status,
          value: e.value,
        }));
        const score = scoreExtractionCase(expectedEvents, actualEvents);

        perCase.push({
          caseId: evaluationCase.id,
          inputText: evaluationCase.inputText,
          expectedOutput: evaluationCase.expectedOutput,
          actualOutput: { events: actualEvents },
          score,
        });
      } catch (err) {
        const score = scoreExtractionCase(expectedEvents, []);
        perCase.push({
          caseId: evaluationCase.id,
          inputText: evaluationCase.inputText,
          expectedOutput: evaluationCase.expectedOutput,
          actualOutput: { events: [], error: String(err) },
          score: { ...score, passed: false },
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    await evaluationRepository.insertResults(
      perCase.map((row) => ({
        caseId: row.caseId,
        actualOutput: {
          ...((row.actualOutput as object) ?? {}),
          fieldDiffs: row.score.fieldDiffs,
          passed: row.score.passed,
          error: row.error ?? null,
        },
        precision: row.score.precision,
        recall: row.score.recall,
        f1: row.score.f1,
        fieldAccuracy: row.score.fieldAccuracy,
      })),
    );

    const summary = aggregateScores(perCase.map((r) => r.score));
    const failedCases = perCase
      .filter((r) => !r.score.passed)
      .map((r) => ({
        caseId: r.caseId,
        inputText: r.inputText,
        expectedOutput: r.expectedOutput,
        actualOutput: r.actualOutput,
        precision: r.score.precision,
        recall: r.score.recall,
        f1: r.score.f1,
        fieldAccuracy: r.score.fieldAccuracy,
        fieldDiffs: r.score.fieldDiffs,
        error: r.error ?? null,
      }));

    return {
      ...summary,
      failedCases,
    };
  },

  async summary() {
    const cases = await evaluationRepository.listCases();
    const results = await evaluationRepository.listLatestResults();

    if (results.length === 0) {
      return {
        caseCount: cases.length,
        precision: 0,
        recall: 0,
        f1: 0,
        fieldAccuracy: 0,
        passedCount: 0,
        failedCount: 0,
        failedCases: [] as unknown[],
        hasRun: false,
      };
    }

    // replaceCases clears prior results, so all rows belong to the latest run.
    const latest = results;
    const caseById = new Map(cases.map((c) => [c.id, c]));

    const scores: CaseScore[] = latest.map((r) => {
      const actual = r.actualOutput as {
        passed?: boolean;
        fieldDiffs?: CaseScore["fieldDiffs"];
      };
      return {
        precision: r.precision,
        recall: r.recall,
        f1: r.f1,
        fieldAccuracy: r.fieldAccuracy,
        truePositives: 0,
        falsePositives: 0,
        falseNegatives: 0,
        fieldMatches: 0,
        fieldChecks: 0,
        passed: Boolean(actual.passed),
        fieldDiffs: actual.fieldDiffs ?? [],
      };
    });

    const aggregate = aggregateScores(scores);
    const failedCases = latest
      .filter((r) => {
        const actual = r.actualOutput as { passed?: boolean };
        return !actual.passed;
      })
      .map((r) => {
        const c = caseById.get(r.caseId);
        const actual = r.actualOutput as {
          fieldDiffs?: unknown;
          error?: string | null;
        };
        return {
          caseId: r.caseId,
          inputText: c?.inputText ?? "",
          expectedOutput: c?.expectedOutput ?? null,
          actualOutput: r.actualOutput,
          precision: r.precision,
          recall: r.recall,
          f1: r.f1,
          fieldAccuracy: r.fieldAccuracy,
          fieldDiffs: actual.fieldDiffs ?? [],
          error: actual.error ?? null,
        };
      });

    return {
      ...aggregate,
      failedCases,
      hasRun: true,
    };
  },
};
