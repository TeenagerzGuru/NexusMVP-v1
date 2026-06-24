"use client";

import { useState } from "react";

type Card = {
  id: string;
  reference: string;
  brand: string;
  route: string;
  customer: string;
  value: string;
};

export function KanbanBoard({
  columns,
}: {
  columns: Array<{ status: string; label: string; bookings: Card[] }>;
}) {
  const [moving, setMoving] = useState<string | null>(null);

  async function move(bookingId: string, status: string) {
    setMoving(bookingId);
    const reason = status === "INVOICED" ? prompt("Reason for status change (optional)") : null;
    await fetch("/api/ops/bookings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId, status, reason }),
    });
    window.location.reload();
  }

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      {columns.map((column, colIndex) => (
        <section
          key={column.status}
          className="animate-fade-in-up nexus-card min-h-[200px] bg-gray-50/80 p-3"
          style={{ animationDelay: `${colIndex * 60}ms` }}
        >
          <h2 className="mb-3 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-gray-500">
            <span>{column.label}</span>
            <span
              className="rounded-full px-2 py-0.5 text-[10px] text-white"
              style={{ backgroundColor: "var(--brand-primary)" }}
            >
              {column.bookings.length}
            </span>
          </h2>
          <div className="space-y-3">
            {column.bookings.map((booking, i) => (
              <article
                key={booking.id}
                className="animate-scale-in nexus-card bg-white p-3 text-sm"
                style={{ animationDelay: `${colIndex * 60 + i * 40}ms` }}
              >
                <p className="font-semibold text-gray-900">{booking.reference}</p>
                <p className="text-xs font-medium text-gray-400">{booking.brand}</p>
                <p className="mt-1 text-gray-700">{booking.route}</p>
                <p className="text-gray-500">{booking.customer}</p>
                <p className="mt-1 font-semibold" style={{ color: "var(--brand-primary)" }}>
                  {booking.value}
                </p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {columns
                    .filter((col) => col.status !== column.status)
                    .slice(0, 3)
                    .map((col) => (
                      <button
                        key={col.status}
                        type="button"
                        disabled={moving === booking.id}
                        className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-[10px] font-medium transition-colors hover:border-gray-300 hover:bg-white disabled:opacity-50"
                        onClick={() => move(booking.id, col.status)}
                      >
                        → {col.label}
                      </button>
                    ))}
                </div>
              </article>
            ))}
            {column.bookings.length === 0 && (
              <p className="py-8 text-center text-xs text-gray-400">No jobs</p>
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
