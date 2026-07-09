import { initializeApp, cert, getApps, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

/**
 * Firebase is used STRICTLY for identity verification.
 * No application data (workspaces, submissions, files) is ever stored here —
 * that all lives in Supabase Postgres. This file's only job is to verify
 * ID tokens sent by Workspace Owners and hand back a Firebase UID.
 */

let app: App;

function getFirebaseApp(): App {
  if (getApps().length === 0) {
    app = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Private keys stored in env vars often have literal "\n" — restore real newlines.
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });
  } else {
    app = getApps()[0]!;
  }
  return app;
}

export async function verifyFirebaseToken(idToken: string) {
  const auth = getAuth(getFirebaseApp());
  // Throws if invalid/expired — caller (auth middleware) converts to 401.
  return auth.verifyIdToken(idToken, /* checkRevoked */ true);
}
