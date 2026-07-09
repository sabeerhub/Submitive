import { AppError } from "../middleware/errorHandler.js";

export type FormWindow = {
  opens_at: string | null;
  closes_at: string;
  status: "draft" | "live" | "closed" | "archived";
};

export type DeadlineState = {
  isOpen: boolean;
  reason?: "not_yet_open" | "deadline_passed" | "draft" | "archived" | "closed";
  msRemaining: number | null;
};

/**
 * Single source of truth for whether a form currently accepts submissions.
 * This function is called from THREE layers, per the PRD's "impossible to
 * bypass" requirement:
 *   1. Frontend (via GET /api/forms/:slug) — to render countdown / locked UI.
 *   2. This same function, again, inside POST /api/submissions — never trust
 *      the client's belief that the form was open.
 *   3. A Postgres check (see database/schema.sql `chk_deadline_after_open`
 *      and the `locked` column maintained by a scheduled job) as the final
 *      belt-and-suspenders layer if application logic is ever bypassed.
 *
 * Server clock (not client clock) is authoritative throughout.
 */
export function getDeadlineState(form: FormWindow, now: Date = new Date()): DeadlineState {
  if (form.status === "archived") {
    return { isOpen: false, reason: "archived", msRemaining: null };
  }
  if (form.status === "draft") {
    return { isOpen: false, reason: "draft", msRemaining: null };
  }
  // An owner-closed form stays closed even if closes_at is still in the
  // future — status is a manual override, not just a derived field. Without
  // this check, manually closing a form did nothing until its deadline
  // actually passed.
  if (form.status === "closed") {
    return { isOpen: false, reason: "closed", msRemaining: null };
  }

  const closesAt = new Date(form.closes_at).getTime();
  const opensAt = form.opens_at ? new Date(form.opens_at).getTime() : null;
  const nowMs = now.getTime();

  if (opensAt && nowMs < opensAt) {
    return { isOpen: false, reason: "not_yet_open", msRemaining: opensAt - nowMs };
  }

  if (nowMs >= closesAt) {
    return { isOpen: false, reason: "deadline_passed", msRemaining: 0 };
  }

  return { isOpen: true, msRemaining: closesAt - nowMs };
}

/**
 * Guard used at the top of every submission-mutating route handler.
 * Throws a 403 AppError if the form is not currently open, so a single
 * call blocks create/edit/upload attempts after the deadline regardless
 * of what the client sent.
 */
export function assertFormIsOpen(form: FormWindow) {
  const state = getDeadlineState(form);
  if (!state.isOpen) {
    throw new AppError("This submission is now closed.", 403);
  }
}
