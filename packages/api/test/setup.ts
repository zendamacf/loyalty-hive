import { resolve } from "node:path";

import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

const testDatabaseUrl = resolveTestDatabaseUrl();

process.env.NODE_ENV = "test";
process.env.DATABASE_URL = testDatabaseUrl;
process.env.JWT_ACCESS_SECRET ??= "test-secret";
process.env.FILE_STORAGE_URL ??= "https://cdn.test/";

await migrateDatabase(testDatabaseUrl);

const { seedTestApiKey } = await import("./seed-api-key.ts");
await seedTestApiKey();

function resolveTestDatabaseUrl() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for tests");
  }

  const parsed = new URL(process.env.DATABASE_URL);
  return parsed.toString();
}

async function migrateDatabase(databaseUrl: string) {
  const pool = new Pool({ connectionString: databaseUrl });

  try {
    console.log("Migrating database");
    const db = drizzle(pool);
    await migrate(db, {
      migrationsFolder: resolve(process.cwd(), "drizzle"),
    });
  } finally {
    await pool.end();
  }
}
