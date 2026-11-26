# Development Guide

## Prerequisites

- **Node.js**: v20 or higher
- **npm**: v10 or higher
- **Supabase**: Project URL + Anon Key + Service Role Key (for backend)
- **Stripe**: Test mode Publishable Key, Secret Key, and Webhook Signing Secret
- **Resend**: API Key for email testing

## Setup

1. Install dependencies in all packages:

```bash
npm install
cd frontend && npm install --legacy-peer-deps
cd ../back-end && npm install
```

2. Create local `.env` files from the provided templates:

```bash
cp frontend/.env.example frontend/.env
cp back-end/.env.example back-end/.env
```

3. Start the backend and frontend servers:

```bash
# Terminal 1
cd back-end && npm run dev

# Terminal 2
cd frontend && npm run dev
```

## Available Scripts

### Frontend (`frontend/`)
- `npm run dev` — Start Vite development server (`http://localhost:5173`)
- `npm run build` — Build production bundle + run `scripts/generate-seo.js`
- `npm run lint` — Run `oxlint`
- `npm run format:check` — Check Prettier formatting
- `npm test` — Run unit tests (`node --test tests/*.test.js`)

### Backend (`back-end/`)
- `npm run dev` / `npm start` — Start local Express server (`http://localhost:3001`)
- `npm run lint` — Run `oxlint`
- `npm test` — Run unit tests (`node --test tests/*.test.js`)

## Troubleshooting

- **Seat map cleanup or checkout fails locally**: Ensure `back-end` is running on port `3001` and `VITE_API_BASE_URL=http://localhost:3001` is set in `frontend/.env`.
- **SEO post-build skips Supabase**: If `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` is not set, `generate-seo.js` safely generates static pages without failing the build.
