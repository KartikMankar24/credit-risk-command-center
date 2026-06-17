# Enterprise Credit Risk Command Center

An internal-grade **credit risk operations platform** — the kind of system used by digital
lenders (KreditBee, Navi, LendingKart, Paytm Credit) to underwrite applicants, investigate
fraud, run collections, and monitor portfolios. Modelled on the operational workflows of
**Salesforce Financial Services Cloud, ServiceNow, Jira and banking LOS/LMS systems**:
every screen is built to help a user *complete a task*, not just view analytics.

Built with **plain HTML + CSS + JavaScript** (no framework, no build step) on top of the
real **Kaggle Home Credit Default Risk** dataset — **307,511 customer records**.

> **Operational, not just analytical.** The product is organised around a **case/queue model**
> (the spine of every enterprise risk platform). Each application, fraud alert and delinquent
> account is a *case* with a status, priority, SLA and assignee. Users claim cases from a
> unified **Work Queue**, work them through real disposition dialogs (approve with reason codes,
> escalate to SIU, set a promise-to-pay), and every action writes through to the record, the
> case timeline, and a tamper-evident **audit trail** — all gated by role-based access control.

> **Data provenance (interview talking point).** The numbers in this dashboard are not mock.
> They are derived from the genuine Home Credit `application_train.csv` (307,511 applicants,
> 122 raw columns). A build-time Node processor (`tools/build-data.mjs`) streams every row and
> derives a digital-lending schema from **real signals** — `EXT_SOURCE_1/2/3` → CIBIL score,
> a calibrated PD model → default probability, document/region flags → fraud anomaly score,
> bureau + delinquency signals → DPD buckets. Only the legally-impossible PII (Indian names,
> PAN, phone, city) is synthesized deterministically. The portfolio default rate comes out to
> **8.07%** — exactly the known Home Credit base rate — and default rate rises monotonically
> across risk bands (P1 ≈ 3.5% → P5 ≈ 33%), proving the bands actually rank-order risk.

---

## Two ways to run it

| Mode | Backend | Data | Use it for |
|------|---------|------|-----------|
| **Full (local)** | `tools/server.mjs` (Node + SQLite) | All **307,511** rows | The real demo on your laptop — instant queries over the full population |
| **Static (live)** | none (browser IndexedDB) | `preview.json` (~2k rows) or all shards | A shareable link (Vercel / GitHub Pages) |

### Full local run (recommended for demos)

```bash
npm install            # builds better-sqlite3
node tools/server.mjs  # → http://localhost:4321  (ingests rows into SQLite on first boot)
```

Queries over all 307k rows return in a few ms; the browser never downloads the dataset.

### Static run (no backend)

The app is fully static and degrades automatically when no server is present — it streams
JSON row shards into the browser's IndexedDB (or runs on `preview.json` if shards aren't
shipped). Any static server works:

```bash
npx serve .            # or VS Code "Live Server", or `node tools/serve.mjs`
```

---

## Deploying a live link (Vercel)

Vercel hosts this as a **static site** — it does *not* run the Node/SQLite server — so the
live link uses the browser-IndexedDB fallback. The repo is pre-configured:

- **`vercel.json`** disables install/build and serves the folder as-is (so Vercel never tries
  to compile the native `better-sqlite3` dependency).
- **`.gitignore`** ships `data/preview.json` (2 MB → instant first load) and excludes the
  487 MB SQLite DB and the 326 MB `data/rows/` shards.

**To deploy the full 307k dataset to the live site instead** of the preview set: remove the
`data/rows/` line from `.gitignore`, commit, and push (repo grows to ~330 MB; the first visit
then downloads all shards into IndexedDB — slower, one time, cached after). For a recruiter-
facing link, the default preview set is recommended.

See the **Deploy** section at the bottom for the exact GitHub + Vercel steps.

### Rebuilding the dataset

The processed data under `data/` is already generated. To regenerate it (e.g. after editing
derivation rules), ensure `../Dataset/home-credit-default-risk.zip` is present and run:

```bash
node tools/build-data.mjs
#   → data/aggregates.json, data/preview.json, data/rows/shard-*.json, data/manifest.json
```

---

## What's inside (modules)

| Page | What it does |
|------|--------------|
| **Command Center** (`index.html`) | Operational home: urgency-coded **action tiles** (pending underwriting, SLA breaches, fraud alerts, collections due, my open cases), a **priority worklist** worked in place, live risk alerts, and the team activity feed. Leads with work, not charts. |
| **Work Queue** (`pages/work.html`) | The unified case inbox. Tabs — My Work / Underwriting / Fraud / Collections / All. Claim cases, bulk assign-to-me, see priority + SLA + assignee, and open the right disposition dialog for each. |
| **Underwriting** (`pages/decision-engine.html`) | A **decision queue** of applications awaiting a credit call (with the model's recommendation + SLA per row), plus a **What-if Simulator** tab — inputs → Approve/Review/Reject + band + expected loss + rate, on the same scorecard the portfolio uses. |
| **Fraud Case Management** (`pages/fraud.html`) | Signal header (KPIs + device/geo/identity heatmap) over an **investigation queue**; each flagged identity is a case you dispose — Clear / Confirm fraud / Escalate to SIU / Request documents. |
| **Collections Worklist** (`pages/collections.html`) | Recovery KPIs + DPD mix over a **prioritized account worklist**; actions — Log Contact, set a **Promise-to-Pay** (tracked inline), Restructure/Settle, Escalate. |
| **Customers** (`pages/customers.html`) | IndexedDB-backed table over all 307k rows — paging, multi-column sort, filters, instant search, a live **Case** column, bulk **Assign-to-Queue** / **Set-Status**, CSV/Excel export. |
| **Customer Profile** (`pages/profile.html?id=`) | 360° view: personal, employment, financial, bureau, behavioural, fraud, colour-coded risk metrics, risk gauge, **AI Underwriter** panel, a contextual **next-best-action** button, a **Case & Activity Timeline**, and per-customer downloads (PDF / credit / risk / underwriting / JSON / CSV). |
| **Portfolio Analytics** (`pages/portfolio.html`) | The analytics home: segmentation, revenue vs expected-loss, HHI concentration, interactive **stress testing**, plus the full chart suite — approval funnel, default-rate-by-band, employment, monthly origination, score/income/loan distributions, city tier, DPD, vintage. |
| **Dataset Manager** (`pages/dataset.html`) | Upload CSV/XLSX (replace/append/validate), data-quality report, missing-value & duplicate reports, export clean/raw datasets. |
| **Admin & Audit** (`pages/admin.html`) | Role-based access matrix (Admin / Risk Manager / Underwriter / Analyst / Collections / Viewer), role switcher, full audit trail, change history. |

### The case/queue spine

Two modules turn the screens above into an operations platform:

- **`js/core/cases.js`** (`Cases`) — the work-item model. One case per customer × function
  (underwriting / fraud / collections), each with status, priority, SLA, assignee, disposition
  and an activity log. Cases derive deterministically from the data (no seed file), so queues
  populate immediately — and persist to `localStorage` the moment a real action is taken.
- **`js/modules/casework.js`** (`Casework`) — the disposition dialogs, built once and reused by
  the Work Queue, the three domain queues, and the Profile. Every disposition writes through
  **all three layers** — customer schema (`CRUD`), case metadata + timeline (`Cases`), and the
  audit trail (`Store`) — and is RBAC-gated.

---

## Architecture

```
credit-risk-command-center/
├── index.html                  # Command Center (home)
├── pages/                      # customers, profile, decision-engine, fraud,
│                               #   collections, portfolio, dataset, admin
├── css/
│   ├── theme.css               # design tokens, dark/light themes, app shell
│   └── components.css          # cards, tables, badges, modals, charts, toasts
├── js/
│   ├── core/   format.js · store.js          # formatting + state/RBAC/audit/toasts
│   ├── data/   idb.js · loader.js            # IndexedDB engine + shard hydration
│   ├── ui/     shell.js · modal.js           # sidebar/topbar/search/theme + modals
│   ├── charts/ charts.js                     # Chart.js factories (zoom/export/drilldown)
│   ├── modules/ home, customers, profile, decision, fraud, collections,
│   │            portfolio, dataset, admin, ai-underwriter, downloads, crud
│   └── app.js                                # per-page bootstrap
├── data/                       # build output: aggregates, preview, rows/shard-*, manifest
└── tools/
    ├── build-data.mjs          # streaming 307k-row data processor
    └── serve.mjs               # zero-redirect static server
```

### Why IndexedDB?

307,511 rows cannot live in a JS array or a DataTables instance without freezing the tab.
The build emits **two tiers**:

1. **`aggregates.json`** — every KPI and chart series, pre-computed over *all* rows at build
   time (tiny). The home dashboard is therefore genuinely full-population, and loads instantly.
2. **Sharded row files** → streamed into **IndexedDB** on first load. The customer table,
   profile lookups, fraud/collections worklists, and global search all run as **paged IDB
   queries** — never materializing all 307k rows at once.

This keeps the app fully static (no backend) while behaving like a real data platform.

---

## Tech stack

- **HTML / CSS / vanilla JS** — no framework, no bundler
- **Chart.js** (+ zoom plugin) — interactive charts with zoom / export / drill-down
- **SheetJS (xlsx)** — Excel import/export
- **jsPDF (+ autoTable)** — PDF reports (customer profiles, executive summary, portfolio reports)
- **IndexedDB** — client-side datastore for 307k rows
- **localStorage** — role, theme, audit trail, CRUD overlay

## API integration points

The app ships fully client-side, but every place that would talk to a backend is marked
`// API INTEGRATION POINT` (see `js/data/loader.js`, `js/modules/crud.js`,
`js/modules/dataset.js`). Swapping the IndexedDB/localStorage layer for REST calls
(`GET /api/customers?page&size`, `POST /api/customers`, `GET /api/aggregates`, …) leaves
every page unchanged.

---

## Notes

- **Synthetic PII** (names, PAN, phone) is randomly generated and deterministic per customer
  ID — it does **not** correspond to any real individual. The underlying financial/credit
  signals are derived from the public Home Credit research dataset.
- Designed as a portfolio / interview showcase. Dark & light themes, responsive layout,
  role-based access, and audit logging are all included.

---

## Deploy — GitHub + Vercel (web flow, no CLI)

### A. Push to GitHub

1. **Create the repo** — github.com → New repository → name `credit-risk-command-center`,
   Public, **don't** add a README/.gitignore (the project already has them) → Create.
2. **From the project folder**, run:
   ```bash
   cd "/c/Users/manka/OneDrive/Desktop/Fintech Project/credit-risk-command-center"
   git init
   git add .
   git commit -m "Credit Risk Command Center — operational platform"
   git branch -M main
   git remote add origin https://github.com/<your-username>/credit-risk-command-center.git
   git push -u origin main
   ```
   (`.gitignore` keeps the 487 MB DB and 326 MB shards out — the push is small and fast.)

### B. Deploy on Vercel

3. vercel.com → sign in with GitHub → **Add New… → Project** → Import the repo.
4. Leave everything default (`vercel.json` already sets Framework = Other, no build, output `.`)
   → **Deploy**.
5. You get a live URL like `https://credit-risk-command-center.vercel.app`. Every future
   `git push` redeploys automatically.

> Alternative host — **GitHub Pages**: repo Settings → Pages → Source = `main` / root → Save.
> Works identically (static), URL `https://<user>.github.io/credit-risk-command-center/`.

### Files that get uploaded (everything except the gitignored data)

```
index.html · vercel.json · README.md · CHANGES.md · favicon.svg
package.json · package-lock.json
css/        theme.css · components.css
js/         core/{format,store,cases} · data/{idb,idb.local,loader}
            ui/{shell,modal} · charts/charts · app.js
            modules/{home,work,customers,profile,decision,fraud,collections,
                     portfolio,dataset,admin,ai-underwriter,downloads,crud,casework}
pages/      work · customers · profile · decision-engine · fraud ·
            collections · portfolio · dataset · admin   (.html)
data/       aggregates.json · manifest.json · preview.json   ← shipped (small)
tools/      build-data · serve · server · test-logic · ui-test · ui-test-ops · shot.sh

NOT uploaded (gitignored): node_modules/ · data/crcc.db* · data/rows/ · _shots/ · *.log
```
