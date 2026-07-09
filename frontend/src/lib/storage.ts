import { createClient } from "@supabase/supabase-js";

// Anon key only. RLS denies all direct table access, so this client is only
// ever used for `uploadToSignedUrl`, consuming tokens minted by the backend.
export const supabaseStorage = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export const STORAGE_BUCKET = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET ?? "submissions";

export async function uploadFileToSignedUrl(path: string, token: string, file: File) {
  const { error } = await supabaseStorage.storage.from(STORAGE_BUCKET).uploadToSignedUrl(path, token, file);
  if (error) throw error;
}
