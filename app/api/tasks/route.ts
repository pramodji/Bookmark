import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
  const userId = getUserId();
  return NextResponse.json(await prisma.task.findMany({ where: { userId }, orderBy: { order: 'asc' } }));
}

export async function POST(request: Request) {
  const userId = getUserId();
  const body = await request.json();
  const now = new Date().toISOString();
  const task = await prisma.task.create({
    data: { ...body, userId, id: body.id || Date.now().toString(), createdAt: now, updatedAt: now },
  });
  return NextResponse.json(task);
}

export async function DELETE(request: Request) {
  const userId = getUserId();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
  await prisma.task.deleteMany({ where: { id, userId } });
  return NextResponse.json({ success: true });
}

export async function PUT(request: Request) {
  const userId = getUserId();
  const body = await request.json();
  const now = new Date().toISOString();
  if (Array.isArray(body)) {
    await prisma.$transaction(
      body.map(({ id, ...data }, index) =>
        prisma.task.upsert({ where: { id }, update: { ...data, userId, order: index, updatedAt: now }, create: { id, ...data, userId, order: index, createdAt: now, updatedAt: now } })
      )
    );
    return NextResponse.json(await prisma.task.findMany({ where: { userId }, orderBy: { order: 'asc' } }));
  }
  const { id, ...data } = body;
  const task = await prisma.task.update({ where: { id }, data: { ...data, userId, updatedAt: now } });

  // Recurring task: when completed, create next occurrence
  if (data.completed && task.repeat && task.dueDate) {
    const next = new Date(task.dueDate + "T00:00:00");
    if (task.repeat === "daily") next.setDate(next.getDate() + 1);
    else if (task.repeat === "weekly") next.setDate(next.getDate() + 7);
    else if (task.repeat === "monthly") next.setMonth(next.getMonth() + 1);
    const nextDate = next.toISOString().split("T")[0];
    await prisma.task.create({
      data: { id: Date.now().toString(), userId, title: task.title, description: task.description || "", priority: task.priority, dueDate: nextDate, tags: task.tags || "", subtasks: "[]", repeat: task.repeat, order: task.order, createdAt: now, updatedAt: now },
    });
  }

  return NextResponse.json(task);
}
