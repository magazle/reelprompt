import type { Metadata } from "next";
import ScrollUnlock from "./ScrollUnlock";

export const metadata: Metadata = {
  title: "Privacy Policy — ReelPrompt",
};

export default function PrivacyPage() {
  const h2 = { fontSize: 16, fontWeight: 700, marginBottom: 8, marginTop: 32 } as React.CSSProperties;
  const p = { fontSize: 14, lineHeight: 1.7, color: "#4A4A46", marginBottom: 12 } as React.CSSProperties;
  const li = { marginBottom: 6 } as React.CSSProperties;

  return (
    <html lang="en" style={{ overflowY: "scroll" }}>
      <body style={{ margin: 0, fontFamily: "Onest, sans-serif", background: "#FFFFFF", color: "#0E0E0E" }}>
        <ScrollUnlock />
        <div className="page-scrollable" style={{ maxWidth: 640, margin: "0 auto", padding: "48px 24px 80px" }}>

          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 11, color: "#0E0E0E", fontFamily: "Onest, sans-serif", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
              ReelPrompt
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 8 }}>
              Privacy Policy
            </h1>
            <p style={{ ...p, fontSize: 12, marginBottom: 0 }}>Last updated: September 2026</p>
          </div>

          <p style={p}>
            ReelPrompt is built with your privacy in mind. There are no accounts, no payments and no tracking. Your scripts never leave your device.
          </p>

          <h2 style={h2}>Who we are</h2>
          <p style={p}>
            ReelPrompt is an independent product developed by Leo Magazzu. For any privacy-related requests, contact us at{" "}
            <a href="mailto:privacy@leomagazzu.it" style={{ color: "#0E0E0E" }}>privacy@leomagazzu.it</a>.
          </p>

          <h2 style={h2}>What data we collect</h2>
          <p style={p}>
            <strong>Using the app:</strong> none. Scripts and settings are stored exclusively on your device, in your browser&apos;s local storage. We have no access to them. Camera and microphone are processed locally in your browser, and recordings are saved directly to your device.
          </p>
          <p style={p}>
            <strong>Contacting us:</strong> if you send a message through the Help Desk form, we receive the message and, if you choose to provide it, your email address. We use them only to reply to you.
          </p>

          <h2 style={h2}>Cookies and local storage</h2>
          <p style={{ ...p, marginBottom: 8 }}>
            ReelPrompt uses no cookies. It uses these local storage entries, which stay on your device and are strictly necessary for the app to work:
          </p>
          <ul style={{ ...p, paddingLeft: 20, marginTop: 0 }}>
            <li style={li}><strong>reelprompt:scripts</strong> — your scripts, including the ones in Deleted scripts</li>
            <li style={li}><strong>reelprompt:settings</strong> — your teleprompter preferences</li>
          </ul>
          <p style={p}>
            Clearing your browser data for this site removes them permanently.
          </p>

          <h2 style={h2}>Third-party services</h2>
          <ul style={{ ...p, paddingLeft: 20, marginTop: 0 }}>
            <li style={li}><strong>Vercel</strong> — hosting and CDN</li>
            <li style={li}><strong>Resend</strong> — delivery of the messages you send through the Help Desk form</li>
            <li style={li}><strong>Ko-fi</strong> — optional donations, handled entirely on Ko-fi&apos;s website</li>
          </ul>

          <h2 style={h2}>Your rights (GDPR)</h2>
          <p style={{ ...p, marginBottom: 8 }}>As a user in the EU, you have the right to:</p>
          <ul style={{ ...p, paddingLeft: 20, marginTop: 0 }}>
            <li style={li}>Access the personal data we hold about you</li>
            <li style={li}>Request correction or deletion of your data</li>
            <li style={li}>Withdraw consent at any time</li>
          </ul>
          <p style={p}>
            To exercise any of these rights, contact us at{" "}
            <a href="mailto:privacy@leomagazzu.it" style={{ color: "#0E0E0E" }}>privacy@leomagazzu.it</a>.
            We will respond within 30 days.
          </p>

          <h2 style={h2}>Data retention</h2>
          <p style={p}>
            Support messages are kept only as long as needed to handle your request. If you had a ReelPrompt Pro account, you can ask us at any time to delete the email and scripts associated with it.
          </p>

          <h2 style={h2}>Changes to this policy</h2>
          <p style={p}>
            We may update this policy as the product evolves. The date at the top of this page always reflects the latest version.
          </p>

          <div style={{ marginTop: 48, paddingTop: 24, borderTop: "1px solid #E4E4DF" }}>
            <a href="/" style={{ fontSize: 13, color: "#0E0E0E", textDecoration: "none", fontFamily: "Onest, sans-serif" }}>
              ← Back to ReelPrompt
            </a>
          </div>

        </div>
      </body>
    </html>
  );
}
