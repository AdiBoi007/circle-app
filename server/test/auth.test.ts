import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";
import type {
  LiveBootstrap,
  LiveInvitationPreview,
} from "../../src/live/types.js";

const envFile = fileURLToPath(new URL("../.env", import.meta.url));
if (existsSync(envFile)) process.loadEnvFile(envFile);
process.env.NODE_ENV = "test";
process.env.MAIL_TRANSPORT = "disabled";
process.env.AUTH_SECRET ??=
  "auth-tests-only-secret-not-for-any-live-environment";

type Browser = {
  email: string;
  name: string;
  cookie: string;
  ip: string;
  id?: string;
};
type Invitation = { id: string; url: string };
type ApiError = { error?: string; message?: string };

test(
  "Real HTTP invitation and BetterAuth session integration",
  {
    skip:
      !process.env.TEST_DATABASE_URL &&
      "Set TEST_DATABASE_URL to a disposable PostgreSQL database.",
    timeout: 120_000,
  },
  async (suite) => {
    // Select the test database before importing the application. No injected actor or auth mock.
    const { pool, transaction } = await import("../src/db.js");
    const { migrate } = await import("../src/migrate.js");
    const { createApp } = await import("../src/app.js");
    const { config } = await import("../src/config.js");
    const { createInvitation, FAMILY_CONSENT } = await import(
      "../src/invitations.js"
    );
    await migrate(pool);
    const app = createApp();
    const run = randomUUID();
    const browsers: Browser[] = [];
    const invitationIds: string[] = [];
    const makeBrowser = (label: string): Browser => {
      const bytes = randomBytes(2);
      const browser = {
        email: `auth-${run}-${label}@example.test`,
        name: `Auth test ${label}`,
        cookie: "",
        ip: `198.19.${bytes[0]}.${bytes[1]}`,
      };
      browsers.push(browser);
      return browser;
    };
    const anonymous = makeBrowser("anonymous");
    const operator = makeBrowser("operator");
    const organiser = makeBrowser("organiser");
    const member = makeBrowser("member");
    const practitioner = makeBrowser("practitioner");
    const password = `Test-only-${randomUUID()}!`;

    async function request<T = ApiError>(
      method: string,
      path: string,
      browser = anonymous,
      body?: unknown,
      headers?: Record<string, string>,
    ) {
      const response = await app.request(`${config.apiUrl}/api${path}`, {
        method,
        headers: {
          origin: config.appUrl,
          "content-type": "application/json",
          "x-forwarded-for": browser.ip,
          ...(browser.cookie ? { cookie: browser.cookie } : {}),
          ...headers,
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
      return {
        response,
        status: response.status,
        body: (await response.json()) as T,
      };
    }
    function expectStatus(result: { status: number }, expected: number) {
      // Do not include response bodies in assertion output: successful auth bodies contain session tokens.
      assert.equal(result.status, expected);
    }
    function keepCookie(browser: Browser, response: Response) {
      const cookie = response.headers
        .getSetCookie()
        .map((value) => value.split(";", 1)[0])
        .join("; ");
      assert(
        cookie.includes("session_token="),
        "BetterAuth must return its signed session cookie.",
      );
      browser.cookie = cookie;
    }
    const token = (invitation: Invitation) => {
      const value = new URL(invitation.url).searchParams.get("invite");
      assert(value, "Invitation URL must contain a token.");
      return value;
    };
    async function invite(
      browser: Browser,
      role: "client" | "practitioner" = "client",
      inviter = operator,
      family = false,
    ) {
      const result = await request<Invitation>(
        "POST",
        "/invitations",
        inviter,
        {
          email: browser.email,
          role,
          ...(family ? { purpose: "family" } : {}),
        },
      );
      expectStatus(result, 201);
      invitationIds.push(result.body.id);
      return result.body;
    }
    async function signUp(
      browser: Browser,
      invitation: Invitation,
      extra: Record<string, unknown> = {},
    ) {
      const result = await request<{ user: { id: string } }>(
        "POST",
        "/auth/sign-up/email",
        browser,
        { email: browser.email, name: browser.name, password, ...extra },
        { "x-circle-invitation": token(invitation) },
      );
      expectStatus(result, 200);
      browser.id = result.body.user.id;
      keepCookie(browser, result.response);
      return result;
    }
    async function bootstrap(browser: Browser) {
      const result = await request<LiveBootstrap>("GET", "/bootstrap", browser);
      expectStatus(result, 200);
      return result.body;
    }

    suite.after(async () => {
      const emails = browsers.map((browser) => browser.email);
      const knownIds = browsers.flatMap((browser) =>
        browser.id ? [browser.id] : [],
      );
      try {
        await transaction(async (db) => {
          // Include any user created before a failed signup hook, plus anonymised closed accounts.
          const users = await db.query<{ id: string }>(
            'SELECT id FROM "user" WHERE email=ANY($1::text[]) OR id=ANY($2::text[])',
            [emails, knownIds],
          );
          const ids = users.rows.map((user) => user.id);
          await db.query(
            "DELETE FROM circle_outbox WHERE user_id=ANY($1::text[]) OR recipient=ANY($2::text[])",
            [ids, emails],
          );
          await db.query(
            "DELETE FROM circle_notifications WHERE user_id=ANY($1::text[])",
            [ids],
          );
          await db.query(
            "DELETE FROM circle_audit WHERE actor_id=ANY($1::text[]) OR target_id=ANY($2::text[])",
            [ids, invitationIds],
          );
          await db.query(
            "DELETE FROM circle_booking_keys WHERE requester_id=ANY($1::text[])",
            [ids],
          );
          await db.query(
            "DELETE FROM circle_booking_events WHERE booking_id IN (SELECT id FROM circle_bookings WHERE requester_id=ANY($1::text[]) OR attendee_id=ANY($1::text[]))",
            [ids],
          );
          await db.query(
            "DELETE FROM circle_bookings WHERE requester_id=ANY($1::text[]) OR attendee_id=ANY($1::text[])",
            [ids],
          );
          await db.query(
            "DELETE FROM circle_services WHERE practice_id IN (SELECT id FROM circle_practices WHERE owner_id=ANY($1::text[]))",
            [ids],
          );
          await db.query(
            "DELETE FROM circle_practices WHERE owner_id=ANY($1::text[])",
            [ids],
          );
          await db.query(
            "DELETE FROM circle_family_links WHERE organiser_id=ANY($1::text[]) OR member_id=ANY($1::text[])",
            [ids],
          );
          await db.query(
            "DELETE FROM circle_invitations WHERE id=ANY($1::uuid[]) OR inviter_id=ANY($2::text[]) OR accepted_by=ANY($2::text[])",
            [invitationIds, ids],
          );
          await db.query(
            "DELETE FROM circle_rate_limits WHERE key=ANY($1::text[])",
            [ids],
          );
          await db.query(
            "DELETE FROM circle_profiles WHERE user_id=ANY($1::text[])",
            [ids],
          );
          await db.query('DELETE FROM "user" WHERE id=ANY($1::text[])', [ids]);
        });
      } finally {
        await pool.end();
      }
    });

    await suite.test(
      "signup requires a current matching invitation and derives the role from it",
      async () => {
        expectStatus(await request("GET", "/bootstrap"), 401);
        expectStatus(
          await request("POST", "/auth/sign-up/email", anonymous, {
            email: anonymous.email,
            name: anonymous.name,
            password,
          }),
          400,
        );
        const initial = await transaction((db) =>
          createInvitation(db, {
            email: operator.email,
            role: "operator",
            purpose: "beta",
            inviterId: null,
          }),
        );
        invitationIds.push(initial.id);
        const preview = await request<LiveInvitationPreview>(
          "GET",
          `/invitations/preview?token=${token(initial)}`,
        );
        expectStatus(preview, 200);
        assert.equal(preview.body.email, operator.email);
        assert.equal(preview.body.role, "operator");
        expectStatus(
          await request(
            "POST",
            "/auth/sign-up/email",
            anonymous,
            { email: anonymous.email, name: anonymous.name, password },
            { "x-circle-invitation": token(initial) },
          ),
          400,
        );
        expectStatus(
          await request(
            "POST",
            "/auth/sign-up/email",
            operator,
            { email: operator.email, name: "X".repeat(81), password },
            { "x-circle-invitation": token(initial) },
          ),
          400,
        );
        assert.equal(
          (
            await pool.query(
              'SELECT id FROM "user" WHERE email=ANY($1::text[])',
              [[anonymous.email, operator.email]],
            )
          ).rowCount,
          0,
        );
        await signUp(operator, initial, { role: "client" });
        const own = await bootstrap(operator);
        assert.equal(own.profile.id, operator.id);
        assert.equal(own.profile.role, "operator");
        assert(own.operator);
        expectStatus(
          await request("GET", `/invitations/preview?token=${token(initial)}`),
          400,
        );
        expectStatus(
          await request(
            "POST",
            "/auth/sign-up/email",
            operator,
            { email: operator.email, name: operator.name, password },
            { "x-circle-invitation": token(initial) },
          ),
          400,
        );
      },
    );

    let practiceId = "";
    let serviceId = "";
    await suite.test(
      "signed cookies enforce client, practitioner and operator permissions without role escalation",
      async () => {
        await signUp(organiser, await invite(organiser), { role: "operator" });
        await signUp(member, await invite(member));
        await signUp(practitioner, await invite(practitioner, "practitioner"));
        const personal = await bootstrap(organiser);
        assert.equal(personal.profile.role, "client");
        assert.equal(personal.operator, undefined);
        assert.deepEqual(personal.bookings, []);
        assert.deepEqual(personal.notifications, []);
        assert.deepEqual(personal.familyLinks, []);
        assert.deepEqual(personal.invitations, []);
        const ownPractice = (await bootstrap(practitioner)).practices;
        assert.equal(ownPractice.length, 1);
        assert.equal(ownPractice[0]!.ownerId, practitioner.id);
        assert.equal(ownPractice[0]!.status, "Pending");
        practiceId = ownPractice[0]!.id;
        expectStatus(
          await request("POST", "/invitations", organiser, {
            email: makeBrowser("escalation").email,
            role: "practitioner",
          }),
          403,
        );
        expectStatus(
          await request("POST", "/invitations", practitioner, {
            email: makeBrowser("practitioner-invite").email,
            role: "client",
          }),
          403,
        );
        expectStatus(
          await request("POST", "/invitations", operator, {
            email: makeBrowser("operator-invite").email,
            role: "operator",
          }),
          400,
        );
        expectStatus(
          await request(
            "POST",
            `/operator/practices/${practiceId}/review`,
            organiser,
            { status: "Approved", reason: "Not permitted" },
          ),
          403,
        );
        expectStatus(await request("PUT", "/practice", organiser, {}), 403);
        expectStatus(
          await request(
            "PUT",
            "/profile",
            organiser,
            { name: "Changed", viewPreference: "simple" },
            { origin: "https://untrusted.example.test" },
          ),
          403,
        );
        const conflictingRole = await invite(organiser, "practitioner");
        expectStatus(
          await request("POST", "/invitations/accept", organiser, {
            token: token(conflictingRole),
          }),
          409,
        );
        assert.equal((await bootstrap(organiser)).profile.role, "client");
        expectStatus(
          await request(
            "POST",
            `/invitations/${conflictingRole.id}/revoke`,
            operator,
            {},
          ),
          200,
        );

        expectStatus(
          await request("PUT", "/practice", practitioner, {
            name: "Auth Test Clinic",
            title: "Physiotherapist",
            category: "Physiotherapy",
            bio: "An isolated test practice used to check real family appointment access.",
            qualification: "Test qualification",
            languages: ["Hindi"],
            address: "Test clinic, Sector 22, Chandigarh",
            contactEmail: practitioner.email,
            phone: "",
            acceptingRequests: true,
          }),
          200,
        );
        expectStatus(
          await request("PUT", "/practice/hours", practitioner, {
            hours: Array.from({ length: 7 }, (_, day) => ({
              day,
              enabled: true,
              start: "09:00",
              end: "17:00",
            })),
          }),
          200,
        );
        const service = await request<{ id: string }>(
          "POST",
          "/practice/services",
          practitioner,
          {
            name: "Auth test assessment",
            description: "",
            durationMinutes: 30,
            priceInr: 900,
            modes: ["Online"],
            active: true,
          },
        );
        expectStatus(service, 200);
        serviceId = service.body.id;
        expectStatus(
          await request(
            "POST",
            `/operator/practices/${practiceId}/review`,
            operator,
            {
              status: "Approved",
              reason: "Approved solely for this isolated integration test.",
            },
          ),
          200,
        );
      },
    );

    let memberBookingId = "";
    await suite.test(
      "family acceptance binds the signed-in email and revocation removes appointment access immediately",
      async () => {
        const invitation = await invite(member, "client", organiser, true);
        const preview = await request<LiveInvitationPreview>(
          "GET",
          `/invitations/preview?token=${token(invitation)}`,
        );
        expectStatus(preview, 200);
        assert.equal(preview.body.purpose, "family");
        assert.equal(preview.body.consentText, FAMILY_CONSENT);
        expectStatus(
          await request("POST", "/invitations/accept", anonymous, {
            token: token(invitation),
          }),
          401,
        );
        expectStatus(
          await request("POST", "/invitations/accept", practitioner, {
            token: token(invitation),
          }),
          400,
        );
        expectStatus(
          await request("POST", "/invitations/accept", member, {
            token: token(invitation),
          }),
          200,
        );
        expectStatus(
          await request("POST", "/invitations/accept", member, {
            token: token(invitation),
          }),
          200,
        );
        const family = (await bootstrap(organiser)).familyLinks;
        assert.equal(family.length, 1);
        const grant = family[0]!;
        assert.equal(grant.memberId, member.id);
        assert.equal(grant.status, "Active");
        assert.equal((await bootstrap(member)).familyLinks[0]!.id, grant.id);
        assert(
          !(await bootstrap(practitioner)).familyLinks.some(
            (item) => item.id === grant.id,
          ),
        );
        const now = (
          await pool.query<{ now: Date }>("SELECT clock_timestamp() AS now")
        ).rows[0]!.now;
        const date = new Date(now.getTime() + 2 * 86400_000 + 330 * 60_000)
          .toISOString()
          .slice(0, 10);
        const booking = await request<{ id: string }>(
          "POST",
          "/bookings",
          member,
          {
            serviceId,
            attendeeId: member.id,
            date,
            time: "10:00",
            mode: "Online",
            note: "A private test consultation note.",
            expectedPriceInr: 900,
            expectedDurationMinutes: 30,
            idempotencyKey: randomUUID(),
          },
        );
        expectStatus(booking, 201);
        memberBookingId = booking.body.id;
        assert(
          (await bootstrap(organiser)).bookings.some(
            (item) =>
              item.id === memberBookingId &&
              item.note === "A private test consultation note.",
          ),
        );
        expectStatus(
          await request("POST", `/family/${grant.id}/revoke`, operator, {}),
          404,
        );
        expectStatus(
          await request("POST", `/family/${grant.id}/revoke`, member, {}),
          200,
        );
        assert(
          !(await bootstrap(organiser)).bookings.some(
            (item) => item.id === memberBookingId,
          ),
        );
        assert(
          (await bootstrap(member)).bookings.some(
            (item) => item.id === memberBookingId,
          ),
        );
        expectStatus(
          await request(
            "POST",
            `/bookings/${memberBookingId}/cancel`,
            organiser,
            { reason: "Access should be removed" },
          ),
          404,
        );
        assert.equal(
          (await bootstrap(organiser)).familyLinks.find(
            (item) => item.id === grant.id,
          )!.status,
          "Revoked",
        );
        // Replaying the already accepted token must not restore a grant the member removed.
        expectStatus(
          await request("POST", "/invitations/accept", member, {
            token: token(invitation),
          }),
          200,
        );
        assert(
          !(await bootstrap(organiser)).familyLinks.some(
            (item) => item.status === "Active",
          ),
        );
      },
    );

    await suite.test(
      "revoked and expired invitations cannot sign up; sign-out invalidates the original session cookie",
      async () => {
        const revoked = makeBrowser("revoked");
        const revokedInvite = await invite(revoked);
        expectStatus(
          await request(
            "POST",
            `/invitations/${revokedInvite.id}/revoke`,
            organiser,
            {},
          ),
          404,
        );
        expectStatus(
          await request(
            "POST",
            `/invitations/${revokedInvite.id}/revoke`,
            operator,
            {},
          ),
          200,
        );
        const expired = makeBrowser("expired");
        const expiredInvite = await invite(expired);
        await pool.query(
          "UPDATE circle_invitations SET expires_at=now()-interval '1 second' WHERE id=$1",
          [expiredInvite.id],
        );
        for (const [browser, invitation] of [
          [revoked, revokedInvite],
          [expired, expiredInvite],
        ] as const) {
          expectStatus(
            await request(
              "GET",
              `/invitations/preview?token=${token(invitation)}`,
            ),
            400,
          );
          expectStatus(
            await request(
              "POST",
              "/auth/sign-up/email",
              browser,
              { email: browser.email, name: browser.name, password },
              { "x-circle-invitation": token(invitation) },
            ),
            400,
          );
          assert.equal(
            (
              await pool.query('SELECT id FROM "user" WHERE email=$1', [
                browser.email,
              ])
            ).rowCount,
            0,
          );
        }
        expectStatus(
          await request("POST", "/auth/sign-out", organiser, {}),
          200,
        );
        // Intentionally replay the old cookie rather than merely clearing a local variable.
        expectStatus(await request("GET", "/bootstrap", organiser), 401);
        const signedIn = await request(
          "POST",
          "/auth/sign-in/email",
          organiser,
          { email: organiser.email, password },
        );
        expectStatus(signedIn, 200);
        keepCookie(organiser, signedIn.response);
        assert.equal((await bootstrap(organiser)).profile.id, organiser.id);
        expectStatus(
          await request("POST", "/auth/request-password-reset", organiser, {
            email: organiser.email,
          }),
          503,
        );
      },
    );

    await suite.test(
      "account closure revokes sessions and appointments; closed profiles cannot create new sessions",
      async () => {
        expectStatus(
          await request("POST", "/account/close", operator, {
            confirmation: "DELETE",
          }),
          409,
        );
        expectStatus(
          await request("POST", "/account/close", member, {
            confirmation: "wrong",
          }),
          400,
        );
        expectStatus(
          await request("POST", "/account/close", member, {
            confirmation: "DELETE",
          }),
          200,
        );
        expectStatus(await request("GET", "/bootstrap", member), 401);
        expectStatus(
          await request("POST", "/auth/sign-in/email", member, {
            email: member.email,
            password,
          }),
          401,
        );
        assert.equal(
          (
            await pool.query('SELECT id FROM "session" WHERE "userId"=$1', [
              member.id,
            ])
          ).rowCount,
          0,
        );
        assert.equal(
          (
            await pool.query("SELECT status FROM circle_bookings WHERE id=$1", [
              memberBookingId,
            ])
          ).rows[0].status,
          "Cancelled",
        );

        // Retain credentials for this separate identity to exercise the session-create guard itself.
        await pool.query(
          "UPDATE circle_profiles SET closed_at=now() WHERE user_id=$1",
          [organiser.id],
        );
        expectStatus(await request("GET", "/bootstrap", organiser), 403);
        await pool.query('DELETE FROM "session" WHERE "userId"=$1', [
          organiser.id,
        ]);
        const denied = await request("POST", "/auth/sign-in/email", organiser, {
          email: organiser.email,
          password,
        });
        assert(
          denied.status >= 400,
          "Closed profiles must not obtain a new signed session.",
        );
        assert.equal(
          (
            await pool.query('SELECT id FROM "session" WHERE "userId"=$1', [
              organiser.id,
            ])
          ).rowCount,
          0,
        );
        expectStatus(await request("GET", "/bootstrap", organiser), 401);
      },
    );
  },
);
