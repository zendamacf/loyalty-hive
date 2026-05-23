import type { GetApiV1BrandsResponse } from "@/lib/api-client/gen";

export const testBrands = [
  {
    id: "00000000-0000-4000-8000-000000000004",
    name: "ASOS",
    logoUrl: "https://logo.clearbit.com/asos.com",
    backgroundColor: "#FFFFFF",
    createdAt: "2025-01-01T00:00:00.000Z",
    defaultView: null,
  },
  {
    id: "00000000-0000-4000-8000-0000000000aa",
    name: "Uber Eats",
    logoUrl: "https://logo.clearbit.com/ubereats.com",
    backgroundColor: "#FFFFFF",
    createdAt: "2025-01-01T00:00:00.000Z",
    defaultView: null,
  },
] satisfies GetApiV1BrandsResponse;

export const defaultBrandsResponse = {
  data: testBrands,
  error: undefined as undefined,
};
