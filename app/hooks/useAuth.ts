"use client";
import { useEffect, useState } from "react";
import { supabase, checkProUser, SUPABASE_URL, SUPABASE_ANON_KEY } from "../lib/supabase";
import type { User } from "@supabase/supabase-js";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  // Source of truth for Pro status — writable only inside this hook.
  // Initialized from localStorage so returning users with cached flag
  // get Pro instantly on mount, before any network call completes.
  const [isPro, setIsPro] = useState<boolean>(() => {
    try { return localStorage.getItem("reelprompt:pro") === "true"; } catch { return false; }
  });

  useEffect(() => {
    // Fallback: resolve loading within 3s if Supabase is slow
    const timeout = setTimeout(() => setLoading(false), 3000);

    supabase.auth.getSession().then(({ data }) => {
      clearTimeout(timeout);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const u = session?.user ?? null;
        setUser(u);

        if (event === "SIGNED_IN" && u?.email) {
          const pendingCode = localStorage.getItem("reelprompt:pending-code");
          if (pendingCode) {
            // New activation: code validated in SuccessView
            localStorage.setItem("reelprompt:pro", "true");
            localStorage.setItem("reelprompt:pro-key", pendingCode);
            localStorage.removeItem("reelprompt:pending-code");
            setIsPro(true);
          } else {
            // Returning user: check DB — works because RLS is USING (true)
            const isProUser = await checkProUser(u.email);
            if (isProUser) {
              localStorage.setItem("reelprompt:pro", "true");
              setIsPro(true);
            }
          }
        }

        if (event === "SIGNED_OUT") {
          localStorage.removeItem("reelprompt:pro");
          localStorage.removeItem("reelprompt:pro-key");
          localStorage.removeItem("reelprompt:welcomed");
          setIsPro(false);
        }
      }
    );

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  // Raw fetch instead of supabase.auth.signInWithOtp — the JS client
  // occasionally hangs on this call (same issue seen with checkProUser).
  const signIn = async (email: string): Promise<{ error: Error | null }> => {
    try {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          create_user: true,
          options: { emailRedirectTo: "https://www.reelprompt.xyz" },
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        return { error: new Error(body?.msg ?? `HTTP ${res.status}`) };
      }
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error("Network error") };
    }
  };

  const signOut = async () => {
    localStorage.removeItem("reelprompt:pro");
    localStorage.removeItem("reelprompt:pro-key");
    localStorage.removeItem("reelprompt:welcomed");
    await supabase.auth.signOut();
  };

  return { user, loading, isPro, signIn, signOut };
}
