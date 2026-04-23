import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: Request) {
  // Admin-only check
  const callerId = getUserId();
  const caller = await prisma.user.findFirst({ where: { username: callerId } });
  if (!caller || caller.role !== "admin") return NextResponse.json({ error: "Admin access required" }, { status: 403 });

  const { sourceUserId, targetUserId } = await req.json();
  if (!sourceUserId || !targetUserId) return NextResponse.json({ error: "sourceUserId and targetUserId required" }, { status: 400 });
  if (sourceUserId === targetUserId) return NextResponse.json({ error: "Source and target must differ" }, { status: 400 });

  const now = new Date().toISOString();
  const uid = () => crypto.randomUUID();

  // Copy bookmarks
  const bookmarks = await prisma.bookmark.findMany({ where: { userId: sourceUserId } });
  for (const b of bookmarks) {
    await prisma.bookmark.create({ data: { ...b, id: uid(), userId: targetUserId, createdAt: now, updatedAt: now } });
  }

  // Copy groups
  const groups = await prisma.group.findMany({ where: { userId: sourceUserId } });
  for (const g of groups) {
    const exists = await prisma.group.findUnique({ where: { name_userId: { name: g.name, userId: targetUserId } } });
    if (!exists) await prisma.group.create({ data: { userId: targetUserId, name: g.name, position: g.position } });
  }

  // Copy subgroups
  const subgroups = await prisma.subgroup.findMany({ where: { userId: sourceUserId } });
  for (const s of subgroups) {
    const exists = await prisma.subgroup.findUnique({ where: { name_group_userId: { name: s.name, group: s.group, userId: targetUserId } } });
    if (!exists) await prisma.subgroup.create({ data: { ...s, id: uid(), userId: targetUserId, createdAt: now, updatedAt: now } });
  }

  // Copy notes
  const notes = await prisma.note.findMany({ where: { userId: sourceUserId } });
  for (const n of notes) {
    await prisma.note.create({ data: { ...n, id: uid(), userId: targetUserId, createdAt: now, updatedAt: now } });
  }

  // Copy tasks
  const tasks = await prisma.task.findMany({ where: { userId: sourceUserId } });
  for (const t of tasks) {
    await prisma.task.create({ data: { ...t, id: uid(), userId: targetUserId, createdAt: now, updatedAt: now } });
  }

  // Copy sticky notes
  const stickies = await prisma.stickyNote.findMany({ where: { userId: sourceUserId } });
  for (const s of stickies) {
    await prisma.stickyNote.create({ data: { ...s, id: uid(), userId: targetUserId, createdAt: now, updatedAt: now } });
  }

  // Copy widgets
  const widgets = await prisma.widget.findMany({ where: { userId: sourceUserId } });
  for (const w of widgets) {
    await prisma.widget.create({ data: { ...w, id: uid(), userId: targetUserId, createdAt: now, updatedAt: now } });
  }

  // Copy reminders
  const reminders = await prisma.reminder.findMany({ where: { userId: sourceUserId } });
  for (const r of reminders) {
    await prisma.reminder.create({ data: { ...r, id: uid(), userId: targetUserId, createdAt: now, updatedAt: now } });
  }

  // Copy note templates
  const templates = await prisma.noteTemplate.findMany({ where: { userId: sourceUserId } });
  for (const t of templates) {
    await prisma.noteTemplate.create({ data: { ...t, id: uid(), userId: targetUserId, createdAt: now } });
  }

  // Copy icons
  const icons = await prisma.icon.findMany({ where: { userId: sourceUserId } });
  for (const i of icons) {
    const exists = await prisma.icon.findUnique({ where: { userId_data: { userId: targetUserId, data: i.data } } });
    if (!exists) await prisma.icon.create({ data: { userId: targetUserId, data: i.data } });
  }

  // Copy user settings
  const settings = await prisma.userSetting.findMany({ where: { userId: sourceUserId } });
  for (const s of settings) {
    await prisma.userSetting.upsert({
      where: { userId_key: { userId: targetUserId, key: s.key } },
      update: { value: s.value },
      create: { userId: targetUserId, key: s.key, value: s.value },
    });
  }

  return NextResponse.json({ success: true, copied: { bookmarks: bookmarks.length, groups: groups.length, subgroups: subgroups.length, notes: notes.length, tasks: tasks.length, stickyNotes: stickies.length, widgets: widgets.length, reminders: reminders.length, templates: templates.length, icons: icons.length, settings: settings.length } });
}
