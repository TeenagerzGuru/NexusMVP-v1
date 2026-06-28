"use client";

import { useMemo, useState, type CSSProperties } from "react";

import { fetchJson } from "@/lib/fetch-json";
import type { BrandTheme } from "@/lib/brand/types";

type BrandPricing = {
  slug: string;
  brandId: string;
  name: string;
  colours: BrandTheme;
  lanes: Array<{
    id: string;
    matchLevel: string;
    originCode: string;
    destinationCode: string;
    vehicleType: string;
    basePrice: number;
    label: string | null;
  }>;
  surcharges: Array<{ id: string; addonType: string; valueType: string; value: number }>;
  config: { marginMultiplier: number; minimumJobValue: number } | null;
};

const ADDON_LABELS: Record<string, string> = {
  TAIL_LIFT: "Tail lift",
  HIAB: "Hiab",
  ADR: "ADR",
  TWO_PERSON: "Two person",
};

export function PricingEditor({ brands }: { brands: BrandPricing[] }) {
  const [activeSlug, setActiveSlug] = useState(brands[0]?.slug ?? "");
  const [data, setData] = useState(brands);
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const brand = useMemo(() => data.find((b) => b.slug === activeSlug) ?? data[0], [data, activeSlug]);
  const activeColours = brand?.colours;

  const themeStyle = activeColours
    ? ({
        "--pt-primary": activeColours.primary,
        "--pt-secondary": activeColours.secondary,
        "--pt-accent": activeColours.accent,
        "--pt-background": activeColours.background,
      } as CSSProperties)
    : undefined;

  async function saveLane(laneId: string, basePrice: number) {
    setSaving(laneId);
    setMessage(null);
    const { ok, data: res } = await fetchJson<{ error?: string }>("/api/admin/pricing", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "lane", id: laneId, basePrice }),
    });
    setSaving(null);
    if (!ok) {
      setMessage(res.error ?? "Failed to save lane");
      return;
    }
    setMessage("Lane price saved — applies to new quotes immediately.");
  }

  async function saveSurcharge(surchargeId: string, value: number) {
    setSaving(surchargeId);
    setMessage(null);
    const { ok, data: res } = await fetchJson<{ error?: string }>("/api/admin/pricing", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "surcharge", id: surchargeId, value }),
    });
    setSaving(null);
    if (!ok) {
      setMessage(res.error ?? "Failed to save surcharge");
      return;
    }
    setMessage("Surcharge saved.");
  }

  async function saveConfig(brandId: string, marginMultiplier: number, minimumJobValue: number) {
    setSaving(`config-${brandId}`);
    setMessage(null);
    const { ok, data: res } = await fetchJson<{ error?: string }>("/api/admin/pricing", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "config", brandId, marginMultiplier, minimumJobValue }),
    });
    setSaving(null);
    if (!ok) {
      setMessage(res.error ?? "Failed to save config");
      return;
    }
    setMessage("Brand settings saved.");
  }

  function updateLanePrice(laneId: string, basePrice: number) {
    setData((prev) =>
      prev.map((b) =>
        b.slug !== activeSlug
          ? b
          : { ...b, lanes: b.lanes.map((lane) => (lane.id === laneId ? { ...lane, basePrice } : lane)) },
      ),
    );
  }

  function updateSurcharge(surchargeId: string, value: number) {
    setData((prev) =>
      prev.map((b) =>
        b.slug !== activeSlug
          ? b
          : {
              ...b,
              surcharges: b.surcharges.map((s) => (s.id === surchargeId ? { ...s, value } : s)),
            },
      ),
    );
  }

  function updateConfig(marginMultiplier: number, minimumJobValue: number) {
    setData((prev) =>
      prev.map((b) =>
        b.slug !== activeSlug
          ? b
          : {
              ...b,
              config: b.config ? { ...b.config, marginMultiplier, minimumJobValue } : b.config,
            },
      ),
    );
  }

  if (!brand || !activeColours) return null;

  return (
    <div className="admin-pricing-theme" style={themeStyle}>
      <div className="admin-pricing-brand-strip" aria-hidden />

      <div className="admin-pricing-brand-chip">
        <span className="admin-pricing-swatch" style={{ background: activeColours.primary }} />
        <span className="admin-pricing-swatch" style={{ background: activeColours.accent }} />
        <span className="admin-pricing-swatch" style={{ background: activeColours.secondary }} />
        <span className="admin-pricing-brand-chip-label">Editing {brand.name}</span>
      </div>

      <div className="admin-info-banner admin-pricing-banner">
        <p className="font-medium">How pricing flows to quotes</p>
        <ol className="mt-2 list-decimal space-y-1 pl-4 text-sm opacity-90">
          <li>Customer enters postcodes → engine looks up a <strong>lane</strong> (route + vehicle).</li>
          <li>If no lane → price = road miles × per-mile rate (from seed config).</li>
          <li>Add <strong>surcharges</strong>, time multipliers, then × <strong>margin</strong> and minimum floor.</li>
          <li>Changes here apply to the <strong>next quote</strong> — existing quotes are unchanged.</li>
        </ol>
      </div>

      {message && (
        <div className="animate-fade-in admin-pricing-toast px-4 py-3 text-sm">{message}</div>
      )}

      <div className="admin-brand-tabs admin-pricing-tabs">
        {data.map((b) => (
          <button
            key={b.slug}
            type="button"
            data-brand-slug={b.slug}
            className={`admin-brand-tab admin-pricing-tab ${b.slug === activeSlug ? "admin-brand-tab-active" : ""}`}
            onClick={() => setActiveSlug(b.slug)}
          >
            <span className="admin-pricing-tab-dot" style={{ background: b.colours.primary }} />
            {b.name}
            <span className="admin-brand-tab-count">{b.lanes.length} lanes</span>
          </button>
        ))}
      </div>

      <div className="admin-pricing-content space-y-6">
        {brand.config && (
          <section className="admin-panel admin-pricing-panel">
            <div className="admin-panel-header">
              <h2 className="admin-panel-title admin-pricing-title">Brand settings</h2>
              <p className="admin-panel-subtitle">Applied after lane price and surcharges</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <label className="admin-field">
                <span>Margin multiplier</span>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  max="5"
                  className="nexus-input admin-pricing-input"
                  value={brand.config.marginMultiplier}
                  onChange={(e) => updateConfig(Number(e.target.value), brand.config!.minimumJobValue)}
                />
              </label>
              <label className="admin-field">
                <span>Minimum job value (£)</span>
                <input
                  type="number"
                  step="1"
                  min="0"
                  className="nexus-input admin-pricing-input"
                  value={brand.config.minimumJobValue}
                  onChange={(e) => updateConfig(brand.config!.marginMultiplier, Number(e.target.value))}
                />
              </label>
              <div className="flex items-end">
                <button
                  type="button"
                  className="nexus-btn admin-pricing-btn-primary w-full sm:w-auto"
                  disabled={saving === `config-${brand.brandId}`}
                  onClick={() =>
                    saveConfig(brand.brandId, brand.config!.marginMultiplier, brand.config!.minimumJobValue)
                  }
                >
                  {saving === `config-${brand.brandId}` ? "Saving…" : "Save brand settings"}
                </button>
              </div>
            </div>
          </section>
        )}

        <section className="admin-panel admin-pricing-panel">
          <div className="admin-panel-header">
            <h2 className="admin-panel-title admin-pricing-title">Lane prices</h2>
            <p className="admin-panel-subtitle">Fixed base price when route + vehicle match</p>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table admin-pricing-table">
              <thead>
                <tr>
                  <th>Route</th>
                  <th>Vehicle</th>
                  <th>Base price (£)</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {brand.lanes.map((lane) => (
                  <tr key={lane.id}>
                    <td>
                      <span className="admin-lane-badge admin-pricing-lane-badge">{lane.matchLevel}</span>
                      <span className="font-medium text-gray-900">
                        {lane.originCode} → {lane.destinationCode}
                      </span>
                      {lane.label && <p className="text-xs text-gray-500">{lane.label}</p>}
                    </td>
                    <td>{lane.vehicleType.replace("_", ".")}</td>
                    <td>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="nexus-input admin-pricing-input max-w-[120px]"
                        value={lane.basePrice}
                        onChange={(e) => updateLanePrice(lane.id, Number(e.target.value))}
                      />
                    </td>
                    <td className="text-right">
                      <button
                        type="button"
                        className="admin-save-btn admin-pricing-save-btn"
                        disabled={saving === lane.id}
                        onClick={() => saveLane(lane.id, lane.basePrice)}
                      >
                        {saving === lane.id ? "…" : "Save"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="admin-panel admin-pricing-panel">
          <div className="admin-panel-header">
            <h2 className="admin-panel-title admin-pricing-title">Add-on surcharges</h2>
            <p className="admin-panel-subtitle">Flat fees added on top of lane / mileage price</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {brand.surcharges.map((surcharge) => (
              <div key={surcharge.id} className="admin-surcharge-card admin-pricing-surcharge">
                <p className="font-medium text-gray-900">
                  {ADDON_LABELS[surcharge.addonType] ?? surcharge.addonType}
                </p>
                <p className="text-xs text-gray-500">{surcharge.valueType}</p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-sm text-gray-500">£</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="nexus-input admin-pricing-input flex-1"
                    value={surcharge.value}
                    onChange={(e) => updateSurcharge(surcharge.id, Number(e.target.value))}
                  />
                  <button
                    type="button"
                    className="admin-save-btn admin-pricing-save-btn"
                    disabled={saving === surcharge.id}
                    onClick={() => saveSurcharge(surcharge.id, surcharge.value)}
                  >
                    {saving === surcharge.id ? "…" : "Save"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
