/** Maps Firebase Auth error codes to friendly, user-facing copy. */
export function mapAuthError(err: unknown): string {
  const code = (err as { code?: string })?.code ?? "";
  if (code.includes("wrong-password") || code.includes("invalid-credential")) return "Incorrect email or password.";
  if (code.includes("user-not-found")) return "No account found with that email.";
  if (code.includes("email-already-in-use")) return "An account with this email already exists.";
  if (code.includes("weak-password")) return "Please choose a stronger password.";
  if (code.includes("too-many-requests")) return "Too many attempts. Please wait and try again.";
  if (code.includes("popup-closed-by-user")) return "Sign-in was cancelled.";
  if (code.includes("network-request-failed")) return "Network error. Check your connection and try again.";
  return "Something went wrong. Please try again.";
}
