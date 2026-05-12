import type { Metadata } from "next";
import ContactForm from "./ContactForm";

export const metadata: Metadata = {
  title: "Help — ReelPrompt",
};

const sections = [
  {
    emoji: "🚀",
    title: "Getting started",
    items: [
      {
        q: "How do I create a script?",
        a: "Tap the green New button on the home screen. The editor opens automatically — type or paste your script. Use the toolbar for bold, italic, colour highlights and bullet lists.",
      },
      {
        q: "Does ReelPrompt work offline?",
        a: "Yes. ReelPrompt is a PWA (Progressive Web App) that works fully offline. Your scripts are saved locally on your device. An internet connection is only needed to activate Pro and sync across devices.",
      },
      {
        q: "How do I install ReelPrompt on my home screen?",
        a: "On iOS Safari: tap the Share button → Add to Home Screen. On Android Chrome: tap the three-dot menu → Install app. Once installed, ReelPrompt runs fullscreen without the browser bar.",
      },
    ],
  },
  {
    emoji: "🎬",
    title: "Recording",
    items: [
      {
        q: "How do I start recording?",
        a: "Tap the ▶ button on any script card to go straight to the teleprompter. A 3-2-1 countdown gives you time to compose yourself, then the script scrolls automatically over your camera preview.",
      },
      {
        q: "Does the text appear in my video?",
        a: "No. The text overlay is rendered on top of your camera preview in the browser only — it is never written to the video file. Your recorded video contains only the raw camera footage.",
      },
      {
        q: "How do I calibrate scroll speed to my natural pace?",
        a: "Open a script, tap Calibrate in the editor footer, press Start, and read the script aloud at your natural pace. Press Done on the last word. ReelPrompt calculates your WPM and sets the scroll speed automatically.",
      },
      {
        q: "How do I save the recorded video?",
        a: "When you stop recording, ReelPrompt offers three save methods automatically: on mobile it opens the OS share sheet (save to Gallery, Drive, AirDrop etc.), on desktop Chrome it opens a native Save As dialog, and as a fallback it triggers a direct download.",
      },
      {
        q: "Can I mirror the text or video?",
        a: "Yes. Open Settings in the teleprompter view. You can mirror the text (for use with a physical teleprompter or beam splitter) and mirror the video preview independently.",
      },
    ],
  },
  {
    emoji: "✦",
    title: "ReelPrompt Pro",
    items: [
      {
        q: "What is ReelPrompt Pro?",
        a: "Pro gives you script sync across all your devices — write on your laptop, record on your phone. It is a one-time payment of €3 or more (pay what you feel is fair). No subscription, no expiry.",
      },
      {
        q: "How do I activate Pro?",
        a: "Tap Go Pro in the header, then Support ReelPrompt on Ko-fi with €3 or more. After your payment you will receive an activation code by email within 24 hours. Enter the code in the app, then enter your email to receive a magic link. Click the link to complete activation.",
      },
      {
        q: "What is a magic link?",
        a: "A magic link is a secure one-time sign-in link sent to your email — no password needed. Click it and you are signed in automatically. It works on any browser and any device.",
      },
      {
        q: "Can I use Pro on multiple devices?",
        a: "Yes. Sign in with the same email on any device by going to your profile and requesting a new magic link. Your scripts will sync automatically once you are signed in.",
      },
      {
        q: "Does Pro work offline?",
        a: "Yes. Once you have signed in at least once, your Pro status and scripts are cached locally. You can use ReelPrompt fully offline. Sync resumes automatically when you reconnect.",
      },
      {
        q: "Why can't I sign in when I'm offline?",
        a: "The magic link is sent via email, which requires an internet connection. If you are offline, you will see a notice in the app. Your existing Pro session remains active — you just cannot start a new session until you reconnect.",
      },
      {
        q: "I paid but haven't received my activation code.",
        a: "Check your spam folder first. If it's not there after 24 hours, use the contact form below with your Ko-fi order confirmation and we'll sort it out immediately.",
      },
      {
        q: "Can I change my email address?",
        a: "Yes. Go to your profile → Contact & Feedback and send us a message with your current and new email address. We'll update it manually and send a new magic link to your new address.",
      },
    ],
  },
  {
    emoji: "🔒",
    title: "Privacy & data",
    items: [
      {
        q: "Where are my scripts stored?",
        a: "Free users: scripts are stored locally on your device using localStorage — we have no access to them. Pro users: scripts are also stored on Supabase servers in Ireland (EU), encrypted in transit and at rest.",
      },
      {
        q: "Do you use cookies or tracking?",
        a: "We use only essential technical cookies — no advertising, no analytics, no tracking. See our Privacy Policy for the full list.",
      },
      {
        q: "How do I delete my account and data?",
        a: "Send us a message via the contact form below or the Contact & Feedback form in your profile. We will delete your email, scripts and settings from our servers within 30 days.",
      },
    ],
  },
  {
    emoji: "🛠",
    title: "Troubleshooting",
    items: [
      {
        q: "The camera isn't working.",
        a: "Make sure you have granted camera permission to your browser. On iOS, go to Settings → Safari → Camera. On Android, go to Settings → Apps → Chrome → Permissions. Then reload the page.",
      },
      {
        q: "The scroll speed feels off even after calibration.",
        a: "You can fine-tune speed manually in the teleprompter settings panel. Drag the Speed slider while the script is scrolling to adjust in real time.",
      },
      {
        q: "The video saved in landscape instead of portrait.",
        a: "ReelPrompt re-encodes the video to 9:16 portrait using a canvas encoder. On some older Android browsers this may not work correctly. Try updating your browser to the latest version.",
      },
      {
        q: "I lost my scripts after clearing browser data.",
        a: "Free users store scripts in localStorage, which is cleared when you clear browser data. Pro users can recover their scripts by signing back in — scripts are synced to the cloud.",
      },
    ],
  },
];

export default function HelpPage() {
  return (
    <html lang="en" style={{ overflowY: "auto", minHeight: "100vh" }}>
      <body style={{ margin: 0, fontFamily: "Syne, sans-serif", background: "#f9f9f7", color: "#0f1f14", minHeight: "100vh", overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
        <div style={{ maxWidth: 680, margin: "0 auto", padding: "48px 24px 80px" }}>

          {/* Header */}
          <div style={{ marginBottom: 40 }}>
            <div style={{ fontSize: 11, color: "#16a34a", fontFamily: "DM Mono, monospace", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
              ReelPrompt
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 8 }}>Help Desk</h1>
            <p style={{ fontSize: 14, color: "#4a6654", lineHeight: 1.6, margin: 0 }}>
              Everything you need to know about ReelPrompt. Can't find your answer? Use the contact form at the bottom of this page.
            </p>
          </div>

          {/* Sections */}
          {sections.map((section) => (
            <div key={section.title} style={{ marginBottom: 48 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
                <span>{section.emoji}</span> {section.title}
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {section.items.map((item, i) => (
                  <details key={i} style={{ background: "#ffffff", border: "1px solid #e2e2db", borderRadius: 12, overflow: "hidden" }}>
                    <summary style={{
                      padding: "16px 20px", fontSize: 14, fontWeight: 600,
                      cursor: "pointer", listStyle: "none",
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      gap: 12,
                    }}>
                      {item.q}
                      <span style={{ fontSize: 18, color: "#86a892", flexShrink: 0, fontWeight: 400 }}>+</span>
                    </summary>
                    <div style={{ padding: "0 20px 16px", fontSize: 14, color: "#4a6654", lineHeight: 1.7, borderTop: "1px solid #e2e2db" }}>
                      <p style={{ margin: "12px 0 0" }}>{item.a}</p>
                    </div>
                  </details>
                ))}
              </div>
            </div>
          ))}

          {/* Contact form */}
          <div style={{ marginTop: 48, padding: "28px", background: "#ffffff", border: "1px solid #e2e2db", borderRadius: 16 }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 20, marginBottom: 6 }}>📬</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#0f1f14", marginBottom: 6 }}>Still need help?</div>
              <p style={{ fontSize: 14, color: "#4a6654", lineHeight: 1.6, margin: 0 }}>
                Send us a message and we'll get back to you as soon as possible.
              </p>
            </div>
            <ContactForm />
          </div>

          {/* Footer */}
          <div style={{ marginTop: 48, paddingTop: 24, borderTop: "1px solid #e2e2db", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <a href="/" style={{ fontSize: 13, color: "#16a34a", textDecoration: "none", fontFamily: "DM Mono, monospace" }}>
              ← Back to ReelPrompt
            </a>
            <a href="/privacy" style={{ fontSize: 13, color: "#86a892", textDecoration: "none", fontFamily: "DM Mono, monospace" }}>
              Privacy Policy
            </a>
          </div>

        </div>
      </body>
    </html>
  );
}
