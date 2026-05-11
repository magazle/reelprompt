import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — ReelPrompt",
};

export default function PrivacyPage() {
  const s = { marginBottom: 24 } as React.CSSProperties;
  const h2 = { fontSize: 16, fontWeight: 700, marginBottom: 8, marginTop: 32 } as React.CSSProperties;
  const p = { fontSize: 14, lineHeight: 1.7, color: "#4a6654" } as React.CSSProperties;

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "48px 24px 80px", fontFamily: "Syne, sans-serif" }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 11, color: "#16a34a", fontFamily: "DM Mono, monospace", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
          ReelPrompt
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 8 }}>
          Privacy & Cookie Policy
        </h1>
        <p style={{ ...p, fontSize: 12 }}>Last updated: May 2026</p>
      </div>

      <div style={s}>
        <p style={p}>
          ReelPrompt is built with your privacy in mind. We collect the minimum data necessary to provide the service and never sell or share your data with third parties for advertising purposes.
        </p>
      </div>

      <h2 style={h2}>Who we are</h2>
      <p style={p}>
        ReelPrompt is an independent product developed by Leo Magazzu. For any privacy-related requests, contact us at <a href="mailto:noreply@leomagazzu.it" style={{ color: "#16a34a" }}>noreply@leomagazzu.it</a>.
      </p>

      <h2 style={h2}>What data we collect</h2>
      <p style={p}>
        <strong>Free users (no account):</strong> No personal data is collected. Scripts and settings are stored exclusively on your device using localStorage. We have no access to this data.
      </p>
      <p style={{ ...p, marginTop: 12 }}>
        <strong>Pro users (with account):</strong> We collect your email address to provide authentication and sync your scripts across devices. Your scripts and settings are stored securely on Supabase servers located in Ireland (EU).
      </p>

      <h2 style={h2}>How we use your data</h2>
      <p style={p}>We use your email address exclusively to:</p>
      <ul style={{ ...p, paddingLeft: 20, marginTop: 8 }}>
        <li style={{ marginBottom: 6 }}>Send you a magic link to sign in</li>
        <li style={{ marginBottom: 6 }}>Sync your scripts across your devices</li>
        <li style={{ marginBottom: 6 }}>Respond to support requests you send us</li>
      </ul>

      <h2 style={h2}>Data storage and security</h2>
      <p style={p}>
        Pro user data is stored on <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" style={{ color: "#16a34a" }}>Supabase</a>, hosted in Ireland (EU West), compliant with GDPR. Data is encrypted in transit (TLS) and at rest. Row-level security ensures each user can only access their own data.
      </p>

      <h2 style={h2}>Cookies and local storage</h2>
      <p style={p}>
        We use the following essential technical cookies and local storage entries — no advertising or tracking cookies are used:
      </p>
      <ul style={{ ...p, paddingLeft: 20, marginTop: 8 }}>
        <li style={{ marginBottom: 6 }}><strong>reelprompt:scripts</strong> — your scripts, stored locally on your device</li>
        <li style={{ marginBottom: 6 }}><strong>reelprompt:settings</strong> — your teleprompter preferences, stored locally</li>
        <li style={{ marginBottom: 6 }}><strong>reelprompt:pro</strong> — your Pro activation status, stored locally</li>
        <li style={{ marginBottom: 6 }}><strong>reelprompt:cookies</strong> — records that you acknowledged this banner</li>
        <li style={{ marginBottom: 6 }}><strong>Supabase auth cookies</strong> — session tokens used to keep you signed in across devices (Pro only)</li>
      </ul>
      <p style={{ ...p, marginTop: 12 }}>
        These cookies are strictly necessary for the app to function. They cannot be disabled without breaking core features.
      </p>

      <h2 style={h2}>Third-party services</h2>
      <ul style={{ ...p, paddingLeft: 20 }}>
        <li style={{ marginBottom: 6 }}><strong>Supabase</strong> — authentication and database (Ireland, EU)</li>
        <li style={{ marginBottom: 6 }}><strong>Vercel</strong> — hosting and CDN</li>
        <li style={{ marginBottom: 6 }}><strong>Ko-fi</strong> — payment processing for Pro access (no payment data is stored by ReelPrompt)</li>
        <li style={{ marginBottom: 6 }}><strong>Resend</strong> — transactional email for magic links and support replies</li>
      </ul>

      <h2 style={h2}>Your rights (GDPR)</h2>
      <p style={p}>As a user in the EU, you have the right to:</p>
      <ul style={{ ...p, paddingLeft: 20, marginTop: 8 }}>
        <li style={{ marginBottom: 6 }}>Access the personal data we hold about you</li>
        <li style={{ marginBottom: 6 }}>Request correction or deletion of your data</li>
        <li style={{ marginBottom: 6 }}>Export your data</li>
        <li style={{ marginBottom: 6 }}>Withdraw consent at any time</li>
      </ul>
      <p style={{ ...p, marginTop: 12 }}>
        To exercise any of these rights, contact us at <a href="mailto:noreply@leomagazzu.it" style={{ color: "#16a34a" }}>noreply@leomagazzu.it</a>. We will respond within 30 days.
      </p>

      <h2 style={h2}>Data retention</h2>
      <p style={p}>
        We retain your data for as long as your account is active. If you request deletion, we will remove your email, scripts, and settings from our servers within 30 days.
      </p>

      <h2 style={h2}>Changes to this policy</h2>
      <p style={p}>
        We may update this policy as the product evolves. Significant changes will be communicated via email to Pro users. The date at the top of this page always reflects the latest version.
      </p>

      <div style={{ marginTop: 48, paddingTop: 24, borderTop: "1px solid #e2e2db" }}>
        <a href="/" style={{ fontSize: 13, color: "#16a34a", textDecoration: "none", fontFamily: "DM Mono, monospace" }}>
          ← Back to ReelPrompt
        </a>
      </div>
    </div>
  );
}
