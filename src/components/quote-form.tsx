"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

import { RouteMapSkeleton } from "@/components/route-map-preview";
import { Button } from "@/components/ui/button";
import { Card, CardSkeleton } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { Field, Input, Textarea } from "@/components/ui/field";
import { SelectDropdown } from "@/components/ui/select-dropdown";
import { TimePicker } from "@/components/ui/time-picker";
import { fetchJson } from "@/lib/fetch-json";
import { email, hasErrors, required, type FieldErrors } from "@/lib/form-validation";
import { parseUkPostcode } from "@/lib/quote/postcode";
import type { RoutePreview } from "@/lib/quote/route-preview";
import type { QuoteAddon } from "@/lib/quote/types";
import { VEHICLE_TYPES } from "@/lib/quote/types";
import { formatMoney } from "@/lib/utils";

const ADDONS: QuoteAddon[] = ["tail-lift", "hiab", "adr", "two-person"];

const RouteMapPreview = dynamic(
  () => import("@/components/route-map-preview").then((mod) => mod.RouteMapPreview),
  { ssr: false, loading: () => <RouteMapSkeleton /> },
);

type QuoteField = "originPostcode" | "destinationPostcode" | "collectionDate" | "collectionTime" | "vehicleType";
type BookingField = "contactName" | "contactEmail";

type QuoteResult = {
  id: string;
  reference: string;
  priceExVat: number;
  priceIncVat: number;
  vatAmount: number;
  distanceMiles?: number;
  distanceSource?: "openrouteservice" | "estimate";
  durationMinutes?: number | null;
  breakdown: Array<{ step: string; description: string; runningTotal: number }>;
};

/** Public quote + booking wizard — mounts client-only to dodge extension hydration noise. */
export function QuoteForm({ embedded = false }: { embedded?: boolean }) {
  const [loading, setLoading] = useState(false);
  const [quote, setQuote] = useState<QuoteResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [bookingRef, setBookingRef] = useState<string | null>(null);
  const [minDate, setMinDate] = useState("");
  const [mounted, setMounted] = useState(false);
  const [vehicleType, setVehicleType] = useState<string>(VEHICLE_TYPES[0]);
  const [collectionDate, setCollectionDate] = useState("");
  const [collectionTime, setCollectionTime] = useState("14:00");
  const [quoteErrors, setQuoteErrors] = useState<FieldErrors<QuoteField>>({});
  const [bookingErrors, setBookingErrors] = useState<FieldErrors<BookingField>>({});
  const [shakeKey, setShakeKey] = useState(0);
  const [originPostcode, setOriginPostcode] = useState("");
  const [destinationPostcode, setDestinationPostcode] = useState("");
  const [routePreview, setRoutePreview] = useState<RoutePreview | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);

  function clearQuoteError(field: QuoteField) {
    setQuoteErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  function clearBookingError(field: BookingField) {
    setBookingErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  /** Client-side gate before hitting /api/quotes — stateful fields validated separately from FormData. */
  function validateQuoteForm(form: FormData): FieldErrors<QuoteField> {
    const errors: FieldErrors<QuoteField> = {};
    const origin = String(form.get("originPostcode") ?? "");
    const destination = String(form.get("destinationPostcode") ?? "");

    const originError = required(origin, "Please enter a collection postcode.");
    if (originError) errors.originPostcode = originError;

    const destinationError = required(destination, "Please enter a delivery postcode.");
    if (destinationError) errors.destinationPostcode = destinationError;

    if (!collectionDate) errors.collectionDate = "Please select a collection date.";
    if (!collectionTime) errors.collectionTime = "Please select a collection time.";
    if (!vehicleType) errors.vehicleType = "Please select a vehicle type.";

    return errors;
  }

  /** Second-step validation on the booking contact form. */
  function validateBookingForm(form: FormData): FieldErrors<BookingField> {
    const errors: FieldErrors<BookingField> = {};
    const nameError = required(String(form.get("contactName") ?? ""), "Please enter your name.");
    if (nameError) errors.contactName = nameError;

    const emailError = email(String(form.get("contactEmail") ?? ""));
    if (emailError) errors.contactEmail = emailError;

    return errors;
  }

  useEffect(() => {
    setMounted(true);
    const today = new Date().toISOString().slice(0, 10);
    setMinDate(today);
    setCollectionDate(today);
  }, []);

  useEffect(() => {
    const origin = originPostcode.trim();
    const destination = destinationPostcode.trim();

    if (origin.length < 5 || destination.length < 5) {
      setRoutePreview(null);
      setRouteLoading(false);
      return;
    }

    try {
      parseUkPostcode(origin);
      parseUkPostcode(destination);
    } catch {
      setRoutePreview(null);
      setRouteLoading(false);
      return;
    }

    setRouteLoading(true);
    const timer = window.setTimeout(async () => {
      try {
        const params = new URLSearchParams({ origin, dest: destination });
        const { data, ok } = await fetchJson<RoutePreview & { error?: string }>(
          `/api/route-preview?${params}`,
        );
        if (ok) setRoutePreview(data);
        else setRoutePreview(null);
      } catch {
        setRoutePreview(null);
      } finally {
        setRouteLoading(false);
      }
    }, 650);

    return () => window.clearTimeout(timer);
  }, [originPostcode, destinationPostcode]);

  /** Quote step — validates, POSTs quote, renders breakdown on success. */
  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setBookingRef(null);

    const form = new FormData(event.currentTarget);
    const errors = validateQuoteForm(form);
    if (hasErrors(errors)) {
      setQuoteErrors(errors);
      setShakeKey((k) => k + 1);
      const first = Object.keys(errors)[0] as QuoteField;
      event.currentTarget.querySelector<HTMLElement>(`[data-field="${first}"]`)?.focus();
      return;
    }
    setQuoteErrors({});

    setLoading(true);
    const addons = ADDONS.filter((addon) => form.get(addon) === "on");

    try {
      const { data, ok } = await fetchJson<QuoteResult & { error?: string }>("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originPostcode: form.get("originPostcode"),
          destinationPostcode: form.get("destinationPostcode"),
          vehicleType,
          collectionDate,
          collectionTime,
          addons,
          goodsDescription: form.get("goodsDescription") || undefined,
        }),
      });
      if (!ok) throw new Error(data.error ?? "Quote failed");
      setQuote(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Quote failed");
    } finally {
      setLoading(false);
    }
  }

  /** Booking step — ties quote to customer record and fires confirmation email. */
  async function confirmBooking(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!quote) return;
    setError(null);

    const form = new FormData(event.currentTarget);
    const errors = validateBookingForm(form);
    if (hasErrors(errors)) {
      setBookingErrors(errors);
      setShakeKey((k) => k + 1);
      const first = Object.keys(errors)[0] as BookingField;
      event.currentTarget.querySelector<HTMLElement>(`[data-field="${first}"]`)?.focus();
      return;
    }
    setBookingErrors({});

    setLoading(true);

    try {
      const { data, ok } = await fetchJson<{ reference: string; error?: string }>("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quoteId: quote.id,
          contactName: form.get("contactName"),
          contactEmail: form.get("contactEmail"),
          contactPhone: form.get("contactPhone") || undefined,
          contactCompany: form.get("contactCompany") || undefined,
          customerReference: form.get("customerReference") || undefined,
          specialInstructions: form.get("specialInstructions") || undefined,
        }),
      });
      if (!ok) throw new Error(data.error ?? "Booking failed");
      setBookingRef(data.reference);
      setQuote(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Booking failed");
    } finally {
      setLoading(false);
    }
  }

  if (!mounted) return <CardSkeleton />;

  return (
    <div className="space-y-6">
      {bookingRef && (
        <Card className="animate-scale-in border-green-200 bg-green-50 text-green-900">
          <p className="text-lg font-semibold">Booking confirmed</p>
          <p className="mt-1 font-mono text-sm">{bookingRef}</p>
          <p className="mt-2 text-sm text-green-800">
            Confirmation email sent. We invoice on net-zero terms after delivery.
          </p>
        </Card>
      )}

      {!quote && (
        <Card className={`animate-fade-in-up ${embedded ? "landing-quote-card" : ""}`}>
          {!embedded && (
            <>
              <h2 className="text-2xl font-bold" style={{ color: "var(--brand-primary)" }}>
                Get an instant quote
              </h2>
              <p className="mt-1 text-sm text-gray-500">Postcode to postcode · under 2 seconds</p>
            </>
          )}

          <form onSubmit={onSubmit} noValidate className={embedded ? "space-y-5" : "mt-6 space-y-5"}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Collection postcode" error={quoteErrors.originPostcode}>
                <Input
                  key={quoteErrors.originPostcode ? `origin-shake-${shakeKey}` : "origin"}
                  name="originPostcode"
                  data-field="originPostcode"
                  placeholder="M16 9PW"
                  value={originPostcode}
                  invalid={!!quoteErrors.originPostcode}
                  onChange={(event) => {
                    setOriginPostcode(event.target.value);
                    clearQuoteError("originPostcode");
                  }}
                />
              </Field>
              <Field label="Delivery postcode" error={quoteErrors.destinationPostcode}>
                <Input
                  key={quoteErrors.destinationPostcode ? `dest-shake-${shakeKey}` : "dest"}
                  name="destinationPostcode"
                  data-field="destinationPostcode"
                  placeholder="B5 4AA"
                  value={destinationPostcode}
                  invalid={!!quoteErrors.destinationPostcode}
                  onChange={(event) => {
                    setDestinationPostcode(event.target.value);
                    clearQuoteError("destinationPostcode");
                  }}
                />
              </Field>
            </div>

            {(routeLoading || routePreview) && (
              <div className="relative">
                {routeLoading && routePreview && (
                  <div className="route-map-updating" aria-hidden>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  </div>
                )}
                {routeLoading && !routePreview ? (
                  <RouteMapSkeleton />
                ) : routePreview ? (
                  <RouteMapPreview route={routePreview} />
                ) : null}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Collection date" error={quoteErrors.collectionDate}>
                <DatePicker
                  key={quoteErrors.collectionDate ? `date-shake-${shakeKey}` : "date"}
                  name="collectionDate"
                  data-field="collectionDate"
                  value={collectionDate}
                  onChange={(value) => {
                    setCollectionDate(value);
                    clearQuoteError("collectionDate");
                  }}
                  min={minDate || undefined}
                  invalid={!!quoteErrors.collectionDate}
                />
              </Field>
              <Field label="Collection time" error={quoteErrors.collectionTime}>
                <TimePicker
                  key={quoteErrors.collectionTime ? `time-shake-${shakeKey}` : "time"}
                  name="collectionTime"
                  data-field="collectionTime"
                  value={collectionTime}
                  onChange={(value) => {
                    setCollectionTime(value);
                    clearQuoteError("collectionTime");
                  }}
                  invalid={!!quoteErrors.collectionTime}
                />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Vehicle type" error={quoteErrors.vehicleType}>
                  <SelectDropdown
                    key={quoteErrors.vehicleType ? `vehicle-shake-${shakeKey}` : "vehicle"}
                    name="vehicleType"
                    data-field="vehicleType"
                    value={vehicleType}
                    onChange={(value) => {
                      setVehicleType(value);
                      clearQuoteError("vehicleType");
                    }}
                    options={VEHICLE_TYPES.map((type) => ({ value: type, label: type }))}
                    invalid={!!quoteErrors.vehicleType}
                  />
                </Field>
              </div>
            </div>

            <fieldset>
              <legend className="mb-2 text-sm font-medium text-gray-700">Add-ons</legend>
              <div className="flex flex-wrap gap-3">
                {ADDONS.map((addon) => (
                  <label
                    key={addon}
                    className="addon-chip flex cursor-pointer items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm capitalize"
                  >
                    <input type="checkbox" name={addon} className="accent-[var(--brand-primary)]" />
                    {addon.replace("-", " ")}
                  </label>
                ))}
              </div>
            </fieldset>

            <Field label="Goods description (optional)">
              <Textarea name="goodsDescription" rows={2} />
            </Field>

            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Calculating…
                </span>
              ) : (
                "Get quote"
              )}
            </Button>
          </form>
        </Card>
      )}

      {quote && (
        <div className="animate-fade-in-up space-y-4">
          {routePreview && <RouteMapPreview route={routePreview} />}
          <Card
            className={`overflow-hidden ${embedded ? "landing-quote-card" : ""}`}
            style={{ borderTopWidth: 4, borderTopColor: "var(--brand-accent)" }}
          >
            <p className="text-sm text-gray-500">Quote {quote.reference}</p>
            <p className="mt-2 text-4xl font-bold tracking-tight" style={{ color: "var(--brand-primary)" }}>
              {formatMoney(quote.priceIncVat)}
            </p>
            <p className="text-sm text-gray-600">
              {formatMoney(quote.priceExVat)} ex VAT + {formatMoney(quote.vatAmount)} VAT
            </p>
            {quote.distanceMiles != null && (
              <p className="mt-2 text-sm text-gray-500">
                Route: {quote.distanceMiles} miles
                {quote.durationMinutes != null ? ` · ~${quote.durationMinutes} min drive` : ""}
                {quote.distanceSource === "openrouteservice" ? " (road, HGV)" : " (estimated)"}
              </p>
            )}
            <ul className="mt-5 space-y-2 border-t border-gray-100 pt-4 text-sm text-gray-600">
              {quote.breakdown.map((step, i) => (
                <li
                  key={step.step}
                  className="animate-fade-in flex justify-between gap-4"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <span>{step.description}</span>
                  <span className="font-medium text-gray-900">{formatMoney(step.runningTotal)}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card className={`animate-fade-in-up stagger-2 ${embedded ? "landing-quote-card" : ""}`}>
            <h3 className="text-lg font-semibold">Confirm booking</h3>
            <form onSubmit={confirmBooking} noValidate className="mt-5 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Your name" error={bookingErrors.contactName}>
                  <Input
                    key={bookingErrors.contactName ? `name-shake-${shakeKey}` : "name"}
                    name="contactName"
                    data-field="contactName"
                    invalid={!!bookingErrors.contactName}
                    onChange={() => clearBookingError("contactName")}
                  />
                </Field>
                <Field label="Email" error={bookingErrors.contactEmail}>
                  <Input
                    key={bookingErrors.contactEmail ? `email-shake-${shakeKey}` : "email"}
                    name="contactEmail"
                    data-field="contactEmail"
                    type="email"
                    invalid={!!bookingErrors.contactEmail}
                    onChange={() => clearBookingError("contactEmail")}
                  />
                </Field>
                <Field label="Phone">
                  <Input name="contactPhone" />
                </Field>
                <Field label="Company">
                  <Input name="contactCompany" />
                </Field>
                <Field label="Your reference (optional)">
                  <Input name="customerReference" />
                </Field>
              </div>
              <Field label="Special instructions">
                <Textarea name="specialInstructions" rows={2} />
              </Field>
              <div className="flex flex-wrap gap-3">
                <Button type="submit" disabled={loading}>
                  {loading ? "Confirming…" : "Confirm booking"}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setQuote(null)}>
                  Back
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {error && (
        <div className="animate-fade-in rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}
