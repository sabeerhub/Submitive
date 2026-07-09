import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { ReactNode } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "../lib/firebase.js";
import { api } from "../lib/api.js";
import type { Owner, Workspace } from "../types/domain.js";

interface AuthContextValue {
  firebaseUser: User | null;
  owner: Owner | null;
  workspaces: Workspace[];
  loading: boolean;
  refreshOwner: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [owner, setOwner] = useState<Owner | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshOwner = useCallback(async () => {
    if (!auth.currentUser) {
      setOwner(null);
      setWorkspaces([]);
      return;
    }
    try {
      // Idempotent — safe to call every session; only inserts on first login.
      await api.post("/auth/bootstrap", {});
      const { owner, workspaces } = await api.get<{ owner: Owner; workspaces: Workspace[] }>("/auth/me");
      setOwner(owner);
      setWorkspaces(workspaces);
    } catch {
      setOwner(null);
      setWorkspaces([]);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        await refreshOwner();
      } else {
        setOwner(null);
        setWorkspaces([]);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [refreshOwner]);

  return (
    <AuthContext.Provider value={{ firebaseUser, owner, workspaces, loading, refreshOwner }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
