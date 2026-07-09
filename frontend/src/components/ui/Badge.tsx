import clsx from "clsx";

type Tone = "neutral" | "success" | "danger" | "warning" | "info";

const toneStyles: Record<Tone, string> = {
  neutral: "bg-slate-100 text-ink-600",
  success: "bg-success-50 text-success-600",
  danger: "bg-danger-50 text-danger-600",
  warning: "bg-warning-50 text-warning-600",
  info: "bg-primary-50 text-primary-700",
};

export function Badge({ tone = "neutral", children, className }: { tone?: Tone; children: React.ReactNode; className?: string }) {
  return (
    <span className={clsx("inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full capitalize", toneStyles[tone], className)}>
      {children}
    </span>
  );
}

const FORM_STATUS_TONE: Record<string, Tone> = {
  draft: "neutral",
  live: "success",
  closed: "danger",
  archived: "neutral",
};

/** Status badge specialized for form/submission lifecycle states. */
export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={FORM_STATUS_TONE[status] ?? "neutral"}>{status}</Badge>;
}
