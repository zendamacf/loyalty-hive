import { mock } from "bun:test";

import type {
  GetApiV1BrandsResponse,
  GetApiV1CardsByIdResponse,
  GetApiV1CardsResponse,
  PostApiV1CardsResponse,
} from "@/lib/api-client";

export const setConfigMock = mock(() => {});
export const getConfigMock = mock(() => ({
  auth: undefined as string | undefined,
}));

export const postApiV1AuthLoginMock = mock(() =>
  Promise.resolve({ data: { token: "test-token" }, error: undefined }),
);

export const postApiV1AuthSignupMock = mock(() =>
  Promise.resolve({
    data: { id: "00000000-0000-4000-8000-000000000099" },
    error: undefined,
  }),
);

export const getApiV1BrandsMock = mock(() =>
  Promise.resolve({ data: [] as GetApiV1BrandsResponse, error: undefined }),
);

export const getApiV1CardsMock = mock(() =>
  Promise.resolve({ data: [] as GetApiV1CardsResponse, error: undefined }),
);

export const postApiV1CardsMock = mock(() =>
  Promise.resolve({ data: {} as PostApiV1CardsResponse, error: undefined }),
);

export const getApiV1CardsByIdMock = mock(() =>
  Promise.resolve({ data: {} as GetApiV1CardsByIdResponse, error: undefined }),
);

export const deleteApiV1CardsByIdMock = mock(() =>
  Promise.resolve({ data: null, error: undefined }),
);

mock.module("@/lib/api-client", () => ({
  client: {
    getConfig: getConfigMock,
    setConfig: setConfigMock,
  },
  postApiV1AuthLogin: postApiV1AuthLoginMock,
  postApiV1AuthSignup: postApiV1AuthSignupMock,
  getApiV1Brands: getApiV1BrandsMock,
  getApiV1Cards: getApiV1CardsMock,
  postApiV1Cards: postApiV1CardsMock,
  getApiV1CardsById: getApiV1CardsByIdMock,
  deleteApiV1CardsById: deleteApiV1CardsByIdMock,
}));
