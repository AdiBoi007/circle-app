# Circle by Swasth

Circle helps people manage their own care or coordinate appointments with consenting family members. The first beta is scoped to Chandigarh, India, with INR prices and IST appointments.

**Start with the [live beta setup runbook](docs/LIVE_BETA_RUNBOOK.md).** The `/beta` app now uses real invited accounts, a PostgreSQL API and separate client, practitioner and operator workspaces. Local web runs at `http://localhost:8081/beta`, with the API at `http://localhost:8787/api`. **No external beta deployment has been made.**

The original four-persona sample app remains separate. Its demo profiles, scripted assistant, records and bookings do not become real accounts or health data. The [beta launch plan](docs/BETA_LAUNCH_2026-09-25.md) contains a current-status addendum followed by the historical audit.

## Run locally

Use Node.js 22.13 or newer and PostgreSQL 14 or newer. The supplied Docker setup uses PostgreSQL 16. Follow the runbook to create local environment files, generate secrets and configure database access before starting. The installed Expo SDK 57 minimum is documented in [Expo's versioned reference](https://docs.expo.dev/versions/v57.0.0/).

For the Docker path, after configuring `.env`:

```bash
npm ci
node scripts/live-local.mjs start
node scripts/live-local.mjs bootstrap --email YOUR_OPERATOR_EMAIL
npm run web:live
```

Supply the actual operator email. The bootstrap command creates an invitation link; it does not create a default password or signed-in account. The operator then invites the real practitioner/client roster. No sample practitioner is published into the live directory.

An existing local PostgreSQL instance can use the [direct Node setup](docs/LIVE_BETA_RUNBOOK.md#run-the-api-directly-with-node). Install API dependencies separately with `npm ci --prefix server`, configure `server/.env`, apply migrations and then start the API. The root Expo `.env` and API `server/.env` are separate files.

Root commands:

| Command | Purpose |
| --- | --- |
| `npm start` | Start Expo's development server |
| `npm run web:live` | Start the web client in live mode; opens `/beta` |
| `npm run api:dev` | Start the configured local API |
| `npm run api:migrate` | Apply API database migrations |
| `npm run api:bootstrap -- --email YOUR_OPERATOR_EMAIL` | Create the first operator invitation using the direct Node API configuration |
| `npm run ios` | Open the iOS development target |
| `npm run android` | Open the Android development target |
| `npm run typecheck` | Check TypeScript |
| `npm run lint` | Run ESLint |
| `npm run check` | Client TypeScript, lint and the sample-app interaction checks |
| `npm run check:api` | API types and integration tests; requires a separate configured test database |
| `npx expo export --platform all` | Export web, iOS and Android bundles |

Native development requires a compatible simulator/device setup and a reachable API; a phone’s `localhost` is not the development computer. Bundle export does not verify native device interactions. The sample-app interaction harness uses inert native components; it is not a browser or backend authorization test. Current integrated test results should be reported separately from the historical snapshots in the audit.

During this workspace session, Metro runs from `/Users/adhirajdogra/.cache/circle/runtime` because cloud-backed files in the original project previously stalled. Source changes are copied back only after checking that the project files have not changed independently.

## Live beta at `/beta`

- Invited email/password accounts, server sessions and PostgreSQL persistence. Live mode hides the sample-app routes.
- Client Today, Find care and Family views, with a saved Simple preference that shows larger appointment text and direct actions. Individuals and family organisers use the same account model.
- A directory of operator-approved practices, services, INR fees and actual available slots. Requests stay **Requested** until the owning practitioner confirms; cancellations, completion and practitioner follow-ups are shared through the API.
- Family invitation acceptance and revocation. The invitation states that the organiser can manage appointments and view practitioner follow-ups; access is checked on the server.
- Practitioner profile, service and schedule management, request review and appointment actions. Operators can invite users, approve/suspend practices, cancel bookings, inspect operational history and retry failed deliveries; clinical notes and follow-ups are hidden from their workspace.
- Persisted in-app updates and an email delivery queue. Real email requires configured Resend credentials and a verified sender; disabled local email is not labelled delivered. Account export and account closure/anonymisation flows are implemented, with retention review still required before external use.

To exercise the live workflow, use separate browser sessions for operator, practitioner and client accounts. Invite/register the practitioner, complete their practice/services/hours, approve the listing as operator, then request and confirm an appointment from the two relevant accounts. The [runbook](docs/LIVE_BETA_RUNBOOK.md#check-the-real-workflow) covers reload, conflict, permission, family and delivery checks. There is no persona switcher in the live workspace.

## Separate sample app

To explore the original demo, set `EXPO_PUBLIC_APP_MODE=demo`, restart Metro with `npm run web`, and open `/onboarding`. The four personas are Arjun (family organiser), Savita (simple view), Riya (personal health) and Arvind Nair (practitioner). Their changes stay in memory and reset on reload; the switcher is not authentication.

The demo includes:

- Family organiser: summary, family members, records, medicines, tasks, appointments, care directory and scripted assistant.
- Simple view: larger reminders, personal records and medicines, help actions and simplified appointment flows.
- Individual: sample health highlights, habits, practitioner discovery, saved profiles, demo booking/cancellation, personal records and scripted assistant.
- Practitioner: editable profile, services and INR fees, weekly availability and closed dates, request inbox, confirmation with session details, decline/cancellation reasons and activity history.
- The connected practice flow keeps a client request as Requested until Arvind confirms it. Clients see the response and can cancel their own requests or appointments. These shared demo records are separate from the older sample directory bookings.
- Onboarding asks whether the person wants to manage their own health or family care, with an “I’m a practitioner” entry. The named personas are examples, not production accounts.

## Try both sides of an appointment

**Sample app only:** use the profile switcher and in-app navigation in one running session. Reloading, entering a new URL that reloads the page, or opening a separate tab does not preserve or share changes. The practitioner schedule uses a fixed demo clock of **25 September 2026, 9:00 am IST**; the live beta instead uses server time.

1. Choose **I’m a practitioner** during onboarding, or switch to **Arvind Nair**. The workspace opens at `/practice`. Use **My practice**, **Services & prices** and **Schedule** to edit the sample profile, fees and availability.
2. Switch to **Riya**, open **Care** (the Find care screen), and choose **View practice** on Arvind’s **Connected sample practice** card. Its profile is `/practitioner-profile`. Request a service, choose an available date/time and submit; the status starts as **Requested**. Arjun can request for a family member; Savita can request for herself.
3. Switch back to **Arvind**, open **Requests**, and select the request. Add sample session details to confirm, or decline with a reason. Existing sample requests let you try this step immediately.
4. Switch back to Riya and open **Care → My appointments → Care requests**. Review the new status/details, then cancel with a reason. Returning to Arvind’s requests shows that cancellation.

For family testing, Arjun’s full request list is in **Family calendar** and Savita’s is in **My care**. Request ownership stays with the persona that submitted it, including when Arjun requests for a relative.

These steps describe the local demo workflow, not a completed browser/device test or a real consultation. Use sample information only.

## Project structure

```text
app/                      Expo Router screens
  beta.tsx                Live authentication and role workspace entry
  (tabs)/                 Profile-specific primary navigation
  personal/               Individual booking, provider and record screens
  practice/               Practitioner navigation and request screens
src/
  accounts/               Individual and simple-view presentations
  experience/             Shared headers and family organiser screens
  practitioner/           Shared demo practice model and both sides of requests
  live/                   API client, sessions and real account workspaces
  components/             Reusable interface components
  state/                  In-memory prototype state
  data/                   Typed sample fixtures
  theme/                  Shared warm off-white design tokens
  types/                  Current prototype models
  utils/                  Formatting and demo helpers
docs/                     Product audits, design notes and interaction harness
server/                   Auth/API, PostgreSQL migrations and integration tests
scripts/live-local.mjs    Local API/database setup helper
.github/workflows/        Client/API checks and bundle export (no deployment)
```

## Release boundary

The local implementation is ready for integration work, not a claim that an external healthcare service has launched. Before the first real health data is accepted, provide the operator identity and actual practitioner roster, review credentials/licensing and service scope, complete privacy/consent/retention and incident-support review, and establish backups with a tested restore. Operator listing approval is an administrative workflow, not automated qualification verification.

External HTTPS hosting/domain configuration, working transactional email/password recovery and deployed multi-account/device verification remain required. The implemented mail transport is Resend; no generic SMTP adapter is included. See the [release requirements](docs/LIVE_BETA_RUNBOOK.md#external-hosting-configuration-still-required).

No live payments/payouts, medical-record uploads, integrated video consultations or medical AI were added. Medicines, health records, habits and broader clinical tools shown in the sample app remain outside this live beta scope. Keep sample and live data separate.

Keep server secrets out of Expo public environment variables and the application bundle. Local environment files are ignored; checked-in examples may contain placeholders only.
