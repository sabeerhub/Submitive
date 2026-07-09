import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { supabase } from "../config/supabase.js";
import { AppError } from "../middleware/errorHandler.js";
import { assertOwnerHasWorkspace, getOwnerWorkspaceIds } from "../services/authorization.js";

export const workspacesRouter = Router();

const createWorkspaceSchema = z.object({
  name: z.string().min(2).max(80),
  slug: z
    .string()
    .min(3)
    .max(40)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
});

// All routes below require an authenticated Workspace Owner.
workspacesRouter.use(requireAuth);

workspacesRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const workspaceIds = await getOwnerWorkspaceIds(req.owner!.id);
    if (workspaceIds.length === 0) return res.json({ workspaces: [] });

    const { data, error } = await supabase
      .from("workspaces")
      .select("id, name, slug, logo_url, brand_color, plan, storage_used_bytes, storage_limit_bytes, created_at")
      .in("id", workspaceIds)
      .order("created_at", { ascending: false });
    if (error) throw new AppError(error.message, 500);

    res.json({ workspaces: data });
  })
);

workspacesRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const body = createWorkspaceSchema.parse(req.body);

    const { data: workspace, error: wsError } = await supabase
      .from("workspaces")
      .insert({ owner_id: req.owner!.id, name: body.name, slug: body.slug })
      .select()
      .single();
    if (wsError) {
      if (wsError.code === "23505") {
        throw new AppError("That workspace URL is already taken. Try a different name.", 409);
      }
      throw new AppError(wsError.message, 500);
    }

    const { error: memberError } = await supabase
      .from("workspace_members")
      .insert({ workspace_id: workspace.id, owner_id: req.owner!.id, role: "owner", accepted_at: new Date().toISOString() });
    if (memberError) throw new AppError(memberError.message, 500);

    res.status(201).json({ workspace });
  })
);

/** GET /api/workspaces/:id/analytics?days=30 — daily submission volume + rollups. */
workspacesRouter.get(
  "/:id/analytics",
  asyncHandler(async (req, res) => {
    const workspaceId = z.string().uuid().parse(req.params.id);
    await assertOwnerHasWorkspace(req.owner!.id, workspaceId);

    const days = Math.min(Math.max(Number(req.query.days ?? 30), 7), 90);
    const since = new Date();
    since.setDate(since.getDate() - days);

    const { data: submissions, error } = await supabase
      .from("submissions")
      .select("submitted_at, form_id")
      .eq("workspace_id", workspaceId)
      .gte("submitted_at", since.toISOString());
    if (error) throw new AppError(error.message, 500);

    const { count: totalForms } = await supabase
      .from("forms")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId);

    const { count: liveForms } = await supabase
      .from("forms")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .eq("status", "live");

    // Bucket submissions by calendar day for the trend chart.
    const buckets = new Map<string, number>();
    for (let i = 0; i < days; i++) {
      const d = new Date(since);
      d.setDate(d.getDate() + i);
      buckets.set(d.toISOString().slice(0, 10), 0);
    }
    for (const s of submissions ?? []) {
      const key = s.submitted_at.slice(0, 10);
      if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }

    res.json({
      daily: Array.from(buckets.entries()).map(([date, count]) => ({ date, count })),
      total_submissions: submissions?.length ?? 0,
      total_forms: totalForms ?? 0,
      live_forms: liveForms ?? 0,
    });
  })
);
