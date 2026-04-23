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

export async function GET(request: Request) {
  const userId = getUserId();
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('file');
  if (!filename || filename.includes('..') || !filename.endsWith('.json')) {
    return NextResponse.json({ error: 'Invalid file' }, { status: 400 });
  }

  const basePath = await getBackupBase();
  const dirs = Array.from(new Set([
    path.join(basePath, userId),
    path.join(process.cwd(), 'backups', userId),
  ]));
  const fullPath = dirs.map(d => path.join(d, filename!)).find(p => fs.existsSync(p));
  if (!fullPath) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const content = fs.readFileSync(fullPath, 'utf-8');
  return new Response(content, {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
