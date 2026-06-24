# NEXUS MVP

A monolithic **Next.js booking portal** for UK transport — instant postcode quotes, booking flow, operations dashboard, driver POD, and customer accounts. One codebase serves **two brands** (Deliverred Transport & Titan Cargo) with separate pricing and theming.

> Educational / portfolio project. Fictional brand names used for demonstration.

## Features

- Public quote form with custom date/time/vehicle pickers
- Rules-based quote engine (lane lookup, surcharges, VAT) with unit tests
- Booking confirmation with email hook (Resend or console in dev)
- Role-based auth: Admin, Operations, Driver, Customer
- Ops kanban dashboard (Quoted → Booked → In Transit → Delivered → Invoiced)
- Driver job status updates and proof of delivery
- Customer booking history and invoice download
- Multi-brand via request hostname / env override
- PostgreSQL schema with Prisma migrations

## Tech stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL (Neon) |
| ORM | Prisma |
| Styling | Tailwind CSS v4 |
| Auth | JWT in httpOnly cookie (jose + bcrypt) |
| Validation | Zod |
| PDF | pdfkit |
| Tests | Vitest |

## Quick start

```bash
git clone https://github.com/YOUR_USERNAME/NexusMVP.git
cd NexusMVP
npm install
cp .env.example .env
# Edit .env — add your DATABASE_URL, DIRECT_URL, AUTH_SECRET

npm run db:migrate
npm run db:seed
npm run db:seed:pricing
npm run db:seed:users
npm run dev
```

Open http://localhost:3000

## Demo accounts

After seeding, password for all users: **`Nexus2026!`**

| Email | Role | Page |
|-------|------|------|
| `customer@example.com` | Customer | `/account` |
| `ops@deliverred.co.uk` | Operations | `/dashboard` |
| `driver@deliverred.co.uk` | Driver | `/driver` |
| `admin@nexus.local` | Admin | `/dashboard`, `/admin/pricing` |

## Two brands on localhost

```env
BRAND_OVERRIDE=deliverred
# or
BRAND_OVERRIDE=titan-cargo
```

Restart `npm run dev` after changing. Header colours, company name, and pricing rules switch per brand.

## Project layout

```
src/
├── app/                    # Pages & API routes (Next.js App Router)
│   ├── page.tsx            # Public quote form (/)
│   ├── login/              # Auth
│   ├── dashboard/          # Ops kanban
│   ├── driver/             # Driver jobs & POD
│   ├── account/            # Customer portal
│   ├── admin/              # Pricing view, reports
│   └── api/                # REST endpoints
├── components/             # React UI (quote-form, pickers, fields)
├── lib/
│   ├── quote/              # Engine, postcode parser, pricing service
│   ├── auth/               # Session & roles
│   ├── brand/              # Multi-tenant brand resolution
│   ├── email/              # Transactional email
│   └── invoice/            # PDF generation
└── middleware.ts           # Brand slug on every request

prisma/
├── schema.prisma           # Full data model
├── migrations/             # Versioned SQL migrations
└── seed*.ts                # Brands, pricing, users
```

**Deep dive:** see [CODEBASE.md](./CODEBASE.md) for request flows and where to read code.

## API routes

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/quotes` | Create instant quote |
| POST | `/api/bookings` | Convert quote → booking |
| POST | `/api/auth/login` | Session login |
| POST | `/api/auth/logout` | Clear session |
| PATCH | `/api/ops/bookings` | Update booking status |
| POST/PATCH | `/api/driver/pod` | POD capture & job status |

## Scripts

```bash
npm run dev          # Development server
npm run build        # Production build
npm test             # Quote engine unit tests
npm run db:verify    # Test DB connection
npm run db:studio    # Prisma GUI
```

## Quote engine test

Brief worked example (Titan M16→B5, 18T, tail-lift) must pass:

```bash
npm test
```

Implementation: `src/lib/quote/engine.ts` — pure function, no database inside.

## Security notes

- Never commit `.env` — real credentials stay local
- Seed passwords are for **local demo only**
- `AUTH_SECRET` must be changed for any deployed environment
- CSRF / rate limiting not yet implemented (MVP scope)

## License

MIT — see [LICENSE](./LICENSE). Brand names in seeds are fictional demo data.
