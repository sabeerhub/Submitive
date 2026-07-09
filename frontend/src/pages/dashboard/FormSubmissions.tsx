import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Search, Download, FileArchive, Pencil, ChevronLeft, ChevronRight } from "lucide-react";
import { DashboardLayout } from "../../components/DashboardLayout.js";
import { Card } from "../../components/ui/Card.js";
import { Button } from "../../components/ui/Button.js";
import { EmptyState } from "../../components/EmptyState.js";
import { SkeletonRows } from "../../components/ui/Skeleton.js";
import { Table, THead, Th, TBody, Tr, Td } from "../../components/ui/Table.js";
import { Badge } from "../../components/ui/Badge.js";
import { useToast } from "../../contexts/ToastContext.js";
import { api } from "../../lib/api.js";
import type { FormDetail, SubmissionSummary } from "../../types/domain.js";

const PAGE_SIZE = 25;

export default function FormSubmissions() {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  const [form, setForm] = useState<FormDetail | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionSummary[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [exporting, setExporting] = useState<"csv" | "zip" | null>(null);

  useEffect(() => {
    if (!id) return;
    api
      .get<{ form: FormDetail }>(`/forms/manage/${id}`)
      .then((res) => setForm(res.form))
      .catch(() => toast.show("Couldn't load this form's details.", "error"));
  }, [id]);

  useEffect(() => {
    setPage(1);
  }, [query]);

  useEffect(() => {
    if (!id) return;
    const params = new URLSearchParams({ form_id: id, page: String(page), page_size: String(PAGE_SIZE) });
    if (query) params.set("q", query);
    api
      .get<{ submissions: SubmissionSummary[]; total: number }>(`/submissions/manage?${params}`)
      .then((res) => {
        setSubmissions(res.submissions);
        setTotal(res.total);
      })
      .catch(() => {
        setSubmissions([]);
        toast.show("Couldn't load submissions.", "error");
      });
  }, [id, query, page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const handleExportCsv = async () => {
    if (!id) return;
    setExporting("csv");
    try {
      await api.download(`/submissions/manage/export?form_id=${id}`, `${form?.title ?? "submissions"}.csv`);
      toast.show("CSV export downloaded");
    } catch {
      toast.show("Export failed. Please try again.", "error");
    } finally {
      setExporting(null);
    }
  };

  const handleExportZip = async () => {
    if (!id) return;
    setExporting("zip");
    try {
      await api.download(`/submissions/manage/export-zip?form_id=${id}`, `${form?.title ?? "submissions"}-files.zip`);
      toast.show("Files downloaded");
    } catch {
      toast.show("Download failed. Please try again.", "error");
    } finally {
      setExporting(null);
    }
  };

  return (
    <DashboardLayout
      title={form?.title ?? "Submissions"}
      action={
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <Link to={`/forms/${id}/edit`}>
            <Button variant="outline" size="md"><Pencil size={15} /> <span className="hidden sm:inline">Edit form</span></Button>
          </Link>
          <Button variant="outline" size="md" onClick={handleExportCsv} disabled={exporting !== null}>
            <Download size={15} /> <span className="hidden sm:inline">{exporting === "csv" ? "Exporting…" : "Export CSV"}</span>
          </Button>
          <Button variant="outline" size="md" onClick={handleExportZip} disabled={exporting !== null}>
            <FileArchive size={15} /> <span className="hidden sm:inline">{exporting === "zip" ? "Zipping…" : "Download files"}</span>
          </Button>
        </div>
      }
    >
      <Card>
        <div className="flex items-center gap-2 mb-5">
          <div className="relative flex-1 max-w-xs">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by email or reference…"
              aria-label="Search submissions by email or reference number"
              className="w-full pl-9 pr-3 py-2 rounded-control border border-slate-200 text-sm transition-colors duration-fast focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
          </div>
        </div>

        {submissions === null ? (
          <SkeletonRows count={4} height="h-12" />
        ) : submissions.length === 0 ? (
          <EmptyState
            icon={<Search size={20} />}
            title="No submissions yet"
            description="Once submitters use your link, their responses will show up here in real time."
          />
        ) : (
          <>
            <Table>
              <THead>
                <Th>Reference</Th>
                <Th>Email</Th>
                <Th>Submitted</Th>
                <Th>Status</Th>
              </THead>
              <TBody>
                {submissions.map((s) => (
                  <Tr key={s.id}>
                    <Td>
                      <Link to={`/dashboard/forms/${id}/submissions/${s.id}`} className="font-mono text-primary-600 hover:underline text-[13px]">
                        {s.reference_number}
                      </Link>
                    </Td>
                    <Td>{s.submitter_email ?? "—"}</Td>
                    <Td>{new Date(s.submitted_at).toLocaleString()}</Td>
                    <Td><Badge tone={s.status === "flagged" ? "warning" : "success"}>{s.status}</Badge></Td>
                  </Tr>
                ))}
              </TBody>
            </Table>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-100">
                <p className="text-xs text-ink-400">
                  Page {page} of {totalPages} · {total} total
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    aria-label="Previous page"
                  >
                    <ChevronLeft size={14} />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    aria-label="Next page"
                  >
                    <ChevronRight size={14} />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </DashboardLayout>
  );
}
