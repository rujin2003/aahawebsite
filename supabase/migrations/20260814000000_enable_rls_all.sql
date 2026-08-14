-- Full RLS setup for all tables + storage, matching how the three clients access the DB:
--   * aahawebsite  — anon key (browser + Next API routes): public catalog reads, contact
--     form insert, and per-user rows (profiles, addresses, orders, returns, payments, prefs)
--   * aahabackend-ff (admin dashboard) — anon key + Supabase auth login, admin check via
--     public.admins: needs full access when is_admin()
--   * aahabot (Telegram) — service_role key: bypasses RLS entirely, unaffected
--
-- Run in the Supabase SQL editor. Idempotent: drops every existing policy on these
-- tables first, then recreates a consistent set.

-- ---------------------------------------------------------------------------
-- Admin check. SECURITY DEFINER so policies on admins itself don't recurse.
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admins where user_id = auth.uid()
  );
$$;

grant execute on function public.is_admin() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Clean slate: drop all existing policies on the tables we manage
-- ---------------------------------------------------------------------------
do $$
declare pol record;
begin
  for pol in
    select policyname, tablename from pg_policies
    where schemaname = 'public'
      and tablename in (
        'products','categories','gallery','team_members','promo_codes',
        'contacts','profiles','admins','orders','order_items',
        'returns','return_items','payments','user_preferences','addresses'
      )
  loop
    execute format('drop policy if exists %I on public.%I', pol.policyname, pol.tablename);
  end loop;
end $$;

alter table public.products         enable row level security;
alter table public.categories       enable row level security;
alter table public.gallery          enable row level security;
alter table public.team_members     enable row level security;
alter table public.promo_codes      enable row level security;
alter table public.contacts         enable row level security;
alter table public.profiles         enable row level security;
alter table public.admins           enable row level security;
alter table public.orders           enable row level security;
alter table public.order_items      enable row level security;
alter table public.returns          enable row level security;
alter table public.return_items     enable row level security;
alter table public.payments         enable row level security;
alter table public.user_preferences enable row level security;
alter table public.addresses        enable row level security;

-- ---------------------------------------------------------------------------
-- Public catalog: anyone can read, only admins can write
-- ---------------------------------------------------------------------------
create policy "public read products"      on public.products     for select to anon, authenticated using (true);
create policy "public read categories"    on public.categories   for select to anon, authenticated using (true);
create policy "public read gallery"       on public.gallery      for select to anon, authenticated using (true);
create policy "public read team_members"  on public.team_members for select to anon, authenticated using (true);

create policy "admin manage products"     on public.products     for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin manage categories"   on public.categories   for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin manage gallery"      on public.gallery      for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin manage team_members" on public.team_members for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Promo codes: shoppers can only see active codes; admins manage all
-- ---------------------------------------------------------------------------
create policy "public read active promo codes" on public.promo_codes
  for select to anon, authenticated
  using (is_active = true or public.is_admin());

create policy "admin manage promo codes" on public.promo_codes
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Contacts: the website contact form inserts with the anon key; only admins read
-- ---------------------------------------------------------------------------
create policy "anyone can submit contact" on public.contacts
  for insert to anon, authenticated with check (true);

create policy "admin manage contacts" on public.contacts
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Profiles: users manage their own row; admins see all (dashboard profiles page)
-- ---------------------------------------------------------------------------
create policy "read own profile" on public.profiles
  for select to authenticated using (auth.uid() = id or public.is_admin());

create policy "insert own profile" on public.profiles
  for insert to authenticated with check (auth.uid() = id);

create policy "update own profile" on public.profiles
  for update to authenticated
  using (auth.uid() = id or public.is_admin())
  with check (auth.uid() = id or public.is_admin());

create policy "admin delete profiles" on public.profiles
  for delete to authenticated using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Admins: users may check their own membership (checkAdminStatus); only
-- existing admins can add/remove admins. Bootstrap the first admin via the
-- SQL editor or service key.
-- ---------------------------------------------------------------------------
create policy "read own admin row" on public.admins
  for select to authenticated using (user_id = auth.uid() or public.is_admin());

create policy "admin insert admins" on public.admins
  for insert to authenticated with check (public.is_admin());

create policy "admin update admins" on public.admins
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "admin delete admins" on public.admins
  for delete to authenticated using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Orders: users create/read/update their own; admins manage all
-- ---------------------------------------------------------------------------
create policy "read own orders" on public.orders
  for select to authenticated using (user_id = auth.uid());

create policy "create own orders" on public.orders
  for insert to authenticated with check (user_id = auth.uid());

create policy "update own orders" on public.orders
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "admin manage orders" on public.orders
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Order items: access follows the parent order
-- ---------------------------------------------------------------------------
create policy "read own order items" on public.order_items
  for select to authenticated using (
    exists (select 1 from public.orders o where o.id = order_items.order_id and o.user_id = auth.uid())
  );

create policy "create own order items" on public.order_items
  for insert to authenticated with check (
    exists (select 1 from public.orders o where o.id = order_items.order_id and o.user_id = auth.uid())
  );

create policy "admin manage order items" on public.order_items
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Returns + return items: users file/read their own; admins manage all
-- ---------------------------------------------------------------------------
create policy "read own returns" on public.returns
  for select to authenticated using (user_id = auth.uid());

create policy "create own returns" on public.returns
  for insert to authenticated with check (user_id = auth.uid());

create policy "update own pending returns" on public.returns
  for update to authenticated
  using (user_id = auth.uid() and status = 'pending')
  with check (user_id = auth.uid() and status = 'pending');

create policy "admin manage returns" on public.returns
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "read own return items" on public.return_items
  for select to authenticated using (
    exists (select 1 from public.returns r where r.id = return_items.return_id and r.user_id = auth.uid())
  );

create policy "create own return items" on public.return_items
  for insert to authenticated with check (
    exists (select 1 from public.returns r where r.id = return_items.return_id and r.user_id = auth.uid())
  );

create policy "admin manage return items" on public.return_items
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Payments: users record/read payments for their own orders; admins manage all
-- ---------------------------------------------------------------------------
create policy "read own payments" on public.payments
  for select to authenticated using (
    exists (select 1 from public.orders o where o.id = payments.order_id and o.user_id = auth.uid())
  );

create policy "create own payments" on public.payments
  for insert to authenticated with check (
    exists (select 1 from public.orders o where o.id = payments.order_id and o.user_id = auth.uid())
  );

create policy "admin manage payments" on public.payments
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- User preferences + addresses: strictly own rows
-- ---------------------------------------------------------------------------
create policy "manage own preferences" on public.user_preferences
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "manage own addresses" on public.addresses
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Storage: public read on media buckets; only admins write via the dashboard.
-- The Telegram bot uploads with the service key and bypasses these.
-- If this section fails with "must be owner of table objects", create the same
-- policies in Dashboard -> Storage -> Policies instead.
-- ---------------------------------------------------------------------------
drop policy if exists "public read media buckets" on storage.objects;
drop policy if exists "admin insert media" on storage.objects;
drop policy if exists "admin update media" on storage.objects;
drop policy if exists "admin delete media" on storage.objects;

create policy "public read media buckets" on storage.objects
  for select to anon, authenticated
  using (bucket_id in ('products','gallery','categories','teammembers'));

create policy "admin insert media" on storage.objects
  for insert to authenticated
  with check (bucket_id in ('products','gallery','categories','teammembers') and public.is_admin());

create policy "admin update media" on storage.objects
  for update to authenticated
  using (bucket_id in ('products','gallery','categories','teammembers') and public.is_admin())
  with check (bucket_id in ('products','gallery','categories','teammembers') and public.is_admin());

create policy "admin delete media" on storage.objects
  for delete to authenticated
  using (bucket_id in ('products','gallery','categories','teammembers') and public.is_admin());

-- ---------------------------------------------------------------------------
-- Auto-create the profile row on signup. Email confirmation is enabled, so the
-- browser has no session right after signUp() and RLS would reject a
-- client-side profiles insert; this trigger creates it from the signup
-- metadata instead (the website passes full_name/username/phone/address).
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, username, phone, address)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'address'
  )
  on conflict (id) do nothing;
  return new;
exception when unique_violation then
  -- username/email collision: still create a bare profile so signup succeeds
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill profiles for any existing users that never got a row
-- (per-row so a username/email collision skips that user instead of aborting)
do $$
declare u record;
begin
  for u in
    select au.id, au.email, au.raw_user_meta_data
    from auth.users au
    left join public.profiles p on p.id = au.id
    where p.id is null
  loop
    begin
      insert into public.profiles (id, email, full_name, username, phone, address)
      values (
        u.id,
        u.email,
        u.raw_user_meta_data->>'full_name',
        u.raw_user_meta_data->>'username',
        u.raw_user_meta_data->>'phone',
        u.raw_user_meta_data->>'address'
      );
    exception when unique_violation then
      insert into public.profiles (id) values (u.id) on conflict (id) do nothing;
    end;
  end loop;
end $$;
