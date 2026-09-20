import { type GetApiV1AuthMeResponse, getApiV1AuthMe } from "@/lib/api-client";

export type CurrentUser = GetApiV1AuthMeResponse;

export async function fetchCurrentUser(): Promise<CurrentUser | null> {
  const { data, error } = await getApiV1AuthMe();

  if (error || !data) {
    return null;
  }

  return data;
}
