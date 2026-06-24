"use client";

import { useRef, useState } from "react";

import { useClickOutside, useEscapeKey } from "@/components/ui/use-click-outside";

type Option = { value: string; label: string };

/** Animated vehicle/options select — hidden input keeps native form field names working. */
export function SelectDropdown({
  options,
  value,
  onChange,
  placeholder = "Select…",
  name,
  invalid,
  "data-field": dataField,
}: {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  name?: string;
  invalid?: boolean;
  "data-field"?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useClickOutside(ref, () => setOpen(false));
  useEscapeKey(() => setOpen(false), open);

  return (
    <div ref={ref} className="relative">
      {name && <input type="hidden" name={name} value={value} readOnly />}
      <button
        type="button"
        data-field={dataField}
        onClick={() => setOpen((prev) => !prev)}
        className={`nexus-input flex w-full items-center justify-between gap-2 text-left transition-all ${
          invalid ? "nexus-input-invalid" : ""
        } ${
          open && !invalid ? "border-[var(--brand-accent)] shadow-[0_0_0_3px_color-mix(in_srgb,var(--brand-accent)_35%,transparent)]" : ""
        }`}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className={selected ? "text-gray-900" : "text-gray-400"}>
          {selected?.label ?? placeholder}
        </span>
        <svg
          className={`h-4 w-4 shrink-0 text-gray-500 transition-transform duration-300 ease-out ${open ? "rotate-180" : ""}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      <div
        className={`popover-panel absolute z-50 mt-2 w-full origin-top ${open ? "popover-open" : "popover-closed pointer-events-none"}`}
        role="listbox"
      >
        <ul className="max-h-60 overflow-auto rounded-xl border border-gray-200 bg-white py-1 shadow-xl">
          {options.map((option, i) => {
            const isSelected = option.value === value;
            return (
              <li key={option.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={`popover-item flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-colors ${
                    isSelected
                      ? "bg-[color-mix(in_srgb,var(--brand-accent)_20%,white)] font-semibold text-gray-900"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                  style={{ animationDelay: open ? `${i * 25}ms` : "0ms" }}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                >
                  {option.label}
                  {isSelected && (
                    <svg className="h-4 w-4 text-[var(--brand-primary)]" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
