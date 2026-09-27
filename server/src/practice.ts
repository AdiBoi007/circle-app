import { createHash } from "node:crypto";
import type { Context, Hono } from "hono";
import type { Pool, PoolClient } from "pg";
import { z } from "zod";
import type {
  LiveBooking,
  LivePractice,
  LiveService,
} from "./contracts.js";
import { pool, transaction } from "./db.js";
import {
  audit,
  fail,
  notify,
  requireActor,
  type Actor,
  type ApiEnv,
} from "./core.js";

type Hours = LivePractice["hours"];
type PracticeRow = {
  id: string;
  owner_id: string;
  name: string;
  title: string;
  category: LivePractice["category"];
  bio: string;
  qualification: string;
  languages: string[];
  address: string;
  contact_email: string;
  phone: string;
  accepting_requests: boolean;
  status: LivePractice["status"];
  review_note: string;
  hours: Hours;
  blocked_dates: string[];
};
type ServiceRow = {
  id: string;
  practice_id: string;
  name: string;
  description: string;
  duration_minutes: number;
  price_inr: number;
  modes: LiveService["modes"];
  active: boolean;
  deleted_at: Date | null;
};
type BookingRow = {
  id: string;
  practice_id: string;
  owner_id: string;
  requester_id: string;
  attendee_id: string;
  practitioner_name: string;
  requester_name: string;
  attendee_name: string;
  service_id: string;
  service_name: string;
  duration_minutes: number;
  price_inr: number;
  mode: LiveBooking["mode"];
  appointment_date: string;
  appointment_time: string;
  starts_at: Date;
  ends_at: Date;
  status: LiveBooking["status"];
  note: string;
  session_details: string;
  reason: string | null;
  follow_up_text: string | null;
  follow_up_due_date: string | null;
  follow_up_completed_at: Date | null;
  created_at: Date;
};
type PersonRow = {
  user_id: string;
  name: string;
  role: Actor["role"];
  closed_at: Date | null;
};
const categories = [
  "Physiotherapy",
  "Therapy",
  "Fitness",
  "Nutrition",
  "Yoga",
] as const;
const modes = ["Online", "In person", "Home visit"] as const;
const uuid = z.uuid();
const validDate = (value: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  Number.isFinite(Date.parse(`${value}T00:00:00Z`)) &&
  new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
const dateSchema = z
  .string()
  .refine(validDate, "Enter a valid date in YYYY-MM-DD format.");
const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use a valid 24-hour HH:mm time.");
const hoursSchema = z
  .array(
    z
      .object({
        day: z.number().int().min(0).max(6),
        enabled: z.boolean(),
        start: timeSchema,
        end: timeSchema,
      })
      .strict(),
  )
  .length(7)
  .refine(
    (hours) => new Set(hours.map((day) => day.day)).size === 7,
    "Include each weekday once.",
  )
  .refine(
    (hours) => hours.every((day) => !day.enabled || day.start < day.end),
    "Closing time must be after opening time.",
  );
const profileSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    title: z.string().trim().min(3).max(100),
    category: z.enum(categories),
    bio: z.string().trim().min(30).max(1200),
    qualification: z.string().trim().min(3).max(200),
    languages: z.array(z.string().trim().min(1).max(40)).min(1).max(8),
    address: z
      .string()
      .trim()
      .min(5)
      .max(200)
      .refine(
        (value) => /\bchandigarh\b/i.test(value),
        "Use a practice address in Chandigarh.",
      ),
    contactEmail: z.email().max(160),
    phone: z
      .string()
      .trim()
      .max(24)
      .refine(
        (value) =>
          !value ||
          (/^\+?[\d\s()-]+$/.test(value) &&
            value.replace(/\D/g, "").length >= 10 &&
            value.replace(/\D/g, "").length <= 15),
        "Enter a valid phone number or leave it blank.",
      ),
    acceptingRequests: z.boolean(),
  })
  .strict();
const serviceSchema = z
  .object({
    id: uuid.optional(),
    name: z.string().trim().min(3).max(100),
    description: z.string().trim().max(600),
    durationMinutes: z.number().int().min(15).max(180),
    priceInr: z.number().int().min(1).max(100000),
    modes: z.array(z.enum(modes)).min(1).max(3),
    active: z.boolean(),
  })
  .strict();
const requestSchema = z
  .object({
    serviceId: uuid,
    attendeeId: z.string().min(1).max(200),
    date: dateSchema,
    time: timeSchema,
    mode: z.enum(modes),
    note: z.string().trim().max(1000),
    expectedPriceInr: z.number().int().min(1).max(100000),
    expectedDurationMinutes: z.number().int().min(15).max(180),
    idempotencyKey: z
      .string()
      .regex(
        /^[A-Za-z0-9_-]{16,128}$/,
        "Use a unique idempotency key (16–128 characters).",
      ),
  })
  .strict();
const reasonSchema = z
  .object({ reason: z.string().trim().min(1).max(500) })
  .strict();
const emptySchema = z.object({}).strict();
const practiceSelect =
  "SELECT p.*, to_json(p.blocked_dates) AS blocked_dates FROM circle_practices p";
const bookingSelect = `SELECT b.*, p.owner_id, to_char(b.appointment_date,'YYYY-MM-DD') AS appointment_date,
  to_char(b.appointment_time,'HH24:MI') AS appointment_time, to_char(b.follow_up_due_date,'YYYY-MM-DD') AS follow_up_due_date
  FROM circle_bookings b JOIN circle_practices p ON p.id=b.practice_id`;
const memberAccess = `(b.attendee_id=$1 OR EXISTS (SELECT 1 FROM circle_family_links f WHERE f.organiser_id=$1 AND f.member_id=b.attendee_id AND f.status='Active'))`;

function parse<T>(schema: z.ZodType<T>, value: unknown): T {
  const parsed = schema.safeParse(value);
  if (!parsed.success)
    fail(400, parsed.error.issues[0]?.message ?? "Invalid input.");
  return parsed.data;
}
async function body<T>(c: Context<ApiEnv>, schema: z.ZodType<T>): Promise<T> {
  let value: unknown;
  try {
    value = await c.req.json();
  } catch {
    fail(400, "Send a valid JSON body.");
  }
  return parse(schema, value);
}
function requiredRole(actor: Actor, role: Actor["role"]) {
  if (actor.role !== role)
    fail(403, "This action is not available for your account.");
}
function minutes(time: string) {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}
function timeString(value: number) {
  return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
}
function dateTime(date: string, time: string) {
  return new Date(`${date}T${time}:00+05:30`);
}
function istDate(now: Date) {
  return new Date(now.getTime() + 330 * 60_000).toISOString().slice(0, 10);
}
function fitsHours(
  practice: PracticeRow,
  date: string,
  time: string,
  duration: number,
) {
  if (practice.blocked_dates.includes(date)) return false;
  const hours = practice.hours.find(
    (item) => item.day === new Date(`${date}T12:00:00Z`).getUTCDay(),
  );
  return (
    !!hours?.enabled &&
    minutes(time) >= minutes(hours.start) &&
    minutes(time) + duration <= minutes(hours.end)
  );
}
async function databaseNow(db: Pool | PoolClient) {
  return (await db.query<{ now: Date }>("SELECT clock_timestamp() AS now"))
    .rows[0]!.now;
}
async function transactional<T>(
  work: (client: PoolClient) => Promise<T>,
): Promise<T> {
  try {
    return await transaction(work);
  } catch (error) {
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? error.code
        : undefined;
    if (code === "23P01")
      fail(
        409,
        "This time overlaps an appointment that was just confirmed. Refresh and choose another time.",
      );
    if (code === "23505")
      fail(409, "This request already exists. Refresh before trying again.");
    throw error;
  }
}
/** Lock identities before practice/booking rows so closing an account cannot race a new appointment. */
async function lockPeople(
  client: PoolClient,
  actor: Actor,
  ids: string[],
  allowedClosedIds: string[] = [],
): Promise<Map<string, PersonRow>> {
  const unique = [...new Set([actor.id, ...ids])].sort();
  const result = await client.query<PersonRow>(
    "SELECT user_id,name,role,closed_at FROM circle_profiles WHERE user_id=ANY($1::text[]) ORDER BY user_id FOR SHARE",
    [unique],
  );
  if (
    result.rows.length !== unique.length ||
    result.rows.some(
      (person) =>
        person.closed_at &&
        (person.user_id === actor.id ||
          !allowedClosedIds.includes(person.user_id)),
    )
  )
    fail(409, "An account involved in this appointment is no longer active.");
  const people = new Map(result.rows.map((person) => [person.user_id, person]));
  if (people.get(actor.id)?.role !== actor.role)
    fail(403, "Your account permissions have changed. Sign in again.");
  return people;
}
async function familyAccess(
  client: PoolClient,
  actorId: string,
  attendeeId: string,
  lock = true,
) {
  if (actorId === attendeeId) return;
  const grants = await client.query(
    `SELECT id FROM circle_family_links WHERE organiser_id=$1 AND member_id=$2 AND status='Active'${lock ? " FOR SHARE" : ""}`,
    [actorId, attendeeId],
  );
  if (!grants.rowCount)
    fail(
      404,
      "This appointment or family member is not available to your account.",
    );
}
async function ownerPractice(
  client: PoolClient,
  actor: Actor,
): Promise<PracticeRow> {
  requiredRole(actor, "practitioner");
  await lockPeople(client, actor, []);
  const result = await client.query<PracticeRow>(
    `${practiceSelect} WHERE p.owner_id=$1 FOR UPDATE`,
    [actor.id],
  );
  if (!result.rows[0]) fail(404, "Complete your practice profile first.");
  return result.rows[0];
}
async function lockedBooking(
  client: PoolClient,
  actor: Actor,
  id: string,
): Promise<{ booking: BookingRow; practice: PracticeRow }> {
  const initial = (
    await client.query<BookingRow>(`${bookingSelect} WHERE b.id=$1`, [id])
  ).rows[0];
  if (!initial) fail(404, "Appointment not found.");
  if (actor.role !== "operator" && initial.owner_id !== actor.id)
    await familyAccess(client, actor.id, initial.attendee_id, false);
  // An organiser may close their account while the attendee keeps the appointment.
  // Still lock that profile for consistent notification cleanup, without removing the attendee's care access.
  const formerOrganiser =
    initial.requester_id !== initial.attendee_id &&
    initial.requester_id !== initial.owner_id
      ? [initial.requester_id]
      : [];
  await lockPeople(
    client,
    actor,
    [initial.owner_id, initial.attendee_id, initial.requester_id],
    formerOrganiser,
  );
  if (actor.role !== "operator" && initial.owner_id !== actor.id)
    await familyAccess(client, actor.id, initial.attendee_id);
  const practice = (
    await client.query<PracticeRow>(
      `${practiceSelect} WHERE p.id=$1 FOR UPDATE`,
      [initial.practice_id],
    )
  ).rows[0]!;
  const booking = (
    await client.query<BookingRow>(
      `${bookingSelect} WHERE b.id=$1 FOR UPDATE OF b`,
      [id],
    )
  ).rows[0]!;
  return { booking, practice };
}
async function bookingEvent(
  client: PoolClient,
  actor: Actor,
  bookingId: string,
  status: LiveBooking["status"],
  note?: string,
) {
  await client.query(
    "INSERT INTO circle_booking_events(booking_id,status,actor_id,actor_name,note) VALUES($1,$2,$3,$4,$5)",
    [bookingId, status, actor.id, actor.name, note ?? null],
  );
}
async function notifyBooking(
  client: PoolClient,
  booking: Pick<BookingRow, "id" | "attendee_id" | "requester_id" | "owner_id">,
  title: string,
  message: string,
  excludeId?: string,
) {
  const recipients = new Set([booking.owner_id, booking.attendee_id]);
  if (
    booking.requester_id === booking.attendee_id ||
    (
      await client.query(
        "SELECT id FROM circle_family_links WHERE organiser_id=$1 AND member_id=$2 AND status='Active'",
        [booking.requester_id, booking.attendee_id],
      )
    ).rowCount
  )
    recipients.add(booking.requester_id);
  for (const id of recipients)
    if (id !== excludeId) await notify(client, id, title, message, booking.id);
}
function practiceDto(row: PracticeRow): LivePractice {
  return {
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    title: row.title,
    category: row.category,
    bio: row.bio,
    qualification: row.qualification,
    languages: row.languages,
    address: row.address,
    contactEmail: row.contact_email,
    phone: row.phone,
    acceptingRequests: row.accepting_requests,
    status: row.status,
    reviewNote: row.review_note,
    hours: row.hours,
    blockedDates: row.blocked_dates,
  };
}
function serviceDto(row: ServiceRow): LiveService {
  return {
    id: row.id,
    practiceId: row.practice_id,
    name: row.name,
    description: row.description,
    durationMinutes: row.duration_minutes,
    priceInr: row.price_inr,
    modes: row.modes,
    active: row.active,
  };
}

export async function getPracticeBootstrap(
  db: Pool,
  actor: Actor,
): Promise<{
  practices: LivePractice[];
  services: LiveService[];
  bookings: LiveBooking[];
}> {
  const practiceFilter =
    actor.role === "operator"
      ? "TRUE"
      : actor.role === "practitioner"
        ? "p.owner_id=$1"
        : "p.status='Approved'";
  const practices = await db.query<PracticeRow>(
    `${practiceSelect} WHERE ${practiceFilter} ORDER BY p.name,p.id`,
    actor.role === "practitioner" ? [actor.id] : [],
  );
  const serviceResult = await db.query<ServiceRow>(
    `SELECT s.* FROM circle_services s WHERE s.practice_id=ANY($1::uuid[]) AND s.deleted_at IS NULL ${actor.role === "client" ? "AND s.active" : ""} ORDER BY s.name,s.id`,
    [practices.rows.map((row) => row.id)],
  );
  const bookingFilter =
    actor.role === "operator"
      ? "TRUE"
      : actor.role === "practitioner"
        ? "p.owner_id=$1"
        : memberAccess;
  const booked = await db.query<BookingRow>(
    `${bookingSelect} WHERE ${bookingFilter} ORDER BY b.starts_at DESC,b.created_at DESC`,
    actor.role === "operator" ? [] : [actor.id],
  );
  const eventResult = await db.query<{
    booking_id: string;
    status: LiveBooking["status"];
    actor_name: string;
    created_at: Date;
    note: string | null;
  }>(
    "SELECT booking_id,status,actor_name,created_at,note FROM circle_booking_events WHERE booking_id=ANY($1::uuid[]) ORDER BY created_at,id",
    [booked.rows.map((row) => row.id)],
  );
  const isOperator = actor.role === "operator";
  const bookings: LiveBooking[] = booked.rows.map((row) => ({
    id: row.id,
    practiceId: row.practice_id,
    practitionerName: row.practitioner_name,
    requesterId: row.requester_id,
    requesterName: row.requester_name,
    attendeeId: row.attendee_id,
    attendeeName: row.attendee_name,
    serviceId: row.service_id,
    serviceName: row.service_name,
    durationMinutes: row.duration_minutes,
    priceInr: row.price_inr,
    mode: row.mode,
    date: row.appointment_date,
    time: row.appointment_time,
    startsAt: row.starts_at.toISOString(),
    endsAt: row.ends_at.toISOString(),
    status: row.status,
    note: isOperator ? "" : row.note,
    sessionDetails: isOperator ? "" : row.session_details,
    ...(!isOperator && row.reason ? { reason: row.reason } : {}),
    createdAt: row.created_at.toISOString(),
    ...(!isOperator && row.follow_up_text && row.follow_up_due_date
      ? {
          followUp: {
            text: row.follow_up_text,
            dueDate: row.follow_up_due_date,
            completedAt: row.follow_up_completed_at?.toISOString() ?? null,
          },
        }
      : {}),
    events: eventResult.rows
      .filter((event) => event.booking_id === row.id)
      .map((event) => ({
        status: event.status,
        actorName: event.actor_name,
        at: event.created_at.toISOString(),
        ...(!isOperator && event.note ? { note: event.note } : {}),
      })),
  }));
  return {
    practices: practices.rows.map((row) => {
      const value = practiceDto(row);
      if (actor.role === "client") delete value.reviewNote;
      return value;
    }),
    services: serviceResult.rows.map(serviceDto),
    bookings,
  };
}

export function registerPracticeRoutes(app: Hono<ApiEnv>) {
  app.get("/slots", async (c) => {
    requireActor(c);
    const input = parse(
      z
        .object({ serviceId: uuid, date: dateSchema, mode: z.enum(modes) })
        .strict(),
      c.req.query(),
    );
    const service = (
      await pool.query<ServiceRow>(
        "SELECT * FROM circle_services WHERE id=$1 AND active AND deleted_at IS NULL",
        [input.serviceId],
      )
    ).rows[0];
    if (!service) fail(404, "Service unavailable.");
    const practice = (
      await pool.query<PracticeRow>(
        `${practiceSelect} WHERE p.id=$1 AND p.status='Approved' AND p.accepting_requests`,
        [service.practice_id],
      )
    ).rows[0];
    if (!practice || !service.modes.includes(input.mode))
      return c.json({ date: input.date, times: [], timeZone: "Asia/Kolkata" });
    const now = await databaseNow(pool);
    if (
      input.date < istDate(now) ||
      dateTime(input.date, "00:00").getTime() > now.getTime() + 366 * 86400_000
    )
      return c.json({ date: input.date, times: [], timeZone: "Asia/Kolkata" });
    const hours = practice.hours.find(
      (day) => day.day === new Date(`${input.date}T12:00:00Z`).getUTCDay(),
    );
    const times: string[] = [];
    if (hours?.enabled && !practice.blocked_dates.includes(input.date)) {
      const busy = await pool.query<{ starts_at: Date; ends_at: Date }>(
        "SELECT starts_at,ends_at FROM circle_bookings WHERE practice_id=$1 AND appointment_date=$2 AND status='Confirmed'",
        [practice.id, input.date],
      );
      for (
        let start = minutes(hours.start);
        start + service.duration_minutes <= minutes(hours.end);
        start += 30
      ) {
        const time = timeString(start);
        const from = dateTime(input.date, time).getTime();
        const to = from + service.duration_minutes * 60_000;
        if (
          from > now.getTime() &&
          !busy.rows.some(
            (row) =>
              from < row.ends_at.getTime() && to > row.starts_at.getTime(),
          )
        )
          times.push(time);
      }
    }
    return c.json({ date: input.date, times, timeZone: "Asia/Kolkata" });
  });

  app.put("/practice", async (c) => {
    const actor = requireActor(c);
    requiredRole(actor, "practitioner");
    const input = await body(c, profileSchema);
    const result = await transactional(async (client) => {
      await lockPeople(client, actor, []);
      const old = (
        await client.query<PracticeRow>(
          `${practiceSelect} WHERE p.owner_id=$1 FOR UPDATE`,
          [actor.id],
        )
      ).rows[0];
      const needsReview =
        old?.status === "Approved" &&
        (old.name !== input.name ||
          old.title !== input.title ||
          old.category !== input.category ||
          old.qualification !== input.qualification ||
          old.address !== input.address);
      const status = needsReview ? "Pending" : (old?.status ?? "Pending");
      const result = await client.query<{ id: string }>(
        `INSERT INTO circle_practices(owner_id,name,title,category,bio,qualification,languages,address,contact_email,phone,accepting_requests,status)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) ON CONFLICT(owner_id) DO UPDATE SET name=EXCLUDED.name,title=EXCLUDED.title,category=EXCLUDED.category,bio=EXCLUDED.bio,qualification=EXCLUDED.qualification,languages=EXCLUDED.languages,address=EXCLUDED.address,contact_email=EXCLUDED.contact_email,phone=EXCLUDED.phone,accepting_requests=EXCLUDED.accepting_requests,status=EXCLUDED.status,updated_at=clock_timestamp() RETURNING id`,
        [
          actor.id,
          input.name,
          input.title,
          input.category,
          input.bio,
          input.qualification,
          [...new Set(input.languages)],
          input.address,
          input.contactEmail,
          input.phone,
          input.acceptingRequests,
          status,
        ],
      );
      const id = result.rows[0]!.id;
      await audit(
        client,
        actor.id,
        old ? "practice.updated" : "practice.created",
        id,
        needsReview ? "Profile changes require a new approval." : undefined,
      );
      return { id };
    });
    return c.json(result);
  });

  app.put("/practice/hours", async (c) => {
    const actor = requireActor(c);
    const { hours } = await body(c, z.object({ hours: hoursSchema }).strict());
    return c.json(
      await transactional(async (client) => {
        const practice = await ownerPractice(client, actor);
        const future = await client.query<BookingRow>(
          `${bookingSelect} WHERE b.practice_id=$1 AND b.status='Confirmed' AND b.ends_at>clock_timestamp()`,
          [practice.id],
        );
        if (
          future.rows.some(
            (booking) =>
              !fitsHours(
                { ...practice, hours },
                booking.appointment_date,
                booking.appointment_time,
                booking.duration_minutes,
              ),
          )
        )
          fail(
            409,
            "These hours exclude a confirmed appointment. Keep its time available or cancel it first.",
          );
        await client.query(
          "UPDATE circle_practices SET hours=$1::jsonb,updated_at=clock_timestamp() WHERE id=$2",
          [JSON.stringify(hours), practice.id],
        );
        await audit(client, actor.id, "practice.hours.updated", practice.id);
        return { ok: true };
      }),
    );
  });

  app.post("/practice/blocked-dates", async (c) => {
    const actor = requireActor(c);
    const { date } = await body(c, z.object({ date: dateSchema }).strict());
    return c.json(
      await transactional(async (client) => {
        const practice = await ownerPractice(client, actor);
        const now = await databaseNow(client);
        if (
          date < istDate(now) ||
          dateTime(date, "00:00").getTime() > now.getTime() + 366 * 86400_000
        )
          fail(400, "Choose a date within the next year.");
        const reopening = practice.blocked_dates.includes(date);
        if (
          !reopening &&
          (
            await client.query(
              "SELECT id FROM circle_bookings WHERE practice_id=$1 AND appointment_date=$2 AND status='Confirmed' AND ends_at>clock_timestamp()",
              [practice.id, date],
            )
          ).rowCount
        )
          fail(
            409,
            "A confirmed appointment is on this date. Resolve it before closing the date.",
          );
        const dates = reopening
          ? practice.blocked_dates.filter((item) => item !== date)
          : [...practice.blocked_dates, date].sort();
        await client.query(
          "UPDATE circle_practices SET blocked_dates=$1::date[],updated_at=clock_timestamp() WHERE id=$2",
          [dates, practice.id],
        );
        await audit(
          client,
          actor.id,
          reopening ? "practice.date.reopened" : "practice.date.closed",
          practice.id,
          date,
        );
        return { ok: true };
      }),
    );
  });

  app.post("/practice/services", async (c) => {
    const actor = requireActor(c);
    const input = await body(c, serviceSchema);
    return c.json(
      await transactional(async (client) => {
        const practice = await ownerPractice(client, actor);
        const values = [
          input.name,
          input.description,
          input.durationMinutes,
          input.priceInr,
          [...new Set(input.modes)],
          input.active,
          practice.id,
        ];
        const result = input.id
          ? await client.query<{ id: string }>(
              "UPDATE circle_services SET name=$1,description=$2,duration_minutes=$3,price_inr=$4,modes=$5,active=$6,updated_at=clock_timestamp() WHERE practice_id=$7 AND id=$8 AND deleted_at IS NULL RETURNING id",
              [...values, input.id],
            )
          : await client.query<{ id: string }>(
              "INSERT INTO circle_services(name,description,duration_minutes,price_inr,modes,active,practice_id) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id",
              values,
            );
        if (!result.rows[0]) fail(404, "Service not found.");
        await audit(
          client,
          actor.id,
          input.id ? "service.updated" : "service.created",
          result.rows[0].id,
        );
        return { id: result.rows[0].id };
      }),
    );
  });

  app.delete("/practice/services/:id", async (c) => {
    const actor = requireActor(c);
    const id = parse(uuid, c.req.param("id"));
    return c.json(
      await transactional(async (client) => {
        const practice = await ownerPractice(client, actor);
        const service = await client.query(
          "SELECT id FROM circle_services WHERE id=$1 AND practice_id=$2 AND deleted_at IS NULL",
          [id, practice.id],
        );
        if (!service.rowCount) fail(404, "Service not found.");
        if (
          (
            await client.query(
              "SELECT id FROM circle_bookings WHERE service_id=$1 AND status IN ('Requested','Confirmed')",
              [id],
            )
          ).rowCount
        )
          fail(
            409,
            "This service has open appointments. Deactivate it or resolve those appointments first.",
          );
        await client.query(
          "UPDATE circle_services SET active=false,deleted_at=clock_timestamp(),updated_at=clock_timestamp() WHERE id=$1",
          [id],
        );
        await audit(client, actor.id, "service.deleted", id);
        return { ok: true };
      }),
    );
  });

  app.post("/bookings", async (c) => {
    const actor = requireActor(c);
    requiredRole(actor, "client");
    const input = await body(c, requestSchema);
    return c.json(
      await transactional(async (client) => {
        const original = (
          await client.query<{ practice_id: string; owner_id: string }>(
            "SELECT s.practice_id,p.owner_id FROM circle_services s JOIN circle_practices p ON p.id=s.practice_id WHERE s.id=$1",
            [input.serviceId],
          )
        ).rows[0];
        if (!original) fail(404, "Service unavailable.");
        const people = await lockPeople(client, actor, [
          original.owner_id,
          input.attendeeId,
        ]);
        await familyAccess(client, actor.id, input.attendeeId);
        await client.query(
          "SELECT pg_advisory_xact_lock(hashtextextended($1,0))",
          [`circle-booking:${actor.id}:${input.idempotencyKey}`],
        );
        const fingerprint = createHash("sha256")
          .update(
            JSON.stringify({
              serviceId: input.serviceId,
              attendeeId: input.attendeeId,
              date: input.date,
              time: input.time,
              mode: input.mode,
              note: input.note,
              expectedPriceInr: input.expectedPriceInr,
              expectedDurationMinutes: input.expectedDurationMinutes,
            }),
          )
          .digest("hex");
        const previous = await client.query<{
          fingerprint: string;
          booking_id: string;
        }>(
          "SELECT fingerprint,booking_id FROM circle_booking_keys WHERE requester_id=$1 AND idempotency_key=$2",
          [actor.id, input.idempotencyKey],
        );
        if (previous.rows[0]) {
          if (previous.rows[0].fingerprint !== fingerprint)
            fail(
              409,
              "This idempotency key was used for different appointment details.",
            );
          return { id: previous.rows[0].booking_id };
        }
        const practice = (
          await client.query<PracticeRow>(
            `${practiceSelect} WHERE p.id=$1 FOR UPDATE`,
            [original.practice_id],
          )
        ).rows[0]!;
        if (practice.status !== "Approved" || !practice.accepting_requests)
          fail(409, "This practice is not accepting new requests.");
        const service = (
          await client.query<ServiceRow>(
            "SELECT * FROM circle_services WHERE id=$1 AND practice_id=$2 AND active AND deleted_at IS NULL",
            [input.serviceId, practice.id],
          )
        ).rows[0];
        if (!service || !service.modes.includes(input.mode))
          fail(
            409,
            "This service or consultation format is no longer available.",
          );
        if (
          service.price_inr !== input.expectedPriceInr ||
          service.duration_minutes !== input.expectedDurationMinutes
        )
          fail(
            409,
            "The consultation fee or duration changed. Go back and review the updated service details before requesting.",
          );
        const now = await databaseNow(client);
        const start = dateTime(input.date, input.time);
        const end = new Date(
          start.getTime() + service.duration_minutes * 60_000,
        );
        if (start <= now || start.getTime() > now.getTime() + 366 * 86400_000)
          fail(400, "Choose a future appointment within the next year.");
        const hours = practice.hours.find(
          (day) => day.day === new Date(`${input.date}T12:00:00Z`).getUTCDay(),
        );
        if (
          !fitsHours(
            practice,
            input.date,
            input.time,
            service.duration_minutes,
          ) ||
          !hours ||
          (minutes(input.time) - minutes(hours.start)) % 30 !== 0
        )
          fail(
            409,
            "That time is outside the current availability. Choose another slot.",
          );
        if (
          (
            await client.query(
              "SELECT id FROM circle_bookings WHERE practice_id=$1 AND status='Confirmed' AND starts_at<$3 AND ends_at>$2",
              [practice.id, start, end],
            )
          ).rowCount
        )
          fail(409, "That time is no longer available.");
        const duplicate = (
          await client.query<BookingRow>(
            `${bookingSelect} WHERE b.requester_id=$1 AND b.attendee_id=$2 AND b.service_id=$3 AND b.starts_at=$4 AND b.status IN ('Requested','Confirmed')`,
            [actor.id, input.attendeeId, service.id, start],
          )
        ).rows[0];
        let id: string;
        if (duplicate) {
          if (
            duplicate.mode !== input.mode ||
            duplicate.note !== input.note ||
            duplicate.price_inr !== input.expectedPriceInr ||
            duplicate.duration_minutes !== input.expectedDurationMinutes
          )
            fail(
              409,
              "An open request already exists for this service and time. Open or cancel that request first.",
            );
          id = duplicate.id;
        } else {
          const result = await client.query<{ id: string }>(
            `INSERT INTO circle_bookings(practice_id,requester_id,attendee_id,service_id,practitioner_name,requester_name,attendee_name,service_name,duration_minutes,price_inr,mode,appointment_date,appointment_time,starts_at,ends_at,note)
          VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING id`,
            [
              practice.id,
              actor.id,
              input.attendeeId,
              service.id,
              practice.name,
              people.get(actor.id)!.name,
              people.get(input.attendeeId)!.name,
              service.name,
              service.duration_minutes,
              service.price_inr,
              input.mode,
              input.date,
              input.time,
              start,
              end,
              input.note,
            ],
          );
          id = result.rows[0]!.id;
          await bookingEvent(client, actor, id, "Requested");
          await audit(client, actor.id, "booking.requested", id);
          await notifyBooking(
            client,
            {
              id,
              attendee_id: input.attendeeId,
              requester_id: actor.id,
              owner_id: practice.owner_id,
            },
            "New appointment request",
            "An appointment request is waiting in Circle. Open Circle to review its details.",
            actor.id,
          );
        }
        await client.query(
          "INSERT INTO circle_booking_keys(requester_id,idempotency_key,fingerprint,booking_id) VALUES($1,$2,$3,$4)",
          [actor.id, input.idempotencyKey, fingerprint, id],
        );
        return { id };
      }),
      201,
    );
  });

  for (const action of ["confirm", "decline", "cancel", "complete"] as const)
    app.post(`/bookings/:id/${action}`, async (c) => {
      const actor = requireActor(c);
      const id = parse(uuid, c.req.param("id"));
      const input =
        action === "confirm"
          ? await body(
              c,
              z
                .object({ sessionDetails: z.string().trim().min(5).max(500) })
                .strict(),
            )
          : action === "decline" || action === "cancel"
            ? await body(c, reasonSchema)
            : await body(c, emptySchema);
      return c.json(
        await transactional(async (client) => {
          const { booking, practice } = await lockedBooking(client, actor, id);
          const owner =
            actor.role === "practitioner" && practice.owner_id === actor.id;
          if (action !== "cancel" && !owner)
            fail(403, "Only this practitioner can update the appointment.");
          if (action === "cancel" && !owner && actor.role !== "operator")
            await familyAccess(client, actor.id, booking.attendee_id);
          let status: LiveBooking["status"];
          let reason: string | null = null;
          let details = booking.session_details;
          if (action === "confirm") {
            if (booking.status !== "Requested")
              fail(409, "Only a pending request can be confirmed.");
            if (practice.status !== "Approved")
              fail(
                409,
                "This practice must be approved before accepting appointments.",
              );
            if (booking.starts_at <= (await databaseNow(client)))
              fail(
                409,
                "The requested time has passed. Decline it and ask for a new request.",
              );
            if (
              !fitsHours(
                practice,
                booking.appointment_date,
                booking.appointment_time,
                booking.duration_minutes,
              )
            )
              fail(
                409,
                "This request is outside your availability. Update your hours or decline it.",
              );
            details = (input as { sessionDetails: string }).sessionDetails;
            status = "Confirmed";
          } else if (action === "decline") {
            if (booking.status !== "Requested")
              fail(409, "Only a pending request can be declined.");
            reason = (input as { reason: string }).reason;
            status = "Declined";
          } else if (action === "cancel") {
            if (
              booking.status !== "Requested" &&
              booking.status !== "Confirmed"
            )
              fail(409, "This appointment is already closed.");
            reason = (input as { reason: string }).reason;
            status = "Cancelled";
          } else {
            if (booking.status !== "Confirmed")
              fail(409, "Only a confirmed appointment can be completed.");
            if (booking.ends_at > (await databaseNow(client)))
              fail(409, "This appointment has not finished yet.");
            status = "Completed";
          }
          await client.query(
            "UPDATE circle_bookings SET status=$1,session_details=$2,reason=$3,updated_at=clock_timestamp() WHERE id=$4",
            [status, details, reason, id],
          );
          await bookingEvent(client, actor, id, status, reason ?? undefined);
          await audit(client, actor.id, `booking.${status.toLowerCase()}`, id);
          await notifyBooking(
            client,
            booking,
            `Appointment ${status.toLowerCase()}`,
            `An appointment was ${status.toLowerCase()}. Open Circle to see the details.`,
            actor.id,
          );
          return { ok: true };
        }),
      );
    });

  app.post("/bookings/:id/follow-up", async (c) => {
    const actor = requireActor(c);
    const id = parse(uuid, c.req.param("id"));
    const input = await body(
      c,
      z
        .object({
          text: z.string().trim().min(1).max(1000),
          dueDate: dateSchema,
        })
        .strict(),
    );
    return c.json(
      await transactional(async (client) => {
        const { booking, practice } = await lockedBooking(client, actor, id);
        if (actor.role !== "practitioner" || practice.owner_id !== actor.id)
          fail(
            403,
            "Only the treating practitioner can add follow-up instructions.",
          );
        if (booking.status !== "Confirmed" && booking.status !== "Completed")
          fail(
            409,
            "Follow-up instructions require a confirmed or completed appointment.",
          );
        const now = await databaseNow(client);
        if (
          input.dueDate < istDate(now) ||
          dateTime(input.dueDate, "00:00").getTime() >
            now.getTime() + 366 * 86400_000
        )
          fail(400, "Choose a follow-up date within the next year.");
        await client.query(
          "UPDATE circle_bookings SET follow_up_text=$1,follow_up_due_date=$2,follow_up_completed_at=NULL,updated_at=clock_timestamp() WHERE id=$3",
          [input.text, input.dueDate, id],
        );
        await audit(client, actor.id, "booking.follow_up.updated", id);
        await notifyBooking(
          client,
          booking,
          "Follow-up instructions added",
          "Your practitioner added follow-up instructions. Open Circle to review them.",
          actor.id,
        );
        return { ok: true };
      }),
    );
  });

  app.post("/bookings/:id/follow-up/complete", async (c) => {
    const actor = requireActor(c);
    const id = parse(uuid, c.req.param("id"));
    await body(c, emptySchema);
    return c.json(
      await transactional(async (client) => {
        const { booking } = await lockedBooking(client, actor, id);
        if (actor.role === "operator")
          fail(
            403,
            "Only the attendee or their authorised organiser can complete this follow-up.",
          );
        await familyAccess(client, actor.id, booking.attendee_id);
        if (
          !booking.follow_up_text ||
          (booking.status !== "Confirmed" && booking.status !== "Completed")
        )
          fail(409, "No active follow-up is available for this appointment.");
        if (!booking.follow_up_completed_at) {
          await client.query(
            "UPDATE circle_bookings SET follow_up_completed_at=clock_timestamp(),updated_at=clock_timestamp() WHERE id=$1",
            [id],
          );
          await audit(client, actor.id, "booking.follow_up.completed", id);
          await notifyBooking(
            client,
            booking,
            "Follow-up completed",
            "A follow-up was marked completed. Open Circle for details.",
            actor.id,
          );
        }
        return { ok: true };
      }),
    );
  });
}
