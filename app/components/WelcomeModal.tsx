"use client";

interface Props {
  onClose: () => void;
}

export default function WelcomeModal({ onClose }: Props) {
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 300,
        background: "rgba(15,31,20,0.6)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "0 32px",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--surface)", borderRadius: 24,
          border: "2px solid var(--accent)",
          boxShadow: "0 0 48px var(--accent-glow)",
          padding: "36px 28px", maxWidth: 320, width: "100%",
          textAlign: "center",
          animation: "scale-in 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        }}
      >
        <div style={{ fontSize: 40, marginBottom: 16 }}>✦</div>
        <h2 style={{
          fontFamily: "var(--font-display)", fontWeight: 800,
          fontSize: 22, letterSpacing: "-0.02em", marginBottom: 10,
        }}>
          Welcome to Pro
        </h2>
        <p style={{
          fontSize: 13, color: "var(--text-2)", lineHeight: 1.6,
          marginBottom: 24, fontFamily: "var(--font-mono)",
        }}>
          Your scripts will sync across all your devices. Sign in from your profile to activate sync.
        </p>
        <button
          onClick={onClose}
          className="btn btn-primary"
          style={{ width: "100%", fontSize: 14 }}
        >
          Let's go
        </button>
      </div>
    </div>
  );
}
