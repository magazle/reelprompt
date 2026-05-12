import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = "https://awwopzxsdtdivbqgkhvv.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const KOFI_TOKEN = process.env.KOFI_VERIFICATION_TOKEN!;
const RESEND_API_KEY = process.env.RESEND_API_KEY!;

// Generates a readable unique code, e.g. REELPRO-A3F7-9K2M
function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I
  const segment = (n: number) =>
    Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `REELPRO-${segment(4)}-${segment(4)}`;
}

async function insertCode(code: string, note: string): Promise<boolean> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/pro_codes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_SERVICE_KEY,
      "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
      "Prefer": "return=minimal",
    },
    body: JSON.stringify({ code, used: false, note }),
  });
  return res.ok;
}

async function sendCodeEmail(to: string, code: string): Promise<boolean> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "ReelPrompt <noreply@leomagazzu.it>",
      to,
      subject: "Il tuo codice Pro ReelPrompt ✦",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #1a1a1a;">
          <h2 style="margin: 0 0 8px;">Benvenuto in ReelPrompt Pro ✦</h2>
          <p style="color: #555; margin: 0 0 24px;">Grazie per il tuo acquisto. Ecco il tuo codice di attivazione:</p>
          <div style="background: #f5f5f5; border-radius: 12px; padding: 20px 24px; text-align: center; margin-bottom: 24px;">
            <span style="font-size: 24px; font-weight: 700; letter-spacing: 3px; font-family: monospace;">${code}</span>
          </div>
          <p style="color: #555; margin: 0 0 8px;"><strong>Come attivare Pro:</strong></p>
          <ol style="color: #555; padding-left: 20px; margin: 0 0 24px;">
            <li>Apri <a href="https://reelprompt.xyz" style="color: #1a1a1a;">reelprompt.xyz</a></li>
            <li>Clicca su <strong>Go Pro</strong></li>
            <li>Inserisci il codice qui sopra</li>
            <li>Inserisci la tua email e clicca il magic link</li>
          </ol>
          <p style="color: #999; font-size: 13px; margin: 0;">Problemi? Rispondi a questa email.</p>
        </div>
      `,
    }),
  });
  return res.ok;
}

export async function POST(req: NextRequest) {
  try {
    // Ko-fi sends data as form-data with a single "data" field containing JSON
    const formData = await req.formData();
    const raw = formData.get("data");
    if (!raw || typeof raw !== "string") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const payload = JSON.parse(raw);

    // Verify the token matches — reject anything that doesn't come from Ko-fi
    if (payload.verification_token !== KOFI_TOKEN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only process Shop Order payments (not donations or subscriptions)
    if (payload.type !== "Shop Order") {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const email: string = payload.email;
    const txId: string = payload.kofi_transaction_id;

    if (!email) {
      return NextResponse.json({ error: "No email in payload" }, { status: 400 });
    }

    // Generate a unique code (retry once on collision, extremely unlikely)
    let code = generateCode();
    const ok = await insertCode(code, `kofi:${txId}`);
    if (!ok) {
      code = generateCode();
      const retry = await insertCode(code, `kofi:${txId}-retry`);
      if (!retry) throw new Error("Failed to insert code after retry");
    }

    await sendCodeEmail(email, code);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[kofi-webhook] error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
