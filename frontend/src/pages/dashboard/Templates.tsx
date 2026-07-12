import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LayoutTemplate, Copy } from "lucide-react";
import { DashboardLayout } from "../../components/DashboardLayout.js";
import { Card } from "../../components/ui/Card.js";
import { Button } from "../../components/ui/Button.js";
import { SkeletonRows } from "../../components/ui/Skeleton.js";
import { EmptyState } from "../../components/EmptyState.js";
import { useAuth } from "../../contexts/AuthContext.js";
import { api } from "../../lib/api.js";
import type { FormSummary } from "../../types/domain.js";

export default function Templates() {
  const { activeWorkspace } = useAuth();
  const navigate = useNavigate();
  const [forms, setForms] = useState<FormSummary[] | null>(null);

  useEffect(() => {
    if (!activeWorkspace) return;
    api.get<{ forms: FormSummary[] }>(`/forms/manage?workspace_id=${activeWorkspace.id}`).then((res) => setForms(res.forms));
  }, [activeWorkspace]);

  return (
    <DashboardLayout title="Templates" action={<span />}>
      <div className="max-w-2xl mx-auto">
        <p className="text-sm text-ink-600 mb-6">
          Start a new submission from one of your existing forms — its fields and settings will be copied over as a starting point.
        </p>

        <Card>
          {forms === null ? (
            <SkeletonRows count={3} height="h-14" />
          ) : forms.length === 0 ? (
            <EmptyState
              icon={<LayoutTemplate size={20} />}
              title="No forms to use as a template yet"
              description="Once you've created a submission form, you can reuse it here as the starting point for a new one."
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {forms.map((form) => (
                <div key={form.id} className="flex items-center justify-between py-3.5">
                  <p className="font-medium text-ink-900">{form.title}</p>
                  <Button variant="outline" size="sm" onClick={() => navigate(`/forms/new?template=${form.id}`)}>
                    <Copy size={14} /> Use as template
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
