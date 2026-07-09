import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";
import clsx from "clsx";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const TextField = forwardRef<HTMLInputElement, FieldProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const fieldId = id ?? props.name;
    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={fieldId} className="text-sm font-medium text-ink-900">
          {label}
        </label>
        <input
          ref={ref}
          id={fieldId}
          className={clsx(
            "rounded-control border px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 bg-white",
            "transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500",
            error ? "border-danger-500" : "border-slate-200",
            className
          )}
          aria-invalid={!!error}
          aria-describedby={error ? `${fieldId}-error` : undefined}
          {...props}
        />
        {error && (
          <p id={`${fieldId}-error`} className="text-xs text-danger-500">
            {error}
          </p>
        )}
      </div>
    );
  }
);
TextField.displayName = "TextField";
