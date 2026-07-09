import { useRef, useState } from "react";
import { UploadCloud, FileText, X } from "lucide-react";

export function FileDropzone({
  file,
  onChange,
  accept,
  maxSizeMb,
}: {
  file: File | null;
  onChange: (file: File | null) => void;
  accept: string[];
  maxSizeMb: number;
  error?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const acceptAttr = accept.map((t) => `.${t}`).join(",");

  const handleFile = (f: File | undefined) => {
    if (!f) return;
    onChange(f);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Upload file, ${accept.map((t) => `.${t}`).join(", ")}, up to ${maxSizeMb} megabytes`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        handleFile(e.dataTransfer.files[0]);
      }}
      onClick={() => inputRef.current?.click()}
      className={`rounded-control border-2 border-dashed px-4 py-6 text-center cursor-pointer transition-colors duration-fast ${
        dragOver ? "border-primary-500 bg-primary-50" : "border-slate-200 hover:border-slate-300"
      } focus-visible:outline-none focus-visible:shadow-focus-ring`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={acceptAttr}
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      {file ? (
        <div className="flex items-center justify-between bg-white rounded-control px-3 py-2 border border-slate-200">
          <div className="flex items-center gap-2 min-w-0">
            <FileText size={16} className="text-primary-600 shrink-0" />
            <span className="text-sm text-ink-900 truncate">{file.name}</span>
            <span className="text-xs text-ink-400 shrink-0">{(file.size / 1024 / 1024).toFixed(1)}MB</span>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange(null);
            }}
            aria-label={`Remove ${file.name}`}
            className="text-ink-400 hover:text-danger-500 shrink-0"
          >
            <X size={15} />
          </button>
        </div>
      ) : (
        <>
          <UploadCloud size={20} className="mx-auto text-ink-400 mb-2" />
          <p className="text-sm text-ink-600">
            Drag & drop files here, or <span className="text-primary-600 font-medium">browse</span>
          </p>
          <p className="text-xs text-ink-400 mt-1">
            {accept.map((t) => `.${t}`).join(", ")} up to {maxSizeMb}MB
          </p>
        </>
      )}
    </div>
  );
}
