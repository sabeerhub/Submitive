# Submitiv — Phase 1: Project Scaffold

## What's in this phase

```
submitiv/
├── database/
│   └── schema.sql        # Full multi-tenant Postgres schema + RLS policies
├── backend/               # Node + Express + TypeScript API
│   └── src/
│       ├── config/        # Firebase Admin (identity only) + Supabase clients
│       ├── middleware/     # auth, rate limiting, centralized error handling
│       ├── routes/         # workspaces, forms, submissions
│       ├── services/       # deadlineEngine.ts — the core enforcement logic
│       └── index.ts        # Express app wiring + security middleware
└── frontend/               # React 19 + Vite + TypeScript + Tailwind
    └── src/
        ├── components/ui/  # Button, Card — design-system primitives
        ├── lib/             # firebase.ts (auth), api.ts (typed fetch client)
        └── pages/           # Landing (built to match your mockup), Dashboard (stub)
```

## Architecture decisions

**Multi-tenancy**: every tenant-owned table carries `workspace_id`, and Postgres
Row Level Security policies scope every query to the caller's workspaces. The
backend sets a `request.owner_id` session variable per request
(`withOwnerContext` in `backend/src/config/supabase.ts`) so RLS is enforced by
the database itself, not just application code — a bug in a route handler
can't leak another tenant's data.

**Identity vs. data**: Firebase Authentication verifies who someone is;
Postgres owns everything about what they can do and see. `owners.firebase_uid`
is the only bridge between the two systems, matching the PRD's "Firebase must
NOT store application data" rule.

**Submitters never authenticate.** The public submission routes
(`GET /api/forms/:slug`, `POST /api/submissions`) use the Supabase service-role
client directly since there's no owner session to scope RLS against — access
control there is entirely at the application layer (row lookups by slug/ID,
never a raw client query).

## The deadline engine (`backend/src/services/deadlineEngine.ts`)

Per the PRD's "impossible to bypass" requirement, deadline state is computed
by one function, called at three layers:
1. Frontend fetch of `GET /api/forms/:slug` — renders countdown/locked UI.
2. `POST /api/submissions` calls `assertFormIsOpen()` again server-side —
   never trusts what the client believed.
3. A DB-level constraint on `forms` plus a `locked` flag on `submissions` as
   the final safety net.

Server clock is authoritative throughout — no client-supplied timestamp is
ever trusted for open/closed decisions.

## Security decisions

- `helmet`, scoped `cors`, HTTPS redirect in production, small JSON body limit
- Two rate-limit tiers: general API (`apiLimiter`) and a tighter one on the
  unauthenticated `POST /api/submissions` (`submissionLimiter`) since that
  route has no auth wall to deter abuse
- All input validated with `zod` at the route boundary; validation errors
  return 422 with field-level detail, never a raw stack trace
- `audit_logs` table scaffolded in the schema for the activity-log requirement
  (wiring it into every mutating route comes in the Security-hardening phase)

## Design decisions

Tailwind tokens in `frontend/tailwind.config.js` encode your mockup directly:
Deep Sky Blue primary scale (`#0EA5E9`), 20px card radius, soft two-layer
shadows, Inter typeface. `Button` and `Card` are the first two reusable
primitives; the Landing page is built against them so later pages (dashboard,
form builder, submission page) inherit the same system rather than
reinventing it.

## What's NOT built yet (by design — next phases)

- Auth flows (register/login/Google sign-in, `/auth/bootstrap` route)
- Submission Builder UI (drag-and-drop field editor)
- Public submission page + file upload to Supabase Storage
- Dashboard analytics, charts, CSV/ZIP export
- Email notifications (Resend integration)
- Deployment configs (Vercel/Render)

## Running locally (once you `npm install` — this environment has no network
access, so dependencies aren't installed here)

```bash
# Database
psql <your-supabase-connection-string> -f database/schema.sql

# Backend
cd backend && cp .env.example .env   # fill in Firebase + Supabase credentials
npm install && npm run dev            # http://localhost:4000

# Frontend
cd frontend && cp .env.example .env
npm install && npm run dev            # http://localhost:5173
```

---

**Next phase, your call:** Auth (register/login/Google + workspace creation
flow) or the Submission Builder (drag-and-drop form editor)?
