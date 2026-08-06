# CreatorIQ Frontend

React + TypeScript + Vite application for the CreatorIQ creator intelligence platform.

For full project setup (backend, API keys, architecture), see the **[root README](../README.md)**.

---

## Quick start

```powershell
cd frontend
npm install
```

Create `.env`:

```env
VITE_API_URL=http://localhost:8000/v1
```

Start dev server:

```powershell
npm run dev
```

Open **http://localhost:5173**

Ensure the backend is running (`backend/scripts/docker-up.ps1`).

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server with HMR (`:5173`) |
| `npm run build` | Typecheck + production build → `dist/` |
| `npm run preview` | Serve production build locally |
| `npm run lint` | ESLint |

---

## Project layout

```
src/
├── App.tsx                 # Router definitions
├── index.css               # Tailwind + design tokens
├── components/
│   ├── ui/                 # Button, Card, PageHeader, StatCard, …
│   ├── marketing/          # MarketingHero, MarketingSection, …
│   └── organisms/          # Navbar, Footer, PublicLayout
├── features/
│   ├── dashboard/
│   ├── trends/             # TrendsPage, TrendDetailPage, FeedHistoryDrawer
│   ├── strategy/
│   ├── planner/
│   ├── analytics/
│   ├── onboarding/
│   └── settings/
├── layouts/
│   └── MainLayout.tsx      # App shell (sidebar + header)
├── pages/                  # Landing, Auth, Pricing, Product, …
├── stores/                 # Zustand (auth, trends, strategy, …)
└── lib/
    ├── api.ts              # Axios + JWT refresh
    └── strategyTopic.ts    # Topic sanitization for strategy
```

---

## Key routes

| Path | Component |
|------|-----------|
| `/` | LandingPage |
| `/login`, `/signup` | AuthPage |
| `/onboarding` | OnboardingWizard |
| `/app/trends` | TrendsPage |
| `/app/trends/detail/:trendId` | TrendDetailPage |
| `/app/strategy` | StrategyPage |
| `/app/dashboard` | DashboardPage |
| `/app/analytics` | AnalyticsPage |
| `/app/planner` | PlannerPage |
| `/app/settings` | SettingsPage |

---

## Stack

- **React 19** + **TypeScript**
- **Vite 8**
- **React Router 7**
- **Zustand** — client state
- **TanStack Query** — server state (where used)
- **Tailwind CSS 4** — styling
- **Framer Motion** — onboarding / auth animations
- **Lucide React** — icons
- **Axios** — HTTP client
- **React Hook Form** + **Zod** — forms

---

## Environment

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:8000/v1` | Backend API gateway base URL |

---

## Design system

Shared UI primitives live in `src/components/ui/`:

- **Card** — variants: `default`, `elevated`, `glass`, `dark`
- **Button** — `primary` (gradient glow), `secondary`, `ghost`, `danger`
- **PageHeader** — page title, description, actions slot
- **StatCard**, **MiniBarChart** — dashboard / analytics

Global CSS utilities in `index.css`: `surface-app`, `surface-glass`, `text-gradient-brand`, `btn-primary-glow`, etc.

---

## Trends ↔ Strategy flow

1. User clicks **Strategy** on a trend card in `TrendsPage`
2. Topic is sanitized (hashtags/pipes stripped) via `sanitizeStrategyTopic()`
3. Router navigates to `/app/strategy` with `{ topic, autoGenerate: true }`
4. `StrategyPage` calls `useStrategyStore.generateBrief()`
5. Brief renders: titles, insight, script outline, SEO tags

---

## Build for production

```powershell
npm run build
```

Output in `dist/`. Deploy to any static host (Vercel, Netlify, etc.) with `VITE_API_URL` set to your production API.
