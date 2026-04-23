import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const userId = getUserId();
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").toLowerCase().trim();
  if (!q) return NextResponse.json([]);

  const [bookmarks, tasks, notes, reminders] = await Promise.all([
    prisma.bookmark.findMany({ where: { userId } }),
    prisma.task.findMany({ where: { userId } }),
    prisma.note.findMany({ where: { userId } }),
    prisma.reminder.findMany({ where: { userId } }),
  ]);

  const results: any[] = [];

  bookmarks.forEach(b => {
    if ([b.title, b.url, b.description || "", b.tags || ""].some(f => f.toLowerCase().includes(q))) {
      results.push({ type: "bookmark", id: b.id, title: b.title, subtitle: b.url, icon: b.icon, url: `/bookmarks` });
    }
  });

  tasks.forEach(t => {
    if ([t.title, t.description || "", t.tags || ""].some(f => f.toLowerCase().includes(q))) {
      results.push({ type: "task", id: t.id, title: t.title, subtitle: t.completed ? "✅ Completed" : `${t.priority} priority`, url: `/tasks?task=${t.id}` });
    }
  });

  notes.forEach(n => {
    const plain = (n.content || "").replace(/<[^>]*>/g, "");
    if ([n.title, plain, n.tags || "", n.category || ""].some(f => f.toLowerCase().includes(q))) {
      results.push({ type: "note", id: n.id, title: n.title, subtitle: plain.slice(0, 80), url: `/notes?note=${n.id}` });
    }
  });

  reminders.forEach(r => {
    if ([r.title, r.description || ""].some(f => f.toLowerCase().includes(q))) {
      results.push({ type: "reminder", id: r.id, title: r.title, subtitle: new Date(r.remindAt).toLocaleString(), url: `/reminders` });
    }
  });

  return NextResponse.json(results.slice(0, 20));
}
