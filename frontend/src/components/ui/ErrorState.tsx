import { AlertTriangle } from "lucide-react";
import type { ReactNode } from "react";
import { motion } from "framer-motion";

export function ErrorState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center text-center py-16 px-6"
    >
      <div className="h-12 w-12 rounded-full bg-danger-50 text-danger-500 flex items-center justify-center mb-4">
        <AlertTriangle size={20} />
      </div>
      <h3 className="font-semibold text-ink-900">{title}</h3>
      {description && <p className="text-sm text-ink-600 mt-1.5 max-w-sm">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </motion.div>
  );
}
