import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const STALE_MS = 2 * 60 * 1000; // 2 minutes without heartbeat = stale

export async function GET() {
  // Clean stale sessions
  const cutoff = new Date(Date.now() - STALE_MS).toISOString();
  await prisma.session.deleteMany({ where: { lastSeen: { lt: cutoff } } });
  const sessions = await prisma.session.findMany({ orderBy: { loginAt: "desc" } });
  return NextResponse.json(sessions);
}

// Heartbeat — POST { sessionId }
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  if (!body.sessionId) return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
  try {
    await prisma.session.update({ where: { id: body.sessionId }, data: { lastSeen: new Date().toISOString() } });
  } catch { /* session already deleted */ }
  return NextResponse.json({ ok: true });
}

// Kick session — DELETE { id }
export async function DELETE(req: Request) {
  const body = await req.json().catch(() => ({}));
  if (!body.id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  try { await prisma.session.delete({ where: { id: body.id } }); } catch {}
  return NextResponse.json({ ok: true });
}
