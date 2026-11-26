# Deployment Guide

Khaleeji Tour is configured for deployment on **Vercel** via `vercel.json`.

## Vercel Configuration

- **Build Command**: `cd frontend && npm install --legacy-peer-deps && npm run build`
- **Output Directory**: `frontend/dist`
- **Serverless Functions**: Automatically discovered from `/api/**/*.js`
- **Cron Jobs**: `/api/cron/expire-reservations` scheduled daily (`0 0 * * *`)

## Required Production Environment Variables (Vercel)

Configure these in **Vercel Project Settings -> Environment Variables** (never commit them to Git):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_STRIPE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY`
- `ADMIN_NOTIFICATION_EMAILS` (comma-separated admin recipient emails)
- `FRONTEND_URL` (e.g., `https://www.khaleejitour.com`)
- `CRON_SECRET`

## Stripe Webhook Setup

1. In the Stripe Dashboard, add a webhook endpoint pointing to `https://your-domain.com/api/stripe/webhook`.
2. Subscribe to `checkout.session.completed`, `payment_intent.succeeded`, and `payment_intent.payment_failed`.
3. Copy the signing secret (`whsec_...`) into `STRIPE_WEBHOOK_SECRET` in Vercel.
