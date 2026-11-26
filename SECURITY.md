# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in this repository, please report it responsibly rather than opening a public GitHub issue.

- **Contact**: Report via the project owner's portfolio contact channels at [https://ali-dev400.vercel.app/](https://ali-dev400.vercel.app/).
- Please include steps to reproduce, affected endpoints or components, and potential impact.

---

## Security Architecture & Practices

- **Environment Variables & Secrets**:
  - Frontend variables prefixed with `VITE_` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_STRIPE_PUBLISHABLE_KEY`) are intentionally public client identifiers.
  - Private credentials (`SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, `CRON_SECRET`) must only be configured in server/Vercel environment variables and never exposed to the client bundle.
- **Database Access Control**:
  - Client-side Supabase queries are governed by PostgreSQL Row-Level Security (RLS) policies defined in `book-ticket/src/lib/migrations/`.
  - Privileged operations execute through `supabaseAdmin` inside server-side endpoints.
- **Role-Based Access Control (RBAC)**:
  - Admin and gate-staff endpoints (`/api/manual-booking`, `/api/tickets/verify`, `/api/tickets/event-attendees`) verify the caller's Supabase JWT Bearer token and check their role in `profiles`.
- **Payment Integrity**:
  - Booking totals, coupon discounts, and HST tax are calculated and verified server-side.
  - Payment confirmation relies strictly on verified Stripe webhook signatures (`stripe-signature` header) or server-side Stripe session retrieval.
- **Cron Protection**:
  - Scheduled reservation cleanup (`/api/cron/expire-reservations`) supports `CRON_SECRET` Bearer verification.
