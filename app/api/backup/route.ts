import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

async function getBackupDir(userId: string): Promise<string> {
  const globalSettings = await prisma.setting.findMany();
  const settingsMap = Object.fromEntries(globalSettings.map((s: any) => [s.key, s.value]));
  const savedPath = settingsMap.backupPath?.replace(/^"|"$/g, '');
  const defaultPath = path.join(process.cwd(), 'backups');
  const basePath = (savedPath && savedPath !== '/app/data/backups') ? path.resolve(savedPath) : defaultPath;
  return path.join(basePath, userId);
}

async function migrateOldBackups() {
  const globalSettings = await prisma.setting.findMany();
  const settingsMap = Object.fromEntries(globalSettings.map((s: any) => [s.key, s.value]));
  const savedPath = settingsMap.backupPath?.replace(/^"|"$/g, '');
  const defaultPath = path.join(process.cwd(), 'backups');
  const basePath = (savedPath && savedPath !== '/app/data/backups') ? path.resolve(savedPath) : defaultPath;
  if (!fs.existsSync(basePath)) return;
  const files = fs.readdirSync(basePath).filter(f => f.startsWith('go-home-backup-') && f.endsWith('.json'));
  if (files.length === 0) return;
  const adminDir = path.join(basePath, 'admin');
  fs.mkdirSync(adminDir, { recursive: true });
  for (const f of files) {
    const src = path.join(basePath, f);
    const dest = path.join(adminDir, f);
    if (!fs.existsSync(dest)) fs.renameSync(src, dest);
    else fs.unlinkSync(src);
  }
}

export async function GET(request: Request) {
  const userId = getUserId();
  const { searchParams } = new URL(request.url);

  if (searchParams.get('scheduled') === '1') {
    await migrateOldBackups();
    const backupPath = await getBackupDir(userId);
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    const isManual = searchParams.get('force') === '1';

    const lastKey = `lastAutoBackup_${userId}`;
    if (!isManual) {
      const last = await prisma.setting.findUnique({ where: { key: lastKey } });
      if (last?.value === today) return NextResponse.json({ skipped: true, reason: 'already backed up today' });
    }

    const [bookmarks, groups, subgroups, tasks, notes, stickyNotes, widgets, icons, userSettings, reminders] = await Promise.all([
      prisma.bookmark.findMany({ where: { userId } }),
      prisma.group.findMany({ where: { userId } }),
      prisma.subgroup.findMany({ where: { userId } }),
      prisma.task.findMany({ where: { userId } }),
      prisma.note.findMany({ where: { userId } }),
      prisma.stickyNote.findMany({ where: { userId } }),
      prisma.widget.findMany({ where: { userId } }),
      prisma.icon.findMany({ where: { userId } }),
      prisma.userSetting.findMany({ where: { userId } }),
      prisma.reminder.findMany({ where: { userId } }),
    ]);
    const globalSettings = await prisma.setting.findMany();

    const data = { bookmarks, groups, subgroups, tasks, notes, stickyNotes, widgets, settings: globalSettings, icons, userSettings, reminders, exportedAt: now.toLocaleString() };
    const timestamp = isManual
      ? `${today}_${String(now.getHours()).padStart(2,'0')}-${String(now.getMinutes()).padStart(2,'0')}-${String(now.getSeconds()).padStart(2,'0')}`
      : today;
    const filename = `go-home-backup-${timestamp}.json`;
    const fullPath = path.join(backupPath, filename);

    try {
      fs.mkdirSync(backupPath, { recursive: true });
      fs.writeFileSync(fullPath, JSON.stringify(data, null, 2));
      const files = fs.readdirSync(backupPath).filter(f => f.startsWith('go-home-backup-') && f.endsWith('.json')).sort();
      if (files.length > 30) files.slice(0, files.length - 30).forEach(f => fs.unlinkSync(path.join(backupPath, f)));
      if (!isManual) await prisma.setting.upsert({ where: { key: lastKey }, update: { value: today }, create: { key: lastKey, value: today } });
      return NextResponse.json({ success: true, file: fullPath });
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }

  // Plain GET — export current user's data
  const [bookmarks, groups, subgroups, tasks, notes, stickyNotes, widgets, icons, userSettings, reminders] = await Promise.all([
    prisma.bookmark.findMany({ where: { userId } }),
    prisma.group.findMany({ where: { userId } }),
    prisma.subgroup.findMany({ where: { userId } }),
    prisma.task.findMany({ where: { userId } }),
    prisma.note.findMany({ where: { userId } }),
    prisma.stickyNote.findMany({ where: { userId } }),
    prisma.widget.findMany({ where: { userId } }),
    prisma.icon.findMany({ where: { userId } }),
    prisma.userSetting.findMany({ where: { userId } }),
    prisma.reminder.findMany({ where: { userId } }),
  ]);
  const globalSettings = await prisma.setting.findMany();
  return NextResponse.json({ bookmarks, groups, subgroups, tasks, notes, stickyNotes, widgets, settings: globalSettings, icons, userSettings, reminders, exportedAt: new Date().toLocaleString() });
}

export async function POST(request: Request) {
  const userId = getUserId();
  const data = await request.json();

  // Restore with current userId — always override backup's userId to current user
  const withUser = (item: any) => ({ ...item, userId });

  // Safe upsert: only update records owned by current user, otherwise create with new ID
  const safeUpsert = async (model: any, item: any, extra?: Record<string, any>) => {
    const r = { ...withUser(item), ...extra };
    const existing = await model.findUnique({ where: { id: r.id } });
    if (!existing) {
      try { await model.create({ data: r }); } catch { /* duplicate */ }
    } else if (existing.userId === userId) {
      await model.update({ where: { id: r.id }, data: r });
    } else {
      // Record belongs to another user — create copy with new ID
      const newId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      try { await model.create({ data: { ...r, id: newId } }); } catch { /* duplicate */ }
    }
  };

  // Merge groups: keep existing, add new ones from backup
  if (data.groups?.length) {
    const existingGroups = await prisma.group.findMany({ where: { userId } });
    const existingNames = new Set(existingGroups.map((g: any) => g.name));
    for (const g of data.groups) {
      const r = withUser(g);
      if (!existingNames.has(r.name)) {
        const existing = await prisma.group.findUnique({ where: { id: r.id } });
        if (!existing) {
          try { await prisma.group.create({ data: r }); } catch { /* duplicate */ }
        } else if (existing.userId !== userId) {
          try { await prisma.group.create({ data: { ...r, id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}` } }); } catch {}
        }
      }
    }
  }

  // Merge all data models — safe upsert prevents cross-user overwrites
  if (data.bookmarks?.length) for (const b of data.bookmarks) await safeUpsert(prisma.bookmark, b);
  if (data.subgroups?.length) for (const s of data.subgroups) await safeUpsert(prisma.subgroup, s);
  if (data.tasks?.length) for (const t of data.tasks) await safeUpsert(prisma.task, t);
  if (data.notes?.length) for (const n of data.notes) await safeUpsert(prisma.note, n);
  if (data.stickyNotes?.length) for (const n of data.stickyNotes) await safeUpsert(prisma.stickyNote, n, { blurred: n.blurred ?? false });
  if (data.widgets?.length) for (const w of data.widgets) await safeUpsert(prisma.widget, w);
  if (data.settings?.length) {
    const skipKeys = new Set(['maintenanceMode', 'lastAutoBackup']);
    for (const s of data.settings) {
      if (skipKeys.has(s.key)) continue;
      await prisma.setting.upsert({ where: { key: s.key }, update: s, create: s });
    }
  }
  if (data.userSettings?.length) { for (const s of data.userSettings) { await prisma.userSetting.upsert({ where: { userId_key: { userId, key: s.key } }, update: { value: s.value }, create: { userId, key: s.key, value: s.value } }); } }
  if (data.icons?.length) for (const i of data.icons) await safeUpsert(prisma.icon, i);
  if (data.reminders?.length) for (const r of data.reminders) await safeUpsert(prisma.reminder, r);

  return NextResponse.json({ success: true });
}
