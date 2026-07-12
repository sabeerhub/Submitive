import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { FileStack, Clock, PlusCircle, HardDrive, Inbox, Sparkles } from "lucide-react";
import { DashboardLayout } from "../components/DashboardLayout.js";
import { Card } from "../components/ui/Card.js";
import { Button } from "../components/ui/Button.js";
import { EmptyState } from "../components/EmptyState.js";
import { Skeleton, SkeletonRows } from "../components/ui/Skeleton.js";
import { StatusBadge } from "../components/ui/Badge.js";
import { useAuth } from "../contexts/AuthContext.js";
import { api } from "../lib/api.js";
import type { FormSummary } from "../types/domain.js";

interface Analytics {
  daily: { date: string; count: number }[];
  total_submissions: number;
  total_forms: number;
  live_forms: number;
}

const statCards = [
  { key: "total_submissions" as const, label: "Total Submissions", icon: Inbox },
  { key: "live_forms" as const, label: "Active Forms", icon: Sparkles },
];

export default function Dashboard() {
  const { activeWorkspace } = useAuth();
  const workspace = activeWorkspace;
  const [forms, setForms] = useState<FormSummary[] | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);

  useEffect(() => {
    if (!workspace) return;
    api
      .get<{ forms: FormSummary[] }>(`/forms/manage?workspace_id=${workspace.id}`)
      .then((res) => setForms(res.forms))
      .catch(() => setForms([]));
    api
      .get<Analytics>(`/workspaces/${workspace.id}/analytics?days=30`)
      .then(setAnalytics)
      .catch(() => setAnalytics({ daily: [], total_submissions: 0, total_forms: 0, live_forms: 0 }));
  }, [workspace]);

  const storageLimitGb = (workspace?.storage_limit_bytes ?? 5368709120) / 1024 / 1024 / 1024;
  const storageUsedGb = (workspace?.storage_used_bytes ?? 0) / 1024 / 1024 / 1024;
  const storagePct = Math.min(100, (storageUsedGb / storageLimitGb) * 100);

  return (
    <DashboardLayout title="Overview">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
        {statCards.map(({ key, label, icon: Icon }, i) => (
          <motion.div key={key} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.05 }}>
            <Card>
              <p className="text-sm text-ink-600 flex items-center gap-1.5"><Icon size={14} className="text-ink-400" /> {label}</p>
              {analytics ? (
                <p className="text-3xl font-semibold text-ink-900 mt-2 font-display">{analytics[key]}</p>
              ) : (
                <Skeleton className="h-9 w-16 mt-2" />
              )}
            </Card>
          </motion.div>
        ))}
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
          <Card>
            <p className="text-sm text-ink-600 flex items-center gap-1.5"><HardDrive size={14} className="text-ink-400" /> Storage</p>
            <p className="text-3xl font-semibold text-ink-900 mt-2 font-display">
              {storageUsedGb.toFixed(2)} <span className="text-base font-medium text-ink-400">/ {storageLimitGb.toFixed(0)} GB</span>
            </p>
            <div className="h-1.5 bg-slate-100 rounded-full mt-3 overflow-hidden">
              <motion.div
                className="h-full bg-primary-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${storagePct}%` }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
          </Card>
        </motion.div>
      </div>

      <Card className="mb-6">
        <h2 className="font-semibold text-ink-900 mb-4">Submissions over the last 30 days</h2>
        {analytics ? (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={analytics.daily}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "#94A3B8" }}
                tickFormatter={(d) => new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                interval="preserveStartEnd"
                axisLine={{ stroke: "#F1F5F9" }}
              />
              <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} allowDecimals={false} axisLine={false} tickLine={false} />
              <Tooltip
                labelFormatter={(d) => new Date(d as string).toLocaleDateString()}
                contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 13 }}
              />
              <Line type="monotone" dataKey="count" stroke="#0EA5E9" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <Skeleton className="h-[220px]" />
        )}
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-ink-900">Your submission forms</h2>
          {forms && forms.length > 0 && (
            <Link to="/dashboard/forms" className="text-sm text-primary-600 hover:underline">View all</Link>
          )}
        </div>

        {forms === null ? (
          <SkeletonRows count={3} />
        ) : forms.length === 0 ? (
          <EmptyState
            icon={<FileStack size={20} />}
            title="No submission forms yet"
            description="Create your first form to get a shareable link, a countdown deadline, and a dashboard of everything that comes in."
            action={
              <Link to="/forms/new">
                <Button><PlusCircle size={16} /> Create your first submission</Button>
              </Link>
            }
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {forms.slice(0, 5).map((form) => (
              <Link
                key={form.id}
                to={`/dashboard/forms/${form.id}`}
                className="flex items-center justify-between py-3.5 -mx-6 px-6 hover:bg-slate-50 transition-colors duration-fast"
              >
                <div>
                  <p className="font-medium text-ink-900">{form.title}</p>
                  <p className="text-xs text-ink-400 flex items-center gap-1.5 mt-1">
                    <Clock size={12} />
                    Closes {new Date(form.closes_at).toLocaleString()}
                  </p>
                </div>
                <StatusBadge status={form.status} />
              </Link>
            ))}
          </div>
        )}
      </Card>
    </DashboardLayout>
  );
}
