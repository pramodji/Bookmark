import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
  const userId = getUserId();
  return NextResponse.json(await prisma.reminder.findMany({ where: { userId }, orderBy: { remindAt: 'asc' } }));
}

export async function POST(request: Request) {
  const userId = getUserId();
  const body = await request.json();
  const now = new Date().toISOString();
  const reminder = await prisma.reminder.create({
    data: { ...body, userId, id: body.id || Date.now().toString(), createdAt: now, updatedAt: now },
  });
  return NextResponse.json(reminder);
}

export async function PUT(request: Request) {
  const userId = getUserId();
  const body = await request.json();
  const now = new Date().toISOString();
  const { id, ...data } = body;
  const reminder = await prisma.reminder.update({ where: { id }, data: { ...data, userId, updatedAt: now } });
  return NextResponse.json(reminder);
}

export async function DELETE(request: Request) {
  const userId = getUserId();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
  await prisma.reminder.deleteMany({ where: { id, userId } });
  return NextResponse.json({ success: true });
}
