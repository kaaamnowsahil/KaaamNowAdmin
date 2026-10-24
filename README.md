# KaaamNow Admin

Admin console for the KaaamNow shift-work marketplace. Operations staff use it to monitor workers, businesses, shifts, payments and payouts, review verification requests, and resolve support tickets.

## Features

- **Overview** – marketplace metrics, activity chart, items needing attention, recent workers, activity feed and latest transactions.
- **Management** – searchable, filterable and paginated tables for workers, businesses, shifts, payments and approvals, with CSV export.
- **Payouts** – worker withdrawal queue with `pending → processing → completed` transitions.
- **Approvals** – approve or reject worker/business verification (KYC) requests.
- **Support** – track and resolve tickets raised by workers and businesses.
- **Detail pages** – dedicated views for workers, businesses and other marketplace records.
- **Admin sign-in** – email/password authentication through the backend admin login endpoint.
- **Account deletion** – server-backed request review, holds and audit history.
- Desktop-only admin layout.

Overview and marketplace management use sample data from `src/data/mockData.ts`. Admin sign-in and account-deletion requests use the backend API.

## Tech stack

- React 19 + TypeScript
- Vite
- lucide-react icons
- Montserrat font via `@fontsource/montserrat`

## Getting started

Requires Node.js 20+.

```bash
npm install
npm run dev
```

`npm run dev` uses `.env.dev` and the local API at `http://localhost:8000`. Use `npm run dev:prod` to run the UI against the production API. Admin credentials are verified by the backend and are not stored in the frontend environment files.

## Scripts

| Command                | Description                                      |
| ---------------------- | ------------------------------------------------ |
| `npm run dev`          | Start Vite using `.env.dev`                      |
| `npm run dev:prod`     | Start Vite using `.env.prod`                     |
| `npm run build`        | Type-check and build using `.env.prod`           |
| `npm run build:dev`    | Type-check and build using `.env.dev`            |
| `npm run preview`      | Preview the production build locally             |
| `npm run typecheck`    | Run the TypeScript compiler only                 |

## Project structure

```
src/
  components/   Shared UI (Sidebar, Topbar, MetricCard, StatusBadge, ...)
  constants/    Brand, colors, platform settings and route paths
  data/         Mock marketplace data
  features/     Authentication and account-deletion workflows
  hooks/        Dashboard state and actions
  layouts/      Authenticated admin layout
  pages/        Overview, Management, Payouts, Support and detail pages
  types/        Domain types (worker, business, shift, payment, payout, ...)
  utils/        CSV export, date and number formatting helpers
  api/          Backend auth, shared HTTP client and account-deletion APIs
  App.tsx       Session-aware URL routing
```

## Branches

- `main` – stable branch
- `dev` – integration branch; feature branches merge here before `main`
