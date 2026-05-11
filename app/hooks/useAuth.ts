"use client";
import { useEffect, useState } from "react";
import { supabase, checkProUser } from "../lib/supabase";
import type { User } from "@supabase/supabase-js";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPro, setIsPro] = useState<boolean>(() => {
    try { return localStorage.getItem("reelprompt:pro") === "true"; } catch { return false; }
  });

  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 3000);

    supabase.auth.getSession().then(({ data }) => {
      clearTimeout(timeout);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const u = session?.user ?? null;

        if (event === "SIGNED_IN" && u?.email) {
          const pendingCode = localStorage.getItem("reelprompt:pending-code");
          if (pendingCode) {
            // New activation: code was validated in SuccessView, mark as Pro
            localStorage.setItem("reelprompt:pro", "true");
            localStorage.setItem("reelprompt:pro-key", pendingCode);
            localStorage.removeItem("reelprompt:pending-code");
            setIsPro(true);
          } else {
            // Returning user: verify Pro status from DB
            // RLS on pro_users is USING (true) so this works for everyone
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
          setIsPro(false);
        }

        setUser(u);
      }
    );

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = (email: string) =>
    supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: "https://www.reelprompt.xyz" },
    });

  const signOut = async () => {
    localStorage.removeItem("reelprompt:pro");
    localStorage.removeItem("reelprompt:pro-key");
    localStorage.removeItem("reelprompt:welcomed");
    setIsPro(false);
    await supabase.auth.signOut();
  };

  return { user, isPro, loading, signIn, signOut };
}
