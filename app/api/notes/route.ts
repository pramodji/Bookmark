import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
  const userId = getUserId();
  return NextResponse.json(await prisma.note.findMany({ where: { userId } }));
}

export async function POST(request: Request) {
  const userId = getUserId();
  const body = await request.json();
  const now = new Date().toISOString();
  const note = await prisma.note.create({
    data: { ...body, userId, id: body.id || Date.now().toString(), createdAt: now, updatedAt: now },
  });
  return NextResponse.json(note);
}

export async function DELETE(request: Request) {
  const userId = getUserId();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
  await prisma.note.deleteMany({ where: { id, userId } });
  return NextResponse.json({ success: true });
}

export async function PUT(request: Request) {
  const userId = getUserId();
  const { id, silent, ...data } = await request.json();
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
  const note = await prisma.note.update({
    where: { id },
    data: { ...data, userId, updatedAt: new Date().toISOString() },
  });
  return NextResponse.json(note);
}
