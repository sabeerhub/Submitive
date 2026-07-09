import { Router } from "express";
import { z } from "zod";
import { requireFirebaseAuth, requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { supabase } from "../config/supabase.js";
import { AppError } from "../middleware/errorHandler.js";
import { getOwnerWorkspaceIds } from "../services/authorization.js";

export const authRouter = Router();

const bootstrapSchema = z.object({
  full_name: z.string().min(1).max(120).optional(),
  avatar_url: z.string().url().optional(),
});

/**
 * POST /api/auth/bootstrap
 * Called once, right after a Workspace Owner signs up (email/password or
 * Google) in Firebase. Idempotent: if an `owners` row already exists for
 * this firebase_uid, it's returned as-is rather than duplicated.
 */
authRouter.post(
  "/bootstrap",
  requireFirebaseAuth,
  asyncHandler(async (req, res) => {
    const body = bootstrapSchema.parse(req.body ?? {});
    const { uid, email, name } = req.firebaseUser!;

    const { data: existing } = await supabase
      .from("owners")
      .select("id, firebase_uid, email, full_name, avatar_url, created_at")
      .eq("firebase_uid", uid)
      .maybeSingle();

    if (existing) {
      return res.json({ owner: existing, created: false });
    }

    const { data: created, error } = await supabase
      .from("owners")
      .insert({
        firebase_uid: uid,
        email,
        full_name: body.full_name ?? name ?? null,
        avatar_url: body.avatar_url ?? null,
      })
      .select("id, firebase_uid, email, full_name, avatar_url, created_at")
      .single();

    if (error) {
      // Another concurrent bootstrap call (StrictMode double-invoke, a
      // retried request, two tabs) may have won the insert race — that's
      // fine, just return the row it created instead of erroring.
      if (error.code === "23505") {
        const { data: raceWinner, error: refetchError } = await supabase
          .from("owners")
          .select("id, firebase_uid, email, full_name, avatar_url, created_at")
          .eq("firebase_uid", uid)
          .single();
        if (!refetchError && raceWinner) {
          return res.json({ owner: raceWinner, created: false });
        }
      }
      throw new AppError(error.message, 500);
    }

    res.status(201).json({ owner: created, created: true });
  })
);

/** GET /api/auth/me — current owner profile plus workspace memberships. */
authRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const workspaceIds = await getOwnerWorkspaceIds(req.owner!.id);
    if (workspaceIds.length === 0) {
      return res.json({ owner: req.owner, workspaces: [] });
    }

    const { data, error } = await supabase
      .from("workspaces")
      .select("id, name, slug, logo_url, brand_color, plan, storage_used_bytes, storage_limit_bytes")
      .in("id", workspaceIds)
      .order("created_at", { ascending: true });
    if (error) throw new AppError(error.message, 500);

    res.json({ owner: req.owner, workspaces: data });
  })
);
