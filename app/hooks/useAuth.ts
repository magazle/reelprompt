"use client";
import { useEffect, useState } from "react";
import { supabase, registerProUser, checkProUser } from "../lib/supabase";
import type { User } from "@supabase/supabase-js";

export function useAuth() {
  const [user, setUser]     = useState<User | null>(null);
  const [isPro, setIsPro]   = useState<boolean>(() => {
    try { return localStorage.getItem("reelprompt:pro") === "true"; } catch { return false; }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fallback: resolve loading within 3s if Supabase is slow
    const timeout = setTimeout(() => setLoading(false), 3000);

    supabase.auth.getSession().then(({ data }) => {
      clearTimeout(timeout);
      const u = data.session?.user ?? null;
      setUser(u);
      setLoading(false);
      // If there's already a session on mount (e.g. returning user),
      // re-read the pro flag from localStorage in case it was set earlier.
      if (u) {
        const stored = localStorage.getItem("reelprompt:pro") === "true";
        setIsPro(stored);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const u = session?.user ?? null;

        if (event === "SIGNED_IN" && u?.email) {
          const pendingCode = localStorage.getItem("reelprompt:pending-code");
          if (pendingCode) {
            // New activation: register email, mark as Pro
            await registerProUser(u.email);
            localStorage.setItem("reelprompt:pro", "true");
            localStorage.setItem("reelprompt:pro-key", pendingCode);
            localStorage.removeItem("reelprompt:pending-code");
            setIsPro(true);
          } else {
            // Returning user: check DB (works because user is now authenticated)
            const proStatus = await checkProUser(u.email);
            if (proStatus) {
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
      options: { emailRedirectTo: window.location.origin },
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
