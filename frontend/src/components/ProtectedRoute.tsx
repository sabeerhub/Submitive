import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../contexts/AuthContext.js";
import { Skeleton } from "./ui/Skeleton.js";

export function ProtectedRoute({ children, requireWorkspace = true }: { children: ReactNode; requireWorkspace?: boolean }) {
  const { firebaseUser, workspaces, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-paper flex">
        <div className="hidden lg:flex w-64 shrink-0 border-r border-slate-200/70 bg-white flex-col p-4 gap-2">
          <Skeleton className="h-8 w-28 mb-4" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
        <div className="flex-1 p-4 sm:p-8">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
          <Skeleton className="h-56 mt-5" />
        </div>
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
