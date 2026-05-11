"use client";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { User } from "@supabase/supabase-js";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const u = session?.user ?? null;
        setUser(u);

        // When user completes magic link sign-in AND has a pending pro code,
        // write the pro flag. This is the only place isPro gets set to true.
        if (event === "SIGNED_IN" && u) {
          const pendingCode = localStorage.getItem("reelprompt:pending-code");
          if (pendingCode) {
            localStorage.setItem("reelprompt:pro", "true");
            localStorage.setItem("reelprompt:pro-key", pendingCode);
            localStorage.removeItem("reelprompt:pending-code");
          }
        }

        // On sign out: clear pro flag
        if (event === "SIGNED_OUT") {
          localStorage.removeItem("reelprompt:pro");
          localStorage.removeItem("reelprompt:pro-key");
          localStorage.removeItem("reelprompt:welcomed");
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = (email: string) =>
    supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });

  const signOut = () => supabase.auth.signOut();

  return { user, loading, signIn, signOut };
}
