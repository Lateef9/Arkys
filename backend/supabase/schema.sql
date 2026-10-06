-- Clinical Context Engine — Supabase schema
-- Apply this entire file in the Supabase SQL Editor (Dashboard → SQL → New query → Run).
-- Synthetic data only. No auth / RLS required for this prototype.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- patients
-- ---------------------------------------------------------------------------
create table if not exists patients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  date_of_birth date,
  gender text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- encounters
-- ---------------------------------------------------------------------------
create table if not exists encounters (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients (id) on delete cascade,
  type text not null,
  occurred_at timestamptz not null,
  language text,
  source text not null default 'seed',
  raw_text text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists encounters_patient_id_idx on encounters (patient_id);
create index if not exists encounters_occurred_at_idx on encounters (occurred_at);
create index if not exists encounters_patient_occurred_at_idx
  on encounters (patient_id, occurred_at);

-- ---------------------------------------------------------------------------
-- clinical_events (append-only extracted facts)
-- ---------------------------------------------------------------------------
create table if not exists clinical_events (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients (id) on delete cascade,
  encounter_id uuid not null references encounters (id) on delete cascade,
  event_type text not null,
  entity text not null,
  value jsonb not null default '{}'::jsonb,
  status text not null,
  confidence numeric,
  occurred_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists clinical_events_patient_id_idx on clinical_events (patient_id);
create index if not exists clinical_events_encounter_id_idx on clinical_events (encounter_id);
create index if not exists clinical_events_event_type_idx on clinical_events (event_type);
create index if not exists clinical_events_entity_idx on clinical_events (entity);
create index if not exists clinical_events_occurred_at_idx on clinical_events (occurred_at);
create index if not exists clinical_events_patient_entity_idx
  on clinical_events (patient_id, entity);
create index if not exists clinical_events_patient_occurred_at_idx
  on clinical_events (patient_id, occurred_at);

-- ---------------------------------------------------------------------------
-- event_evidence
-- ---------------------------------------------------------------------------
create table if not exists event_evidence (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references clinical_events (id) on delete cascade,
  source_type text not null,
  source_id uuid not null,
  source_text text not null,
  start_offset integer,
  end_offset integer,
  created_at timestamptz not null default now()
);

create index if not exists event_evidence_event_id_idx on event_evidence (event_id);

-- ---------------------------------------------------------------------------
-- patient_state (derived / recomputable — never replaces event history)
-- ---------------------------------------------------------------------------
create table if not exists patient_state (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients (id) on delete cascade,
  entity_type text not null,
  entity text not null,
  current_value jsonb not null default '{}'::jsonb,
  status text not null,
  source_event_id uuid references clinical_events (id) on delete set null,
  valid_from timestamptz not null,
  valid_until timestamptz,
  confidence numeric,
  updated_at timestamptz not null default now()
);

create index if not exists patient_state_patient_id_idx on patient_state (patient_id);
create index if not exists patient_state_patient_entity_idx
  on patient_state (patient_id, entity);

-- ---------------------------------------------------------------------------
-- conflicts
-- ---------------------------------------------------------------------------
create table if not exists conflicts (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients (id) on delete cascade,
  entity text not null,
  existing_event_id uuid not null references clinical_events (id) on delete cascade,
  new_event_id uuid not null references clinical_events (id) on delete cascade,
  conflict_type text not null,
  resolution text,
  resolved_by text,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists conflicts_patient_id_idx on conflicts (patient_id);

-- ---------------------------------------------------------------------------
-- clinician_edits
-- ---------------------------------------------------------------------------
create table if not exists clinician_edits (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references clinical_events (id) on delete cascade,
  field text not null,
  old_value jsonb,
  new_value jsonb,
  reason text,
  created_at timestamptz not null default now()
);

create index if not exists clinician_edits_event_id_idx on clinician_edits (event_id);

-- ---------------------------------------------------------------------------
-- evaluation_cases
-- ---------------------------------------------------------------------------
create table if not exists evaluation_cases (
  id uuid primary key default gen_random_uuid(),
  input_text text not null,
  expected_output jsonb not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- evaluation_results
-- ---------------------------------------------------------------------------
create table if not exists evaluation_results (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references evaluation_cases (id) on delete cascade,
  actual_output jsonb not null,
  precision numeric not null,
  recall numeric not null,
  f1 numeric not null,
  field_accuracy numeric not null,
  created_at timestamptz not null default now()
);

create index if not exists evaluation_results_case_id_idx on evaluation_results (case_id);
