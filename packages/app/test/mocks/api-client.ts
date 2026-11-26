import { mock } from "bun:test";

import type {
  DeleteApiV1AuthMeResponse,
  GetApiV1AuthMeResponse,
  GetApiV1BrandsResponse,
  GetApiV1CardsByIdResponse,
  GetApiV1CardsResponse,
  GetApiV1SharesIncomingResponse,
  GetApiV1SharesOutgoingResponse,
  PatchApiV1CardsByIdResponse,
  PostApiV1AuthForgotPasswordResponse,
  PostApiV1AuthLoginResponse,
  PostApiV1AuthResendVerificationResponse,
  PostApiV1AuthResetPasswordResponse,
  PostApiV1AuthSignupResponse,
  PostApiV1AuthVerifyEmailResponse,
  PostApiV1BrandRequestsResponse,
  PostApiV1CardsByIdViewResponse,
  PostApiV1CardsResponse,
  PostApiV1SharesPreviewResponse,
  PostApiV1SharesResponse,
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

export const getApiV1AuthMeMock = mock(
  (options?: SdkOptions): Promise<ApiMockResult<GetApiV1AuthMeResponse>> =>
    resolveApiMock(
      {
        data: {
          id: "00000000-0000-4000-8000-000000000001",
          email: "test@example.com",
          emailVerified: true,
        },
        error: undefined,
      },
      options,
    ),
);

export const postApiV1AuthVerifyEmailMock = mock(
  (
    options?: SdkOptions,
  ): Promise<ApiMockResult<PostApiV1AuthVerifyEmailResponse>> =>
    resolveApiMock({ data: { verified: true }, error: undefined }, options),
);

export const postApiV1AuthResendVerificationMock = mock(
  (
    options?: SdkOptions,
  ): Promise<ApiMockResult<PostApiV1AuthResendVerificationResponse>> =>
    resolveApiMock(
      {
        data: {
          message: "If your account needs verification, we sent an email.",
        },
        error: undefined,
      },
      options,
    ),
);

export const deleteApiV1AuthMeMock = mock(
  (options?: SdkOptions): Promise<ApiMockResult<DeleteApiV1AuthMeResponse>> =>
    resolveApiMock(
      {
        data: { deleted: true, purgeAfter: "2027-01-01T00:00:00.000Z" },
        error: undefined,
      },
      options,
    ),
);

export const postApiV1AuthForgotPasswordMock = mock(
  (
    options?: SdkOptions,
  ): Promise<ApiMockResult<PostApiV1AuthForgotPasswordResponse>> =>
    resolveApiMock(
      {
        data: {
          message:
            "If an account exists for this email, we sent password reset instructions.",
        },
        error: undefined,
      },
      options,
    ),
);

export const postApiV1AuthResetPasswordMock = mock(
  (
    options?: SdkOptions,
  ): Promise<ApiMockResult<PostApiV1AuthResetPasswordResponse>> =>
    resolveApiMock({ data: { reset: true }, error: undefined }, options),
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

export const postApiV1BrandRequestsMock = mock(
  (
    options?: SdkOptions,
  ): Promise<ApiMockResult<PostApiV1BrandRequestsResponse>> =>
    resolveApiMock(
      {
        data: {
          id: "00000000-0000-4000-8000-000000000010",
          requestedName: "Requested Brand",
          url: "https://example.com/loyalty",
          notes: null,
          status: "pending",
          createdAt: new Date().toISOString(),
        },
        error: undefined,
      },
      options,
    ),
);

export const getApiV1CardsMock = mock(
  (options?: SdkOptions): Promise<ApiMockResult<GetApiV1CardsResponse>> =>
    resolveApiMock({ data: [], error: undefined }, options),
);

export const createCardMock = (
  overrides: Partial<PostApiV1CardsResponse> = {},
): PostApiV1CardsResponse => ({
  id: "card-1",
  userId: "00000000-0000-4000-8000-000000000001",
  cardNumber: "123456",
  brand: null,
  viewCount: 0,
  lastViewedAt: null,
  ownership: "owned",
  sharedBy: null,
  createdAt: new Date().toISOString(),
  ...overrides,
});

export const postApiV1CardsMock = mock(
  (options?: SdkOptions): Promise<ApiMockResult<PostApiV1CardsResponse>> =>
    resolveApiMock(
      {
        data: createCardMock(),
        error: undefined,
      },
      options,
    ),
);

export const getApiV1CardsByIdMock = mock(
  (options?: SdkOptions): Promise<ApiMockResult<GetApiV1CardsByIdResponse>> =>
    resolveApiMock(
      {
        data: createCardMock(),
        error: undefined,
      },
      options,
    ),
);

export const deleteApiV1CardsByIdMock = mock(
  (options?: SdkOptions): Promise<ApiMockResult<null>> =>
    resolveApiMock({ data: null, error: undefined }, options),
);

export const patchApiV1CardsByIdMock = mock(
  (options?: SdkOptions): Promise<ApiMockResult<PatchApiV1CardsByIdResponse>> =>
    resolveApiMock(
      {
        data: createCardMock(),
        error: undefined,
      },
      options,
    ),
);

export const postApiV1CardsByIdViewMock = mock(
  (
    options?: SdkOptions,
  ): Promise<ApiMockResult<PostApiV1CardsByIdViewResponse>> =>
    resolveApiMock(
      {
        data: createCardMock({
          viewCount: 1,
          lastViewedAt: new Date().toISOString(),
        }),
        error: undefined,
      },
      options,
    ),
);

export const postApiV1SharesMock = mock(
  (options?: SdkOptions): Promise<ApiMockResult<PostApiV1SharesResponse>> =>
    resolveApiMock(
      {
        data: {
          message:
            "If there is a LoyaltyHive account with this email, we sent them an invite.",
        },
        error: undefined,
      },
      options,
    ),
);

export const postApiV1SharesPreviewMock = mock(
  (
    options?: SdkOptions,
  ): Promise<ApiMockResult<PostApiV1SharesPreviewResponse>> =>
    resolveApiMock(
      {
        data: {
          scope: "card",
          ownerEmail: "owner@example.com",
          expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
        },
        error: undefined,
      },
      options,
    ),
);

export const postApiV1SharesAcceptMock = mock(
  (options?: SdkOptions): Promise<ApiMockResult<null>> =>
    resolveApiMock({ data: null, error: undefined }, options),
);

export const getApiV1SharesOutgoingMock = mock(
  (
    options?: SdkOptions,
  ): Promise<ApiMockResult<GetApiV1SharesOutgoingResponse>> =>
    resolveApiMock({ data: { invites: [], shares: [] } }, options),
);

export const getApiV1SharesIncomingMock = mock(
  (
    options?: SdkOptions,
  ): Promise<ApiMockResult<GetApiV1SharesIncomingResponse>> =>
    resolveApiMock({ data: [] }, options),
);

export const deleteApiV1SharesInvitesByIdMock = mock(
  (options?: SdkOptions): Promise<ApiMockResult<null>> =>
    resolveApiMock({ data: null }, options),
);

export const deleteApiV1SharesByIdMock = mock(
  (options?: SdkOptions): Promise<ApiMockResult<null>> =>
    resolveApiMock({ data: null }, options),
);

const sdkMocks = {
  postApiV1AuthLogin: postApiV1AuthLoginMock,
  postApiV1AuthSignup: postApiV1AuthSignupMock,
  postApiV1AuthVerifyEmail: postApiV1AuthVerifyEmailMock,
  postApiV1AuthResendVerification: postApiV1AuthResendVerificationMock,
  deleteApiV1AuthMe: deleteApiV1AuthMeMock,
  postApiV1AuthForgotPassword: postApiV1AuthForgotPasswordMock,
  postApiV1AuthResetPassword: postApiV1AuthResetPasswordMock,
  getApiV1AuthMe: getApiV1AuthMeMock,
  getApiV1Brands: getApiV1BrandsMock,
  postApiV1BrandRequests: postApiV1BrandRequestsMock,
  getApiV1Cards: getApiV1CardsMock,
  postApiV1Cards: postApiV1CardsMock,
  getApiV1CardsById: getApiV1CardsByIdMock,
  deleteApiV1CardsById: deleteApiV1CardsByIdMock,
  patchApiV1CardsById: patchApiV1CardsByIdMock,
  postApiV1CardsByIdView: postApiV1CardsByIdViewMock,
  postApiV1Shares: postApiV1SharesMock,
  postApiV1SharesPreview: postApiV1SharesPreviewMock,
  postApiV1SharesAccept: postApiV1SharesAcceptMock,
  getApiV1SharesOutgoing: getApiV1SharesOutgoingMock,
  getApiV1SharesIncoming: getApiV1SharesIncomingMock,
  deleteApiV1SharesInvitesById: deleteApiV1SharesInvitesByIdMock,
  deleteApiV1SharesById: deleteApiV1SharesByIdMock,
};

mock.module("@/lib/api-client/gen/sdk.gen", () => ({
  ...sdkMocks,
}));

mock.module("@/lib/api-client", () => {
  const generated =
    require("@/lib/api-client/gen") as typeof import("@/lib/api-client/gen");
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
