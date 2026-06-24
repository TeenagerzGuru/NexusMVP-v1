"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/field";

type Job = {
  id: string;
  bookingId: string;
  reference: string;
  status: string;
  route: string;
  instructions: string | null;
  customerRef: string | null;
  hasPod: boolean;
  contactPhone: string | null;
};

const STATUS_FLOW = [
  { key: "EN_ROUTE_COLLECTION", label: "En route" },
  { key: "ARRIVED_COLLECTION", label: "Arrived" },
  { key: "LOADED", label: "Loaded" },
  { key: "EN_ROUTE_DELIVERY", label: "To delivery" },
  { key: "ARRIVED_DELIVERY", label: "At delivery" },
] as const;

export function DriverJobList({ jobs }: { jobs: Job[] }) {
  const [activePod, setActivePod] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function updateStatus(jobId: string, status: string) {
    setBusy(jobId);
    await fetch("/api/driver/pod", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId, status }),
    });
    window.location.reload();
  }

  async function submitPod(event: React.FormEvent<HTMLFormElement>, bookingId: string) {
    event.preventDefault();
    setBusy(bookingId);
    const form = new FormData(event.currentTarget);
    await fetch("/api/driver/pod", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookingId,
        photoUrl: form.get("photoUrl"),
        signatureData: form.get("signatureData"),
        recipientName: form.get("recipientName"),
        notes: form.get("notes") || undefined,
      }),
    });
    setActivePod(null);
    window.location.reload();
  }

  if (jobs.length === 0) {
    return (
      <Card className="animate-fade-in text-center text-gray-500">
        <p className="text-lg">No assigned jobs</p>
        <p className="mt-1 text-sm">Check back later or contact ops.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {jobs.map((job, index) => (
        <Card key={job.id} className="animate-fade-in-up" style={{ animationDelay: `${index * 80}ms` }}>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-bold text-gray-900">{job.reference}</p>
              <p className="mt-1 text-gray-700">{job.route}</p>
            </div>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium uppercase text-gray-600">
              {job.status.replaceAll("_", " ")}
            </span>
          </div>

          {job.customerRef && <p className="mt-2 text-sm text-gray-500">Ref: {job.customerRef}</p>}
          {job.instructions && (
            <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">{job.instructions}</p>
          )}
          {job.contactPhone && (
            <a
              href={`tel:${job.contactPhone}`}
              className="mt-3 inline-flex items-center gap-1 text-sm font-medium underline"
              style={{ color: "var(--brand-primary)" }}
            >
              Call customer
            </a>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            {STATUS_FLOW.map((status) => (
              <button
                key={status.key}
                type="button"
                disabled={busy === job.id}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium transition-all hover:border-gray-300 hover:shadow-sm disabled:opacity-50"
                onClick={() => updateStatus(job.id, status.key)}
              >
                {status.label}
              </button>
            ))}
            {!job.hasPod && (
              <Button type="button" className="text-xs" onClick={() => setActivePod(job.bookingId)}>
                Capture POD
              </Button>
            )}
            {job.hasPod && (
              <span className="flex items-center rounded-lg bg-green-50 px-3 py-2 text-xs font-medium text-green-700">
                ✓ POD captured
              </span>
            )}
          </div>

          {activePod === job.bookingId && (
            <form
              onSubmit={(e) => submitPod(e, job.bookingId)}
              className="animate-fade-in-up mt-5 space-y-3 border-t border-gray-100 pt-5"
            >
              <Field label="Photo URL">
                <Input name="photoUrl" placeholder="https://..." required />
              </Field>
              <Field label="Signature">
                <Input name="signatureData" placeholder="Recipient signature" required />
              </Field>
              <Field label="Recipient name">
                <Input name="recipientName" required />
              </Field>
              <Field label="Notes">
                <Textarea name="notes" rows={2} />
              </Field>
              <Button type="submit" disabled={busy === job.bookingId}>
                Submit POD
              </Button>
            </form>
          )}
        </Card>
      ))}
    </div>
  );
}
