import type {
  AdminBrandRequest,
  AdminUser,
  BrandRequestList,
  UserList,
} from "../src/api";

export const ADMIN = { id: "admin-1", email: "admin@example.com" };

export function brandRequest(
  overrides: Partial<AdminBrandRequest> = {},
): AdminBrandRequest {
  return {
    id: "request-1",
    requestedName: "Coffee Club",
    url: "https://coffee.example.com",
    notes: "Near my office",
    status: "pending",
    brandId: null,
    createdAt: "2026-11-20T10:00:00.000Z",
    user: { id: "user-1", email: "user@example.com" },
    ...overrides,
  };
}

export function brandRequestList(
  items: AdminBrandRequest[],
  overrides: Partial<BrandRequestList> = {},
): BrandRequestList {
  return { items, total: items.length, limit: 50, offset: 0, ...overrides };
}

export function adminUser(overrides: Partial<AdminUser> = {}): AdminUser {
  return {
    id: "user-1",
    email: "user@example.com",
    createdAt: "2026-11-01T10:00:00.000Z",
    emailVerifiedAt: "2026-11-01T10:05:00.000Z",
    deletedAt: null,
    ...overrides,
  };
}

export function userList(
  items: AdminUser[],
  overrides: Partial<UserList> = {},
): UserList {
  return { items, total: items.length, limit: 50, offset: 0, ...overrides };
}
