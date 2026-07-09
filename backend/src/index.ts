import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { apiLimiter } from "./middleware/rateLimiter.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { authRouter } from "./routes/auth.js";
import { workspacesRouter } from "./routes/workspaces.js";
import { formsRouter } from "./routes/forms.js";
import { submissionsRouter } from "./routes/submissions.js";

const app = express();

// Trust the first hop reverse proxy (Render/Vercel/etc). Without this,
// req.ip resolves to the proxy's address for every request — breaking
// per-submitter rate limiting, IP-based dedupe context, and audit logging,
// since every request would appear to come from the same "client".
app.set("trust proxy", 1);

// ---- Security middleware (PRD "Security" section) ----
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" })); // small body limit; file bytes never pass through JSON body
app.use(apiLimiter);

// Force HTTPS in production (behind a proxy that terminates TLS, e.g. Render/Vercel).
app.use((req, res, next) => {
  if (process.env.NODE_ENV === "production" && req.headers["x-forwarded-proto"] !== "https") {
    return res.redirect(`https://${req.headers.host}${req.url}`);
  }
  next();
});

app.get("/health", (_req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));

app.use("/api/auth", authRouter);
app.use("/api/workspaces", workspacesRouter);
app.use("/api/forms", formsRouter);
app.use("/api/submissions", submissionsRouter);

// 404 for unmatched API routes
app.use("/api", (_req, res) => res.status(404).json({ error: "Not found" }));

app.use(errorHandler);

// Last-resort safety nets — log and keep the process alive rather than
// crashing the whole API on one bad promise chain or stray exception.
process.on("unhandledRejection", (reason) => {
  console.error("[unhandledRejection]", reason);
});
process.on("uncaughtException", (err) => {
  console.error("[uncaughtException]", err);
});

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => {
  console.log(`Submitiv API listening on port ${port}`);
});
