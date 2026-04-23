import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import crypto from "crypto";

function hash(pw: string) {
  return crypto.createHash("sha256").update(pw).digest("hex");
}

export async function GET() {
  const users = await prisma.user.findMany({ select: { id: true, username: true, firstName: true, lastName: true, role: true, approved: true, createdAt: true } });
  return NextResponse.json(users);
}

export async function POST(req: Request) {
  const { username, password, role = "user", firstName = "", lastName = "" } = await req.json();
  if (!username || !password) return NextResponse.json({ error: "Username and password required" }, { status: 400 });
  const exists = await prisma.user.findUnique({ where: { username } });
  if (exists) return NextResponse.json({ error: "Username already exists" }, { status: 409 });
  const user = await prisma.user.create({
    data: { id: crypto.randomUUID(), username, password: hash(password), firstName, lastName, role, approved: true, createdAt: new Date().toISOString() },
    select: { id: true, username: true, firstName: true, lastName: true, role: true, approved: true, createdAt: true },
  });
  return NextResponse.json(user);
}

export async function PUT(req: Request) {
  const { id, username, password, role, approved, firstName, lastName } = await req.json();
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
  const data: any = {};
  if (username) data.username = username;
  if (password) data.password = hash(password);
  if (typeof firstName === "string") data.firstName = firstName;
  if (typeof lastName === "string") data.lastName = lastName;
  if (role) data.role = role;
  if (typeof approved === "boolean") data.approved = approved;
  const user = await prisma.user.update({ where: { id }, data, select: { id: true, username: true, firstName: true, lastName: true, role: true, approved: true, createdAt: true } });
  return NextResponse.json(user);
}

export async function DELETE(req: Request) {
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
  const user = await prisma.user.findUnique({ where: { id } });
  if (user?.username === "admin") return NextResponse.json({ error: "Cannot delete default admin" }, { status: 403 });
  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
