import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import clsx from "clsx";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantStyles: Record<Variant, string> = {
  primary: "bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700 shadow-sm",
  secondary: "bg-primary-50 text-primary-700 hover:bg-primary-100",
  outline: "bg-white border border-slate-200 text-ink-900 hover:border-slate-300 hover:bg-slate-50",
  ghost: "bg-transparent text-ink-600 hover:bg-slate-100",
  danger: "bg-danger-500 text-white hover:bg-danger-600",
};

const sizeStyles: Record<Size, string> = {
  sm: "text-sm px-3 py-1.5 rounded-lg gap-1.5",
  md: "text-sm px-4 py-2.5 rounded-control gap-2",
  lg: "text-[15px] px-6 py-3.5 rounded-control gap-2",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={clsx(
          "inline-flex items-center justify-center font-semibold",
          "transition-all duration-fast ease-signature",
          "active:scale-[0.98]",
          "focus-visible:outline-none focus-visible:shadow-focus-ring",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
