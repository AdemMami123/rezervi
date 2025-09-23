-- Migration: Add status column to reservations
-- Run this in Supabase SQL editor or psql.
alter table reservations
  add column if not exists status text default 'pending' check (status in ('pending','confirmed','cancelled','completed'));

-- Backfill any existing rows that might have null status (if column just added without default applied retrospectively)
update reservations set status = 'pending' where status is null;

-- Optional: index to speed up status filtering
create index if not exists idx_reservations_status on reservations(status);
