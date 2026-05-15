import { mock } from "bun:test";

import type {
  GetApiV1BrandsResponse,
  GetApiV1CardsByIdResponse,
  GetApiV1CardsResponse,
  PostApiV1AuthLoginResponse,
  PostApiV1AuthSignupResponse,
  PostApiV1CardsResponse,
} from "@/lib/api-client";

export type ApiMockResult<TData, TError = { error: string }> =
  | { data: TData; error: undefined }
  | { data: undefined; error: TError };

export const setConfigMock = mock(() => {});
export const getConfigMock = mock(() => ({
  auth: undefined as string | undefined,
}));

export const postApiV1AuthLoginMock = mock(
  (): Promise<ApiMockResult<PostApiV1AuthLoginResponse>> =>
    Promise.resolve({
      data: { token: "test-token" },
      error: undefined,
    }),
);

export const postApiV1AuthSignupMock = mock(
  (): Promise<ApiMockResult<PostApiV1AuthSignupResponse>> =>
    Promise.resolve({
      data: {
        id: "00000000-0000-4000-8000-000000000099",
        email: "test@example.com",
      },
      error: undefined,
    }),
);

export const getApiV1BrandsMock = mock(
  (): Promise<ApiMockResult<GetApiV1BrandsResponse>> =>
    Promise.resolve({ data: [], error: undefined }),
);

export const getApiV1CardsMock = mock(
  (): Promise<ApiMockResult<GetApiV1CardsResponse>> =>
    Promise.resolve({ data: [], error: undefined }),
);

export const postApiV1CardsMock = mock(
  (): Promise<ApiMockResult<PostApiV1CardsResponse>> =>
    Promise.resolve({
      data: {
        id: "card-1",
        userId: "00000000-0000-4000-8000-000000000001",
        cardNumber: "123456",
        brand: null,
        createdAt: new Date().toISOString(),
      },
      error: undefined,
    }),
);

export const getApiV1CardsByIdMock = mock(
  (): Promise<ApiMockResult<GetApiV1CardsByIdResponse>> =>
    Promise.resolve({
      data: {
        id: "card-1",
        userId: "00000000-0000-4000-8000-000000000001",
        cardNumber: "123456",
        brand: null,
        createdAt: new Date().toISOString(),
      },
      error: undefined,
    }),
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
