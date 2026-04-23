import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import crypto from "crypto";

function hash(pw: string) {
  return crypto.createHash("sha256").update(pw).digest("hex");
}

export async function POST(req: Request) {
  const { username, password, firstName, lastName } = await req.json();
  if (!username?.trim() || !password?.trim()) {
    return NextResponse.json({ error: "Username and password required" }, { status: 400 });
  }
  if (!firstName?.trim() || !lastName?.trim()) {
    return NextResponse.json({ error: "First name and last name required" }, { status: 400 });
  }
  if (username.trim().length < 3) {
    return NextResponse.json({ error: "Username must be at least 3 characters" }, { status: 400 });
  }
  if (password.length < 4) {
    return NextResponse.json({ error: "Password must be at least 4 characters" }, { status: 400 });
  }
  const exists = await prisma.user.findUnique({ where: { username: username.trim() } });
  if (exists) return NextResponse.json({ error: "Username already taken" }, { status: 409 });
  const userCount = await prisma.user.count();
  const isFirst = userCount === 0;
  await prisma.user.create({
    data: { id: crypto.randomUUID(), username: username.trim(), password: hash(password), firstName: firstName.trim(), lastName: lastName.trim(), role: isFirst ? "admin" : "user", approved: isFirst ? true : false, createdAt: new Date().toISOString() },
  });
  return NextResponse.json({ success: true, message: isFirst ? "Admin account created. You can log in now." : "Account created. Waiting for admin approval." });
}
