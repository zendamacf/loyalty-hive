import { apiClient } from "../lib/apiClient";

export async function getCards() {
  const res = await apiClient.v1.cards.$get();

  if (res.ok) {
    const data = await res.json();

    return data;
  }

  return null;
}
