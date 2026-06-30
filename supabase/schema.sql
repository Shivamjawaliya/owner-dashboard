-- ============================================================
-- PG Owner Dashboard — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ──────────────────────────────────────────────
-- PROFILES (linked to auth.users)
-- ──────────────────────────────────────────────
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null,
  phone       text,
  avatar_url  text,
  role        text not null default 'owner' check (role in ('owner','manager','staff')),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "Users can view own profile"   on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- ──────────────────────────────────────────────
-- BUILDINGS
-- ──────────────────────────────────────────────
create table public.buildings (
  id            uuid primary key default uuid_generate_v4(),
  owner_id      uuid not null references auth.users(id) on delete cascade,
  name          text not null,
  address_line1 text not null,
  address_line2 text,
  city          text not null,
  state         text not null,
  pincode       text not null,
  total_floors  int  not null default 1,
  amenities     text[] default '{}',
  images        text[] default '{}',
  status        text not null default 'active' check (status in ('active','inactive')),
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
alter table public.buildings enable row level security;
create policy "Owner can manage buildings" on public.buildings for all using (auth.uid() = owner_id);

-- ──────────────────────────────────────────────
-- FLOORS
-- ──────────────────────────────────────────────
create table public.floors (
  id            uuid primary key default uuid_generate_v4(),
  building_id   uuid not null references public.buildings(id) on delete cascade,
  floor_number  int  not null,
  name          text not null,
  created_at    timestamptz default now(),
  unique(building_id, floor_number)
);
alter table public.floors enable row level security;
create policy "Owner can manage floors" on public.floors for all
  using (exists (select 1 from public.buildings b where b.id = building_id and b.owner_id = auth.uid()));

-- ──────────────────────────────────────────────
-- ROOMS
-- ──────────────────────────────────────────────
create table public.rooms (
  id           uuid primary key default uuid_generate_v4(),
  building_id  uuid not null references public.buildings(id) on delete cascade,
  floor_id     uuid references public.floors(id) on delete set null,
  room_number  text not null,
  type         text not null default 'double' check (type in ('single','double','triple','dormitory')),
  total_beds   int  not null default 2,
  monthly_rent numeric not null default 0,
  amenities    text[] default '{}',
  status       text not null default 'active' check (status in ('active','inactive')),
  created_at   timestamptz default now(),
  updated_at   timestamptz default now(),
  unique(building_id, room_number)
);
alter table public.rooms enable row level security;
create policy "Owner can manage rooms" on public.rooms for all
  using (exists (select 1 from public.buildings b where b.id = building_id and b.owner_id = auth.uid()));

-- ──────────────────────────────────────────────
-- BEDS
-- ──────────────────────────────────────────────
create table public.beds (
  id           uuid primary key default uuid_generate_v4(),
  room_id      uuid not null references public.rooms(id) on delete cascade,
  bed_number   text not null,
  is_occupied  boolean not null default false,
  resident_id  uuid,
  unique(room_id, bed_number)
);
alter table public.beds enable row level security;
create policy "Owner can manage beds" on public.beds for all
  using (exists (
    select 1 from public.rooms r
    join public.buildings b on b.id = r.building_id
    where r.id = room_id and b.owner_id = auth.uid()
  ));

-- ──────────────────────────────────────────────
-- RESIDENTS
-- ──────────────────────────────────────────────
create table public.residents (
  id                         uuid primary key default uuid_generate_v4(),
  owner_id                   uuid not null references auth.users(id) on delete cascade,
  name                       text not null,
  email                      text,
  phone                      text not null,
  alternate_phone            text,
  date_of_birth              date,
  gender                     text check (gender in ('male','female','other')),
  occupation                 text,
  building_id                uuid not null references public.buildings(id),
  floor_id                   uuid references public.floors(id),
  room_id                    uuid not null references public.rooms(id),
  bed_id                     uuid references public.beds(id),
  move_in_date               date not null,
  move_out_date              date,
  monthly_rent               numeric not null default 0,
  deposit_amount             numeric not null default 0,
  kyc_status                 text not null default 'pending' check (kyc_status in ('pending','submitted','verified','rejected')),
  emergency_contact_name     text,
  emergency_contact_phone    text,
  emergency_contact_relation text,
  status                     text not null default 'active' check (status in ('active','inactive')),
  avatar_url                 text,
  created_at                 timestamptz default now(),
  updated_at                 timestamptz default now()
);
alter table public.residents enable row level security;
create policy "Owner can manage residents" on public.residents for all using (auth.uid() = owner_id);

-- ──────────────────────────────────────────────
-- BOOKINGS
-- ──────────────────────────────────────────────
create table public.bookings (
  id              uuid primary key default uuid_generate_v4(),
  owner_id        uuid not null references auth.users(id) on delete cascade,
  resident_id     uuid references public.residents(id) on delete set null,
  resident_name   text not null,
  resident_phone  text not null,
  building_id     uuid not null references public.buildings(id),
  room_id         uuid not null references public.rooms(id),
  bed_id          uuid references public.beds(id),
  check_in_date   date not null,
  check_out_date  date,
  monthly_rent    numeric not null default 0,
  deposit_amount  numeric not null default 0,
  status          text not null default 'pending' check (status in ('pending','confirmed','cancelled','completed')),
  notes           text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);
alter table public.bookings enable row level security;
create policy "Owner can manage bookings" on public.bookings for all using (auth.uid() = owner_id);

-- ──────────────────────────────────────────────
-- PAYMENTS
-- ──────────────────────────────────────────────
create table public.payments (
  id             uuid primary key default uuid_generate_v4(),
  owner_id       uuid not null references auth.users(id) on delete cascade,
  resident_id    uuid not null references public.residents(id) on delete cascade,
  building_id    uuid not null references public.buildings(id),
  room_id        uuid not null references public.rooms(id),
  type           text not null default 'rent' check (type in ('rent','deposit','maintenance','other')),
  amount         numeric not null,
  due_date       date not null,
  paid_date      date,
  status         text not null default 'pending' check (status in ('paid','pending','overdue','partial')),
  method         text check (method in ('cash','upi','bank_transfer','cheque')),
  receipt_number text,
  notes          text,
  created_at     timestamptz default now()
);
alter table public.payments enable row level security;
create policy "Owner can manage payments" on public.payments for all using (auth.uid() = owner_id);

-- ──────────────────────────────────────────────
-- EXPENSES
-- ──────────────────────────────────────────────
create table public.expenses (
  id          uuid primary key default uuid_generate_v4(),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  building_id uuid not null references public.buildings(id),
  category    text not null check (category in ('electricity','water','internet','salary','maintenance','other')),
  title       text not null,
  amount      numeric not null,
  date        date not null,
  receipt_url text,
  notes       text,
  created_at  timestamptz default now()
);
alter table public.expenses enable row level security;
create policy "Owner can manage expenses" on public.expenses for all using (auth.uid() = owner_id);

-- ──────────────────────────────────────────────
-- EMPLOYEES
-- ──────────────────────────────────────────────
create table public.employees (
  id           uuid primary key default uuid_generate_v4(),
  owner_id     uuid not null references auth.users(id) on delete cascade,
  building_id  uuid references public.buildings(id) on delete set null,
  name         text not null,
  phone        text not null,
  email        text,
  role         text not null check (role in ('manager','security','cleaner','electrician','plumber','cook','other')),
  salary       numeric not null default 0,
  joining_date date not null,
  avatar_url   text,
  status       text not null default 'active' check (status in ('active','inactive')),
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);
alter table public.employees enable row level security;
create policy "Owner can manage employees" on public.employees for all using (auth.uid() = owner_id);

-- ──────────────────────────────────────────────
-- ATTENDANCE
-- ──────────────────────────────────────────────
create table public.attendance (
  id          uuid primary key default uuid_generate_v4(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  date        date not null,
  check_in    time,
  check_out   time,
  status      text not null default 'present' check (status in ('present','absent','half_day','leave')),
  unique(employee_id, date)
);
alter table public.attendance enable row level security;
create policy "Owner can manage attendance" on public.attendance for all
  using (exists (select 1 from public.employees e where e.id = employee_id and e.owner_id = auth.uid()));

-- ──────────────────────────────────────────────
-- MAINTENANCE TICKETS
-- ──────────────────────────────────────────────
create table public.maintenance_tickets (
  id          uuid primary key default uuid_generate_v4(),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  building_id uuid not null references public.buildings(id),
  room_id     uuid references public.rooms(id) on delete set null,
  title       text not null,
  description text,
  category    text not null default 'other',
  priority    text not null default 'medium' check (priority in ('high','medium','low')),
  status      text not null default 'open' check (status in ('open','in_progress','resolved')),
  reported_by text,
  assigned_to uuid references public.employees(id) on delete set null,
  resolved_at timestamptz,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
alter table public.maintenance_tickets enable row level security;
create policy "Owner can manage tickets" on public.maintenance_tickets for all using (auth.uid() = owner_id);

-- ──────────────────────────────────────────────
-- AUTO-UPDATE updated_at trigger
-- ──────────────────────────────────────────────
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger on_buildings_updated        before update on public.buildings        for each row execute procedure public.handle_updated_at();
create trigger on_rooms_updated            before update on public.rooms            for each row execute procedure public.handle_updated_at();
create trigger on_residents_updated        before update on public.residents        for each row execute procedure public.handle_updated_at();
create trigger on_employees_updated        before update on public.employees        for each row execute procedure public.handle_updated_at();
create trigger on_bookings_updated         before update on public.bookings         for each row execute procedure public.handle_updated_at();
create trigger on_maintenance_updated      before update on public.maintenance_tickets for each row execute procedure public.handle_updated_at();

-- ──────────────────────────────────────────────
-- AUTO-CREATE PROFILE on signup
-- ──────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, name, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', 'PG Owner'),
    new.raw_user_meta_data->>'phone',
    'owner'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
