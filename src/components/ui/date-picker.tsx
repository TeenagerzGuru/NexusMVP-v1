"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { useClickOutside, useEscapeKey } from "@/components/ui/use-click-outside";

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

type Panel = "days" | "months" | "years";

function toIso(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseIso(value: string) {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return startOfDay(next);
}

function formatDisplay(value: string) {
  if (!value) return "";
  return parseIso(value).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function buildCalendarDays(year: number, month: number) {
  const first = new Date(year, month, 1);
  const startOffset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<{ date: Date; inMonth: boolean }> = [];

  for (let i = startOffset - 1; i >= 0; i--) {
    cells.push({ date: new Date(year, month, -i), inMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, month, d), inMonth: true });
  }
  while (cells.length % 7 !== 0) {
    const nextDay = cells.length - startOffset - daysInMonth + 1;
    cells.push({ date: new Date(year, month + 1, nextDay), inMonth: false });
  }
  return cells;
}

function buildYearRange(centerYear: number) {
  const start = centerYear - 6;
  return Array.from({ length: 12 }, (_, i) => start + i);
}

const QUICK_DATES = [
  { label: "Today", offset: 0 },
  { label: "Tomorrow", offset: 1 },
  { label: "In 3 days", offset: 3 },
  { label: "Next week", offset: 7 },
] as const;

/** Popover calendar with quick dates and drill-down month/year panels; respects `min` for past dates. */
export function DatePicker({
  value,
  onChange,
  min,
  name,
  placeholder = "Select date",
  invalid,
  "data-field": dataField,
}: {
  value: string;
  onChange: (value: string) => void;
  min?: string;
  name?: string;
  placeholder?: string;
  invalid?: boolean;
  "data-field"?: string;
}) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => (value ? parseIso(value) : new Date()));
  const [panel, setPanel] = useState<Panel>("days");
  const [direction, setDirection] = useState<"left" | "right">("right");
  const ref = useRef<HTMLDivElement>(null);

  useClickOutside(ref, () => {
    setOpen(false);
    setPanel("days");
  });
  useEscapeKey(() => {
    if (panel !== "days") setPanel("days");
    else setOpen(false);
  }, open);

  useEffect(() => {
    if (open && value) setView(parseIso(value));
  }, [open, value]);

  const minDate = min ? parseIso(min) : null;
  const today = useMemo(() => startOfDay(new Date()), [open]);
  const cells = useMemo(
    () => buildCalendarDays(view.getFullYear(), view.getMonth()),
    [view],
  );
  const years = useMemo(() => buildYearRange(view.getFullYear()), [view]);

  function isDisabled(date: Date) {
    if (!minDate) return false;
    return startOfDay(date) < minDate;
  }

  function shiftMonth(delta: number) {
    setDirection(delta > 0 ? "right" : "left");
    setView((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  }

  function shiftYear(delta: number) {
    setDirection(delta > 0 ? "right" : "left");
    setView((prev) => new Date(prev.getFullYear() + delta, prev.getMonth(), 1));
  }

  function selectDate(date: Date) {
    if (isDisabled(date)) return;
    onChange(toIso(date));
    setOpen(false);
    setPanel("days");
  }

  function openPicker() {
    setOpen((prev) => {
      const next = !prev;
      if (next) {
        setPanel("days");
        if (value) setView(parseIso(value));
      }
      return next;
    });
  }

  return (
    <div ref={ref} className="relative">
      {name && <input type="hidden" name={name} value={value} readOnly />}
      <button
        type="button"
        data-field={dataField}
        onClick={openPicker}
        className={`nexus-input flex w-full items-center justify-between gap-2 text-left ${
          invalid ? "nexus-input-invalid" : ""
        } ${
          open && !invalid ? "border-[var(--brand-accent)] shadow-[0_0_0_3px_color-mix(in_srgb,var(--brand-accent)_35%,transparent)]" : ""
        }`}
        aria-expanded={open}
      >
        <span className={value ? "text-gray-900" : "text-gray-400"}>
          {value ? formatDisplay(value) : placeholder}
        </span>
        <svg className="h-4 w-4 shrink-0 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
      </button>

      <div
        className={`popover-panel absolute z-50 mt-2 w-[min(100%,20rem)] origin-top ${open ? "popover-open" : "popover-closed pointer-events-none"}`}
      >
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xl">
          <div className="mb-3 flex flex-wrap gap-2">
            {QUICK_DATES.map(({ label, offset }) => {
              const date = addDays(today, offset);
              const iso = toIso(date);
              const disabled = isDisabled(date);
              const selected = value === iso;

              return (
                <button
                  key={label}
                  type="button"
                  disabled={disabled}
                  onClick={() => selectDate(date)}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium transition-all ${
                    selected
                      ? "text-white shadow-sm"
                      : disabled
                        ? "cursor-not-allowed bg-gray-50 text-gray-300"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                  style={selected ? { backgroundColor: "var(--brand-primary)" } : undefined}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div className="mb-3 flex items-center justify-between gap-1">
            <button
              type="button"
              className="rounded-lg p-1.5 text-gray-600 transition-colors hover:bg-gray-100"
              onClick={() => (panel === "years" ? shiftYear(-12) : shiftMonth(-1))}
              aria-label={panel === "years" ? "Previous years" : "Previous month"}
            >
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
              </svg>
            </button>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPanel((p) => (p === "months" ? "days" : "months"))}
                className={`rounded-lg px-2 py-1 text-sm font-semibold transition-colors ${
                  panel === "months" ? "bg-gray-100 text-gray-900" : "text-gray-800 hover:bg-gray-100"
                }`}
                aria-expanded={panel === "months"}
              >
                {MONTHS[view.getMonth()]}
              </button>
              <button
                type="button"
                onClick={() => setPanel((p) => (p === "years" ? "days" : "years"))}
                className={`rounded-lg px-2 py-1 text-sm font-semibold transition-colors ${
                  panel === "years" ? "bg-gray-100 text-gray-900" : "text-gray-800 hover:bg-gray-100"
                }`}
                aria-expanded={panel === "years"}
              >
                {view.getFullYear()}
              </button>
            </div>

            <button
              type="button"
              className="rounded-lg p-1.5 text-gray-600 transition-colors hover:bg-gray-100"
              onClick={() => (panel === "years" ? shiftYear(12) : shiftMonth(1))}
              aria-label={panel === "years" ? "Next years" : "Next month"}
            >
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.25 4.5a.75.75 0 010 1.08l-4.25 4.5a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {panel === "days" && (
            <>
              <div className="mb-1 grid grid-cols-7 gap-1">
                {WEEKDAYS.map((day) => (
                  <div key={day} className="py-1 text-center text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                    {day}
                  </div>
                ))}
              </div>

              <div key={`grid-${view.getFullYear()}-${view.getMonth()}`} className={`grid grid-cols-7 gap-1 cal-month-${direction}`}>
                {cells.map(({ date, inMonth }) => {
                  const iso = toIso(date);
                  const selected = value === iso;
                  const disabled = !inMonth || isDisabled(date);
                  const isToday = toIso(today) === iso;

                  return (
                    <button
                      key={iso + String(inMonth)}
                      type="button"
                      disabled={disabled}
                      onClick={() => selectDate(date)}
                      className={`aspect-square rounded-lg text-sm transition-all duration-200 ${
                        selected
                          ? "scale-105 font-bold text-white shadow-md"
                          : inMonth
                            ? "text-gray-800 hover:bg-gray-100"
                            : "text-gray-300"
                      } ${isToday && !selected ? "ring-1 ring-[var(--brand-accent)]" : ""} disabled:cursor-not-allowed disabled:opacity-30`}
                      style={selected ? { backgroundColor: "var(--brand-primary)" } : undefined}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {panel === "months" && (
            <div key={`months-${view.getFullYear()}`} className={`grid grid-cols-3 gap-2 cal-month-${direction}`}>
              {MONTHS_SHORT.map((month, index) => {
                const active = view.getMonth() === index;
                return (
                  <button
                    key={month}
                    type="button"
                    onClick={() => {
                      setView(new Date(view.getFullYear(), index, 1));
                      setPanel("days");
                    }}
                    className={`rounded-lg px-2 py-2.5 text-sm font-medium transition-all ${
                      active ? "text-white shadow-sm" : "text-gray-700 hover:bg-gray-100"
                    }`}
                    style={active ? { backgroundColor: "var(--brand-primary)" } : undefined}
                  >
                    {month}
                  </button>
                );
              })}
            </div>
          )}

          {panel === "years" && (
            <div key={`years-${years[0]}`} className={`grid grid-cols-3 gap-2 cal-month-${direction}`}>
              {years.map((year) => {
                const active = view.getFullYear() === year;
                return (
                  <button
                    key={year}
                    type="button"
                    onClick={() => {
                      setView(new Date(year, view.getMonth(), 1));
                      setPanel("days");
                    }}
                    className={`rounded-lg px-2 py-2.5 text-sm font-medium transition-all ${
                      active ? "text-white shadow-sm" : "text-gray-700 hover:bg-gray-100"
                    }`}
                    style={active ? { backgroundColor: "var(--brand-primary)" } : undefined}
                  >
                    {year}
                  </button>
                );
              })}
            </div>
          )}

          {panel !== "days" && (
            <button
              type="button"
              onClick={() => setPanel("days")}
              className="mt-3 w-full rounded-lg py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
            >
              Back to calendar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
