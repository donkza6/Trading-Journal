-- Enable UUID generation extension
create extension if not exists "uuid-ossp";

-- Drop tables if they exist (Caution: this deletes existing data if you re-run it)
drop table if exists trades;
drop table if exists profiles;

-- สร้างตาราง profiles
create table profiles (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  avatar_url text not null default 'avatar-red',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- สร้างตาราง trades
create table trades (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references profiles(id) on delete cascade not null,
  pair text not null,
  direction text not null, -- 'Long' | 'Short'
  entry_price numeric not null,
  exit_price numeric not null,
  position_size numeric not null,
  profit_level numeric,
  stop_level numeric,
  pnl numeric not null,
  outcome text not null, -- 'Win' | 'Loss' | 'Breakeven'
  risk_reward numeric not null default 0,
  notes text,
  images text[] default '{}'::text[], -- PostgreSQL array of text for chart screenshots
  created_at timestamp with time zone not null
);

-- Enable real-time listening for these tables
alter publication supabase_realtime add table profiles, trades;

-- Disable Row Level Security (RLS) to allow read/write access in this sandbox app
alter table profiles disable row level security;
alter table trades disable row level security;
