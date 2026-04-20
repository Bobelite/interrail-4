create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'employee' check (role in ('admin','mechanic','employee')),
  created_at timestamptz not null default now()
);

create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  equipment_name text not null,
  unit_number text,
  current_mileage bigint,
  current_hours numeric,
  next_oil_change bigint,
  created_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  report_type text not null check (report_type in ('Service','Repair','Note')),
  title text not null,
  description text,
  status text not null default 'Open' check (status in ('Open','In Progress','Closed')),
  submitted_mileage bigint,
  submitted_hours numeric,
  closed_mileage bigint,
  closed_hours numeric,
  next_oil_change_at_close bigint,
  closing_notes text,
  submitted_by uuid references auth.users(id),
  closed_by uuid references auth.users(id),
  created_by_name text,
  submitted_at timestamptz not null default now(),
  closed_at timestamptz
);

alter table public.profiles enable row level security;
alter table public.vehicles enable row level security;
alter table public.reports enable row level security;

create or replace function public.current_role()
returns text
language sql
stable
as $$
  select role from public.profiles where id = auth.uid()
$$;

drop policy if exists profiles_select_authenticated on public.profiles;
create policy profiles_select_authenticated
on public.profiles for select
to authenticated
using (true);

drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self
on public.profiles for insert
to authenticated
with check (id = auth.uid());

drop policy if exists profiles_update_admin on public.profiles;
create policy profiles_update_admin
on public.profiles for update
to authenticated
using (public.current_role() = 'admin')
with check (public.current_role() = 'admin');

drop policy if exists vehicles_select_authenticated on public.vehicles;
create policy vehicles_select_authenticated
on public.vehicles for select
to authenticated
using (true);

drop policy if exists vehicles_insert_staff on public.vehicles;
create policy vehicles_insert_staff
on public.vehicles for insert
to authenticated
with check (public.current_role() in ('admin','mechanic'));

drop policy if exists vehicles_update_staff on public.vehicles;
create policy vehicles_update_staff
on public.vehicles for update
to authenticated
using (public.current_role() in ('admin','mechanic'))
with check (public.current_role() in ('admin','mechanic'));

drop policy if exists reports_select_authenticated on public.reports;
create policy reports_select_authenticated
on public.reports for select
to authenticated
using (true);

drop policy if exists reports_insert_authenticated on public.reports;
create policy reports_insert_authenticated
on public.reports for insert
to authenticated
with check (submitted_by = auth.uid());

drop policy if exists reports_update_staff on public.reports;
create policy reports_update_staff
on public.reports for update
to authenticated
using (public.current_role() in ('admin','mechanic'))
with check (public.current_role() in ('admin','mechanic'));

-- After you create your auth user, run this to create the admin profile row.
-- Replace the email with your actual Supabase auth email.
-- insert into public.profiles (id, full_name, role)
-- select id, 'Admin', 'admin' from auth.users where email = 'your-email@example.com'
-- on conflict (id) do update set full_name = excluded.full_name, role = excluded.role;
