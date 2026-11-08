# TripVault

TripVault is a travel-planning and journey-journal frontend built with React, Vite, TypeScript, and Tailwind CSS. The Supabase SQL schema is in `supabase/schema.sql`.

## Connect a Supabase project

A Supabase project must be created in your Supabase account; this repository cannot create a project or access your account credentials. To connect it:

1. Create a project at https://supabase.com/dashboard and wait for its database to finish provisioning.
2. In **SQL Editor**, run the contents of `supabase/schema.sql`. This creates the normalized tables, Auth profile trigger, indexes, and row-level security policies. Do not run it against a database containing tables you need without first reviewing the migration.
3. In **Project Settings → API**, copy the Project URL and the public anon/publishable key (never the `service_role` key).
4. Add these values to Vercel **Project → Settings → Environment Variables** and redeploy:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. For local development, copy `.env.example` to `.env` and set the same values.

The schema is prepared, but the current frontend still uses sample/local-storage trip state and placeholder login. Applying the schema and setting the variables alone does **not** make the current trip UI or login persist to Supabase; Supabase Auth and CRUD wiring must be implemented next. Never place the `service_role` key in a `VITE_` variable or browser code.

## Local setup

1. Install Node.js 20 or later.
2. Run `npm install`.
3. Run `npm run dev`.
4. Run `npm run build` to create a production build.

## Deployment

Connect this repository to Vercel with `main` as the production branch. Confirm the deployment source commit is current; redeploying an older deployment uses its old source revision.
