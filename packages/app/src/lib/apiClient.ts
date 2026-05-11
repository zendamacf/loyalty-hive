import type { AppType } from "@loyalty-hive/api-rpc-spec";
import { hc } from "hono/client";

// FIXME: Deleting the node_modules dir fixes this, wtf is going on here?
export const apiClient = hc<AppType>(`${import.meta.env.API_URL}/api`);
