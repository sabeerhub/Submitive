import { FIELD_TYPE_META } from "./fieldTypes.js";
import { TextField } from "../ui/TextField.js";
import type { WorkingField } from "./types.js";

export function FieldSettingsPanel({
  field,
  onChange,
}: {
  field: WorkingField | null;
  onChange: (patch: Partial<WorkingField>) => void;
}) {
  if (!field) {
    return (
      <div className="rounded-card border border-dashed border-slate-200 p-6 text-center text-sm text-ink-400">
        Select a field to edit its settings.
      </div>
    );
  }

  const meta = FIELD_TYPE_META[field.field_type];

  return (
    <div className="flex flex-col gap-4">
      <p className="text-2xs font-medium text-ink-400 uppercase tracking-wider">{meta.label}</p>

      <TextField label="Field Label" value={field.label} onChange={(e) => onChange({ label: e.target.value })} />
      <TextField
        label="Placeholder"
        value={field.placeholder ?? ""}
        onChange={(e) => onChange({ placeholder: e.target.value })}
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-ink-900">Description (optional)</label>
        <textarea
          rows={2}
          className="rounded-control border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
          value={field.description ?? ""}
          onChange={(e) => onChange({ description: e.target.value })}
        />
      </div>

      {meta.hasOptions && (
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-ink-900">Options (one per line)</label>
          <textarea
            rows={4}
            className="rounded-control border border-slate-200 px-3.5 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
            value={(field.options ?? []).join("\n")}
            onChange={(e) => onChange({ options: e.target.value.split("\n").map((o) => o.trim()).filter(Boolean) })}
          />
        </div>
      )}

      <label className="flex items-center gap-2.5 text-sm text-ink-900 cursor-pointer">
        <input
          type="checkbox"
          checked={field.is_required}
          onChange={(e) => onChange({ is_required: e.target.checked })}
          className="h-4 w-4 rounded border-slate-300 text-primary-500 focus:ring-primary-500/30"
        />
        Required field
      </label>
    </div>
  );
}
