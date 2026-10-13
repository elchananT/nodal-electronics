// Creates a throwaway SQLite database per test file, migrates it and seeds the catalog.
// The dev database (prisma/dev.db) is never touched: DATABASE_URL is forced to a temp file first.
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

/** Returns a teardown function. Import server modules only after this has resolved. */
export async function setupTestDatabase(): Promise<() => Promise<void>> {
  const dir = mkdtempSync(path.join(tmpdir(), "nodal-test-"));
  const databaseUrl = `file:${path.join(dir, "test.db")}`;
  process.env.DATABASE_URL = databaseUrl;

  execFileSync(path.join(ROOT, "node_modules", ".bin", "prisma"), ["migrate", "deploy"], {
    cwd: ROOT,
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: "pipe",
  });

  const { db } = await import("../../src/server/db");
  const { seedCatalog } = await import("../../src/server/seed-catalog");
  await seedCatalog(db);

  return async () => {
    await db.$disconnect();
    rmSync(dir, { recursive: true, force: true });
  };
}
