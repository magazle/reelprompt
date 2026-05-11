"use client";
import { useEffect, useState } from "react";
import { supabase, registerProUser, checkProUser } from "../lib/supabase";
import type { User } from "@supabase/supabase-js";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Resolve loading within 3s max — guards against Supabase network delays
    // that would keep authLoading=true and hide the ProButton indefinitely.
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
            await registerProUser(u.email);
            localStorage.setItem("reelprompt:pro", "true");
            localStorage.setItem("reelprompt:pro-key", pendingCode);
            localStorage.removeItem("reelprompt:pending-code");
          } else {
            const isPro = await checkProUser(u.email);
            if (isPro) {
              localStorage.setItem("reelprompt:pro", "true");
            }
          }
          // Notify page.tsx AFTER localStorage is written
          window.dispatchEvent(new Event("reelprompt:pro-updated"));
        }

        if (event === "SIGNED_OUT") {
          localStorage.removeItem("reelprompt:pro");
          localStorage.removeItem("reelprompt:pro-key");
          localStorage.removeItem("reelprompt:welcomed");
          // Notify page.tsx to reset isPro state
          window.dispatchEvent(new Event("reelprompt:signed-out"));
        }

        // setUser last — so any consumer reads localStorage in the correct state
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

  // signOut clears localStorage immediately (synchronously) before the async
  // Supabase call, so page.tsx can react without waiting for the auth event.
  const signOut = async () => {
    localStorage.removeItem("reelprompt:pro");
    localStorage.removeItem("reelprompt:pro-key");
    localStorage.removeItem("reelprompt:welcomed");
    window.dispatchEvent(new Event("reelprompt:signed-out"));
    await supabase.auth.signOut();
  };

  return { user, loading, signIn, signOut };
}
