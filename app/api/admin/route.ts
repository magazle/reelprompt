import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = "https://awwopzxsdtdivbqgkhvv.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase());

// ── Auth helper ────────────────────────────────────────────────────────────────
async function getCallerEmail(req: NextRequest): Promise<string | null> {
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": `Bearer ${token}`,
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.email?.toLowerCase() ?? null;
  } catch {
    return null;
  }
}

function isAdmin(email: string | null): boolean {
  return email != null && ADMIN_EMAILS.includes(email);
}

// ── Supabase helpers ────────────────────────────────────────────────────────────
async function sbFetch(path: string, opts: RequestInit = {}) {
  return fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_SERVICE_KEY,
      "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
      ...(opts.headers as Record<string, string> | undefined),
    },
  });
}

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const segment = (n: number) =>
    Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `REELPRO-${segment(4)}-${segment(4)}`;
}

// ── GET — dashboard data ────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const email = await getCallerEmail(req);
  if (!isAdmin(email)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [usersRes, codesRes] = await Promise.all([
    sbFetch("/pro_users?select=email,activated_at,note&order=activated_at.desc"),
    sbFetch("/pro_codes?select=code,used,used_at,note&order=used_at.desc.nullslast"),
  ]);

  const [users, codes] = await Promise.all([usersRes.json(), codesRes.json()]);

  return NextResponse.json({ users, codes });
}

// ── POST — actions ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const email = await getCallerEmail(req);
  if (!isAdmin(email)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { action } = body;

  // Generate a new Pro code
  if (action === "generate_code") {
    const note = (body.note as string | undefined) ?? `admin:${email}`;
    const code = generateCode();
    const res = await sbFetch("/pro_codes", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({ code, used: false, note }),
    });
    if (!res.ok) return NextResponse.json({ error: "Insert failed" }, { status: 500 });
    const data = await res.json();
    return NextResponse.json({ code: data[0] });
  }

  // Add an email directly to pro_users
  if (action === "add_user") {
    const target = (body.email as string | undefined)?.trim().toLowerCase();
    if (!target) return NextResponse.json({ error: "No email" }, { status: 400 });
    const res = await sbFetch("/pro_users", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({ email: target, note: `admin:${email}` }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      // 23505 = unique violation (already exists)
      if (err?.code === "23505") return NextResponse.json({ error: "already_exists" }, { status: 409 });
      return NextResponse.json({ error: "Insert failed" }, { status: 500 });
    }
    const data = await res.json();
    return NextResponse.json({ user: data[0] });
  }

  // Remove an email from pro_users
  if (action === "remove_user") {
    const target = (body.email as string | undefined)?.trim().toLowerCase();
    if (!target) return NextResponse.json({ error: "No email" }, { status: 400 });
    const res = await sbFetch(`/pro_users?email=eq.${encodeURIComponent(target)}`, {
      method: "DELETE",
      headers: { Prefer: "return=minimal" },
    });
    if (!res.ok) return NextResponse.json({ error: "Delete failed" }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
