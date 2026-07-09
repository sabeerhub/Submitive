import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Compass } from "lucide-react";
import { Button } from "../components/ui/Button.js";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="text-center max-w-sm"
      >
        <div className="mx-auto h-14 w-14 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center mb-6">
          <Compass size={24} />
        </div>
        <p className="font-display text-3xl text-ink-900">Off the record.</p>
        <p className="text-ink-600 text-sm mt-3">
          This page doesn't exist, or the link may have expired.
        </p>
        <Link to="/" className="inline-block mt-7">
          <Button>Back to Submitiv</Button>
        </Link>
      </motion.div>
    </div>
  );
}
