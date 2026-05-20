# Snipli — URL Shortener

> A modern, feature-rich URL shortener with analytics, password protection, A/B testing, bio pages, and more.

![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase&logoColor=white)
![Vercel](https://img.shields.io/badge/Deployed-Vercel-000000?logo=vercel&logoColor=white)

---

## Table of Contents

- [Features](#features)
- [Architecture Diagram](#architecture-diagram)
- [Tech Stack](#tech-stack)
- [Setup Instructions](#setup-instructions)
  - [Prerequisites](#prerequisites)
  - [1. Clone the Repository](#1-clone-the-repository)
  - [2. Supabase Database Setup](#2-supabase-database-setup)
  - [3. Backend Setup](#3-backend-setup)
  - [4. Frontend Setup](#4-frontend-setup)
  - [5. Run Locally](#5-run-locally)
- [Deployment (Vercel)](#deployment-vercel)
- [Environment Variables Reference](#environment-variables-reference)
- [API Reference](#api-reference)
- [Assumptions Made](#assumptions-made)
- [Project Structure](#project-structure)
- [Common Issues](#common-issues)

---

## Features

| Feature | Description |
|---------|-------------|
| 🔗 URL Shortening | Generate random 7-char short codes or set a custom alias |
| 📊 Click Analytics | Charts for daily clicks, device, browser, OS, and country breakdowns |
| 🔒 Password Protection | Gate links behind a password (bcrypt-hashed, server-verified) |
| ⏰ Expiry Dates | Links auto-deactivate after a set date and time |
| 🖱️ Max Clicks | Links self-deactivate after reaching a click limit |
| 🔀 A/B Split Testing | Route traffic between two URLs with a configurable split percentage |
| 👁️ Preview Pages | 5-second interstitial countdown page before redirect |
| 🌐 Bio / Link-in-Bio | Public profile page listing all public links (like Linktree) |
| 📦 Bulk Shortener | Shorten up to 50 URLs at once via a textarea |
| 🏷️ Tags | Organise and filter links by custom tags |
| ❤️ Health Check | Instantly test whether a destination URL is still reachable |
| 📥 CSV Export | Download all your links and stats as a spreadsheet |
| 🌙 Dark / Light Mode | Persistent theme toggle using CSS variables and localStorage |
| 📱 QR Codes | Auto-generated scannable QR code for every short link |

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT  (Browser)                          │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │              React SPA  (Vite + Tailwind CSS v4)            │   │
│   │                                                             │   │
│   │  ┌──────────┐  ┌───────────┐  ┌──────────┐  ┌──────────┐  │   │
│   │  │  Login / │  │ Dashboard │  │Analytics │  │Bio Page  │  │   │
│   │  │  Signup  │  │ + Modals  │  │(Recharts)│  │(Public)  │  │   │
│   │  └──────────┘  └───────────┘  └──────────┘  └──────────┘  │   │
│   │                                                             │   │
│   │  ┌──────────────────────────────────────────────────────┐  │   │
│   │  │  AuthContext (JWT state)  │  ThemeContext (dark mode) │  │   │
│   │  └──────────────────────────────────────────────────────┘  │   │
│   │                                                             │   │
│   │  ┌──────────────────────────────────────────────────────┐  │   │
│   │  │  Axios — JWT header injection, base URL, 401 handler  │  │   │
│   │  └──────────────────────────┬───────────────────────────┘  │   │
│   └────────────────────────────-│────────────────────────────────┘  │
└────────────────────────────────-│────────────────────────────────────┘
                                  │  HTTPS  /api/*
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│               BACKEND  (Node.js + Express.js)                       │
│                    Vercel Serverless Function                        │
│                                                                     │
│  ┌────────────────┐   ┌──────────────────────────────────────────┐  │
│  │   Middleware   │   │                  Routes                   │  │
│  │                │   │                                          │  │
│  │  cors()        │   │  POST  /api/auth/signup                  │  │
│  │  express.json()│   │  POST  /api/auth/login                   │  │
│  │  rate-limit    │   │  GET   /api/auth/me                      │  │
│  │  authenticate  │   │                                          │  │
│  │  (JWT verify)  │   │  GET   /api/urls         (list)          │  │
│  └────────────────┘   │  POST  /api/urls         (create)        │  │
│                       │  POST  /api/urls/bulk    (bulk create)   │  │
│                       │  GET   /api/urls/:id/stats               │  │
│                       │  GET   /api/urls/:id/health              │  │
│                       │  PUT   /api/urls/:id     (update)        │  │
│                       │  DELETE /api/urls/:id    (delete)        │  │
│                       │                                          │  │
│                       │  GET   /api/bio/:username  (public)      │  │
│                       │                                          │  │
│                       │  GET  /:code  ──►  Redirect Handler      │  │
│                       │    1. Lookup short_code in DB            │  │
│                       │    2. Check active / expired / maxclicks │  │
│                       │    3. Serve password gate HTML           │  │
│                       │    4. A/B split  (Math.random)           │  │
│                       │    5. Record click in url_clicks         │  │
│                       │    6. Serve preview countdown HTML       │  │
│                       │    7. 301 Redirect → destination URL     │  │
│                       └──────────────────────────────────────────┘  │
│                                        │                            │
│                              Supabase JS SDK                        │
└────────────────────────────────────────│────────────────────────────┘
                                         │  HTTPS (service_role key)
                                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   SUPABASE  (Managed PostgreSQL)                    │
│                                                                     │
│  ┌─────────────┐   ┌──────────────────────────┐   ┌─────────────┐  │
│  │    users    │   │       short_urls          │   │ url_clicks  │  │
│  │─────────────│   │──────────────────────────│   │─────────────│  │
│  │ id (UUID)   │◄─-│ user_id      (FK)         │◄─-│short_url_id │  │
│  │ email       │   │ short_code               │   │ clicked_at  │  │
│  │ name        │   │ original_url             │   │ ip_address  │  │
│  │ password_   │   │ custom_alias             │   │ country     │  │
│  │   hash      │   │ title  /  tags (TEXT[])  │   │ device_type │  │
│  │ created_at  │   │ expires_at / max_clicks  │   │ browser     │  │
│  └─────────────┘   │ password_hash            │   │ os          │  │
│                    │ is_public / is_active    │   │ variant     │  │
│                    │ preview_enabled          │   └─────────────┘  │
│                    │ ab_url  /  ab_split      │                    │
│                    └──────────────────────────┘                    │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  VIEW: short_urls_with_stats                                 │  │
│  │  Joins short_urls + url_clicks to expose:                    │  │
│  │  total_clicks, last_clicked_at, ab_clicks_a, ab_clicks_b     │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  Indexes: short_code, custom_alias, user_id, clicked_at            │
└─────────────────────────────────────────────────────────────────────┘
```

### Short Link Visit Flow

```
  Browser ──GET /xK3pQ9m──► Express /:code handler
                                    │
                       ┌────────────▼────────────┐
                       │  DB lookup short_code    │──► 404 if not found
                       └────────────┬────────────┘
                                    │
                       ┌────────────▼────────────┐
                       │  Active? Not expired?    │──► "Link inactive" page
                       │  Max clicks not reached? │──► "Link expired" page
                       └────────────┬────────────┘
                                    │
                       ┌────────────▼────────────┐
                       │  Password hash set?      │──► Serve password gate HTML
                       └────────────┬────────────┘     (JS fetches unlock API)
                                    │
                       ┌────────────▼────────────┐
                       │  A/B url set?            │──► Pick URL A or URL B
                       │  Math.random() * 100     │    using ab_split %
                       └────────────┬────────────┘
                                    │
                       ┌────────────▼────────────┐
                       │  Record click event      │
                       │  (ip, user-agent,        │
                       │   referer, variant)      │
                       └────────────┬────────────┘
                                    │
                       ┌────────────▼────────────┐
                       │  Preview enabled?        │──► Serve 5s countdown HTML
                       └────────────┬────────────┘
                                    │
                              301 Redirect
                         to destination URL
```

---

## Tech Stack

### Backend

| Package | Version | Purpose |
|---------|---------|---------|
| `express` | 4.x | HTTP server and routing |
| `@supabase/supabase-js` | 2.x | PostgreSQL database client |
| `bcryptjs` | 2.x | Secure password hashing (12 salt rounds) |
| `jsonwebtoken` | 9.x | JWT creation and verification (7-day tokens) |
| `nanoid` | 3.3.7 | Random 7-character short code generation |
| `express-rate-limit` | 7.x | Abuse prevention (100 req / 15 min in production) |
| `cors` | 2.x | Cross-origin request handling |
| `validator` | 13.x | URL and email validation |
| `dotenv` | 16.x | Environment variable loading |

### Frontend

| Package | Version | Purpose |
|---------|---------|---------|
| `react` | 18.x | UI library |
| `react-router-dom` | 6.x | Client-side routing with protected routes |
| `vite` | 5.x | Build tool and dev server with proxy |
| `@tailwindcss/vite` | v4 | Tailwind CSS integration |
| `axios` | 1.x | HTTP client with JWT and 401 interceptors |
| `react-hot-toast` | 2.x | Toast notifications |
| `recharts` | 2.x | Analytics charts (AreaChart, PieChart) |
| `qrcode.react` | 3.x | QR code generation |
| `lucide-react` | 0.x | Icon library |
| `date-fns` | 3.x | Date formatting and calculation |

### Infrastructure

| Service | Role |
|---------|------|
| **Supabase** | Managed PostgreSQL with PostgREST auto-API and schema cache |
| **Vercel** | Frontend static hosting + backend serverless Node.js functions |

---

## Setup Instructions

### Prerequisites

- **Node.js** v18 or higher — [nodejs.org](https://nodejs.org)
- **npm** v9+ (comes with Node)
- **Supabase account** — [supabase.com](https://supabase.com) (free tier works)
- **Git** — [git-scm.com](https://git-scm.com)

---

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/url-shortener.git
cd url-shortener
```

The project is a **monorepo** — one repository, two folders:

```
url-shortener/
  backend/    ← Express API server
  frontend/   ← React application
```

---

### 2. Supabase Database Setup

#### Create a project
1. Go to [supabase.com](https://supabase.com) → **New Project**
2. Fill in project name, database password, and region → **Create**
3. Wait ~2 minutes for provisioning to complete

#### Get your credentials
1. Go to **Project Settings → API**
2. Copy:
   - **Project URL** — looks like `https://abcdefgh.supabase.co`
   - **`service_role` secret key** — under "Project API keys" (**use `service_role`, NOT `anon`**)

#### Run the schema migrations

1. Go to **SQL Editor** in your Supabase dashboard
2. Paste the contents of **`backend/supabase_schema.sql`** → click **Run** ✅
3. Paste the contents of **`backend/supabase_schema_v2.sql`** → click **Run** ✅
4. Go to **Project Settings → API → click "Reload schema"** to flush the PostgREST cache

> ⚠️ **Important:** Skipping step 4 will cause `PGRST204` schema cache errors when creating links with advanced options (password, max clicks, tags, etc.).

---

### 3. Backend Setup

```bash
cd backend
npm install
```

Create **`backend/.env`**:

```env
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key_here
JWT_SECRET=a_long_random_secret_string_at_least_32_characters
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
PORT=5000
```

> **Never commit `.env` to Git.** It is in `.gitignore`.

---

### 4. Frontend Setup

```bash
cd frontend
npm install
```

Create **`frontend/.env`**:

```env
# Leave empty for local development
# Vite's dev proxy forwards /api requests to localhost:5000 automatically
VITE_BASE_URL=
```

---

### 5. Run Locally

**Terminal 1 — start the backend:**

```bash
cd backend
npm run dev
# API running at http://localhost:5000
```

**Terminal 2 — start the frontend:**

```bash
cd frontend
npm run dev
# App running at http://localhost:5173
```

Open [http://localhost:5173](http://localhost:5173), create an account, and start shortening links.

> **Dev proxy:** Vite automatically forwards all `/api/*` requests from port 5173 → 5000. No CORS issues during local development.

---

## Deployment (Vercel)

Deploy both parts from the **same Git repository** as two separate Vercel projects.

### Step 1 — Deploy the Backend

1. [vercel.com](https://vercel.com) → **Add New Project** → Import your repo
2. **Root Directory:** `backend`
3. **Framework Preset:** `Other`
4. **Environment Variables:**

   | Key | Value |
   |-----|-------|
   | `SUPABASE_URL` | `https://xxxx.supabase.co` |
   | `SUPABASE_SERVICE_KEY` | your service_role key |
   | `JWT_SECRET` | your secret string |
   | `FRONTEND_URL` | *(set this after the frontend is deployed)* |
   | `NODE_ENV` | `production` |

5. Click **Deploy** and note the URL (e.g. `https://snipli-api.vercel.app`)

### Step 2 — Deploy the Frontend

1. **Add New Project** → Import the **same repo**
2. **Root Directory:** `frontend`
3. **Framework Preset:** `Vite`
4. **Environment Variables:**

   | Key | Value |
   |-----|-------|
   | `VITE_BASE_URL` | `https://snipli-api.vercel.app` |

5. Click **Deploy** and note the URL (e.g. `https://snipli.vercel.app`)

### Step 3 — Update CORS

Go back to the **backend** Vercel project → **Settings → Environment Variables** →
update `FRONTEND_URL` to `https://snipli.vercel.app` → click **Redeploy**.

---

## Environment Variables Reference

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | ✅ | Your Supabase project URL |
| `SUPABASE_SERVICE_KEY` | ✅ | Service role key — full DB access (never expose publicly) |
| `JWT_SECRET` | ✅ | Secret used to sign and verify JWT tokens |
| `FRONTEND_URL` | ✅ | Allowed CORS origin (your frontend URL) |
| `NODE_ENV` | ✅ | `development` bypasses rate limiting; `production` enforces it |
| `PORT` | ❌ | Local port (default: `5000`) |

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_BASE_URL` | Production only | Backend URL. Leave empty in dev — Vite proxy handles `/api` routing. |

---

## API Reference

All endpoints marked **Protected** require the header: `Authorization: Bearer <token>`

### Authentication

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `POST` | `/api/auth/signup` | Public | Create account — returns `{ token, user }` |
| `POST` | `/api/auth/login` | Public | Login — returns `{ token, user }` |
| `GET` | `/api/auth/me` | Protected | Get current user profile |

### URL Management

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/api/urls` | Protected | List all your links with click stats |
| `POST` | `/api/urls` | Protected | Create a new short link |
| `POST` | `/api/urls/bulk` | Protected | Create up to 50 links at once |
| `PUT` | `/api/urls/:id` | Protected | Update link fields |
| `DELETE` | `/api/urls/:id` | Protected | Delete a link (cascades to click records) |
| `GET` | `/api/urls/:id/stats` | Protected | Full analytics: daily clicks, geo, device, browser |
| `GET` | `/api/urls/:id/health` | Protected | HEAD request to destination — returns `{ alive, statusCode, responseTime }` |
| `POST` | `/api/urls/unlock/:code` | Public | Verify password for a protected link |

### Bio & Redirect

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/api/bio/:username` | Public | User profile + their public links |
| `GET` | `/:code` | Public | Main redirect (or serves gate / preview page) |
| `GET` | `/health` | Public | Server uptime check |

---

## Assumptions Made

1. **Single Supabase project for all environments** — One database is used for both local development and production. In a production-grade system, separate dev/staging/prod databases would be maintained.

2. **Name-based bio page URLs** — The public bio page URL is built from the user's display name (e.g. `/bio/John Doe`). This assumes display names are unique enough for routing. A dedicated immutable `username` field would be more robust but was out of scope for this project.

3. **No email verification** — Users can register with any email without confirming it. A production application would gate access behind an email confirmation step.

4. **No password reset flow** — Forgot-password / reset-via-email is not implemented. A user who forgets their password cannot recover their account without direct database intervention.

5. **Stateless A/B testing** — Variant assignment is random per visit (`Math.random()`), not sticky per user/session. The same visitor may land on URL A one visit and URL B on another.

6. **Approximate geolocation and device analytics** — Country, city, and device type are derived from `User-Agent` and `X-Forwarded-For` headers. These can be absent, spoofed, or obscured by proxies, VPNs, or load balancers.

7. **Rate limiting disabled in development** — All rate limiters are completely bypassed when `NODE_ENV !== 'production'` to avoid friction during local development. This must never apply in a production environment.

8. **Service role key is server-side only** — Supabase's `service_role` key bypasses Row Level Security and is stored only in the backend's environment variables. It is never sent to or accessible by the browser.

9. **7-character short codes assumed collision-free** — With a 62-character alphabet (a–z, A–Z, 0–9), there are 62⁷ ≈ 3.5 trillion possible codes. Collisions are extremely unlikely; a retry loop handles any edge cases.

10. **Password gates and preview pages are server-rendered HTML** — These interactive pages are returned as self-contained HTML strings by Express rather than being React routes. This simplifies the architecture but means they don't share the main app's theme or component library.

11. **No image uploads** — User avatars on the bio page display the first letter of the name inside a gradient circle. No object storage or image hosting is used.

12. **Tags stored as PostgreSQL native arrays** — The `tags` column uses PostgreSQL's `TEXT[]` type. The frontend parses the user's comma/Enter-separated input into a JavaScript array before POSTing to the API.

---

## Project Structure

```
url-shortener/
│
├── backend/
│   ├── src/
│   │   ├── server.js              # Express app, middleware, route wiring
│   │   ├── db.js                  # Supabase client (service_role key)
│   │   ├── middleware/
│   │   │   └── auth.js            # JWT Bearer token verification
│   │   ├── routes/
│   │   │   ├── auth.js            # /api/auth/*  signup · login · me
│   │   │   ├── urls.js            # /api/urls/*  CRUD · bulk · stats · health
│   │   │   ├── bio.js             # /api/bio/:username  public profile
│   │   │   └── redirect.js        # /:code  redirect · gate · preview
│   │   └── utils/
│   │       └── generateCode.js    # nanoid with custom alphabet (7 chars)
│   ├── supabase_schema.sql        # Initial DB schema (run first)
│   ├── supabase_schema_v2.sql     # Advanced columns migration (run second)
│   ├── package.json
│   ├── vercel.json                # Routes all traffic to server.js
│   └── .env                      # Secrets — NOT committed to Git
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx                # Root component, router, context providers
│   │   ├── main.jsx               # ReactDOM.createRoot entry point
│   │   ├── index.css              # CSS custom properties (light/dark themes)
│   │   ├── api/
│   │   │   └── axios.js           # Axios instance, JWT injection, 401 handler
│   │   ├── context/
│   │   │   ├── AuthContext.jsx    # User state, login(), logout(), token check
│   │   │   └── ThemeContext.jsx   # isDark toggle, localStorage persistence
│   │   ├── components/
│   │   │   ├── Navbar.jsx         # Top bar — theme toggle, logout
│   │   │   ├── ProtectedRoute.jsx # Redirects unauthenticated users to /login
│   │   │   ├── UrlCard.jsx        # Link card with badges, actions, health check
│   │   │   ├── CreateUrlModal.jsx # Link creation form with advanced options
│   │   │   └── BulkShortenModal.jsx # Textarea-based bulk shortener
│   │   └── pages/
│   │       ├── Login.jsx          # Login form (redirects if already authed)
│   │       ├── Signup.jsx         # Registration form
│   │       ├── Dashboard.jsx      # URL list, stat cards, search, tag filters
│   │       ├── Analytics.jsx      # Charts and click breakdown for one link
│   │       └── Bio.jsx            # Public link-in-bio profile page
│   ├── index.html
│   ├── vite.config.js             # Tailwind plugin + /api dev proxy
│   ├── package.json
│   ├── vercel.json                # SPA rewrite rule (prevents refresh 404)
│   └── .env                      # Frontend env — NOT committed to Git
│
├── Snipli-Documentation.docx      # Full project documentation (Word)
└── README.md                      # This file
```

---

## Common Issues

| Problem | Cause | Fix |
|---------|-------|-----|
| `Could not find the 'ab_split' column` | v2 migration not applied or schema cache stale | Run `supabase_schema_v2.sql` in SQL Editor, then **Reload schema** in Project Settings → API |
| Blank page after login (production) | API calls hitting the frontend domain instead of backend | Set `VITE_BASE_URL` to your backend Vercel URL in `frontend/.env` |
| Page not found on browser refresh (production) | Vercel serves static files; unknown paths return 404 | Ensure `frontend/vercel.json` contains the rewrite rule pointing to `/index.html` |
| CORS errors in production | `FRONTEND_URL` env var not updated after deploy | Set `FRONTEND_URL` in backend Vercel env vars to the exact frontend URL, then redeploy |
| Expiry time is off by hours | `datetime-local` gives local time with no timezone info | Frontend converts with `new Date(value).toISOString()` before sending to the API |
| Too many auth attempts (local dev) | Rate limiter triggered | Set `NODE_ENV=development` in `backend/.env` to bypass all rate limiting |
| Bio page shows "User not found" | Name mismatch or schema cache stale after v2 migration | Reload Supabase schema; check the exact name stored in the DB matches the URL |

---

> This project is a part of a hackathon run by https://katomaran.com
