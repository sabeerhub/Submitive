import type { ReactNode } from "react";
import { motion } from "framer-motion";

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center justify-center text-center py-20 px-6 rounded-card border border-dashed border-slate-200"
    >
      <div className="h-12 w-12 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="font-semibold text-ink-900">{title}</h3>
      <p className="text-sm text-ink-600 mt-1.5 max-w-sm">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </motion.div>
  );
}
