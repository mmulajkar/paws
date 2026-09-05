# Paws Log

A shared, cloud-backed dog-sitting tracker: dogs, their owners, and their stays (dates, drop-off/pick-up times, daily rate, and payment status), usable from a phone, tablet, or desktop by more than one signed-in person at once.

This app replaces an earlier single-file, single-device prototype (`DogSittingTracker.jsx`, using an in-browser `window.storage` API) with a real client/server application: a Postgres database behind Supabase, email/password authentication, and a mobile-first, accessible UI, plus a full automated test suite.

## Features

- **Dashboard** — at-a-glance tiles (current dogs, upcoming stays, days this month, earnings this month), plus the dogs currently being cared for and what's coming up next.
- **Dogs** — a searchable list and a full profile per dog: basic info, owner, feeding, walking, special instructions, allergies/medications/medical notes, and an optional photo.
- **Stays** — create/edit/delete a stay for a dog with dates, drop-off/pick-up times, daily rate, and amount paid; a list view (filterable by current/upcoming/completed, searchable) and a calendar view.
- **History** — every completed stay, with its payment status, searchable by dog or owner.
- **Payments** — total amount (daily rate × number of days) and remaining balance are computed automatically; payment status (Not Paid / Partially Paid / Paid) is shown as a labeled badge everywhere, never by color alone, with a one-tap "Mark paid."
- **Authentication** — email/password sign-in via Supabase Auth; every other route is protected and redirects to `/login` when signed out.
- **Mobile-first** — a bottom tab bar on phones (not a shrunk desktop nav), cards instead of cramped tables, no horizontal scrolling, and 44px-minimum touch targets throughout.
- **Accessible** — every field has a real label, icon-only buttons have `aria-label`s, errors are announced, focus is visible and trapped correctly in modals, and status is always shown as text + badge.

## Tech stack

- **Frontend:** React 18 + Vite + Tailwind CSS, React Router v6
- **Backend:** Supabase (Postgres + Auth + Storage)
- **Testing:** Vitest + React Testing Library (unit/component/integration), Playwright (E2E, including mobile device emulation)
- **CI/CD:** GitHub Actions → Vercel

## Project structure

```
src/
  components/       DogForm, StayForm, AppShell, CalendarView, ui/ (design-system primitives)
  pages/            Login, Dashboard, Dogs, DogProfile, Stays, History
  services/         Supabase data access — the ONLY files that import the Supabase client
  hooks/            useAuth, useOwners, useDogs, useStays, useAppData (loading/error/state + optimistic updates)
  utils/            Pure, unit-tested calculation logic (dates, payments, stay status)
tests/
  unit/             Calculation utilities, with fixed/injected dates — never the real clock
  components/       React Testing Library tests for forms, dashboard, list pages
  integration/      Full add-dog / create-stay workflows through the real hooks + mocked services
e2e/
  fixtures/         mockSupabase.js — intercepts Supabase Auth/REST calls with an in-memory fake DB
  *.spec.js         Playwright specs: login, full workflow, mobile viewports, accessibility
supabase/
  migrations/       0001_init.sql — schema, RLS policies, storage bucket
```

## Installation

```bash
npm install
```

## Environment variables

Copy `.env.example` to `.env` and fill in your Supabase project's values:

```
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-project's-anon-public-key>
```

`.env` is gitignored — never commit real credentials. Two other env files already exist in the repo and are safe to commit because they hold no real secrets:

- `.env.test` — dummy values used only by Vitest (component tests need *some* value for the Supabase client to construct without throwing; no network call is ever made).
- `.env.e2e` — a fixed fake Supabase URL (`https://e2e-test.supabase.co`) that Playwright's mock fixture intercepts; used only to serve the app for E2E tests.

## Supabase setup

1. Create a new project at [supabase.com](https://supabase.com).
2. Open the SQL Editor and run `supabase/migrations/0001_init.sql`. This creates the `owners`, `dogs`, and `stays` tables with their constraints and indexes, row-level-security policies that require an authenticated session, and the `dog-photos` storage bucket with its access policies.
3. Copy the project's URL and anon public key (Project Settings → API) into `.env`.

### Authentication setup

This is a small shared-team app — every signed-in user sees and edits the same data (RLS policies check `auth.role() = 'authenticated'`, not per-row ownership).

1. In the Supabase dashboard, go to Authentication → Providers and confirm Email is enabled.
2. Under Authentication → Users, manually add one user per authorized person (for example, the daughter doing the day-to-day work, and a parent) with an email and password. There is no public sign-up page in this app by design — accounts are provisioned by whoever administers the Supabase project.
3. If you want to skip Supabase's "confirm your email" step for accounts you create yourself, either confirm them from the dashboard or disable email confirmations under Authentication → Settings for this project.

The app starts with an empty database — there is no migration from the old prototype. Add the real dogs, owners, and stays directly through the app once it's deployed (see "Deployment" below).

## Running locally

```bash
npm run dev
```

Opens at `http://localhost:5173`. Sign in with one of the accounts created above.

## Testing

| Command | What it runs |
|---|---|
| `npm run lint` | ESLint, zero warnings allowed |
| `npm run test` | Unit + component + integration tests (Vitest) |
| `npm run test:coverage` | Same, plus a coverage report (`coverage/`) |
| `npm run test:e2e` | Full Playwright E2E suite, all projects |
| `npm run test:e2e:mobile` | E2E suite restricted to Mobile Chrome, Mobile Safari, and Tablet projects |
| `npx playwright test --grep "@smoke"` | Just the fast mobile smoke subset |

**Unit tests** (`tests/unit/`) cover every date, payment, and stay-status calculation against the spec's own worked examples (e.g. Sep 5 → Sep 10 is 5 days; $50/day × 5 days = $250; a same-day stay bills as a minimum of 1 day; Not Paid/Partially Paid/Paid transitions) using fixed, injected dates — never the real system clock.

**Component tests** (`tests/components/`) exercise `DogForm`, `StayForm`, `Dashboard`, and the `Dogs` list with React Testing Library: validation messages match the spec's wording exactly (e.g. "End date must be on or after the start date."), computed totals render correctly, and empty/loading states show the right call to action.

**Integration tests** (`tests/integration/`) render the real `AppShell` + hooks + forms together, with only the Supabase-calling services layer mocked, and drive the actual add-a-dog and create-a-stay workflows end to end — asserting on the resulting UI (the new dog/stay appears, with the right owner and totals), not just that a function was called.

**End-to-end tests** (`e2e/`) run the built app in a real browser via Playwright. Nothing talks to a real Supabase project: `e2e/fixtures/mockSupabase.js` intercepts every Auth/REST call the app makes and serves it from a small in-memory database that's fresh for every test — this is what "dedicated test data, never run against production data" means in practice here. Specs cover:
- `login.spec.js` — sign-in, a wrong password, required-field validation, redirect-back-after-login, protected routes, sign-out.
- `dog-sitting-workflow.spec.js` — the full business flow: add a dog, create a stay, see it on the dashboard with the right totals, mark it paid, a past stay showing correctly in History, a future stay showing under Upcoming (not Current) — using Playwright's clock emulation to fix "today," so stay-status logic is tested deterministically rather than depending on the date the tests happen to run.
- `mobile-viewports.spec.js` — the explicit set of phone/tablet sizes below, checked for horizontal overflow, touch-target size, correct nav chrome (bottom tabs vs. top bar), and that the add-dog form fits on screen.
- `accessibility.spec.js` — keyboard-only login, a visible focus outline, and that icon-only buttons expose a real accessible name.

### Mobile testing — what was actually run

Per-viewport checks (login/dashboard fit without horizontal scroll, correct nav chrome, add-dog form fit) were run at all five sizes below, each through **Chromium** (Android-class devices; Playwright drives these with the Chromium engine):

| Size | Represents |
|---|---|
| 375×667 | iPhone SE-class |
| 390×844 | iPhone 12/13/14-class |
| 412×915 | Pixel-class |
| 360×800 | Small Android |
| 768×1024 | Tablet |

**Result: 81/81 E2E tests passed** across the "Desktop Chrome," "Mobile Chrome," and "Tablet" Playwright projects (all Chromium-driven) when run serially (`--workers=1`). Two of the sandbox's iterations under 2-worker parallelism showed a single flaky timeout on the same test (a button click during heavy CPU contention on this sandbox's 2 virtual CPUs) — not a functional defect; it did not reproduce serially or in isolation. CI runs with `retries: 1`, which absorbs exactly this class of flake.

**What was *not* run here:** the "Mobile Safari" project (WebKit engine, iOS device emulation) is fully configured in `playwright.config.js` but this sandbox has only a Chromium browser binary installed — there is no WebKit binary available, so those tests could not execute at all in this environment. `npm run test:e2e:mobile` (which includes Mobile Safari) will run correctly in GitHub Actions (the CI workflow installs both `chromium` and `webkit`) or on any machine after `npx playwright install webkit`. **Real-device testing on an actual iPhone/Android phone was not performed** — device emulation is a strong proxy but not a substitute, and is recommended before the daughter starts relying on this daily, especially once a WebKit run confirms Safari-specific behavior in CI.

### Actual test results (last run in this environment)

- `npm run lint` — **0 errors, 0 warnings.**
- `npm run test` — **62/62 passed** (16 date-calculation + 13 payment-calculation + 14 stay-status unit tests; 15 component tests across DogForm/StayForm/Dashboard/Dogs; 4 integration tests across the add-dog and create-stay workflows).
- `npm run test:coverage` — utils (the calculation logic the spec cares most about being correct) at 91% statements; components exercised by tests in the 74–95% range; the thin Supabase-calling services layer is comparatively low in *unit*-test coverage because it's exercised instead at the E2E layer through the mocked network boundary, not through unit mocks of the Supabase client.
- `npm run build` — **succeeds** (`dist/`, ~451KB main bundle, ~127KB gzipped).
- `npm run test:e2e` (Desktop Chrome + Mobile Chrome + Tablet — the projects runnable in this sandbox) — **81/81 passed** run serially; Mobile Safari not executed here (see above).

## Deployment

1. **GitHub:** push this repository to GitHub.
2. **Supabase:** create the project and run the migration as described above (if not already done).
3. **Vercel:** import the GitHub repo as a new Vercel project.
   - Framework preset: Vite.
   - Environment variables: add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (the same values as your local `.env`) under Project Settings → Environment Variables.
   - Build command: `npm run build`. Output directory: `dist`.
4. Before merging to `main` (which triggers deployment), confirm the GitHub Actions CI workflow (`.github/workflows/ci.yml`) is green: lint, unit/component/integration tests with coverage, production build, and the full E2E suite (desktop + mobile emulation).
5. Once deployed, sign in with one of the accounts created in Supabase and do a smoke check: add a dog, create a stay, mark it paid, confirm it shows up in History once its dates pass.
6. Double-check no secrets are exposed: the anon key is meant to be public (it's protected by RLS); no other secret should ever appear in the deployed bundle, in `.env`, or in any committed file.

## Future improvements

Recommended, but intentionally not built now:

- Real-device testing (an actual iPhone and Android phone) before the daughter relies on this daily, and a WebKit/Safari CI run (this sandbox couldn't install that browser).
- A proper account-recovery flow ("forgot password") — currently accounts are provisioned and reset manually from the Supabase dashboard.
- Signed (rather than public) URLs for dog photos, if photo privacy becomes a concern.
- An offline/poor-connectivity mode (service worker + local queue) for spotty mobile signal during a job.
- Basic audit/history on edits (who changed what) now that more than one person can edit the same data.
- Automated Lighthouse/axe accessibility audits in CI, on top of the manual accessibility spot-checks already in the E2E suite.
