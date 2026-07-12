import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FileStack, Clock, PlusCircle, Copy } from "lucide-react";
import { DashboardLayout } from "../../components/DashboardLayout.js";
import { Card } from "../../components/ui/Card.js";
import { Button } from "../../components/ui/Button.js";
import { EmptyState } from "../../components/EmptyState.js";
import { SkeletonRows } from "../../components/ui/Skeleton.js";
import { StatusBadge } from "../../components/ui/Badge.js";
import { Tooltip } from "../../components/ui/Tooltip.js";
import { useAuth } from "../../contexts/AuthContext.js";
import { useToast } from "../../contexts/ToastContext.js";
import { api } from "../../lib/api.js";
import type { FormSummary } from "../../types/domain.js";

export default function FormsList() {
  const { activeWorkspace } = useAuth();
  const workspace = activeWorkspace;
  const toast = useToast();
  const [forms, setForms] = useState<FormSummary[] | null>(null);

  useEffect(() => {
    if (!workspace) return;
    api
      .get<{ forms: FormSummary[] }>(`/forms/manage?workspace_id=${workspace.id}`)
      .then((res) => setForms(res.forms))
      .catch(() => {
        setForms([]);
        toast.show("Couldn't load your submission forms.", "error");
      });
  }, [workspace]);

  const copyLink = (slug: string) => {
    navigator.clipboard.writeText(`${location.origin}/s/${slug}`);
    toast.show("Link copied to clipboard");
  };

  return (
    <DashboardLayout title="Submissions">
      <Card>
        {forms === null ? (
          <SkeletonRows count={4} height="h-16" />
        ) : forms.length === 0 ? (
          <EmptyState
            icon={<FileStack size={20} />}
            title="No submission forms yet"
            description="Create your first form to start collecting submissions with a deadline, a shareable link, and automatic locking."
            action={
              <Link to="/forms/new">
                <Button><PlusCircle size={16} /> Create your first submission</Button>
              </Link>
            }
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {forms.map((form) => (
              <Link
                key={form.id}
                to={`/dashboard/forms/${form.id}`}
                className="flex items-center justify-between py-4 hover:bg-slate-50 -mx-6 px-6 transition-colors duration-fast"
              >
                <div>
                  <p className="font-medium text-ink-900">{form.title}</p>
                  <p className="text-xs text-ink-400 flex items-center gap-1.5 mt-1">
                    <Clock size={12} />
                    Closes {new Date(form.closes_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <Tooltip label="Copy link">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        copyLink(form.slug);
                      }}
                      aria-label={`Copy submission link for ${form.title}`}
                      className="text-ink-400 hover:text-ink-900 transition-colors"
                    >
                      <Copy size={15} />
                    </button>
                  </Tooltip>
                  <StatusBadge status={form.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </DashboardLayout>
  );
}
