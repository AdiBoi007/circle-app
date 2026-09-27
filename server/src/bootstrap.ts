import { z } from "zod";
import { pool, transaction } from "./db.js";
import { createInvitation } from "./invitations.js";
const emailArg = process.argv.indexOf("--email");
try {
  const email = z
    .email()
    .max(160)
    .parse(emailArg >= 0 ? process.argv[emailArg + 1] : undefined)
    .toLowerCase();
  const result = await transaction(async (db) => {
    await db.query("SELECT pg_advisory_xact_lock(713045992)");
    if (
      (
        await db.query(
          `SELECT 1 FROM circle_profiles WHERE role='operator' AND closed_at IS NULL`,
        )
      ).rowCount
    )
      throw new Error("An operator already exists. Sign in with that account.");
    await db.query(
      `UPDATE circle_invitations SET status='Revoked' WHERE role='operator' AND status='Pending'`,
    );
    return createInvitation(db, {
      email,
      role: "operator",
      purpose: "beta",
      inviterId: null,
    });
  });
  console.info(
    "Open this private, one-use link to create the first operator account. Share only with the intended account owner.\n" +
      result.url,
  );
} catch (error) {
  console.error(
    error instanceof z.ZodError
      ? "Usage: npm run bootstrap -- --email your-email@example.com"
      : error instanceof Error
        ? error.message
        : "Setup failed.",
  );
  process.exitCode = 1;
} finally {
  await pool.end();
}
