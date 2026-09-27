# Circle: smallest real beta

## Current-status addendum — live implementation

The original audit below describes the earlier sample-data prototype. It is retained as historical context; its statements that authentication, a backend and operator screens are absent no longer describe the current `/beta` implementation. See the [live setup runbook](LIVE_BETA_RUNBOOK.md) and [current README](../README.md) for entry instructions.

**Implemented locally:** invited email/password accounts and server sessions; PostgreSQL persistence and server access checks; client, practitioner and operator workspaces; approved-practice discovery and services; live availability and request/confirm/decline/cancel/complete flows; practitioner follow-ups; accepted/revocable family grants; account Simple preference with a distinct, larger-action client view; in-app notifications, delivery queue/retry controls, account export and closure/anonymisation. Operator views exclude clinical notes, session details and follow-ups. Live mode uses server time and hides the separate demo routes; it does not seed the four sample personas into the database.

Local web is configured at `http://localhost:8081/beta`, with the API at `http://localhost:8787/api`. Root commands now include `web:live`, `api:dev`, `api:migrate`, `api:bootstrap` and `check:api`; follow the runbook for required environment and database setup. The first operator must be invited using the supplied real email address. There is no default account or production practitioner roster.

**Still not externally launched:** no public beta deployment, external domain or production mail delivery has been established. Before accepting the first real health data, supply the operator and actual Chandigarh practitioner roster; review credentials/licensing and scope; configure and verify transactional email/password recovery; complete consent/privacy, retention/deletion and support/incident review; establish database backups and prove a restore; and exercise the deployed journey across separate accounts and devices. Resend is the implemented email transport; disabled local mail and generated invitation links do not establish delivery. Listing approval does not itself verify a professional licence.

Payments/payouts, record uploads, integrated video, medical AI and the demo’s broader medicines/records/habits features remain outside the live beta. No new test counts or deployment outcomes are asserted by this addendum; the final integrated checks are reported separately.

## Historical readiness review

25 September 2026. Source-based readiness review after the dual-direction redesign, visual refinement and connected practitioner demo. This document supersedes the original audit where screens were subsequently replaced. It does not mark any production capability as completed merely because the demo shows it.

**Status: not launched.** Circle is currently a local, interactive sample-data prototype. The founder has practitioners available to invite and has confirmed that the first app/beta is exclusively for Chandigarh, India. Both initial practitioners and clients are scoped to this city. Launch platform selection is pending; an invite-only web beta is the recommended first distribution path, with native testing following. No live backend or deployment project is configured in this repository.

## Profiles and roles

| Experience | Current state | Minimum real-beta work |
| --- | --- | --- |
| Family organiser | Arjun demo implemented | Real account, own profile, create family, invite members, scoped delegation, task and appointment ownership |
| Standard family member | Rajiv/Neha exist as sample records, not login identities | Accept invitation, control sharing, view own information and assigned tasks; reuse personal UI where appropriate |
| Simple view | Savita demo implemented | A preference available to members, with independent identity and the same permission checks; no age-based assumption of consent |
| Individual | Riya demo implemented | Real personal profile, durable dated habits and appointments, self-only data by default |
| Practitioner | Arvind Nair demo implemented at `/practice`: editable profile, services/INR prices, weekly hours/closed dates, request review, confirm/decline/cancel and session details | Invite/sign-in, reviewed credentials/listing approval, durable ownership, availability and requests, server-enforced transitions, real delivery and cross-device sync |
| Operator/admin | Not implemented | Invite testers/practitioners, approve or pause listings, resolve requests and delivery failures, view operational audit history |

Therapists, trainers, dietitians and other categories should share one practitioner workspace with profession-specific fields. A clinic/organisation account, a dedicated caregiver portal, payment dashboards and payer accounts are outside this first release. One person may have a personal account and family permissions; avoid forcing separate identities for those uses.

## Implemented practitioner demo

The fourth persona is Arvind Nair, a sample physiotherapist in Chandigarh. His workspace has Today, Requests, Schedule and My practice tabs. Profile and service edits, enabled/paused services, weekly opening hours and closed dates change the same in-memory practice model that clients see. All prices are INR and appointment times are IST. Qualifications, practice address and fees are explicitly examples; there is no verification or live listing publication.

Arjun, Savita and Riya can request care from the connected sample practice. A request starts as Requested; Arvind can confirm it with session details or decline it with a reason. The requester can cancel their own request or confirmed appointment, and Arvind can cancel a confirmed appointment. Both sides see the same status and recorded activity when switching personas within the session. The local model also validates recipients, overlapping confirmed visits, hours, closed dates and service edits, and preserves the requested service/fee details. These client-side rules are demo behavior, not backend authorization or transactional reservations.

The practice uses a fixed **25 September 2026, 9:00 am IST** demo clock. Seeded requests include Riya’s assessment, Arjun’s requests for Savita and Rajiv, and Savita’s confirmed sample visit. Reload resets all changes. Existing consumer directory/bookings are still separate sample flows; they are not additional practitioner accounts connected to this workspace.

To try both sides, enter through onboarding’s **I’m a practitioner** button or select **Arvind Nair** in the profile switcher. Edit the profile/services or Schedule, then switch to **Riya** and choose **Care → View practice** on the connected sample practice card. Submit a request, switch to Arvind’s **Requests** to confirm or decline, and switch back to **Riya → Care → My appointments → Care requests** to inspect the response or cancel. Use in-app navigation in the same session; a new tab or reload does not share the state. See [the README walkthrough](../README.md#try-both-sides-of-an-appointment). This is a walkthrough, not a claim of completed browser/device testing.

Arjun’s full request list is in Family calendar; Savita’s is in My care. Requests remain owned by the persona that submitted them. Arjun’s sample requests for Savita and Rajiv therefore appear in Arjun’s list, while Savita sees requests she made herself. Earlier family fixtures retain their explicitly labelled July dates; the connected practice schedule uses September.

Real authentication, persistence, family invitations/consent, delivered notifications, practitioner verification, payments, an operator workspace and beta deployment are still absent.

## Scope recommended for speed

Keep the existing consumer presentation and warm visual system. Invite a small roster of known practitioners and a small cohort of adult clients/families. Use Chandigarh as the sole initial service region, INR (₹) prices and IST (Asia/Kolkata) appointments. Cross-country coordination and additional cities are later expansion work. Offer appointment requests with explicit practitioner confirmation; do not promise instant availability before implementing reliable slot reservations.

Use the implemented practitioner workspace as the presentation for a thin live portal. A named operator may assist with setup and confirmation, but the system must record who performed each action and whether the practitioner actually agreed. Admins need operational details, not blanket access to family medical records.

Launch with family tasks/notes, personal habits, approved practitioner profiles, appointment requests and confirmations. Use the practitioner's existing meeting link or venue. Defer payments/payouts, public reviews, packages, wearables, automatic health imports, integrated video, medication-adherence claims and medical AI explanations. Keep document upload disabled in the live beta until private storage, record-level sharing and revocation are implemented. Demo-only features may remain in a clearly separate sample-data environment.

## Build order and acceptance criteria

### 1. Identity and durable data

Replace persona switching in the live environment with invited sign-in, session recovery and account settings. Separate demo fixtures from live accounts. Introduce durable identifiers and a repository/API layer so existing screens no longer treat imported fixtures as the live source of truth.

Data model: users/profiles, families, memberships, invitations, consent/access grants, dated tasks and completion events, habits and dated check-ins, practitioner profiles, services, availability, appointment requests/bookings, booking events and notification deliveries. Record actors and timestamps for changes. Store appointment instants and IANA time zones, not only formatted date strings.

**Accept when:** a user signs in on a second device and sees the same data after reload; another account cannot read or mutate it through direct API calls.

### 2. Real family participation

Implement invitation, acceptance, sharing scope and revocation. Ordinary family members can use standard or simple presentation. Acting for another adult requires the relevant granted permission. Owner, organiser, attendee and person completing a task must be represented separately.

**Accept when:** an organiser invites a relative, the relative accepts an explicit scope, receives a dated task, completes it, and the organiser sees the actor/time on another device. Revocation immediately prevents subsequent API access. A rejected or expired invite grants nothing.

### 3. Practitioner and operator loop

Use one canonical real practitioner/service catalogue for both consumer paths. Keep unpublished drafts and approval evidence separate from public fields; do not carry seeded verification badges, ratings or qualifications into live data.

The shared local practice model and client/practitioner screens now demonstrate this loop. Connect them to durable, authorised operations and retire or isolate the older instant-confirmed fixture booking paths in the live environment. A second real practitioner needs their own identity, owned catalogue/availability and scoped request inbox; changing the demo’s name does not provide that isolation.

A request begins as Requested. The practitioner or authorised operator can confirm or decline; changes and cancellation produce recorded events. Persist the agreed service description, duration, price/currency, attendee, actual time and session details. Make mutations idempotent and reject overlapping confirmed appointments in a transaction. The UI must distinguish the requester's preferred time from an accepted appointment.

**Accept when:** a client submits a request, the correct practitioner receives it, confirms it, and both see the same record after reload. A different practitioner cannot see that request. Cancellation propagates to both, and duplicate submissions do not create duplicate appointments.

### 4. Delivery and recovery

Provide actual transactional invitation and booking messages, with a retryable delivery queue and an operator-visible failure state. Show in-app persisted status even when a message fails. Add actionable loading, empty, validation, offline and error states; success messages must correspond to completed operations.

**Accept when:** a failed delivery can be retried without duplicating the underlying booking, and the operator can tell whether it was delivered. Do not label a local array mutation as sent.

### 5. Release readiness

Connect the selected backend/hosting project and configure the real environment. Add monitoring that avoids collecting health text, a working support contact, an appropriate privacy notice, and real export/deletion handling for data accepted by the beta. Review notices and practitioner eligibility against the actual pilot region and service scope; placeholder legal cards are not finished product flows.

Run server access-control and invitation/booking lifecycle tests, cross-device trials, phone keyboard/large-text/accessibility checks, and native device testing if native distribution is selected. Bundle export and the current demo checks are useful regression checks but do not establish these results.

**Accept when:** the family and appointment flows above pass against the deployed environment with separate accounts, a trial reset/restore is understood, and the team can respond to a tester's failed request. Then invite the first cohort; there is no need to launch every mocked feature.

## Current source evidence

- `src/state/AppState.tsx` and `src/practitioner/usePracticeState.ts`: consumer and practitioner mutations use local React state; no durable sync.
- `src/types/index.ts`: fixed demo-account and family-member unions, formatted date/time fields, no production membership/grant model.
- `app/onboarding.tsx` and `src/components/AccountSection.tsx`: four-persona selection, including the practitioner entry, rather than real registration.
- `app/_layout.tsx`: demo route guards are not server authorisation; the simple view can still reach some broader family routes by URL.
- `app/settings/[section].tsx`: simulated family invitations, security controls and data actions.
- `app/quick-add/[kind].tsx`, `app/savita-upload.tsx`, `app/metric/[memberId]/[kind].tsx`: several health inputs simulate success rather than saving actual files or observations.
- `src/data/care.ts`, `src/data/individual.ts`: separate seeded catalogues with generated or example professional information.
- `app/booking/[id].tsx`, `app/personal/booking/[id].tsx`: older fixture flows create Confirmed bookings without practitioner acceptance; these are separate from the connected practice requests.
- `src/practitioner/model.ts`: fixed demo clock, sample practice, validation and actor-aware local request transitions; no server or transactional persistence.
- `app/practice/` and `src/practitioner/Practitioner*.tsx`: implemented practitioner profile, services, schedule and request workspace.
- `app/practitioner-profile.tsx`, `app/request-care.tsx`, `app/care-request/[id].tsx`: client preview/request/details routes backed by the same in-memory practice state.
- `app/consultation/[id].tsx`: simulated consultation flow.
- No live auth/backend integration, operator/admin workspace or beta deployment is configured. Practitioner routes now exist; they do not create real practitioner accounts.

## Preparation performed in this pass

- Added a single `npm run check` command for TypeScript, lint and the demo interaction checks.
- Added GitHub Actions checks plus all-platform bundle export. The workflow does not deploy or need production secrets.
- Corrected the outdated README and ignored local environment-secret files while allowing placeholder examples.
- Updated the 12 packages behind Expo's recommended SDK 57 patch set, including Expo 57.0.25, Expo Router 57.0.23 and React Native 0.86.3. Added the Expo-recommended status-bar configuration plugin. The earlier dependency snapshot was validated in an isolated clean installation on Node 22.23.3: TypeScript, lint, all 23 checks and web/iOS/Android exports passed; dependency alignment passed and Expo Doctor passed 21/21 checks. These historical results predate the practitioner implementation. GitHub execution itself has not been observed.
- The fresh dependency audit decreased from 22 entries (7 high) to 20 entries (5 high, 15 moderate; no critical). Remaining high entries trace through build/lint/configuration tools (`@xmldom/xmldom`, `brace-expansion`, `browserslist`, `image-size`, `js-yaml`). No client-runtime chain was observed in the dependency graph; this is not a claim that build-tool vulnerabilities are harmless. Keep dependency remediation in the release work. No forced SDK downgrades were applied.

- Added a shared Chandigarh launch-market configuration and aligned consumer onboarding, family/member locations, both sample catalogues, INR prices, IST appointments and regional care filtering. Added a regression check that rejects out-of-market practitioner data across every family profile. That earlier Chandigarh snapshot passed 24/24 checks and web, iOS and Android exports; it also predates the practitioner implementation.
- India emergency/support references were checked against [ERSS](https://112.gov.in/) and the [Ministry of Health's Tele MANAS programme](https://dghs.mohfw.gov.in/national-mental-health-programme.php).
- Implemented the fourth practitioner persona, editable practice setup and a shared client/practitioner request lifecycle. The integrated snapshot passes TypeScript, lint and all 49 regression checks. Web, iOS and Android bundle exports succeed. The 25 new checks cover actor/recipient ownership, state transitions, duplicate requests, appointment overlaps, availability changes, preserved fees, live directory edits and actual screen callbacks.
- Safari verification covered practitioner onboarding, the dashboard, profile form rendering, request queue/detail, appointment confirmation and switching to Riya to see the updated confirmed request. Fixed an unnecessary navigation dismissal exposed by switching protected roles. Native keyboard/device behavior and real multi-user deployment are not verified by these checks.

These changes provide the demo screens and local behavior to build on; they do not create authentication, a backend, real practitioner accounts or a deployed beta.

## Decisions needed to connect the real beta

1. First distribution channel: invite-only web, native test builds, or both.
2. The actual Chandigarh practitioner roster, professional categories, services and availability to publish; no sample listing becomes a real practitioner without their reviewed information.
3. Existing backend/hosting organisation, if any, and the person operating the beta support/approval queue.

The platform and available-practitioner questions were asked during this review. Practitioner availability and the Chandigarh-only market are confirmed; distribution channel, roster details and backend/hosting access remain open. Work on shared product/data foundations can proceed while distribution is decided.

## Distribution references

[Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/) documents the supported runtime/toolchain. [Expo web deployment](https://docs.expo.dev/deploy/web/) describes exporting an Expo Router web application and publishing through EAS Hosting. [Native internal distribution](https://docs.expo.dev/build/internal-distribution/) requires platform-specific build/signing and, for iOS ad hoc builds, registered devices. The appropriate hosting/build service should be connected after the launch target is selected; no app-store or beta distribution was submitted in this pass.
