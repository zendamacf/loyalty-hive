import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { config } from "../common/config";

if (!config.db.url) {
  throw new Error("DATABASE_URL is required");
}

const pool = new Pool({
  connectionString: config.db.url,
});

export const db = drizzle(pool);
