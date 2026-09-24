"use client";
import { useState } from "react";

type FormState = "idle" | "sending" | "sent" | "error";

export default function ContactForm() {
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [state, setState] = useState<FormState>("idle");

  const handleSend = async () => {
    if (!message.trim()) return;
    setState("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message.trim(), userEmail: email.trim() || "anonymous (help page)" }),
      });
      if (!res.ok) throw new Error();
      setState("sent");
      setMessage("");
      setEmail("");
    } catch {
      setState("error");
    }
  };

  const input: React.CSSProperties = {
    width: "100%",
    background: "#f0f0ec",
    border: "1px solid #e2e2db",
    borderRadius: 10,
    color: "#0f1f14",
    fontFamily: "Syne, sans-serif",
    fontSize: 14,
    padding: "10px 12px",
    outline: "none",
    boxSizing: "border-box",
  };

  if (state === "sent") {
    return (
      <div style={{ padding: "24px", background: "#f0f0ec", borderRadius: 14, textAlign: "center" }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>✅</div>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6, color: "#0f1f14" }}>Message sent!</div>
        <p style={{ fontSize: 13, color: "#4a6654", margin: 0 }}>We'll get back to you as soon as possible.</p>
        <button onClick={() => setState("idle")}
          style={{ marginTop: 14, fontSize: 12, color: "#86a892", background: "none", border: "none", cursor: "pointer", fontFamily: "DM Mono, monospace" }}>
          Send another
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <input
        type="email"
        placeholder="Your email (optional — for us to reply)"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={input}
      />
      <textarea
        placeholder="Your message…"
        value={message}
        onChange={(e) => { setMessage(e.target.value); if (state === "error") setState("idle"); }}
        rows={4}
        style={{ ...input, resize: "none", lineHeight: 1.5 }}
      />
      {state === "error" && (
        <p style={{ fontSize: 12, color: "#ff3b30", margin: 0, fontFamily: "DM Mono, monospace" }}>Something went wrong — try again.</p>
      )}
      <button
        onClick={handleSend}
        disabled={state === "sending" || !message.trim()}
        style={{
          width: "100%",
          padding: "13px 0",
          borderRadius: 12,
          border: "none",
          background: "#16a34a",
          color: "white",
          fontFamily: "Syne, sans-serif",
          fontWeight: 700,
          fontSize: 14,
          cursor: state === "sending" || !message.trim() ? "default" : "pointer",
          opacity: state === "sending" || !message.trim() ? 0.6 : 1,
          transition: "opacity 0.15s",
        }}>
        {state === "sending" ? "Sending…" : "Send message"}
      </button>
    </div>
  );
}
