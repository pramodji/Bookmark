import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
  const userId = getUserId();
  return NextResponse.json(await prisma.stickyNote.findMany({ where: { userId }, orderBy: { position: "asc" } }));
}

export async function POST(request: Request) {
  const userId = getUserId();
  const body = await request.json();
  const now = new Date().toISOString();
  const note = await prisma.stickyNote.create({
    data: { ...body, userId, id: body.id || Date.now().toString(), createdAt: now, updatedAt: now },
  });
  return NextResponse.json(note);
}

export async function PUT(request: Request) {
  const userId = getUserId();
  const body = await request.json().catch(() => ({}));
  const { id, ...data } = body;
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
  const now = new Date().toISOString();
  const note = await prisma.stickyNote.upsert({
    where: { id },
    update: { ...data, userId, updatedAt: now },
    create: { ...data, id, userId, createdAt: now, updatedAt: now },
  });
  return NextResponse.json(note);
}

export async function DELETE(request: Request) {
  const userId = getUserId();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id') || (await request.json().catch(() => ({}))).id;
  await prisma.stickyNote.deleteMany({ where: { id, userId } });
  return NextResponse.json({ success: true });
}
