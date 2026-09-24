import { NextRequest, NextResponse } from "next/server";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function POST(req: NextRequest) {
  try {
    const { message, userEmail } = await req.json();

    if (!message?.trim()) {
      return NextResponse.json({ error: "No message" }, { status: 400 });
    }

    const safeMessage = escapeHtml(message.trim()).replace(/\n/g, "<br>");
    const safeEmail   = escapeHtml(userEmail ?? "unknown");

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "noreply@leomagazzu.it",
        to: "noreply@leomagazzu.it",
        subject: `ReelPrompt — message from ${safeEmail}`,
        html: `
          <p><strong>From:</strong> ${safeEmail}</p>
          <p><strong>Message:</strong></p>
          <p>${safeMessage}</p>
        `,
      }),
    });

    if (!res.ok) throw new Error("Resend error");

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}
