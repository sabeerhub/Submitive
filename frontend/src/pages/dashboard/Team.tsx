import { useEffect, useState } from "react";
import { UserPlus, Trash2, Users } from "lucide-react";
import { DashboardLayout } from "../../components/DashboardLayout.js";
import { Card } from "../../components/ui/Card.js";
import { Button } from "../../components/ui/Button.js";
import { TextField } from "../../components/ui/TextField.js";
import { Badge } from "../../components/ui/Badge.js";
import { SkeletonRows } from "../../components/ui/Skeleton.js";
import { EmptyState } from "../../components/EmptyState.js";
import { useAuth } from "../../contexts/AuthContext.js";
import { useToast } from "../../contexts/ToastContext.js";
import { api } from "../../lib/api.js";
import type { WorkspaceMember } from "../../types/domain.js";

export default function Team() {
  const { activeWorkspace, owner } = useAuth();
  const toast = useToast();
  const [members, setMembers] = useState<WorkspaceMember[] | null>(null);
  const [email, setEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const load = () => {
    if (!activeWorkspace) return;
    api.get<{ members: WorkspaceMember[] }>(`/workspaces/${activeWorkspace.id}/members`).then((res) => setMembers(res.members));
  };

  useEffect(load, [activeWorkspace]);

  const isOwnerRole = members?.find((m) => m.owner.id === owner?.id)?.role === "owner";

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkspace || !email) return;
    setInviting(true);
    setError(null);
    try {
      await api.post(`/workspaces/${activeWorkspace.id}/members`, { email });
      setEmail("");
      toast.show("Teammate added");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't send that invite.");
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (memberId: string) => {
    if (!activeWorkspace) return;
    setRemovingId(memberId);
    try {
      await api.delete(`/workspaces/${activeWorkspace.id}/members/${memberId}`);
      toast.show("Member removed");
      load();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Couldn't remove that member.", "error");
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <DashboardLayout title="Team">
      <div className="max-w-2xl mx-auto flex flex-col gap-6">
        {isOwnerRole && (
          <Card>
            <h2 className="font-semibold text-ink-900 mb-4">Invite a teammate</h2>
            <form onSubmit={handleInvite} className="flex items-end gap-3">
              <div className="flex-1">
                <TextField
                  label="Email address"
                  type="email"
                  placeholder="teammate@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={error ?? undefined}
                />
              </div>
              <Button type="submit" disabled={inviting || !email}>
                <UserPlus size={16} /> {inviting ? "Adding…" : "Invite"}
              </Button>
            </form>
            <p className="text-xs text-ink-400 mt-2">
              They need a Submitiv account already — ask them to sign up first if this doesn't work.
            </p>
          </Card>
        )}

        <Card>
          <h2 className="font-semibold text-ink-900 mb-4">Members</h2>
          {members === null ? (
            <SkeletonRows count={2} height="h-14" />
          ) : members.length === 0 ? (
            <EmptyState icon={<Users size={20} />} title="No members yet" description="Invite teammates to collaborate on this workspace." />
          ) : (
            <div className="divide-y divide-slate-100">
              {members.map((m) => (
                <div key={m.id} className="flex items-center justify-between py-3.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-full bg-primary-500 text-white text-sm font-semibold flex items-center justify-center shrink-0">
                      {(m.owner.full_name ?? m.owner.email).slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink-900 truncate">{m.owner.full_name ?? m.owner.email}</p>
                      <p className="text-xs text-ink-400 truncate">{m.owner.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge tone={m.role === "owner" ? "info" : "neutral"}>{m.role}</Badge>
                    {isOwnerRole && m.role !== "owner" && (
                      <button
                        onClick={() => handleRemove(m.id)}
                        disabled={removingId === m.id}
                        aria-label={`Remove ${m.owner.full_name ?? m.owner.email}`}
                        className="text-ink-400 hover:text-danger-500 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
