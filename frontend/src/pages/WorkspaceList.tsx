import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Building2, Plus, ArrowRight } from "lucide-react";
import { Card } from "../components/ui/Card.js";
import { Logomark } from "../components/ui/Logomark.js";
import { useAuth } from "../contexts/AuthContext.js";
import { logout } from "../lib/auth.js";

export default function WorkspaceList() {
  const { owner, workspaces, setActiveWorkspaceId } = useAuth();
  const navigate = useNavigate();

  const enterWorkspace = (id: string) => {
    setActiveWorkspaceId(id);
    navigate("/dashboard");
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-lg"
      >
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2.5 font-semibold">
            <Logomark size={24} />
            Submitiv
          </div>
          <button onClick={handleLogout} className="text-sm text-ink-400 hover:text-ink-700 transition-colors">
            Log out
          </button>
        </div>

        <h1 className="font-display text-2xl text-ink-900">
          {owner?.full_name ? `Welcome back, ${owner.full_name.split(" ")[0]}` : "Choose a workspace"}
        </h1>
        <p className="text-ink-600 text-sm mt-1.5">Select a workspace to continue, or create a new one.</p>

        <div className="flex flex-col gap-3 mt-7">
          {workspaces.map((ws, i) => (
            <motion.div
              key={ws.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
            >
              <Card
                interactive
                onClick={() => enterWorkspace(ws.id)}
                className="flex items-center justify-between py-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-control bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
                    <Building2 size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-ink-900 truncate">{ws.name}</p>
                    <p className="text-xs text-ink-400 font-mono truncate">submitiv.app/s/…/{ws.slug}</p>
                  </div>
                </div>
                <ArrowRight size={16} className="text-ink-400 shrink-0" />
              </Card>
            </motion.div>
          ))}

          <button
            onClick={() => navigate("/onboarding")}
            className="flex items-center gap-3 py-4 px-6 rounded-card border border-dashed border-slate-200 text-ink-600 hover:border-slate-300 hover:text-ink-900 transition-colors text-left"
          >
            <div className="h-10 w-10 rounded-control bg-slate-50 flex items-center justify-center shrink-0">
              <Plus size={18} />
            </div>
            <span className="font-medium">Create a new workspace</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
