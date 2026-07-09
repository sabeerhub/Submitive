import type { ReactNode } from "react";

export function Tooltip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span className="relative inline-flex group">
      <span tabIndex={0} className="focus:outline-none">{children}</span>
      <span
        role="tooltip"
        className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap
                   bg-panel-900 text-white text-xs px-2.5 py-1.5 rounded-md opacity-0 scale-95
                   group-hover:opacity-100 group-hover:scale-100 group-focus-within:opacity-100 group-focus-within:scale-100
                   transition-all duration-fast ease-signature z-20"
      >
        {label}
      </span>
    </span>
  );
}
