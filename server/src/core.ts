import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { PoolClient } from "pg";
import { config } from "./config.js";
import { enqueueMail } from "./mail.js";
export type Actor = {
  id: string;
  name: string;
  email: string;
  role: "client" | "practitioner" | "operator";
};
export type ApiEnv = { Variables: { actor: Actor } };
export function fail(status: ContentfulStatusCode, message: string): never {
  throw new HTTPException(status, { message });
}
export function requireActor(c: Context<ApiEnv>): Actor {
  const actor = c.get("actor");
  if (!actor) fail(401, "Please sign in.");
  return actor;
}
export async function notify(
  db: PoolClient,
  userId: string,
  title: string,
  body: string,
  bookingId?: string,
) {
  const { rows } = await db.query(
    "SELECT email FROM circle_profiles WHERE user_id=$1 AND closed_at IS NULL",
    [userId],
  );
  if (!rows[0]) return;
  await db.query(
    "INSERT INTO circle_notifications(user_id,title,body,booking_id) VALUES($1,$2,$3,$4)",
    [userId, title, body, bookingId || null],
  );
  // Email deliberately contains no appointment details or health information.
  await enqueueMail(
    db,
    rows[0].email,
    "notification",
    {
      subject: "An update in your Circle",
      text: `There is an update in your Circle. Sign in to read it: ${config.appUrl}/beta`,
    },
    userId,
  );
}
export async function audit(
  db: PoolClient,
  actorId: string | null,
  action: string,
  targetId?: string | null,
  reason = "",
) {
  await db.query(
    "INSERT INTO circle_audit(actor_id,action,target_id,reason) VALUES($1,$2,$3,$4)",
    [actorId, action, targetId || null, reason],
  );
}
