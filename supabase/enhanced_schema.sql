-- Enhanced Schema to match application requirements
-- Enable extension for UUID generation (if not already enabled)
create extension if not exists "uuid-ossp";

-- 1. USERS TABLE (linked to Supabase Auth)
create table if not exists users (
  id uuid primary key references auth.users(id) on delete cascade,
  role text check (role in ('client', 'business')) not null,
  email text unique not null,
  username text unique not null,
  phone_number text not null,
  birthday date not null,
  profile_picture_url text,
  created_at timestamp default now(),
  constraint phone_number_format check (phone_number ~ '^\+?[0-9\s\-\(\)]+$'),
  constraint valid_birthday check (birthday <= CURRENT_DATE AND birthday >= '1900-01-01')
);

-- 2. BUSINESSES TABLE (Enhanced)
create table if not exists businesses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  name text not null,
  type text check (type in ('barbershop', 'beauty_salon', 'restaurant', 'cafe', 'football_field', 'tennis_court', 'gym', 'car_wash', 'spa', 'dentist', 'doctor', 'other')) not null,
  location text,
  latitude float8,
  longitude float8,
  phone text,
  description text,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- 3. BUSINESS_SETTINGS TABLE (New table for business configuration)
create table if not exists business_settings (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid not null references businesses(id) on delete cascade unique,
  slot_duration_minutes integer default 30,
  working_hours_json jsonb default '[
    {"day": "monday", "enabled": true, "open": "09:00", "close": "17:00"},
    {"day": "tuesday", "enabled": true, "open": "09:00", "close": "17:00"},
    {"day": "wednesday", "enabled": true, "open": "09:00", "close": "17:00"},
    {"day": "thursday", "enabled": true, "open": "09:00", "close": "17:00"},
    {"day": "friday", "enabled": true, "open": "09:00", "close": "17:00"},
    {"day": "saturday", "enabled": true, "open": "09:00", "close": "17:00"},
    {"day": "sunday", "enabled": false, "open": "09:00", "close": "17:00"}
  ]'::jsonb,
  online_payment_enabled boolean default false,
  accept_walkins boolean default true,
  max_simultaneous_bookings integer default 1,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- 4. AVAILABILITIES TABLE
create table if not exists availabilities (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid not null references businesses(id) on delete cascade,
  date date not null,
  time_slots text[] not null, -- Example: ['10:00', '10:30']
  created_at timestamp default now()
);

-- 5. RESERVATIONS TABLE (Enhanced)
create table if not exists reservations (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references users(id) on delete set null, -- Allow null for non-registered users
  business_id uuid not null references businesses(id) on delete cascade,
  date date not null,
  time time not null,
  customer_name text, -- For non-registered users or override
  customer_phone text, -- For non-registered users or override
  customer_email text, -- For non-registered users or override
  notes text,
  payment_status text default 'unpaid' check (payment_status in ('unpaid', 'paid', 'pending')),
  payment_method text default 'cash' check (payment_method in ('cash', 'online')),
  amount decimal(10,2) default 0,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- 6. REVIEWS TABLE (optional)
create table if not exists reviews (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null references users(id),
  business_id uuid not null references businesses(id),
  rating int check (rating between 1 and 5),
  comment text,
  created_at timestamp default now()
);

-- Indexes for better performance
create index if not exists idx_businesses_user_id on businesses(user_id);
create index if not exists idx_businesses_type on businesses(type);
create index if not exists idx_reservations_business_id on reservations(business_id);
create index if not exists idx_reservations_client_id on reservations(client_id);
create index if not exists idx_reservations_date on reservations(date);
create index if not exists idx_business_settings_business_id on business_settings(business_id);

-- Unique constraint to prevent double bookings
create unique index if not exists idx_reservations_unique_slot 
on reservations(business_id, date, time);

-- Enable Row Level Security
alter table businesses enable row level security;
alter table business_settings enable row level security;
alter table reservations enable row level security;
alter table reviews enable row level security;

-- RLS Policies for businesses
create policy "Users can view all businesses" on businesses
  for select using (true);

create policy "Users can create their own business" on businesses
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own business" on businesses
  for update using (auth.uid() = user_id);

-- RLS Policies for business_settings
create policy "Business owners can manage their settings" on business_settings
  for all using (
    exists (
      select 1 from businesses 
      where businesses.id = business_settings.business_id 
      and businesses.user_id = auth.uid()
    )
  );

-- RLS Policies for reservations
create policy "Users can view their own reservations" on reservations
  for select using (auth.uid() = client_id);

create policy "Business owners can view their business reservations" on reservations
  for select using (
    exists (
      select 1 from businesses 
      where businesses.id = reservations.business_id 
      and businesses.user_id = auth.uid()
    )
  );

create policy "Users can create reservations" on reservations
  for insert with check (
    auth.uid() = client_id or client_id is null
  );

create policy "Users can update their own reservations" on reservations
  for update using (auth.uid() = client_id);

create policy "Business owners can update reservations for their business" on reservations
  for update using (
    exists (
      select 1 from businesses 
      where businesses.id = reservations.business_id 
      and businesses.user_id = auth.uid()
    )
  );

-- RLS Policies for reviews
create policy "Users can view all reviews" on reviews
  for select using (true);

create policy "Users can create reviews" on reviews
  for insert with check (auth.uid() = client_id);

create policy "Users can update their own reviews" on reviews
  for update using (auth.uid() = client_id);
