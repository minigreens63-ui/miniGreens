// Permanently removes a user's personal data while keeping their historical
// orders for business/tax records (product decision: anonymize, not hard-delete
// — see 20261021100000_account_deletion.sql). Required for Apple Guideline
// 5.1.1(v) / Google Play's account-deletion policy, since this app supports
// account creation.
//
// Two steps, same split as create-razorpay-order:
//  1. public.delete_my_account() runs with the CALLER's own JWT, so auth.uid()
//     scopes every update to their own rows (profiles/addresses/partners/
//     subscriptions/consent_log).
//  2. The two things only a service-role client can do: delete their KYC files
//     from the private partner-kyc bucket, and scramble their auth.users email
//     via the GoTrue Admin API so they can never OTP back into this account.

import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "missing Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userError } = await callerClient.auth.getUser();
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const { error: rpcError } = await callerClient.rpc("delete_my_account");
    if (rpcError) {
      return new Response(JSON.stringify({ error: `anonymization failed: ${rpcError.message}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: files } = await adminClient.storage.from("partner-kyc").list(userId);
    if (files && files.length > 0) {
      await adminClient.storage.from("partner-kyc").remove(files.map((f) => `${userId}/${f.name}`));
    }

    const { error: authUpdateError } = await adminClient.auth.admin.updateUserById(userId, {
      email: `deleted-${userId}@deleted.minigreens.invalid`,
      user_metadata: {},
    });
    if (authUpdateError) {
      // Profile data is already scrubbed; only the login identity itself
      // wasn't fully scrambled. Surface it rather than silently claim success.
      return new Response(
        JSON.stringify({ warning: `profile anonymized, but auth record update failed: ${authUpdateError.message}` }),
        { status: 207, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
