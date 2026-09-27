CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE IF NOT EXISTS circle_practices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id text NOT NULL UNIQUE REFERENCES circle_profiles(user_id),
  name text NOT NULL DEFAULT '' CHECK (length(name) <= 80),
  title text NOT NULL DEFAULT '' CHECK (length(title) <= 100),
  category text NOT NULL DEFAULT 'Physiotherapy' CHECK (category IN ('Physiotherapy','Therapy','Fitness','Nutrition','Yoga')),
  bio text NOT NULL DEFAULT '' CHECK (length(bio) <= 1200),
  qualification text NOT NULL DEFAULT '' CHECK (length(qualification) <= 200),
  languages text[] NOT NULL DEFAULT '{}' CHECK (cardinality(languages) <= 8),
  address text NOT NULL DEFAULT 'Chandigarh' CHECK (length(address) <= 200),
  contact_email text NOT NULL DEFAULT '' CHECK (length(contact_email) <= 160),
  phone text NOT NULL DEFAULT '' CHECK (length(phone) <= 24),
  accepting_requests boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending','Approved','Suspended')),
  review_note text NOT NULL DEFAULT '' CHECK (length(review_note) <= 1000),
  hours jsonb NOT NULL DEFAULT '[{"day":0,"enabled":false,"start":"09:00","end":"17:00"},{"day":1,"enabled":false,"start":"09:00","end":"17:00"},{"day":2,"enabled":false,"start":"09:00","end":"17:00"},{"day":3,"enabled":false,"start":"09:00","end":"17:00"},{"day":4,"enabled":false,"start":"09:00","end":"17:00"},{"day":5,"enabled":false,"start":"09:00","end":"17:00"},{"day":6,"enabled":false,"start":"09:00","end":"17:00"}]'::jsonb
    CHECK (jsonb_typeof(hours) = 'array' AND jsonb_array_length(hours) = 7),
  blocked_dates date[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT circle_practice_approval_complete CHECK (status <> 'Approved' OR (
    length(trim(name)) >= 2 AND length(trim(title)) >= 3 AND length(trim(bio)) >= 30
    AND length(trim(qualification)) >= 3 AND cardinality(languages) > 0
    AND address ILIKE '%chandigarh%' AND contact_email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  ))
);

CREATE TABLE IF NOT EXISTS circle_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id uuid NOT NULL REFERENCES circle_practices(id),
  name text NOT NULL CHECK (length(trim(name)) BETWEEN 3 AND 100),
  description text NOT NULL DEFAULT '' CHECK (length(description) <= 600),
  duration_minutes integer NOT NULL CHECK (duration_minutes BETWEEN 15 AND 180),
  price_inr integer NOT NULL CHECK (price_inr BETWEEN 1 AND 100000),
  modes text[] NOT NULL CHECK (cardinality(modes) BETWEEN 1 AND 3 AND modes <@ ARRAY['Online','In person','Home visit']::text[]),
  active boolean NOT NULL DEFAULT true,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, practice_id)
);
CREATE INDEX IF NOT EXISTS circle_services_practice_idx ON circle_services(practice_id) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS circle_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id uuid NOT NULL REFERENCES circle_practices(id),
  requester_id text NOT NULL REFERENCES circle_profiles(user_id),
  attendee_id text NOT NULL REFERENCES circle_profiles(user_id),
  service_id uuid NOT NULL,
  practitioner_name text NOT NULL CHECK (length(practitioner_name) <= 80),
  requester_name text NOT NULL CHECK (length(requester_name) <= 200),
  attendee_name text NOT NULL CHECK (length(attendee_name) <= 200),
  service_name text NOT NULL CHECK (length(service_name) BETWEEN 3 AND 100),
  duration_minutes integer NOT NULL CHECK (duration_minutes BETWEEN 15 AND 180),
  price_inr integer NOT NULL CHECK (price_inr BETWEEN 1 AND 100000),
  mode text NOT NULL CHECK (mode IN ('Online','In person','Home visit')),
  appointment_date date NOT NULL,
  appointment_time time NOT NULL,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'Requested' CHECK (status IN ('Requested','Confirmed','Declined','Cancelled','Completed')),
  note text NOT NULL DEFAULT '' CHECK (length(note) <= 1000),
  session_details text NOT NULL DEFAULT '' CHECK (length(session_details) <= 500),
  reason text CHECK (length(reason) <= 500),
  follow_up_text text CHECK (length(follow_up_text) BETWEEN 1 AND 1000),
  follow_up_due_date date,
  follow_up_completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (service_id, practice_id) REFERENCES circle_services(id, practice_id),
  CHECK (starts_at = (appointment_date + appointment_time) AT TIME ZONE 'Asia/Kolkata'),
  CHECK (ends_at = starts_at + duration_minutes * interval '1 minute'),
  CHECK ((follow_up_text IS NULL) = (follow_up_due_date IS NULL)),
  CHECK (follow_up_completed_at IS NULL OR follow_up_text IS NOT NULL),
  CONSTRAINT circle_confirmed_no_overlap EXCLUDE USING gist
    (practice_id WITH =, tstzrange(starts_at, ends_at, '[)') WITH &&) WHERE (status = 'Confirmed')
);
CREATE INDEX IF NOT EXISTS circle_bookings_practice_time_idx ON circle_bookings(practice_id, starts_at);
CREATE INDEX IF NOT EXISTS circle_bookings_attendee_idx ON circle_bookings(attendee_id, created_at DESC);
CREATE INDEX IF NOT EXISTS circle_bookings_requester_idx ON circle_bookings(requester_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS circle_bookings_open_duplicate_idx ON circle_bookings(requester_id, attendee_id, service_id, starts_at)
  WHERE status IN ('Requested','Confirmed');

CREATE TABLE IF NOT EXISTS circle_booking_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES circle_bookings(id),
  status text NOT NULL CHECK (status IN ('Requested','Confirmed','Declined','Cancelled','Completed')),
  actor_id text REFERENCES circle_profiles(user_id),
  actor_name text NOT NULL CHECK (length(actor_name) <= 200),
  note text CHECK (length(note) <= 500),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS circle_booking_events_booking_idx ON circle_booking_events(booking_id, created_at);

CREATE TABLE IF NOT EXISTS circle_booking_keys (
  requester_id text NOT NULL REFERENCES circle_profiles(user_id),
  idempotency_key text NOT NULL CHECK (length(idempotency_key) BETWEEN 16 AND 128),
  fingerprint text NOT NULL CHECK (fingerprint ~ '^[a-f0-9]{64}$'),
  booking_id uuid NOT NULL REFERENCES circle_bookings(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (requester_id, idempotency_key)
);
