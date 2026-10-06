# Clinical Context Engine

Prototype: messy clinical notes → structured events → deterministic current patient state.

**LLM extracts. Deterministic software decides state.**

Not a medical product. Synthetic data only.

## Stack

`Next.js + Tailwind + Redux` → `Express` → `Supabase Postgres`

## Spec / phases

- [`SPEC.md`](./SPEC.md) — source of truth
- [`phases/00-INDEX.md`](./phases/00-INDEX.md) — build phases

## Setup

### 1) Supabase schema (Phase 2)

1. Create a Supabase project.
2. Open **SQL Editor** → paste `backend/supabase/schema.sql` → **Run**.
3. Copy project URL + **service role** key into `backend/.env`:

```bash
cp backend/.env.example backend/.env
# fill SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
```

4. Seed Rajesh + 4 encounters:

```bash
cd backend
npm install
npm run db:seed
```

### 2) Run apps

```bash
# backend
cd backend
npm run dev
# GET http://localhost:4000/api/health

# frontend
cd frontend
npm install
npm run dev
```

Follow [`phases/00-INDEX.md`](./phases/00-INDEX.md) for the rest.
