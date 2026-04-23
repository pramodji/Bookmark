import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
  const userId = getUserId();
  const groups = await prisma.group.findMany({ where: { userId }, orderBy: { position: "asc" } });
  if (groups.length === 0) return NextResponse.json(["General"]);
  return NextResponse.json(groups.map((g) => g.name));
}

export async function POST(request: Request) {
  const userId = getUserId();
  const body = await request.json();
  const names: string[] = body.groups || ["General"];
  await prisma.group.deleteMany({ where: { userId } });
  await prisma.group.createMany({
    data: names.map((name, position) => ({ userId, name, position })),
  });
  return NextResponse.json(names);
}

export async function PUT(request: Request) {
  const userId = getUserId();
  const body = await request.json();
  const names: string[] = body.groups || ["General"];
  await prisma.group.deleteMany({ where: { userId } });
  await prisma.group.createMany({
    data: names.map((name, position) => ({ userId, name, position })),
  });
  return NextResponse.json(names);
}
