
# Trace.dev

A secure, production-ready developer productivity SaaS backend and frontend with integrated subscription billing.

## 🚀 Features
- **Strict Isolation**: Project-based isolation for all data.
- **Secret Zero**: API keys are encrypted client-side via Edge Functions before storage.
- **Daily Logs**: Track your work, blockers, and plans.
- **Contribution Stats**: Activity graph based on real log data.
- **💳 Subscription Billing**: Razorpay-powered subscription plans (Starter & Pro).

## 🛠 Tech Stack
- **Frontend**: React, Vite, TailwindCSS, Shadcn UI
- **Backend**: Supabase (PostgreSQL, Auth, RLS) + Node.js/Express
- **Logic**: Supabase Edge Functions (Deno)
- **Payments**: Razorpay Subscriptions

## 🏃‍♂️ Getting Started

### 1. Install Dependencies
```bash
# Frontend
npm install

# Backend server
cd server && npm install && cd ..
```

### 2. Configure Environment
```bash
# Copy the example env file
cp .env.example .env

# Edit .env with your credentials:
# - Supabase URL and keys
# - Razorpay credentials
# - Plan IDs
```

### 3. Start Development Servers

**Option A: Run both frontend and backend together**
```bash
npm run dev:all
```

**Option B: Run separately**
```bash
# Terminal 1 - Frontend (Vite)
npm run dev

# Terminal 2 - Backend (Express)
npm run dev:server
```

### 4. Access the App
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- Pricing page: http://localhost:5173/pricing

## 💳 Razorpay Subscription Setup

### Step 1: Create Razorpay Account
1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com)
2. Enable **Test Mode** for development
3. Generate API Keys: Settings → API Keys

### Step 2: Create Subscription Plans
Go to **Subscriptions → Plans → Create Plan**:

| Plan | Amount | Billing Period |
|------|--------|----------------|
| Starter Plan | ₹499 | Monthly |
| Pro Plan | ₹1499 | Monthly |

### Step 3: Configure Environment
Add the credentials to your `.env` file:
```env
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_secret_key

RAZORPAY_PLAN_STARTER=plan_xxxxxxxxxxxx
RAZORPAY_PLAN_PRO=plan_xxxxxxxxxxxx
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/subscription/plans` | List all plans |
| POST | `/api/subscription/create` | Create subscription |
| POST | `/api/subscription/verify` | Verify payment |
| GET | `/api/subscription/status/:id` | Check status |
| POST | `/api/subscription/cancel/:id` | Cancel subscription |

## 🚀 Deploy Backend

```bash
# Supabase (Database & Edge Functions)
supabase link --project-ref <project-id>
supabase db push
supabase functions deploy

# Node.js Server (for Razorpay)
# Deploy to: Railway, Render, Fly.io, or your preferred platform
```

## ⚠️ IDE Notes
- You may see **"Cannot find name 'Deno'"** errors in `supabase/functions`. This is normal if your editor is configured for the React frontend. These files run in a Deno environment and deploy successfully.
- **"Cannot find module"** errors? Run `npm run build` to verify. If the build passes, the aliases are working correctly and the IDE may just need a restart.

## 🔒 Security Notes
- Never commit `.env` files with real credentials
- Use `.env.example` as a template
- Razorpay `KEY_SECRET` must never be exposed to the frontend
- All payment verification happens server-side
