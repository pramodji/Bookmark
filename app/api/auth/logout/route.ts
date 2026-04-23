import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  if (body.sessionId) {
    try { await prisma.session.delete({ where: { id: body.sessionId } }); } catch {}
  }
  return NextResponse.json({ ok: true });
}
