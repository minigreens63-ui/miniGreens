-- Sumam (MGC's women entrepreneurship program) registration: a public form
-- (no account needed) at webapp `/women-who-grow/register`, collecting
-- name/email/phone/address/message + a required Aadhaar document, visible to
-- Admin, with a confirmation email to the applicant and a flagged alert
-- email to staff. Mirrors the existing `contact_messages` table's public
-- is_admin()-gated RLS pattern, and the order-email migrations' direct
-- net.http_post-to-Resend pattern (no Edge Function involved).

create table public.sumam_applications (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text not null,
  address text not null,
  message text,
  aadhaar_document jsonb, -- { name, path, uploaded_at }
  status text not null default 'pending' check (status in ('pending', 'contacted', 'closed')),
  applied_at timestamptz not null default now()
);

alter table public.sumam_applications enable row level security;

create policy "sumam_applications_insert_public" on public.sumam_applications
  for insert to anon, authenticated with check (true);

create policy "sumam_applications_admin_select" on public.sumam_applications
  for select to authenticated using (public.is_admin());

create policy "sumam_applications_admin_update" on public.sumam_applications
  for update to authenticated using (public.is_admin());

create policy "sumam_applications_admin_delete" on public.sumam_applications
  for delete to authenticated using (public.is_admin());

-- ── Private bucket for the Aadhaar upload ──────────────────────────────────
insert into storage.buckets (id, name, public)
values ('sumam-documents', 'sumam-documents', false)
on conflict (id) do nothing;

-- No login, so uploads can't be scoped to a uid folder like partner-kyc —
-- each applicant's file goes under a random per-submission folder
-- (`<uuid>/<filename>`) generated client-side; only admins can read back.
create policy "sumam_documents_insert_public"
  on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'sumam-documents');

create policy "sumam_documents_admin_select"
  on storage.objects for select to authenticated
  using (bucket_id = 'sumam-documents' and public.is_admin());

-- ── Confirmation + staff alert emails ──────────────────────────────────────
create or replace function public.notify_sumam_application_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_resend_key text;
  v_staff_to text;
  v_customer_html text;
  v_staff_html text;
begin
  select value into v_resend_key from private.secrets where key = 'resend_api_key';
  if v_resend_key is null then
    return new;
  end if;

  select coalesce(value, 'mgc.bangalore@gmail.com') into v_staff_to
  from private.secrets where key = 'order_notify_to';
  v_staff_to := coalesce(v_staff_to, 'mgc.bangalore@gmail.com');

  -- Applicant confirmation
  v_customer_html := public._order_email_wrap(
    'Sumam · Women entrepreneurship',
    'Thanks for applying, ' || split_part(new.full_name, ' ', 1) || '!',
    '<p>Hi ' || new.full_name || ',</p>' ||
    '<p>Thank you for applying to <b>Sumam</b>, MiniGreens'' women entrepreneurship program. ' ||
    'We''ve received your application and your Aadhaar document.</p>' ||
    '<p><b>Our team will reach out to you shortly</b> to guide you through the next steps.</p>' ||
    '<p>&mdash; The MiniGreens Company</p>',
    null,
    null
  );

  perform net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || v_resend_key),
    body := jsonb_build_object(
      'from', 'MiniGreens Orders <orders@mail.minigreenscompany.com>',
      'to', jsonb_build_array(new.email),
      'subject', 'We''ve received your Sumam application',
      'html', v_customer_html
    )
  );

  -- Staff alert, clearly flagged as a Sumam application
  v_staff_html := public._order_email_wrap(
    'New application',
    '🌱 New Sumam application',
    '<p><b>Name:</b> ' || new.full_name || '<br>' ||
    '<b>Email:</b> ' || new.email || '<br>' ||
    '<b>Phone:</b> ' || new.phone || '<br>' ||
    '<b>Address:</b> ' || new.address || '</p>' ||
    (case when coalesce(new.message, '') <> '' then '<p><b>Message:</b> ' || new.message || '</p>' else '' end) ||
    (case when new.aadhaar_document is not null then '<p>&#9989; Aadhaar document uploaded.</p>'
          else '<p>&#9888; No document uploaded.</p>' end),
    'Open in admin',
    'https://admin.minigreenscompany.com/dashboard/sumam'
  );

  perform net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || v_resend_key),
    body := jsonb_build_object(
      'from', 'MiniGreens Orders <orders@mail.minigreenscompany.com>',
      'to', jsonb_build_array(v_staff_to),
      'subject', '🌱 Sumam application — ' || new.full_name,
      'html', v_staff_html
    )
  );

  return new;
exception when others then
  -- Never let an email failure break the application submission.
  return new;
end;
$$;

create trigger sumam_applications_notify_email
  after insert on public.sumam_applications
  for each row execute function public.notify_sumam_application_email();
