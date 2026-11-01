-- The admin panel's "Delete Partner" and "Delete Order" actions issue a plain
-- `.delete()` through the user-session Supabase client (RLS-bound, not the
-- service-role client), but neither table had a delete policy. With RLS
-- enabled and no matching policy, the delete silently matches zero rows and
-- returns no error — the button appeared to do nothing.

create policy "partners_delete_admin" on public.partners
  for delete using (public.is_admin());

create policy "orders_delete_admin" on public.orders
  for delete using (public.is_admin());
