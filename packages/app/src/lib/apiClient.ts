import type { AppType } from "@loyalty-hive/api-rpc-spec";
import { hc } from "hono/client";

export const apiClient = hc<AppType>(`${import.meta.env.API_URL}/api`);
