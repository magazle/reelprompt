"use client";
import { useEffect, useState } from "react";
import { supabase, checkProUser } from "../lib/supabase";
import type { User } from "@supabase/supabase-js";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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
          } else {
            // Returning user: check DB — works because RLS is USING (true)
            const isProUser = await checkProUser(u.email);
            if (isProUser) {
              localStorage.setItem("reelprompt:pro", "true");
            }
          }
        }

        if (event === "SIGNED_OUT") {
          localStorage.removeItem("reelprompt:pro");
          localStorage.removeItem("reelprompt:pro-key");
          localStorage.removeItem("reelprompt:welcomed");
        }
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
    await supabase.auth.signOut();
  };

  return { user, loading, signIn, signOut };
}
