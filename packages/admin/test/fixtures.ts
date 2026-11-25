import type { AdminBrandRequest, BrandRequestList } from "../src/api";

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
