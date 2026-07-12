import { Editor } from "@tinymce/tinymce-react";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}

// Loaded from TinyMCE's cloud CDN using a free API key (VITE_TINYMCE_API_KEY).
// The self-hosted npm bundle approach was fragile with Vite's bundler and
// wasn't reliably initializing in production — cloud loading is TinyMCE's
// standard, well-supported integration path. Only the toolbar surface the
// PRD specifies is enabled; no premium plugins.
export function RichTextEditor({ value, onChange, placeholder, minHeight = 220 }: RichTextEditorProps) {
  return (
    <div className="rounded-control border border-slate-200 overflow-hidden">
      <Editor
        apiKey={import.meta.env.VITE_TINYMCE_API_KEY || "no-api-key"}
        value={value}
        onEditorChange={onChange}
        init={{
          height: minHeight,
          menubar: false,
          statusbar: true,
          placeholder,
          plugins: "lists link table wordcount fullscreen autosave",
          toolbar:
            "undo redo | bold italic underline | alignleft aligncenter alignright | bullist numlist | link table | fullscreen",
          content_style: "body { font-family: Inter, sans-serif; font-size: 14px; color: #0F172A; }",
          autosave_interval: "20s",
          branding: false,
        }}
      />
    </div>
  );
}
