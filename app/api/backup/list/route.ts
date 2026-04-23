import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = 'force-dynamic';

let cachedBackupBase: string | null = null;

async function getBackupBase(): Promise<string> {
  if (cachedBackupBase) return cachedBackupBase;
  const setting = await prisma.setting.findUnique({ where: { key: 'backupPath' } });
  const savedPath = setting?.value?.replace(/^"|"$/g, '');
  const defaultPath = path.join(process.cwd(), 'backups');
  cachedBackupBase = (savedPath && savedPath !== '/app/data/backups') ? path.resolve(savedPath) : defaultPath;
  return cachedBackupBase;
}

export async function GET() {
  const userId = getUserId();
  const basePath = await getBackupBase();
  const dirs = Array.from(new Set([
    path.join(basePath, userId),
    path.join(process.cwd(), 'backups', userId),
  ]));

  try {
    const seen = new Set<string>();
    const files: { name: string; size: number }[] = [];
    for (const dir of dirs) {
      let entries;
      try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { continue; }
      for (const e of entries) {
        if (!e.isFile() || seen.has(e.name)) continue;
        if (!e.name.startsWith('go-home-backup-') || !e.name.endsWith('.json')) continue;
        seen.add(e.name);
        try { files.push({ name: e.name, size: fs.statSync(path.join(dir, e.name)).size }); } catch { files.push({ name: e.name, size: 0 }); }
      }
    }
    files.sort((a, b) => b.name.localeCompare(a.name));
    return NextResponse.json(files);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
