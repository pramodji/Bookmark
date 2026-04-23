import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
  const userId = getUserId();
  const widgets = await prisma.widget.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } });
  return NextResponse.json(widgets.map(w => ({ ...w, config: JSON.parse(w.config || '{}') })));
}

export async function POST(request: Request) {
  const userId = getUserId();
  const body = await request.json();
  const now = new Date().toISOString();
  const { config, createdAt, updatedAt, ...rest } = body;
  const allowed = ['id','title','type','content','floating','collapsed','column','row','x','y','width','height','showAll','hideTitle','opacity'];
  const data = Object.fromEntries(Object.entries(rest).filter(([k]) => allowed.includes(k)));
  const widget = await prisma.widget.create({
    data: { ...data, userId, id: (data as any).id || Date.now().toString(), config: config ? JSON.stringify(config) : '{}', createdAt: now, updatedAt: now },
  });
  return NextResponse.json({ ...widget, config: JSON.parse(widget.config || '{}') });
}

export async function PUT(request: Request) {
  const userId = getUserId();
  const body = await request.json();
  const { id, config, createdAt, updatedAt, ...rest } = body;
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
  const allowed = ['title','type','content','floating','collapsed','column','row','x','y','width','height','showAll','hideTitle','noBorder','opacity'];
  const data = Object.fromEntries(Object.entries(rest).filter(([k]) => allowed.includes(k)));
  const widget = await prisma.widget.update({ where: { id }, data: { ...data, userId, ...(config !== undefined ? { config: JSON.stringify(config) } : {}), updatedAt: new Date().toISOString() } });
  return NextResponse.json({ ...widget, config: JSON.parse(widget.config || '{}') });
}

export async function DELETE(request: Request) {
  const userId = getUserId();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (id) {
    await prisma.widget.deleteMany({ where: { id, userId } });
    return NextResponse.json({ success: true });
  }
  const body = await request.json().catch(() => null);
  if (body?.ids?.length) {
    await prisma.widget.deleteMany({ where: { id: { in: body.ids }, userId } });
    return NextResponse.json({ success: true });
  }
  return NextResponse.json({ error: 'ID required' }, { status: 400 });
}
