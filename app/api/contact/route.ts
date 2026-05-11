import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { message, userEmail } = await req.json();

    if (!message?.trim()) {
      return NextResponse.json({ error: "No message" }, { status: 400 });
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "noreply@leomagazzu.it",
        to: "noreply@leomagazzu.it",
        subject: `ReelPrompt — message from ${userEmail}`,
        html: `
          <p><strong>From:</strong> ${userEmail}</p>
          <p><strong>Message:</strong></p>
          <p>${message.replace(/\n/g, "<br>")}</p>
        `,
      }),
    });

    if (!res.ok) throw new Error("Resend error");

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}
