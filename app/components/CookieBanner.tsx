"use client";
import { useState, useEffect } from "react";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const accepted = localStorage.getItem("reelprompt:cookies");
      if (!accepted) setVisible(true);
    } catch { setVisible(true); }
  }, []);

  const accept = () => {
    try { localStorage.setItem("reelprompt:cookies", "1"); } catch { /* noop */ }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 300,
      padding: "12px 16px",
      paddingBottom: "max(12px, env(safe-area-inset-bottom, 0px))",
      background: "var(--text)", color: "var(--bg)",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      gap: 12, flexWrap: "wrap",
    }}>
      <p style={{ fontSize: 12, lineHeight: 1.5, margin: 0, flex: 1, minWidth: 200 }}>
        We use essential cookies for authentication and sync.{" "}
        <a
          href="/privacy"
          style={{ color: "var(--bg)", textDecoration: "underline", opacity: 0.7 }}
        >
          Privacy Policy
        </a>
      </p>
      <button
        onClick={accept}
        style={{
          background: "var(--accent)", color: "white",
          border: "none", borderRadius: 8, cursor: "pointer",
          fontSize: 12, fontWeight: 700, fontFamily: "var(--font-display)",
          padding: "8px 16px", flexShrink: 0,
        }}
      >
        OK
      </button>
    </div>
  );
}
