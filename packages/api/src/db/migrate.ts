import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import { config } from "../common/config";

if (!config.db.url) {
  throw new Error("DATABASE_URL is required");
}

const pool = new Pool({
  connectionString: config.db.url,
});

const db = drizzle(pool);

await migrate(db, {
  migrationsFolder: "./drizzle",
});

await pool.end();
