import { useState } from "react";
import { GripVertical, Trash2, Asterisk, ChevronUp, ChevronDown } from "lucide-react";
import { FIELD_TYPE_META } from "./fieldTypes.js";
import type { WorkingField } from "./types.js";

export function DraggableFieldList({
  fields,
  selectedId,
  onSelect,
  onReorder,
  onRemove,
}: {
  fields: WorkingField[];
  selectedId: string | null;
  onSelect: (clientId: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onRemove: (clientId: string) => void;
}) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  if (fields.length === 0) {
    return (
      <div className="rounded-card border border-dashed border-slate-200 py-16 text-center text-sm text-ink-400">
        Add fields from the left to start building your form.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {fields.map((field, index) => {
        const meta = FIELD_TYPE_META[field.field_type];
        const Icon = meta.icon;
        const isSelected = field.clientId === selectedId;
        const isDropTarget = overIndex === index && dragIndex !== null && dragIndex !== index;

        return (
          <div
            key={field.clientId}
            draggable
            onDragStart={() => setDragIndex(index)}
            onDragOver={(e) => {
              e.preventDefault();
              setOverIndex(index);
            }}
            onDragEnd={() => {
              if (dragIndex !== null && overIndex !== null && dragIndex !== overIndex) {
                onReorder(dragIndex, overIndex);
              }
              setDragIndex(null);
              setOverIndex(null);
            }}
            onClick={() => onSelect(field.clientId)}
            className={`group flex items-center gap-3 px-3.5 py-3 rounded-control border cursor-pointer transition-colors duration-fast ${
              isSelected ? "border-primary-500 bg-primary-50/50" : "border-slate-200 bg-white hover:border-slate-300"
            } ${isDropTarget ? "border-t-2 border-t-primary-500" : ""}`}
          >
            <GripVertical size={15} className="text-ink-400 shrink-0 cursor-grab active:cursor-grabbing" aria-hidden="true" />
            <Icon size={16} className="text-primary-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-ink-900 truncate">
                {field.label}
                {field.is_required && <Asterisk size={10} className="inline text-danger-500 ml-1" aria-label="required" />}
              </p>
              <p className="text-xs text-ink-400">{meta.label}</p>
            </div>

            {/* Keyboard-accessible reorder fallback — native HTML5 drag-and-drop
                above has no keyboard equivalent, so these buttons are the only
                way to reorder fields without a mouse. */}
            <div className="flex flex-col opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (index > 0) onReorder(index, index - 1);
                }}
                disabled={index === 0}
                aria-label={`Move ${field.label} up`}
                className="text-ink-400 hover:text-ink-900 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronUp size={14} />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (index < fields.length - 1) onReorder(index, index + 1);
                }}
                disabled={index === fields.length - 1}
                aria-label={`Move ${field.label} down`}
                className="text-ink-400 hover:text-ink-900 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronDown size={14} />
              </button>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(field.clientId);
              }}
              aria-label={`Remove ${field.label} field`}
              className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 text-ink-400 hover:text-danger-500 transition-opacity"
            >
              <Trash2 size={15} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
