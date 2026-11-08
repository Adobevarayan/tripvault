-- TripVault initial schema for Supabase/PostgreSQL.
-- Safe to apply to a new Supabase project using the SQL Editor or Supabase CLI.
-- This migration does not insert demo trips or fabricate user data.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text not null default '',
  start_location text not null default '',
  travel_mode text not null default 'Car' check (travel_mode in ('Car','Bike','Bus','Train','Flight','Walking')),
  start_date date,
  end_date date,
  travellers integer not null default 1 check (travellers > 0),
  budget numeric(12,2) not null default 0 check (budget >= 0),
  currency text not null default 'INR',
  cover_image text not null default '',
  visibility text not null default 'Private' check (visibility in ('Private','Shared')),
  completed boolean not null default false,
  completion_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date is null or start_date is null or end_date >= start_date)
);

create table if not exists public.trip_members (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('Editor','Viewer')),
  invited_at timestamptz not null default now(),
  unique (trip_id, user_id)
);

create table if not exists public.trip_days (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  day_number integer not null check (day_number > 0),
  title text not null default '',
  trip_date date,
  created_at timestamptz not null default now(),
  unique (trip_id, day_number)
);

create table if not exists public.places (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  name text not null,
  description text not null default '',
  address text not null default '',
  planned_date date,
  visiting_time text not null default '',
  actual_visit_date timestamptz,
  status text not null default 'Planned' check (status in ('Planned','In Progress','Visited','Skipped')),
  latitude double precision,
  longitude double precision,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (latitude is null or latitude between -90 and 90),
  check (longitude is null or longitude between -180 and 180)
);

create table if not exists public.itinerary_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  day_id uuid references public.trip_days(id) on delete set null,
  name text not null,
  description text not null default '',
  activity_date date,
  start_time time,
  end_time time,
  address text not null default '',
  latitude double precision,
  longitude double precision,
  estimated_expense numeric(12,2) not null default 0 check (estimated_expense >= 0),
  priority text not null default 'Medium' check (priority in ('Low','Medium','High')),
  notes text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (latitude is null or latitude between -90 and 90),
  check (longitude is null or longitude between -180 and 180)
);

create table if not exists public.visits (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  place_id uuid not null references public.places(id) on delete cascade,
  visited_at timestamptz not null default now(),
  latitude double precision,
  longitude double precision,
  notes text not null default '',
  created_at timestamptz not null default now(),
  check (latitude is null or latitude between -90 and 90),
  check (longitude is null or longitude between -180 and 180)
);

create table if not exists public.media (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  place_id uuid references public.places(id) on delete set null,
  kind text not null check (kind in ('image','video')),
  storage_path text not null,
  caption text not null default '',
  description text not null default '',
  location text not null default '',
  uploaded_by uuid references auth.users(id) on delete set null,
  uploaded_at timestamptz not null default now()
);

create table if not exists public.memories (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  title text not null,
  description text not null default '',
  memory_date date,
  memory_time time,
  location text not null default '',
  notes text not null default '',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  title text not null,
  amount numeric(12,2) not null check (amount >= 0),
  currency text not null default 'INR',
  expense_date date not null default current_date,
  category text not null default 'Other' check (category in ('Transport','Accommodation','Food','Tickets','Shopping','Fuel','Other')),
  payment_method text not null default '',
  destination text not null default '',
  payer text not null default '',
  notes text not null default '',
  receipt_storage_path text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  name text not null,
  storage_path text not null,
  content_type text,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.trip_exports (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  export_name text not null,
  export_type text not null check (export_type in ('zip','pdf','excel','json')),
  storage_path text,
  generated_at timestamptz not null default now()
);

create index if not exists trips_owner_id_idx on public.trips(owner_id);
create index if not exists trip_members_user_id_idx on public.trip_members(user_id);
create index if not exists trip_members_trip_id_idx on public.trip_members(trip_id);
create index if not exists trip_days_trip_id_idx on public.trip_days(trip_id);
create index if not exists places_trip_id_idx on public.places(trip_id);
create index if not exists itinerary_items_trip_id_idx on public.itinerary_items(trip_id);
create index if not exists visits_trip_id_idx on public.visits(trip_id);
create index if not exists media_trip_id_idx on public.media(trip_id);
create index if not exists memories_trip_id_idx on public.memories(trip_id);
create index if not exists expenses_trip_id_idx on public.expenses(trip_id);
create index if not exists documents_trip_id_idx on public.documents(trip_id);
create index if not exists trip_exports_trip_id_idx on public.trip_exports(trip_id);

-- Keep profile records in sync with Supabase Auth signups.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', '')
  )
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- SECURITY DEFINER helpers avoid recursive membership-policy evaluation.
create or replace function public.current_trip_role(target_trip_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when exists (
      select 1 from public.trips t
      where t.id = target_trip_id and t.owner_id = (select auth.uid())
    ) then 'Owner'
    else (
      select tm.role from public.trip_members tm
      where tm.trip_id = target_trip_id and tm.user_id = (select auth.uid())
      limit 1
    )
  end;
$$;

create or replace function public.can_access_trip(target_trip_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.current_trip_role(target_trip_id) is not null;
$$;

create or replace function public.can_edit_trip(target_trip_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.current_trip_role(target_trip_id) in ('Owner','Editor'), false);
$$;

alter table public.profiles enable row level security;
alter table public.trips enable row level security;
alter table public.trip_members enable row level security;
alter table public.trip_days enable row level security;
alter table public.places enable row level security;
alter table public.itinerary_items enable row level security;
alter table public.visits enable row level security;
alter table public.media enable row level security;
alter table public.memories enable row level security;
alter table public.expenses enable row level security;
alter table public.documents enable row level security;
alter table public.trip_exports enable row level security;

drop policy if exists "profiles_select_self" on public.profiles;
create policy "profiles_select_self" on public.profiles for select to authenticated using (id = (select auth.uid()));
drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self" on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

drop policy if exists "trips_select_members" on public.trips;
create policy "trips_select_members" on public.trips for select to authenticated using (public.can_access_trip(id));
drop policy if exists "trips_insert_owner" on public.trips;
create policy "trips_insert_owner" on public.trips for insert to authenticated with check (owner_id = (select auth.uid()));
drop policy if exists "trips_update_editors" on public.trips;
create policy "trips_update_editors" on public.trips for update to authenticated using (public.can_edit_trip(id)) with check (public.can_edit_trip(id));
drop policy if exists "trips_delete_owner" on public.trips;
create policy "trips_delete_owner" on public.trips for delete to authenticated using (owner_id = (select auth.uid()));

drop policy if exists "trip_members_select_access" on public.trip_members;
create policy "trip_members_select_access" on public.trip_members for select to authenticated using (public.can_access_trip(trip_id));
drop policy if exists "trip_members_owner_manage" on public.trip_members;
create policy "trip_members_owner_manage" on public.trip_members for all to authenticated using (public.current_trip_role(trip_id) = 'Owner') with check (public.current_trip_role(trip_id) = 'Owner' and role in ('Editor','Viewer'));

-- Child records can be read by trip members and changed only by owners/editors.
do $$
declare
  table_name text;
begin
  foreach table_name in array array['trip_days','places','itinerary_items','visits','media','memories','expenses','documents','trip_exports'] loop
    execute format('drop policy if exists %I on public.%I', table_name || '_select_access', table_name);
    execute format('create policy %I on public.%I for select to authenticated using (public.can_access_trip(trip_id))', table_name || '_select_access', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_insert_editors', table_name);
    execute format('create policy %I on public.%I for insert to authenticated with check (public.can_edit_trip(trip_id))', table_name || '_insert_editors', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_update_editors', table_name);
    execute format('create policy %I on public.%I for update to authenticated using (public.can_edit_trip(trip_id)) with check (public.can_edit_trip(trip_id))', table_name || '_update_editors', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_delete_editors', table_name);
    execute format('create policy %I on public.%I for delete to authenticated using (public.can_edit_trip(trip_id))', table_name || '_delete_editors', table_name);
  end loop;
end;
$$;
