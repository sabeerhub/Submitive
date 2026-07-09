import { FIELD_PALETTE_ORDER, FIELD_TYPE_META } from "./fieldTypes.js";
import type { FieldType } from "../../types/domain.js";

export function FieldPalette({ onAdd }: { onAdd: (type: FieldType) => void }) {
  return (
    <div className="flex flex-col gap-1">
      {FIELD_PALETTE_ORDER.map((type) => {
        const meta = FIELD_TYPE_META[type];
        const Icon = meta.icon;
        return (
          <button
            key={type}
            type="button"
            onClick={() => onAdd(type)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-control text-sm text-ink-600 hover:bg-slate-50 hover:text-ink-900 text-left transition-colors"
          >
            <Icon size={16} />
            {meta.label}
          </button>
        );
      })}
    </div>
  );
}
