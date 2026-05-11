import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://awwopzxsdtdivbqgkhvv.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_2yeRjt_Pl4N-ooVnFTp2Gw_VgjJlu5o";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Validate and consume a Pro activation code
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
  } catch {
    return "error";
  }
}

// Check if an email is registered as Pro
// Works for anonymous users because RLS on pro_users is USING (true)
export async function checkProUser(email: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("pro_users")
      .select("email")
      .eq("email", email.trim().toLowerCase())
      .maybeSingle(); // maybeSingle returns null instead of error when no row found
    if (error) return false;
    return !!data;
  } catch {
    return false;
  }
}
