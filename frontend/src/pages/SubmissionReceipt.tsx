import { useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, Printer, Mail } from "lucide-react";
import { Button } from "../components/ui/Button.js";
import { api } from "../lib/api.js";

interface Receipt {
  id: string;
  reference_number: string;
  submitted_at: string;
  submitter_email: string | null;
  forms: { title: string; workspace: { name: string } };
}

export default function SubmissionReceipt() {
  const { slug, submissionId } = useParams<{ slug: string; submissionId: string }>();
  const [searchParams] = useSearchParams();
  const ref = searchParams.get("ref") ?? "";
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    if (!submissionId || !ref) return;
    api
      .get<{ receipt: Receipt }>(`/submissions/${submissionId}/receipt?ref=${encodeURIComponent(ref)}`)
      .then((res) => setReceipt(res.receipt))
      .catch(() => setNotFound(true));
  }, [submissionId, ref]);

  const handlePrint = () => window.print();
  const handleEmail = () => {
    if (!receipt?.submitter_email) return;
    setEmailSent(true);
  };

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <p className="text-ink-600">Receipt not found.</p>
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <div className="h-8 w-8 rounded-full border-2 border-slate-200 border-t-primary-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-md w-full bg-white rounded-card shadow-md border border-slate-100 p-8 text-center print:shadow-none print:border-none"
      >
        <motion.div
          initial={{ scale: 1.3, opacity: 0, rotate: -6 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto h-12 w-12 rounded-full bg-success-50 flex items-center justify-center mb-4"
        >
          <CheckCircle2 className="text-success-500" size={24} />
        </motion.div>
        <h1 className="font-display text-xl text-ink-900">Submission Successful</h1>
        <p className="text-sm text-ink-600 mt-1.5">
          Thank you! Your submission to <strong className="text-ink-900">{receipt.forms.title}</strong> has been received and timestamped.
        </p>

        <div className="text-left bg-slate-50 rounded-control px-4 py-4 mt-6 space-y-2.5 border border-slate-100">
          <Row label="Submission ID" value={receipt.reference_number} mono />
          {receipt.submitter_email && <Row label="Email" value={receipt.submitter_email} />}
          <Row label="Submitted At" value={new Date(receipt.submitted_at).toLocaleString()} />
          <Row label="Organization" value={receipt.forms.workspace.name} />
        </div>

        <div className="flex gap-3 mt-6 print:hidden">
          <Button variant="outline" className="flex-1" onClick={handlePrint}>
            <Printer size={15} /> Print
          </Button>
          {receipt.submitter_email && (
            <Button variant="outline" className="flex-1" onClick={handleEmail} disabled={emailSent}>
              <Mail size={15} /> {emailSent ? "Sent" : "Email receipt"}
            </Button>
          )}
        </div>

        <Link to={`/s/${slug}`} className="text-xs text-ink-400 mt-6 inline-block print:hidden hover:text-ink-600 transition-colors">
          Back to form
        </Link>
      </motion.div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-ink-400">{label}</span>
      <span className={mono ? "font-mono text-ink-900 tabular-nums" : "text-ink-900"}>{value}</span>
    </div>
  );
}
