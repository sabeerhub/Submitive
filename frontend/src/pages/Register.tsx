import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { BrandPanel } from "../components/BrandPanel.js";
import { TextField } from "../components/ui/TextField.js";
import { Button } from "../components/ui/Button.js";
import { GoogleIcon } from "../components/ui/GoogleIcon.js";
import { registerWithEmail, loginWithGoogle } from "../lib/auth.js";
import { mapAuthError } from "../lib/authErrors.js";

const schema = z.object({
  fullName: z.string().min(2, "Enter your full name"),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Use at least 8 characters"),
});
type FormValues = z.infer<typeof schema>;

export default function Register() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    try {
      await registerWithEmail(values.fullName, values.email, values.password);
      navigate("/onboarding", { replace: true });
    } catch (err) {
      setServerError(mapAuthError(err));
    }
  };

  const handleGoogle = async () => {
    setServerError(null);
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
      navigate("/onboarding", { replace: true });
    } catch (err) {
      setServerError(mapAuthError(err));
    } finally {
      setGoogleLoading(false);
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
          <h1 className="text-2xl font-display text-ink-900">Create your account</h1>
          <p className="text-ink-600 text-sm mt-1.5">Free forever. No credit card required.</p>

          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={handleGoogle}
            disabled={googleLoading}
            className="w-full mt-7"
          >
            <GoogleIcon />
            Continue with Google
          </Button>

          <div className="flex items-center gap-3 my-6">
            <div className="h-px bg-slate-200 flex-1" />
            <span className="text-xs text-ink-400">or</span>
            <div className="h-px bg-slate-200 flex-1" />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <TextField label="Full name" autoComplete="name" error={errors.fullName?.message} {...register("fullName")} />
            <TextField label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register("email")} />
            <TextField
              label="Password"
              type="password"
              autoComplete="new-password"
              error={errors.password?.message}
              {...register("password")}
            />

            {serverError && <p className="text-sm text-danger-500">{serverError}</p>}

            <Button type="submit" size="lg" disabled={isSubmitting} className="w-full mt-1">
              {isSubmitting ? "Creating account…" : "Create account"}
            </Button>
          </form>

          <p className="text-sm text-ink-600 mt-7 text-center">
            Already have an account?{" "}
            <Link to="/login" className="text-primary-600 font-medium hover:underline">
              Log in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
