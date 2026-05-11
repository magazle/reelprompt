import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://awwopzxsdtdivbqgkhvv.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_2yeRjt_Pl4N-ooVnFTp2Gw_VgjJlu5o";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function validateProCode(
  code: string
): Promise<"ok" | "invalid" | "already_used" | "error"> {
  try {
    const trimmed = code.trim().toUpperCase();
    const { data, error } = await supabase
      .from("pro_codes")
      .select("code, used")
      .eq("code", trimmed)
      .single();
    if (error || !data) return "invalid";
    if (data.used) return "already_used";
    const { error: updateError } = await supabase
      .from("pro_codes")
      .update({ used: true, used_at: new Date().toISOString() })
      .eq("code", trimmed);
    if (updateError) return "error";
    return "ok";
  } catch { return "error"; }
}

// Uses raw fetch instead of the Supabase JS client to avoid
// potential issues with shared client state or concurrent requests.
export async function checkProUser(email: string): Promise<boolean> {
  try {
    const encoded = encodeURIComponent(email.trim().toLowerCase());
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/pro_users?select=email&email=eq.${encoded}`,
      {
        headers: {
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    );
    if (!res.ok) return false;
    const data = await res.json();
    return Array.isArray(data) && data.length > 0;
  } catch { return false; }
}
