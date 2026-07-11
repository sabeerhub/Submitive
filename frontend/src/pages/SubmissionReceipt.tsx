import { useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, Printer, Mail, Download } from "lucide-react";
import { Button } from "../components/ui/Button.js";
import { Skeleton } from "../components/ui/Skeleton.js";
import { api } from "../lib/api.js";

interface Receipt {
  id: string;
  reference_number: string;
  submitted_at: string;
  completed_at: string | null;
  submitter_email: string | null;
  submitter_name: string | null;
  forms: { title: string; workspace: { name: string } };
}

export default function SubmissionReceipt() {
  const { submissionId } = useParams<{ slug: string; submissionId: string }>();
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
  const handleDownload = () => {
    if (!receipt) return;
    const lines = [
      "SUBMITIV — SUBMISSION RECEIPT",
      "",
      `Submission ID: ${receipt.reference_number}`,
      receipt.submitter_name ? `Name: ${receipt.submitter_name}` : null,
      receipt.submitter_email ? `Email: ${receipt.submitter_email}` : null,
      `Submitted At: ${new Date(receipt.completed_at ?? receipt.submitted_at).toLocaleString()}`,
      `Form: ${receipt.forms.title}`,
      `Organization: ${receipt.forms.workspace.name}`,
    ].filter(Boolean);
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `receipt-${receipt.reference_number}.txt`;
    a.click();
    URL.revokeObjectURL(url);
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
      <div className="min-h-screen bg-paper flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white rounded-card shadow-md border border-slate-100 p-8">
          <Skeleton className="h-12 w-12 rounded-full mx-auto mb-4" />
          <Skeleton className="h-6 w-1/2 mx-auto mb-2" />
          <Skeleton className="h-4 w-3/4 mx-auto mb-6" />
          <Skeleton className="h-32" />
        </div>
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
          {receipt.submitter_name && <Row label="Name" value={receipt.submitter_name} />}
          {receipt.submitter_email && <Row label="Email" value={receipt.submitter_email} />}
          <Row label="Submitted At" value={new Date(receipt.completed_at ?? receipt.submitted_at).toLocaleString()} />
          <Row label="Organization" value={receipt.forms.workspace.name} />
        </div>

        <div className="flex gap-3 mt-6 print:hidden flex-wrap">
          <Button variant="outline" className="flex-1" onClick={handleDownload}>
            <Download size={15} /> Download
          </Button>
          <Button variant="outline" className="flex-1" onClick={handlePrint}>
            <Printer size={15} /> Print
          </Button>
          {receipt.submitter_email && (
            <Button variant="outline" className="flex-1" onClick={handleEmail} disabled={emailSent}>
              <Mail size={15} /> {emailSent ? "Sent" : "Email receipt"}
            </Button>
          )}
        </div>

        <Link to="/" className="text-xs text-ink-400 mt-6 inline-block print:hidden hover:text-ink-600 transition-colors">
          Return to Home
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
