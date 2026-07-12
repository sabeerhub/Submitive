-- ============================================================================
-- Submitiv Database Schema (Postgres / Supabase)
-- Multi-tenant isolation strategy: every tenant-owned row carries workspace_id.
-- The backend API (service role) enforces isolation explicitly in application
-- code — see backend/src/services/authorization.ts — by checking
-- workspace_members before every scoped query. The RLS policies below are
-- kept as defense-in-depth/documentation but are inert against the service
-- role; see the comment above "Row Level Security" further down for why.
-- Firebase issues identity only; all authorization decisions are made here
-- in Postgres data + the backend's explicit checks, not in Firebase.
-- ============================================================================

create extension if not exists "pgcrypto"; -- for gen_random_uuid()

-- ----------------------------------------------------------------------------
-- Owners (Workspace Owners) — mirrors Firebase Auth users.
-- firebase_uid is the only link between Firebase identity and app data.
-- ----------------------------------------------------------------------------
create table owners (
  id            uuid primary key default gen_random_uuid(),
  firebase_uid  text unique not null,
  email         text unique not null,
  full_name     text,
  avatar_url    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Workspaces — the tenant boundary. Every piece of tenant data hangs off
-- workspace_id, directly or transitively.
-- ----------------------------------------------------------------------------
create table workspaces (
  id             uuid primary key default gen_random_uuid(),
  owner_id       uuid not null references owners(id) on delete cascade,
  name           text not null,
  slug           text unique not null,           -- used in URLs, e.g. submitiv.app/w/<slug>
  logo_url       text,
  brand_color    text default '#0EA5E9',          -- Deep Sky Blue default per design system
  plan           text not null default 'free' check (plan in ('free','pro','enterprise')),
  storage_used_bytes bigint not null default 0,
  storage_limit_bytes bigint not null default 5368709120, -- 5GB free tier default
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index idx_workspaces_owner on workspaces(owner_id);

-- ----------------------------------------------------------------------------
-- Workspace members — for future team invites. Owner is always a member
-- with role 'owner'; seeded on workspace creation.
-- ----------------------------------------------------------------------------
create table workspace_members (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  owner_id     uuid not null references owners(id) on delete cascade,
  role         text not null default 'owner' check (role in ('owner','admin','member')),
  invited_at   timestamptz not null default now(),
  accepted_at  timestamptz,
  unique (workspace_id, owner_id)
);

create index idx_members_workspace on workspace_members(workspace_id);
create index idx_members_owner on workspace_members(owner_id);

-- ----------------------------------------------------------------------------
-- Forms (Submission Builder) — one row per submission form/link.
-- ----------------------------------------------------------------------------
create table forms (
  id                  uuid primary key default gen_random_uuid(),
  workspace_id        uuid not null references workspaces(id) on delete cascade,
  title               text not null,
  description         text,
  instructions        text,
  cover_image_url     text,
  slug                text unique not null,        -- e.g. AB72PXQ -> submitiv.app/s/AB72PXQ
  status              text not null default 'draft' check (status in ('draft','live','closed','archived')),

  opens_at            timestamptz,
  closes_at           timestamptz not null,          -- deadline; enforced everywhere
  reminder_sent_at    timestamptz,                     -- set once the deadline-approaching email has gone out, to avoid re-sending
  timezone            text not null default 'UTC',

  max_upload_size_mb  integer not null default 50,
  max_files           integer not null default 5,
  allowed_file_types  text[] not null default array['pdf','docx','pptx','zip','jpg','png'],

  duplicate_policy    text not null default 'unlimited'
                        check (duplicate_policy in ('unlimited','one_per_email','one_per_matric','one_per_employee_id','one_per_phone')),

  confirmation_message text default 'Thank you! Your submission has been received.',
  success_page_config  jsonb default '{}'::jsonb,

  allow_edits_before_deadline boolean not null default true,

  created_at          timestamptz not null default now(),
  updated_at           timestamptz not null default now(),

  constraint chk_deadline_after_open check (opens_at is null or closes_at > opens_at)
);

create index idx_forms_workspace on forms(workspace_id);
create index idx_forms_slug on forms(slug);
create index idx_forms_closes_at on forms(closes_at);

-- ----------------------------------------------------------------------------
-- Form fields — dynamic, ordered field definitions per form.
-- ----------------------------------------------------------------------------
create table form_fields (
  id            uuid primary key default gen_random_uuid(),
  form_id       uuid not null references forms(id) on delete cascade,
  field_type    text not null check (field_type in (
                  'full_name','email','phone','matric_number','employee_id',
                  'department','course','organization','level','rich_text',
                  'file_upload','short_text','long_text','number','date',
                  'checkbox','radio','dropdown','url','custom'
                )),
  label         text not null,
  placeholder   text,
  help_text     text,
  description   text,
  is_required   boolean not null default false,
  validation    jsonb default '{}'::jsonb,     -- e.g. {"minLength":2,"pattern":"^..."}
  options       jsonb default '[]'::jsonb,     -- for dropdown/radio/checkbox
  position      integer not null default 0,     -- drag-and-drop order
  created_at    timestamptz not null default now()
);

create index idx_fields_form on form_fields(form_id, position);

-- ----------------------------------------------------------------------------
-- Submissions — one row per submitter response. No account required, so
-- there is no user_id; identity is whatever the form fields captured.
-- ----------------------------------------------------------------------------
create table submissions (
  id                uuid primary key default gen_random_uuid(),
  form_id           uuid not null references forms(id) on delete cascade,
  workspace_id      uuid not null references workspaces(id) on delete cascade, -- denormalized for fast RLS + queries
  reference_number  text unique not null,        -- e.g. STV-2026-0001248
  submitter_email   text,                          -- nullable; used for duplicate checks + receipts
  submitter_name    text,                          -- captured at the identity step, denormalized for quick receipt/dashboard display
  dedupe_key        text,                          -- normalized value used per duplicate_policy (email/matric/employee_id/phone)
  status            text not null default 'submitted' check (status in ('submitted','completed','flagged')),
  ip_address        inet,
  user_agent        text,
  submitted_at      timestamptz not null default now(),  -- when the identity step created this submission
  completed_at      timestamptz,                          -- when "Submit Assignment" finished the two-phase flow; null while in progress
  updated_at        timestamptz not null default now(),
  locked            boolean not null default false  -- set true once closes_at passes; belt-and-suspenders alongside app-layer checks
);

create index idx_submissions_form on submissions(form_id);
create index idx_submissions_workspace on submissions(workspace_id);
-- Supports the analytics endpoint's workspace-scoped date-range scan
-- (GET /api/workspaces/:id/analytics) without falling back to a full
-- workspace_id-only index scan plus in-memory date filtering.
create index idx_submissions_workspace_submitted on submissions(workspace_id, submitted_at desc);
create unique index uq_submission_dedupe on submissions(form_id, dedupe_key) where dedupe_key is not null;

-- ----------------------------------------------------------------------------
-- Submission field values — the actual answers, keyed to form_fields.
-- ----------------------------------------------------------------------------
create table submission_values (
  id             uuid primary key default gen_random_uuid(),
  submission_id  uuid not null references submissions(id) on delete cascade,
  field_id       uuid not null references form_fields(id) on delete cascade,
  value_text     text,          -- short_text, long_text, rich_text (HTML), dropdown, radio, url, number-as-text, date-as-text
  value_json     jsonb,         -- checkbox (array), custom structured values
  created_at     timestamptz not null default now(),
  unique (submission_id, field_id)
);

create index idx_values_submission on submission_values(submission_id);

-- ----------------------------------------------------------------------------
-- Submission files — metadata for Supabase Storage objects. Actual bytes
-- live in a private bucket; this table stores pointers + signed-url metadata.
-- ----------------------------------------------------------------------------
create table submission_files (
  id             uuid primary key default gen_random_uuid(),
  submission_id  uuid not null references submissions(id) on delete cascade,
  field_id       uuid references form_fields(id) on delete set null,
  storage_path   text not null,       -- path inside the private bucket
  original_name  text not null,
  mime_type      text not null,
  size_bytes     bigint not null,
  checksum       text,                 -- sha256, for integrity / dedupe
  scan_status    text not null default 'pending' check (scan_status in ('pending','clean','flagged')),
  created_at     timestamptz not null default now()
);

create index idx_files_submission on submission_files(submission_id);

-- ----------------------------------------------------------------------------
-- Audit / activity logs — required by PRD security section.
-- ----------------------------------------------------------------------------
create table audit_logs (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid references workspaces(id) on delete cascade,
  actor_type    text not null check (actor_type in ('owner','submitter','system')),
  actor_id      text,                  -- owners.id as text, or submission reference_number
  action        text not null,          -- e.g. 'form.created', 'submission.created', 'form.closed'
  metadata      jsonb default '{}'::jsonb,
  ip_address    inet,
  created_at    timestamptz not null default now()
);

create index idx_audit_workspace on audit_logs(workspace_id, created_at desc);

-- ============================================================================
-- Row Level Security
--
-- IMPORTANT: the backend API connects with the Supabase SERVICE ROLE key,
-- which bypasses RLS entirely — these policies do NOT protect any query the
-- Express API makes. The actual tenant-isolation boundary is explicit
-- application-level authorization checks in backend/src/services/authorization.ts
-- (every route verifies the caller's workspace_members row before touching
-- workspace/form/submission data).
--
-- These policies are kept as defense-in-depth / forward compatibility: if
-- this project ever adds a code path that queries Postgres directly as an
-- authenticated Postgres role (rather than through the Express API), they
-- would apply. They are inert for the current architecture.
-- ============================================================================

alter table workspaces enable row level security;
alter table workspace_members enable row level security;
alter table forms enable row level security;
alter table form_fields enable row level security;
alter table submissions enable row level security;
alter table submission_values enable row level security;
alter table submission_files enable row level security;
alter table audit_logs enable row level security;

-- Helper: workspaces the current Postgres role's owner belongs to (relevant
-- only for a non-service-role connection with request.owner_id set via
-- `set_config('request.owner_id', <uuid>, true)` in the same transaction —
-- not used by this API today).
create or replace view my_workspace_ids as
  select workspace_id from workspace_members
  where owner_id = nullif(current_setting('request.owner_id', true), '')::uuid;

create policy workspaces_isolation on workspaces
  using (id in (select workspace_id from my_workspace_ids));

create policy members_isolation on workspace_members
  using (workspace_id in (select workspace_id from my_workspace_ids));

create policy forms_isolation on forms
  using (workspace_id in (select workspace_id from my_workspace_ids));

create policy fields_isolation on form_fields
  using (form_id in (select id from forms where workspace_id in (select workspace_id from my_workspace_ids)));

create policy submissions_isolation on submissions
  using (workspace_id in (select workspace_id from my_workspace_ids));

create policy values_isolation on submission_values
  using (submission_id in (select id from submissions where workspace_id in (select workspace_id from my_workspace_ids)));

create policy files_isolation on submission_files
  using (submission_id in (select id from submissions where workspace_id in (select workspace_id from my_workspace_ids)));

create policy audit_isolation on audit_logs
  using (workspace_id in (select workspace_id from my_workspace_ids));

-- Keeps workspaces.storage_used_bytes accurate as files are uploaded/removed.
-- Called by the backend after every successful storage write/delete. Safe as
-- a single RPC call (unlike the removed set_request_owner + separate-query
-- pattern) because the whole read-modify-write happens inside one function
-- invocation — one transaction, not split across separate HTTP calls.
create or replace function increment_workspace_storage(p_workspace_id uuid, p_delta_bytes bigint)
returns void as $$
begin
  update workspaces
  set storage_used_bytes = greatest(0, storage_used_bytes + p_delta_bytes)
  where id = p_workspace_id;
end;
$$ language plpgsql;

-- ============================================================================
-- Trigger: keep updated_at fresh
-- ============================================================================
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_workspaces_updated_at before update on workspaces
  for each row execute function set_updated_at();
create trigger trg_forms_updated_at before update on forms
  for each row execute function set_updated_at();
create trigger trg_submissions_updated_at before update on submissions
  for each row execute function set_updated_at();
