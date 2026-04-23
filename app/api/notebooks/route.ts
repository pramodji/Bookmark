import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = getUserId();
  const [notebooks, sections, pages] = await Promise.all([
    prisma.notebook.findMany({ where: { userId }, orderBy: { position: "asc" } }),
    prisma.notebookSection.findMany({ where: { userId }, orderBy: { position: "asc" } }),
    prisma.notebookPage.findMany({ where: { userId }, orderBy: { position: "asc" } }),
  ]);
  return NextResponse.json({ notebooks, sections, pages });
}

export async function POST(request: Request) {
  const userId = getUserId();
  const body = await request.json();
  const now = new Date().toISOString();
  const { type, ...data } = body;

  if (type === "notebook") {
    const notebook = await prisma.notebook.create({
      data: { id: data.id || Date.now().toString(), userId, name: data.name || "New Notebook", color: data.color || "#3b82f6", position: data.position ?? 0, createdAt: now, updatedAt: now },
    });
    return NextResponse.json(notebook);
  }
  if (type === "section") {
    const section = await prisma.notebookSection.create({
      data: { id: data.id || Date.now().toString(), userId, notebookId: data.notebookId, name: data.name || "New Section", position: data.position ?? 0, createdAt: now, updatedAt: now },
    });
    return NextResponse.json(section);
  }
  if (type === "page") {
    const page = await prisma.notebookPage.create({
      data: { id: data.id || Date.now().toString(), userId, sectionId: data.sectionId, notebookId: data.notebookId, parentId: data.parentId || "", title: data.title || "Untitled Page", content: data.content || "", icon: data.icon || "", position: data.position ?? 0, depth: data.depth ?? 0, createdAt: now, updatedAt: now },
    });
    return NextResponse.json(page);
  }
  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}

export async function PUT(request: Request) {
  const userId = getUserId();
  const { type, id, ...data } = await request.json();
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
  const now = new Date().toISOString();

  if (type === "notebook") {
    const notebook = await prisma.notebook.update({ where: { id }, data: { ...data, userId, updatedAt: now } });
    return NextResponse.json(notebook);
  }
  if (type === "section") {
    const section = await prisma.notebookSection.update({ where: { id }, data: { ...data, userId, updatedAt: now } });
    return NextResponse.json(section);
  }
  if (type === "page") {
    const page = await prisma.notebookPage.update({ where: { id }, data: { ...data, userId, updatedAt: now } });
    return NextResponse.json(page);
  }
  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}

export async function DELETE(request: Request) {
  const userId = getUserId();
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const id = searchParams.get("id");
  if (!id || !type) return NextResponse.json({ error: "ID and type required" }, { status: 400 });

  if (type === "notebook") {
    await prisma.notebookPage.deleteMany({ where: { notebookId: id, userId } });
    await prisma.notebookSection.deleteMany({ where: { notebookId: id, userId } });
    await prisma.notebook.deleteMany({ where: { id, userId } });
  } else if (type === "section") {
    await prisma.notebookPage.deleteMany({ where: { sectionId: id, userId } });
    await prisma.notebookSection.deleteMany({ where: { id, userId } });
  } else if (type === "page") {
    // Delete subpages recursively
    await deletePageAndChildren(id, userId);
  }
  return NextResponse.json({ success: true });
}

async function deletePageAndChildren(pageId: string, userId: string) {
  const children = await prisma.notebookPage.findMany({ where: { parentId: pageId, userId } });
  for (const child of children) {
    await deletePageAndChildren(child.id, userId);
  }
  await prisma.notebookPage.deleteMany({ where: { id: pageId, userId } });
}
