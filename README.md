# Snipli – URL Shortener

A full-stack URL shortener with analytics, built with React, Express.js, and Supabase.

## Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | React 18, Vite, Tailwind CSS v4     |
| Backend    | Node.js, Express.js                 |
| Database   | Supabase (PostgreSQL)               |
| Auth       | JWT + bcrypt                        |
| Charts     | Recharts                            |
| QR Code    | qrcode.react                        |
| Icons      | lucide-react                        |

## Features

- **Authentication** — Signup/login with JWT, password hashing with bcrypt
- **URL Shortening** — Unique 7-char codes, custom alias support, expiry dates
- **Dashboard** — View, search, copy and delete all links with click stats
- **Analytics** — Daily click chart, device/browser/OS breakdown, visit history
- **QR Code** — Generate and view QR codes for any short link
- **Redirect** — Server-side 301 redirect with device/browser analytics capture
- **Rate Limiting** — Per-route rate limiting on auth and API endpoints

## Project Structure

```
Url-Shortner/
├── backend/
│   ├── src/
│   │   ├── server.js           # Express entry point
│   │   ├── db.js               # Supabase client
│   │   ├── middleware/
│   │   │   └── auth.js         # JWT authentication middleware
│   │   ├── routes/
│   │   │   ├── auth.js         # POST /api/auth/signup, /login, GET /me
│   │   │   ├── urls.js         # CRUD + stats for short URLs
│   │   │   └── redirect.js     # GET /:code → 301 redirect
│   │   └── utils/
│   │       └── generateCode.js # nanoid short code generator
│   ├── supabase_schema.sql     # Database schema to run in Supabase
│   ├── .env.example
│   └── package.json
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── index.css
    │   ├── api/axios.js        # Axios instance with JWT interceptor
    │   ├── context/
    │   │   └── AuthContext.jsx
    │   ├── components/
    │   │   ├── Navbar.jsx
    │   │   ├── ProtectedRoute.jsx
    │   │   ├── UrlCard.jsx
    │   │   └── CreateUrlModal.jsx
    │   └── pages/
    │       ├── Login.jsx
    │       ├── Signup.jsx
    │       ├── Dashboard.jsx
    │       └── Analytics.jsx
    ├── .env.example
    └── package.json
```

## Setup Guide

### 1. Supabase Setup

1. Go to [supabase.com](https://supabase.com) and create a new project
2. In the **SQL Editor**, run the contents of `backend/supabase_schema.sql`
3. From **Project Settings → API**, copy:
   - **Project URL** → `SUPABASE_URL`
   - **service_role** key → `SUPABASE_SERVICE_KEY`

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
```

Edit `.env`:
```env
PORT=5000
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
JWT_SECRET=your-long-random-secret-key
FRONTEND_URL=http://localhost:5173
BASE_URL=http://localhost:5000
```

```bash
npm install
npm run dev
```

### 3. Frontend Setup

```bash
cd frontend
cp .env.example .env
```

Edit `.env`:
```env
VITE_BASE_URL=http://localhost:5000
```

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## API Reference

### Auth
| Method | Endpoint          | Auth | Description       |
|--------|-------------------|------|-------------------|
| POST   | /api/auth/signup  | No   | Register user     |
| POST   | /api/auth/login   | No   | Login, get JWT    |
| GET    | /api/auth/me      | Yes  | Current user info |

### URLs
| Method | Endpoint             | Auth | Description              |
|--------|----------------------|------|--------------------------|
| GET    | /api/urls            | Yes  | List all user URLs       |
| POST   | /api/urls            | Yes  | Create short URL         |
| PUT    | /api/urls/:id        | Yes  | Update URL title/target  |
| DELETE | /api/urls/:id        | Yes  | Delete URL               |
| GET    | /api/urls/:id/stats  | Yes  | Analytics for one URL    |

### Redirect
| Method | Endpoint   | Auth | Description              |
|--------|------------|------|--------------------------|
| GET    | /:code     | No   | Redirect to original URL |

## Environment Variables

### Backend (`backend/.env`)
| Variable            | Description                          |
|---------------------|--------------------------------------|
| PORT                | Server port (default 5000)           |
| SUPABASE_URL        | Supabase project URL                 |
| SUPABASE_SERVICE_KEY| Supabase service role key            |
| JWT_SECRET          | Secret for signing JWTs              |
| FRONTEND_URL        | Frontend origin (for CORS)           |
| BASE_URL            | Backend base URL (for short links)   |

### Frontend (`frontend/.env`)
| Variable       | Description                        |
|----------------|------------------------------------|
| VITE_BASE_URL  | Backend URL for short link display |

## UI Libraries Used

- **Tailwind CSS v4** — Utility-first CSS framework
- **Recharts** — Composable chart library for React
- **qrcode.react** — QR code generation
- **lucide-react** — Icon library
- **react-hot-toast** — Toast notifications
- **date-fns** — Date formatting utilities
- **react-router-dom v6** — Client-side routing
- **axios** — HTTP client
