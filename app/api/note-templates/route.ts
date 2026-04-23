import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
  const userId = getUserId();
  const templates = await prisma.noteTemplate.findMany({ where: { userId } });
  return NextResponse.json(templates.map(({ title, ...t }) => ({ ...t, name: title })));
}

export async function POST(request: Request) {
  const userId = getUserId();
  const { name, ...body } = await request.json();
  const template = await prisma.noteTemplate.create({
    data: { ...body, userId, title: name, id: body.id || Date.now().toString(), createdAt: new Date().toISOString(), builtIn: false },
  });
  return NextResponse.json({ ...template, name: template.title });
}

export async function PUT(request: Request) {
  const { id, name, ...data } = await request.json();
  const template = await prisma.noteTemplate.update({ where: { id }, data: { ...data, ...(name ? { title: name } : {}) } });
  return NextResponse.json({ ...template, name: template.title });
}

export async function DELETE(request: Request) {
  const userId = getUserId();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
  await prisma.noteTemplate.deleteMany({ where: { id, userId } });
  return NextResponse.json({ success: true });
}
