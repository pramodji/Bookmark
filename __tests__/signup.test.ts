import { mockPrisma, mockRequest, resetMocks } from "./setup";
import { POST } from "@/app/api/signup/route";

beforeEach(resetMocks);

describe("POST /api/signup", () => {
  it("rejects empty username", async () => {
    const res = await POST(mockRequest("/api/signup", {
      method: "POST",
      body: JSON.stringify({ username: "", password: "1234", firstName: "A", lastName: "B" }),
    }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Username and password required" });
  });

  it("rejects empty first/last name", async () => {
    const res = await POST(mockRequest("/api/signup", {
      method: "POST",
      body: JSON.stringify({ username: "testuser", password: "1234", firstName: "", lastName: "" }),
    }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "First name and last name required" });
  });

  it("rejects short username (< 3 chars)", async () => {
    const res = await POST(mockRequest("/api/signup", {
      method: "POST",
      body: JSON.stringify({ username: "ab", password: "1234", firstName: "A", lastName: "B" }),
    }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Username must be at least 3 characters" });
  });

  it("rejects short password (< 4 chars)", async () => {
    const res = await POST(mockRequest("/api/signup", {
      method: "POST",
      body: JSON.stringify({ username: "testuser", password: "123", firstName: "A", lastName: "B" }),
    }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Password must be at least 4 characters" });
  });

  it("rejects duplicate username", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: "1", username: "testuser" });
    const res = await POST(mockRequest("/api/signup", {
      method: "POST",
      body: JSON.stringify({ username: "testuser", password: "1234", firstName: "A", lastName: "B" }),
    }));
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: "Username already taken" });
  });

  it("creates first user as admin (approved)", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.count.mockResolvedValue(0);
    mockPrisma.user.create.mockResolvedValue({});

    const res = await POST(mockRequest("/api/signup", {
      method: "POST",
      body: JSON.stringify({ username: "admin1", password: "pass1234", firstName: "John", lastName: "Doe" }),
    }));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.message).toContain("Admin account created");

    const createCall = mockPrisma.user.create.mock.calls[0][0].data;
    expect(createCall.role).toBe("admin");
    expect(createCall.approved).toBe(true);
    expect(createCall.firstName).toBe("John");
    expect(createCall.lastName).toBe("Doe");
  });

  it("creates subsequent users as unapproved user role", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.count.mockResolvedValue(1);
    mockPrisma.user.create.mockResolvedValue({});

    const res = await POST(mockRequest("/api/signup", {
      method: "POST",
      body: JSON.stringify({ username: "user2", password: "pass1234", firstName: "Jane", lastName: "Doe" }),
    }));
    const json = await res.json();
    expect(json.message).toContain("Waiting for admin approval");

    const createCall = mockPrisma.user.create.mock.calls[0][0].data;
    expect(createCall.role).toBe("user");
    expect(createCall.approved).toBe(false);
  });
});
