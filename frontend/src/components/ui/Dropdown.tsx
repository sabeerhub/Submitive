import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";

interface MenuItemProps {
  onSelect: () => void;
  children: ReactNode;
  danger?: boolean;
}

export function Dropdown({ trigger, children, align = "right" }: { trigger: ReactNode; children: ReactNode; align?: "left" | "right" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div className="relative inline-block" ref={ref}>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-haspopup="menu" aria-expanded={open}>
        {trigger}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            role="menu"
            className={clsx(
              "absolute z-30 mt-2 min-w-[180px] bg-white rounded-control border border-slate-100 shadow-md py-1.5",
              align === "right" ? "right-0" : "left-0"
            )}
            onClick={() => setOpen(false)}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function MenuItem({ onSelect, children, danger }: MenuItemProps) {
  return (
    <button
      role="menuitem"
      onClick={onSelect}
      className={clsx(
        "w-full text-left px-3.5 py-2 text-sm transition-colors duration-fast",
        danger ? "text-danger-500 hover:bg-danger-50" : "text-ink-700 hover:bg-slate-50"
      )}
    >
      {children}
    </button>
  );
}
