<p align="center">
  <img src="public/images.jpg" alt="HPCL Logo" width="120" height="120" style="border-radius: 20px;">
</p>

<h1 align="center">HPCL Lead Intelligence Platform</h1>

<p align="center">
  <strong>AI-Powered B2B Lead Management for HPCL Direct Sales</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14.0-000000?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js">
  <img src="https://img.shields.io/badge/TypeScript-5.3-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB">
  <img src="https://img.shields.io/badge/OpenAI-GPT--4-412991?style=for-the-badge&logo=openai&logoColor=white" alt="OpenAI">
  <img src="https://img.shields.io/badge/Tailwind-3.4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind">
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-deployment">Deployment</a> •
  <a href="#-api-reference">API</a> •
  <a href="#-architecture">Architecture</a>
</p>

---

## 📖 Overview

HPCL Lead Intelligence Platform is a comprehensive B2B lead management system designed specifically for HPCL's Direct Sales team. It combines real-time signal detection, AI-powered analysis, and machine learning to identify, score, and prioritize potential business opportunities in the petroleum sector.

### Why This Platform?

- **Reduce Time-to-Contact**: Automatically surfaces high-priority leads so sales officers can act within hours, not days
- **AI-Driven Insights**: GPT-4 analyzes signals and recommends products with reasoning
- **Continuous Learning**: ML system learns from approve/reject patterns to improve scoring
- **Unified Dashboard**: Single view of all leads across regions and sources

---

## ✨ Features

### 🎯 Core Capabilities

| Feature | Description |
|---------|-------------|
| **AI Lead Scoring** | GPT-4 powered scoring with explainable breakdowns (intent, freshness, scale, geography, source trust) |
| **ML Feedback Learning** | System learns from user actions to continuously improve lead quality predictions |
| **Real-time Dashboard** | Live views with filtering by status, urgency, region, and search |
| **Multi-Source Ingestion** | RSS feeds, government tenders, news APIs, manual submissions |
| **Executive PDF Reports** | One-click downloadable lead dossiers with full analysis |
| **Team Email Broadcast** | Instantly notify all sales managers about hot leads |

### 🔔 Notifications & Alerts

- **Email Alerts**: Automatic notifications for high-priority leads
- **Team Broadcast**: Share lead intelligence with the entire sales team
- **WhatsApp Integration**: Optional Twilio-powered WhatsApp notifications

### 📊 Analytics & Reporting

- Dashboard statistics with trend indicators
- Lead conversion tracking
- Score breakdown visualization
- Downloadable PDF executive reports

---

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** 
- **MongoDB Atlas** account ([free tier](https://cloud.mongodb.com) works perfectly)
- **OpenAI API Key** (optional - mock inference available)
- **Gmail Account** for SMTP notifications (optional)

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/hpcl-lead-intel.git
cd hpcl-lead-intel

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your credentials

# Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the dashboard.

### Seed Sample Data

Navigate to `/api/seed` to populate the database with sample leads for testing.

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file with the following variables:

```env
# Database (Required)
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net
MONGODB_DB=hpcl_leads

# AI Inference (Optional)
OPENAI_API_KEY=sk-your-key-here

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Email Notifications (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
NOTIFICATION_EMAIL_FROM=HPCL Lead Intelligence <your-email@gmail.com>

# News API for real signals (Optional)
NEWSAPI_KEY=your-newsapi-key
```

### Gmail SMTP Setup

1. Enable 2-Factor Authentication on Google Account
2. Go to **Google Account → Security → App Passwords**
3. Generate a new app password for "Mail"
4. Use the 16-character password as `EMAIL_PASSWORD`

---

## 🌐 Deployment

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/hpcl-lead-intel)

**Manual Steps:**

1. Push code to GitHub
2. Import repository in [Vercel Dashboard](https://vercel.com)
3. Add environment variables:
   - `MONGODB_URI`
   - `MONGODB_DB`
   - `OPENAI_API_KEY`
   - `NEXT_PUBLIC_APP_URL` (your Vercel URL)
   - Email variables if needed
4. Deploy!

### Cron Jobs

The platform includes automated lead scraping via Vercel Cron:

```json
{
  "crons": [{
    "path": "/api/cron",
    "schedule": "0 6 * * *"
  }]
}
```

> **Note**: Hobby plans support daily cron jobs only (runs at 6 AM UTC / 11:30 AM IST). Pro plans enable higher frequency.

---

## 📚 API Reference

### Lead Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/leads` | List all leads with filtering |
| `POST` | `/api/leads` | Create a new lead |
| `GET` | `/api/leads/[id]` | Get lead details |
| `PATCH` | `/api/leads/[id]` | Update lead status/notes |
| `DELETE` | `/api/leads/[id]` | Remove a lead |

### AI & Scoring

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/infer` | Run AI inference on signal text |
| `POST` | `/api/score` | Update lead score and status |
| `POST` | `/api/feedback` | Record ML feedback |
| `GET` | `/api/feedback?action=stats` | Get learning statistics |

### Notifications

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/email-lead` | Broadcast lead to sales team |
| `POST` | `/api/notify` | Send notification email |

### Data Ingestion

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/ingest` | Scrape new signals |
| `POST` | `/api/ingest` | Manual signal submission |
| `GET` | `/api/cron` | Trigger scheduled scrape |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     HPCL Lead Intelligence                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   Next.js    │    │   MongoDB    │    │   OpenAI     │      │
│  │   Frontend   │◄──►│    Atlas     │◄──►│   GPT-4      │      │
│  │   + API      │    │              │    │              │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│         │                   │                    │               │
│         ▼                   ▼                    ▼               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   ML Feedback System                      │  │
│  │  • Tracks approve/reject patterns                         │  │
│  │  • Computes weight adjustments                            │  │
│  │  • Updates scoring model automatically                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │  RSS Feeds   │    │  NewsAPI     │    │  Tenders     │      │
│  │              │──► │              │──► │              │──►   │
│  │  Ingestion   │    │  Scraping    │    │  Monitoring  │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Project Structure

```
hpcl-lead-intel/
├── app/
│   ├── api/
│   │   ├── auth/login/      # Authentication
│   │   ├── cron/            # Scheduled tasks
│   │   ├── email-lead/      # Team email broadcast
│   │   ├── feedback/        # ML feedback system
│   │   ├── infer/           # AI inference
│   │   ├── ingest/          # Signal ingestion
│   │   ├── leads/           # Lead CRUD
│   │   ├── notify/          # Notifications
│   │   ├── score/           # Scoring engine
│   │   └── stats/           # Analytics
│   ├── dashboard/           # Main dashboard
│   │   └── org/             # Org admin view
│   ├── leads/[id]/          # Lead detail view
│   └── login/               # Authentication
├── components/
│   ├── LeadCard.tsx         # Lead card display
│   ├── LeadDossier.tsx      # Full lead analysis + PDF export
│   ├── Sidebar.tsx          # Navigation sidebar
│   └── ...
├── lib/
│   ├── mongodb.ts           # Database connection
│   ├── openai.ts            # AI inference module
│   ├── scoring.ts           # Lead scoring logic
│   ├── feedback-learning.ts # ML learning engine
│   └── types.ts             # TypeScript definitions
└── public/
    └── images.jpg           # HPCL logo
```

---

## 🧠 ML Feedback Learning

The platform incorporates a continuous learning system that improves lead scoring based on user feedback.

### How It Works

1. **Feedback Collection**: Every approve/reject/convert action is recorded
2. **Pattern Analysis**: System analyzes success rates by industry, source, geography
3. **Weight Computation**: Adjustments calculated based on statistical significance
4. **Model Update**: Scoring weights updated automatically (every 5 feedbacks, min 10 samples)

### Feedback API

```javascript
// Record user action
POST /api/feedback
{
  "leadId": "lead_abc123",
  "action": "approved",     // approved, rejected, converted, contacted
  "reason": "good_fit",     // optional: low_fit, wrong_geo, etc.
  "notes": "Great lead!"    // optional notes
}

// View learning stats
GET /api/feedback?action=stats
// Returns: conversion rates, weight adjustments, sample sizes
```

---

## 📄 PDF Reports

Generate professional executive-style PDF reports for any lead:

- **Company Overview**: Name, industry, location, score, urgency
- **Why This Lead**: Source, capture date, trust score, AI confidence
- **Product Recommendations**: Top 3 products with reason codes
- **Suggested Next Action**: Prominent action box
- **Score Breakdown**: Visual bars for each scoring factor
- **Workflow Status**: Assignment and notes

Click **"Download Report"** on any lead detail page to generate.

---

## 🔐 Security Notes

- Never commit `.env` files to version control
- Use environment variables for all secrets
- MongoDB Atlas provides built-in encryption
- API routes validate session before data access

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
  <sub>Powered by Next.js, MongoDB Atlas, and OpenAI</sub>
</p>
