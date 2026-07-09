import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2 } from "lucide-react";
import { BrandPanel } from "../components/BrandPanel.js";
import { TextField } from "../components/ui/TextField.js";
import { Button } from "../components/ui/Button.js";
import { requestPasswordReset } from "../lib/auth.js";

const schema = z.object({ email: z.string().email("Enter a valid email address") });
type FormValues = z.infer<typeof schema>;

export default function ForgotPassword() {
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    try {
      await requestPasswordReset(values.email);
    } finally {
      // Always show the same confirmation, regardless of whether the email
      // exists — avoids leaking which addresses have accounts.
      setSent(true);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <BrandPanel />
      <div className="flex items-center justify-center px-6 py-16 bg-white">
        <div className="w-full max-w-sm">
          {sent ? (
            <div className="text-center">
              <div className="mx-auto h-12 w-12 rounded-full bg-success-500/10 flex items-center justify-center mb-4">
                <CheckCircle2 className="text-success-500" size={24} />
              </div>
              <h1 className="text-xl font-display text-ink-900">Check your inbox</h1>
              <p className="text-ink-600 text-sm mt-2">
                If an account exists for that email, a reset link is on its way.
              </p>
              <Link to="/login" className="text-primary-600 font-medium text-sm hover:underline mt-6 inline-block">
                Back to login
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-display text-ink-900">Reset your password</h1>
              <p className="text-ink-600 text-sm mt-1.5">We'll email you a link to set a new one.</p>

              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 mt-7">
                <TextField label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register("email")} />
                <Button type="submit" size="lg" disabled={isSubmitting} className="w-full mt-1">
                  {isSubmitting ? "Sending…" : "Send reset link"}
                </Button>
              </form>

              <p className="text-sm text-ink-600 mt-7 text-center">
                <Link to="/login" className="text-primary-600 font-medium hover:underline">
                  Back to login
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
