import { Editor } from "@tinymce/tinymce-react";

// Self-hosted TinyMCE (Community Edition) — no cloud API key, no premium
// plugins. Only the toolbar surface the PRD specifies is enabled.
import "tinymce/tinymce";
import "tinymce/models/dom/model";
import "tinymce/themes/silver";
import "tinymce/icons/default";
import "tinymce/plugins/lists";
import "tinymce/plugins/link";
import "tinymce/plugins/table";
import "tinymce/plugins/wordcount";
import "tinymce/plugins/fullscreen";
import "tinymce/plugins/autosave";
import "tinymce/skins/ui/oxide/skin.js";
import "tinymce/skins/ui/oxide/content.js";
import "tinymce/skins/content/default/content.js";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}

export function RichTextEditor({ value, onChange, placeholder, minHeight = 220 }: RichTextEditorProps) {
  return (
    <div className="rounded-control border border-slate-200 overflow-hidden">
      <Editor
        licenseKey="gpl"
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
          skin: false,
          content_css: false,
          autosave_interval: "20s",
          branding: false,
        }}
      />
    </div>
  );
}
