-- The public partner apply form is gone from the webapp/mobile app, so admins
-- now need to be able to add a partner row directly from the admin dashboard
-- instead of relying on a customer having self-applied. The existing
-- "partners_insert_own" policy only allows profile_id = auth.uid(), which
-- blocks that — add an admin insert path alongside it.

create policy "partners_insert_admin" on public.partners
  for insert with check (public.is_admin());
