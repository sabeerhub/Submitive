import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL ?? "noreply@submitiv.app";

function wrapper(bodyHtml: string) {
  return `
  <div style="font-family:Inter,Arial,sans-serif;background:#F8FAFC;padding:32px">
    <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;padding:32px;border:1px solid #E2E8F0">
      <p style="font-weight:700;font-size:16px;color:#0F172A;margin:0 0 20px">Submitiv</p>
      ${bodyHtml}
      <p style="color:#94A3B8;font-size:12px;margin-top:28px">Sent by Submitiv — Create. Share. Collect. Close.</p>
    </div>
  </div>`;
}

export async function sendSubmissionConfirmation(params: {
  to: string;
  formTitle: string;
  referenceNumber: string;
  submittedAt: string;
}) {
  if (!process.env.RESEND_API_KEY) return; // no-op in environments without email configured
  await resend.emails.send({
    from: FROM,
    to: params.to,
    subject: `Received: ${params.formTitle}`,
    html: wrapper(`
      <h2 style="font-size:18px;color:#0F172A;margin:0 0 12px">Submission received</h2>
      <p style="color:#475569;font-size:14px;line-height:1.6">
        Your submission for <strong>${escapeHtml(params.formTitle)}</strong> has been received and timestamped.
      </p>
      <div style="background:#F8FAFC;border-radius:10px;padding:14px 16px;margin-top:16px">
        <p style="margin:0;font-size:12px;color:#94A3B8">Reference number</p>
        <p style="margin:2px 0 0;font-family:monospace;font-size:14px;color:#0F172A">${params.referenceNumber}</p>
      </div>
      <p style="color:#94A3B8;font-size:12px;margin-top:14px">Submitted ${new Date(params.submittedAt).toLocaleString()}</p>
    `),
  });
}

export async function sendOwnerNewSubmissionNotice(params: {
  to: string;
  formTitle: string;
  referenceNumber: string;
  dashboardUrl: string;
}) {
  if (!process.env.RESEND_API_KEY) return;
  await resend.emails.send({
    from: FROM,
    to: params.to,
    subject: `New submission: ${params.formTitle}`,
    html: wrapper(`
      <h2 style="font-size:18px;color:#0F172A;margin:0 0 12px">New submission received</h2>
      <p style="color:#475569;font-size:14px;line-height:1.6">
        <strong>${escapeHtml(params.formTitle)}</strong> just received a new submission (${params.referenceNumber}).
      </p>
      <a href="${params.dashboardUrl}" style="display:inline-block;margin-top:16px;background:#0EA5E9;color:#fff;text-decoration:none;padding:10px 18px;border-radius:10px;font-size:14px;font-weight:600">
        View in dashboard
      </a>
    `),
  });
}

export async function sendDeadlineReminder(params: { to: string; formTitle: string; closesAt: string }) {
  if (!process.env.RESEND_API_KEY) return;
  await resend.emails.send({
    from: FROM,
    to: params.to,
    subject: `Closing soon: ${params.formTitle}`,
    html: wrapper(`
      <h2 style="font-size:18px;color:#0F172A;margin:0 0 12px">Deadline approaching</h2>
      <p style="color:#475569;font-size:14px;line-height:1.6">
        <strong>${escapeHtml(params.formTitle)}</strong> closes at ${new Date(params.closesAt).toLocaleString()}.
      </p>
    `),
  });
}

function escapeHtml(input: string) {
  return input.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
