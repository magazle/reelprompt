import type { Metadata } from "next";
import ContactForm from "./ContactForm";
import ScrollUnlock from "./ScrollUnlock";

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
        a: "Yes. ReelPrompt is a PWA (Progressive Web App) that works fully offline. Your scripts are saved locally on your device, and no internet connection is needed once the app is loaded.",
      },
      {
        q: "How do I install ReelPrompt on my home screen?",
        a: "On iOS Safari: tap the Share button (the square with an arrow) → Add to Home Screen. On Android Chrome: tap the three-dot menu → Install app. Once installed, ReelPrompt runs fullscreen without the browser bar — this also improves camera performance.",
      },
      {
        q: "What is the difference between using ReelPrompt in the browser vs installed?",
        a: "When installed as a PWA, ReelPrompt runs fullscreen with no browser bar, behaves more like a native app, and has better access to camera and screen wake lock. We recommend installing it for the best experience.",
      },
      {
        q: "Is ReelPrompt free?",
        a: "Yes, completely. Unlimited scripts, teleprompter, camera recording and calibration, with no account and no payment. If you love it, you can buy us a coffee from the menu — totally optional.",
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
        q: "Can I adjust the speed while recording?",
        a: "Yes. During recording, open the Settings panel and drag the Speed slider to adjust in real time. The script continues scrolling while you adjust.",
      },
      {
        q: "How do I save the recorded video?",
        a: "When you stop recording, ReelPrompt offers three save methods automatically: on mobile it opens the OS share sheet (save to Gallery, Drive, AirDrop etc.), on desktop Chrome it opens a native Save As dialog, and as a fallback it triggers a direct download.",
      },
      {
        q: "The video didn't save or the download didn't start.",
        a: "This can happen if the browser blocked the download or the recording was too short. Try stopping the recording after at least 2 seconds. If the issue persists, make sure you're using an up-to-date version of Chrome or Safari.",
      },
      {
        q: "Can I mirror the text or video?",
        a: "Yes. Open Settings in the teleprompter view. You can mirror the text (for use with a physical teleprompter or beam splitter) and mirror the video preview independently.",
      },
    ],
  },
  {
    emoji: "📝",
    title: "Scripts",
    items: [
      {
        q: "How do I recover a deleted script?",
        a: "Deleted scripts are moved to an archive, not permanently removed. Open the menu (≡) in the header → Deleted scripts. From there you can restore any script to your list, or permanently delete it.",
      },
      {
        q: "I lost my scripts after clearing browser data.",
        a: "Scripts are stored in your browser's local storage, which is erased when you clear browser data. Unfortunately they cannot be recovered, because we never have a copy of them.",
      },
    ],
  },
  {
    emoji: "🔒",
    title: "Privacy & data",
    items: [
      {
        q: "Where are my scripts stored?",
        a: "Only on your device, in your browser's local storage. They are never sent to our servers and we have no access to them.",
      },
      {
        q: "Do you use cookies or tracking?",
        a: "No. ReelPrompt uses no cookies, no analytics and no tracking. It only uses your browser's local storage to keep your scripts and settings on your device.",
      },
      {
        q: "How do I delete my data?",
        a: "Delete your scripts from the app and empty Deleted scripts, or simply clear your browser data for this site. Nothing is stored anywhere else.",
      },
    ],
  },
  {
    emoji: "🛠",
    title: "Troubleshooting",
    items: [
      {
        q: "The camera isn't working.",
        a: "Make sure you have granted camera permission to your browser. On iOS, go to Settings → Safari → Camera and set it to Allow. On Android, go to Settings → Apps → Chrome → Permissions → Camera. Then reload the page. If you're using the installed PWA, the permission follows the browser you used to install it.",
      },
      {
        q: "The screen turns off while I'm recording.",
        a: "ReelPrompt uses the Wake Lock API to keep the screen on during recording. This is supported on Chrome and most modern browsers. If your screen still turns off, make sure you are using an up-to-date version of Chrome and that battery saver mode is not active.",
      },
      {
        q: "The scroll speed feels off even after calibration.",
        a: "You can fine-tune speed manually in the teleprompter settings panel. Drag the Speed slider while the script is scrolling to adjust in real time. If your reading pace varies a lot, try calibrating on a short paragraph at your most natural speed.",
      },
      {
        q: "The video saved in landscape instead of portrait.",
        a: "ReelPrompt re-encodes the video to 9:16 portrait using a canvas encoder. On some older Android browsers this may not work correctly. Try updating your browser to the latest version, or use Chrome.",
      },
      {
        q: "The app feels slow or laggy.",
        a: "Try installing ReelPrompt as a PWA from your home screen — it runs faster than in the browser. Also make sure no other apps are heavily using the camera in the background.",
      },
    ],
  },
];

export default function HelpPage() {
  return (
    <html lang="en" style={{ overflowY: "auto", minHeight: "100vh" }}>
      <body style={{ margin: 0, fontFamily: "Onest, sans-serif", background: "#FFFFFF", color: "#0E0E0E", minHeight: "100vh", overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
        <ScrollUnlock />
        <div className="page-scrollable" style={{ maxWidth: 680, margin: "0 auto", padding: "48px 24px 80px" }}>

          {/* Header */}
          <div style={{ marginBottom: 40 }}>
            <div style={{ fontSize: 11, color: "#0E0E0E", fontFamily: "Onest, sans-serif", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
              ReelPrompt
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 8 }}>Help Desk</h1>
            <p style={{ fontSize: 14, color: "#4A4A46", lineHeight: 1.6, margin: 0 }}>
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
                  <details key={i} style={{ background: "#ffffff", border: "1px solid #E4E4DF", borderRadius: 12, overflow: "hidden" }}>
                    <summary style={{
                      padding: "16px 20px", fontSize: 14, fontWeight: 600,
                      cursor: "pointer", listStyle: "none",
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      gap: 12,
                    }}>
                      {item.q}
                      <span style={{ fontSize: 18, color: "#6B6B66", flexShrink: 0, fontWeight: 400 }}>+</span>
                    </summary>
                    <div style={{ padding: "0 20px 16px", fontSize: 14, color: "#4A4A46", lineHeight: 1.7, borderTop: "1px solid #E4E4DF" }}>
                      <p style={{ margin: "12px 0 0" }}>{item.a}</p>
                    </div>
                  </details>
                ))}
              </div>
            </div>
          ))}

          {/* Contact form */}
          <div style={{ marginTop: 48, padding: "28px", background: "#ffffff", border: "1px solid #E4E4DF", borderRadius: 16 }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 20, marginBottom: 6 }}>📬</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#0E0E0E", marginBottom: 6 }}>Still need help?</div>
              <p style={{ fontSize: 14, color: "#4A4A46", lineHeight: 1.6, margin: 0 }}>
                Send us a message and we'll get back to you as soon as possible.
              </p>
            </div>
            <ContactForm />
          </div>

          {/* Footer */}
          <div style={{ marginTop: 48, paddingTop: 24, borderTop: "1px solid #E4E4DF", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <a href="/" style={{ fontSize: 13, color: "#0E0E0E", textDecoration: "none", fontFamily: "Onest, sans-serif" }}>
              ← Back to ReelPrompt
            </a>
            <a href="/privacy" style={{ fontSize: 13, color: "#6B6B66", textDecoration: "none", fontFamily: "Onest, sans-serif" }}>
              Privacy Policy
            </a>
          </div>

        </div>
      </body>
    </html>
  );
}
