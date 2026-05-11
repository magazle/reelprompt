import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://awwopzxsdtdivbqgkhvv.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_2yeRjt_Pl4N-ooVnFTp2Gw_VgjJlu5o";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── Valida e consuma un codice Pro ────────────────────────────────────────
// Restituisce: "ok" | "invalid" | "already_used" | "error"
export async function validateProCode(
  code: string
): Promise<"ok" | "invalid" | "already_used" | "error"> {
  try {
    const trimmed = code.trim().toUpperCase();

    // 1. Cerca il codice
    const { data, error } = await supabase
      .from("pro_codes")
      .select("code, used")
      .eq("code", trimmed)
      .single();

    if (error || !data) return "invalid";
    if (data.used) return "already_used";

    // 2. Marca come usato
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
