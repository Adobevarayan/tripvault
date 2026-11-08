# TripVault

TripVault is a premium travel planning and digital journey management app built with React, Vite, TypeScript, Tailwind CSS and Supabase-ready architecture.

## Features

- Landing page and premium travel dashboard
- Authentication screens and profile management
- Trip creation form and trip workspace
- Itinerary planning, destinations, map view and media gallery
- Budget and expense tracking
- Journey completion workflow and archive
- PDF, ZIP, Excel and JSON export triggers
- Supabase client setup and SQL schema starter

## Local setup

1. Install dependencies:
   npm install
2. Create your environment file:
   cp .env.example .env
3. Update the Supabase credentials in `.env`
4. Start the app:
   npm run dev
5. Open the local URL shown in the terminal (default: http://localhost:5173)

## Production build

npm run build

## Database schema

See `supabase/schema.sql` for the initial normalized PostgreSQL table design and RLS starter structure.
