# ReelPrompt

**A teleprompter that disappears into your camera.**

ReelPrompt is a mobile-first Progressive Web App for creators who record short videos alone — Instagram Reels, TikToks, talking-head content. It overlays a scrolling script on top of your camera preview so you can read while looking straight into the lens. The exported video contains only the clean recording — no text, no overlay, just you.

No account. No backend. No subscription. Everything stays on your device.

→ **[reelprompt.vercel.app](https://reelprompt.vercel.app)**

---

## The problem it solves

Recording solo means choosing between reading a script (and looking away from the camera) or memorising it (time, stress, multiple takes). ReelPrompt shows the text floating over the camera preview — visible only to you, never captured in the recording.

---

## Features

- **Rich text editor** — bold, italic, bullet points, colour coding (white, yellow, red, green, blue) to mark keywords, emphasis, stage directions and cues
- **Teleprompter** — smooth RAF-based auto-scroll, adjustable speed, font size, line spacing, text width, position (top / centre / bottom)
- **WPM calibration** — reads a preset passage (IT/EN) or your own script, times you with a stopwatch, and auto-sets scroll speed to match your natural pace
- **Text visibility options** — text band backdrop, full overlay, text stroke for bright backgrounds
- **9:16 recording container** — correct vertical format on both mobile and desktop
- **Countdown before recording** — 3-2-1 so you have time to compose yourself
- **Clean video export** — teleprompter overlay never touches the recorded stream
- **Screen wake lock** — screen stays on during recording
- **PWA** — installable on iOS and Android, works offline
- **No dependencies for rich text** — custom `contentEditable` editor, no Tiptap/Quill/Lexical

---

## Stack

| | |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + CSS custom properties |
| PWA | next-pwa |
| Storage | localStorage (scripts + settings) |
| Backend | None |
| Auth | None |
| Deploy | Vercel (free tier) |

---

## Make your own copy

ReelPrompt is MIT licensed — fork it, customise it, deploy your own version for free in about five minutes.

### 1. Fork the repository

Click **Fork** at the top right of this page. This creates your own copy of the codebase under your GitHub account.

### 2. Clone it locally

```bash
git clone https://github.com/YOUR_USERNAME/reelprompt.git
cd reelprompt
```

### 3. Install dependencies

```bash
npm install
```

### 4. Run it locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app runs fully in the browser — no environment variables or API keys needed.

### 5. Deploy to Vercel (free)

The easiest way to get your own public URL:

1. Go to [vercel.com](https://vercel.com) and sign up (free, sign in with GitHub)
2. Click **Add New → Project**
3. Import your forked repository
4. Leave all settings as default — Vercel detects Next.js automatically
5. Click **Deploy**

Your app will be live at `your-project-name.vercel.app` in about 60 seconds. Every time you push to `main`, Vercel redeploys automatically.

---

## Customising

### Change the fonts

Fonts are loaded in `app/globals.css` from Google Fonts and referenced as CSS variables:

```css
--font-display: 'Syne', sans-serif;    /* UI, headings */
--font-mono:    'DM Mono', monospace;  /* timestamps, counters */
--font-serif:   'Instrument Serif', serif; /* teleprompter text */
```

Replace with any Google Fonts combination you prefer.

### Change the colour palette

All colours are CSS variables in `app/globals.css`:

```css
--bg:     #080808;   /* background */
--accent: #ff3b30;   /* record red */
--green:  #30d158;   /* saved / success */
```

### Change the WPM calibration text

In `app/components/SettingsPanel.tsx`, find the `PRESETS` object and replace the `it` and `en` text strings with your own passages.

### Add a language to the calibration tool

In the same `PRESETS` object, add a new key:

```ts
const PRESETS = {
  it: { label: "IT", text: "..." },
  en: { label: "EN", text: "..." },
  fr: { label: "FR", text: "Votre texte en français..." }, // ← add this
};
```

Then add `"fr"` to the `PresetLang` type and the lang toggle buttons.

---

## Project structure

```
app/
├── layout.tsx                    # Root layout, PWA meta
├── page.tsx                      # Entry point, view state machine
├── globals.css                   # Design system, CSS variables
├── lib/
│   ├── types.ts                  # TypeScript types (Script, TeleprompterSettings)
│   └── storage.ts                # localStorage CRUD
├── hooks/
│   ├── useScripts.ts             # Script management
│   ├── useCamera.ts              # getUserMedia, MediaRecorder, download
│   ├── useTeleprompterScroll.ts  # RAF-based auto-scroll
│   └── useWakeLock.ts            # Screen Wake Lock API
└── components/
    ├── Icons.tsx                 # Inline SVG icons
    ├── ScriptCard.tsx            # Script list card with HTML preview
    ├── ScriptEditor.tsx          # Rich text editor with toolbar
    ├── SettingsPanel.tsx         # Bottom sheet: settings + WPM calibrator
    └── TeleprompterView.tsx      # Recording screen (9:16 container)
```

Navigation is a simple state machine — no router, just `useState<View>` in `page.tsx`:

```
list → editor → teleprompter → (done) → editor
                                      → list
```

---

## Known limitations

- Storage is localStorage (~5MB limit) — scripts only, no video storage
- No cloud sync or sharing
- No direct social upload — download → upload manually
- Chrome on Android records in WebM (not MP4 natively) — accepted by Instagram and TikTok
- WPM calibration uses a manual stopwatch, not microphone input

---

## Roadmap

- [ ] Speech-recognition-based WPM calibration
- [ ] Automatic script pacing suggestions (pauses, emphasis markers)
- [ ] Cue card mode (text in blocks instead of continuous scroll)
- [ ] Countdown length setting
- [ ] IndexedDB for longer scripts
- [ ] Script sharing via URL (base64 encoded)
- [ ] Virtual studio background

---

## License

MIT — do whatever you want with it. A mention or a link back is always appreciated but never required.

```
MIT License

Copyright (c) 2025 Leo Magazzu

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
