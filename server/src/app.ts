import { Hono } from "hono";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { bodyLimit } from "hono/body-limit";
import { HTTPException } from "hono/http-exception";
import { z, ZodError } from "zod";
import { auth } from "./auth.js";
import { config } from "./config.js";
import { pool, transaction } from "./db.js";
import { audit, fail, notify, requireActor, type ApiEnv } from "./core.js";
import {
  claimInvitation,
  createInvitation,
  FAMILY_CONSENT,
  invitationForToken,
} from "./invitations.js";
import { getPracticeBootstrap, registerPracticeRoutes } from "./practice.js";

const idSchema = z.string().uuid();
const emailSchema = z
  .email()
  .max(160)
  .transform((s) => s.toLowerCase());
export function createApp() {
  const app = new Hono<ApiEnv>();
  app.use("*", secureHeaders({ referrerPolicy: "no-referrer" }));
  app.use(
    "/api/*",
    cors({
      origin: config.appUrl,
      credentials: true,
      allowHeaders: [
        "Content-Type",
        "X-Circle-Client",
        "X-Circle-Invitation",
        "expo-origin",
      ],
      allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      exposeHeaders: ["set-cookie"],
    }),
  );
  app.use(
    "/api/*",
    bodyLimit({
      maxSize: 64 * 1024,
      onError: (c) => c.json({ error: "This request is too large." }, 413),
    }),
  );
  app.use("/api/*", async (c, next) => {
    c.header("Cache-Control", "no-store");
    if (!["GET", "HEAD", "OPTIONS"].includes(c.req.method)) {
      const origin = c.req.header("origin");
      if (origin && origin !== config.appUrl && origin !== "circle://")
        fail(403, "This request origin is not allowed.");
      if (
        !origin &&
        !c.req.header("expo-origin") &&
        c.req.header("x-circle-client") !== "native"
      )
        fail(403, "A trusted client origin is required.");
    }
    await next();
  });
  app.on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw));
  app.get("/api/health", async (c) => {
    await pool.query("SELECT 1");
    return c.json({
      ok: true,
      city: "Chandigarh",
      emailDelivery: config.mailEnabled,
      timeZone: "Asia/Kolkata",
    });
  });
  app.get("/api/invitations/preview", async (c) => {
    const i = await invitationForToken(c.req.query("token") || "");
    return c.json({
      email: i.email,
      role: i.role,
      purpose: i.purpose,
      inviterName: i.inviter_name || "Circle",
      expiresAt: i.expires_at.toISOString(),
      consentText:
        i.purpose === "family"
          ? FAMILY_CONSENT
          : "Join the invite-only Circle beta in Chandigarh. Your account will only show care you are permitted to access.",
    });
  });
  app.post("/api/invitations/accept", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) fail(401, "Please sign in to accept this invitation.");
    const { token } = z
      .object({ token: z.string().min(20).max(200) })
      .parse(await c.req.json());
    await claimInvitation(token, session.user);
    return c.json({ ok: true });
  });
  const api = new Hono<ApiEnv>();
  api.use("*", async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) fail(401, "Please sign in to Circle.");
    const { rows } = await pool.query(
      "SELECT * FROM circle_profiles WHERE user_id=$1 AND closed_at IS NULL",
      [session.user.id],
    );
    const profile = rows[0];
    if (!profile) fail(403, "Accept your invitation to activate this account.");
    c.set("actor", {
      id: profile.user_id,
      name: profile.name,
      email: profile.email,
      role: profile.role,
    });
    if (c.req.method !== "GET") {
      const { rows: r } = await pool.query(
        `INSERT INTO circle_rate_limits(key,count,expires_at) VALUES($1,1,now()+interval '60 seconds')
        ON CONFLICT(key) DO UPDATE SET count=CASE WHEN circle_rate_limits.expires_at<now() THEN 1 ELSE circle_rate_limits.count+1 END,
        expires_at=CASE WHEN circle_rate_limits.expires_at<now() THEN now()+interval '60 seconds' ELSE circle_rate_limits.expires_at END RETURNING count`,
        [profile.user_id],
      );
      if (r[0].count > 120)
        fail(429, "Please wait a minute before trying again.");
    }
    await next();
  });
  api.get("/bootstrap", async (c) => {
    const actor = requireActor(c);
    const [practice, profile, family, notifications, invitations] =
      await Promise.all([
        getPracticeBootstrap(pool, actor),
        pool.query(
          "SELECT view_preference FROM circle_profiles WHERE user_id=$1",
          [actor.id],
        ),
        pool.query(
          `SELECT f.*,o.name AS organiser_name,m.name AS member_name FROM circle_family_links f JOIN circle_profiles o ON o.user_id=f.organiser_id
        JOIN circle_profiles m ON m.user_id=f.member_id WHERE (f.organiser_id=$1 OR f.member_id=$1) ORDER BY f.created_at DESC`,
          [actor.id],
        ),
        pool.query(
          "SELECT * FROM circle_notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 100",
          [actor.id],
        ),
        pool.query(
          `SELECT *,CASE WHEN status='Pending' AND expires_at<=now() THEN 'Expired' ELSE status END AS display_status
        FROM circle_invitations WHERE (inviter_id=$1 OR $2) AND role<>'operator' ORDER BY created_at DESC LIMIT 200`,
          [actor.id, actor.role === "operator"],
        ),
      ]);
    let operator;
    if (actor.role === "operator") {
      const [deliveries, events] = await Promise.all([
        pool.query(
          "SELECT id,recipient,kind,status,attempts,last_error,created_at FROM circle_outbox ORDER BY created_at DESC LIMIT 100",
        ),
        pool.query(
          `SELECT a.*,p.name AS actor_name FROM circle_audit a LEFT JOIN circle_profiles p ON p.user_id=a.actor_id ORDER BY a.created_at DESC LIMIT 200`,
        ),
      ]);
      operator = {
        deliveries: deliveries.rows.map((r) => ({
          id: r.id,
          recipient: r.recipient,
          kind: r.kind,
          status: r.status,
          attempts: r.attempts,
          lastError: r.last_error,
          createdAt: r.created_at.toISOString(),
        })),
        audit: events.rows.map((r) => ({
          id: r.id,
          actorName: r.actor_name || "Circle setup",
          action: r.action,
          targetId: r.target_id,
          reason: r.reason,
          createdAt: r.created_at.toISOString(),
        })),
      };
    }
    return c.json({
      serverTime: new Date().toISOString(),
      profile: { ...actor, viewPreference: profile.rows[0].view_preference },
      ...practice,
      familyLinks: family.rows.map((r) => ({
        id: r.id,
        organiserId: r.organiser_id,
        organiserName: r.organiser_name,
        memberId: r.member_id,
        memberName: r.member_name,
        status: r.status,
      })),
      notifications: notifications.rows.map((r) => ({
        id: r.id,
        title: r.title,
        body: r.body,
        bookingId: r.booking_id,
        readAt: r.read_at?.toISOString() || null,
        createdAt: r.created_at.toISOString(),
      })),
      invitations: invitations.rows.map((r) => ({
        id: r.id,
        email: r.email,
        role: r.role,
        purpose: r.purpose,
        status: r.display_status,
        expiresAt: r.expires_at.toISOString(),
        createdAt: r.created_at.toISOString(),
      })),
      operator,
    });
  });
  api.post("/invitations", async (c) => {
    const actor = requireActor(c);
    const input = z
      .object({
        email: emailSchema,
        role: z.enum(["client", "practitioner"]).optional(),
        purpose: z.literal("family").optional(),
      })
      .parse(await c.req.json());
    if (input.email === actor.email)
      fail(400, "Use the email of the person you are inviting.");
    if (
      actor.role !== "operator" &&
      (actor.role !== "client" ||
        input.purpose !== "family" ||
        input.role === "practitioner")
    )
      fail(403, "You can only invite a family member.");
    const purpose = actor.role === "operator" ? "beta" : "family";
    const result = await transaction(async (db) => {
      if (
        !(
          await db.query(
            "SELECT user_id FROM circle_profiles WHERE user_id=$1 AND closed_at IS NULL FOR SHARE",
            [actor.id],
          )
        ).rowCount
      )
        fail(403, "This account is no longer active.");
      // Cap outstanding invitations to keep manual beta operations manageable.
      const { rows } = await db.query(
        `SELECT count(*)::int AS count FROM circle_invitations WHERE inviter_id=$1 AND status='Pending' AND expires_at>now()`,
        [actor.id],
      );
      if (rows[0].count >= 100)
        fail(429, "Revoke unused invitations before creating more.");
      const duplicate = await db.query(
        `SELECT id FROM circle_invitations WHERE inviter_id=$1 AND email=$2 AND status='Pending' AND expires_at>now()`,
        [actor.id, input.email],
      );
      if (duplicate.rowCount)
        fail(
          409,
          "A pending invitation already exists for this email. Revoke it before creating a replacement.",
        );
      return createInvitation(db, {
        email: input.email,
        role: actor.role === "operator" ? input.role || "client" : "client",
        purpose,
        inviterId: actor.id,
      });
    });
    return c.json(result, 201);
  });
  api.post("/invitations/:id/revoke", async (c) => {
    const actor = requireActor(c);
    const id = idSchema.parse(c.req.param("id"));
    await transaction(async (db) => {
      const result = await db.query(
        `UPDATE circle_invitations SET status='Revoked' WHERE id=$1 AND status='Pending' AND (inviter_id=$2 OR $3) RETURNING id`,
        [id, actor.id, actor.role === "operator"],
      );
      if (!result.rowCount) fail(404, "Pending invitation not found.");
      await audit(db, actor.id, "invitation.revoked", id);
    });
    return c.json({ ok: true });
  });
  api.post("/family/:id/revoke", async (c) => {
    const actor = requireActor(c);
    const id = idSchema.parse(c.req.param("id"));
    await transaction(async (db) => {
      const { rows } = await db.query(
        `SELECT * FROM circle_family_links WHERE id=$1 AND (organiser_id=$2 OR member_id=$2)`,
        [id, actor.id],
      );
      const f = rows[0];
      if (!f) fail(404, "Family access not found.");
      await db.query(
        "SELECT user_id FROM circle_profiles WHERE user_id=ANY($1::text[]) ORDER BY user_id FOR NO KEY UPDATE",
        [[f.organiser_id, f.member_id]],
      );
      const result = await db.query(
        `UPDATE circle_family_links SET status='Revoked',revoked_at=now() WHERE id=$1 AND status='Active' RETURNING id`,
        [id],
      );
      if (result.rowCount) {
        await audit(db, actor.id, "family.revoked", id);
        await notify(
          db,
          f.organiser_id,
          "Family access removed",
          "Shared care access has been removed.",
        );
        await notify(
          db,
          f.member_id,
          "Family access removed",
          "Your appointments remain available in your own account.",
        );
      }
    });
    return c.json({ ok: true });
  });
  api.put("/profile", async (c) => {
    const actor = requireActor(c);
    const input = z
      .object({
        name: z.string().trim().min(2).max(80),
        viewPreference: z.enum(["standard", "simple"]),
      })
      .parse(await c.req.json());
    if (
      !(
        await pool.query(
          "UPDATE circle_profiles SET name=$2,view_preference=$3 WHERE user_id=$1 AND closed_at IS NULL",
          [actor.id, input.name, input.viewPreference],
        )
      ).rowCount
    )
      fail(403, "This account is no longer active.");
    return c.json({ ok: true });
  });
  api.post("/notifications/:id/read", async (c) => {
    const result = await pool.query(
      "UPDATE circle_notifications SET read_at=COALESCE(read_at,now()) WHERE id=$1 AND user_id=$2",
      [idSchema.parse(c.req.param("id")), requireActor(c).id],
    );
    if (!result.rowCount) fail(404, "Notification not found.");
    return c.json({ ok: true });
  });
  api.post("/operator/practices/:id/review", async (c) => {
    const actor = requireActor(c);
    if (actor.role !== "operator") fail(403, "Operator access is required.");
    const id = idSchema.parse(c.req.param("id"));
    const input = z
      .object({
        status: z.enum(["Approved", "Suspended"]),
        reason: z.string().trim().min(5).max(1000),
      })
      .parse(await c.req.json());
    await transaction(async (db) => {
      const target = await db.query(
        "SELECT owner_id FROM circle_practices WHERE id=$1",
        [id],
      );
      if (!target.rows[0]) fail(404, "Practice not found.");
      // Match booking/account-close lock order: identity first, practice second.
      const owner = await db.query(
        "SELECT user_id FROM circle_profiles WHERE user_id=$1 AND closed_at IS NULL FOR SHARE",
        [target.rows[0].owner_id],
      );
      if (!owner.rowCount) fail(404, "Practice not found.");
      const { rows } = await db.query(
        "SELECT p.* FROM circle_practices p JOIN circle_profiles u ON p.owner_id=u.user_id WHERE p.id=$1 AND u.closed_at IS NULL FOR UPDATE OF p",
        [id],
      );
      if (!rows[0]) fail(404, "Practice not found.");
      const p = rows[0];
      if (input.status === "Approved") {
        if (
          p.name.trim().length < 2 ||
          p.title.trim().length < 3 ||
          p.bio.trim().length < 30 ||
          p.qualification.trim().length < 3 ||
          !p.languages.length ||
          !p.address.toLowerCase().includes("chandigarh") ||
          !emailSchema.safeParse(p.contact_email).success
        )
          fail(
            409,
            "The practitioner must complete their profile before approval.",
          );
        if (
          !(
            await db.query(
              "SELECT id FROM circle_services WHERE practice_id=$1 AND active=true AND deleted_at IS NULL",
              [id],
            )
          ).rowCount
        )
          fail(409, "The practice needs at least one active service.");
        if (!p.hours.some((h: { enabled: boolean }) => h.enabled))
          fail(
            409,
            "The practice needs at least one day with available hours.",
          );
      }
      await db.query(
        "UPDATE circle_practices SET status=$2,review_note=$3,updated_at=now() WHERE id=$1",
        [id, input.status, input.reason],
      );
      await audit(
        db,
        actor.id,
        `practice.${input.status.toLowerCase()}`,
        id,
        input.reason,
      );
      await notify(
        db,
        p.owner_id,
        "Practice review updated",
        input.status === "Approved"
          ? "Your listing is approved."
          : "Your listing has been suspended. Review the operator note in My practice.",
      );
    });
    return c.json({ ok: true });
  });
  api.post("/operator/deliveries/:id/retry", async (c) => {
    const actor = requireActor(c);
    if (actor.role !== "operator") fail(403, "Operator access is required.");
    if (!config.mailEnabled)
      fail(
        503,
        "Email delivery is not configured. Share invitation links manually for now.",
      );
    const id = idSchema.parse(c.req.param("id"));
    await transaction(async (db) => {
      const result = await db.query(
        `UPDATE circle_outbox SET status='Pending',attempts=0,last_error=NULL,next_attempt_at=now() WHERE id=$1 AND status='Failed' AND payload<>'' RETURNING id`,
        [id],
      );
      if (!result.rowCount) fail(409, "This delivery cannot be retried.");
      await audit(db, actor.id, "delivery.retry", id);
    });
    return c.json({ ok: true });
  });
  api.get("/account/export", async (c) => {
    const actor = requireActor(c);
    const p = await getPracticeBootstrap(pool, actor);
    const grants = await pool.query(
      "SELECT id,organiser_id,member_id,status,created_at,revoked_at FROM circle_family_links WHERE organiser_id=$1 OR member_id=$1",
      [actor.id],
    );
    return c.json({
      exportedAt: new Date().toISOString(),
      profile: actor,
      bookings: p.bookings.filter(
        (b) =>
          b.attendeeId === actor.id ||
          (actor.role === "practitioner" &&
            p.practices.some(
              (pr) => pr.id === b.practiceId && pr.ownerId === actor.id,
            )),
      ),
      familyLinks: grants.rows,
    });
  });
  api.post("/account/close", async (c) => {
    const actor = requireActor(c);
    z.object({ confirmation: z.literal("DELETE") }).parse(await c.req.json());
    if (actor.role === "operator")
      fail(
        409,
        "Transfer operator responsibilities before closing this account.",
      );
    await transaction(async (db) => {
      await db.query(
        "SELECT user_id FROM circle_profiles WHERE user_id=$1 FOR NO KEY UPDATE",
        [actor.id],
      );
      const practices = await db.query(
        `UPDATE circle_practices SET status='Suspended',accepting_requests=false,name='Closed practice',bio='',qualification='',languages='{}',address='Chandigarh',contact_email='',phone='',review_note='Account closed',updated_at=now() WHERE owner_id=$1 RETURNING id`,
        [actor.id],
      );
      await db.query(
        `UPDATE circle_services SET active=false WHERE practice_id=ANY($1::uuid[])`,
        [practices.rows.map((r) => r.id)],
      );
      const cancelled = await db.query(
        `UPDATE circle_bookings SET status='Cancelled',reason='Account closed',updated_at=now() WHERE (attendee_id=$1 OR practice_id=ANY($2::uuid[])) AND status IN ('Requested','Confirmed') RETURNING id,attendee_id,requester_id,practice_id`,
        [actor.id, practices.rows.map((r) => r.id)],
      );
      for (const b of cancelled.rows) {
        await db.query(
          `INSERT INTO circle_booking_events(booking_id,status,actor_id,actor_name,note) VALUES($1,'Cancelled',$2,'Closed account','Account closed')`,
          [b.id, actor.id],
        );
        const practitioner = (
          await db.query("SELECT owner_id FROM circle_practices WHERE id=$1", [
            b.practice_id,
          ])
        ).rows[0]?.owner_id;
        const recipients = new Set<string>(
          [b.attendee_id, practitioner].filter(Boolean),
        );
        const requesterStillAuthorised =
          b.requester_id === b.attendee_id ||
          (
            await db.query(
              "SELECT id FROM circle_family_links WHERE organiser_id=$1 AND member_id=$2 AND status='Active'",
              [b.requester_id, b.attendee_id],
            )
          ).rowCount;
        if (requesterStillAuthorised) recipients.add(b.requester_id);
        for (const user of recipients)
          if (user !== actor.id)
            await notify(
              db,
              user,
              "Appointment cancelled",
              "An appointment was cancelled because an account was closed.",
              b.id,
            );
      }
      await db.query(
        `UPDATE circle_bookings SET attendee_name='Closed account',note='',session_details='',follow_up_text=NULL,follow_up_due_date=NULL,follow_up_completed_at=NULL WHERE attendee_id=$1`,
        [actor.id],
      );
      await db.query(
        `UPDATE circle_bookings SET requester_name='Closed account' WHERE requester_id=$1`,
        [actor.id],
      );
      await db.query(
        `UPDATE circle_bookings SET practitioner_name='Closed practice' WHERE practice_id=ANY($1::uuid[])`,
        [practices.rows.map((r) => r.id)],
      );
      await db.query(
        `UPDATE circle_booking_events SET actor_name='Closed account',note=NULL WHERE actor_id=$1 OR booking_id IN (SELECT id FROM circle_bookings WHERE attendee_id=$1)`,
        [actor.id],
      );
      await db.query(
        `UPDATE circle_family_links SET status='Revoked',revoked_at=now() WHERE (organiser_id=$1 OR member_id=$1) AND status='Active'`,
        [actor.id],
      );
      await db.query(
        `UPDATE circle_invitations SET status=CASE WHEN status='Pending' THEN 'Revoked' ELSE status END,email='closed@invalid.local' WHERE inviter_id=$1 OR accepted_by=$1 OR email=$2`,
        [actor.id, actor.email],
      );
      await db.query("DELETE FROM circle_notifications WHERE user_id=$1", [
        actor.id,
      ]);
      await db.query(
        "DELETE FROM circle_outbox WHERE user_id=$1 OR recipient=$2",
        [actor.id, actor.email],
      );
      await db.query('DELETE FROM "session" WHERE "userId"=$1', [actor.id]);
      await db.query('DELETE FROM "account" WHERE "userId"=$1', [actor.id]);
      const email = `closed-${actor.id}@invalid.local`;
      await db.query(
        `UPDATE "user" SET name='Closed account',email=$2,image=NULL,"updatedAt"=now() WHERE id=$1`,
        [actor.id, email],
      );
      await db.query(
        `UPDATE circle_profiles SET name='Closed account',email=$2,closed_at=now() WHERE user_id=$1`,
        [actor.id, email],
      );
      await audit(db, actor.id, "account.closed", actor.id);
    });
    return c.json({ ok: true });
  });
  registerPracticeRoutes(api);
  app.route("/api", api);
  app.notFound((c) => c.json({ error: "This endpoint does not exist." }, 404));
  app.onError((error, c) => {
    if (error instanceof HTTPException)
      return c.json({ error: error.message }, error.status);
    if (error instanceof ZodError)
      return c.json(
        {
          error: error.issues
            .map((i) => `${i.path.join(".") || "Request"}: ${i.message}`)
            .join("; "),
        },
        400,
      );
    if (error instanceof SyntaxError)
      return c.json({ error: "Send valid JSON." }, 400);
    const code = (error as { code?: string }).code;
    if (code === "23514" || code === "23505" || code === "23P01")
      return c.json(
        {
          error:
            "This change conflicts with existing information. Refresh and try again.",
        },
        409,
      );
    console.error("Circle API request failed", {
      path: c.req.path.split("?")[0],
      code: code || error.name,
    });
    return c.json(
      { error: "Circle could not complete this request. Please try again." },
      500,
    );
  });
  return app;
}
