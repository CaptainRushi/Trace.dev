# Google OAuth Configuration Guide

The error **"Access blocked: This app's request is invalid"** means your Google Cloud Console configuration does not match what Supabase is expecting.

Follow these exact steps to fix it:

## 1. Get your Callback URL
Your Supabase project URL is: `https://cnthhwecxkirizfuohpx.supabase.co`

Your **Redirect URI** handling the login is always:
```
https://cnthhwecxkirizfuohpx.supabase.co/auth/v1/callback
```
*(Copy this exact URL)*

## 2. Configure Google Cloud Console
1. Go to the [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Open your Project and go to **APIs & Services > Credentials**.
3. Click the **Edit** (pencil) icon next to your **OAuth 2.0 Client ID**.
4. Under **Authorized JavaScript origins**, add:
   - `https://cnthhwecxkirizfuohpx.supabase.co`
5. Under **Authorized redirect URIs**, add:
   - `https://cnthhwecxkirizfuohpx.supabase.co/auth/v1/callback`
   - *(Optional but recommended for dev)*: `http://localhost:8080` (or your current local port)
6. Click **Save**.

## 3. Configure Supabase Dashboard
1. Go to your [Supabase Dashboard > Authentication > Providers > Google](https://supabase.com/dashboard/project/cnthhwecxkirizfuohpx/auth/providers).
2. Ensure **Enable Sign in with Google** is checked.
3. Paste your **Client ID** and **Client Secret** from the Google Cloud Console.
4. Click **Save**.

## 4. URL Configuration (Supabase)
1. Go to **Authentication > URL Configuration**.
2. **Site URL**: Set this to your production URL or `http://localhost:8080`.
3. **Redirect URLs**: Add `http://localhost:8080` and `http://localhost:8080/*`.

## 5. Test
Clear your browser cache or open an Incognito window and try again. Updates to Google Console can take 2-5 minutes to propagate.
