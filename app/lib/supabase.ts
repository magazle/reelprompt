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
