-- URLs table for the URL shortener backend
-- Run this in Supabase SQL Editor (Dashboard -> SQL Editor)

create table if not exists public.urls (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null,
	original_url text not null,
	short_code text not null,
	click_count integer not null default 0,
	created_at timestamptz not null default now()
);

create unique index if not exists urls_short_code_key on public.urls (short_code);
create index if not exists urls_user_id_idx on public.urls (user_id);
