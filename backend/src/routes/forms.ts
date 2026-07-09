import { Router } from "express";
import { z } from "zod";
import { customAlphabet } from "nanoid";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { supabase } from "../config/supabase.js";
import { AppError } from "../middleware/errorHandler.js";
import { getDeadlineState } from "../services/deadlineEngine.js";
import { assertOwnerHasWorkspace, getOwnedForm } from "../services/authorization.js";

export const formsRouter = Router();

// Unambiguous alphabet (no 0/O/1/I) for human-shareable slugs like AB72PXQ.
const generateSlug = customAlphabet("23456789ABCDEFGHJKLMNPQRSTUVWXYZ", 7);

const fieldSchema = z.object({
  field_type: z.enum([
    "full_name", "email", "phone", "matric_number", "employee_id",
    "department", "course", "organization", "level", "rich_text",
    "file_upload", "short_text", "long_text", "number", "date",
    "checkbox", "radio", "dropdown", "url", "custom",
  ]),
  label: z.string().min(1).max(120),
  placeholder: z.string().max(200).optional(),
  help_text: z.string().max(400).optional(),
  description: z.string().max(400).optional(),
  is_required: z.boolean().default(false),
  validation: z.record(z.string(), z.unknown()).optional(),
  options: z.array(z.string()).optional(),
  position: z.number().int().nonnegative(),
});

const createFormSchema = z.object({
  workspace_id: z.string().uuid(),
  title: z.string().min(2).max(150),
  description: z.string().max(2000).optional(),
  instructions: z.string().max(4000).optional(),
  opens_at: z.string().datetime().nullable().optional(),
  closes_at: z.string().datetime(),
  timezone: z.string().default("UTC"),
  max_upload_size_mb: z.number().int().positive().max(500).default(50),
  max_files: z.number().int().positive().max(20).default(5),
  allowed_file_types: z.array(z.string()).default(["pdf", "docx", "pptx", "zip", "jpg", "png"]),
  duplicate_policy: z
    .enum(["unlimited", "one_per_email", "one_per_matric", "one_per_employee_id", "one_per_phone"])
    .default("unlimited"),
  confirmation_message: z.string().max(500).optional(),
  fields: z.array(fieldSchema).min(1),
});

// ---- Owner-authenticated routes ----
formsRouter.use("/manage", requireAuth);

formsRouter.post(
  "/manage",
  asyncHandler(async (req, res) => {
    const body = createFormSchema.parse(req.body);
    // Verify the caller actually belongs to the workspace they're creating
    // a form in — without this, any authenticated owner could pass any
    // workspace_id and create forms inside a stranger's workspace.
    await assertOwnerHasWorkspace(req.owner!.id, body.workspace_id);

    const slug = generateSlug();

    const { data: form, error: formError } = await supabase
      .from("forms")
      .insert({
        workspace_id: body.workspace_id,
        title: body.title,
        description: body.description,
        instructions: body.instructions,
        slug,
        opens_at: body.opens_at ?? null,
        closes_at: body.closes_at,
        timezone: body.timezone,
        max_upload_size_mb: body.max_upload_size_mb,
        max_files: body.max_files,
        allowed_file_types: body.allowed_file_types,
        duplicate_policy: body.duplicate_policy,
        confirmation_message: body.confirmation_message,
        status: "live",
      })
      .select()
      .single();
    if (formError) throw new AppError(formError.message, 500);

    const fieldsToInsert = body.fields.map((f) => ({ ...f, form_id: form.id }));
    const { error: fieldsError } = await supabase.from("form_fields").insert(fieldsToInsert);
    if (fieldsError) throw new AppError(fieldsError.message, 500);

    res.status(201).json({ form, submission_url: `${process.env.FRONTEND_URL}/s/${slug}` });
  })
);

/** GET /api/forms/manage?workspace_id=... — list forms owned by the caller's workspace. */
formsRouter.get(
  "/manage",
  asyncHandler(async (req, res) => {
    const workspaceId = z.string().uuid().parse(req.query.workspace_id);
    await assertOwnerHasWorkspace(req.owner!.id, workspaceId);

    const { data, error } = await supabase
      .from("forms")
      .select("id, title, slug, status, closes_at, created_at")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });
    if (error) throw new AppError(error.message, 500);

    res.json({ forms: data });
  })
);

formsRouter.get(
  "/manage/:id",
  asyncHandler(async (req, res) => {
    const formId = z.string().uuid().parse(req.params.id);
    // getOwnedForm verifies workspace membership; the follow-up query below
    // re-fetches with the fields relation included.
    await getOwnedForm(req.owner!.id, formId);

    const { data, error } = await supabase
      .from("forms")
      .select("*, form_fields ( id, field_type, label, placeholder, help_text, description, is_required, validation, options, position )")
      .eq("id", formId)
      .order("position", { referencedTable: "form_fields", ascending: true })
      .single();
    if (error) throw new AppError(error.message, 404);

    res.json({ form: data });
  })
);

const updateFormSchema = createFormSchema.partial().extend({
  status: z.enum(["draft", "live", "closed", "archived"]).optional(),
  fields: z.array(fieldSchema).min(1).optional(),
});

formsRouter.patch(
  "/manage/:id",
  asyncHandler(async (req, res) => {
    const formId = z.string().uuid().parse(req.params.id);
    await getOwnedForm(req.owner!.id, formId);

    const body = updateFormSchema.parse(req.body);
    const { fields, workspace_id, ...formPatch } = body;

    if (Object.keys(formPatch).length > 0) {
      const { error } = await supabase.from("forms").update(formPatch).eq("id", formId);
      if (error) throw new AppError(error.message, 500);
    }

    if (fields) {
      // Whole-form field replacement keeps the builder's save action simple
      // and atomic — the alternative (diffing adds/edits/removes) adds
      // complexity with little benefit before a form has submissions.
      const { error: delError } = await supabase.from("form_fields").delete().eq("form_id", formId);
      if (delError) throw new AppError(delError.message, 500);

      const { error: insError } = await supabase
        .from("form_fields")
        .insert(fields.map((f) => ({ ...f, form_id: formId })));
      if (insError) throw new AppError(insError.message, 500);
    }

    res.json({ success: true });
  })
);

// ---- Public route: submitter-facing, no auth ----
// Uses the service-role client directly (read-only, non-sensitive fields
// only) — submitters never authenticate, so there's no owner to check
// against; the only gate here is the form's own deadline state.
formsRouter.get(
  "/:slug",
  asyncHandler(async (req, res) => {
    const { data: form, error } = await supabase
      .from("forms")
      .select(`
        id, title, description, instructions, cover_image_url, status,
        opens_at, closes_at, timezone, max_upload_size_mb, max_files,
        allowed_file_types, confirmation_message,
        workspace:workspaces ( name, logo_url, brand_color ),
        form_fields ( id, field_type, label, placeholder, help_text, description, is_required, options, position )
      `)
      .eq("slug", req.params.slug)
      .single();

    if (error || !form) throw new AppError("Submission form not found", 404);

    const deadline = getDeadlineState(form);
    res.json({ form, deadline });
  })
);
