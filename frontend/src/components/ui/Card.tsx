import type { HTMLAttributes } from "react";
import clsx from "clsx";

type Elevation = "flat" | "sm" | "md" | "lg";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  elevation?: Elevation;
  interactive?: boolean;
}

const elevationStyles: Record<Elevation, string> = {
  flat: "shadow-none border border-slate-100",
  sm: "shadow-sm border border-slate-100",
  md: "shadow-md border border-slate-100",
  lg: "shadow-lg border border-slate-100",
};

export function Card({ elevation = "sm", interactive, className, children, ...props }: CardProps) {
  return (
    <div
      className={clsx(
        "bg-surface rounded-card p-6",
        elevationStyles[elevation],
        interactive && "transition-shadow duration-base ease-signature hover:shadow-md cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
