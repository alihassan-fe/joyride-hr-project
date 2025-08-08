-- Users table for manual email/password login
create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text,
  role text not null default 'Viewer',
  password_hash text not null,
  created_at timestamptz not null default now()
);

-- Seed an admin user (password: Password123!)
insert into users (email, name, role, password_hash)
values ('admin@acme.hr', 'Admin', 'Admin', crypt('Password123!', gen_salt('bf')))
on conflict (email) do nothing;
