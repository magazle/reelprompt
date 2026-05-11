import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://awwopzxsdtdivbqgkhvv.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_2yeRjt_Pl4N-ooVnFTp2Gw_VgjJlu5o";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function validateProCode(
  code: string
): Promise<"ok" | "invalid" | "already_used" | "error"> {
  try {
    const trimmed = code.trim().toUpperCase();

    // 1. Read current state of the code
    const { data, error } = await supabase
      .from("pro_codes")
      .select("code, used")
      .eq("code", trimmed)
      .single();

    if (error || !data) return "invalid";
    if (data.used) return "already_used";

    // 2. Atomic conditional update: only marks as used if still unused.
    //    The .eq("used", false) guard prevents a race where two concurrent
    //    requests both read used=false and both try to consume the same code.
    const { error: updateError, count } = await supabase
      .from("pro_codes")
      .update({ used: true, used_at: new Date().toISOString() })
      .eq("code", trimmed)
      .eq("used", false)  // guard: only update if still unused
      .select();          // needed so count is populated

    if (updateError) return "error";
    // count === 0 means another request won the race — code now used
    if (count === 0) return "already_used";

    return "ok";
  } catch { return "error"; }
}

export async function registerProUser(email: string): Promise<void> {
  await supabase.from("pro_users").upsert({ email }, { onConflict: "email" });
}

export async function checkProUser(email: string): Promise<boolean> {
  const { data } = await supabase
    .from("pro_users")
    .select("email")
    .eq("email", email)
    .single();
  return !!data;
}
