import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client using the SERVICE ROLE key.
 * The service role bypasses Row Level Security entirely, so RLS policies in
 * database/schema.sql provide no protection for anything this client does —
 * every query made with this client MUST explicitly verify workspace
 * ownership in application code. See services/authorization.ts, which is
 * the actual (and only) tenant-isolation boundary in this API.
 *
 * (An earlier version of this file tried to scope queries via a
 * `set_request_owner` Postgres session variable + RLS. That never worked:
 * each supabase-js call is an independent HTTP request/transaction to
 * PostgREST, so a variable set in one call had no reliable way to reach a
 * later, separate call — on top of RLS already being bypassed by the
 * service role. Removed in favor of explicit checks.)
 *
 * Never expose SUPABASE_SERVICE_ROLE_KEY to the frontend. The frontend only
 * ever talks to our Express API, never directly to Supabase for tenant data.
 */
export const supabase: SupabaseClient = createClient(
  process.env.SUPABASE_URL ?? "",
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  {
    auth: { persistSession: false },
  }
);

export const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? "submissions";

/** Creates a short-lived signed URL a submitter's browser can upload directly to. */
export async function createSignedUploadUrl(path: string) {
  const { data, error } = await supabase.storage.from(STORAGE_BUCKET).createSignedUploadUrl(path);
  if (error) throw error;
  return data; // { signedUrl, token, path }
}

/** Creates a short-lived signed URL for an owner to download/view a stored file. */
export async function createSignedDownloadUrl(path: string, expiresInSeconds = 300) {
  const { data, error } = await supabase.storage.from(STORAGE_BUCKET).createSignedUrl(path, expiresInSeconds);
  if (error) throw error;
  return data.signedUrl;
}

export async function downloadFileBuffer(path: string) {
  const { data, error } = await supabase.storage.from(STORAGE_BUCKET).download(path);
  if (error) throw error;
  return Buffer.from(await data.arrayBuffer());
}

/** Single self-contained RPC call — safe (unlike the removed withOwnerContext)
 *  because the whole read-modify-write happens inside one Postgres function
 *  invocation, i.e. one transaction, not split across separate HTTP calls. */
export async function incrementWorkspaceStorage(workspaceId: string, deltaBytes: number) {
  const { error } = await supabase.rpc("increment_workspace_storage", {
    p_workspace_id: workspaceId,
    p_delta_bytes: deltaBytes,
  });
  if (error) throw error;
}
