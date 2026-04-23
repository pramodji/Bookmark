import { mockPrisma, mockRequest, resetMocks, setUserId } from "./setup";
import { GET, POST, DELETE, PATCH, PUT } from "@/app/api/bookmarks/route";

beforeEach(() => {
  resetMocks();
  setUserId("user1");
});

describe("GET /api/bookmarks", () => {
  it("returns bookmarks for current user", async () => {
    const bookmarks = [{ id: "1", title: "Test", userId: "user1" }];
    mockPrisma.bookmark.findMany.mockResolvedValue(bookmarks);

    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(bookmarks);
    expect(mockPrisma.bookmark.findMany).toHaveBeenCalledWith({
      where: { userId: "user1" },
      orderBy: { position: "asc" },
    });
  });
});

describe("POST /api/bookmarks", () => {
  it("creates a bookmark with userId", async () => {
    const input = { title: "New", url: "https://example.com", group: "General" };
    mockPrisma.bookmark.create.mockResolvedValue({ id: "123", ...input, userId: "user1" });

    const res = await POST(mockRequest("/api/bookmarks", {
      method: "POST",
      body: JSON.stringify(input),
    }));
    expect(res.status).toBe(200);
    const createCall = mockPrisma.bookmark.create.mock.calls[0][0].data;
    expect(createCall.userId).toBe("user1");
    expect(createCall.title).toBe("New");
  });
});

describe("DELETE /api/bookmarks", () => {
  it("deletes single bookmark by query param", async () => {
    mockPrisma.bookmark.deleteMany.mockResolvedValue({ count: 1 });
    const res = await DELETE(mockRequest("/api/bookmarks?id=abc", { method: "DELETE" }));
    expect(res.status).toBe(200);
    expect(mockPrisma.bookmark.deleteMany).toHaveBeenCalledWith({
      where: { id: "abc", userId: "user1" },
    });
  });

  it("bulk deletes bookmarks by ids array", async () => {
    mockPrisma.bookmark.deleteMany.mockResolvedValue({ count: 3 });
    const res = await DELETE(mockRequest("/api/bookmarks", {
      method: "DELETE",
      body: JSON.stringify({ ids: ["a", "b", "c"] }),
    }));
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.count).toBe(3);
    expect(mockPrisma.bookmark.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ["a", "b", "c"] }, userId: "user1" },
    });
  });

  it("returns 400 when no id or ids provided", async () => {
    const res = await DELETE(mockRequest("/api/bookmarks", {
      method: "DELETE",
      body: JSON.stringify({}),
    }));
    expect(res.status).toBe(400);
  });
});

describe("PATCH /api/bookmarks (increment visits)", () => {
  it("increments visit count", async () => {
    mockPrisma.bookmark.updateMany.mockResolvedValue({ count: 1 });
    const res = await PATCH(mockRequest("/api/bookmarks", {
      method: "PATCH",
      body: JSON.stringify({ id: "bk1" }),
    }));
    expect(res.status).toBe(200);
    expect(mockPrisma.bookmark.updateMany).toHaveBeenCalledWith({
      where: { id: "bk1", userId: "user1" },
      data: { visits: { increment: 1 }, updatedAt: expect.any(String) },
    });
  });
});

describe("PUT /api/bookmarks", () => {
  it("updates single bookmark", async () => {
    const body = { id: "bk1", title: "Updated" };
    mockPrisma.bookmark.update.mockResolvedValue({ ...body, userId: "user1" });

    const res = await PUT(mockRequest("/api/bookmarks", {
      method: "PUT",
      body: JSON.stringify(body),
    }));
    expect(res.status).toBe(200);
    expect(mockPrisma.bookmark.update).toHaveBeenCalledWith({
      where: { id: "bk1" },
      data: expect.objectContaining({ title: "Updated", userId: "user1" }),
    });
  });

  it("bulk updates bookmarks via transaction", async () => {
    const items = [
      { id: "1", position: 0 },
      { id: "2", position: 1 },
    ];
    mockPrisma.$transaction.mockResolvedValue([{}, {}]);

    const res = await PUT(mockRequest("/api/bookmarks", {
      method: "PUT",
      body: JSON.stringify(items),
    }));
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.count).toBe(2);
    expect(mockPrisma.$transaction).toHaveBeenCalled();
  });
});
