import type { Request, Response, NextFunction } from "express";
import { verifyFirebaseToken } from "../config/firebase.js";
import { supabase } from "../config/supabase.js";

/**
 * Verifies the Firebase ID token only, without requiring a matching `owners`
 * row. Used exclusively by POST /api/auth/bootstrap, since a brand-new
 * account is verified by Firebase before its `owners` row exists in Postgres.
 * Attaches the decoded Firebase claims to req.firebaseUser.
 */
export async function requireFirebaseAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing or malformed Authorization header" });
    }
    const idToken = header.slice("Bearer ".length);
    const decoded = await verifyFirebaseToken(idToken);
    req.firebaseUser = { uid: decoded.uid, email: decoded.email ?? "", name: decoded.name };
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

/**
 * Protects Workspace Owner routes.
 * Flow: client sends `Authorization: Bearer <firebase-id-token>` ->
 * verify with Firebase Admin -> look up the matching `owners` row by
 * firebase_uid -> attach to req.owner.
 *
 * Submitters NEVER hit this middleware — their routes are public by design.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing or malformed Authorization header" });
    }

    const idToken = header.slice("Bearer ".length);
    const decoded = await verifyFirebaseToken(idToken);

    const { data: owner, error } = await supabase
      .from("owners")
      .select("id, firebase_uid, email")
      .eq("firebase_uid", decoded.uid)
      .single();

    if (error || !owner) {
      // First-time login: Firebase verified identity, but no owners row yet.
      // Provisioning happens in a dedicated /auth/bootstrap route, not here,
      // so this middleware stays read-only and side-effect free.
      return res.status(403).json({
        error: "Account not provisioned. Call /api/auth/bootstrap first.",
      });
    }

    req.owner = { id: owner.id, firebaseUid: owner.firebase_uid, email: owner.email };
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
