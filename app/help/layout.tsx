// Override the root layout's overflow:hidden so the Help page can scroll normally.
export default function HelpLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100dvh", overflowY: "auto", WebkitOverflowScrolling: "touch" } as React.CSSProperties}>
      {children}
    </div>
  );
}
