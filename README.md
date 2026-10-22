# KaaamNow Admin

Admin console for the KaaamNow shift-work marketplace. Operations staff use it to monitor workers, businesses, shifts, payments and payouts, review verification requests, and resolve support tickets.

## Features

- **Overview** – marketplace metrics, activity chart, items needing attention, recent workers, activity feed and latest transactions.
- **Management** – searchable, filterable and paginated tables for workers, businesses, shifts, payments and approvals, with CSV export.
- **Payouts** – worker withdrawal queue with `pending → processing → completed` transitions.
- **Approvals** – approve or reject worker/business verification (KYC) requests.
- **Support** – track and resolve tickets raised by workers and businesses.
- **Detail pages** – dedicated views for workers, businesses and other marketplace records.
- **Localization** – English, Hindi and Kannada, with a language switcher (choice saved in `localStorage`).
- Responsive layout with a collapsible sidebar.

The app currently runs on mock data from `src/data/mockData.ts`; there is no backend integration yet.

## Tech stack

- React 19 + TypeScript
- Vite
- i18next / react-i18next
- lucide-react icons
- Montserrat font via `@fontsource/montserrat`

## Getting started

Requires Node.js 20+.

```bash
npm install
npm run dev
```

## Scripts

| Command             | Description                          |
| ------------------- | ------------------------------------ |
| `npm run dev`       | Start the Vite dev server            |
| `npm run build`     | Type-check and build to `dist/`      |
| `npm run preview`   | Preview the production build locally |
| `npm run typecheck` | Run the TypeScript compiler only     |

## Project structure

```
src/
  components/   Shared UI (Sidebar, Topbar, MetricCard, StatusBadge, ...)
  constants/    Brand, colors, platform settings and route paths
  data/         Mock marketplace data
  pages/        Overview, Management, Payouts, Support and detail pages
  types/        Domain types (worker, business, shift, payment, payout, ...)
  utils/        CSV export, date and number formatting helpers
  i18n.ts       Translations (en, hi, kn) and i18next setup
  App.tsx       App shell, navigation and state
```

## Branches

- `main` – stable branch
- `dev` – integration branch; feature branches merge here before `main`
