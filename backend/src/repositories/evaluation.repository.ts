import { getSupabase } from "../db/supabase.js";

export type EvaluationCaseRow = {
  id: string;
  inputText: string;
  expectedOutput: { events: unknown[] };
  createdAt: string;
};

export type EvaluationResultRow = {
  id: string;
  caseId: string;
  actualOutput: unknown;
  precision: number;
  recall: number;
  f1: number;
  fieldAccuracy: number;
  createdAt: string;
};

function mapCase(row: Record<string, unknown>): EvaluationCaseRow {
  return {
    id: row.id as string,
    inputText: row.input_text as string,
    expectedOutput: row.expected_output as { events: unknown[] },
    createdAt: row.created_at as string,
  };
}

function mapResult(row: Record<string, unknown>): EvaluationResultRow {
  return {
    id: row.id as string,
    caseId: row.case_id as string,
    actualOutput: row.actual_output,
    precision: Number(row.precision),
    recall: Number(row.recall),
    f1: Number(row.f1),
    fieldAccuracy: Number(row.field_accuracy),
    createdAt: row.created_at as string,
  };
}

export const evaluationRepository = {
  async replaceCases(
    cases: Array<{
      id: string;
      inputText: string;
      expectedOutput: unknown;
    }>,
  ): Promise<EvaluationCaseRow[]> {
    const { error: deleteResultsError } = await getSupabase()
      .from("evaluation_results")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (deleteResultsError) {
      throw new Error(deleteResultsError.message);
    }

    const { error: deleteCasesError } = await getSupabase()
      .from("evaluation_cases")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (deleteCasesError) {
      throw new Error(deleteCasesError.message);
    }

    if (cases.length === 0) return [];

    const { data, error } = await getSupabase()
      .from("evaluation_cases")
      .insert(
        cases.map((c) => ({
          id: c.id,
          input_text: c.inputText,
          expected_output: c.expectedOutput,
        })),
      )
      .select("*");

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as Record<string, unknown>[]).map(mapCase);
  },

  async listCases(): Promise<EvaluationCaseRow[]> {
    const { data, error } = await getSupabase()
      .from("evaluation_cases")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as Record<string, unknown>[]).map(mapCase);
  },

  async insertResults(
    results: Array<{
      caseId: string;
      actualOutput: unknown;
      precision: number;
      recall: number;
      f1: number;
      fieldAccuracy: number;
    }>,
  ): Promise<EvaluationResultRow[]> {
    if (results.length === 0) return [];

    const { data, error } = await getSupabase()
      .from("evaluation_results")
      .insert(
        results.map((r) => ({
          case_id: r.caseId,
          actual_output: r.actualOutput,
          precision: r.precision,
          recall: r.recall,
          f1: r.f1,
          field_accuracy: r.fieldAccuracy,
        })),
      )
      .select("*");

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as Record<string, unknown>[]).map(mapResult);
  },

  async listLatestResults(): Promise<EvaluationResultRow[]> {
    const { data, error } = await getSupabase()
      .from("evaluation_results")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as Record<string, unknown>[]).map(mapResult);
  },
};
