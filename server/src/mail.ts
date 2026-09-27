import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";
import type { PoolClient } from "pg";
import { config } from "./config.js";
import { transaction } from "./db.js";
const key = createHash("sha256").update(config.secret).digest();
type Message = { subject: string; text: string };
function seal(value: Message) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const data = Buffer.concat([
    cipher.update(JSON.stringify(value), "utf8"),
    cipher.final(),
  ]);
  return Buffer.concat([iv, cipher.getAuthTag(), data]).toString("base64");
}
function unseal(value: string): Message {
  const b = Buffer.from(value, "base64");
  const decipher = createDecipheriv("aes-256-gcm", key, b.subarray(0, 12));
  decipher.setAuthTag(b.subarray(12, 28));
  return JSON.parse(
    Buffer.concat([decipher.update(b.subarray(28)), decipher.final()]).toString(
      "utf8",
    ),
  );
}
export async function enqueueMail(
  db: PoolClient,
  recipient: string,
  kind: string,
  message: Message,
  userId?: string,
) {
  await db.query(
    `INSERT INTO circle_outbox(recipient,kind,payload,user_id,status,last_error)
    VALUES($1,$2,$3,$4,$5,$6)`,
    [
      recipient,
      kind,
      seal(message),
      userId || null,
      config.mailEnabled ? "Pending" : "Failed",
      config.mailEnabled ? null : "Email delivery is not configured.",
    ],
  );
}
// Row locks keep multiple workers from sending the same message concurrently. Provider idempotency
// handles a process crash between successful delivery and the database commit.
export async function deliverOne(): Promise<boolean> {
  if (!config.mailEnabled) return false;
  return transaction(async (db) => {
    const { rows } =
      await db.query(`SELECT * FROM circle_outbox WHERE status='Pending' AND next_attempt_at<=now()
      ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT 1`);
    const job = rows[0];
    if (!job) return false;
    try {
      const message = unseal(job.payload);
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        signal: AbortSignal.timeout(10000),
        headers: {
          Authorization: `Bearer ${config.mailKey}`,
          "Content-Type": "application/json",
          "Idempotency-Key": job.id,
        },
        body: JSON.stringify({
          from: config.mailFrom,
          to: [job.recipient],
          ...message,
        }),
      });
      if (!response.ok)
        throw new Error(`Email provider returned HTTP ${response.status}.`);
      await db.query(
        `UPDATE circle_outbox SET status='Sent',attempts=attempts+1,last_error=NULL,delivered_at=now(),payload='' WHERE id=$1`,
        [job.id],
      );
    } catch (error) {
      const attempts = job.attempts + 1;
      await db.query(
        `UPDATE circle_outbox SET status=$2,attempts=$3,last_error=$4,next_attempt_at=now()+($5*interval '1 second') WHERE id=$1`,
        [
          job.id,
          attempts >= 5 ? "Failed" : "Pending",
          attempts,
          error instanceof Error && error.message.startsWith("Email provider")
            ? error.message
            : "Email delivery could not be completed.",
          Math.min(3600, 30 * 2 ** attempts),
        ],
      );
    }
    return true;
  });
}
