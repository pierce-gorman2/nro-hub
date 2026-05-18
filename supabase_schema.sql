-- ============================================================
-- NRO Hub — Supabase Schema
-- Run this in your Supabase SQL editor
-- ============================================================

-- Profiles table (extends Supabase auth.users)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  name text not null,
  email text,
  role text not null default 'member' check (role in ('admin', 'member')),
  created_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'member')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- NRO Assignments (calendar blocks)
create table if not exists public.nro_assignments (
  id uuid default gen_random_uuid() primary key,
  team text not null check (team in ('Team A', 'Team B', 'Team C')),
  market text not null check (market in ('Kansas', 'Nashville', 'San Antonio')),
  phase text not null check (phase in ('travel', 'training', 'soft_open', 'grand_opening')),
  start_date date not null,
  end_date date not null,
  location text,
  created_at timestamptz default now()
);

-- Updates / Announcements
create table if not exists public.updates (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  body text not null,
  author_id uuid references public.profiles(id),
  created_at timestamptz default now()
);

-- Daily Schedule Templates
create table if not exists public.daily_schedules (
  id uuid default gen_random_uuid() primary key,
  phase_name text not null,
  market text not null default 'General',
  content text not null,
  created_at timestamptz default now()
);

-- Documents
create table if not exists public.documents (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  url text not null,
  market text not null default 'General',
  created_at timestamptz default now()
);

-- ============================================================
-- Row-Level Security
-- ============================================================

alter table public.profiles enable row level security;
alter table public.nro_assignments enable row level security;
alter table public.updates enable row level security;
alter table public.daily_schedules enable row level security;
alter table public.documents enable row level security;

-- Profiles: users can read all, update own
create policy "profiles: read all" on public.profiles for select using (true);
create policy "profiles: update own" on public.profiles for update using (auth.uid() = id);

-- NRO Assignments: all authenticated users can read
create policy "assignments: read" on public.nro_assignments for select using (auth.role() = 'authenticated');
-- Only admins can write (enforced in app; add DB-level via role check if desired)
create policy "assignments: insert admin" on public.nro_assignments for insert
  with check ((select role from public.profiles where id = auth.uid()) = 'admin');
create policy "assignments: update admin" on public.nro_assignments for update
  using ((select role from public.profiles where id = auth.uid()) = 'admin');
create policy "assignments: delete admin" on public.nro_assignments for delete
  using ((select role from public.profiles where id = auth.uid()) = 'admin');

-- Updates: all read, admin write
create policy "updates: read" on public.updates for select using (auth.role() = 'authenticated');
create policy "updates: insert admin" on public.updates for insert
  with check ((select role from public.profiles where id = auth.uid()) = 'admin');
create policy "updates: update admin" on public.updates for update
  using ((select role from public.profiles where id = auth.uid()) = 'admin');
create policy "updates: delete admin" on public.updates for delete
  using ((select role from public.profiles where id = auth.uid()) = 'admin');

-- Daily schedules: all read, admin write
create policy "schedules: read" on public.daily_schedules for select using (auth.role() = 'authenticated');
create policy "schedules: insert admin" on public.daily_schedules for insert
  with check ((select role from public.profiles where id = auth.uid()) = 'admin');
create policy "schedules: update admin" on public.daily_schedules for update
  using ((select role from public.profiles where id = auth.uid()) = 'admin');
create policy "schedules: delete admin" on public.daily_schedules for delete
  using ((select role from public.profiles where id = auth.uid()) = 'admin');

-- Documents: all read, admin write
create policy "documents: read" on public.documents for select using (auth.role() = 'authenticated');
create policy "documents: insert admin" on public.documents for insert
  with check ((select role from public.profiles where id = auth.uid()) = 'admin');
create policy "documents: delete admin" on public.documents for delete
  using ((select role from public.profiles where id = auth.uid()) = 'admin');
