import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
  const userId = getUserId();
  const bookmarks = await prisma.bookmark.findMany({ where: { userId }, orderBy: { position: "asc" } });
  return NextResponse.json(bookmarks);
}

export async function POST(request: Request) {
  const userId = getUserId();
  const body = await request.json();
  const now = new Date().toISOString();
  const bookmark = await prisma.bookmark.create({
    data: { ...body, userId, id: body.id || Date.now().toString(), createdAt: now, updatedAt: now },
  });
  return NextResponse.json(bookmark);
}

export async function DELETE(request: Request) {
  const userId = getUserId();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (id) {
    await prisma.bookmark.deleteMany({ where: { id, userId } });
    return NextResponse.json({ success: true });
  }
  // Bulk delete: body { ids: string[] }
  try {
    const { ids } = await request.json();
    if (Array.isArray(ids) && ids.length > 0) {
      await prisma.bookmark.deleteMany({ where: { id: { in: ids }, userId } });
      return NextResponse.json({ success: true, count: ids.length });
    }
  } catch {}
  return NextResponse.json({ error: "ID or ids[] required" }, { status: 400 });
}

export async function PATCH(request: Request) {
  const userId = getUserId();
  const { id } = await request.json();
  const bookmark = await prisma.bookmark.updateMany({ where: { id, userId }, data: { visits: { increment: 1 }, updatedAt: new Date().toISOString() } });
  return NextResponse.json(bookmark);
}

export async function PUT(request: Request) {
  const userId = getUserId();
  const body = await request.json();
  const now = new Date().toISOString();
  if (Array.isArray(body)) {
    await prisma.$transaction(
      body.map((item) =>
        prisma.bookmark.update({ where: { id: item.id }, data: { ...item, userId, updatedAt: now } })
      )
    );
    return NextResponse.json({ success: true, count: body.length });
  }
  const bookmark = await prisma.bookmark.update({ where: { id: body.id }, data: { ...body, userId, updatedAt: now } });
  return NextResponse.json(bookmark);
}
