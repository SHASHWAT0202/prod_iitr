<p align="center">
  <img src="public/images.jpg" alt="HPCL Logo" width="120" height="120" style="border-radius: 20px;">
</p>

<h1 align="center">🛢️ HPCL LeadSense AI</h1>

<p align="center">
  <strong>AI-Powered B2B Lead Intelligence & Competitor Monitoring for HPCL Direct Sales</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14.0-000000?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js">
  <img src="https://img.shields.io/badge/TypeScript-5.3-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB">
  <img src="https://img.shields.io/badge/OpenAI-GPT--4-412991?style=for-the-badge&logo=openai&logoColor=white" alt="OpenAI">
  <img src="https://img.shields.io/badge/Tailwind-3.4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind">
  <img src="https://img.shields.io/badge/Framer_Motion-10.18-FF0055?style=for-the-badge&logo=framer&logoColor=white" alt="Framer Motion">
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-competitor-intelligence">Competitor Intel</a> •
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-deployment">Deployment</a> •
  <a href="#-api-reference">API</a> •
  <a href="#-architecture">Architecture</a>
</p>

---

## 📖 Overview

**HPCL LeadSense AI** is a comprehensive B2B lead intelligence and competitor monitoring platform built for HPCL's Direct Sales team. It combines multi-source signal detection, AI-powered analysis, machine learning feedback loops, and real-time competitor tracking to identify, score, and prioritize business opportunities across India's petroleum and energy sector.

### Why This Platform?

| Problem | Solution |
|---------|----------|
| Sales officers discover leads days/weeks late | **Multi-source scrapers** surface leads in real-time from 4 news sources |
| No visibility into competitor moves | **Competitor Intelligence** monitors IOCL, BPCL, Reliance, Shell & Nayara activities |
| Manual scoring is inconsistent & slow | **5-factor AI scoring** with explainable breakdowns and auto-learning |
| Lead reports require manual compilation | **One-click PDF dossiers** with executive-ready formatting |
| No feedback loop to improve quality | **ML system** learns from approve/reject patterns to continuously improve |

---

## ✨ Features

### 🎯 Lead Intelligence

| Feature | Description |
|---------|-------------|
| **AI Lead Scoring** | 5-factor weighted scoring — Intent (35), Freshness (20), Company Scale (20), Source Trust (15), Geography Match (10) — totalling 100 points |
| **GPT-4 Inference** | Extracts company name, industry, products, urgency, confidence, and recommended next action from raw signal text |
| **ML Feedback Learning** | Learns from user approve/reject/convert actions to adjust scoring weights per industry, source, geography, and keyword |
| **Multi-Source Scraping** | 4 parallel news sources — Google News RSS (free/unlimited), NewsData.io, MediaStack, NewsAPI — with MongoDB-tracked monthly quotas |
| **Auto-Rescore** | Stale leads are automatically rescored when viewed to reflect updated weights |
| **Geographic Routing** | Maps leads to HPCL Direct Sales regions (Delhi, Mumbai, Chennai, Kolkata, etc.) |

### 🕵️ Competitor Intelligence

| Feature | Description |
|---------|-------------|
| **5 Competitors Tracked** | IOCL, BPCL, Reliance/Jio-bp, Shell India, Nayara Energy |
| **12 Activity Types** | EV Charging, Hydrogen, New Plant, Green Energy, Partnership, Gov't Contract, Acquisition, Technology, Retail Expansion, Supply Chain, Infrastructure, Pricing |
| **Impact Assessment** | 4-level classification — 🔴 Critical, 🟠 High, 🟡 Medium, 🟢 Low |
| **HPCL Strategic Implications** | AI-generated actionable recommendations for each competitor signal |
| **Dedicated Dashboard** | Color-coded competitor cards, filterable activity feed, analytics sidebar with threat grid and geo hotspots |

### 📊 Dashboard & Analytics

| Feature | Description |
|---------|-------------|
| **Real-time Dashboard** | Live lead counts, conversion rates, avg scores, weekly trends, sector distribution, top products |
| **Lead Detail View** | 3-tab dossier (Overview, AI Analysis, Actions) with 5-dimension score radar |
| **Executive PDF Reports** | Branded multi-page PDF with KPIs, product recommendations, score breakdown, and action items |
| **Org Admin Panel** | User management (CRUD), role assignment (sales/manager/admin/org_admin), per-user conversion metrics |
| **Dark Mode** | Full dark mode support across all pages |

### 🔔 Notifications & Alerts

| Feature | Description |
|---------|-------------|
| **In-App Notifications** | Categorized alerts (new_lead, status_change, high_priority, system) with mark-all-read and click-to-navigate |
| **Email Alerts** | Automatic SMTP notifications for high-priority leads via Gmail |
| **Team Broadcast** | One-click lead sharing to entire sales team with formatted email templates |
| **Mobile PWA** | Dark-themed mobile view with auto-refresh (30s), native push permission, and DS region mapping |

### 🔐 Authentication & Security

| Feature | Description |
|---------|-------------|
| **User Auth** | Email/password login with bcrypt hashing |
| **Role-Based Access** | 4 roles — Sales Rep, Manager, Admin, Org Admin — with gated UI sections |
| **Forgot/Reset Password** | Full password recovery flow |
| **Session Management** | Last login tracking, status checks (active/inactive/suspended) |

---

## 🕵️ Competitor Intelligence

The Competitor Intelligence module provides real-time monitoring of HPCL's key competitors in the petroleum and energy sector.

### How It Works

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Google News    │     │   NewsData.io    │     │   MediaStack    │
│  RSS (Free)     │────►│   (Paid API)     │────►│   (Paid API)    │
└────────┬────────┘     └────────┬─────────┘     └────────┬────────┘
         │                       │                         │
         └───────────┬───────────┘─────────────────────────┘
                     ▼
         ┌───────────────────────┐
         │  Signal Processing    │
         │  • Detect Competitor  │
         │  • Classify Activity  │
         │  • Assess Impact      │
         │  • Generate HPCL      │
         │    Implication         │
         └───────────┬───────────┘
                     ▼
         ┌───────────────────────┐
         │  MongoDB Storage      │
         │  competitor_signals   │
         │  (dedup via hash)     │
         └───────────┬───────────┘
                     ▼
         ┌───────────────────────┐
         │  Competitor Dashboard  │
         │  /dashboard/competitors│
         └───────────────────────┘
```

### Competitor Dashboard

- **Competitor Cards** — Color-coded tiles (IOCL=orange, BPCL=yellow, Reliance=blue, Shell=red, Nayara=emerald) showing signal count per competitor
- **Activity Feed** — Expandable signal cards with competitor badge, impact level, activity icon, geographic tag, relative timestamps, and strategic implication callout
- **Filters** — By competitor, impact level (critical/high/medium/low), activity type, and time range (7/14/30/90 days)
- **Analytics Sidebar** — Activity type bar chart, 2×2 threat level grid, geographic hotspots, and intelligence summary

### Scan Triggers

| Trigger | Method |
|---------|--------|
| Manual scan | Click "Scan Now" on the competitor dashboard |
| Cron schedule | `POST /api/competitors` runs daily at 6 AM UTC alongside lead scraper |
| API call | `POST /api/competitors` from any client |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+**
- **MongoDB Atlas** account ([free tier](https://cloud.mongodb.com) works)
- **OpenAI API Key** (optional — mock inference available for testing)
- **Gmail Account** for SMTP notifications (optional)
- **News API keys** (optional — Google RSS works free without keys)

### Installation

```bash
# Clone the repository
git clone https://github.com/SHASHWAT0202/prod_iitr.git
cd prod_iitr

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your credentials (see Configuration section)

# Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the platform.

### Seed Sample Data

Navigate to `/api/seed` in your browser to populate the database with sample leads for testing. Seeds are scored dynamically using the scoring engine.

### Default Login

After seeding, use the credentials created during setup to access the dashboard at `/login`.

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# ─── Database (Required) ───────────────────────────────
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net
MONGODB_DB=hpcl_leads

# ─── AI Inference (Optional — mock available) ──────────
OPENAI_API_KEY=sk-your-key-here

# ─── Application ───────────────────────────────────────
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ─── Email Notifications (Optional) ────────────────────
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
NOTIFICATION_EMAIL_FROM=HPCL LeadSense AI <your-email@gmail.com>

# ─── News Scraper APIs (Optional — RSS is free) ────────
NEWSDATA_API_KEY=your-newsdata-key
MEDIASTACK_API_KEY=your-mediastack-key
NEWSAPI_KEY=your-newsapi-key

# ─── Cron Security (Optional) ──────────────────────────
CRON_SECRET=your-cron-secret
```

### Gmail SMTP Setup

1. Enable 2-Factor Authentication on your Google Account
2. Go to **Google Account → Security → App Passwords**
3. Generate a new app password for "Mail"
4. Use the 16-character password as `EMAIL_PASSWORD`

### News API Rate Limits

| Source | Free Tier | Rate Limit |
|--------|-----------|------------|
| Google News RSS | Unlimited | No key required |
| NewsData.io | 200 req/day | 90 req/month tracked |
| MediaStack | 100 req/month | 90 req/month tracked |
| NewsAPI | 100 req/day | Supplementary |

Rate limits are tracked in the `api_usage` MongoDB collection with a 10-call safety buffer. Google RSS is always the primary source.

---

## 🌐 Deployment

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/SHASHWAT0202/prod_iitr)

**Steps:**

1. Push code to GitHub
2. Import repository in [Vercel Dashboard](https://vercel.com)
3. Add all environment variables from the Configuration section
4. Deploy!

### Cron Jobs

The platform runs automated scraping via Vercel Cron. Both the lead scraper and competitor scraper execute in parallel:

```json
{
  "crons": [{
    "path": "/api/cron",
    "schedule": "0 6 * * *"
  }]
}
```

**What runs on each cron tick:**
- `GET /api/scraper` — Scrapes leads from 4 news sources, runs AI inference, scores, and sends notifications
- `POST /api/competitors` — Scrapes competitor signals, classifies activities, assesses impact, stores in MongoDB

> **Note**: Vercel Hobby plans support daily cron only (6 AM UTC / 11:30 AM IST). Pro plans enable higher frequency.

---

## 📚 API Reference

### Lead Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/leads` | List leads with filters (status, urgency, region, search) |
| `POST` | `/api/leads` | Create a new lead |
| `GET` | `/api/leads/[id]` | Get full lead details |
| `PATCH` | `/api/leads/[id]` | Update lead status, notes, assignment |
| `DELETE` | `/api/leads/[id]` | Remove a lead |

### AI & Scoring

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/infer` | Run GPT-4 inference on signal text (or mock) |
| `POST` | `/api/score` | Rescore a lead with current weights |
| `POST` | `/api/feedback` | Record approve/reject/convert feedback for ML learning |
| `GET` | `/api/feedback?action=stats` | View ML learning statistics and weight adjustments |

### Scraping & Ingestion

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/scraper` | Run multi-source lead scraper (Google RSS + paid APIs) |
| `GET` | `/api/ingest` | Legacy scrape endpoint |
| `POST` | `/api/ingest` | Manual signal submission |
| `GET` | `/api/cron` | Trigger scheduled scrape + competitor scan |

### Competitor Intelligence

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/competitors` | Fetch stored signals with filters (competitor, activity, impact, geo, days) + analytics stats |
| `POST` | `/api/competitors` | Trigger competitor scraper scan; returns new signals, duplicates, breakdowns |

### Notifications

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/email-lead` | Broadcast lead to entire sales team |
| `POST` | `/api/notify` | Send notification email to specific recipient |
| `GET` | `/api/test-notify` | Test notification delivery |

### Users & Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/login` | Email/password authentication |
| `GET` | `/api/users` | List all users (admin) |
| `POST` | `/api/users` | Create new user with role assignment |
| `PATCH` | `/api/users/[id]` | Update user profile, role, or status |
| `DELETE` | `/api/users/[id]` | Remove a user |

### Utilities

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/stats` | Dashboard statistics and analytics |
| `GET` | `/api/seed` | Seed database with sample leads |
| `POST` | `/api/cleanup` | Remove stale/duplicate data |

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                        HPCL LeadSense AI                             │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐       │
│  │   Next.js    │    │   MongoDB    │    │   OpenAI GPT-4   │       │
│  │  14 App Dir  │◄──►│    Atlas     │◄──►│  (or Mock Mode)  │       │
│  │  + API Routes│    │  8 Collections│   │                  │       │
│  └──────┬───────┘    └──────┬───────┘    └──────────────────┘       │
│         │                   │                                        │
│  ┌──────▼───────────────────▼────────────────────────────────────┐  │
│  │                  Multi-Source Scraper Engine                    │  │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ │  │
│  │  │ Google RSS │ │ NewsData   │ │ MediaStack │ │  NewsAPI   │ │  │
│  │  │  (Free)    │ │  (.io)     │ │            │ │            │ │  │
│  │  └─────┬──────┘ └─────┬──────┘ └─────┬──────┘ └─────┬──────┘ │  │
│  │        └───────┬───────┘──────────────┘──────────────┘        │  │
│  │                ▼                                               │  │
│  │  ┌──────────────────────────────────────────────────────────┐ │  │
│  │  │ Lead Scraper → AI Inference → Score → Notify → Store     │ │  │
│  │  │ Competitor Scraper → Classify → Impact → Implication     │ │  │
│  │  └──────────────────────────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                  ML Feedback Learning                         │   │
│  │  • Tracks approve/reject/convert patterns per lead           │   │
│  │  • Adjusts weights by industry, source, geography, keyword   │   │
│  │  • Minimum 10 samples → auto weight update                   │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────┐ │
│  │  Dashboard   │  │ Competitor  │  │  Org Admin  │  │  Mobile   │ │
│  │  (Leads)     │  │  Intel      │  │  (Users)    │  │  PWA      │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └───────────┘ │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### MongoDB Collections

| Collection | Purpose |
|------------|---------|
| `leads` | Lead records with scores, status, AI analysis |
| `users` | User accounts with roles, regions, bcrypt passwords |
| `notifications` | In-app notification history |
| `products` | HPCL product catalog |
| `signals` | Raw ingested news signals |
| `analytics` | Dashboard metrics and trends |
| `feedback` | ML feedback actions for learning |
| `learned_weights` | Current ML weight adjustments |
| `api_usage` | Monthly rate limit tracking for paid APIs |
| `competitor_signals` | Competitor activity signals with impact assessment |

### Project Structure

```
prod_iitr/
├── app/
│   ├── page.tsx                   # Landing page
│   ├── layout.tsx                 # Root layout with metadata
│   ├── about/page.tsx             # About LeadSense AI
│   ├── contact/page.tsx           # Contact page
│   ├── login/page.tsx             # Authentication
│   ├── mobile/page.tsx            # Mobile PWA notification view
│   ├── api/
│   │   ├── auth/login/            # Login endpoint
│   │   ├── competitors/           # Competitor intelligence API
│   │   ├── cron/                  # Scheduled scraper + competitor scan
│   │   ├── email-lead/            # Team email broadcast
│   │   ├── feedback/              # ML feedback system
│   │   ├── infer/                 # AI inference (GPT-4 / mock)
│   │   ├── ingest/                # Signal ingestion
│   │   ├── leads/                 # Lead CRUD + [id] routes
│   │   ├── notify/                # Email notifications
│   │   ├── score/                 # Lead scoring engine
│   │   ├── scraper/               # Multi-source news scraper
│   │   ├── seed/                  # Database seeding
│   │   ├── stats/                 # Analytics data
│   │   └── users/                 # User management + [id]
│   ├── dashboard/
│   │   ├── page.tsx               # Main lead dashboard
│   │   ├── competitors/page.tsx   # Competitor intelligence dashboard
│   │   └── org/page.tsx           # Org admin user management
│   └── leads/[id]/page.tsx        # Lead detail & dossier view
├── components/
│   ├── ErrorBoundary.tsx          # Error boundary with inline fallback
│   ├── Footer.tsx                 # Site footer
│   ├── Header.tsx                 # Site header
│   ├── LeadCard.tsx               # Lead card with score, status, actions
│   ├── LeadDossier.tsx            # 3-tab dossier + PDF export
│   ├── LoadingSpinner.tsx         # Spinner, card skeletons, page skeleton
│   ├── Navbar.tsx                 # Navigation bar
│   ├── Notification.tsx           # Notification dropdown
│   └── Sidebar.tsx                # Dashboard sidebar
├── lib/
│   ├── competitor-scraper.ts      # Competitor signal scraper engine
│   ├── feedback-learning.ts       # ML weight learning system
│   ├── mockData.ts                # Fallback mock data
│   ├── mongodb.ts                 # MongoDB Atlas connection + collections
│   ├── multi-scraper.ts           # 4-source news scraper with rate limiting
│   ├── openai.ts                  # GPT-4 inference + mock fallback
│   ├── rate-limit.ts              # API rate limiting utilities
│   ├── scoring.ts                 # 5-factor lead scoring engine
│   ├── seed-database.ts           # Database seed script
│   └── types.ts                   # All TypeScript type definitions
├── styles/
│   └── globals.css                # Tailwind + custom styles
├── public/
│   ├── manifest.json              # PWA manifest
│   └── robots.txt                 # Search engine directives
├── vercel.json                    # Vercel cron configuration
├── next.config.js                 # Next.js configuration
├── tailwind.config.js             # Tailwind CSS configuration
├── tsconfig.json                  # TypeScript configuration
└── package.json                   # Dependencies & scripts
```

---

## 🧠 Scoring Engine

### 5-Factor Weighted Scoring

Every lead is scored on a 100-point scale using five explainable factors:

| Factor | Weight | What It Measures |
|--------|--------|-----------------|
| **Intent Strength** | 35 | Buying signals, keywords (tender, procurement, expansion), AI confidence |
| **Freshness** | 20 | Recency decay — today=100%, 3 days=85%, 7 days=60%, 30 days=20% |
| **Company Scale** | 20 | Size indicators — crore, billion, mega, large-scale in signal text |
| **Source Trust** | 15 | Source reliability score 0–100% (govt tender > news > social) |
| **Geography Match** | 10 | Match to HPCL sales territories via configurable region map |

### ML Feedback Learning

The scoring system continuously improves through a feedback loop:

1. **Feedback Collection** — Every approve/reject/convert action is recorded with the lead's score components
2. **Segmented Analysis** — Success rates analyzed by industry, source type, geography, and keyword
3. **Weight Adjustment** — Multipliers computed per segment when sample size ≥ 10
4. **Auto-Update** — Scoring weights refresh automatically every 5 new feedback actions

```javascript
// Record feedback
POST /api/feedback
{
  "leadId": "lead_abc123",
  "action": "approved",       // approved | rejected | converted | contacted
  "reason": "good_fit",       // optional context
  "notes": "Strong buying signal"
}

// View learning stats
GET /api/feedback?action=stats
// → conversion rates, weight adjustments, sample sizes per segment
```

---

## 📄 PDF Dossier Reports

Generate professional executive-ready PDF reports for any lead:

| Section | Contents |
|---------|----------|
| **Header** | HPCL branding, report date, lead ID |
| **Company Overview** | Name, industry, location, score badge, urgency level |
| **Intelligence Source** | Signal source, capture date, trust score, AI confidence percentage |
| **Product Recommendations** | Top 3 HPCL products with reason codes |
| **Suggested Next Action** | Prominent action recommendation box |
| **Score Breakdown** | Visual bars for all 5 scoring factors |
| **Workflow Status** | Current status, assigned officer, notes |

Click **"Download Report"** on any lead detail page to generate instantly.

---

## 🔐 Security

- All passwords hashed with **bcrypt** (never stored in plaintext)
- `.env` files excluded from version control via `.gitignore`
- Environment variables used for all secrets and API keys
- MongoDB Atlas provides encryption at rest and in transit
- Role-based access control gates admin features
- API rate limiting prevents abuse of paid news APIs
- Cron endpoints support bearer token verification

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 14.0.4 (App Router) |
| **Language** | TypeScript 5.3.3 |
| **Database** | MongoDB Atlas (mongodb 7.1.0) |
| **AI** | OpenAI GPT-4 Turbo (with mock fallback) |
| **Styling** | Tailwind CSS 3.4.0 |
| **Animations** | Framer Motion 10.18.0 |
| **PDF Export** | jsPDF 4.1.0 |
| **Auth** | bcryptjs 3.0.3 |
| **Email** | Nodemailer 8.0.1 (Gmail SMTP) |
| **Icons** | React Icons 5.5.0 |
| **Hosting** | Vercel (with Cron Jobs) |

---

## 📱 Pages & Routes

| Route | Type | Description |
|-------|------|-------------|
| `/` | Public | Landing page with platform overview |
| `/about` | Public | About LeadSense AI, mission, team, milestones |
| `/contact` | Public | Contact information |
| `/login` | Public | User authentication |
| `/dashboard` | Protected | Main lead intelligence dashboard |
| `/dashboard/competitors` | Protected | Competitor intelligence monitoring dashboard |
| `/dashboard/org` | Admin | Organization user management panel |
| `/leads/[id]` | Protected | Lead detail view with dossier, AI analysis, and actions |
| `/mobile` | Protected | Mobile PWA view for high-priority alert notifications |

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -m 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Open a Pull Request

---

## 📝 License

Proprietary software for HPCL internal use only.

---

<p align="center">
  <strong>Built with ❤️ for HPCL Direct Sales Team</strong>
</p>

<p align="center">
  <sub>Powered by Next.js 14 • MongoDB Atlas • OpenAI GPT-4 • Tailwind CSS • Framer Motion</sub>
</p>
