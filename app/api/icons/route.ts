import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
  const userId = getUserId();
  const icons = await prisma.icon.findMany({ where: { userId } });
  return NextResponse.json(icons.map((i) => i.data));
}

export async function POST(request: Request) {
  const userId = getUserId();
  const { icon } = await request.json();
  const existing = await prisma.icon.findFirst({ where: { userId, data: icon } });
  if (!existing) await prisma.icon.create({ data: { userId, data: icon } });
  const icons = await prisma.icon.findMany({ where: { userId } });
  return NextResponse.json(icons.map((i) => i.data));
}

export async function DELETE(request: Request) {
  const userId = getUserId();
  const { icon } = await request.json();
  await prisma.icon.deleteMany({ where: { userId, data: icon } });
  return NextResponse.json({ success: true });
}
