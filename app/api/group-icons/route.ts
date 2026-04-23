import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
  const userId = getUserId();
  const row = await prisma.userSetting.findUnique({ where: { userId_key: { userId, key: "groupIcons" } } });
  return NextResponse.json(row ? JSON.parse(row.value) : {});
}

export async function PUT(request: Request) {
  const userId = getUserId();
  const body = await request.json();
  const val = JSON.stringify(body);
  await prisma.userSetting.upsert({
    where: { userId_key: { userId, key: "groupIcons" } },
    update: { value: val },
    create: { userId, key: "groupIcons", value: val },
  });
  return NextResponse.json(body);
}
