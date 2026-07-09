import { Router } from "express";
import { z } from "zod";
import { customAlphabet } from "nanoid";
import { stringify } from "csv-stringify/sync";
import archiver from "archiver";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { supabase, createSignedUploadUrl, createSignedDownloadUrl, downloadFileBuffer, incrementWorkspaceStorage } from "../config/supabase.js";
import { AppError } from "../middleware/errorHandler.js";
import { assertFormIsOpen } from "../services/deadlineEngine.js";
import { submissionLimiter } from "../middleware/rateLimiter.js";
import { sendSubmissionConfirmation, sendOwnerNewSubmissionNotice } from "../services/email.js";
import { assertOwnerHasWorkspace, getOwnedSubmission } from "../services/authorization.js";

export const submissionsRouter = Router();

const refIdSuffix = customAlphabet("0123456789", 7);

/** Resolves form_id -> workspace_id and verifies the caller's ownership before any of the /manage routes below touch its data. */
async function assertOwnerHasForm(ownerId: string, formId: string): Promise<void> {
  const { data: form, error } = await supabase.from("forms").select("workspace_id").eq("id", formId).maybeSingle();
  if (error) throw new AppError(error.message, 500);
  if (!form) throw new AppError("Not found", 404);
  await assertOwnerHasWorkspace(ownerId, form.workspace_id);
}

const submitSchema = z.object({
  form_slug: z.string(),
  values: z.record(z.string(), z.unknown()),
  submitter_email: z.string().email().optional(),
});

/**
 * POST /api/submissions — the one endpoint every submitter uses.
 * No authentication. Deadline + duplicate checks happen here, server-side,
 * regardless of what the client's countdown UI displayed.
 */
submissionsRouter.post(
  "/",
  submissionLimiter,
  asyncHandler(async (req, res) => {
    const body = submitSchema.parse(req.body);

    const { data: form, error: formError } = await supabase
      .from("forms")
      .select(
        "id, workspace_id, title, status, opens_at, closes_at, duplicate_policy, form_fields(id, label, is_required, field_type), workspace:workspaces(name, owner:owners(email))"
      )
      .eq("slug", body.form_slug)
      .single();

    if (formError || !form) throw new AppError("Submission form not found", 404);

    // Layer 2 of 3 in the deadline engine (layer 1 is the GET the client
    // used to render the page; layer 3 is the DB constraint/trigger).
    assertFormIsOpen(form);

    for (const field of form.form_fields) {
      // file_upload fields are validated separately: the file itself is
      // registered via POST /:id/files *after* this call succeeds (the
      // upload needs a submission_id first), so it will never appear in
      // `values`. Checking it here would reject every submission with a
      // required file field, even ones that go on to upload it correctly.
      if (field.field_type === "file_upload") continue;
      if (field.is_required && !(field.id in body.values)) {
        throw new AppError(`Missing required field: ${field.label}`, 422);
      }
    }

    let dedupeKey: string | null = null;
    if (form.duplicate_policy !== "unlimited") {
      const targetType = form.duplicate_policy.replace("one_per_", "");
      const matchingField = form.form_fields.find((f) =>
        targetType === "matric" ? f.field_type === "matric_number" : f.field_type.includes(targetType)
      );
      if (matchingField) {
        const raw = body.values[matchingField.id];
        dedupeKey = typeof raw === "string" ? raw.trim().toLowerCase() : null;
      }
    }

    const referenceNumber = `STV-${new Date().getFullYear()}-${refIdSuffix()}`;

    const { data: submission, error: subError } = await supabase
      .from("submissions")
      .insert({
        form_id: form.id,
        workspace_id: form.workspace_id,
        reference_number: referenceNumber,
        submitter_email: body.submitter_email ?? null,
        dedupe_key: dedupeKey,
        ip_address: req.ip,
        user_agent: req.headers["user-agent"],
      })
      .select()
      .single();

    if (subError) {
      if (subError.code === "23505") {
        throw new AppError("A submission already exists for this identifier.", 409);
      }
      throw new AppError(subError.message, 500);
    }

    const valueRows = Object.entries(body.values).map(([field_id, value]) => ({
      submission_id: submission.id,
      field_id,
      value_text: typeof value === "string" ? value : null,
      value_json: typeof value === "string" ? null : value,
    }));
    if (valueRows.length > 0) {
      const { error: valuesError } = await supabase.from("submission_values").insert(valueRows);
      if (valuesError) throw new AppError(valuesError.message, 500);
    }

    // Fire-and-forget notifications — never let email delivery hold up the
    // submitter's response or fail the submission itself.
    if (body.submitter_email) {
      sendSubmissionConfirmation({
        to: body.submitter_email,
        formTitle: form.title,
        referenceNumber,
        submittedAt: submission.submitted_at,
      }).catch((err) => console.error("[email] confirmation failed:", err));
    }
    const ownerEmail = (form as any).workspace?.owner?.email;
    if (ownerEmail) {
      sendOwnerNewSubmissionNotice({
        to: ownerEmail,
        formTitle: form.title,
        referenceNumber,
        dashboardUrl: `${process.env.FRONTEND_URL}/dashboard/forms/${form.id}`,
      }).catch((err) => console.error("[email] owner notice failed:", err));
    }

    res.status(201).json({
      submission_id: submission.id,
      reference_number: referenceNumber,
      submitted_at: submission.submitted_at,
    });
  })
);

const signUploadSchema = z.object({
  field_id: z.string().uuid(),
  filename: z.string().min(1).max(255),
  mime_type: z.string().min(1),
  size_bytes: z.number().int().positive(),
});

/**
 * POST /api/submissions/:id/files/sign
 * Public (no auth — submitters never authenticate), but tightly validated
 * against the parent form's upload rules before a signed URL is ever issued.
 */
submissionsRouter.post(
  "/:id/files/sign",
  submissionLimiter,
  asyncHandler(async (req, res) => {
    const submissionId = z.string().uuid().parse(req.params.id);
    const body = signUploadSchema.parse(req.body);

    const { data: submission, error: subErr } = await supabase
      .from("submissions")
      .select("id, form_id, workspace_id, forms(status, opens_at, closes_at, max_upload_size_mb, max_files, allowed_file_types)")
      .eq("id", submissionId)
      .single();
    if (subErr || !submission) throw new AppError("Submission not found", 404);

    const form = (submission as any).forms;
    assertFormIsOpen(form);

    const ext = body.filename.split(".").pop()?.toLowerCase() ?? "";
    if (!form.allowed_file_types.includes(ext)) {
      throw new AppError(`File type .${ext} is not allowed for this submission.`, 422);
    }
    if (body.size_bytes > form.max_upload_size_mb * 1024 * 1024) {
      throw new AppError(`File exceeds the ${form.max_upload_size_mb}MB limit.`, 422);
    }

    const { count } = await supabase
      .from("submission_files")
      .select("id", { count: "exact", head: true })
      .eq("submission_id", submissionId);
    if ((count ?? 0) >= form.max_files) {
      throw new AppError(`Maximum of ${form.max_files} files reached for this submission.`, 422);
    }

    const path = `${submission.workspace_id}/${submission.form_id}/${submissionId}/${Date.now()}-${body.filename}`;
    const signed = await createSignedUploadUrl(path);

    res.json({ signed_url: signed.signedUrl, token: signed.token, path });
  })
);

const registerFileSchema = z.object({
  field_id: z.string().uuid().optional(),
  path: z.string().min(1),
  original_name: z.string().min(1).max(255),
  mime_type: z.string().min(1),
  size_bytes: z.number().int().positive(),
});

/** POST /api/submissions/:id/files — records file metadata after a successful storage upload. */
submissionsRouter.post(
  "/:id/files",
  submissionLimiter,
  asyncHandler(async (req, res) => {
    const submissionId = z.string().uuid().parse(req.params.id);
    const body = registerFileSchema.parse(req.body);

    const { data: submission, error } = await supabase
      .from("submissions")
      .select("id, workspace_id")
      .eq("id", submissionId)
      .single();
    if (error || !submission) throw new AppError("Submission not found", 404);

    const { data: file, error: fileError } = await supabase
      .from("submission_files")
      .insert({
        submission_id: submissionId,
        field_id: body.field_id ?? null,
        storage_path: body.path,
        original_name: body.original_name,
        mime_type: body.mime_type,
        size_bytes: body.size_bytes,
      })
      .select()
      .single();
    if (fileError) throw new AppError(fileError.message, 500);

    await incrementWorkspaceStorage(submission.workspace_id, body.size_bytes);

    res.status(201).json({ file });
  })
);

/** GET /api/submissions/:id/receipt — public receipt lookup, gated by reference number. */
submissionsRouter.get(
  "/:id/receipt",
  asyncHandler(async (req, res) => {
    const submissionId = z.string().uuid().parse(req.params.id);
    const referenceNumber = z.string().parse(req.query.ref);

    const { data: submission, error } = await supabase
      .from("submissions")
      .select("id, reference_number, submitted_at, submitter_email, forms(title, workspace_id, workspace:workspaces(name))")
      .eq("id", submissionId)
      .eq("reference_number", referenceNumber)
      .single();

    if (error || !submission) throw new AppError("Receipt not found", 404);
    res.json({ receipt: submission });
  })
);

/** GET /api/submissions/manage?form_id=... — owner-authenticated dashboard listing with search/sort/pagination. */
submissionsRouter.get(
  "/manage",
  requireAuth,
  asyncHandler(async (req, res) => {
    const formId = z.string().uuid().parse(req.query.form_id);
    await assertOwnerHasForm(req.owner!.id, formId);

    const search = typeof req.query.q === "string" ? req.query.q : undefined;
    const sort = (req.query.sort as string) === "asc" ? true : false;
    const page = Math.max(1, Number(req.query.page ?? 1));
    const pageSize = Math.min(100, Math.max(1, Number(req.query.page_size ?? 50)));
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("submissions")
      .select("id, reference_number, submitter_email, status, submitted_at", { count: "exact" })
      .eq("form_id", formId)
      .order("submitted_at", { ascending: sort })
      .range(from, to);
    if (search) {
      query = query.or(`reference_number.ilike.%${search}%,submitter_email.ilike.%${search}%`);
    }
    const { data, error, count } = await query;
    if (error) throw new AppError(error.message, 500);

    res.json({ submissions: data, page, page_size: pageSize, total: count ?? 0 });
  })
);

/** GET /api/submissions/manage/export?form_id=...&format=csv */
submissionsRouter.get(
  "/manage/export",
  requireAuth,
  asyncHandler(async (req, res) => {
    const formId = z.string().uuid().parse(req.query.form_id);
    await assertOwnerHasForm(req.owner!.id, formId);

    const { data: fields, error: fieldsError } = await supabase
      .from("form_fields")
      .select("id, label, position")
      .eq("form_id", formId)
      .order("position", { ascending: true });
    if (fieldsError) throw new AppError(fieldsError.message, 500);

    const { data: submissions, error: subsError } = await supabase
      .from("submissions")
      .select("id, reference_number, submitter_email, submitted_at, submission_values(field_id, value_text, value_json)")
      .eq("form_id", formId)
      .order("submitted_at", { ascending: false });
    if (subsError) throw new AppError(subsError.message, 500);

    const header = ["Reference Number", "Email", "Submitted At", ...fields.map((f) => f.label)];
    const csvRows = submissions.map((s) => {
      const valueByField = new Map(s.submission_values.map((v: any) => [v.field_id, v.value_text ?? JSON.stringify(v.value_json)]));
      return [
        s.reference_number,
        s.submitter_email ?? "",
        new Date(s.submitted_at).toISOString(),
        ...fields.map((f) => valueByField.get(f.id) ?? ""),
      ];
    });
    const rows = [header, ...csvRows];

    const csv = stringify(rows);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="submissions-${formId}.csv"`);
    res.send("\uFEFF" + csv);
  })
);

/** GET /api/submissions/manage/export-zip?form_id=... — bundles every uploaded file. */
submissionsRouter.get(
  "/manage/export-zip",
  requireAuth,
  asyncHandler(async (req, res) => {
    const formId = z.string().uuid().parse(req.query.form_id);
    await assertOwnerHasForm(req.owner!.id, formId);

    const { data: files, error } = await supabase
      .from("submission_files")
      .select("storage_path, original_name, submission:submissions!inner(form_id, reference_number)")
      .eq("submission.form_id", formId);
    if (error) throw new AppError(error.message, 500);

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="submissions-${formId}-files.zip"`);

    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.on("error", (err) => {
      console.error("[zip-export] archiver error:", err);
      res.destroy(err);
    });
    archive.pipe(res);

    for (const file of files ?? []) {
      try {
        const buffer = await downloadFileBuffer(file.storage_path);
        const ref = (file as any).submission?.reference_number ?? "unknown";
        archive.append(buffer, { name: `${ref}/${file.original_name}` });
      } catch (err) {
        console.error("[zip-export] skipping unreadable file:", file.storage_path, err);
      }
    }

    await archive.finalize();
  })
);

/** GET /api/submissions/manage/:id — full detail: field values + files.
 *  Registered AFTER the literal /manage/export routes above so Express
 *  doesn't swallow them into this :id parameter first. */
submissionsRouter.get(
  "/manage/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const submissionId = z.string().uuid().parse(req.params.id);
    await getOwnedSubmission(req.owner!.id, submissionId);

    const { data: submission, error } = await supabase
      .from("submissions")
      .select(
        "id, reference_number, submitter_email, status, submitted_at, ip_address, form:forms(id, title, form_fields(id, label, field_type, position))"
      )
      .eq("id", submissionId)
      .single();
    if (error || !submission) throw new AppError("Submission not found", 404);

    const { data: values, error: valuesError } = await supabase
      .from("submission_values")
      .select("field_id, value_text, value_json")
      .eq("submission_id", submissionId);
    if (valuesError) throw new AppError(valuesError.message, 500);

    const { data: files, error: filesError } = await supabase
      .from("submission_files")
      .select("id, field_id, original_name, mime_type, size_bytes, storage_path, created_at")
      .eq("submission_id", submissionId);
    if (filesError) throw new AppError(filesError.message, 500);

    const filesWithUrls = await Promise.all(
      (files ?? []).map(async (f) => ({ ...f, download_url: await createSignedDownloadUrl(f.storage_path) }))
    );

    res.json({ submission, values, files: filesWithUrls });
  })
);
