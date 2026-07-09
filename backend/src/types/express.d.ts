import "express";

declare global {
  namespace Express {
    interface Request {
      /** Set by requireAuth middleware after verifying the Firebase ID token
       *  and resolving it to an `owners` row. Absent on submitter-facing routes. */
      owner?: {
        id: string; // owners.id (Postgres uuid)
        firebaseUid: string;
        email: string;
      };
      /** Set by requireFirebaseAuth — decoded Firebase claims, pre-provisioning. */
      firebaseUser?: {
        uid: string;
        email: string;
        name?: string;
      };
    }
  }
}
