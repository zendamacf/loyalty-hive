import { resolve } from "node:path";

import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";

const { Pool } = pg;
const TEST_DB_SUFFIX = "_test";

const testDatabaseUrl = resolveTestDatabaseUrl();

process.env.NODE_ENV = "test";
process.env.DATABASE_URL = testDatabaseUrl;

await recreateDatabase(testDatabaseUrl);
await migrateDatabase(testDatabaseUrl);

function resolveTestDatabaseUrl() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for tests");
  }

  const parsed = new URL(process.env.DATABASE_URL);
  const databaseName = parsed.pathname.replace(/^\//, "");
  const fallbackName = databaseName || "postgres";

  if (!fallbackName.endsWith(TEST_DB_SUFFIX)) {
    parsed.pathname = `/${fallbackName}${TEST_DB_SUFFIX}`;
  }

  return parsed.toString();
}

async function recreateDatabase(databaseUrl: string) {
  const parsed = new URL(databaseUrl);
  const databaseName = parsed.pathname.replace(/^\//, "");

  if (!databaseName) {
    throw new Error("Could not derive test database name from DATABASE_URL");
  }

  parsed.pathname = "/postgres";
  const adminPool = new Pool({ connectionString: parsed.toString() });
  const quotedName = quoteIdentifier(databaseName);

  try {
    console.log(`Dropping & recreating database ${quotedName}`);
    await adminPool.query(`DROP DATABASE IF EXISTS ${quotedName} WITH (FORCE)`);
    await adminPool.query(`CREATE DATABASE ${quotedName}`);
  } finally {
    await adminPool.end();
  }
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

function quoteIdentifier(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}
