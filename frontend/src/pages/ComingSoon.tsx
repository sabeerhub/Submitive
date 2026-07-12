import { DashboardLayout } from "../components/DashboardLayout.js";
import { Card } from "../components/ui/Card.js";
import { Sparkles } from "lucide-react";

export function ComingSoon({ title }: { title: string }) {
  return (
    <DashboardLayout title={title} action={<span />}>
      <Card className="max-w-lg mx-auto text-center py-16">
        <div className="mx-auto h-12 w-12 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center mb-4">
          <Sparkles size={20} />
        </div>
        <h2 className="font-display text-lg text-ink-900">{title} is coming soon</h2>
        <p className="text-sm text-ink-600 mt-2">
          This is planned for a future release. The core submission workflow — forms, uploads, deadlines, and exports — is fully live today.
        </p>
      </Card>
    </DashboardLayout>
  );
}
