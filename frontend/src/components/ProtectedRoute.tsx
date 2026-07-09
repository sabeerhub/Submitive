import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../contexts/AuthContext.js";

export function ProtectedRoute({ children, requireWorkspace = true }: { children: ReactNode; requireWorkspace?: boolean }) {
  const { firebaseUser, workspaces, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="h-8 w-8 rounded-full border-2 border-slate-200 border-t-primary-500 animate-spin" />
      </div>
    );
  }

  if (!firebaseUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireWorkspace && workspaces.length === 0) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
