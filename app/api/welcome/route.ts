import { NextRequest, NextResponse } from "next/server";

const RESEND_API_KEY = process.env.RESEND_API_KEY!;

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "No email" }, { status: 400 });
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "ReelPrompt <noreply@leomagazzu.it>",
        to: email.trim().toLowerCase(),
        subject: "You're now Pro ✦",
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #1a1a1a;">

            <div style="margin-bottom: 24px;">
              <span style="font-family: monospace; font-size: 11px; color: #16a34a; letter-spacing: 0.1em; text-transform: uppercase;">ReelPrompt</span>
            </div>

            <h1 style="font-size: 26px; font-weight: 800; margin: 0 0 8px; letter-spacing: -0.02em;">Welcome to Pro ✦</h1>
            <p style="color: #4a6654; margin: 0 0 28px; font-size: 15px; line-height: 1.6;">
              Your account is active. Here's what you now have access to:
            </p>

            <div style="background: #f5f5f0; border-radius: 14px; padding: 20px 24px; margin-bottom: 28px;">
              ${[
                "Unlimited scripts",
                "Teleprompter with calibrated scroll speed",
                "Camera recording — clean video, no overlay",
                "Sync across all your devices",
              ].map((f) => `
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                  <span style="color: #16a34a; font-weight: 700; font-size: 14px;">✓</span>
                  <span style="font-size: 14px; color: #1a1a1a;">${f}</span>
                </div>
              `).join("")}
            </div>

            <a href="https://reelprompt.xyz" style="display: block; text-align: center; background: #16a34a; color: white; text-decoration: none; font-weight: 700; font-size: 15px; padding: 14px 0; border-radius: 12px; margin-bottom: 28px;">
              Open ReelPrompt
            </a>

            <div style="border-top: 1px solid #e2e2db; padding-top: 20px;">
              <p style="font-size: 13px; color: #86a892; margin: 0; line-height: 1.6;">
                Questions or feedback? Reply to this email or use the contact form in the app — we read everything.<br/><br/>
                Thank you for supporting ReelPrompt. It means a lot.<br/>
                <strong style="color: #4a6654;">— Leo</strong>
              </p>
            </div>

          </div>
        `,
      }),
    });

    if (!res.ok) {
      console.error("[welcome] Resend error:", await res.text());
      return NextResponse.json({ error: "Send failed" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[welcome] error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
