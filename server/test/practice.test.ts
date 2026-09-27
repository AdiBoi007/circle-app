import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type { Actor, ApiEnv } from "../src/core.js";

const envFile = fileURLToPath(new URL("../.env", import.meta.url));
if (existsSync(envFile)) process.loadEnvFile(envFile);
process.env.NODE_ENV = "test";
process.env.AUTH_SECRET ??=
  "practice-tests-only-secret-not-for-any-live-environment";

test(
  "PostgreSQL practitioner, appointment and family-permission integration",
  {
    skip:
      !process.env.TEST_DATABASE_URL &&
      "Set TEST_DATABASE_URL to a disposable PostgreSQL database.",
  },
  async (suite) => {
    // Import after selecting the test database; never silently fall back to DATABASE_URL.
    const { pool } = await import("../src/db.js");
    const { migrate } = await import("../src/migrate.js");
    const { registerPracticeRoutes, getPracticeBootstrap } = await import(
      "../src/practice.js"
    );
    await migrate(pool);
    const actors: Record<string, Actor> = Object.fromEntries(
      [
        ["clientA", "client"],
        ["clientB", "client"],
        ["organiser", "client"],
        ["owner", "practitioner"],
        ["otherOwner", "practitioner"],
        ["operator", "operator"],
      ].map(([key, role]) => {
        const id = `practice-test-${randomUUID()}`;
        return [
          key,
          {
            id,
            name: `Test ${key}`,
            email: `${id}@example.invalid`,
            role: role as Actor["role"],
          },
        ];
      }),
    );
    const ids = Object.values(actors).map((actor) => actor.id);
    const app = new Hono<ApiEnv>();
    app.use("*", async (c, next) => {
      const actor = Object.values(actors).find(
        (item) => item.id === c.req.header("x-test-actor"),
      );
      if (actor) c.set("actor", actor);
      await next();
    });
    app.onError((error, c) => {
      if (error instanceof HTTPException)
        return c.json({ error: error.message }, error.status);
      console.error(error);
      return c.json({ error: "Unexpected server error in test." }, 500);
    });
    registerPracticeRoutes(app);
    async function request(
      method: string,
      path: string,
      actor?: Actor,
      value?: unknown,
    ) {
      const response = await app.request(`http://localhost${path}`, {
        method,
        headers: {
          "content-type": "application/json",
          ...(actor ? { "x-test-actor": actor.id } : {}),
        },
        ...(value === undefined ? {} : { body: JSON.stringify(value) }),
      });
      return {
        status: response.status,
        body: (await response.json()) as {
          id?: string;
          error?: string;
          times?: string[];
          ok?: boolean;
        },
      };
    }
    suite.after(async () => {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        await client.query(
          "DELETE FROM circle_outbox WHERE user_id=ANY($1::text[])",
          [ids],
        );
        await client.query(
          "DELETE FROM circle_notifications WHERE user_id=ANY($1::text[])",
          [ids],
        );
        await client.query(
          "DELETE FROM circle_audit WHERE actor_id=ANY($1::text[])",
          [ids],
        );
        await client.query(
          "DELETE FROM circle_booking_keys WHERE requester_id=ANY($1::text[])",
          [ids],
        );
        await client.query(
          "DELETE FROM circle_booking_events WHERE booking_id IN (SELECT id FROM circle_bookings WHERE requester_id=ANY($1::text[]))",
          [ids],
        );
        await client.query(
          "DELETE FROM circle_bookings WHERE requester_id=ANY($1::text[])",
          [ids],
        );
        await client.query(
          "DELETE FROM circle_services WHERE practice_id IN (SELECT id FROM circle_practices WHERE owner_id=ANY($1::text[]))",
          [ids],
        );
        await client.query(
          "DELETE FROM circle_practices WHERE owner_id=ANY($1::text[])",
          [ids],
        );
        await client.query(
          "DELETE FROM circle_family_links WHERE organiser_id=ANY($1::text[]) OR member_id=ANY($1::text[])",
          [ids],
        );
        await client.query(
          "DELETE FROM circle_profiles WHERE user_id=ANY($1::text[])",
          [ids],
        );
        await client.query('DELETE FROM "user" WHERE id=ANY($1::text[])', [
          ids,
        ]);
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
        await pool.end();
      }
    });
    for (const actor of Object.values(actors)) {
      await pool.query(
        'INSERT INTO "user"(id,name,email,"emailVerified","createdAt","updatedAt") VALUES($1,$2,$3,true,now(),now())',
        [actor.id, actor.name, actor.email],
      );
      await pool.query(
        "INSERT INTO circle_profiles(user_id,name,email,role) VALUES($1,$2,$3,$4)",
        [actor.id, actor.name, actor.email, actor.role],
      );
    }
    const profile = {
      name: "Test Chandigarh Practice",
      title: "Physiotherapist",
      category: "Physiotherapy",
      bio: "A test practice for isolated integration checks in Chandigarh.",
      qualification: "Test physiotherapy qualification",
      languages: ["English", "Hindi"],
      address: "Test clinic, Sector 22, Chandigarh",
      contactEmail: actors.owner!.email,
      phone: "",
      acceptingRequests: true,
    };
    const profileResponse = await request(
      "PUT",
      "/practice",
      actors.owner,
      profile,
    );
    assert.equal(
      profileResponse.status,
      200,
      JSON.stringify(profileResponse.body),
    );
    const practiceId = profileResponse.body.id!;
    await pool.query(
      "UPDATE circle_practices SET status='Approved' WHERE id=$1",
      [practiceId],
    );
    const hours = Array.from({ length: 7 }, (_, day) => ({
      day,
      enabled: true,
      start: "09:00",
      end: "18:00",
    }));
    assert.equal(
      (await request("PUT", "/practice/hours", actors.owner, { hours })).status,
      200,
    );
    const serviceInput = {
      name: "Test assessment",
      description: "Integration test appointment",
      durationMinutes: 30,
      priceInr: 900,
      modes: ["In person", "Online"],
      active: true,
    };
    const serviceResponse = await request(
      "POST",
      "/practice/services",
      actors.owner,
      serviceInput,
    );
    assert.equal(
      serviceResponse.status,
      200,
      JSON.stringify(serviceResponse.body),
    );
    const serviceId = serviceResponse.body.id!;
    const now = (
      await pool.query<{ now: Date }>("SELECT clock_timestamp() AS now")
    ).rows[0]!.now;
    const date = new Date(now.getTime() + 2 * 86400_000 + 330 * 60_000)
      .toISOString()
      .slice(0, 10);
    const laterDate = new Date(now.getTime() + 3 * 86400_000 + 330 * 60_000)
      .toISOString()
      .slice(0, 10);
    let reviewedPriceInr = serviceInput.priceInr;
    let reviewedDurationMinutes = serviceInput.durationMinutes;
    const input = (actor: Actor, time: string, extra = {}) => ({
      serviceId,
      attendeeId: actor.id,
      date,
      time,
      mode: "In person",
      note: "Private attendee information",
      expectedPriceInr: reviewedPriceInr,
      expectedDurationMinutes: reviewedDurationMinutes,
      idempotencyKey: randomUUID(),
      ...extra,
    });
    let bookingA = "";
    let pendingB = "";

    await suite.test(
      "roles, strict inputs and service ownership are enforced",
      async () => {
        assert.equal(
          (
            await request(
              "GET",
              `/slots?serviceId=${serviceId}&date=${date}&mode=In%20person`,
            )
          ).status,
          401,
        );
        assert.equal(
          (await request("PUT", "/practice", actors.clientA, profile)).status,
          403,
        );
        assert.equal(
          (
            await request("PUT", "/practice", actors.owner, {
              ...profile,
              status: "Approved",
            })
          ).status,
          400,
        );
        assert.equal(
          (
            await request("POST", "/practice/services", actors.owner, {
              ...serviceInput,
              priceInr: -1,
            })
          ).status,
          400,
        );
        await request("PUT", "/practice", actors.otherOwner, {
          ...profile,
          name: "Other test practice",
          contactEmail: actors.otherOwner!.email,
        });
        assert.equal(
          (
            await request("POST", "/practice/services", actors.otherOwner, {
              ...serviceInput,
              id: serviceId,
            })
          ).status,
          404,
        );
        assert.equal(
          (
            await request(
              "DELETE",
              `/practice/services/${serviceId}`,
              actors.otherOwner,
            )
          ).status,
          404,
        );
      },
    );

    await suite.test(
      "concurrent idempotent requests persist once with one event and one notification per recipient",
      async () => {
        const payload = input(actors.clientA!, "10:00");
        const responses = await Promise.all(
          Array.from({ length: 3 }, () =>
            request("POST", "/bookings", actors.clientA, payload),
          ),
        );
        for (const response of responses)
          assert.equal(response.status, 201, JSON.stringify(response.body));
        bookingA = responses[0]!.body.id!;
        assert(responses.every((response) => response.body.id === bookingA));
        assert.equal(
          (
            await pool.query(
              "SELECT id FROM circle_booking_events WHERE booking_id=$1",
              [bookingA],
            )
          ).rowCount,
          1,
        );
        assert.equal(
          (
            await pool.query(
              "SELECT id FROM circle_notifications WHERE booking_id=$1 AND user_id=$2",
              [bookingA, actors.owner!.id],
            )
          ).rowCount,
          1,
        );
        assert.equal(
          (
            await request("POST", "/bookings", actors.clientA, {
              ...payload,
              note: "Different payload",
            })
          ).status,
          409,
        );
        const independent = await pool.connect();
        try {
          assert.equal(
            (
              await independent.query(
                "SELECT status FROM circle_bookings WHERE id=$1",
                [bookingA],
              )
            ).rows[0].status,
            "Requested",
          );
        } finally {
          independent.release();
        }
        assert(
          (await getPracticeBootstrap(pool, actors.clientA!)).bookings.some(
            (booking) => booking.id === bookingA,
          ),
        );
        assert(
          !(await getPracticeBootstrap(pool, actors.clientB!)).bookings.some(
            (booking) => booking.id === bookingA,
          ),
        );
      },
    );

    await suite.test(
      "pending requests do not reserve slots; competing confirmations commit only once",
      async () => {
        const available = await request(
          "GET",
          `/slots?serviceId=${serviceId}&date=${date}&mode=In%20person`,
          actors.clientB,
        );
        assert(available.body.times?.includes("10:00"));
        const second = await request(
          "POST",
          "/bookings",
          actors.clientB,
          input(actors.clientB!, "10:00"),
        );
        assert.equal(second.status, 201);
        pendingB = second.body.id!;
        const results = await Promise.all(
          [bookingA, pendingB].map((id) =>
            request("POST", `/bookings/${id}/confirm`, actors.owner, {
              sessionDetails: "Test clinic address in Chandigarh",
            }),
          ),
        );
        assert.deepEqual(
          results.map((response) => response.status).sort(),
          [200, 409],
        );
        const confirmed = await pool.query(
          "SELECT id FROM circle_bookings WHERE practice_id=$1 AND starts_at=$2 AND status='Confirmed'",
          [practiceId, `${date}T10:00:00+05:30`],
        );
        assert.equal(confirmed.rowCount, 1);
        bookingA = confirmed.rows[0].id as string;
        pendingB =
          [results[0]!.status, results[1]!.status].indexOf(409) === 0
            ? ((
                await pool.query(
                  "SELECT id FROM circle_bookings WHERE practice_id=$1 AND status='Requested'",
                  [practiceId],
                )
              ).rows[0].id as string)
            : second.body.id!;
        const next = await request(
          "GET",
          `/slots?serviceId=${serviceId}&date=${date}&mode=In%20person`,
          actors.clientA,
        );
        assert(!next.body.times?.includes("10:00"));
        assert(next.body.times?.includes("10:30"));
        const adjacent = await request(
          "POST",
          "/bookings",
          actors.clientA,
          input(actors.clientA!, "10:30"),
        );
        assert.equal(adjacent.status, 201);
        assert.equal(
          (
            await request(
              "POST",
              `/bookings/${adjacent.body.id}/confirm`,
              actors.owner,
              { sessionDetails: "Test clinic address in Chandigarh" },
            )
          ).status,
          200,
        );
      },
    );

    await suite.test(
      "past, impossible and off-grid dates/times cannot create appointments",
      async () => {
        for (const override of [
          { date: "2026-02-30" },
          { date: "2020-01-01" },
          { time: "25:00" },
          { time: "11:15" },
          { mode: "Home visit" },
        ]) {
          const response = await request(
            "POST",
            "/bookings",
            actors.clientA,
            input(actors.clientA!, "11:00", override),
          );
          assert(
            [400, 409].includes(response.status),
            JSON.stringify(response),
          );
        }
      },
    );

    await suite.test(
      "confirmed appointments protect availability and all status transitions require ownership/details",
      async () => {
        assert.equal(
          (
            await request("PUT", "/practice/hours", actors.owner, {
              hours: hours.map((day) => ({ ...day, enabled: false })),
            })
          ).status,
          409,
        );
        assert.equal(
          (
            await request("POST", "/practice/blocked-dates", actors.owner, {
              date,
            })
          ).status,
          409,
        );
        assert.equal(
          (
            await request(
              "POST",
              `/bookings/${bookingA}/complete`,
              actors.owner,
              {},
            )
          ).status,
          409,
        );
        assert.equal(
          (
            await request(
              "POST",
              `/bookings/${pendingB}/confirm`,
              actors.otherOwner,
              { sessionDetails: "A different clinic" },
            )
          ).status,
          404,
        );
        assert.equal(
          (
            await request(
              "POST",
              `/bookings/${pendingB}/confirm`,
              actors.owner,
              { sessionDetails: "" },
            )
          ).status,
          400,
        );
        assert.equal(
          (
            await request(
              "POST",
              `/bookings/${pendingB}/decline`,
              actors.owner,
              { reason: "Time unavailable" },
            )
          ).status,
          200,
        );
        assert.equal(
          (
            await request(
              "POST",
              `/bookings/${pendingB}/cancel`,
              actors.owner,
              { reason: "Changed" },
            )
          ).status,
          409,
        );
        assert.equal(
          (
            await request(
              "DELETE",
              `/practice/services/${serviceId}`,
              actors.owner,
            )
          ).status,
          409,
        );
      },
    );

    await suite.test(
      "changed fees and durations require a fresh review while committed retries keep the original quote",
      async () => {
        const reviewed = input(actors.clientA!, "09:00", { date: laterDate });
        const count = async () =>
          (await pool.query("SELECT id FROM circle_bookings WHERE practice_id=$1", [practiceId])).rowCount;
        const before = await count();
        for (const invalid of [
          { ...reviewed, expectedPriceInr: undefined },
          { ...reviewed, expectedDurationMinutes: undefined },
          { ...reviewed, expectedPriceInr: "900" },
          { ...reviewed, expectedDurationMinutes: 0 },
        ]) {
          assert.equal((await request("POST", "/bookings", actors.clientA, invalid)).status, 400);
        }
        const updateQuote = async (priceInr: number, durationMinutes: number) => {
          const result = await request("POST", "/practice/services", actors.owner, {
            ...serviceInput,
            id: serviceId,
            priceInr,
            durationMinutes,
          });
          assert.equal(result.status, 200, JSON.stringify(result.body));
        };
        await updateQuote(1250, 30);
        const stalePrice = await request("POST", "/bookings", actors.clientA, reviewed);
        assert.equal(stalePrice.status, 409);
        assert.match(stalePrice.body.error!, /fee or duration changed/);
        await updateQuote(1250, 45);
        assert.equal((await request("POST", "/bookings", actors.clientA, {
          ...reviewed, expectedPriceInr: 1250,
        })).status, 409);
        assert.equal(await count(), before, "Stale quotes must not create appointments.");
        assert.equal((await pool.query(
          "SELECT idempotency_key FROM circle_booking_keys WHERE requester_id=$1 AND idempotency_key=$2",
          [actors.clientA!.id, reviewed.idempotencyKey],
        )).rowCount, 0, "Rejected quotes must not consume the idempotency key.");
        const refreshed = { ...reviewed, expectedPriceInr: 1250, expectedDurationMinutes: 45 };
        const created = await request("POST", "/bookings", actors.clientA, refreshed);
        assert.equal(created.status, 201, JSON.stringify(created.body));
        assert.equal(await count(), before! + 1);
        await updateQuote(1500, 60);
        const replay = await request("POST", "/bookings", actors.clientA, refreshed);
        assert.equal(replay.status, 201);
        assert.equal(replay.body.id, created.body.id);
        assert.equal((await request("POST", "/bookings", actors.clientA, {
          ...refreshed, expectedPriceInr: 1500, expectedDurationMinutes: 60,
        })).status, 409, "Changing the reviewed quote changes the idempotent request.");
        assert.equal((await request("POST", "/bookings", actors.clientA, {
          ...refreshed, expectedPriceInr: 1500, expectedDurationMinutes: 60, idempotencyKey: randomUUID(),
        })).status, 409, "A new key must not silently reuse an appointment with a different quote.");
        const snapshot = (await getPracticeBootstrap(pool, actors.clientA!)).bookings.find(booking => booking.id === created.body.id)!;
        assert.equal(snapshot.priceInr, 1250);
        assert.equal(snapshot.durationMinutes, 45);
        assert.equal((await request("POST", `/bookings/${created.body.id}/cancel`, actors.clientA, { reason: "Quote regression complete" })).status, 200);
        await updateQuote(serviceInput.priceInr, serviceInput.durationMinutes);
      },
    );

    await suite.test(
      "service edits preserve request snapshots and pausing stops new requests only",
      async () => {
        const future = await request(
          "POST",
          "/bookings",
          actors.clientA,
          input(actors.clientA!, "12:00"),
        );
        assert.equal(future.status, 201);
        const id = future.body.id!;
        assert.equal(
          (
            await request("POST", "/practice/services", actors.owner, {
              ...serviceInput,
              id: serviceId,
              durationMinutes: 60,
              priceInr: 1500,
            })
          ).status,
          200,
        );
        const snapshot = (
          await getPracticeBootstrap(pool, actors.clientA!)
        ).bookings.find((booking) => booking.id === id)!;
        assert.equal(snapshot.durationMinutes, 30);
        assert.equal(snapshot.priceInr, 900);
        reviewedPriceInr = 1500;
        reviewedDurationMinutes = 60;
        await pool.query(
          "UPDATE circle_practices SET accepting_requests=false WHERE id=$1",
          [practiceId],
        );
        assert.equal(
          (
            await request(
              "POST",
              "/bookings",
              actors.clientB,
              input(actors.clientB!, "15:00"),
            )
          ).status,
          409,
        );
        assert.equal(
          (
            await request("POST", `/bookings/${id}/confirm`, actors.owner, {
              sessionDetails: "Test clinic address in Chandigarh",
            })
          ).status,
          200,
        );
        await pool.query(
          "UPDATE circle_practices SET accepting_requests=true WHERE id=$1",
          [practiceId],
        );
        assert.equal(
          (
            await request("POST", "/practice/blocked-dates", actors.owner, {
              date: laterDate,
            })
          ).status,
          200,
        );
        assert.deepEqual(
          (
            await request(
              "GET",
              `/slots?serviceId=${serviceId}&date=${laterDate}&mode=Online`,
              actors.clientA,
            )
          ).body.times,
          [],
        );
        assert.equal(
          (
            await request("POST", "/practice/blocked-dates", actors.owner, {
              date: laterDate,
            })
          ).status,
          200,
        );
      },
    );

    await suite.test(
      "revoking a family grant removes organiser reads, mutations and idempotent replay access",
      async () => {
        assert.equal(
          (
            await request(
              "POST",
              "/bookings",
              actors.organiser,
              input(actors.clientB!, "14:00"),
            )
          ).status,
          404,
        );
        const link = await pool.query<{ id: string }>(
          "INSERT INTO circle_family_links(organiser_id,member_id) VALUES($1,$2) RETURNING id",
          [actors.organiser!.id, actors.clientB!.id],
        );
        const payload = input(actors.clientB!, "14:00");
        const response = await request(
          "POST",
          "/bookings",
          actors.organiser,
          payload,
        );
        assert.equal(response.status, 201);
        const id = response.body.id!;
        assert(
          (await getPracticeBootstrap(pool, actors.organiser!)).bookings.some(
            (booking) => booking.id === id,
          ),
        );
        await pool.query(
          "UPDATE circle_family_links SET status='Revoked',revoked_at=clock_timestamp() WHERE id=$1",
          [link.rows[0]!.id],
        );
        assert(
          !(await getPracticeBootstrap(pool, actors.organiser!)).bookings.some(
            (booking) => booking.id === id,
          ),
        );
        assert.equal(
          (
            await request("POST", `/bookings/${id}/cancel`, actors.organiser, {
              reason: "Changed",
            })
          ).status,
          404,
        );
        assert.equal(
          (await request("POST", "/bookings", actors.organiser, payload))
            .status,
          404,
        );
        assert.equal(
          (
            await request("POST", `/bookings/${id}/cancel`, actors.clientB, {
              reason: "I cannot attend",
            })
          ).status,
          200,
        );
        assert.equal(
          (
            await pool.query(
              "SELECT id FROM circle_notifications WHERE booking_id=$1 AND user_id=$2",
              [id, actors.organiser!.id],
            )
          ).rowCount,
          0,
        );
      },
    );

    await suite.test(
      "operator bootstrap redacts private notes and follow-up; authorised attendee can complete follow-up",
      async () => {
        assert.equal(
          (
            await request(
              "POST",
              `/bookings/${bookingA}/follow-up`,
              actors.otherOwner,
              { text: "Private care instructions", dueDate: laterDate },
            )
          ).status,
          404,
        );
        assert.equal(
          (
            await request(
              "POST",
              `/bookings/${bookingA}/follow-up`,
              actors.owner,
              { text: "Private care instructions", dueDate: laterDate },
            )
          ).status,
          200,
        );
        const booking = (
          await getPracticeBootstrap(pool, actors.operator!)
        ).bookings.find((item) => item.id === bookingA)!;
        assert.equal(booking.note, "");
        assert.equal(booking.sessionDetails, "");
        assert.equal(booking.followUp, undefined);
        assert(booking.events.every((event) => !event.note));
        assert.equal(
          (
            await request(
              "POST",
              `/bookings/${bookingA}/follow-up/complete`,
              actors.operator,
              {},
            )
          ).status,
          403,
        );
        const attendeeId = (
          await pool.query<{ attendee_id: string }>(
            "SELECT attendee_id FROM circle_bookings WHERE id=$1",
            [bookingA],
          )
        ).rows[0]!.attendee_id;
        const attendee = Object.values(actors).find(
          (actor) => actor.id === attendeeId,
        )!;
        assert.equal(
          (
            await request(
              "POST",
              `/bookings/${bookingA}/follow-up/complete`,
              attendee,
              {},
            )
          ).status,
          200,
        );
        assert(
          (await getPracticeBootstrap(pool, attendee)).bookings.find(
            (item) => item.id === bookingA,
          )!.followUp?.completedAt,
        );
      },
    );

    await suite.test(
      "an organiser closing their account does not block the attendee’s continuing care",
      async () => {
        await pool.query(
          "INSERT INTO circle_family_links(organiser_id,member_id) VALUES($1,$2)",
          [actors.organiser!.id, actors.clientB!.id],
        );
        const created = await request(
          "POST",
          "/bookings",
          actors.organiser,
          input(actors.clientB!, "15:00"),
        );
        assert.equal(created.status, 201);
        const id = created.body.id!;
        await pool.query(
          "UPDATE circle_profiles SET closed_at=clock_timestamp() WHERE user_id=$1",
          [actors.organiser!.id],
        );
        await pool.query(
          "UPDATE circle_family_links SET status='Revoked',revoked_at=clock_timestamp() WHERE organiser_id=$1",
          [actors.organiser!.id],
        );
        assert.equal(
          (
            await request("POST", `/bookings/${id}/confirm`, actors.owner, {
              sessionDetails: "Test clinic address in Chandigarh",
            })
          ).status,
          200,
        );
        assert.equal(
          (
            await request("POST", `/bookings/${id}/cancel`, actors.clientB, {
              reason: "I need a different appointment",
            })
          ).status,
          200,
        );
        assert.equal(
          (
            await pool.query(
              "SELECT id FROM circle_notifications WHERE booking_id=$1 AND user_id=$2",
              [id, actors.organiser!.id],
            )
          ).rowCount,
          0,
        );
      },
    );

    await suite.test(
      "completed visits use real server time and closed/suspended accounts cannot place new requests",
      async () => {
        await pool.query(
          "UPDATE circle_bookings SET appointment_date=appointment_date-7,starts_at=starts_at-interval '7 days',ends_at=ends_at-interval '7 days' WHERE id=$1",
          [bookingA],
        );
        assert.equal(
          (
            await request(
              "POST",
              `/bookings/${bookingA}/complete`,
              actors.owner,
              {},
            )
          ).status,
          200,
        );
        await pool.query(
          "UPDATE circle_practices SET status='Suspended' WHERE id=$1",
          [practiceId],
        );
        assert.equal(
          (
            await request(
              "POST",
              "/bookings",
              actors.clientA,
              input(actors.clientA!, "16:00"),
            )
          ).status,
          409,
        );
        await pool.query(
          "UPDATE circle_practices SET status='Approved' WHERE id=$1",
          [practiceId],
        );
        await pool.query(
          "UPDATE circle_profiles SET closed_at=clock_timestamp() WHERE user_id=$1",
          [actors.clientA!.id],
        );
        assert.equal(
          (
            await request(
              "POST",
              "/bookings",
              actors.clientA,
              input(actors.clientA!, "16:00"),
            )
          ).status,
          409,
        );
        await pool.query(
          "UPDATE circle_profiles SET closed_at=NULL WHERE user_id=$1",
          [actors.clientA!.id],
        );
        assert.equal(
          (
            await request("PUT", "/practice", actors.owner, {
              ...profile,
              qualification: "A changed qualification needs review",
            })
          ).status,
          200,
        );
        assert.equal(
          (
            await pool.query(
              "SELECT status FROM circle_practices WHERE id=$1",
              [practiceId],
            )
          ).rows[0].status,
          "Pending",
        );
      },
    );
  },
);
