import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Copy, Check } from "lucide-react";
import { DashboardLayout } from "../components/DashboardLayout.js";
import { Card } from "../components/ui/Card.js";
import { Skeleton } from "../components/ui/Skeleton.js";
import { ErrorState } from "../components/ui/ErrorState.js";
import { Button } from "../components/ui/Button.js";
import { TextField } from "../components/ui/TextField.js";
import { FieldPalette } from "../components/builder/FieldPalette.js";
import { DraggableFieldList } from "../components/builder/DraggableFieldList.js";
import { FieldSettingsPanel } from "../components/builder/FieldSettingsPanel.js";
import { FIELD_TYPE_META } from "../components/builder/fieldTypes.js";
import { newClientId } from "../components/builder/types.js";
import type { WorkingField } from "../components/builder/types.js";
import { useAuth } from "../contexts/AuthContext.js";
import { api } from "../lib/api.js";
import type { FieldType, FormDetail } from "../types/domain.js";

const FILE_TYPES = ["pdf", "docx", "pptx", "zip", "jpg", "png"] as const;

const basicsSchema = z.object({
  title: z.string().min(2, "Give your submission a title").max(150),
  description: z.string().max(2000).optional(),
  closesAt: z.string().min(1, "Set a deadline"),
  maxUploadSizeMb: z.coerce.number().int().min(1).max(500),
  maxFiles: z.coerce.number().int().min(1).max(20),
  duplicatePolicy: z.enum(["unlimited", "one_per_email", "one_per_matric", "one_per_employee_id", "one_per_phone"]),
  allowedFileTypes: z.array(z.string()).min(1, "Allow at least one file type"),
});
type BasicsValues = z.infer<typeof basicsSchema>;

const DEFAULT_FIELDS: WorkingField[] = [
  { clientId: newClientId(), id: "", field_type: "full_name", label: "Full Name", is_required: true, position: 0 },
  { clientId: newClientId(), id: "", field_type: "email", label: "Email Address", is_required: true, position: 1 },
];

export default function FormBuilder() {
  const { id } = useParams(); // present when editing an existing form
  const isEditing = !!id;
  const { activeWorkspace } = useAuth();
  const workspace = activeWorkspace;
  const navigate = useNavigate();

  const [fields, setFields] = useState<WorkingField[]>(DEFAULT_FIELDS);
  const [selectedId, setSelectedId] = useState<string | null>(DEFAULT_FIELDS[0]?.clientId ?? null);
  const [submissionUrl, setSubmissionUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(!isEditing);
  const [loadError, setLoadError] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BasicsValues>({
    resolver: zodResolver(basicsSchema),
    defaultValues: {
      maxUploadSizeMb: 50,
      maxFiles: 5,
      duplicatePolicy: "unlimited",
      allowedFileTypes: ["pdf", "docx"],
    },
  });

  useEffect(() => {
    if (!isEditing) return;
    api
      .get<{ form: FormDetail }>(`/forms/manage/${id}`)
      .then(({ form }) => {
        reset({
          title: form.title,
          description: form.description ?? "",
          closesAt: form.closes_at.slice(0, 16),
          maxUploadSizeMb: form.max_upload_size_mb,
          maxFiles: form.max_files,
          duplicatePolicy: form.duplicate_policy,
          allowedFileTypes: form.allowed_file_types,
        });
        setFields(form.form_fields.map((f) => ({ ...f, clientId: newClientId() })).sort((a, b) => a.position - b.position));
        setLoaded(true);
      })
      .catch(() => setLoadError(true));
  }, [id, isEditing, reset]);

  const selectedTypes = watch("allowedFileTypes") ?? [];
  const toggleType = (type: string) => {
    const next = selectedTypes.includes(type) ? selectedTypes.filter((t) => t !== type) : [...selectedTypes, type];
    setValue("allowedFileTypes", next, { shouldValidate: true });
  };

  const selectedField = fields.find((f) => f.clientId === selectedId) ?? null;

  const addField = (type: FieldType) => {
    const meta = FIELD_TYPE_META[type];
    const field: WorkingField = {
      clientId: newClientId(),
      id: "",
      field_type: type,
      label: meta.defaultLabel,
      is_required: false,
      position: fields.length,
      options: meta.hasOptions ? ["Option 1", "Option 2"] : undefined,
    };
    setFields((prev) => [...prev, field]);
    setSelectedId(field.clientId);
  };

  const updateField = (patch: Partial<WorkingField>) => {
    if (!selectedId) return;
    setFields((prev) => prev.map((f) => (f.clientId === selectedId ? { ...f, ...patch } : f)));
  };

  const removeField = (clientId: string) => {
    setFields((prev) => prev.filter((f) => f.clientId !== clientId));
    if (selectedId === clientId) setSelectedId(null);
  };

  const reorderFields = (fromIndex: number, toIndex: number) => {
    setFields((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next.map((f, i) => ({ ...f, position: i }));
    });
  };

  const onSubmit = async (values: BasicsValues) => {
    if (!workspace || fields.length === 0) {
      setServerError("Add at least one field before publishing.");
      return;
    }
    setServerError(null);

    const fieldPayload = fields.map((f, i) => ({
      field_type: f.field_type,
      label: f.label,
      placeholder: f.placeholder || undefined,
      help_text: f.help_text || undefined,
      description: f.description || undefined,
      is_required: f.is_required,
      options: f.options,
      position: i,
    }));

    try {
      if (isEditing) {
        await api.patch(`/forms/manage/${id}`, {
          title: values.title,
          description: values.description || undefined,
          closes_at: new Date(values.closesAt).toISOString(),
          max_upload_size_mb: values.maxUploadSizeMb,
          max_files: values.maxFiles,
          allowed_file_types: values.allowedFileTypes,
          duplicate_policy: values.duplicatePolicy,
          fields: fieldPayload,
        });
        navigate("/dashboard");
      } else {
        const res = await api.post<{ submission_url: string }>("/forms/manage", {
          workspace_id: workspace.id,
          title: values.title,
          description: values.description || undefined,
          closes_at: new Date(values.closesAt).toISOString(),
          max_upload_size_mb: values.maxUploadSizeMb,
          max_files: values.maxFiles,
          allowed_file_types: values.allowedFileTypes,
          duplicate_policy: values.duplicatePolicy,
          fields: fieldPayload,
        });
        setSubmissionUrl(res.submission_url);
      }
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Couldn't save this submission form.");
    }
  };

  const copyLink = async () => {
    if (!submissionUrl) return;
    await navigator.clipboard.writeText(submissionUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  if (loadError) {
    return (
      <DashboardLayout title="Submission not found" action={<span />}>
        <ErrorState
          title="Couldn't load this submission"
          description="It may have been deleted, or you may not have access to it."
          action={<Button onClick={() => navigate("/dashboard/forms")}>Back to submissions</Button>}
        />
      </DashboardLayout>
    );
  }

  if (!loaded) {
    return (
      <DashboardLayout title="Loading…" action={<span />}>
        <div className="max-w-2xl mx-auto">
          <Skeleton className="h-40" />
        </div>
      </DashboardLayout>
    );
  }

  if (submissionUrl) {
    return (
      <DashboardLayout title="Submission created" action={<span />}>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}>
          <Card elevation="md" className="max-w-lg mx-auto text-center py-12">
            <div className="mx-auto h-12 w-12 rounded-full bg-success-50 flex items-center justify-center mb-4">
              <Check className="text-success-500" size={22} />
            </div>
            <h2 className="font-display text-lg text-ink-900">Your submission is live</h2>
            <p className="text-sm text-ink-600 mt-1.5">Share this link with your submitters.</p>
            <div className="flex items-center justify-between bg-slate-50 rounded-control px-4 py-3 mt-6 text-sm border border-slate-100">
              <span className="font-mono text-primary-600 truncate">{submissionUrl}</span>
              <button onClick={copyLink} className="text-ink-400 hover:text-ink-900 ml-3 shrink-0 transition-colors">
                {copied ? <Check size={16} className="text-success-500" /> : <Copy size={16} />}
              </button>
            </div>
            <Button className="mt-8" onClick={() => navigate("/dashboard")}>
              Back to dashboard
            </Button>
          </Card>
        </motion.div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={isEditing ? "Edit Submission" : "New Submission"} action={<span />}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6 max-w-6xl mx-auto">
        <Card>
          <h2 className="font-semibold text-ink-900 mb-4">Basics</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="col-span-2">
              <TextField label="Title" placeholder="Final Year Project Report" error={errors.title?.message} {...register("title")} />
            </div>
            <div className="col-span-2 flex flex-col gap-1.5">
              <label className="text-sm font-medium text-ink-900">Description (optional)</label>
              <textarea
                rows={2}
                className="rounded-control border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
                {...register("description")}
              />
            </div>
            <TextField label="Deadline" type="datetime-local" error={errors.closesAt?.message} {...register("closesAt")} />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-ink-900">Duplicate protection</label>
              <select
                className="rounded-control border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
                {...register("duplicatePolicy")}
              >
                <option value="unlimited">Unlimited submissions</option>
                <option value="one_per_email">One per email address</option>
                <option value="one_per_matric">One per matric number</option>
                <option value="one_per_employee_id">One per employee ID</option>
                <option value="one_per_phone">One per phone number</option>
              </select>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="font-semibold text-ink-900 mb-4">Uploads</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextField label="Max upload size (MB)" type="number" error={errors.maxUploadSizeMb?.message} {...register("maxUploadSizeMb")} />
            <TextField label="Max files" type="number" error={errors.maxFiles?.message} {...register("maxFiles")} />
          </div>
          <div className="mt-4">
            <p className="text-sm font-medium text-ink-900 mb-2">Allowed file types</p>
            <div className="flex flex-wrap gap-2">
              {FILE_TYPES.map((type) => (
                <button
                  type="button"
                  key={type}
                  onClick={() => toggleType(type)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    selectedTypes.includes(type)
                      ? "bg-primary-500 border-primary-500 text-white"
                      : "border-slate-200 text-ink-600 hover:border-slate-300"
                  }`}
                >
                  .{type}
                </button>
              ))}
            </div>
            {errors.allowedFileTypes && <p className="text-xs text-danger-500 mt-2">{errors.allowedFileTypes.message}</p>}
          </div>
        </Card>

        <Card className="p-0 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr_320px] min-h-[440px]">
            <div className="border-b lg:border-b-0 lg:border-r border-slate-100 p-4 overflow-y-auto">
              <p className="text-2xs font-medium text-ink-400 uppercase tracking-wider mb-2 px-1">Add Fields</p>
              <FieldPalette onAdd={addField} />
            </div>
            <div className="p-5 overflow-y-auto bg-slate-50/50">
              <p className="text-2xs font-medium text-ink-400 uppercase tracking-wider mb-3">Form Preview</p>
              <DraggableFieldList
                fields={fields}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onReorder={reorderFields}
                onRemove={removeField}
              />
            </div>
            <div className="border-t lg:border-t-0 lg:border-l border-slate-100 p-5 overflow-y-auto">
              <p className="text-2xs font-medium text-ink-400 uppercase tracking-wider mb-3">Field Settings</p>
              <FieldSettingsPanel field={selectedField} onChange={updateField} />
            </div>
          </div>
        </Card>

        {serverError && <p className="text-sm text-danger-500">{serverError}</p>}

        <div className="flex justify-end gap-3 pb-8">
          <Button type="button" variant="outline" onClick={() => navigate("/dashboard")}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Publishing…" : isEditing ? "Save changes" : "Publish submission"}
          </Button>
        </div>
      </form>
    </DashboardLayout>
  );
}
