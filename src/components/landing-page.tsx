import Link from "next/link";

import { QuoteForm } from "@/components/quote-form";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import type { ResolvedBrand } from "@/lib/brand/types";

const SERVICES = [
  {
    title: "Full & part loads",
    description: "Dedicated HGV capacity from 7.5T to artic — palletised or loose goods across the UK.",
    icon: "truck",
  },
  {
    title: "Express & same-day",
    description: "Urgent collections within 24 hours with transparent time-based surcharges built into your quote.",
    icon: "clock",
  },
  {
    title: "Tail lift & hiab",
    description: "Ground-level delivery where there is no forklift — add-ons priced instantly at quote stage.",
    icon: "lift",
  },
  {
    title: "ADR & hazardous",
    description: "Compliant carriage for regulated goods with certified drivers and documented handling.",
    icon: "shield",
  },
  {
    title: "Two-person crew",
    description: "Extra hands for heavy or awkward freight — ideal for retail fit-outs and machinery moves.",
    icon: "crew",
  },
  {
    title: "Proof of delivery",
    description: "Digital POD with photos and signatures — visible to ops and customers in the portal.",
    icon: "pod",
  },
] as const;

const STEPS = [
  {
    step: "01",
    title: "Get an instant quote",
    description: "Enter postcodes, vehicle type and collection window. Road distance and price in seconds.",
  },
  {
    step: "02",
    title: "Book online",
    description: "Confirm with your details — booking reference issued immediately with email confirmation.",
  },
  {
    step: "03",
    title: "Track to delivery",
    description: "Ops assign your job, driver updates status, and POD is captured on completion.",
  },
] as const;

function ServiceIcon({ name }: { name: string }) {
  const className = "h-6 w-6";
  switch (name) {
    case "truck":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
        </svg>
      );
    case "clock":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case "lift":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
        </svg>
      );
    case "shield":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
      );
    case "crew":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
      );
    default:
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      );
  }
}

function brandCopy(brand: ResolvedBrand) {
  if (brand.slug === "titan-cargo") {
    return {
      tagline: "UK freight forwarding, priced in real time",
      hero:
        "Lane-based pricing, carrier allocation and customer booking — one platform for Titan Cargo's nationwide network.",
      badge: "Freight forwarder",
      highlights: [
        { value: "UK-wide", label: "Carrier network" },
        { value: "HGV", label: "7.5T – Artic" },
        { value: "< 2s", label: "Instant quotes" },
        { value: "POD", label: "Digital delivery proof" },
      ],
      coverage:
        "Popular corridors include North West ↔ Midlands, Merseyside ↔ Manchester and nationwide ad-hoc lanes. Quotes use road-distance routing where no fixed lane applies.",
    };
  }

  return {
    tagline: "Reliable UK road freight, quoted instantly",
    hero:
      "Own-fleet HGV logistics with transparent pricing — from collection postcode to delivery, with live road miles and itemised breakdown.",
    badge: "FORS-accredited operator",
    highlights: [
      { value: "UK-wide", label: "Collection & delivery" },
      { value: "HGV", label: "7.5T – Artic fleet" },
      { value: "< 2s", label: "Instant quotes" },
      { value: "24/7", label: "Urgent options" },
    ],
    coverage:
      "Serving manufacturers, distributors and retailers across England, Wales and Scotland. Core lanes include Manchester, Birmingham, Liverpool and London corridors.",
  };
}

export function LandingPage({ brand }: { brand: ResolvedBrand }) {
  const copy = brandCopy(brand);

  return (
    <div className="landing">
      {/* Hero */}
      <section className="landing-hero relative overflow-hidden">
        <div className="landing-hero-bg" aria-hidden>
          <div className="landing-hero-blob landing-hero-blob-1" />
          <div className="landing-hero-blob landing-hero-blob-2" />
          <div className="landing-hero-blob landing-hero-blob-3" />
        </div>
        <div className="landing-hero-mesh" aria-hidden />
        <div className="landing-hero-grid" aria-hidden />

        <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-12 sm:pb-28 sm:pt-16">
          <div className="animate-fade-in-up max-w-3xl">
            <span className="landing-badge">{copy.badge}</span>
            <h2 className="mt-5 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
              {copy.tagline}
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/80">{copy.hero}</p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#quote" className="landing-cta-primary">
                Get instant quote
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </a>
              <a href="#how-it-works" className="landing-cta-secondary">
                How it works
              </a>
            </div>
          </div>

          <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {copy.highlights.map((item, i) => (
              <div
                key={item.label}
                className="landing-stat animate-fade-in-up"
                style={{ animationDelay: `${120 + i * 80}ms` }}
              >
                <p className="text-2xl font-bold text-white sm:text-3xl">{item.value}</p>
                <p className="mt-1 text-xs font-medium uppercase tracking-wider text-white/60">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:py-20" id="services">
        <ScrollReveal>
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: "var(--brand-secondary)" }}>
              What we move
            </p>
            <h3 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Full-load logistics services
            </h3>
            <p className="mx-auto mt-3 max-w-2xl text-gray-600">
              Palletised freight, machinery, retail roll-outs and time-critical deliveries — priced upfront with
              optional add-ons.
            </p>
          </div>
        </ScrollReveal>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((service, i) => (
            <ScrollReveal key={service.title} delay={i * 60}>
              <article className="landing-service-card group h-full">
                <div
                  className="landing-service-icon"
                  style={{
                    background: `color-mix(in srgb, var(--brand-accent) 25%, white)`,
                    color: "var(--brand-primary)",
                  }}
                >
                  <ServiceIcon name={service.icon} />
                </div>
                <h4 className="mt-4 text-lg font-semibold text-gray-900">{service.title}</h4>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{service.description}</p>
              </article>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="landing-band" id="how-it-works">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
          <ScrollReveal>
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: "var(--brand-secondary)" }}>
                Simple process
              </p>
              <h3 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Quote to delivery in three steps
              </h3>
            </div>
          </ScrollReveal>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {STEPS.map((item, i) => (
              <ScrollReveal key={item.step} delay={i * 100}>
                <div className="landing-step relative">
                  <span className="landing-step-number">{item.step}</span>
                  <h4 className="mt-4 text-xl font-semibold text-gray-900">{item.title}</h4>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">{item.description}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Coverage + trust */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <ScrollReveal>
            <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: "var(--brand-secondary)" }}>
              Coverage
            </p>
            <h3 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">Nationwide UK road freight</h3>
            <p className="mt-4 leading-relaxed text-gray-600">{copy.coverage}</p>

            <ul className="mt-8 space-y-3">
              {[
                "Lane pricing for high-volume corridors",
                "Road-distance routing for ad-hoc routes",
                "VAT-inclusive quotes with full breakdown",
                "Weekend, out-of-hours and urgent surcharges shown upfront",
              ].map((line) => (
                <li key={line} className="flex items-start gap-3 text-sm text-gray-700">
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ background: "var(--brand-primary)" }}
                  >
                    ✓
                  </span>
                  {line}
                </li>
              ))}
            </ul>
          </ScrollReveal>

          <ScrollReveal delay={120}>
            <div className="landing-trust-panel">
              <h4 className="text-lg font-semibold text-gray-900">Why book with {brand.name}?</h4>
              <dl className="mt-6 space-y-5">
                <div>
                  <dt className="font-medium text-gray-900">Transparent pricing</dt>
                  <dd className="mt-1 text-sm text-gray-600">
                    Every surcharge — vehicle, add-on, time and margin — itemised before you commit.
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-900">Operational visibility</dt>
                  <dd className="mt-1 text-sm text-gray-600">
                    Bookings flow to ops dashboard, driver app and customer portal from one system.
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-900">Professional invoicing</dt>
                  <dd className="mt-1 text-sm text-gray-600">
                    VAT-registered ({brand.vatNumber}). Net-zero terms after delivery unless credit agreed.
                  </dd>
                </div>
              </dl>
              {brand.contactPhone && (
                <p className="mt-6 border-t border-gray-100 pt-5 text-sm text-gray-600">
                  Need help? Call{" "}
                  <a href={`tel:${brand.contactPhone}`} className="font-medium" style={{ color: "var(--brand-primary)" }}>
                    {brand.contactPhone}
                  </a>{" "}
                  or email{" "}
                  <a href={`mailto:${brand.contactEmail}`} className="font-medium" style={{ color: "var(--brand-primary)" }}>
                    {brand.contactEmail}
                  </a>
                </p>
              )}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Quote */}
      <section className="landing-quote-section" id="quote">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:py-20">
          <ScrollReveal>
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: "var(--brand-accent)" }}>
                Instant pricing
              </p>
              <h3 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Get your quote now
              </h3>
              <p className="mx-auto mt-3 max-w-lg text-white/70">
                UK postcode to postcode · real road miles · book in the same flow
              </p>
            </div>
          </ScrollReveal>

          <div className="mt-10">
            <QuoteForm embedded />
          </div>
        </div>
      </section>

      {/* CTA strip */}
      <section className="border-t border-black/5 bg-white py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row">
          <p className="text-center text-sm text-gray-600 sm:text-left">
            Staff member? Access ops dashboard, driver jobs and pricing tools.
          </p>
          <Link href="/login" className="landing-cta-outline">
            Staff login
          </Link>
        </div>
      </section>
    </div>
  );
}
