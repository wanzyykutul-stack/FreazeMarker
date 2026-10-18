-- Freaze Market: Supabase/PostgreSQL schema
-- Run in Supabase Dashboard > SQL Editor. Never expose service_role keys in browser code.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  full_name text not null default '',
  date_of_birth date,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists profiles_username_lower_unique on public.profiles (lower(username));

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null unique,
  user_id uuid not null references auth.users(id) on delete restrict,
  buyer_username text not null default '',
  buyer_email text not null default '',
  game_name text not null,
  package_name text not null,
  account_detail text not null,
  payment_method text not null,
  base_price bigint not null check (base_price >= 0),
  admin_fee bigint not null default 0 check (admin_fee >= 0),
  total_price bigint generated always as (base_price + admin_fee) stored,
  status text not null default 'pending' check (status in ('pending','success','failed','cancelled','refund')),
  payment_status text not null default 'pending' check (payment_status in ('pending','paid','failed','cancelled','refunded')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists orders_user_created_idx on public.orders(user_id, created_at desc);
create index if not exists orders_status_created_idx on public.orders(status, created_at desc);

create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null default 'system',
  entity_id text,
  details jsonb not null default '{}'::jsonb,
  user_agent text,
  created_at timestamptz not null default now()
);
create index if not exists audit_logs_created_idx on public.audit_logs(created_at desc);
create index if not exists audit_logs_actor_idx on public.audit_logs(actor_id, created_at desc);

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'); $$;
grant execute on function public.is_admin() to authenticated;

create or replace function public.bootstrap_profile()
returns trigger language plpgsql security definer set search_path = public
as $$
declare
  candidate text;
  full_name_value text;
  dob_value date;
begin
  candidate := lower(coalesce(nullif(new.raw_user_meta_data->>'username',''), split_part(coalesce(new.email,'user'), '@', 1)));
  candidate := regexp_replace(candidate, '[^a-z0-9_]', '_', 'g');
  candidate := trim(both '_' from candidate);
  if length(candidate) < 3 then candidate := 'user_' || substr(replace(new.id::text,'-',''),1,8); end if;
  if length(candidate) > 24 then candidate := substr(candidate,1,15) || '_' || substr(replace(new.id::text,'-',''),1,8); end if;
  if exists(select 1 from public.profiles p where lower(p.username) = lower(candidate)) then
    candidate := substr(candidate,1,15) || '_' || substr(replace(new.id::text,'-',''),1,8);
  end if;
  full_name_value := coalesce(nullif(new.raw_user_meta_data->>'full_name',''), nullif(new.raw_user_meta_data->>'name',''), '');
  begin dob_value := nullif(new.raw_user_meta_data->>'date_of_birth','')::date; exception when others then dob_value := null; end;
  insert into public.profiles(id, username, full_name, date_of_birth)
  values(new.id, candidate, full_name_value, dob_value)
  on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile after insert on auth.users
for each row execute procedure public.bootstrap_profile();

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;
drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at before update on public.profiles for each row execute procedure public.touch_updated_at();
drop trigger if exists orders_touch_updated_at on public.orders;
create trigger orders_touch_updated_at before update on public.orders for each row execute procedure public.touch_updated_at();

create or replace function public.audit_order_changes()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if TG_OP = 'INSERT' then
    insert into public.audit_logs(actor_id, action, entity_type, entity_id, details)
    values(auth.uid(), 'order.created', 'order', new.id::text, jsonb_build_object('invoice_number',new.invoice_number,'status',new.status));
    return new;
  elsif TG_OP = 'UPDATE' and (old.status is distinct from new.status or old.payment_status is distinct from new.payment_status) then
    insert into public.audit_logs(actor_id, action, entity_type, entity_id, details)
    values(auth.uid(), 'order.status_changed', 'order', new.id::text,
      jsonb_build_object('invoice_number',new.invoice_number,'old_status',old.status,'new_status',new.status,'old_payment_status',old.payment_status,'new_payment_status',new.payment_status));
  end if;
  return new;
end;
$$;
drop trigger if exists orders_audit_changes on public.orders;
create trigger orders_audit_changes after insert or update on public.orders for each row execute procedure public.audit_order_changes();

alter table public.profiles enable row level security;
alter table public.orders enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists "profiles read own or admin" on public.profiles;
create policy "profiles read own or admin" on public.profiles for select to authenticated using (id = auth.uid() or public.is_admin());
drop policy if exists "profiles update own safe fields" on public.profiles;
create policy "profiles update own safe fields" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
-- IMPORTANT: role cannot be made secure by RLS alone when included in a user-editable row.
-- This trigger forcibly preserves role on user profile updates.
create or replace function public.prevent_role_escalation()
returns trigger language plpgsql security definer set search_path = public
as $$ begin if auth.uid() is not null and old.role is distinct from new.role and not public.is_admin() then raise exception 'Only an admin can change roles'; end if; return new; end; $$;
drop trigger if exists profiles_prevent_role_escalation on public.profiles;
create trigger profiles_prevent_role_escalation before update on public.profiles for each row execute procedure public.prevent_role_escalation();

drop policy if exists "orders read own or admin" on public.orders;
create policy "orders read own or admin" on public.orders for select to authenticated using (user_id = auth.uid() or public.is_admin());
drop policy if exists "users create own pending orders" on public.orders;
create policy "users create own pending orders" on public.orders for insert to authenticated with check (user_id = auth.uid() and status = 'pending' and payment_status = 'pending');
drop policy if exists "admin update orders" on public.orders;
create policy "admin update orders" on public.orders for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "users insert own audit events" on public.audit_logs;
create policy "users insert own audit events" on public.audit_logs for insert to authenticated with check (actor_id = auth.uid());
drop policy if exists "admin read audit logs" on public.audit_logs;
create policy "admin read audit logs" on public.audit_logs for select to authenticated using (public.is_admin());

-- Promote an account to admin only from SQL Editor after that account has registered.
-- Replace the email and run manually; never expose this privilege to the public frontend.
-- update public.profiles p set role = 'admin' from auth.users u where p.id = u.id and u.email = 'YOUR_ADMIN_EMAIL';
