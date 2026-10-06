import { normalizeEntity } from "./normalization.service.js";

export type EvalEvent = {
  eventType: string;
  entity: string;
  status: string;
  value?: Record<string, unknown>;
};

export type CaseScore = {
  precision: number;
  recall: number;
  f1: number;
  fieldAccuracy: number;
  truePositives: number;
  falsePositives: number;
  falseNegatives: number;
  fieldMatches: number;
  fieldChecks: number;
  passed: boolean;
  fieldDiffs: Array<{
    key: string;
    field: string;
    expected: unknown;
    actual: unknown;
  }>;
};

function eventKey(event: EvalEvent): string {
  return `${event.eventType}::${normalizeEntity(event.entity)}`;
}

function normalizeValue(value: Record<string, unknown> | undefined) {
  const next = { ...(value ?? {}) };
  if (typeof next.dose === "string") {
    next.dose = next.dose.trim().toLowerCase().replace(/\s+/g, "");
  }
  return next;
}

function compareFields(
  expected: EvalEvent,
  actual: EvalEvent,
): {
  matches: number;
  checks: number;
  diffs: CaseScore["fieldDiffs"];
} {
  const diffs: CaseScore["fieldDiffs"] = [];
  let matches = 0;
  let checks = 0;
  const key = eventKey(expected);

  checks += 1;
  if (expected.status === actual.status) {
    matches += 1;
  } else {
    diffs.push({
      key,
      field: "status",
      expected: expected.status,
      actual: actual.status,
    });
  }

  const expectedValue = normalizeValue(expected.value);
  const actualValue = normalizeValue(actual.value);

  if (expectedValue.dose !== undefined) {
    checks += 1;
    if (expectedValue.dose === actualValue.dose) {
      matches += 1;
    } else {
      diffs.push({
        key,
        field: "dose",
        expected: expectedValue.dose,
        actual: actualValue.dose ?? null,
      });
    }
  }

  if (expectedValue.value !== undefined) {
    checks += 1;
    if (expectedValue.value === actualValue.value) {
      matches += 1;
    } else {
      diffs.push({
        key,
        field: "value",
        expected: expectedValue.value,
        actual: actualValue.value ?? null,
      });
    }
  }

  if (expectedValue.duration !== undefined) {
    checks += 1;
    if (expectedValue.duration === actualValue.duration) {
      matches += 1;
    } else {
      diffs.push({
        key,
        field: "duration",
        expected: expectedValue.duration,
        actual: actualValue.duration ?? null,
      });
    }
  }

  return { matches, checks, diffs };
}

/** Pure scoring — no I/O, no hard-coded metric constants. */
export function scoreExtractionCase(
  expectedEvents: EvalEvent[],
  actualEvents: EvalEvent[],
): CaseScore {
  const expectedMap = new Map(
    expectedEvents.map((e) => [
      eventKey(e),
      { ...e, entity: normalizeEntity(e.entity) },
    ]),
  );
  const actualMap = new Map(
    actualEvents.map((e) => [
      eventKey(e),
      { ...e, entity: normalizeEntity(e.entity) },
    ]),
  );

  let truePositives = 0;
  let fieldMatches = 0;
  let fieldChecks = 0;
  const fieldDiffs: CaseScore["fieldDiffs"] = [];

  for (const [key, expected] of expectedMap) {
    const actual = actualMap.get(key);
    if (!actual) continue;
    truePositives += 1;
    const fieldResult = compareFields(expected, actual);
    fieldMatches += fieldResult.matches;
    fieldChecks += fieldResult.checks;
    fieldDiffs.push(...fieldResult.diffs);
  }

  const falseNegatives = expectedMap.size - truePositives;
  const falsePositives = actualMap.size - truePositives;

  const precision =
    truePositives + falsePositives === 0
      ? 0
      : truePositives / (truePositives + falsePositives);
  const recall =
    truePositives + falseNegatives === 0
      ? 0
      : truePositives / (truePositives + falseNegatives);
  const f1 =
    precision + recall === 0
      ? 0
      : (2 * precision * recall) / (precision + recall);
  const fieldAccuracy = fieldChecks === 0 ? 0 : fieldMatches / fieldChecks;

  const passed =
    falsePositives === 0 &&
    falseNegatives === 0 &&
    fieldDiffs.length === 0 &&
    expectedMap.size > 0;

  return {
    precision,
    recall,
    f1,
    fieldAccuracy,
    truePositives,
    falsePositives,
    falseNegatives,
    fieldMatches,
    fieldChecks,
    passed,
    fieldDiffs,
  };
}

export function aggregateScores(scores: CaseScore[]) {
  if (scores.length === 0) {
    return {
      caseCount: 0,
      precision: 0,
      recall: 0,
      f1: 0,
      fieldAccuracy: 0,
      passedCount: 0,
      failedCount: 0,
    };
  }

  const sum = scores.reduce(
    (acc, s) => {
      acc.precision += s.precision;
      acc.recall += s.recall;
      acc.f1 += s.f1;
      acc.fieldAccuracy += s.fieldAccuracy;
      return acc;
    },
    { precision: 0, recall: 0, f1: 0, fieldAccuracy: 0 },
  );

  const n = scores.length;
  const passedCount = scores.filter((s) => s.passed).length;

  return {
    caseCount: n,
    precision: sum.precision / n,
    recall: sum.recall / n,
    f1: sum.f1 / n,
    fieldAccuracy: sum.fieldAccuracy / n,
    passedCount,
    failedCount: n - passedCount,
  };
}
