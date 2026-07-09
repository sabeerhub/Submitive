export interface Owner {
  id: string;
  firebase_uid: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  brand_color: string;
  plan: "free" | "pro" | "enterprise";
  storage_used_bytes: number;
  storage_limit_bytes: number;
}

export interface FormSummary {
  id: string;
  title: string;
  slug: string;
  status: "draft" | "live" | "closed" | "archived";
  closes_at: string;
  created_at: string;
}

export type FieldType =
  | "full_name" | "email" | "phone" | "matric_number" | "employee_id"
  | "department" | "course" | "organization" | "level" | "rich_text"
  | "file_upload" | "short_text" | "long_text" | "number" | "date"
  | "checkbox" | "radio" | "dropdown" | "url" | "custom";

export interface FormField {
  id: string;
  field_type: FieldType;
  label: string;
  placeholder?: string | null;
  help_text?: string | null;
  description?: string | null;
  is_required: boolean;
  validation?: Record<string, unknown>;
  options?: string[];
  position: number;
}

export interface FormDetail {
  id: string;
  workspace_id: string;
  title: string;
  description?: string | null;
  instructions?: string | null;
  slug: string;
  status: "draft" | "live" | "closed" | "archived";
  opens_at: string | null;
  closes_at: string;
  timezone: string;
  max_upload_size_mb: number;
  max_files: number;
  allowed_file_types: string[];
  duplicate_policy: "unlimited" | "one_per_email" | "one_per_matric" | "one_per_employee_id" | "one_per_phone";
  confirmation_message?: string;
  form_fields: FormField[];
}

export interface SubmissionSummary {
  id: string;
  reference_number: string;
  submitter_email: string | null;
  status: "submitted" | "completed" | "flagged";
  submitted_at: string;
}

export interface SubmissionFile {
  id: string;
  field_id: string | null;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  download_url: string;
}

export interface SubmissionDetail {
  submission: {
    id: string;
    reference_number: string;
    submitter_email: string | null;
    status: string;
    submitted_at: string;
    ip_address: string | null;
    form: { id: string; title: string; form_fields: { id: string; label: string; field_type: FieldType; position: number }[] };
  };
  values: { field_id: string; value_text: string | null; value_json: unknown }[];
  files: SubmissionFile[];
}
