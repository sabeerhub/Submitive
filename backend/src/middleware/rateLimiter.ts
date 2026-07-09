import rateLimit from "express-rate-limit";

/** General API rate limit — protects authenticated owner routes. */
export const apiLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 15 * 60 * 1000),
  max: Number(process.env.RATE_LIMIT_MAX ?? 600),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again later." },
});

/** Tighter limit on the public submission endpoint to deter form-spam/abuse,
 *  since these routes require no authentication at all. */
export const submissionLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many submission attempts. Please slow down." },
});
