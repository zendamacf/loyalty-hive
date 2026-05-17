import { mock } from "bun:test";

import type {
  GetApiV1BrandsResponse,
  GetApiV1CardsByIdResponse,
  GetApiV1CardsResponse,
  PostApiV1AuthLoginResponse,
  PostApiV1AuthSignupResponse,
  PostApiV1CardsResponse,
} from "@/lib/api-client";

export type ApiMockResult<TData> =
  | { data: TData; error?: undefined }
  | { data?: undefined; error: { error: string } };

type SdkOptions = { throwOnError?: boolean };

export async function resolveApiMock<TData>(
  result: ApiMockResult<TData>,
  options?: SdkOptions,
): Promise<ApiMockResult<TData>> {
  if (options?.throwOnError && result.error) {
    throw result.error;
  }
  return result;
}

export const setConfigMock = mock(() => {});
export const getConfigMock = mock(() => ({
  auth: undefined as string | undefined,
}));

export const postApiV1AuthLoginMock = mock(
  (options?: SdkOptions): Promise<ApiMockResult<PostApiV1AuthLoginResponse>> =>
    resolveApiMock(
      {
        data: { token: "test-token" },
        error: undefined,
      },
      options,
    ),
);

export const postApiV1AuthSignupMock = mock(
  (options?: SdkOptions): Promise<ApiMockResult<PostApiV1AuthSignupResponse>> =>
    resolveApiMock(
      {
        data: {
          id: "00000000-0000-4000-8000-000000000099",
          email: "test@example.com",
        },
        error: undefined,
      },
      options,
    ),
);

export const getApiV1BrandsMock = mock(
  (options?: SdkOptions): Promise<ApiMockResult<GetApiV1BrandsResponse>> =>
    resolveApiMock({ data: [], error: undefined }, options),
);

export const getApiV1CardsMock = mock(
  (options?: SdkOptions): Promise<ApiMockResult<GetApiV1CardsResponse>> =>
    resolveApiMock({ data: [], error: undefined }, options),
);

export const postApiV1CardsMock = mock(
  (options?: SdkOptions): Promise<ApiMockResult<PostApiV1CardsResponse>> =>
    resolveApiMock(
      {
        data: {
          id: "card-1",
          userId: "00000000-0000-4000-8000-000000000001",
          cardNumber: "123456",
          brand: null,
          createdAt: new Date().toISOString(),
        },
        error: undefined,
      },
      options,
    ),
);

export const getApiV1CardsByIdMock = mock(
  (options?: SdkOptions): Promise<ApiMockResult<GetApiV1CardsByIdResponse>> =>
    resolveApiMock(
      {
        data: {
          id: "card-1",
          userId: "00000000-0000-4000-8000-000000000001",
          cardNumber: "123456",
          brand: null,
          createdAt: new Date().toISOString(),
        },
        error: undefined,
      },
      options,
    ),
);

export const deleteApiV1CardsByIdMock = mock(
  (options?: SdkOptions): Promise<ApiMockResult<null>> =>
    resolveApiMock({ data: null, error: undefined }, options),
);

const sdkMocks = {
  postApiV1AuthLogin: postApiV1AuthLoginMock,
  postApiV1AuthSignup: postApiV1AuthSignupMock,
  getApiV1Brands: getApiV1BrandsMock,
  getApiV1Cards: getApiV1CardsMock,
  postApiV1Cards: postApiV1CardsMock,
  getApiV1CardsById: getApiV1CardsByIdMock,
  deleteApiV1CardsById: deleteApiV1CardsByIdMock,
};

mock.module("@/lib/api-client/gen/sdk.gen", () => ({
  ...sdkMocks,
}));

mock.module("@/lib/api-client", () => {
  const generated = require("@/lib/api-client/gen") as typeof import("@/lib/api-client/gen");
  const reactQueryGen =
    require("@/lib/api-client/gen/@tanstack/react-query.gen") as typeof import("@/lib/api-client/gen/@tanstack/react-query.gen");

  return {
    ...generated,
    ...reactQueryGen,
    ...sdkMocks,
    client: {
      getConfig: getConfigMock,
      setConfig: setConfigMock,
    },
  };
});
