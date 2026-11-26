# Contributing to Khaleeji Tour

Thank you for your interest in contributing. Please follow these guidelines to keep the codebase clean, secure, and maintainable.

## Development Workflow

1. Create a feature or fix branch from `main`.
2. Copy `frontend/.env.example` and `back-end/.env.example` to `.env` with local/test credentials only.
3. Follow the project coding conventions:
   - Functional React components with Hooks only.
   - Keep business logic out of UI components; use hooks, services, and server handlers.
   - Use Tailwind CSS semantic design tokens (`bg-background`, `text-foreground`, `bg-primary`, etc.) rather than hardcoded colors.
   - Support both English and Arabic (`react-i18next`) and RTL/LTR layouts.
4. Ensure all checks pass before opening a pull request:

```bash
cd frontend && npm run lint && npm test && npm run build
cd ../back-end && npm run lint && npm test
```

## Security Rules

- Never commit `.env` files, API keys, service-role keys, customer data, or database dumps.
- Never bypass RBAC middleware or Stripe webhook signature verification.
