# Nova Studio

A fictional digital agency platform built as a fullstack assignment. It goes beyond a typical landing page by including an AI-powered client intake system, a slot-based booking flow, and an admin dashboard with an embedded AI assistant that can answer questions about specific clients and draft pre-meeting emails.

## Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Framework | Next.js 15 (App Router) | Server components for data fetching, client components for interactive UI |
| UI | MUI v6 + Framer Motion | MUI for layout/components, Framer Motion for page animations |
| Database (relational) | PostgreSQL | Contacts, projects, services, stats, slots, bookings, intake data |
| Database (events) | MongoDB | Analytics event log |
| Email | Nodemailer (Gmail SMTP) | App password auth, sends to any recipient |
| AI | DeepSeek (V4 Flash) via BytePlus ModelArk | Intake questions, report generation, admin chat |
| Validation | Zod | All API request bodies |
| Auth | JWT (httpOnly cookie) | Admin panel only |
| Rate limiting | In-memory token-bucket | Per-IP on public contact form, global budget on AI calls |

## Getting Started

1. Clone the repo and install dependencies:
   ```bash
   git clone https://github.com/ojasshelke46-gif/nova-studio.git
   cd nova-studio
   npm install
   ```

2. Copy the example env file and fill in your values:
   ```bash
   cp .env.local.example .env.local
   ```

3. Set up the Postgres schema and seed base data (services, projects, stats):
   ```bash
   psql $DATABASE_URL -f scripts/seed.sql
   ```

4. Generate booking slots for the next 10 weekdays:
   ```bash
   psql $DATABASE_URL -f scripts/booking_schema.sql
   ```
   Or run the Node seed script if you prefer:
   ```bash
   npx ts-node scripts/seedSlots.ts
   ```

5. Start the dev server:
   ```bash
   npm run dev
   ```

The site runs on `http://localhost:3000`. Admin panel is at `/admin`.

## Environment Variables

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | Postgres connection string | `postgresql://user:pass@host/dbname` |
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster/db` |
| `JWT_SECRET` | Secret for signing admin tokens | any 32+ char random string |
| `ADMIN_USERNAME` | Admin login username | `admin` |
| `ADMIN_PASSWORD` | Admin login password | `yourpassword` |
| `GMAIL_USER` | Gmail address used as SMTP sender | `you@gmail.com` |
| `GMAIL_APP_PASSWORD` | 16-char Google App Password | `abcd efgh ijkl mnop` |
| `ADMIN_EMAIL` | Where admin notifications are sent | `you@gmail.com` |
| `BYTEPLUS_API_KEY` | BytePlus ModelArk API key | `your-key` |
| `BYTEPLUS_BASE_URL` | ModelArk endpoint | `https://ark.ap-southeast.bytepluses.com/api/v3` |
| `DEEPSEEK_TEXT_MODEL` | Model ID on ModelArk | `deepseek-v4-flash-260425` |
| `AI_RATE_PER_MIN` | _(optional)_ Max AI calls per minute, whole app | `15` (default) |
| `AI_RATE_PER_DAY` | _(optional)_ Max AI calls per day, whole app | `300` (default) |

For Gmail, generate an App Password at Google Account → Security → 2-Step Verification → App passwords. The regular account password won't work.

The two `AI_RATE_*` knobs are optional — they fall back to the defaults shown if unset.

## Core Features

**Landing page** — Hero with animated entrance, services grid, portfolio with client-side category filtering, animated stat counters, and a contact section. Services, portfolio, and stats data are fetched server-side so the page renders with content on first load.

**Admin panel** — Protected by JWT cookie set at login. Tabs for Inquiries (with read/unread status), Projects (list, add, delete), and Analytics (MongoDB event log). Expanding an inquiry row shows the full message and, if an intake session exists for that contact, the AI report panel.

## AI Intake System

The intake system exists because a static contact form doesn't tell you much. Someone typing "I need a website" in a text box gives you almost nothing to work with before a call. Instead, when a visitor clicks "Get Started" on the contact section, they describe their project in their own words, and the AI asks adaptive follow-up questions tailored to what they said. Each question comes with a few predefined options plus a free-text "something else" option, so visitors are never boxed in.

The question count is adaptive rather than fixed. The model returns a `done` flag with each turn and decides when it has enough to write a useful report. To keep the signal high without exhausting visitors, the flow enforces a **minimum of 4 questions** (the model can't finish earlier even if it tries) and a **hard ceiling of 6** (force-completed regardless). Between those bounds the model ends the conversation when the picture is clear — so a detailed brief wraps up at 4, a vague one runs longer.

Technically it works like this: the client submits their initial description, which hits `POST /api/intake/start`. That creates a session in Postgres and calls DeepSeek to generate the first question and its options. Each answer the visitor submits hits `POST /api/intake/respond`, which appends to the stored conversation JSON and asks DeepSeek for the next question (or to finish), passing the full conversation history each time. `POST /api/intake/finalize` then sends the entire conversation to DeepSeek in a single call that returns a plain-English summary report, a lead score out of 100 **with a four-dimension breakdown**, and a rough scope-of-work draft — all as a single structured JSON response.

**Lead scoring** is broken into four explicit sub-dimensions, each scored 0–25: clarity (how well-defined the request is), urgency (time-pressure signals), budget signal (any mention of budget or willingness to pay), and decision authority (whether they sound like the decision-maker). The final `lead_score` is the sum, so the badge always matches the breakdown. Scoring this way avoids the model regressing every lead toward a generic mid-range number — a vague, no-budget enquiry scores near zero, a detailed founder-with-deadline lead scores in the 90s.

DeepSeek V4 Flash is used here rather than a larger reasoning model because the task doesn't need frontier reasoning. Generating a follow-up question from a paragraph of context and producing a structured summary is well within its capability, and the Flash variant keeps cost and latency low (a reasoning model would burn far more tokens on hidden chain-of-thought for no quality gain here). BytePlus ModelArk was already set up for the project, which made it the obvious path.

The model is instructed to return strict JSON for both question generation and report finalization. If parsing fails, the code retries once with an explicit reminder to return only JSON, and the parser also extracts the JSON object from any surrounding prose — this handles cases where the model adds a markdown code fence or a preamble sentence. Every AI call is also gated by a global budget (`AI_RATE_PER_MIN` / `AI_RATE_PER_DAY`); when the budget is exhausted the call falls back to a canned response rather than spending tokens, so a burst or runaway loop can't drain the shared API quota.

## Booking System

After completing the intake flow, the client can optionally book a call. The booking page fetches available time slots via `GET /api/slots` — 1-hour blocks across the next 10 weekdays, generated when you run the seed script. Selecting a slot and confirming hits `POST /api/bookings`, which checks availability with a `SELECT FOR UPDATE` to prevent double-booking under concurrent requests, marks the slot as booked, and triggers a confirmation email to the client.

## Admin AI Tools

When an inquiry has a linked intake report, the admin panel shows two extra tools in the expanded row.

**Ask AI about this client** — a small chat input that lets the admin ask questions about that specific person. Each message hits `POST /api/admin/ai-chat` with the session ID and the current conversation history. The AI's responses are grounded in that client's actual intake conversation and generated report, not generic knowledge.

**Draft pre-meeting email** — one click calls `POST /api/admin/draft-email`, which sends the client's report to DeepSeek and gets back a short email asking any clarifying questions worth covering before the meeting. An optional instruction field above the button lets the admin steer the draft ("ask about their timeline and budget range") — when provided, it's woven into the prompt; when blank, the generic clarifying-question behaviour kicks in. The admin can edit the result directly in the panel before hitting Send, which goes through `POST /api/admin/send-prep-email` and delivers it via Gmail SMTP.

## Email System

The project was originally built with Resend. The problem with Resend's free tier is that without a verified custom domain, emails can only be delivered to the account owner's own address — which means a contact form submission "confirming" to an actual visitor's email just bounces. Nodemailer with Gmail SMTP sends to any recipient without any domain setup, which is a better fit for a project like this where real end-to-end delivery matters more than scale.

Three things trigger emails: a contact form submission sends an admin notification (to `ADMIN_EMAIL`) and a client confirmation (to the submitter's address). A completed booking sends a confirmation to the client. Both the admin notification and client confirmation are fire-and-forget — a failed send logs an error but doesn't fail the API response, so a misconfigured mail setup won't break form submission for visitors.

## API Documentation

| Method | Route | Auth | Request Body | Response |
|---|---|---|---|---|
| GET | `/api/services` | No | — | Array of services |
| GET | `/api/projects` | No | — | Array of projects |
| GET | `/api/projects/:id` | No | — | Single project |
| GET | `/api/stats` | No | — | Array of stats |
| POST | `/api/analytics` | No | `{ type, page?, metadata? }` | `{ id }` (201) |
| GET | `/api/analytics` | No | — | Array of recent events |
| POST | `/api/contact` | No | `{ name, email, message }` | Created contact (201) |
| GET | `/api/slots` | No | — | Array of available slots |
| POST | `/api/bookings` | No | `{ contact_id, slot_id }` | Created booking (201) |
| POST | `/api/intake/start` | No | `{ contact_id, query }` | `{ session_id, question, options }` |
| POST | `/api/intake/respond` | No | `{ session_id, answer }` | `{ session_id, question?, options?, done }` |
| POST | `/api/intake/finalize` | No | `{ session_id }` | `{ report_text, lead_score, score_breakdown, proposal_draft }` |
| POST | `/api/admin/login` | No | `{ username, password }` | Sets `nova_token` cookie |
| POST | `/api/admin/logout` | Yes | — | Clears cookie |
| GET | `/api/admin/contacts` | Yes | — | Array of contacts |
| PATCH | `/api/admin/contacts/:id` | Yes | `{ status }` | Updated contact |
| GET | `/api/admin/contacts/:id/report` | Yes | — | Intake report for contact |
| GET | `/api/admin/projects` | Yes | — | Array of projects |
| POST | `/api/admin/projects` | Yes | `{ title, category, image_url }` | Created project (201) |
| DELETE | `/api/admin/projects/:id` | Yes | — | 204 No Content |
| POST | `/api/admin/ai-chat` | Yes | `{ session_id, question, history }` | `{ answer }` |
| POST | `/api/admin/draft-email` | Yes | `{ session_id, instruction? }` | `{ draft }` |
| POST | `/api/admin/send-prep-email` | Yes | `{ contact_id, email_body }` | `{ ok: true }` |

Auth = `nova_token` httpOnly cookie required.

## Database Schema

**contacts** — stores every submission from the public contact form: name, email, message, status (new/read), and created timestamp. It's the central entity that intake sessions, bookings, and reports all reference.

**projects** — the portfolio entries managed through the admin panel. Title, category, and an image URL. Categories drive the client-side filter on the landing page.

**services** and **stats** — static-ish data seeded once. Services are the "what we do" cards; stats are the animated counters. Both are served via GET endpoints hit by server components.

**slots** — pre-generated 1-hour time blocks for the next 10 weekdays. Each row has a timestamp and a boolean marking whether it's been booked.

**bookings** — links a contact to a slot. The booking endpoint uses a transaction with `SELECT FOR UPDATE` on the slot row to prevent two requests from booking the same slot concurrently.

**intake_sessions** — one row per intake flow a visitor starts. Stores the full conversation as a JSONB array of `{ role, content }` objects, plus the session status (`in_progress` → `ready_for_report` → `complete`).

**intake_reports** — generated once per completed session. Stores the summary report text, the lead score, a `score_breakdown` JSONB column holding the four sub-scores (clarity / urgency / budget_signal / decision_authority), and the proposal draft. Queried by the admin panel when expanding an inquiry. Run `scripts/add_score_breakdown.sql` to add the breakdown column to an existing database.

**events** (MongoDB) — analytics events logged client-side: CTA clicks, page views, and anything else worth tracking. MongoDB suits this better than Postgres because the schema is loose and write volume could spike without needing careful indexing or migrations.

## Design Decisions

PostgreSQL handles everything with a clear relational shape — contacts link to sessions link to reports link to bookings — where foreign keys and joins are actually useful. MongoDB is only used for the analytics event log, where events are loosely structured, there's no need to join against them, and write throughput matters more than relational integrity.

Admin auth uses a JWT stored in an httpOnly cookie rather than localStorage because localStorage is accessible from JavaScript, which makes it an easy target if there's ever an XSS vector. The httpOnly flag means the token is invisible to client-side scripts and gets sent automatically with every request.

DeepSeek V4 Flash was chosen for the intake flow specifically because it's cheap and fast enough for structured question generation — the task is simple enough that paying for frontier reasoning would be wasteful. The Flash (non-reasoning) variant matters here: a reasoning model spends most of its output tokens on hidden chain-of-thought and adds ~10s of latency per call, which is wrong for an interactive form where the visitor is waiting on each question. The BytePlus ModelArk setup was already in place, which removed the friction of trying a different provider.

The intake conversation runs a minimum of 4 rounds and a maximum of 6, with the model deciding where to stop in between. A hard floor guarantees enough signal for a useful lead score and scope draft even when a visitor gives terse answers; the ceiling caps the worst case so the flow can't run indefinitely. Letting the model end early (once past the floor) means a visitor who gives a detailed brief isn't dragged through filler questions, while a vague one gets probed further.

Public-facing surfaces are rate-limited two ways. The contact form is limited per-IP so a single client can't spam submissions. Separately, every outbound AI call is metered against a global per-minute and per-day budget — this protects the shared model quota regardless of which route triggers the call, and degrades gracefully to canned responses instead of erroring when the budget is hit.

Server components are used for the Services, Portfolio, and Stats sections so the data is in the HTML on first load — no client-side fetch, no loading spinner, no layout shift after hydration. It also satisfies the SSR bonus requirement without any extra configuration.

## Known Limitations

Email delivery depends on the Gmail account connected via app password staying active — if Google revokes the app password, emails stop silently. The AI intake flow can occasionally repeat a topic across questions if the model's attention on prior conversation context slips, which is more likely in the later rounds of a longer conversation than the first one or two. The rate-limit state is held in memory, so it resets on restart and won't coordinate across multiple instances — fine for a single-instance deployment, but it would need Redis (or similar) to scale out. Booking slots are generated once from a seed script rather than being synced to any real calendar, so slots need to be manually regenerated as time passes.
