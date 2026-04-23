// Shared mocks for API route tests

// Mock next/headers
let mockHeaders = new Map<string, string>();
jest.mock("next/headers", () => ({
  headers: () => ({
    get: (key: string) => mockHeaders.get(key) || null,
  }),
}));

// Mock Prisma client
const mockPrisma: Record<string, any> = {
  user: { findUnique: jest.fn(), count: jest.fn(), create: jest.fn(), update: jest.fn() },
  bookmark: { findMany: jest.fn(), create: jest.fn(), update: jest.fn(), updateMany: jest.fn(), deleteMany: jest.fn() },
  group: { findMany: jest.fn(), create: jest.fn(), findUnique: jest.fn() },
  subgroup: { findMany: jest.fn(), create: jest.fn(), findUnique: jest.fn() },
  task: { findMany: jest.fn(), create: jest.fn(), findUnique: jest.fn() },
  note: { findMany: jest.fn(), create: jest.fn(), findUnique: jest.fn() },
  stickyNote: { findMany: jest.fn(), create: jest.fn(), update: jest.fn(), upsert: jest.fn(), findUnique: jest.fn() },
  widget: { findMany: jest.fn(), create: jest.fn(), deleteMany: jest.fn(), findUnique: jest.fn() },
  icon: { findMany: jest.fn(), create: jest.fn(), findUnique: jest.fn() },
  setting: { findMany: jest.fn(), findUnique: jest.fn(), upsert: jest.fn() },
  userSetting: { findMany: jest.fn(), upsert: jest.fn() },
  session: { create: jest.fn(), delete: jest.fn() },
  $transaction: jest.fn(),
};

jest.mock("@/lib/db", () => ({ prisma: mockPrisma }));

export { mockHeaders, mockPrisma };

// Helper to create a mock Request
export function mockRequest(url: string, options?: RequestInit): Request {
  return new Request(`http://localhost:3000${url}`, options);
}

export function setUserId(id: string) {
  mockHeaders.set("x-user-id", id);
}

export function resetMocks() {
  mockHeaders = new Map();
  for (const model of Object.values(mockPrisma)) {
    for (const fn of Object.values(model as Record<string, jest.Mock>)) {
      if (typeof fn?.mockReset === "function") fn.mockReset();
    }
  }
}
