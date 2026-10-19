# Kabos: frontend

The web app for Kabos, a cocoa operations and financial management system for
Cameroonian cocoa companies. It handles purchases from farmers and field
buyers, buyer prefinancing, stock, deliveries, the till, expenses, payroll and
the audit log. A platform side covers enterprises, subscriptions and plans.

It is one responsive Progressive Web App for every role (platform admin,
boss, office staff, cashier, inventory, field buyer), on desktop and phone.
There is no separate mobile build.

The backend is a separate Spring Boot project (CoMS). This repository holds
only the frontend.

## Stack

- React 19, TypeScript, Vite
- Tailwind CSS v4 with shadcn/ui-style components (Radix UI), lucide-react icons
- TanStack Query for server state, Zustand for small client state
- react-hook-form for forms
- react-router-dom (data router)
- i18next / react-i18next, English and French
- Recharts and Nivo for charts, framer-motion for motion
- vite-plugin-pwa for the service worker and manifest

## Getting started

Requirements: Node.js 20 or later (developed on Node 24), and the backend
running locally (by default on `http://localhost:8080`).

```bash
npm install
cp .env.example .env.local    # then adjust VITE_API_BASE_URL if needed
npm run dev                   # http://localhost:5173, also on the LAN (--host)
```

The first platform admin account is created by the backend's seeder. Sign in
with it, create an enterprise, and its boss receives an invitation email.

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server with hot reload, reachable from other devices on the network |
| `npm run build` | Type-checks, then builds to `dist/` with the service worker and manifest |
| `npm run preview` | Serves the production build locally |
| `npm run lint` | ESLint |
| `npm run generate-pwa-assets` | Regenerates the app icons from `public/cocoa.svg` |

## Configuration

Settings come from Vite environment variables. `.env.example` lists every one
with its default; copy it to `.env.local`, which git ignores. Every variable
is optional: a missing or invalid value falls back to the default in
`src/constants/env.ts`. Vite inlines them at build time, so restart
`npm run dev` or rebuild after a change.

| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | Where the backend API lives, e.g. `http://localhost:8080/api`. Paths such as `/v1/users` are appended to it. |
| `VITE_APP_NAME`, `VITE_APP_FULL_NAME`, `VITE_APP_VERSION` | Name and version shown in the app |
| `VITE_DEFAULT_CURRENCY` | Currency for amounts (`XAF`) |
| `VITE_PAGE_SIZE` and the other `*_SIZE` values | Page sizes of lists and dashboards |
| `VITE_*_STALE_MS`, `VITE_QUERY_*` | How long fetched data is reused before refetching |
| `VITE_TOAST_*`, `VITE_TOKEN_EXPIRY_SKEW_MS` | Notification durations and token refresh margin |

The backend must allow the frontend's origin in its CORS settings. The links
in emails sent by the backend (account invitations) point to its
`COMS_APP_URL`, which should be this app's address.

## Project structure

```
i18n.ts          i18next setup: merges every locale file, detects the language
src/
  api/           One module per backend resource; routes.ts holds every endpoint path
  components/    Shared components; components/ui/ holds the design-system primitives
  constants/     Settings read from env.ts, password rules, page sizes
  enums/         Mirrors of the backend's enums (permissions, roles, statuses)
  features/      One folder per business area (procurement, finance, partners, …)
  interfaces/    Request and response types shared across features
  lib/           API client, formatting, validation, toast helpers
  locales/       en/ and fr/: one JSON file per feature
  routes/        Router and the permission guard
  shared/        App shell (layout, navigation), shared hooks, status labels
  store/         Small client-side stores (auth tokens, UI flags)
docs/            Notes on how the frontend lines up with the backend API
public/          Icons, logo and the screenshots used on the home page
```

`src/features/` follows the backend's modules, so the screen that shows a rule
and the code that enforces it are easy to find side by side.

## Languages

The app is in English and French. French is the fallback: most users work in
French, so an unconfigured browser should get the right language.

- Language detection order is the saved choice (`localStorage`), then the
  browser's language.
- Each feature has its texts in `src/locales/en/<feature>.json` and
  `src/locales/fr/<feature>.json`. All files are merged into one bundle in
  `i18n.ts`, so a key's file does not matter to the code that uses it.
- No user-visible text is written directly in a component; everything goes
  through `t()`, including status labels (`src/shared/status.ts`).
- Requests send the current language (`Accept-Language`), so emails the
  backend sends on a user's behalf are in that language.

When adding a feature's texts in a new file, add the file to both languages and
import the pair in `i18n.ts`.

## Access control

What a user sees depends on their permissions (sent by the backend at sign-in)
and, for business pages, on belonging to a company.

- Routes are guarded in `src/routes/router.tsx` with `withPermissions([...])`,
  or `forEnterprise([...])` for pages the platform admin has no use for.
- Navigation entries in `src/shared/layout/nav-config.ts` declare the same
  permissions, so a link only shows when its page would open.
- This only decides what is shown. The backend checks every request again; a
  hidden button is never the protection.

## Public pages

These work without signing in:

| Path | Page |
|---|---|
| `/` | Home page |
| `/offers` | Plans and prices |
| `/login` | Sign in (`?username=` pre-fills the username) |
| `/accept-invite?token=…` | Opened from an invitation email: the person chooses their password |

## Adding a screen

1. Build it under `src/features/<area>/`.
2. Add its API calls to `src/api/` and its endpoint paths to `src/api/routes.ts`.
3. Add the route in `src/routes/router.tsx` with the permissions it needs.
4. Add the navigation entry to `src/shared/layout/nav-config.ts` with the same permissions.
5. Put its texts in `src/locales/en/` and `src/locales/fr/`.

## Notes

- The service worker updates itself (`registerType: "autoUpdate"` in
  `vite.config.ts`): a new deployment is picked up on the next load.
- The online/offline badge reflects the browser's connection only. Whether the
  backend can be reached is a separate question, answered by the requests
  themselves.
