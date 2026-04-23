import { mockPrisma, mockRequest, resetMocks } from "./setup";
import { POST, DELETE } from "@/app/api/auth/route";
import crypto from "crypto";

const hash = (pw: string) => crypto.createHash("sha256").update(pw).digest("hex");

beforeEach(resetMocks);

describe("POST /api/auth (login)", () => {
  const loginReq = (username: string, password: string) =>
    mockRequest("/api/auth", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });

  it("rejects invalid credentials", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    const res = await POST(loginReq("nobody", "wrong"));
    expect(res.status).toBe(401);
    expect((await res.json()).success).toBe(false);
  });

  it("rejects wrong password", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "1", username: "admin", password: hash("correct"), approved: true, role: "admin",
    });
    const res = await POST(loginReq("admin", "wrong"));
    expect(res.status).toBe(401);
  });

  it("blocks unapproved user when other approved users exist", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "2", username: "user1", password: hash("pass"), approved: false, role: "user",
    });
    mockPrisma.user.count.mockResolvedValue(1); // 1 approved user exists
    const res = await POST(loginReq("user1", "pass"));
    expect(res.status).toBe(403);
    expect((await res.json()).pending).toBe(true);
  });

  it("auto-approves first user as admin when zero approved users", async () => {
    const user = { id: "1", username: "first", password: hash("pass"), approved: false, role: "user" };
    mockPrisma.user.findUnique.mockResolvedValue(user);
    mockPrisma.user.count.mockResolvedValue(0); // no approved users
    mockPrisma.user.update.mockResolvedValue({ ...user, approved: true, role: "admin" });
    mockPrisma.session.create.mockResolvedValue({ id: "sess1" });

    const res = await POST(loginReq("first", "pass"));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.role).toBe("admin");
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: "1" },
      data: { approved: true, role: "admin" },
    });
  });

  it("blocks non-admin during maintenance mode", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "2", username: "user1", password: hash("pass"), approved: true, role: "user",
    });
    mockPrisma.setting.findUnique.mockResolvedValue({ key: "maintenanceMode", value: "true" });

    const res = await POST(loginReq("user1", "pass"));
    expect(res.status).toBe(503);
    expect((await res.json()).maintenance).toBe(true);
  });

  it("allows admin login during maintenance mode", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "1", username: "admin", password: hash("pass"), approved: true, role: "admin",
    });
    mockPrisma.session.create.mockResolvedValue({ id: "sess1" });
    // maintenance check should NOT be called for admin
    const res = await POST(loginReq("admin", "pass"));
    expect(res.status).toBe(200);
    expect((await res.json()).success).toBe(true);
    expect(mockPrisma.setting.findUnique).not.toHaveBeenCalled();
  });

  it("returns user info and session on success", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "1", username: "admin", password: hash("pass"), approved: true, role: "admin", firstName: "John", lastName: "Doe",
    });
    mockPrisma.session.create.mockResolvedValue({ id: "sess-abc" });

    const res = await POST(loginReq("admin", "pass"));
    const json = await res.json();
    expect(json).toMatchObject({
      success: true,
      username: "admin",
      role: "admin",
      firstName: "John",
      lastName: "Doe",
      sessionId: "sess-abc",
    });
  });
});

describe("DELETE /api/auth (logout)", () => {
  it("deletes session when sessionId provided", async () => {
    mockPrisma.session.delete.mockResolvedValue({});
    const res = await DELETE(mockRequest("/api/auth", {
      method: "DELETE",
      body: JSON.stringify({ sessionId: "sess-123" }),
    }));
    expect(res.status).toBe(200);
    expect(mockPrisma.session.delete).toHaveBeenCalledWith({ where: { id: "sess-123" } });
  });

  it("handles empty body gracefully", async () => {
    const res = await DELETE(mockRequest("/api/auth", { method: "DELETE" }));
    expect(res.status).toBe(200);
    expect(mockPrisma.session.delete).not.toHaveBeenCalled();
  });
});
