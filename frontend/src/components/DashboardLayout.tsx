import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { NavLink, Link, useNavigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { LayoutGrid, FileStack, LayoutTemplate, Users, Settings, LogOut, Plus, Menu, X } from "lucide-react";
import { useAuth } from "../contexts/AuthContext.js";
import { logout } from "../lib/auth.js";
import { Button } from "./ui/Button.js";
import { Logomark } from "./ui/Logomark.js";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Overview", icon: LayoutGrid, end: true },
  { to: "/dashboard/forms", label: "Submissions", icon: FileStack },
  { to: "/dashboard/templates", label: "Templates", icon: LayoutTemplate },
  { to: "/dashboard/team", label: "Team", icon: Users },
  { to: "/dashboard/settings", label: "Settings", icon: Settings },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { owner, activeWorkspace } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const workspace = activeWorkspace;

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <>
      <div className="px-6 py-6 flex items-center gap-2.5 font-semibold">
        <Logomark size={24} />
        Submitiv
      </div>

      <div className="px-4">
        <Link
          to="/workspaces"
          className="block rounded-control bg-slate-50 hover:bg-slate-100 px-3.5 py-2.5 mb-5 transition-colors duration-fast"
        >
          <p className="text-2xs text-ink-400 uppercase tracking-wide flex items-center justify-between">
            Workspace <span className="normal-case font-medium text-primary-600">Switch</span>
          </p>
          <p className="text-sm font-medium text-ink-900 truncate mt-0.5">{workspace?.name ?? "—"}</p>
        </Link>
      </div>

      <nav aria-label="Primary" className="flex-1 px-3 flex flex-col gap-0.5">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => {
          const isActive = end ? location.pathname === to : location.pathname.startsWith(to);
          return (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onNavigate}
              className="relative flex items-center gap-2.5 px-3 py-2 rounded-control text-sm font-medium transition-colors duration-fast"
            >
              {isActive && (
                <motion.span
                  layoutId="nav-active"
                  className="absolute inset-0 bg-primary-50 rounded-control"
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                />
              )}
              <span className={`relative flex items-center gap-2.5 ${isActive ? "text-primary-700" : "text-ink-600"}`}>
                <Icon size={17} />
                {label}
              </span>
            </NavLink>
          );
        })}
      </nav>

      <div className="px-3 pb-5">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-control hover:bg-slate-50 transition-colors duration-fast text-left"
        >
          <div className="h-7 w-7 rounded-full bg-primary-500 text-white text-xs font-semibold flex items-center justify-center shrink-0">
            {(owner?.full_name ?? owner?.email ?? "?").slice(0, 1).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-ink-900 truncate">{owner?.full_name ?? owner?.email}</p>
          </div>
          <LogOut size={15} className="text-ink-400 shrink-0" />
        </button>
      </div>
    </>
  );
}

export function DashboardLayout({ children, title, action }: { children: ReactNode; title: string; action?: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Close the off-canvas nav automatically on route change and lock scroll
  // while it's open, same pattern as the Modal primitive.
  useEffect(() => setMobileNavOpen(false), [location.pathname]);
  useEffect(() => {
    document.body.style.overflow = mobileNavOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileNavOpen]);

  return (
    <div className="min-h-screen bg-paper flex">
      <a
        href="#dashboard-main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[200] focus:bg-primary-500 focus:text-white focus:px-4 focus:py-2 focus:rounded-control"
      >
        Skip to content
      </a>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 border-r border-slate-200/70 bg-white flex-col h-screen sticky top-0">
        <SidebarContent />
      </aside>

      {/* Mobile off-canvas sidebar */}
      <AnimatePresence>
        {mobileNavOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-0 bg-panel-900/40 z-40 lg:hidden"
              onClick={() => setMobileNavOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-y-0 left-0 w-72 bg-white z-50 flex flex-col lg:hidden"
            >
              <button
                onClick={() => setMobileNavOpen(false)}
                aria-label="Close navigation"
                className="absolute top-5 right-4 text-ink-400 hover:text-ink-900"
              >
                <X size={18} />
              </button>
              <SidebarContent onNavigate={() => setMobileNavOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 min-w-0">
        <header className="flex items-center justify-between gap-3 px-4 sm:px-8 py-4 sm:py-6 border-b border-slate-200/70 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open navigation"
              className="lg:hidden text-ink-600 hover:text-ink-900 shrink-0"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-lg sm:text-xl font-semibold text-ink-900 font-display truncate">{title}</h1>
          </div>
          <div className="shrink-0">
            {action ?? (
              <Button size="md" onClick={() => navigate("/forms/new")}>
                <Plus size={16} /> <span className="hidden sm:inline">New Submission</span>
              </Button>
            )}
          </div>
        </header>
        <motion.main
          id="dashboard-main"
          key={location.pathname}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="px-4 sm:px-8 py-6 sm:py-8"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}
