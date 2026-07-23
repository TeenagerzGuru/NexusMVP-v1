"use client";

import { useRef, useState } from "react";

import { useClickOutside, useEscapeKey } from "@/components/ui/use-click-outside";

export const TIME_SLOTS = Array.from({ length: 48 }, (_, i) => {
  const totalMinutes = i * 30;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
});

function formatTime12h(value: string) {
  const [h, m] = value.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

export function isSlotDisabled(slot: string, selectedDate?: string): boolean {
  if (!selectedDate) return false;

  // Get local today's date YYYY-MM-DD
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  const todayStr = `${y}-${m}-${d}`;

  if (selectedDate !== todayStr) return false;

  const [sh, sm] = slot.split(":").map(Number);
  const slotDate = new Date(y, today.getMonth(), today.getDate(), sh, sm);
  const minAllowed = new Date(today.getTime() + 60 * 60 * 1000); // 1 hour in future

  return slotDate < minAllowed;
}

/** 30-minute slot picker covering 24 hours; displays 12h labels, stores 24h ISO time strings. */
export function TimePicker({
  value,
  onChange,
  selectedDate,
  name,
  placeholder = "Select time",
  invalid,
  "data-field": dataField,
}: {
  value: string;
  onChange: (value: string) => void;
  selectedDate?: string;
  name?: string;
  placeholder?: string;
  invalid?: boolean;
  "data-field"?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useClickOutside(ref, () => setOpen(false));
  useEscapeKey(() => setOpen(false), open);

  return (
    <div ref={ref} className="relative">
      {name && <input type="hidden" name={name} value={value} readOnly />}
      <button
        type="button"
        data-field={dataField}
        onClick={() => setOpen((prev) => !prev)}
        className={`nexus-input flex w-full items-center justify-between gap-2 text-left ${
          invalid ? "nexus-input-invalid" : ""
        } ${
          open && !invalid ? "border-[var(--brand-accent)] shadow-[0_0_0_3px_color-mix(in_srgb,var(--brand-accent)_35%,transparent)]" : ""
        }`}
        aria-expanded={open}
      >
        <span className={value ? "text-gray-900" : "text-gray-400"}>
          {value ? formatTime12h(value) : placeholder}
        </span>
        <svg className="h-4 w-4 shrink-0 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      </button>

      <div
        className={`popover-panel absolute z-50 mt-2 w-full min-w-[14rem] origin-top ${open ? "popover-open" : "popover-closed pointer-events-none"}`}
      >
        <div className="rounded-xl border border-gray-200 bg-white p-2 shadow-xl">
          <p className="px-2 pb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
            Collection time
          </p>
          <ul className="max-h-52 overflow-auto">
            {TIME_SLOTS.map((slot, i) => {
              const selected = slot === value;
              const disabled = isSlotDisabled(slot, selectedDate);
              return (
                <li key={slot}>
                  <button
                    type="button"
                    disabled={disabled}
                    className={`popover-item flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-all ${
                      selected
                        ? "font-semibold text-white shadow-sm"
                        : disabled
                          ? "cursor-not-allowed opacity-35 text-gray-300"
                          : "text-gray-700 hover:bg-gray-50"
                    }`}
                    style={{
                      animationDelay: open ? `${i * 15}ms` : "0ms",
                      ...(selected ? { backgroundColor: "var(--brand-primary)" } : {}),
                    }}
                    onClick={() => {
                      onChange(slot);
                      setOpen(false);
                    }}
                  >
                    <span>{formatTime12h(slot)}</span>
                    <span className={`text-xs ${selected ? "text-white/80" : "text-gray-400"}`}>{slot}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
