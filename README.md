# TripVault

TripVault is a travel-planning and journey-journal frontend built with React, Vite, TypeScript, and Tailwind CSS.

## Deploying with Vercel

Connect this repository to Vercel and set the production branch to `main`. Every push to `main` should trigger a new production deployment. Verify that the deployment's source commit matches the latest commit on `main`; redeploying an older deployment uses its old source revision.

The `date-fns` dependency is pinned to `3.6.0` to avoid resolving to a nonexistent release. The GitHub repository does not include Vercel credentials; deployment is initiated by the Vercel Git integration when enabled.

## Local setup

1. Install Node.js 20 or later.
2. Install dependencies with `npm install`.
3. Copy `.env.example` to `.env` and add your Supabase project URL and anon key if using Supabase.
4. Start the development server with `npm run dev`.
5. Create a production build with `npm run build`.

## Database

See `supabase/schema.sql` for the starter PostgreSQL schema. Review and apply migrations and RLS policies in your Supabase project before using real user data.
