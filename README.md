# TripVault Supabase connection and database setup

The app now includes Supabase email/password sign-in, account registration and reset-link flow, plus database-backed trip creation/listing/completion and expense CRUD. Data access is enforced by PostgreSQL RLS policies.

## Required account setup

A Supabase project and its credentials are account-specific. Add these values in Vercel → Project → Settings → Environment Variables (Production, Preview, and Development as needed), then redeploy:

- `VITE_SUPABASE_URL` — your project URL
- `VITE_SUPABASE_ANON_KEY` — the publishable key (`sb_publishable_...`) or legacy anon public key

These are public frontend configuration values. Never provide or use the service-role/secret key in the browser.

For local development, copy `.env.example` to `.env` and replace the placeholders.

## Create the database schema

In the Supabase project, open **SQL Editor**, paste and run `supabase/schema.sql`. It creates the normalized TripVault tables, indexes, profile-on-signup trigger, and RLS policies. Review the SQL first if your project already contains data. Then enable email/password in Supabase Authentication settings and configure the allowed redirect URLs for your deployed Vercel domain.

## What the app currently persists

- Supabase Auth: registration, sign-in, sign-out, and password reset email.
- `trips`: list, create, complete and reopen trips.
- `expenses`: list and create expenses for a selected trip.

Other workspace modules (places, itinerary, media, memories, uploads and exports) still require their respective UI persistence wiring. Media storage buckets/policies are not created by this schema. The app does not import demo/sample trip data into your account.

## Local commands

```sh
npm install
npm run dev
npm run build
```
