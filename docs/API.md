# API Reference

All serverless endpoints live under `api/` and are served at `/api/*` on Vercel (or `http://localhost:3001/api/*` via `back-end/server.js`).

## Public & Customer Endpoints

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Public | Verifies Supabase database connectivity. |
| `POST` | `/api/cleanup-expired` | Public | Triggers cleanup of expired `PENDING` reservations before rendering seat maps. |
| `POST` | `/api/checkout` | Authenticated user | Creates atomic 15-minute table hold, applies server-verified coupon + 13% HST, and returns a Stripe Checkout URL. |
| `GET` | `/api/booking` | Public (by ID/session) | Returns booking status; falls back to Stripe session retrieval if webhook delivery is delayed. |
| `POST` | `/api/register-event` | Public | Submits press conference / event registration and sends confirmation email. |
| `POST` | `/api/send-registration-confirmation` | Public | Dispatches registration confirmation email with QR pass. |

## Protected Admin & Staff Endpoints

All protected endpoints require an `Authorization: Bearer <supabase_jwt>` header.

| Method | Endpoint | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/manual-booking` | `admin` | Creates an offline/cash booking, locks seats, issues a `KT-*` ticket, and sends confirmation email. |
| `GET` / `POST` | `/api/tickets/verify` | `admin`, `editor`, `gate_staff` | Verifies and optionally checks in a ticket or registration QR code. |
| `GET` / `POST` | `/api/tickets/event-attendees` | `admin`, `editor`, `gate_staff` | Lists attendees + live gate check-in stats (`GET`) or toggles check-in status (`POST`). |

## Webhooks & Cron

| Method | Endpoint | Verification | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/stripe/webhook` | `stripe-signature` header | Handles `checkout.session.completed`, `payment_intent.succeeded`, and `payment_intent.payment_failed`. |
| `GET` / `POST` | `/api/cron/expire-reservations` | `Authorization: Bearer <CRON_SECRET>` | Scheduled cleanup of expired reservations. |
