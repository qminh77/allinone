# allinone

![Next.js](https://img.shields.io/badge/Next.js-black?style=flat-square&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)

**One platform. Zero subscriptions. Infinite tools.**

---

## The Story

You know that feeling when you need to convert Base64, then hash a password, then format some JSON, then check DNS records, then... wait, which browser tab was that again? Oh right, you have 47 tabs open across 12 different "free" tools that all want you to:

- 💰 Pay $9.99/month for "Premium"
- 📧 Sign up with your email (hello spam!)
- 🔒 Create yet another account you'll forget
- 💳 Subscribe to their "Pro Plan" just to remove ads
- 🎯 Watch the same "upgrade now" popup 50 times a day

I got tired of it. Really tired. 

Every month, the subscriptions pile up like dirty dishes:
- "DevTools Pro": $12/month
- "ConverterHub Plus": $8/month  
- "HashMaster Premium": $15/month
- "SEO Checker Elite": $19/month

**$54/month** just to do basic developer tasks? Are you kidding me?

So I built **allinone**. One platform. Every tool you need. No credit card required. No "7-day free trial" tricks. No "premium" features locked behind paywalls.

Just tools. Working. Free. Forever.

---

## What's Inside

**50+ professional tools** organized into categories:

### 🔄 Converters
Base64, Binary/Hex/Decimal, Colors (HEX↔RGB↔HSL), CSV/JSON/XML/YAML, HTML/Markdown, Temperature, Speed, and more

### ⚡ Generators  
UUID, ULID, Bcrypt, MD5, Strong Passwords, Lorem Ipsum, URL Slugs, QR Codes, Signatures

### 🧹 Formatters & Optimizers
CSS/JS/HTML Minifier, SQL Formatter, JSON Beautifier, Duplicate Remover, Text Separator

### 🔍 Lookups & Checkers
WHOIS, DNS Records, IP Geolocation, SSL Certificate, User Agent Parser, HTTP Headers

### 🛠️ Utilities
Diff Viewer, Color Picker, Unit Converter, Image Converter, PDF Tools, Spin Wheel

---

## Why allinone?

| Other "Free" Tools | allinone |
|:---|:---|
| ❌ $9.99/month subscription | ✅ Free. Actually free. |
| ❌ "Sign up to continue" | ✅ No account needed (optional for saving) |
| ❌ Ads everywhere | ✅ Clean interface |
| ❌ 3 uses per day limit | ✅ Unlimited usage |
| ❌ Basic features locked | ✅ Every feature available |
| ❌ Data sent to their servers | ✅ Client-side processing when possible |
| ❌ Different UX on each site | ✅ Consistent, modern interface |

---

## Features

**🎨 Modern UI**
- Dark/Light mode that actually looks good
- Responsive design (mobile, tablet, desktop)
- Smooth interactions and instant feedback

**🔐 Security & Privacy**
- Most tools run 100% in your browser (your data never leaves)
- Optional account system with Supabase Auth
- Row-Level Security (RLS) for user data
- Audit logs for security events

**🎭 Role-based Access Control**
- Admin dashboard for managing users
- Customizable permissions system
- Fine-grained access control for teams

**⚡ Performance**
- Fast load times
- Optimized for speed
- Works offline for many tools

---

## Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) v20.9+
- [npm](https://www.npmjs.com/) or `yarn`/`pnpm`
- **Option 1: Local Development** - [Docker](https://www.docker.com/) for Supabase Local ⚡ (Recommended)
- **Option 2: Cloud** - [Supabase](https://supabase.com/) account (free tier works!)

### Installation

```bash
# Clone the repository
git clone https://github.com/qminh77/allinone.git
cd allinone

# Install dependencies
npm ci
```

### Setup (Choose One)

#### 🚀 Option 1: Local Development (Recommended - 10-50x Faster!)

**Benefits:** 1-10ms latency vs 100-500ms on cloud, unlimited requests, works offline

```bash
# Install Supabase CLI
# macOS:
brew install supabase/tap/supabase

# Start Supabase local (first time takes 10-15 min to download Docker images)
supabase start

# Apply migrations and seed baseline data
supabase db reset

# Copy environment template
cp env.template .env.local

# Edit .env.local - use values from `supabase status`:
# NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
# NEXT_PUBLIC_SUPABASE_ANON_KEY=<from-supabase-start-output>
# SUPABASE_SERVICE_ROLE_KEY=<from-supabase-start-output>
# ENCRYPTION_KEY=<openssl rand -hex 32>
# ADMIN_EMAILS=you@example.com

# Run development server
npm run dev
```

**Useful Commands:**
```bash
npm run supabase:status  # Check if Supabase is running
npm run supabase:stop    # Stop Supabase (free RAM)
npm run supabase:reset   # Reset database to migrations
```

**Access Supabase Studio:** http://127.0.0.1:54323 (like phpMyAdmin for Supabase)

#### ☁️ Option 2: Cloud Development

```bash
# Set up environment variables
cp env.template .env.local

# Edit .env.local with your cloud Supabase credentials:
# NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
# SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
# ENCRYPTION_KEY=<openssl rand -hex 32>
# ADMIN_EMAILS=you@example.com

# Apply migrations using Supabase CLI or run all files in supabase/migrations in SQL Editor order
```

### Backend Mode

The app supports both Supabase Local and Supabase Cloud. `supabase/config.toml` is only for local Supabase services. The active backend is selected by `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321` uses local Supabase.
- `NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co` uses the hosted Supabase API.
- `SUPABASE_SERVICE_ROLE_KEY` must stay server-only. Never expose it in client components.
- `ENCRYPTION_KEY` is required for encrypted SMTP passwords.
- `ADMIN_EMAILS` is optional. If no Admin profile exists, the first registered user is promoted to Admin automatically.
- `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` enable production-grade rate limiting.

### File Storage

Server-side tools write temporary files to `/tmp` only, then upload final outputs to the private Supabase Storage bucket `tool-files`. Client-side file tools request a signed upload URL and upload outputs directly from the browser to Supabase Storage before downloading the result locally, so Vercel does not need persistent filesystem storage. Run all migrations through `014_auth_bootstrap_trigger_hardening.sql` before deploying to Vercel so storage, module catalog data, and auth bootstrap are aligned.

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
allinone/
├── app/                    # Next.js App Router
│   ├── (auth)/             # Authentication routes
│   ├── (dashboard)/        # Main dashboard
│   ├── admin/              # Admin panel
│   └── api/                # API endpoints
├── components/
│   ├── tools/              # 50+ tool implementations
│   ├── ui/                 # shadcn/ui components
│   └── ...
├── lib/                    # Utilities & helpers
│   ├── auth/               # Authentication logic
│   ├── supabase/           # Supabase client
│   └── utils.ts
├── public/                 # Static assets
└── supabase/               # Database migrations & types
```

---

## Tech Stack

Built with modern, production-ready technologies:

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI + shadcn/ui
- **Forms**: React Hook Form + Zod
- **State**: Zustand

---

## Contributing

Found a bug? Want to add a tool? Contributions are welcome!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-tool`)
3. Commit your changes (`git commit -m 'Add amazing tool'`)
4. Push to the branch (`git push origin feature/amazing-tool`)
5. Open a Pull Request

---

## License

MIT License - Use it, modify it, share it. Just don't charge people monthly subscriptions for basic tools. 😉

---

## The Bottom Line

Life's too short to juggle 47 browser tabs and remember 23 different passwords just to format some JSON.

**allinone** exists because developers deserve better than subscription fatigue.

Use it. Enjoy it. Build something amazing.

---

<div align="center">

**Made with ☕ and spite against monthly subscriptions**

by [QMinh77](https://github.com/qminh77)

[⭐ Star this repo](https://github.com/qminh77/allinone) if you're also tired of paying $9.99/month for a Base64 encoder

</div>
