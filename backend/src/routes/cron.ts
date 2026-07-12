import { Router } from "express";
import { supabase } from "../config/supabase.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../middleware/errorHandler.js";
import { sendDeadlineReminder } from "../services/email.js";

export const cronRouter = Router();

/**
 * POST /api/cron/deadline-reminders?hours=24
 *
 * Not triggered by anything inside this app — Render's free tier has no
 * built-in scheduler. Point an external pinger (e.g. cron-job.org, free) at
 * this endpoint hourly, with header `x-cron-secret: <CRON_SECRET>` matching
 * the value set in this service's environment variables.
 *
 * Finds live forms closing within the given window that haven't already
 * been reminded about (reminder_sent_at is null), emails the workspace
 * owner once, and marks reminder_sent_at so it's never sent twice.
 */
cronRouter.post(
  "/deadline-reminders",
  asyncHandler(async (req, res) => {
    const secret = process.env.CRON_SECRET;
    if (!secret || req.headers["x-cron-secret"] !== secret) {
      throw new AppError("Unauthorized", 401);
    }

    const hours = Math.min(Math.max(Number(req.query.hours ?? 24), 1), 168);
    const windowEnd = new Date(Date.now() + hours * 60 * 60 * 1000);

    const { data: forms, error } = await supabase
      .from("forms")
      .select("id, title, closes_at, workspace:workspaces(name, owner:owners(email))")
      .eq("status", "live")
      .is("reminder_sent_at", null)
      .lte("closes_at", windowEnd.toISOString())
      .gte("closes_at", new Date().toISOString());
    if (error) throw new AppError(error.message, 500);

    let sent = 0;
    for (const form of forms ?? []) {
      const ownerEmail = (form as any).workspace?.owner?.email;
      if (ownerEmail) {
        try {
          await sendDeadlineReminder({ to: ownerEmail, formTitle: form.title, closesAt: form.closes_at });
          sent++;
        } catch (err) {
          console.error(`[cron] reminder email failed for form ${form.id}:`, err);
          continue; // don't mark reminder_sent_at if the email actually failed
        }
      }
      await supabase.from("forms").update({ reminder_sent_at: new Date().toISOString() }).eq("id", form.id);
    }

    res.json({ checked: forms?.length ?? 0, sent });
  })
);
