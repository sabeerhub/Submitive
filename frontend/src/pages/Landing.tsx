import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Check, Copy, ShieldCheck, Menu, X, Clock, Lock, FileStack,
  PenLine, Download, BarChart3, ArrowRight,
} from "lucide-react";
import { Button } from "../components/ui/Button.js";
import { Card } from "../components/ui/Card.js";
import { Logomark } from "../components/ui/Logomark.js";

const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Pricing" },
  { href: "#how", label: "How it works" },
];

const FEATURES = [
  {
    icon: Clock,
    title: "Deadlines that actually close",
    description: "The moment your deadline passes, the form locks itself — enforced on the server, not just the UI. No late submissions, ever.",
  },
  {
    icon: Lock,
    title: "No login for submitters",
    description: "Share a link. That's it. Submitters never create an account — just their name, a few details, and their work.",
  },
  {
    icon: PenLine,
    title: "Any field you need",
    description: "Rich text, file uploads, dropdowns, dates, custom fields — build the exact form your submission needs, in minutes.",
  },
  {
    icon: FileStack,
    title: "Every file, organized",
    description: "Uploads are stored securely per submission, timestamped, and ready to browse from one dashboard.",
  },
  {
    icon: Download,
    title: "Export anytime",
    description: "Download every submission as CSV, or grab every uploaded file at once as a ZIP — no manual copying.",
  },
  {
    icon: BarChart3,
    title: "See it at a glance",
    description: "A live dashboard shows submission volume, active forms, and storage — so you always know where things stand.",
  },
];

const STEPS = [
  { label: "Create", description: "Build your form with the fields you actually need." },
  { label: "Share", description: "Send one link. No accounts, no friction." },
  { label: "Collect", description: "Submissions arrive timestamped, organized, and secure." },
  { label: "Close", description: "The deadline hits, the form locks. Automatically." },
];

export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-paper overflow-x-hidden">
      <header className="relative">
        <div className="flex items-center justify-between px-5 sm:px-8 py-5 max-w-7xl mx-auto">
          <div className="flex items-center gap-2.5 font-semibold text-[15px]">
            <Logomark size={26} />
            Submitiv
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm text-ink-600">
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} className="hover:text-ink-900 transition-colors">
                {link.label}
              </a>
            ))}
          </nav>
          <div className="hidden md:flex items-center gap-3">
            <Link to="/login"><Button variant="ghost" size="sm">Login</Button></Link>
            <Link to="/register"><Button size="sm">Get Started Free</Button></Link>
          </div>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            className="md:hidden text-ink-700"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="md:hidden overflow-hidden border-t border-slate-200 bg-white"
            >
              <div className="px-5 py-5 flex flex-col gap-4">
                {NAV_LINKS.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="text-sm font-medium text-ink-700"
                  >
                    {link.label}
                  </a>
                ))}
                <div className="flex flex-col gap-2.5 pt-2 border-t border-slate-100">
                  <Link to="/login" onClick={() => setMenuOpen(false)}>
                    <Button variant="outline" className="w-full">Login</Button>
                  </Link>
                  <Link to="/register" onClick={() => setMenuOpen(false)}>
                    <Button className="w-full">Get Started Free</Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ---------------------------------------------------------------- */}
      {/* Hero */}
      {/* ---------------------------------------------------------------- */}
      <main className="max-w-7xl mx-auto px-5 sm:px-8 pt-10 sm:pt-16 pb-20 sm:pb-28 grid md:grid-cols-2 gap-12 lg:gap-16 items-center relative">
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
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl leading-[1.08] mt-6 text-ink-900">
            The smartest way to
            <br className="hidden sm:block" /> <span className="text-primary-500">collect submissions.</span>
          </h1>
          <p className="text-ink-600 mt-5 text-base sm:text-lg max-w-md leading-relaxed">
            Create a submission in minutes, share your link, and let Submitiv handle the rest —
            no logins for submitters, no missed deadlines.
          </p>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mt-8 sm:mt-9">
            <Link to="/register"><Button size="lg" className="w-full sm:w-auto">Get Started Free</Button></Link>
            <a href="#how"><Button variant="outline" size="lg" className="w-full sm:w-auto">See How It Works</Button></a>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-8 sm:mt-9 text-sm text-ink-600">
            {["No credit card required", "Free forever", "Deadline enforcement"].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <Check size={15} className="text-success-500 shrink-0" /> {t}
              </span>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.12 }}
        >
          <Card elevation="lg" className="max-w-md mx-auto md:mx-0">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-ink-900">Assignment: Final Project</p>
              <span className="flex items-center gap-1.5 text-xs bg-success-50 text-success-600 px-2.5 py-1 rounded-full font-medium shrink-0">
                <span className="h-1.5 w-1.5 rounded-full bg-success-500" /> Live
              </span>
            </div>
            <p className="text-xs text-ink-400 mt-1.5">Deadline May 25, 2026 · 11:59 PM (GMT+8)</p>

            <div className="flex gap-2 sm:gap-2.5 mt-5">
              {[["02", "Days"], ["14", "Hours"], ["28", "Minutes"], ["47", "Seconds"]].map(([val, label]) => (
                <div key={label} className="bg-slate-50 rounded-control px-2 sm:px-3 py-2.5 text-center flex-1">
                  <p className="text-base sm:text-lg font-bold text-ink-900 tabular-nums">{val}</p>
                  <p className="text-2xs text-ink-400 uppercase tracking-wide mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            <div className="mt-5">
              <p className="text-xs text-ink-400 mb-1.5">Submission Link</p>
              <div className="flex items-center justify-between bg-slate-50 rounded-control px-3 sm:px-3.5 py-2.5 text-sm gap-2">
                <span className="text-primary-600 font-mono text-[12px] sm:text-[13px] truncate">submitiv.app/s/abc123</span>
                <Copy size={14} className="text-ink-400 shrink-0" />
              </div>
            </div>

            <div className="flex items-center gap-1.5 mt-5 text-2xs text-ink-400">
              <span className="h-1 w-1 rounded-full bg-ink-300 shrink-0" />
              34 submissions received · timestamped automatically
            </div>
          </Card>
        </motion.div>
      </main>

      {/* ---------------------------------------------------------------- */}
      {/* Features */}
      {/* ---------------------------------------------------------------- */}
      <section id="features" className="max-w-7xl mx-auto px-5 sm:px-8 py-16 sm:py-24 scroll-mt-16">
        <div className="max-w-lg">
          <span className="text-xs font-medium text-primary-600 uppercase tracking-wide">Features</span>
          <h2 className="font-display text-3xl sm:text-4xl text-ink-900 mt-3">Built for one job, done exceptionally well.</h2>
          <p className="text-ink-600 mt-3 text-base leading-relaxed">
            Submitiv isn't a learning management system. It focuses entirely on collecting,
            timestamping, and organizing submissions — nothing else to configure.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-12">
          {FEATURES.map(({ icon: Icon, title, description }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.35, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
            >
              <Card className="h-full">
                <div className="h-10 w-10 rounded-control bg-primary-50 text-primary-600 flex items-center justify-center mb-4">
                  <Icon size={18} />
                </div>
                <h3 className="font-semibold text-ink-900">{title}</h3>
                <p className="text-sm text-ink-600 mt-1.5 leading-relaxed">{description}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* How it works */}
      {/* ---------------------------------------------------------------- */}
      <section id="how" className="bg-panel-900 py-16 sm:py-24 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="max-w-lg">
            <span className="text-xs font-medium text-primary-400 uppercase tracking-wide">How it works</span>
            <h2 className="font-display text-3xl sm:text-4xl text-white mt-3">Create. Share. Collect. Close.</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mt-12">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.label}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.35, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                className="relative"
              >
                <p className="font-mono text-primary-400 text-sm">0{i + 1}</p>
                <h3 className="font-display text-xl text-white mt-2">{step.label}</h3>
                <p className="text-slate-400 text-sm mt-1.5 leading-relaxed">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Pricing */}
      {/* ---------------------------------------------------------------- */}
      <section id="pricing" className="max-w-7xl mx-auto px-5 sm:px-8 py-16 sm:py-24 scroll-mt-16">
        <div className="max-w-lg mx-auto text-center">
          <span className="text-xs font-medium text-primary-600 uppercase tracking-wide">Pricing</span>
          <h2 className="font-display text-3xl sm:text-4xl text-ink-900 mt-3">Free. No catch.</h2>
          <p className="text-ink-600 mt-3">Submitiv is free to use — no credit card, no trial period, no feature paywall.</p>
        </div>

        <div className="max-w-md mx-auto mt-10">
          <Card elevation="md" className="flex flex-col text-center">
            <p className="mt-1"><span className="text-4xl font-display text-ink-900">$0</span> <span className="text-ink-400 text-sm">/ forever</span></p>
            <ul className="flex flex-col gap-2.5 mt-6 text-sm text-ink-600 text-left">
              {["Unlimited submission forms", "5GB file storage", "CSV & ZIP export", "Deadline enforcement", "Email confirmations"].map((f) => (
                <li key={f} className="flex items-center gap-2"><Check size={14} className="text-success-500 shrink-0" /> {f}</li>
              ))}
            </ul>
            <Link to="/register" className="mt-7">
              <Button className="w-full">Get Started Free</Button>
            </Link>
          </Card>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Final CTA */}
      {/* ---------------------------------------------------------------- */}
      <section className="max-w-7xl mx-auto px-5 sm:px-8 pb-20 sm:pb-28">
        <Card elevation="md" className="text-center py-12 sm:py-16 px-6 sm:px-12">
          <h2 className="font-display text-2xl sm:text-3xl text-ink-900">Ready to stop chasing submissions by email?</h2>
          <p className="text-ink-600 mt-3 max-w-md mx-auto">Create your first submission form in under five minutes.</p>
          <Link to="/register" className="inline-block mt-7">
            <Button size="lg">
              Get Started Free <ArrowRight size={16} />
            </Button>
          </Link>
        </Card>
      </section>

      <footer className="border-t border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-ink-400">
          <div className="flex items-center gap-2 font-medium text-ink-700">
            <Logomark size={20} />
            Submitiv
          </div>
          <p>Create. Share. Collect. Close.</p>
        </div>
      </footer>
    </div>
  );
}
