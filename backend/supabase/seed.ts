/**
 * Seed Rajesh Kumar + 4 synthetic encounters.
 *
 * Prerequisites:
 * 1. Apply backend/supabase/schema.sql in the Supabase SQL Editor
 * 2. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env
 *
 * Run from backend/: npm run db:seed
 */

import { config as loadEnv } from "dotenv";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(__dirname, "../.env") });

const SUPABASE_URL = process.env.SUPABASE_URL ?? "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in backend/.env",
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/** Stable id so re-seeds stay predictable for the demo. */
const RAJESH_ID = "11111111-1111-1111-1111-111111111111";

const encounters = [
  {
    id: "22222222-2222-2222-2222-222222222201",
    type: "CONSULTATION",
    occurred_at: "2026-01-10T09:00:00.000Z",
    language: "en",
    source: "seed",
    raw_text: "Hypertension history. Takes Amlodipine 5mg once daily.",
  },
  {
    id: "22222222-2222-2222-2222-222222222202",
    type: "LAB_REPORT",
    occurred_at: "2026-02-15T09:00:00.000Z",
    language: "en",
    source: "seed",
    raw_text:
      "Labs: HbA1c 7.4 percent. LDL cholesterol 168 mg/dL. Creatinine 1.1 mg/dL.",
  },
  {
    id: "22222222-2222-2222-2222-222222222203",
    type: "CONSULTATION",
    occurred_at: "2026-03-12T09:00:00.000Z",
    language: "hi-en",
    source: "seed",
    raw_text:
      "Hinglish: headache 3 days. Patient still takes Amlodipine 5mg.",
  },
  {
    id: "22222222-2222-2222-2222-222222222204",
    type: "FOLLOW_UP",
    occurred_at: "2026-04-05T09:00:00.000Z",
    language: "en",
    source: "seed",
    raw_text: "Patient stopped taking Amlodipine.",
  },
] as const;

async function seed() {
  // Remove prior demo patient (cascade clears encounters).
  const { error: deleteError } = await supabase
    .from("patients")
    .delete()
    .eq("id", RAJESH_ID);

  if (deleteError) {
    throw new Error(`Failed clearing prior seed: ${deleteError.message}`);
  }

  const { error: patientError } = await supabase.from("patients").insert({
    id: RAJESH_ID,
    name: "Rajesh Kumar",
    date_of_birth: null,
    gender: null,
  });

  if (patientError) {
    throw new Error(`Failed inserting patient: ${patientError.message}`);
  }

  const { error: encounterError } = await supabase.from("encounters").insert(
    encounters.map((row) => ({
      ...row,
      patient_id: RAJESH_ID,
    })),
  );

  if (encounterError) {
    throw new Error(`Failed inserting encounters: ${encounterError.message}`);
  }

  const { count: eventCount, error: eventCountError } = await supabase
    .from("clinical_events")
    .select("*", { count: "exact", head: true })
    .eq("patient_id", RAJESH_ID);

  if (eventCountError) {
    throw new Error(`Failed checking clinical_events: ${eventCountError.message}`);
  }

  console.log("Seed complete");
  console.log(`- patient: Rajesh Kumar (${RAJESH_ID})`);
  console.log(`- encounters: ${encounters.length}`);
  console.log(`- clinical_events for Rajesh: ${eventCount ?? 0} (should be 0)`);
}

seed().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
