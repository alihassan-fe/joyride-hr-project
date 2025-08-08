-- Neon/Postgres schema (JSONB for flexible fields)
create extension if not exists pgcrypto;

create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  requirements jsonb default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists candidates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text default '',
  cv_url text default '',
  status text not null default 'New',
  scores jsonb default '{}'::jsonb,
  applied_job_id uuid,
  job_title text default '',
  skills jsonb default '[]'::jsonb,
  work_history jsonb default '[]'::jsonb,
  notes text default '',
  created_at timestamptz not null default now(),
  constraint fk_applied_job foreign key (applied_job_id) references jobs(id) on delete set null
);

create table if not exists employees (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  role text not null,
  start_date date not null default now(),
  pto_balance integer not null default 0
);

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  title text not null,
  start date not null,
  "end" date not null,
  owner_id uuid references employees(id) on delete set null
);
