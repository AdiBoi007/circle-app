import { readFile, readdir } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import type { Pool } from "pg";
import { getMigrations } from "better-auth/db/migration";
import { auth } from "./auth.js";
import { pool } from "./db.js";
export async function migrate(db: Pool) {
  const lock = await db.connect();
  try {
    await lock.query("SELECT pg_advisory_lock(713045991)");
    const authMigration = await getMigrations({
      ...auth.options,
      database: db,
    });
    await authMigration.runMigrations();
    await lock.query(
      "CREATE TABLE IF NOT EXISTS circle_migrations(name text PRIMARY KEY,applied_at timestamptz NOT NULL DEFAULT now())",
    );
    const dir = new URL("../migrations/", import.meta.url);
    for (const name of (await readdir(dir))
      .filter((n) => /^\d+.*\.sql$/.test(n))
      .sort()) {
      if (
        (
          await lock.query("SELECT 1 FROM circle_migrations WHERE name=$1", [
            name,
          ])
        ).rowCount
      )
        continue;
      await lock.query("BEGIN");
      try {
        await lock.query(await readFile(new URL(name, dir), "utf8"));
        await lock.query("INSERT INTO circle_migrations(name) VALUES($1)", [
          name,
        ]);
        await lock.query("COMMIT");
      } catch (error) {
        await lock.query("ROLLBACK");
        throw error;
      }
    }
  } finally {
    await lock.query("SELECT pg_advisory_unlock(713045991)");
    lock.release();
  }
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  try {
    await migrate(pool);
    console.info("Database migrations complete.");
  } finally {
    await pool.end();
  }
}
