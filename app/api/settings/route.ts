import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

// Global keys stored in Setting table (admin-only)
const GLOBAL_KEYS = new Set(["maintenanceMode", "backupPath", "autoBackup", "lastAutoBackup"]);

export async function GET() {
  const userId = getUserId();
  // Merge global settings + user settings
  const [globalRows, userRows] = await Promise.all([
    prisma.setting.findMany(),
    prisma.userSetting.findMany({ where: { userId } }),
  ]);
  const result: Record<string, any> = {};
  for (const r of globalRows) {
    try { result[r.key] = JSON.parse(r.value); } catch { result[r.key] = r.value; }
  }
  for (const r of userRows) {
    try { result[r.key] = JSON.parse(r.value); } catch { result[r.key] = r.value; }
  }
  return NextResponse.json(result);
}

export async function PUT(request: Request) {
  const userId = getUserId();
  const body = await request.json();
  for (const [key, value] of Object.entries(body)) {
    const val = JSON.stringify(value);
    if (GLOBAL_KEYS.has(key)) {
      await prisma.setting.upsert({ where: { key }, update: { value: val }, create: { key, value: val } });
    } else {
      await prisma.userSetting.upsert({
        where: { userId_key: { userId, key } },
        update: { value: val },
        create: { userId, key, value: val },
      });
    }
  }
  return NextResponse.json({ success: true });
}
