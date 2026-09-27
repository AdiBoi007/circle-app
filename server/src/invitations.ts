import { createHash, randomBytes } from "node:crypto";
import type { PoolClient } from "pg";
import { pool, transaction } from "./db.js";
import { config } from "./config.js";
import { audit, fail, notify } from "./core.js";
import { enqueueMail } from "./mail.js";
export const FAMILY_CONSENT =
  "Allow this person to request and manage appointments for you, and see your appointments and practitioner follow-ups. You can remove this access in Family at any time. This does not give them access to your password.";
export const tokenHash = (token: string) =>
  createHash("sha256").update(token).digest("hex");
export async function invitationForToken(token: string) {
  if (!token || token.length > 200) fail(400, "This invitation is invalid.");
  const { rows } = await pool.query(
    `SELECT i.*,p.name AS inviter_name FROM circle_invitations i LEFT JOIN circle_profiles p ON p.user_id=i.inviter_id
    WHERE token_hash=$1 AND i.status='Pending' AND i.expires_at>now() AND (i.inviter_id IS NULL OR p.closed_at IS NULL)`,
    [tokenHash(token)],
  );
  if (!rows[0])
    fail(400, "This invitation has expired, was used, or was revoked.");
  return rows[0];
}
export async function createInvitation(
  db: PoolClient,
  input: {
    email: string;
    role: "client" | "practitioner" | "operator";
    purpose: "beta" | "family";
    inviterId: string | null;
  },
) {
  const token = randomBytes(32).toString("base64url");
  const { rows } = await db.query(
    `INSERT INTO circle_invitations(email,role,purpose,inviter_id,token_hash,expires_at)
    VALUES($1,$2,$3,$4,$5,now()+interval '7 days') RETURNING id`,
    [
      input.email.toLowerCase(),
      input.role,
      input.purpose,
      input.inviterId,
      tokenHash(token),
    ],
  );
  const url = `${config.appUrl}/beta?invite=${encodeURIComponent(token)}`;
  await enqueueMail(db, input.email, "invitation", {
    subject: "Your invitation to Circle",
    text: `You have been invited to Circle in Chandigarh. Review and accept your invitation: ${url}\nThis link expires in 7 days. If you were not expecting it, ignore this message.`,
  });
  await audit(
    db,
    input.inviterId,
    "invitation.created",
    rows[0].id,
    input.purpose,
  );
  return { id: rows[0].id as string, url };
}
export async function claimInvitation(
  token: string,
  user: { id: string; email: string; name: string },
) {
  await transaction(async (db) => {
    const initial = (
      await db.query(
        "SELECT inviter_id FROM circle_invitations WHERE token_hash=$1",
        [tokenHash(token)],
      )
    ).rows[0];
    if (!initial) fail(400, "This invitation is no longer available.");
    // Profile locks precede invitation locks, matching account closure and family revocation.
    await db.query(
      "SELECT user_id FROM circle_profiles WHERE user_id=ANY($1::text[]) ORDER BY user_id FOR NO KEY UPDATE",
      [[user.id, initial.inviter_id].filter(Boolean)],
    );
    const { rows } = await db.query(
      "SELECT * FROM circle_invitations WHERE token_hash=$1 FOR UPDATE",
      [tokenHash(token)],
    );
    const invite = rows[0];
    if (invite?.status === "Accepted" && invite.accepted_by === user.id) return;
    if (
      !invite ||
      invite.status !== "Pending" ||
      new Date(invite.expires_at).getTime() <= Date.now() ||
      invite.email !== user.email.toLowerCase()
    )
      fail(400, "This invitation is no longer available for this account.");
    if (invite.inviter_id) {
      const inviter = await db.query(
        "SELECT user_id FROM circle_profiles WHERE user_id=$1 AND closed_at IS NULL",
        [invite.inviter_id],
      );
      if (!inviter.rowCount)
        fail(400, "This invitation is no longer available.");
    }
    const existing = (
      await db.query("SELECT * FROM circle_profiles WHERE user_id=$1", [
        user.id,
      ])
    ).rows[0];
    if (existing?.closed_at) fail(403, "This account has been closed.");
    if (existing && invite.purpose === "family" && existing.role !== "client")
      fail(
        409,
        "Family access requires a personal account. Use a separately invited personal email.",
      );
    if (existing && invite.purpose === "beta" && existing.role !== invite.role)
      fail(
        409,
        "This account already has a different role. Use a separate invited account.",
      );
    await db.query(
      "INSERT INTO circle_profiles(user_id,name,email,role) VALUES($1,$2,$3,$4) ON CONFLICT(user_id) DO NOTHING",
      [user.id, user.name, user.email.toLowerCase(), invite.role],
    );
    if (invite.role === "practitioner")
      await db.query(
        "INSERT INTO circle_practices(owner_id,name,contact_email) VALUES($1,$2,$3) ON CONFLICT(owner_id) DO NOTHING",
        [user.id, user.name, user.email.toLowerCase()],
      );
    if (invite.purpose === "family") {
      if (invite.inviter_id === user.id)
        fail(400, "You cannot accept your own family invitation.");
      await db.query(
        `INSERT INTO circle_family_links(organiser_id,member_id) VALUES($1,$2) ON CONFLICT(organiser_id,member_id) WHERE status='Active' DO NOTHING`,
        [invite.inviter_id, user.id],
      );
      await notify(
        db,
        invite.inviter_id,
        "Family invitation accepted",
        "Your family member has allowed you to help manage their care.",
      );
      await notify(
        db,
        user.id,
        "Family access added",
        "You can review or remove access at any time in Family.",
      );
    }
    await db.query(
      `UPDATE circle_invitations SET status='Accepted',accepted_by=$2,accepted_at=now() WHERE id=$1`,
      [invite.id, user.id],
    );
    await audit(db, user.id, "invitation.accepted", invite.id, invite.purpose);
  });
}
