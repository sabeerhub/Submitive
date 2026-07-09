import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Check, Copy, ShieldCheck } from "lucide-react";
import { Button } from "../components/ui/Button.js";
import { Card } from "../components/ui/Card.js";

function Logomark() {
  return (
    <span className="relative flex items-center justify-center h-7 w-7 rounded-full bg-panel-900">
      <span className="h-2 w-2 rounded-full bg-primary-400" />
    </span>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-paper">
      <header className="flex items-center justify-between px-8 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-2.5 font-semibold text-[15px]">
          <Logomark />
          Submitiv
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm text-ink-600">
          <a href="#features" className="hover:text-ink-900 transition-colors">Features</a>
          <a href="#pricing" className="hover:text-ink-900 transition-colors">Pricing</a>
          <a href="#how" className="hover:text-ink-900 transition-colors">How it works</a>
        </nav>
        <div className="flex items-center gap-3">
          <Link to="/login"><Button variant="ghost" size="sm">Login</Button></Link>
          <Link to="/register"><Button size="sm">Get Started Free</Button></Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 pt-16 pb-28 grid md:grid-cols-2 gap-16 items-center relative">
        {/* faint ledger grid, echoes the auth brand panel — used sparingly */}
        <div
          className="absolute -top-10 left-0 right-0 h-[420px] opacity-[0.035] pointer-events-none -z-10"
          style={{
            backgroundImage: "linear-gradient(#0f172a 1px, transparent 1px), linear-gradient(90deg, #0f172a 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="inline-flex items-center gap-2 text-xs font-medium text-ink-600 border border-slate-200 bg-white px-3 py-1.5 rounded-full">
            <ShieldCheck size={13} className="text-primary-500" />
            Simple. Secure. On time.
          </span>
          <h1 className="font-display text-[3.4rem] leading-[1.08] mt-6 text-ink-900">
            The smartest way to
            <br />
            <span className="text-primary-500">collect submissions.</span>
          </h1>
          <p className="text-ink-600 mt-5 text-lg max-w-md leading-relaxed">
            Create a submission in minutes, share your link, and let Submitiv handle the rest —
            no logins for submitters, no missed deadlines.
          </p>
          <div className="flex items-center gap-4 mt-9">
            <Link to="/register"><Button size="lg">Get Started Free</Button></Link>
            <Button variant="outline" size="lg">See How It Works</Button>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-9 text-sm text-ink-600">
            {["No credit card required", "Free forever", "Deadline enforcement"].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <Check size={15} className="text-success-500" /> {t}
              </span>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.12 }}
        >
          <Card elevation="lg" className="max-w-md">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-ink-900">Assignment: Final Project</p>
              <span className="flex items-center gap-1.5 text-xs bg-success-50 text-success-600 px-2.5 py-1 rounded-full font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-success-500" /> Live
              </span>
            </div>
            <p className="text-xs text-ink-400 mt-1.5">Deadline May 25, 2026 · 11:59 PM (GMT+8)</p>

            <div className="flex gap-2.5 mt-5">
              {[["02", "Days"], ["14", "Hours"], ["28", "Minutes"], ["47", "Seconds"]].map(([val, label]) => (
                <div key={label} className="bg-slate-50 rounded-control px-3 py-2.5 text-center flex-1">
                  <p className="text-lg font-bold text-ink-900 tabular-nums">{val}</p>
                  <p className="text-2xs text-ink-400 uppercase tracking-wide mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            <div className="mt-5">
              <p className="text-xs text-ink-400 mb-1.5">Submission Link</p>
              <div className="flex items-center justify-between bg-slate-50 rounded-control px-3.5 py-2.5 text-sm">
                <span className="text-primary-600 font-mono text-[13px]">submitiv.app/s/abc123</span>
                <Copy size={14} className="text-ink-400" />
              </div>
            </div>

            <div className="flex items-center gap-1.5 mt-5 text-2xs text-ink-400">
              <span className="h-1 w-1 rounded-full bg-ink-300" />
              34 submissions received · timestamped automatically
            </div>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
