import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Download, FileText } from "lucide-react";
import { DashboardLayout } from "../../components/DashboardLayout.js";
import { Card } from "../../components/ui/Card.js";
import { Skeleton } from "../../components/ui/Skeleton.js";
import { SubmissionStatusBadge } from "../../components/ui/Badge.js";
import { ErrorState } from "../../components/ui/ErrorState.js";
import { Button } from "../../components/ui/Button.js";
import { api } from "../../lib/api.js";
import type { SubmissionDetail as SubmissionDetailType } from "../../types/domain.js";

export default function SubmissionDetail() {
  const { id: formId, submissionId } = useParams<{ id: string; submissionId: string }>();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<SubmissionDetailType | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!submissionId) return;
    api
      .get<SubmissionDetailType>(`/submissions/manage/${submissionId}`)
      .then(setDetail)
      .catch(() => setLoadError(true));
  }, [submissionId]);

  if (loadError) {
    return (
      <DashboardLayout title="Submission" action={<span />}>
        <ErrorState
          title="Couldn't load this submission"
          description="It may have been removed, or you may not have access to it."
          action={<Button onClick={() => navigate(`/dashboard/forms/${formId}`)}>Back to submissions</Button>}
        />
      </DashboardLayout>
    );
  }

  if (!detail) {
    return (
      <DashboardLayout title="Submission" action={<span />}>
        <div className="max-w-2xl mx-auto">
          <Skeleton className="h-64" />
        </div>
      </DashboardLayout>
    );
  }

  const { submission, values, files } = detail;
  const valueByField = new Map(values.map((v) => [v.field_id, v.value_text ?? v.value_json]));
  const fieldsSorted = [...submission.form.form_fields].sort((a, b) => a.position - b.position);

  return (
    <DashboardLayout title={submission.reference_number} action={<span />}>
      <div className="max-w-2xl mx-auto flex flex-col gap-5">
        <Link to={`/dashboard/forms/${formId}`} className="flex items-center gap-1.5 text-sm text-ink-600 hover:text-ink-900 w-fit">
          <ArrowLeft size={14} /> Back to submissions
        </Link>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono text-sm text-primary-600">{submission.reference_number}</p>
              <p className="text-xs text-ink-400 mt-1">{new Date(submission.submitted_at).toLocaleString()}</p>
            </div>
            <SubmissionStatusBadge status={submission.status} />
          </div>
        </Card>

        <Card>
          <h2 className="font-semibold text-ink-900 mb-4">Responses</h2>
          <div className="flex flex-col divide-y divide-slate-100">
            {fieldsSorted.map((field) => {
              const raw = valueByField.get(field.id);
              const value = Array.isArray(raw) ? raw.join(", ") : (raw as string) ?? "—";
              return (
                <div key={field.id} className="py-3">
                  <p className="text-xs text-ink-400">{field.label}</p>
                  {field.field_type === "rich_text" ? (
                    <div className="text-sm text-ink-900 mt-1 prose-sm" dangerouslySetInnerHTML={{ __html: value }} />
                  ) : (
                    <p className="text-sm text-ink-900 mt-1">{value}</p>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {files.length > 0 && (
          <Card>
            <h2 className="font-semibold text-ink-900 mb-4">Files</h2>
            <div className="flex flex-col gap-2">
              {files.map((file) => (
                <a
                  key={file.id}
                  href={file.download_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-control border border-slate-200 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText size={16} className="text-primary-600 shrink-0" />
                    <span className="text-sm text-ink-900 truncate">{file.original_name}</span>
                    <span className="text-xs text-ink-400 shrink-0">{(file.size_bytes / 1024 / 1024).toFixed(1)}MB</span>
                  </div>
                  <Download size={15} className="text-ink-400 shrink-0" />
                </a>
              ))}
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
