-- Swaps the text wordmark in the order-email header for the real MiniGreens
-- logo, now that one has been supplied and hosted at
-- https://minigreenscompany.com/images/logo-email.jpg (webapp/public/images/
-- logo-email.jpg — a forest-green-backed JPEG render of the brand's actual
-- logo.svg, since SVG <img> support is unreliable across email clients,
-- Outlook desktop in particular).

create or replace function public._order_email_wrap(
  p_eyebrow text,
  p_heading text,
  p_body_html text,
  p_cta_label text,
  p_cta_url text
) returns text
language sql
immutable
as $$
  select
    '<!doctype html><html><body style="margin:0;padding:0;background:#efeadb;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">' ||
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#efeadb;padding:32px 16px;"><tr><td align="center">' ||
    '<table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e0d0;">' ||
    '<tr><td style="background:#1f3a24;padding:24px 32px;text-align:center;">' ||
    '<img src="https://minigreenscompany.com/images/logo-email.jpg" width="96" height="96" alt="MiniGreens Company" style="display:block;margin:0 auto;border:0;border-radius:12px;">' ||
    '</td></tr>' ||
    '<tr><td style="padding:36px 32px 8px;">' ||
    '<div style="font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#5f8a3c;margin:0 0 8px;">' || p_eyebrow || '</div>' ||
    '<h1 style="margin:0 0 18px;font-size:23px;line-height:1.3;color:#1f3a24;font-family:Georgia,''Times New Roman'',serif;">' || p_heading || '</h1>' ||
    p_body_html ||
    (case when p_cta_url is not null then
      '<div style="text-align:center;margin:28px 0 8px;">' ||
      '<a href="' || p_cta_url || '" style="display:inline-block;background:#f5c138;color:#1f3a24;font-weight:700;padding:13px 32px;border-radius:999px;text-decoration:none;font-size:14px;">' || p_cta_label || '</a>' ||
      '</div>'
    else '' end) ||
    '</td></tr>' ||
    '<tr><td style="background:#f8f6ee;padding:22px 32px;text-align:center;border-top:1px solid #e5e0d0;">' ||
    '<div style="font-size:12px;color:#1f3a24;opacity:0.7;">MiniGreens Company &middot; Bengaluru, India</div>' ||
    '<div style="font-size:11px;color:#1f3a24;opacity:0.5;margin-top:4px;">India''s First Microgreens Brand</div>' ||
    '</td></tr>' ||
    '</table></td></tr></table></body></html>';
$$;
