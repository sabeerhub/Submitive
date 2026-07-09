import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from "react";
import clsx from "clsx";

export function Table({ className, children, ...props }: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto -mx-1">
      <table className={clsx("w-full text-sm border-collapse", className)} {...props}>
        {children}
      </table>
    </div>
  );
}

export function THead({ children }: { children: React.ReactNode }) {
  return <thead><tr className="text-left text-2xs text-ink-400 uppercase tracking-wider border-b border-slate-100">{children}</tr></thead>;
}

export function Th({ className, children, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={clsx("pb-3 px-3 font-medium first:pl-1", className)} {...props}>{children}</th>;
}

export function TBody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-slate-100">{children}</tbody>;
}

export function Tr({ className, children, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr className={clsx("transition-colors duration-fast ease-signature hover:bg-slate-50/80", className)} {...props}>
      {children}
    </tr>
  );
}

export function Td({ className, children, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={clsx("py-3.5 px-3 text-ink-700 first:pl-1", className)} {...props}>{children}</td>;
}
