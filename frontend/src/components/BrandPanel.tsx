import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { Logomark } from "./ui/Logomark.js";

const SEAL_TEXT = "SUBMITIV • TIMESTAMPED • SECURED • ON TIME • ";

/** Builds an SVG circular text path repeating the seal legend around a ring. */
function SealRing({ radius = 92 }: { radius?: number }) {
  const id = "seal-circle-path";
  return (
    <svg width={radius * 2 + 40} height={radius * 2 + 40} viewBox={`0 0 ${radius * 2 + 40} ${radius * 2 + 40}`}>
      <defs>
        <path
          id={id}
          d={`M 20,${radius + 20} a ${radius},${radius} 0 1,1 ${radius * 2},0 a ${radius},${radius} 0 1,1 -${radius * 2},0`}
        />
      </defs>
      <circle cx={radius + 20} cy={radius + 20} r={radius} fill="none" stroke="#1E293B" strokeWidth={1} />
      <text fill="#64748B" fontSize="11" letterSpacing="2.5" fontWeight={600}>
        <textPath href={`#${id}`} startOffset="0%">
          {SEAL_TEXT.repeat(2)}
        </textPath>
      </text>
    </svg>
  );
}

function LiveTimestamp() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const date = now.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
  const time = now.toLocaleTimeString(undefined, { hour12: false });

  return (
    <p className="font-mono text-xs tracking-wide text-slate-500 tabular-nums">
      {date} — {time}
    </p>
  );
}

export function BrandPanel() {
  return (
    <div className="relative hidden lg:flex flex-col justify-between h-full w-full bg-panel-900 text-white px-14 py-14 overflow-hidden">
      {/* faint grid, evokes a ledger / official record rather than a gradient blob */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />

      <div className="relative flex items-center gap-2.5 font-semibold text-lg">
        <Logomark size={22} bare />
        Submitiv
      </div>

      <div className="relative flex flex-col items-center gap-10">
        <motion.div
          initial={{ opacity: 0, scale: 1.3, rotate: -8 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative flex items-center justify-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 48, repeat: Infinity, ease: "linear" }}
          >
            <SealRing />
          </motion.div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-16 w-16 rounded-full bg-primary-500/10 border border-primary-400/30 flex items-center justify-center">
              <Lock size={22} className="text-primary-400" />
            </div>
          </div>
        </motion.div>

        <div className="text-center max-w-sm">
          <h2 className="font-display text-[26px] leading-snug">
            Every submission, timestamped the moment it arrives.
          </h2>
          <p className="text-slate-400 text-sm mt-3 leading-relaxed">
            Once the deadline passes, the form locks itself — no exceptions, no edits, no email chains.
          </p>
        </div>
      </div>

      <div className="relative flex items-center justify-between">
        <LiveTimestamp />
        <p className="text-xs text-slate-600">Create. Share. Collect. Close.</p>
      </div>
    </div>
  );
}
