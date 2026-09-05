-- Paws Log — initial schema
-- Run this in the Supabase SQL editor (or via `supabase db push` if you use the CLI).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- owners
-- ---------------------------------------------------------------------------
create table if not exists public.owners (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) > 0),
  phone text not null default '',
  email text not null default '',
  emergency_contact text not null default '',
  emergency_phone text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- dogs
-- ---------------------------------------------------------------------------
create table if not exists public.dogs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.owners(id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  photo_url text not null default '',
  breed text not null default '',
  age integer,
  gender text not null default '',
  notes text not null default '',
  food_type text not null default '',
  feeding_instructions text not null default '',
  walks_per_day integer,
  walking_instructions text not null default '',
  special_instructions text not null default '',
  allergies text not null default '',
  medications text not null default '',
  medical_notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint dogs_age_nonneg check (age is null or age >= 0),
  constraint dogs_walks_nonneg check (walks_per_day is null or walks_per_day >= 0)
);

create index if not exists dogs_owner_id_idx on public.dogs(owner_id);

-- ---------------------------------------------------------------------------
-- stays
-- ---------------------------------------------------------------------------
create table if not exists public.stays (
  id uuid primary key default gen_random_uuid(),
  dog_id uuid not null references public.dogs(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  drop_off_time time,
  pickup_time time,
  notes text not null default '',
  daily_rate numeric(10,2) not null default 0 check (daily_rate >= 0),
  amount_paid numeric(10,2) not null default 0 check (amount_paid >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint stays_end_after_start check (end_date >= start_date)
);

create index if not exists stays_dog_id_idx on public.stays(dog_id);
create index if not exists stays_start_date_idx on public.stays(start_date);

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists owners_set_updated_at on public.owners;
create trigger owners_set_updated_at before update on public.owners
  for each row execute function public.set_updated_at();

drop trigger if exists dogs_set_updated_at on public.dogs;
create trigger dogs_set_updated_at before update on public.dogs
  for each row execute function public.set_updated_at();

drop trigger if exists stays_set_updated_at on public.stays;
create trigger stays_set_updated_at before update on public.stays
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
--
-- This is a small shared team app, not a multi-tenant product: every
-- authorized (signed-in) user is meant to see and edit everything, matching
-- "multiple authorized users see the same information." Access control is
-- therefore "must be authenticated," not per-row ownership.
-- ---------------------------------------------------------------------------
alter table public.owners enable row level security;
alter table public.dogs enable row level security;
alter table public.stays enable row level security;

drop policy if exists "owners_all_authenticated" on public.owners;
create policy "owners_all_authenticated" on public.owners
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "dogs_all_authenticated" on public.dogs;
create policy "dogs_all_authenticated" on public.dogs
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "stays_all_authenticated" on public.stays;
create policy "stays_all_authenticated" on public.stays
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ---------------------------------------------------------------------------
-- Storage: dog-photos bucket
-- Public read (so <img src> works without signed URLs) — write restricted
-- to authenticated users. If you'd rather photos not be guessable by URL,
-- switch this bucket to private and have photosService.js request signed
-- URLs instead.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('dog-photos', 'dog-photos', true)
on conflict (id) do nothing;

drop policy if exists "dog_photos_public_read" on storage.objects;
create policy "dog_photos_public_read" on storage.objects
  for select using (bucket_id = 'dog-photos');

drop policy if exists "dog_photos_authenticated_write" on storage.objects;
create policy "dog_photos_authenticated_write" on storage.objects
  for insert with check (bucket_id = 'dog-photos' and auth.role() = 'authenticated');

drop policy if exists "dog_photos_authenticated_update" on storage.objects;
create policy "dog_photos_authenticated_update" on storage.objects
  for update using (bucket_id = 'dog-photos' and auth.role() = 'authenticated');

drop policy if exists "dog_photos_authenticated_delete" on storage.objects;
create policy "dog_photos_authenticated_delete" on storage.objects
  for delete using (bucket_id = 'dog-photos' and auth.role() = 'authenticated');
