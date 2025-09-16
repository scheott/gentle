create extension if not exists pgcrypto;

create table users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  role text default 'elder',
  created_at timestamptz default now()
);

create table domain_reputation (
  domain text primary key,
  score real not null check (score between 0 and 1),
  label text not null, -- 'reputable' | 'mixed' | 'junk'
  notes text,
  source text,
  updated_at timestamptz default now()
);

create table url_checks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  url text not null,
  url_hash text not null,
  score int,
  verdict text,
  reasons jsonb,
  summary text,
  model_versions jsonb,
  cached boolean default false,
  created_at timestamptz default now()
);
create index on url_checks (user_id, created_at desc);
create index on url_checks (url_hash);

-- sql/001_schema.sql
-- Enable pgcrypto for gen_random_uuid in Supabase (already enabled in most projects)
-- create extension if not exists pgcrypto;

create table if not exists profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text default 'user' check (role in ('user','admin','caregiver'))
);

create table if not exists subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id text,
  stripe_sub_id text,
  status text check (status in ('active','past_due','canceled','trialing'))
);

create table if not exists url_checks (
  id bigserial primary key,
  user_id uuid references auth.users(id),
  url text not null,
  verdict text check (verdict in ('ok','warning','danger')),
  reasons jsonb,          -- e.g. ["clickbait","low_domain_rep"]
  summary text,
  raw_meta jsonb,
  created_at timestamptz default now()
);

create table if not exists caregivers_elders (
  id uuid primary key default gen_random_uuid(),
  caregiver_id uuid not null references auth.users(id) on delete cascade,
  elder_user_id uuid references auth.users(id),
  elder_email text,
  created_at timestamptz default now(),
  check (elder_user_id is not null or elder_email is not null)
);

-- Enforce uniqueness:
create unique index if not exists caregivers_unique_user
  on caregivers_elders (caregiver_id, elder_user_id)
  where elder_user_id is not null;

create unique index if not exists caregivers_unique_email
  on caregivers_elders (caregiver_id, elder_email)
  where elder_user_id is null and elder_email is not null;
