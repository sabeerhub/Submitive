import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { BrandPanel } from "../components/BrandPanel.js";
import { TextField } from "../components/ui/TextField.js";
import { Button } from "../components/ui/Button.js";
import { api } from "../lib/api.js";
import { useAuth } from "../contexts/AuthContext.js";
import type { Workspace } from "../types/domain.js";

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 40);
}

const schema = z.object({
  name: z.string().min(2, "Enter a workspace name").max(80),
});
type FormValues = z.infer<typeof schema>;

export default function Onboarding() {
  const navigate = useNavigate();
  const { refreshOwner } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const name = watch("name") ?? "";
  const slugPreview = slugify(name) || "your-workspace";

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    try {
      await api.post<{ workspace: Workspace }>("/workspaces", {
        name: values.name,
        slug: slugify(values.name),
      });
      await refreshOwner();
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Couldn't create your workspace. Try a different name.");
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <BrandPanel />
      <div className="flex items-center justify-center px-6 py-16 bg-white">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-full max-w-sm"
        >
          <h1 className="text-2xl font-display text-ink-900">Name your workspace</h1>
          <p className="text-ink-600 text-sm mt-1.5">
            This is where your submission forms, files, and reports will live.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 mt-7">
            <TextField
              label="Workspace name"
              placeholder="e.g. Faculty of Engineering"
              error={errors.name?.message}
              {...register("name")}
            />

            <div className="rounded-control bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-sm text-ink-600">
              Your submission links will look like
              <br />
              <span className="font-mono text-ink-900">submitiv.app/s/…</span> for forms in{" "}
              <span className="font-mono text-primary-600">{slugPreview}</span>
            </div>

            {serverError && <p className="text-sm text-danger-500">{serverError}</p>}

            <Button type="submit" size="lg" disabled={isSubmitting} className="w-full mt-1">
              {isSubmitting ? "Setting up…" : "Continue"}
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
