CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE circle_profiles (
 user_id text PRIMARY KEY REFERENCES "user"(id), name text NOT NULL, email text NOT NULL,
 role text NOT NULL CHECK(role IN ('client','practitioner','operator')),
 view_preference text NOT NULL DEFAULT 'standard' CHECK(view_preference IN ('standard','simple')),
 closed_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE circle_invitations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), email text NOT NULL,
 role text NOT NULL CHECK(role IN ('client','practitioner','operator')),
 purpose text NOT NULL CHECK(purpose IN ('beta','family')),
 token_hash text NOT NULL UNIQUE, inviter_id text REFERENCES circle_profiles(user_id),
 status text NOT NULL DEFAULT 'Pending' CHECK(status IN ('Pending','Accepted','Revoked')),
 accepted_by text REFERENCES circle_profiles(user_id), expires_at timestamptz NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), accepted_at timestamptz
);
CREATE INDEX circle_invitations_email_idx ON circle_invitations(email);
CREATE TABLE circle_family_links (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organiser_id text NOT NULL REFERENCES circle_profiles(user_id),
 member_id text NOT NULL REFERENCES circle_profiles(user_id),
 status text NOT NULL DEFAULT 'Active' CHECK(status IN ('Active','Revoked')),
 created_at timestamptz NOT NULL DEFAULT now(), revoked_at timestamptz,
 CHECK(organiser_id <> member_id)
);
CREATE UNIQUE INDEX circle_active_family_idx ON circle_family_links(organiser_id,member_id) WHERE status='Active';
CREATE TABLE circle_notifications (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id text NOT NULL REFERENCES circle_profiles(user_id),
 title text NOT NULL, body text NOT NULL, booking_id uuid, read_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX circle_notifications_user_idx ON circle_notifications(user_id,created_at DESC);
CREATE TABLE circle_outbox (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id text REFERENCES circle_profiles(user_id), recipient text NOT NULL,
 kind text NOT NULL, payload text NOT NULL,
 status text NOT NULL DEFAULT 'Pending' CHECK(status IN ('Pending','Delivered','Failed')),
 attempts integer NOT NULL DEFAULT 0, last_error text, next_attempt_at timestamptz NOT NULL DEFAULT now(),
 created_at timestamptz NOT NULL DEFAULT now(), delivered_at timestamptz
);
CREATE TABLE circle_audit (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), actor_id text REFERENCES circle_profiles(user_id),
 action text NOT NULL, target_id text, reason text NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE circle_rate_limits (key text PRIMARY KEY, count integer NOT NULL, expires_at timestamptz NOT NULL);
