import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, UploadCloud, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "../components/ui/Button.js";
import { TextField } from "../components/ui/TextField.js";
import { RichTextEditor } from "../components/ui/RichTextEditor.js";
import { FileDropzone } from "../components/ui/FileDropzone.js";
import { Badge } from "../components/ui/Badge.js";
import { Skeleton } from "../components/ui/Skeleton.js";
import { useCountdown } from "../hooks/useCountdown.js";
import { api } from "../lib/api.js";
import { uploadFileToSignedUrl } from "../lib/storage.js";
import { IDENTITY_FIELD_TYPES } from "../types/domain.js";
import type { FormDetail } from "../types/domain.js";

interface FormResponse {
  form: FormDetail & { workspace: { name: string; logo_url: string | null; brand_color: string } };
  deadline: { isOpen: boolean; reason?: string };
}

type Step = "identity" | "workspace";

interface SubmissionSession {
  submissionId: string;
  referenceNumber: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function PublicSubmission() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<FormResponse | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [step, setStep] = useState<Step>("identity");
  const [values, setValues] = useState<Record<string, string | string[]>>({});
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [uploadStage, setUploadStage] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [session, setSession] = useState<SubmissionSession | null>(null);

  useEffect(() => {
    if (!slug) return;
    api
      .get<FormResponse>(`/forms/${slug}`)
      .then(setData)
      .catch(() => setNotFound(true));
  }, [slug]);

  // Restore an in-progress session (identity already saved) if the submitter
  // refreshes or briefly navigates away — the whole point of persisting this
  // is that they should never have to re-enter their identity.
  useEffect(() => {
    if (!slug) return;
    try {
      const raw = sessionStorage.getItem(`submitiv:${slug}`);
      if (!raw) return;
      const saved = JSON.parse(raw) as { values?: typeof values; session?: SubmissionSession; step?: Step };
      if (saved.values) setValues(saved.values);
      if (saved.session) setSession(saved.session);
      if (saved.step) setStep(saved.step);
    } catch {
      // corrupt/old session data — just start fresh
    }
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    sessionStorage.setItem(`submitiv:${slug}`, JSON.stringify({ values, session, step }));
  }, [slug, values, session, step]);

  const countdown = useCountdown(data?.form.closes_at ?? null);
  const isOpen = data ? data.deadline.isOpen && !countdown.expired : false;

  const identityFields = data ? data.form.form_fields.filter((f) => IDENTITY_FIELD_TYPES.has(f.field_type)) : [];
  const contentFields = data ? data.form.form_fields.filter((f) => !IDENTITY_FIELD_TYPES.has(f.field_type)) : [];

  const setValue = (fieldId: string, value: string | string[]) => {
    setValues((prev) => ({ ...prev, [fieldId]: value }));
    setErrors((prev) => ({ ...prev, [fieldId]: "" }));
  };

  const validateIdentity = (): boolean => {
    const nextErrors: Record<string, string> = {};
    for (const field of identityFields) {
      const v = values[field.id];
      if (field.is_required && !v) {
        nextErrors[field.id] = "This field is required.";
        continue;
      }
      if (field.field_type === "email" && typeof v === "string" && v && !EMAIL_RE.test(v)) {
        nextErrors[field.id] = "Enter a valid email address.";
      }
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateWorkspace = (): boolean => {
    if (!data) return false;
    const nextErrors: Record<string, string> = {};
    for (const field of contentFields) {
      if (field.field_type === "file_upload") {
        const file = files[field.id];
        if (field.is_required && !file) {
          nextErrors[field.id] = "This file is required.";
          continue;
        }
        if (file) {
          const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
          if (!data.form.allowed_file_types.includes(ext)) {
            nextErrors[field.id] = `.${ext} isn't allowed. Use: ${data.form.allowed_file_types.map((t) => `.${t}`).join(", ")}`;
          } else if (file.size > data.form.max_upload_size_mb * 1024 * 1024) {
            nextErrors[field.id] = `File exceeds the ${data.form.max_upload_size_mb}MB limit.`;
          }
        }
      } else if (field.is_required) {
        const v = values[field.id];
        if (!v || (Array.isArray(v) && v.length === 0)) nextErrors[field.id] = "This field is required.";
      }
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  // Step 2 -> Step 3: creates the submission from identity fields only.
  const handleContinue = async () => {
    if (!data || !slug) return;
    if (!validateIdentity()) return;

    // Already created (submitter went Back then forward again) — identity
    // is already saved server-side, don't create a second submission.
    if (session) {
      setStep("workspace");
      return;
    }

    setSubmitting(true);
    setServerError(null);
    try {
      const emailField = identityFields.find((f) => f.field_type === "email");
      const submitterEmail = emailField ? (values[emailField.id] as string | undefined) : undefined;

      const res = await api.post<{ submission_id: string; reference_number: string }>("/submissions", {
        form_slug: slug,
        values,
        submitter_email: submitterEmail,
      });
      setSession({ submissionId: res.submission_id, referenceNumber: res.reference_number });
      setStep("workspace");
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Step 4: uploads any files, then finalizes the submission.
  const handleSubmitAssignment = async () => {
    if (!data || !slug || !session) return;
    if (!validateWorkspace()) return;

    setSubmitting(true);
    setServerError(null);
    try {
      const fileFields = contentFields.filter((f) => f.field_type === "file_upload");
      for (const field of fileFields) {
        const file = files[field.id];
        if (!file) continue;
        setUploadStage(`Uploading ${file.name}…`);
        const signed = await api.post<{ signed_url: string; token: string; path: string }>(
          `/submissions/${session.submissionId}/files/sign`,
          { field_id: field.id, filename: file.name, mime_type: file.type || "application/octet-stream", size_bytes: file.size }
        );
        await uploadFileToSignedUrl(signed.path, signed.token, file);
        await api.post(`/submissions/${session.submissionId}/files`, {
          field_id: field.id,
          path: signed.path,
          original_name: file.name,
          mime_type: file.type || "application/octet-stream",
          size_bytes: file.size,
        });
      }

      setUploadStage("Finalizing your submission…");
      const contentValues = Object.fromEntries(
        contentFields.filter((f) => f.field_type !== "file_upload").map((f) => [f.id, values[f.id]]).filter(([, v]) => v !== undefined)
      );
      await api.patch<{ submission_id: string; reference_number: string }>(`/submissions/${session.submissionId}/finalize`, {
        values: contentValues,
      });

      sessionStorage.removeItem(`submitiv:${slug}`);
      navigate(`/s/${slug}/receipt/${session.submissionId}?ref=${session.referenceNumber}`);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
      setUploadStage(null);
    }
  };

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <p className="text-ink-600">This submission link doesn't exist.</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-paper py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Skeleton className="h-4 w-32 mx-auto mb-6" />
          <div className="bg-white rounded-card shadow-md border border-slate-100 p-8">
            <Skeleton className="h-7 w-2/3 mb-3" />
            <Skeleton className="h-4 w-1/2 mb-7" />
            <div className="flex flex-col gap-5">
              <Skeleton className="h-11" />
              <Skeleton className="h-11" />
              <Skeleton className="h-11" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { form } = data;

  return (
    <div className="min-h-screen bg-paper py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-2 mb-6 justify-center text-ink-600 text-sm font-medium">
          <span className="h-1.5 w-1.5 rounded-full bg-primary-500" />
          {form.workspace.name}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="bg-white rounded-card shadow-md border border-slate-100 p-8"
        >
          {!isOpen ? (
            <ClosedNotice reason={data.deadline.reason} closesAt={form.closes_at} />
          ) : (
            <AnimatePresence mode="wait">
              {step === "identity" ? (
                <motion.div
                  key="identity"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                >
                  <h1 className="text-2xl font-display text-ink-900">{form.title}</h1>
                  <p className="text-ink-600 text-sm mt-2">Enter your details to begin your submission.</p>

                  <div className="flex flex-col gap-5 mt-7">
                    {identityFields.map((field) => (
                      <FieldRenderer
                        key={field.id}
                        field={field}
                        value={values[field.id]}
                        file={null}
                        error={errors[field.id]}
                        onChange={(v) => setValue(field.id, v)}
                        onFileChange={() => {}}
                        allowedFileTypes={form.allowed_file_types}
                        maxUploadSizeMb={form.max_upload_size_mb}
                      />
                    ))}
                  </div>

                  {serverError && <p className="text-sm text-danger-500 mt-4">{serverError}</p>}

                  <Button size="lg" className="w-full mt-7" onClick={handleContinue} disabled={submitting}>
                    {submitting ? "Checking…" : "Continue"}
                    {!submitting && <ArrowRight size={16} />}
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="workspace"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-display text-ink-900">{form.title}</h1>
                    <Badge tone="success">Open</Badge>
                  </div>
                  {form.description && <p className="text-ink-600 text-sm mt-2">{form.description}</p>}

                  <div className="flex gap-2.5 mt-5">
                    {[
                      [countdown.days, "Days"],
                      [countdown.hours, "Hours"],
                      [countdown.minutes, "Minutes"],
                      [countdown.seconds, "Seconds"],
                    ].map(([val, label]) => (
                      <div key={label as string} className="bg-slate-50 rounded-control px-3 py-2.5 text-center flex-1">
                        <p className="text-lg font-bold tabular-nums text-ink-900">{String(val).padStart(2, "0")}</p>
                        <p className="text-2xs text-ink-400 uppercase tracking-wide mt-0.5">{label}</p>
                      </div>
                    ))}
                  </div>

                  {form.instructions && (
                    <div className="text-sm text-ink-600 mt-5 bg-slate-50 rounded-control px-4 py-3">{form.instructions}</div>
                  )}

                  <div className="flex flex-col gap-5 mt-7">
                    {contentFields.map((field, i) => (
                      <motion.div
                        key={field.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.3), ease: [0.16, 1, 0.3, 1] }}
                      >
                        <FieldRenderer
                          field={field}
                          value={values[field.id]}
                          file={files[field.id] ?? null}
                          error={errors[field.id]}
                          onChange={(v) => setValue(field.id, v)}
                          onFileChange={(f) => setFiles((prev) => ({ ...prev, [field.id]: f }))}
                          allowedFileTypes={form.allowed_file_types}
                          maxUploadSizeMb={form.max_upload_size_mb}
                        />
                      </motion.div>
                    ))}
                  </div>

                  {serverError && <p className="text-sm text-danger-500 mt-4">{serverError}</p>}

                  <div className="flex gap-3 mt-7">
                    <Button variant="outline" onClick={() => setStep("identity")} disabled={submitting}>
                      <ArrowLeft size={16} /> Back
                    </Button>
                    <Button size="lg" className="flex-1" onClick={handleSubmitAssignment} disabled={submitting}>
                      <UploadCloud size={16} />
                      {uploadStage ?? (submitting ? "Submitting…" : "Submit Assignment")}
                    </Button>
                  </div>
                  <p className="text-xs text-ink-400 text-center mt-3">You will receive a confirmation after submission.</p>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </motion.div>

        <p className="text-center text-xs text-ink-400 mt-6">Powered by Submitiv</p>
      </div>
    </div>
  );
}

function ClosedNotice({ reason, closesAt }: { reason?: string; closesAt: string }) {
  const message =
    reason === "not_yet_open"
      ? "This submission hasn't opened yet."
      : reason === "draft"
        ? "This submission isn't published yet."
        : reason === "closed"
          ? "This submission has been closed by its organizer."
          : "Submission Closed";

  return (
    <div className="text-center py-10">
      <div className="mx-auto h-12 w-12 rounded-full bg-danger-500/10 flex items-center justify-center mb-4">
        <Lock className="text-danger-500" size={22} />
      </div>
      <h2 className="font-semibold text-lg text-ink-900">{message}</h2>
      <p className="text-sm text-ink-600 mt-2">
        {reason === "deadline_passed" || !reason
          ? "The submission deadline has passed. Late submissions are not accepted."
          : "Check back later, or contact the organizer for details."}
      </p>
    </div>
  );
}

function FieldRenderer({
  field,
  value,
  file,
  error,
  onChange,
  onFileChange,
  allowedFileTypes,
  maxUploadSizeMb,
}: {
  field: FormDetail["form_fields"][number];
  value: string | string[] | undefined;
  file: File | null;
  error?: string;
  onChange: (v: string | string[]) => void;
  onFileChange: (f: File | null) => void;
  allowedFileTypes: string[];
  maxUploadSizeMb: number;
}) {
  const label = `${field.label}${field.is_required ? " *" : ""}`;

  switch (field.field_type) {
    case "rich_text":
      return (
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-ink-900">{label}</label>
          <RichTextEditor value={(value as string) ?? ""} onChange={onChange} placeholder={field.placeholder ?? undefined} />
          {error && <p className="text-xs text-danger-500">{error}</p>}
        </div>
      );

    case "long_text":
      return (
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-ink-900">{label}</label>
          <textarea
            rows={4}
            placeholder={field.placeholder ?? undefined}
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            className="rounded-control border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
          />
          {error && <p className="text-xs text-danger-500">{error}</p>}
        </div>
      );

    case "dropdown":
      return (
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-ink-900">{label}</label>
          <select
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            className="rounded-control border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
          >
            <option value="">Select…</option>
            {(field.options ?? []).map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          {error && <p className="text-xs text-danger-500">{error}</p>}
        </div>
      );

    case "radio":
      return (
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-ink-900">{label}</label>
          <div className="flex flex-col gap-2">
            {(field.options ?? []).map((opt) => (
              <label key={opt} className="flex items-center gap-2 text-sm text-ink-900">
                <input type="radio" name={field.id} checked={value === opt} onChange={() => onChange(opt)} className="text-primary-500" />
                {opt}
              </label>
            ))}
          </div>
          {error && <p className="text-xs text-danger-500">{error}</p>}
        </div>
      );

    case "checkbox": {
      const arr = Array.isArray(value) ? value : [];
      return (
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-ink-900">{label}</label>
          <div className="flex flex-col gap-2">
            {(field.options ?? []).map((opt) => (
              <label key={opt} className="flex items-center gap-2 text-sm text-ink-900">
                <input
                  type="checkbox"
                  checked={arr.includes(opt)}
                  onChange={(e) => onChange(e.target.checked ? [...arr, opt] : arr.filter((o) => o !== opt))}
                  className="rounded text-primary-500"
                />
                {opt}
              </label>
            ))}
          </div>
          {error && <p className="text-xs text-danger-500">{error}</p>}
        </div>
      );
    }

    case "file_upload":
      return (
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-ink-900">{label}</label>
          <FileDropzone file={file} onChange={onFileChange} accept={allowedFileTypes} maxSizeMb={maxUploadSizeMb} />
          {error && <p className="text-xs text-danger-500">{error}</p>}
        </div>
      );

    case "date":
      return (
        <TextField label={label} type="date" value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} error={error} />
      );

    case "number":
      return (
        <TextField label={label} type="number" value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} error={error} />
      );

    case "email":
      return (
        <TextField label={label} type="email" placeholder={field.placeholder ?? undefined} value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} error={error} />
      );

    case "url":
      return (
        <TextField label={label} type="url" placeholder={field.placeholder ?? undefined} value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} error={error} />
      );

    default:
      return (
        <TextField label={label} placeholder={field.placeholder ?? undefined} value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} error={error} />
      );
  }
}
