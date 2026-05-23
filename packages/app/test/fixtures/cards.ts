import type { GetApiV1CardsResponse } from "@/lib/api-client/gen";

export const testCards = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    userId: "00000000-0000-4000-8000-000000000099",
    cardNumber: "111",
    label: null,
    view: null,
    brand: {
      id: "00000000-0000-4000-8000-0000000000a1",
      name: "ASOS",
      logoUrl: "https://logo.clearbit.com/asos.com",
      backgroundColor: "#FFFFFF",
    },
    viewCount: 0,
    lastViewedAt: null,
    createdAt: "2020-01-01T00:00:00.000Z",
  },
  {
    id: "00000000-0000-4000-8000-000000000003",
    userId: "00000000-0000-4000-8000-000000000099",
    cardNumber: "333",
    label: "Work card",
    view: null,
    brand: {
      id: "00000000-0000-4000-8000-0000000000a1",
      name: "ASOS",
      logoUrl: "https://logo.clearbit.com/asos.com",
      backgroundColor: "#FFFFFF",
    },
    viewCount: 0,
    lastViewedAt: null,
    createdAt: "2020-01-01T00:00:00.000Z",
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    userId: "00000000-0000-4000-8000-000000000099",
    cardNumber: "222",
    label: null,
    brand: {
      id: "00000000-0000-4000-8000-0000000000a2",
      name: "Cotton On",
      logoUrl: "https://logo.clearbit.com/cottonon.com",
      backgroundColor: "#FFFFFF",
    },
    viewCount: 0,
    lastViewedAt: null,
    createdAt: "2020-01-01T00:00:00.000Z",
  },
] satisfies GetApiV1CardsResponse;

export const defaultCardsResponse = {
  data: testCards,
  error: undefined as undefined,
};
