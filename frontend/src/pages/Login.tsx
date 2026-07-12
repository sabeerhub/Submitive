import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { BrandPanel } from "../components/BrandPanel.js";
import { TextField } from "../components/ui/TextField.js";
import { Button } from "../components/ui/Button.js";
import { GoogleIcon } from "../components/ui/GoogleIcon.js";
import { loginWithEmail, loginWithGoogle } from "../lib/auth.js";
import { mapAuthError } from "../lib/authErrors.js";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});
type FormValues = z.infer<typeof schema>;

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const redirectTo = (location.state as { from?: Location })?.from?.pathname ?? "/workspaces";

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    try {
      await loginWithEmail(values.email, values.password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setServerError(mapAuthError(err));
    }
  };

  const handleGoogle = async () => {
    setServerError(null);
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
      navigate(redirectTo, { replace: true });
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
          <h1 className="text-2xl font-display text-ink-900">Welcome back</h1>
          <p className="text-ink-600 text-sm mt-1.5">Log in to manage your submissions.</p>

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
            <TextField label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register("email")} />
            <div>
              <TextField
                label="Password"
                type="password"
                autoComplete="current-password"
                error={errors.password?.message}
                {...register("password")}
              />
              <Link to="/forgot-password" className="text-xs text-primary-600 hover:underline mt-2 inline-block">
                Forgot password?
              </Link>
            </div>

            {serverError && <p className="text-sm text-danger-500">{serverError}</p>}

            <Button type="submit" size="lg" disabled={isSubmitting} className="w-full mt-1">
              {isSubmitting ? "Logging in…" : "Log in"}
            </Button>
          </form>

          <p className="text-sm text-ink-600 mt-7 text-center">
            New to Submitiv?{" "}
            <Link to="/register" className="text-primary-600 font-medium hover:underline">
              Create an account
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
