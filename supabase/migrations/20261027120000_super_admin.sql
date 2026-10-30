-- Lets a small top tier of admins ("super admins") manage other admin
-- accounts from the Admin Portal: add admins, reset their passwords, and
-- demote/remove them. A plain boolean rather than a new user_role enum
-- value, so it layers on top of the existing 'admin' role without touching
-- current_user_role()/is_admin() or any RLS policy that already checks
-- role = 'admin'.

alter table public.profiles
  add column is_super_admin boolean not null default false;

create or replace function public.is_super_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (select is_super_admin from public.profiles where id = auth.uid() and role = 'admin'),
    false
  );
$$;

-- Seed the first super admin so the feature is usable immediately after
-- this migration runs. Safe to re-run: no-ops once already set.
update public.profiles
set is_super_admin = true
where role = 'admin'
  and email = 'shyamalfred@gmail.com';
