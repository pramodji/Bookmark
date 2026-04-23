import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import crypto from "crypto";

function hash(pw: string) {
  return crypto.createHash("sha256").update(pw).digest("hex");
}

function getClientInfo(req: Request) {
  const h = req.headers;
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  const ua = h.get("user-agent") || "unknown";
  return { ip, ua };
}

export async function POST(req: Request) {
  const { username, password } = await req.json();
  const user = await prisma.user.findUnique({ where: { username } });
  if (user && user.password === hash(password)) {
    if (!user.approved) {
      const approvedCount = await prisma.user.count({ where: { approved: true } });
      if (approvedCount === 0) {
        await prisma.user.update({ where: { id: user.id }, data: { approved: true, role: "admin" } });
        user.approved = true;
        user.role = "admin";
      } else {
        return NextResponse.json({ success: false, pending: true, message: "Account pending admin approval" }, { status: 403 });
      }
    }
    if (user.role !== "admin") {
      const maint = await prisma.setting.findUnique({ where: { key: "maintenanceMode" } });
      if (maint?.value === "true") {
        return NextResponse.json({ success: false, maintenance: true, message: "Site is under maintenance" }, { status: 503 });
      }
    }
    const { ip, ua } = getClientInfo(req);
    const session = await prisma.session.create({
      data: { username: user.username, ip, userAgent: ua, loginAt: new Date().toISOString(), lastSeen: new Date().toISOString() },
    });
    return NextResponse.json({ success: true, username: user.username, role: user.role, firstName: (user as any).firstName || "", lastName: (user as any).lastName || "", sessionId: session.id });
  }
  return NextResponse.json({ success: false, message: "Invalid credentials" }, { status: 401 });
}

// Logout — DELETE { sessionId }
export async function DELETE(req: Request) {
  const body = await req.json().catch(() => ({}));
  if (body.sessionId) {
    try { await prisma.session.delete({ where: { id: body.sessionId } }); } catch {}
  }
  return NextResponse.json({ ok: true });
}
