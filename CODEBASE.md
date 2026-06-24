# Reading the codebase

Guide for developers reviewing this repository.

## Request lifecycle

```
HTTP request
  → middleware.ts          (set x-nexus-brand-slug from hostname)
  → page or API route      (read brand via getBrandSlugFromRequest())
  → Prisma / engine        (business logic)
  → response
```

## Start here

| If you want to understand… | Read these files first |
|----------------------------|------------------------|
| Customer booking UX | `src/components/quote-form.tsx` |
| Price calculation | `src/lib/quote/engine.ts` + `engine.test.ts` |
| Database schema | `prisma/schema.prisma` |
| Multi-brand | `src/middleware.ts`, `src/lib/brand/resolve.ts` |
| Authentication | `src/lib/auth/session.ts`, `src/app/api/auth/login/route.ts` |
| Ops workflow | `src/app/dashboard/page.tsx`, `kanban-board.tsx` |
| Driver POD | `src/app/driver/driver-jobs.tsx`, `api/driver/pod/route.ts` |

## Main user flows

### 1. Quote → booking (no login)

```
quote-form onSubmit
  → POST /api/quotes
      → createQuoteRecord() in lib/quote/service.ts
      → calculateQuote() in lib/quote/engine.ts
      → prisma.quote.create()

quote-form confirmBooking
  → POST /api/bookings
      → transaction: Customer, Booking, Job
      → sendEmail()
```

### 2. Login → role-based pages

```
login/page.tsx
  → POST /api/auth/login
      → authenticateUser() (bcrypt)
      → createSession() (JWT cookie)
  → redirect: DRIVER → /driver, CUSTOMER → /account, else → /dashboard
```

### 3. Ops status updates

```
kanban-board move()
  → PATCH /api/ops/bookings
      → update booking.status
      → if INVOICED: generateInvoicePdf()
      → writeAuditLog()
```

## Quote engine pipeline

Order of operations in `calculateQuote()`:

1. Parse UK postcodes (`lib/quote/postcode.ts`)
2. Lane lookup — district, then area (`findLanePrice`)
3. Else mileage fallback (`estimateMiles` + per-mile rate)
4. Vehicle multiplier
5. Add-on surcharges (tail-lift, hiab, adr, two-person)
6. Time multipliers (urgent &lt;24h, out-of-hours, weekend)
7. Brand margin
8. Minimum job floor
9. Round up to nearest £5
10. VAT 20%

Rules loaded from DB per brand: `loadBrandPricingRules()` → `toBrandPricingRules()`.

## Data model (relationships)

```
Brand
  ├── PricingLane, PricingSurcharge, BrandPricingConfig
  ├── Quote → Booking (1:1)
  │              ├── Job (1:1)
  │              ├── Pod (0:1)
  │              └── Invoice (0:1)
  ├── User (roles)
  └── Customer → User (optional portal link)
```

## Server vs client components

| Server (`async` page, no `"use client"`) | Client (`"use client"`) |
|------------------------------------------|-------------------------|
| `dashboard/page.tsx` — DB fetch | `quote-form.tsx` — forms, API calls |
| `account/page.tsx` | `kanban-board.tsx` — status buttons |
| `driver/page.tsx` | `login/page.tsx` |
| `layout.tsx` — brand theme | `date-picker.tsx`, `time-picker.tsx` |

## UI components

Custom pickers (no heavy UI library):

- `components/ui/date-picker.tsx` — calendar, Today/Tomorrow, month/year
- `components/ui/time-picker.tsx` — 30-min slots
- `components/ui/select-dropdown.tsx` — vehicle type
- `components/ui/field-error.tsx` — animated validation

Global styles: `src/app/globals.css` — `.nexus-*` design tokens, brand CSS variables from `layout.tsx`.

## Environment variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | Yes | Pooled Postgres connection |
| `DIRECT_URL` | Yes | Direct connection (migrations) |
| `AUTH_SECRET` | Yes | JWT signing |
| `BRAND_OVERRIDE` | Dev | Force brand on localhost |
| `RESEND_API_KEY` | Prod email | Real transactional email |

## Known MVP gaps

- Pricing editor is read-only (no inline CRUD API)
- POD uses photo URL text field, not camera upload
- No single-job detail page with tabs
- No Maps API — mileage uses estimate table
- Email logs to console without Resend key
- Customer account: no booking detail page or rebook pre-fill

## Running tests

```bash
npm test
```

Tests live in `src/lib/quote/engine.test.ts` — Titan worked example + minimum floor edge case.
