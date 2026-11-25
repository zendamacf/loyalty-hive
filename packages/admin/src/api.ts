/** Client for the admin API (`/api/v1/admin`). The session is an httpOnly cookie. */

const BASE = "/api/v1/admin";

export type Admin = { id: string; email: string };

export type BrandRequestStatus = "pending" | "approved" | "rejected";

export type AdminBrandRequest = {
  id: string;
  requestedName: string;
  url: string;
  notes: string | null;
  status: BrandRequestStatus;
  brandId: string | null;
  createdAt: string;
  user: { id: string; email: string };
};

export type BrandRequestList = {
  items: AdminBrandRequest[];
  total: number;
  limit: number;
  offset: number;
};

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${BASE}${path}`, {
    ...init,
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = (await response.json()) as { error?: unknown };
      if (typeof body.error === "string") message = body.error;
    } catch {
      // Not JSON. Keep the default message.
    }
    throw new ApiError(response.status, message);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export function getMe(): Promise<Admin> {
  return request<Admin>("/auth/me");
}

export function login(email: string, password: string): Promise<Admin> {
  return request<Admin>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function logout(): Promise<void> {
  return request<void>("/auth/logout", { method: "POST" });
}

export function listBrandRequests(params: {
  status?: BrandRequestStatus;
  limit: number;
  offset: number;
}): Promise<BrandRequestList> {
  const query = new URLSearchParams({
    limit: String(params.limit),
    offset: String(params.offset),
  });
  if (params.status) query.set("status", params.status);
  return request<BrandRequestList>(`/brand-requests?${query}`);
}
