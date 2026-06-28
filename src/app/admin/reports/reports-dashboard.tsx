"use client";

import { useMemo, useState, type CSSProperties } from "react";

import type { BrandSlug, BrandTheme } from "@/lib/brand/types";
import type { ReportMetrics } from "@/lib/reports/metrics";
import { formatMoney } from "@/lib/utils";

export type { ReportMetrics };

type BrandFilter = "all" | BrandSlug;

type BrandOption = {
  slug: BrandSlug;
  name: string;
  colours: BrandTheme;
};

const FILTERS: Array<{ slug: BrandFilter; label: string }> = [
  { slug: "all", label: "All brands" },
  { slug: "deliverred", label: "Deliverred" },
  { slug: "titan-cargo", label: "Titan Cargo" },
];

const ALL_THEME: BrandTheme = {
  primary: "#1f2937",
  secondary: "#4b5563",
  accent: "#7c8db5",
  background: "#f9fafb",
};

function filterLabel(slug: BrandFilter, brands: BrandOption[]): string {
  if (slug === "all") return "All brands (combined)";
  return brands.find((b) => b.slug === slug)?.name ?? slug;
}

export function ReportsDashboard({
  isAdmin,
  initialBrand,
  brands,
  metrics,
}: {
  isAdmin: boolean;
  initialBrand: BrandFilter;
  brands: BrandOption[];
  metrics: Partial<Record<BrandFilter, ReportMetrics>>;
}) {
  const [active, setActive] = useState<BrandFilter>(initialBrand);

  const activeTheme = active === "all" ? ALL_THEME : brands.find((b) => b.slug === active)?.colours ?? ALL_THEME;
  const current = metrics[active] ?? {
    weekCount: 0,
    monthCount: 0,
    monthValue: 0,
    conversionRate: 0,
    avgMargin: 0,
    topCustomers: [],
  };

  const visibleFilters = isAdmin ? FILTERS : FILTERS.filter((f) => f.slug !== "all");

  const themeStyle = {
    "--pt-primary": activeTheme.primary,
    "--pt-secondary": activeTheme.secondary,
    "--pt-accent": activeTheme.accent,
    "--pt-background": activeTheme.background,
  } as CSSProperties;

  const cards = useMemo(
    () => [
      { title: "Jobs this week", value: String(current.weekCount) },
      { title: "Jobs this month", value: String(current.monthCount) },
      { title: "Month value", value: formatMoney(current.monthValue) },
      { title: "Quote → booking (7d)", value: `${current.conversionRate}%` },
      { title: "Avg margin / job", value: formatMoney(current.avgMargin) },
    ],
    [current],
  );

  function selectBrand(slug: BrandFilter) {
    if (!isAdmin || slug === active) return;
    setActive(slug);
    const url = slug === "all" ? "/admin/reports" : `/admin/reports?brand=${slug}`;
    window.history.replaceState(null, "", url);
  }

  const subtitle = filterLabel(active, brands);

  return (
    <div className="admin-pricing-theme" style={themeStyle}>
      <div className="admin-pricing-brand-strip" aria-hidden />

      <div className="admin-pricing-brand-chip">
        {active === "all" ? (
          <>
            {brands.map((b) => (
              <span
                key={b.slug}
                className="admin-pricing-swatch"
                style={{ background: b.colours.primary }}
              />
            ))}
          </>
        ) : (
          <>
            <span className="admin-pricing-swatch" style={{ background: activeTheme.primary }} />
            <span className="admin-pricing-swatch" style={{ background: activeTheme.accent }} />
            <span className="admin-pricing-swatch" style={{ background: activeTheme.secondary }} />
          </>
        )}
        <span className="admin-pricing-brand-chip-label">Viewing {subtitle}</span>
      </div>

      {isAdmin && (
      <div className="admin-brand-tabs admin-pricing-tabs">
        {visibleFilters.map((filter) => {
          const brandColours = brands.find((b) => b.slug === filter.slug)?.colours;
          return (
            <button
              key={filter.slug}
              type="button"
              data-filter-slug={filter.slug}
              className={`admin-brand-tab admin-pricing-tab ${filter.slug === active ? "admin-brand-tab-active" : ""}`}
              onClick={() => selectBrand(filter.slug)}
            >
              {filter.slug === "all" ? (
                <span className="admin-pricing-tab-dot admin-reports-tab-dot-all" aria-hidden />
              ) : (
                brandColours && (
                  <span
                    className="admin-pricing-tab-dot"
                    style={{ background: brandColours.primary }}
                  />
                )
              )}
              {filter.label}
            </button>
          );
        })}
      </div>
      )}

      <div className="admin-pricing-content">
        <p className="mb-5 text-sm text-gray-500 transition-colors duration-500" style={{ color: "var(--pt-secondary)" }}>
          Performance — {subtitle}
        </p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <div key={card.title} className="admin-stat-card admin-reports-stat-card">
              <p className="admin-stat-label">{card.title}</p>
              <p className="admin-stat-value admin-reports-stat-value">{card.value}</p>
            </div>
          ))}
        </div>

        {active === "all" && isAdmin && (
          <section className="admin-panel admin-pricing-panel mt-6">
            <h2 className="admin-panel-title admin-pricing-title">By brand</h2>
            <p className="admin-panel-subtitle">Side-by-side comparison this month</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {brands.map((b) => {
                const row = metrics[b.slug];
                if (!row) return null;
                return (
                  <div key={b.slug} className="admin-surcharge-card admin-reports-brand-card">
                    <p className="flex items-center gap-2 font-semibold text-gray-900">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full"
                        style={{ background: b.colours.primary }}
                      />
                      {b.name}
                    </p>
                    <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <dt className="text-gray-500">Week jobs</dt>
                        <dd className="font-bold text-gray-900">{row.weekCount}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">Month jobs</dt>
                        <dd className="font-bold text-gray-900">{row.monthCount}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">Month value</dt>
                        <dd className="font-bold admin-reports-brand-value">{formatMoney(row.monthValue)}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">Conversion (7d)</dt>
                        <dd className="font-bold text-gray-900">{row.conversionRate}%</dd>
                      </div>
                    </dl>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <section className="admin-panel admin-pricing-panel mt-6">
          <h2 className="admin-panel-title admin-pricing-title">Top customers</h2>
          <p className="admin-panel-subtitle">
            {active === "all" ? "Combined booking volume by contact" : `Bookings via ${subtitle}`}
          </p>
          <ul className="mt-4 divide-y divide-gray-100">
            {current.topCustomers.length === 0 && (
              <li className="py-8 text-center text-sm text-gray-500">No bookings yet for this filter.</li>
            )}
            {current.topCustomers.map(([name, count], i) => (
              <li key={name} className="flex items-center justify-between py-3 text-sm">
                <span className="font-medium text-gray-900">
                  <span className="admin-reports-rank-badge mr-2">{i + 1}</span>
                  {name}
                </span>
                <span className="admin-reports-count-badge">{count} bookings</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
