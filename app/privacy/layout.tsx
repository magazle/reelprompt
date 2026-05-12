export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100dvh", overflowY: "auto", WebkitOverflowScrolling: "touch" } as React.CSSProperties}>
      {children}
    </div>
  );
}
