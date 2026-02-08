# HPCL Lead Intelligence Platform 🎯

A B2B lead intelligence platform for HPCL Direct Sales team. Built with Next.js 14, MongoDB Atlas, and AI-powered lead scoring.

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?logo=typescript)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?logo=mongodb)
![Tailwind](https://img.shields.io/badge/Tailwind-3.4-38B2AC?logo=tailwind-css)

## 🚀 Features

- **AI-Powered Lead Scoring** - OpenAI GPT-4 analyzes signals and infers product needs
- **ML Feedback Learning** - System learns from user approve/reject patterns
- **Real-time Dashboard** - View, filter, and manage leads
- **Email Notifications** - Automatic alerts for high-priority leads
- **Team Email Broadcast** - Share lead info with all sales managers
- **Lead Dossier** - Detailed lead analysis with AI insights
- **Multi-source Ingestion** - RSS feeds, government tenders, manual entry

## 📋 Prerequisites

- Node.js 18+ 
- MongoDB Atlas account (free tier works)
- OpenAI API key (optional - mock data used if not set)
- Gmail account for SMTP (optional)

## 🛠️ Installation

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/hpcl-lead-intel.git
cd hpcl-lead-intel
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy the example environment file:

```bash
cp .env.example .env
```

Then edit `.env` with your credentials:

```env
# MongoDB Connection (REQUIRED)
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?appName=Cluster0
MONGODB_DB=hpcl_leads

# OpenAI API Key (optional - mock data used if not set)
OPENAI_API_KEY=sk-your-openai-api-key-here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Email Configuration (Gmail SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
NOTIFICATION_EMAIL_FROM=your-email@gmail.com
```

### 4. Set up MongoDB Atlas

1. Create a free account at [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a new cluster (M0 free tier is fine)
3. Create a database user with read/write access
4. Get your connection string and add it to `.env`
5. Whitelist your IP address (or use 0.0.0.0/0 for all IPs)

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Seed the database (optional)

Visit `/api/seed` to populate the database with sample data.

## 🌐 Deploying to Vercel

### One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/hpcl-lead-intel)

### Manual Deploy

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and sign in with GitHub
3. Click "New Project" and import your repository
4. Add your environment variables in Vercel dashboard:
   - `MONGODB_URI`
   - `MONGODB_DB`
   - `OPENAI_API_KEY`
   - `NEXT_PUBLIC_APP_URL` (set to your Vercel URL)
   - `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASSWORD` (if using email)
5. Deploy!

### Vercel Cron Jobs

The `vercel.json` file configures a cron job that runs every 5 minutes to scrape for new leads:

```json
{
  "crons": [
    {
      "path": "/api/cron",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

> Note: Cron jobs require Vercel Pro plan. On free tier, you can manually trigger `/api/cron`.

## 📁 Project Structure

```
├── app/
│   ├── api/
│   │   ├── auth/login/     # Authentication
│   │   ├── cron/           # Scheduled scraping
│   │   ├── email-lead/     # Email lead to team
│   │   ├── feedback/       # ML feedback learning
│   │   ├── infer/          # AI inference
│   │   ├── ingest/         # Lead ingestion
│   │   ├── leads/          # Lead CRUD
│   │   ├── notify/         # Notifications
│   │   ├── score/          # Lead scoring
│   │   └── users/          # User management
│   ├── dashboard/          # Main dashboard
│   ├── leads/[id]/         # Lead detail page
│   └── login/              # Login page
├── components/
│   ├── LeadCard.tsx        # Lead card component
│   ├── LeadDossier.tsx     # Full lead dossier
│   ├── Navbar.tsx          # Navigation
│   └── ...
├── lib/
│   ├── mongodb.ts          # Database connection
│   ├── openai.ts           # AI inference
│   ├── scoring.ts          # Lead scoring logic
│   ├── feedback-learning.ts # ML learning module
│   └── types.ts            # TypeScript types
└── public/
```

## 🔌 API Endpoints

### Leads
- `GET /api/leads` - List all leads
- `POST /api/leads` - Create a lead
- `GET /api/leads/[id]` - Get lead details
- `PATCH /api/leads/[id]` - Update lead
- `DELETE /api/leads/[id]` - Delete lead

### Ingestion
- `GET /api/ingest` - Scrape and ingest new leads
- `POST /api/ingest` - Manual lead submission

### Email
- `POST /api/email-lead` - Email lead info to sales team
- `POST /api/notify` - Send notification/email

### ML Feedback
- `POST /api/feedback` - Record approve/reject feedback
- `GET /api/feedback?action=stats` - Get learning statistics

### Other
- `GET /api/stats` - Dashboard statistics
- `GET /api/seed` - Seed database with sample data

## 🧠 ML Feedback Learning

The system learns from user actions to improve lead scoring:

```javascript
// Record feedback
POST /api/feedback
{
  "leadId": "lead_abc123",
  "action": "approved",  // or "rejected", "converted", "contacted"
  "reason": "low_fit",   // optional for rejections
  "notes": "Great lead"  // optional
}

// Get learning stats
GET /api/feedback?action=stats
```

The system:
- Tracks approval rates by industry, source, and geography
- Computes weight adjustments based on patterns
- Applies learned weights to future lead scoring
- Updates automatically every 5 feedbacks (min 10 samples)

## 📧 Email Configuration

For Gmail SMTP:

1. Enable 2-Factor Authentication on your Google account
2. Generate an App Password:
   - Go to Google Account → Security → App passwords
   - Generate a new password for "Mail"
3. Use the app password as `EMAIL_PASSWORD`

## 🔒 Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | Yes | MongoDB connection string |
| `MONGODB_DB` | Yes | Database name (default: `hpcl_leads`) |
| `OPENAI_API_KEY` | No | OpenAI API key for AI inference |
| `NEXT_PUBLIC_APP_URL` | No | App URL for email links |
| `EMAIL_HOST` | No | SMTP host (default: `smtp.gmail.com`) |
| `EMAIL_PORT` | No | SMTP port (default: `587`) |
| `EMAIL_USER` | No | SMTP username |
| `EMAIL_PASSWORD` | No | SMTP password/app password |
| `NOTIFICATION_EMAIL_FROM` | No | From address for emails |

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is proprietary software for HPCL internal use.

---

Built with ❤️ for HPCL Direct Sales Team
