# Architecture Overview

## High-Level System Design

Khaleeji Tour uses a split **React SPA + Serverless API + Supabase PostgreSQL** architecture:

```mermaid
flowchart TB
  subgraph Client["Frontend (book-ticket / React 19 + Vite)"]
    UI["Pages & Components"]
    Hooks["TanStack Query & Custom Hooks"]
    Services["Frontend Services (Supabase + Axios)"]
  end

  subgraph Server["Serverless API (api/ + back-end/)"]
    Handlers["Vercel Serverless Handlers (api/*)"]
    AuthMW["RBAC Auth Middleware (back-end/middleware/auth.js)"]
    BizServices["Domain Services (booking, stripe, ticket, registration, email)"]
  end

  subgraph External["Managed Services"]
    Supa["Supabase (PostgreSQL + RLS + Auth + Storage)"]
    Stripe["Stripe Checkout & Webhooks"]
    Resend["Resend Email API"]
  end

  UI --> Hooks --> Services
  Services -->|"Public & RLS-protected queries"| Supa
  Services -->|"HTTPS JSON + Bearer JWT"| Handlers
  Handlers --> AuthMW --> BizServices
  BizServices -->|"Service Role RPCs"| Supa
  BizServices --> Stripe
  BizServices --> Resend
```

## Frontend Architecture (`book-ticket/src/`)

- **`pages/`**: Route-level components organized by domain (`events/`, `booking/`, `tickets/`, `auth/`, `admin/`, `legal/`, `errors/`), lazy-loaded via `React.lazy` and `Suspense` in `App.jsx` (with `HomePage` eager-loaded).
- **`components/`**: Presentational and feature components (`ui/`, `common/`, `layout/`, `seatmap/`, `booking/`, `events/`, `press-conference/`, `tickets/`, `admin/`, `auth/`).
- **`hooks/`**: Custom hooks wrapping TanStack Query (`useEvents`, `useSeatMaps`, `useBooking`, `useTickets`, `useCoupons`, `useUsers`, `useVideos`, `useRealtimeTables`).
- **`services/`**: Data-access layer separating Supabase queries and backend API calls from UI components.
- **`contexts/`**: `AuthContext` managing Supabase Auth session state and user profile roles.
- **`lib/`**: Shared configuration (`supabaseClient.js`, `queryClient.js`, `i18n.js`, `validations/authSchemas.js`, `migrations/`).

## Backend Architecture (`api/` & `back-end/`)

- **`api/`**: Vercel Serverless Function entry points (`checkout.js`, `booking.js`, `manual-booking.js`, `cleanup-expired.js`, `register-event.js`, `send-registration-confirmation.js`, `health.js`, `stripe/webhook.js`, `tickets/verify.js`, `tickets/event-attendees.js`, `cron/expire-reservations.js`).
- **`back-end/middleware/auth.js`**: Verifies Supabase JWT Bearer tokens, resolves `profiles.role`, and enforces RBAC (`admin`, `editor`, `gate_staff`) as well as `CRON_SECRET`.
- **`back-end/services/`**: Encapsulates business logic (`booking.service.js`, `stripe.service.js`, `ticket.service.js`, `registration.service.js`, `email.service.js`, `health.service.js`, `supabaseAdmin.js`).
- **`back-end/utils/pricing.js`**: Shared HST tax (13%), coupon discount math, and QR payload parsing.
- **`back-end/templates/`**: Responsive HTML and plain-text email templates.
- **`back-end/server.js`**: Express 5 wrapper for local development.
