import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export class AppError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(422).json({
      error: "Validation failed",
      details: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    });
  }

  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      // 5xx AppErrors are almost always a wrapped Postgres/Supabase error
      // message — never forward that verbatim to the client (it can leak
      // column/constraint names and internal structure). Log the real
      // message server-side and return a generic one instead.
      console.error(`[server-error] ${req.method} ${req.path}:`, err.message);
      return res.status(err.statusCode).json({ error: "Something went wrong. Please try again." });
    }
    return res.status(err.statusCode).json({ error: err.message });
  }

  // Unknown error — never leak internals to the client.
  console.error(`[unhandled] ${req.method} ${req.path}:`, err);
  return res.status(500).json({ error: "Internal server error" });
}
