
# Trace.dev

A secure, production-ready developer productivity SaaS backend and frontend.

## 🚀 Features
- **Strict Isolation**: Project-based isolation for all data.
- **Secret Zero**: API keys are encrypted client-side via Edge Functions before storage.
- **Daily Logs**: Track your work, blockers, and plans.
- **Contribution Stats**: Activity graph based on real log data.

## 🛠 Tech Stack
- **Frontend**: React, Vite, TailwindCSS, Shadcn UI
- **Backend**: Supabase (PostgreSQL, Auth, RLS)
- **Logic**: Supabase Edge Functions (Deno)

## 🏃‍♂️  Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Dev Server**
   ```bash
   npm run dev
   ```

3. **Deploy Backend**
   ```bash
   supabase link --project-ref <project-id>
   supabase db push
   supabase functions deploy
   ```

## ⚠️ IDE Notes
- You may see **"Cannot find name 'Deno'"** errors in `supabase/functions`. This is normal if your editor is configured for the React frontend. These files run in a Deno environment and deploy successfully.
- **"Cannot find module"** errors? Run `npm run build` to verify. If the build passes, the aliases are working correctly and the IDE may just need a restart.
