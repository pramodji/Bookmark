import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
  const userId = getUserId();
  const subgroups = await prisma.subgroup.findMany({ where: { userId }, orderBy: { position: "asc" } });
  return NextResponse.json(subgroups);
}

export async function POST(request: Request) {
  try {
    const userId = getUserId();
    const body = await request.json();
    const now = new Date().toISOString();
    const existing = await prisma.subgroup.findFirst({ where: { name: body.name, group: body.group, userId } });
    if (existing) return NextResponse.json(existing);
    const subgroup = await prisma.subgroup.create({
      data: { ...body, userId, id: body.id || Date.now().toString(), createdAt: now, updatedAt: now },
    });
    return NextResponse.json(subgroup);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const userId = getUserId();
  const body = await request.json();
  const now = new Date().toISOString();
  if (Array.isArray(body)) {
    await prisma.$transaction(
      body.map((item) =>
        prisma.subgroup.update({ where: { id: item.id }, data: { ...item, userId, updatedAt: now } })
      )
    );
    return NextResponse.json({ success: true, count: body.length });
  }
  const subgroup = await prisma.subgroup.update({ where: { id: body.id }, data: { ...body, userId, updatedAt: now } });
  return NextResponse.json(subgroup);
}

export async function DELETE(request: Request) {
  const userId = getUserId();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
  await prisma.subgroup.deleteMany({ where: { id, userId } });
  return NextResponse.json({ success: true });
}
