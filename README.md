# TaxSentry UAE

**QFZP Status Protection for UAE Free Zone Companies**

If your company operates in a UAE free zone and benefits from the 0% corporate tax rate, you already know the risk: one bad quarter of non-qualifying income can breach the de-minimis threshold and wipe out your QFZP status for the entire year. TaxSentry monitors that threshold in real time, so you find out about a problem in week 3 — not when your auditor does.

---

## The Problem

Under Cabinet Decision 100/2023, a Qualifying Free Zone Person (QFZP) must keep Non-Qualifying Income (NQI) below **5% of total revenue** in any tax period. That sounds simple until you're tracking hundreds of transactions across Zoho, Xero, or manual spreadsheets and trying to know at any given moment whether you're at 3.1% or 5.3%.

Most finance teams find out they've breached after the fact. TaxSentry flips that — every transaction is classified on entry, the threshold is recalculated live, and alerts go out before the breach becomes a tax liability.

---

## What It Does

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         TAXSENTRY PLATFORM                              │
│                                                                         │
│   Revenue In   ──▶   Classification   ──▶   De-Minimis    ──▶  Risk    │
│  (CSV / manual)       (QI / NQI /           Threshold           Score  │
│                        EXCLUDED)            5% Watch            0–100  │
│                            │                    │                  │   │
│                            ▼                    ▼                  ▼   │
│                     Audit Trail           Alerts (INFO/        Reports │
│                     (immutable)           AMBER/RED)           (PDF)   │
└─────────────────────────────────────────────────────────────────────────┘
```

### Core features

- **De-minimis monitor** — live NQI% against the 5% ceiling, per tax period
- **Revenue classifier** — auto-classifies transactions using 19 activity codes from Cabinet Decision 100/2023; lets finance override with a full audit trail
- **Risk score** — weekly snapshots across five factors (de-minimis exposure, substance docs, classification confidence, related-party concentration, audit readiness)
- **Substance vault** — encrypted document storage for trade licenses, lease agreements, payroll registers, board minutes — everything an FTA audit expects
- **Alert engine** — triggers at configurable thresholds; email notifications via Resend; snooze or acknowledge from the dashboard
- **Compliance report** — PDF export with QI/NQI breakdown, risk score, and substance checklist, formatted for auditor handoff
- **Immutable audit log** — every action (who, what, before, after) is recorded and locked; AUDITOR role gets read-only access

---

## System Architecture

```mermaid
graph TB
    subgraph Client ["Browser / Client"]
        FE["Next.js 14<br/>App Router"]
    end

    subgraph Auth ["Auth Layer"]
        CL["Clerk<br/>(Email + MFA)"]
    end

    subgraph API ["Backend — Render"]
        NE["NestJS + Fastify"]
        CE["Classification<br/>Engine"]
        DE["De-Minimis<br/>Engine"]
        RE["Risk Engine"]
        AE["Alert Engine<br/>(cron)"]
    end

    subgraph Data ["Data Layer — Supabase"]
        PG[("PostgreSQL")]
        ST["Object Storage<br/>(private bucket)"]
    end

    subgraph Ext ["External Services"]
        RS["Resend<br/>(email)"]
        DP["DodoPayments<br/>(billing)"]
    end

    FE -->|"JWT"| NE
    FE <-->|"auth"| CL
    CL -->|"webhook"| NE
    NE --> CE
    NE --> DE
    NE --> RE
    NE --> AE
    NE <--> PG
    NE <--> ST
    AE --> RS
    FE --> DP
    DP -->|"webhook"| NE
```

---

## Compliance Flow

How a revenue transaction turns into a compliance signal:

```mermaid
flowchart TD
    A["Transaction entered\n(manual or CSV import)"] --> B{"Classification\nEngine"}
    B -->|"Matches rule"| C["Auto-classified\nQI / NQI / EXCLUDED"]
    B -->|"No rule match"| D["Flagged UNCLASSIFIED\n→ requires manual review"]
    C --> E{"Finance override?"}
    D --> F["Finance reviews\nand classifies manually"]
    F --> G["Override logged\n(before + after state)"]
    E -->|"Yes"| G
    E -->|"No"| H["De-Minimis Engine\nrecalculates NQI%"]
    G --> H
    H --> I{"NQI% vs 5% ceiling"}
    I -->|"< 4%"| J["GREEN — no action"]
    I -->|"4–5%"| K["AMBER alert\nnotify finance team"]
    I -->|"> 5%"| L["RED alert\nQFZP status at risk"]
    J --> M["Risk Score updated\n(weekly snapshot)"]
    K --> M
    L --> M
    M --> N["Dashboard + Reports"]
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), React 18, Tailwind CSS |
| State / data fetching | Zustand, TanStack Query |
| Forms | React Hook Form + Zod |
| Auth | Clerk (email, OTP, MFA) |
| Backend | NestJS 10, Fastify adapter |
| Database | PostgreSQL (Supabase), Prisma ORM |
| File storage | Supabase Object Storage (private, signed URLs) |
| Email | Resend |
| Billing | DodoPayments (Merchant of Record) |
| Deployment | Vercel (frontend), Render (API, Docker) |
| CI | GitHub Actions (test, lint, secret scan, Docker build) |

Financial amounts use `Decimal(15,2)` throughout — no floating-point rounding in AED calculations.

---

## Getting Started

### Prerequisites

- Node.js >= 20
- npm >= 10
- A [Supabase](https://supabase.com) project (free tier works)
- A [Clerk](https://clerk.com) application
- A [Resend](https://resend.com) API key

### Install

```bash
git clone https://github.com/ashucfx/tax-sentry-uae.git
cd tax-sentry-uae
npm install
```

### Environment setup

```bash
cp .env.example .env.local
# Fill in DATABASE_URL, CLERK_*, SUPABASE_*, RESEND_API_KEY, JWT_SECRET
```

The `.env.example` file documents every variable with comments.

### Database

```bash
cd apps/api

# Run migrations (uses DATABASE_URL_UNPOOLED — session mode)
npx prisma migrate dev --name init

# Seed the 19 activity codes from Cabinet Decision 100/2023
npm run db:seed
```

### Run locally

```bash
# From the repo root — starts both API (:3001) and web (:3000) concurrently
npm run dev
```

- Frontend: http://localhost:3000  
- API: http://localhost:3001/api/v1  
- Swagger docs: http://localhost:3001/api/docs

---

## Project Structure

```
tax-sentry-uae/
├── apps/
│   ├── api/                    # NestJS backend
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── auth/       # Clerk webhook sync, JWT issuance
│   │   │   │   ├── revenue/    # Transaction CRUD + classification overrides
│   │   │   │   ├── classification/  # Rules engine
│   │   │   │   ├── deminimis/  # 5% threshold calculation
│   │   │   │   ├── risk/       # Multi-factor risk scoring
│   │   │   │   ├── alerts/     # Trigger, notify, snooze
│   │   │   │   ├── substance/  # Document vault (Supabase Storage)
│   │   │   │   ├── reports/    # PDF + CSV export
│   │   │   │   ├── billing/    # DodoPayments webhooks
│   │   │   │   └── audit/      # Immutable action log
│   │   │   └── common/         # Guards, interceptors, decorators
│   │   └── prisma/
│   │       ├── schema.prisma   # Data model
│   │       └── seed.ts         # Activity catalog seed
│   │
│   └── web/                    # Next.js frontend
│       └── src/
│           ├── app/
│           │   ├── (marketing)/  # Landing, pricing, demo, legal
│           │   └── (platform)/   # Dashboard, transactions, alerts,
│           │                     # reports, billing, settings, audit log
│           ├── components/
│           └── lib/
│               ├── api/         # Axios client
│               └── hooks/       # React Query hooks
│
└── packages/
    └── shared/                  # Shared types (monorepo)
```

---

## Supported Free Zones

DMCC · JAFZA · IFZA · DIFC · ADGM · RAKEZ · DWC · SHAMS · MEYDAN

---

## Roles & Access

| Role | Access |
|---|---|
| OWNER | Full access, billing, user management |
| FINANCE | Read/write transactions, classification overrides |
| VIEWER | Read-only dashboard |
| AUDITOR | Audit log + read-only compliance data |

MFA is enforced for OWNER and FINANCE roles.

---

## Useful Commands

```bash
# Database
npm run db:migrate          # Apply pending migrations
npm run db:studio           # Prisma Studio GUI

# Testing
npm run test:unit           # Unit tests
npm run test:integration    # Integration tests (needs running DB)
npm run test:cov            # Coverage

# Lint
npm run lint

# Production build
npm run build
```

---

## Deployment

The stack deploys for free during development:

| Service | Provider | Cost |
|---|---|---|
| Frontend | Vercel | Free |
| API | Render (Docker) | Free (spin-down) / $7/mo (always-on) |
| Database | Supabase | Free up to 500MB |
| Auth | Clerk | Free up to 10k MAU |
| Email | Resend | Free up to 3k/month |

The Render service uses the multi-stage `Dockerfile` at `apps/api/Dockerfile`. Docker context is the repo root (Prisma schema lives under `apps/api/prisma/`).

Health check endpoint: `GET /api/v1/health`

---

## License

MIT
