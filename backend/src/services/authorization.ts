import { supabase } from "../config/supabase.js";
import { AppError } from "../middleware/errorHandler.js";

/**
 * CRITICAL: this module is the actual tenant-isolation boundary for the
 * whole API. It replaces an earlier design that tried to scope every query
 * via a Postgres session variable (`set_request_owner` + RLS policies) set
 * through `supabase.rpc(...)`. That approach never worked:
 *
 *   1. The backend connects with the Supabase SERVICE ROLE key, which
 *      bypasses Row Level Security entirely — the RLS policies in
 *      database/schema.sql are inert for every query this API makes.
 *   2. Even ignoring (1), each supabase-js call (`.rpc()`, `.from()`) is an
 *      independent HTTP request to PostgREST, each running in its own
 *      transaction against a possibly-different pooled connection. A
 *      session variable set in one call has no guaranteed way to reach a
 *      later, separate call.
 *
 * The RLS policies stay in the schema as defense-in-depth documentation
 * (relevant if this project ever adds a code path using the anon/authenticated
 * Postgres roles directly), but every route in this API MUST explicitly
 * verify ownership here — nothing is scoped "for free".
 */

/** Throws 404 (not 403 — avoid confirming the resource exists to a non-owner) if the owner isn't a member of the workspace. */
export async function assertOwnerHasWorkspace(ownerId: string, workspaceId: string): Promise<void> {
  const { data, error } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("workspace_id", workspaceId)
    .eq("owner_id", ownerId)
    .maybeSingle();
  if (error) throw new AppError(error.message, 500);
  if (!data) throw new AppError("Not found", 404);
}

/** All workspace IDs the given owner belongs to. */
export async function getOwnerWorkspaceIds(ownerId: string): Promise<string[]> {
  const { data, error } = await supabase.from("workspace_members").select("workspace_id").eq("owner_id", ownerId);
  if (error) throw new AppError(error.message, 500);
  return (data ?? []).map((r) => r.workspace_id);
}

/** Throws 403 unless the owner's role in this workspace is 'owner' (used to gate team management). */
export async function assertIsWorkspaceOwnerRole(ownerId: string, workspaceId: string): Promise<void> {
  const { data, error } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("owner_id", ownerId)
    .maybeSingle();
  if (error) throw new AppError(error.message, 500);
  if (!data || data.role !== "owner") {
    throw new AppError("Only the workspace owner can manage team members.", 403);
  }
}

/** Fetches a form by ID and verifies the caller's workspace owns it, throwing 404 otherwise. */
export async function getOwnedForm(ownerId: string, formId: string) {
  const { data: form, error } = await supabase.from("forms").select("*").eq("id", formId).maybeSingle();
  if (error) throw new AppError(error.message, 500);
  if (!form) throw new AppError("Not found", 404);
  await assertOwnerHasWorkspace(ownerId, form.workspace_id);
  return form;
}

/** Fetches a submission by ID and verifies the caller's workspace owns its parent form, throwing 404 otherwise. */
export async function getOwnedSubmission(ownerId: string, submissionId: string) {
  const { data: submission, error } = await supabase.from("submissions").select("*").eq("id", submissionId).maybeSingle();
  if (error) throw new AppError(error.message, 500);
  if (!submission) throw new AppError("Not found", 404);
  await assertOwnerHasWorkspace(ownerId, submission.workspace_id);
  return submission;
}
