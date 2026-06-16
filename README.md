# Nova Studio

Marketing site for a digital agency, with a JWT-protected admin panel for managing inquiries and portfolio projects.

## Tech Stack

- Next.js 15 (App Router)
- React 18.3
- TypeScript 5.6
- MUI 6.1 (`@mui/material`, `@mui/icons-material`) + Emotion 11
- Framer Motion 12 (entrance/scroll animations)
- PostgreSQL via `pg` 8
- MongoDB via Mongoose 9 (analytics events)
- `jsonwebtoken` 9 (admin auth)
- Zod 4 (request validation)
- Resend 6 (transactional email)
- Node 18+ (developed on 24)

## Getting Started

```bash
# 1. Clone
git clone <repo-url>
cd nova-studio

# 2. Install
npm install

# 3. Env
cp .env.local.example .env.local
# fill in the values (see table below)

# 4. Seed Postgres (drops + recreates tables, inserts sample data)
npm run seed

# 5. Run
npm run dev
```

Site at http://localhost:3000, admin at http://localhost:3000/admin.

MongoDB isn't required to run the site — the `events` collection is created on the first analytics write. If Mongo is down, analytics calls fail silently and nothing else breaks. Email is the same: with no `RESEND_API_KEY` set, the send functions no-op.

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Postgres connection string | `postgresql://user:pass@host/dbname` |
| `MONGODB_URI` | MongoDB connection string for analytics | `mongodb+srv://user:pass@cluster/dbname` |
| `JWT_SECRET` | Signs/verifies the admin JWT | `random-32-char-string` |
| `ADMIN_USERNAME` | Admin login username | `admin` |
| `ADMIN_PASSWORD` | Admin login password | `your-password` |
| `RESEND_API_KEY` | Resend API key for contact emails | `re_xxxxx` |
| `ADMIN_EMAIL` | Where new-inquiry notifications go | `you@email.com` |
| `NEXT_PUBLIC_BASE_URL` | Base URL for server-side fetches + OG metadata (optional) | `http://localhost:3000` |

## API Endpoints

`field?` in error responses is optional and names the field that failed validation. Error shape is always `{ error: string, field?: string }`.

| Method | Route | Auth | Request body | Response |
|--------|-------|------|--------------|----------|
| GET | `/api/services` | No | — | `Service[]` |
| GET | `/api/stats` | No | — | `Stat[]` |
| GET | `/api/projects` | No | — | `Project[]` (newest first) |
| POST | `/api/projects` | Yes | `{ title, category, image_url }` | `Project` (201) |
| DELETE | `/api/projects/[id]` | Yes | — | 204 |
| POST | `/api/contact` | No (rate-limited 5/hr/IP) | `{ name, email, message }` | `Contact` (201) |
| GET | `/api/admin/contacts` | Yes | — | `Contact[]` (newest first) |
| PATCH | `/api/admin/contacts/[id]` | Yes | `{ status }` | updated `Contact` |
| GET | `/api/admin/projects` | Yes | — | `Project[]` |
| POST | `/api/admin/projects` | Yes | `{ title, category, image_url }` | `Project` (201) |
| DELETE | `/api/admin/projects/[id]` | Yes | — | 204 |
| POST | `/api/analytics` | No | `{ type, page?, metadata? }` | `{ id }` (201) |
| GET | `/api/analytics` | No | — | last 100 events |
| POST | `/api/admin/login` | No | `{ username, password }` | sets `nova_token` cookie / 401 |
| POST | `/api/admin/logout` | No | — | clears cookie |

Auth is enforced in `middleware.ts`: it checks the `nova_token` httpOnly cookie on `/admin` pages (redirect to `/admin/login` if missing/invalid), on every `/api/admin/*` route except login/logout, and on `POST`/`DELETE` to `/api/projects`. Public `GET` routes are never gated.

## Database Schema

Postgres (`scripts/seed.sql`):

- **services** — `id`, `title`, `description`. The "what we do" cards.
- **projects** — `id`, `title`, `category`, `image_url`, `created_at`. Portfolio items, managed from the admin panel.
- **contacts** — `id`, `name`, `email`, `message`, `status` (`new`/`read`), `created_at`. Contact-form submissions; admin marks them read.
- **stats** — `id`, `label`, `value` (int). The homepage counters.

MongoDB:

- **events** — `type`, `page`, `metadata` (free-form object), `createdAt`. Append-only analytics log: page views, CTA clicks, filter clicks, contact submits.

## Design Decisions

I went with the Next.js App Router so the sections that read from the database (services, projects, stats) are server components that query directly and ship as HTML — no client-side fetch waterfall on first paint — while the interactive bits (filters, forms, animations) stay as small client components. The two-database split is on purpose: the marketing content is relational and low-volume with a fixed shape, which is exactly what Postgres is good at, whereas analytics events are high-volume, append-only, and carry arbitrary `metadata` per event, so a document store fits better and keeps the write-heavy telemetry off the main database. Admin auth uses a JWT in an httpOnly cookie rather than localStorage because a cookie isn't readable by JavaScript (so an XSS bug can't steal the token) and it's sent automatically, which lets the middleware verify it before a protected route ever runs. Zod handles request validation because the schema is the source of truth for both the parsed TypeScript type and the runtime check — one definition, and malformed input gets a clear `{ error, field }` back instead of a 500 from the database. Email goes through Resend as fire-and-forget after the contact row is already saved, so a mail outage never costs us the inquiry.
