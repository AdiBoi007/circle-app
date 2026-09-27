# Run the Chandigarh live beta locally

This runbook configures the live client and API. It does not publish a production deployment or create a default account. The original four-persona prototype remains a separate demo; live accounts use the API and database.

Use Node.js 22.13 or newer and PostgreSQL 14 or newer. The supplied container/CI setup uses Node 22 and PostgreSQL 16. The database migration needs permission to install the PostgreSQL `btree_gist` extension, which enforces confirmed appointment overlap constraints.

## Local Docker setup

Install Docker with the Compose plugin, then work from the repository root.

1. Copy `.env.example` to `.env`. Keep this local file out of source control.
2. Set `AUTH_SECRET` and `DATABASE_PASSWORD` to two independently generated values. A 32-byte hexadecimal value avoids URL-escaping issues in the Compose database URL. Generate each value locally with:

   ```bash
   node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
   ```

3. Leave `MAIL_TRANSPORT=disabled` for local testing. Leave the public origins as `http://localhost:8081` for Expo and `http://localhost:8787` for the API.
4. Install the client and start the API stack:

   ```bash
   npm ci
   node scripts/live-local.mjs start
   ```

The script builds the API image, starts the database, runs migrations successfully, and then starts the API. Compose also declares database-health and migration-completion dependencies. These use Docker’s documented [startup conditions](https://docs.docker.com/compose/how-tos/startup-order/).

The equivalent explicit commands are:

```bash
docker compose build api
docker compose up -d db
docker compose run --rm migrate
docker compose up -d --no-deps api
```

The API and database bind to `127.0.0.1` on ports 8787 and 5432. The database persists in the `circle-postgres-data` named volume. The container health check calls `/api/health`. This setup uses development HTTP origins; it is not an internet-facing production configuration.

## Create the first operator

The founder must supply the operator’s real email address. No account, password or practitioner roster is seeded by these deployment files.

```bash
node scripts/live-local.mjs bootstrap --email YOUR_OPERATOR_EMAIL
```

Replace `YOUR_OPERATOR_EMAIL` before running. This command creates the first operator invitation and prints its invitation URL. It does not silently create an authenticated user. Open the returned URL, use the invited email, review the consent information and choose a password to register.

Treat invitation URLs as credentials: share only with the intended recipient and avoid pasting them into public tickets or logs. With email disabled, use the returned link manually; a created invitation is not a delivered email. Subsequent client and practitioner invitations can be created from the operator workspace.

In a second terminal, start the web client:

```bash
npm run web
```

The root `.env` sets `EXPO_PUBLIC_APP_MODE=live` and `EXPO_PUBLIC_API_URL=http://localhost:8787`. Restart Metro after changing those values. Use `localhost` consistently in the browser and configured origins; swapping it for `127.0.0.1` changes the browser origin.

## Run the API directly with Node

For an existing local PostgreSQL instance, create a dedicated `circle` database and login using your normal database administration tools. Give the migration role the required extension/table privileges. Do not reuse a production database for development or tests.

Copy `server/.env.example` to `server/.env`, replace the database-password placeholder, and set a random `AUTH_SECRET`. Match the database port to your instance: the supplied Compose stack uses 5432; if your native PostgreSQL instance uses 15432, use 15432 in both database URLs instead. `server/src/config.ts` loads this file directly. The root Expo `.env` and `server/.env` are separate configurations.

```bash
cd server
npm ci
npm run migrate
npm run bootstrap -- --email YOUR_OPERATOR_EMAIL
npm run dev
```

Use `npm start` for the non-watching process. Always apply migrations before starting a newly released API version. Server dependencies are installed separately from the Expo dependencies; `tsx` is currently used by the start, migration and bootstrap scripts, so do not omit server dev dependencies from this runtime image.

## Check the real workflow

Use separate browser sessions for each account so identity and permissions are tested across actual sessions.

1. Register the invited operator. Create a practitioner invitation and share its actual link.
2. Register the practitioner, complete the practice profile, add a service and configure working hours. Review the submitted information as operator and approve the practice with a recorded reason.
3. Invite and register a client. Request an available future slot. Confirm that the request starts as **Requested**.
4. As the practitioner, confirm with session details, or decline with a reason. Refresh the client and verify the result persists after reloading.
5. Try cancellation, a conflicting slot, a closed date, and a family invitation that is explicitly accepted by its recipient. Confirm that unrelated accounts cannot see the appointment or act on it.
6. Check the operator delivery queue. With email disabled, delivery failures are expected and must remain labelled as failures. A UI toast alone does not establish delivery.

## Email configuration

`MAIL_TRANSPORT=disabled` supports honest local testing: invitation links can be shared manually, outbox entries show that delivery is not configured, and email password recovery is unavailable.

To enable the implemented Resend transport, supply these values only in the API environment:

```dotenv
MAIL_TRANSPORT=resend
RESEND_API_KEY=YOUR_PROVIDER_KEY
MAIL_FROM=Circle <YOUR_VERIFIED_SENDER_ADDRESS>
```

Use a sender on a domain you control and have verified with the provider. Resend documents its [domain verification requirements](https://resend.com/docs/dashboard/domains/introduction). Confirm a real invitation and password-recovery message reach the intended inbox, then test the operator retry flow for a failed delivery. A configured API key or a Pending outbox record is not proof of delivery.

Keep `AUTH_SECRET` stable across restarts: it also protects queued email payloads. Plan secret rotation and recovery of pending deliveries before changing it.

## Tests and CI

The client install runs a guarded compatibility patch for security-patched parser dependencies. Use `npm ci` without `--ignore-scripts`. If an install stops on a version/source mismatch, review the affected dependency and `scripts/patch-sdk-parsers.cjs`; do not bypass the guard.

Run client checks from the repository root:

```bash
npm run check
```

Create a separate disposable `circle_test` database and set `TEST_DATABASE_URL` in `server/.env` before running API tests. With `NODE_ENV=test`, the API configuration requires `TEST_DATABASE_URL`; do not point it at the application database.

```bash
cd server
npm ci
npm run typecheck
NODE_ENV=test npm run migrate
NODE_ENV=test npm test
```

The checked-in `live-api.yml` workflow provisions its own PostgreSQL service, generates a temporary auth key, installs locked API dependencies, checks types, applies migrations and runs the tests. Its database credentials exist only for that disposable CI job. This workflow validates code; it does not deploy it.

## Operations and updates

```bash
node scripts/live-local.mjs logs
node scripts/live-local.mjs stop
```

Stopping retains the database volume. Re-run `start` after source updates to rebuild and apply new migrations. Changing `DATABASE_PASSWORD` in `.env` does not change the password of an already initialised PostgreSQL volume; rotate the database login deliberately and update its clients together.

Before an external release, establish database backups and perform a restore into a separate database. Keep the previous application image available for rollback, and assess migration compatibility before rolling code back. Do not remove a database volume as an application-update step.

## External hosting configuration still required

The recommended web arrangement serves the static Expo export and `/api/*` through the same HTTPS origin. Deploy the API as a separate Node process/container behind that proxy, with a managed PostgreSQL database. Forward `/api/*` to the API without rewriting away that prefix. Preserve authentication cookies and request headers, and do not cache private API responses.

Set the API environment to `NODE_ENV=production`, with both `API_URL` and `APP_URL` set to the public HTTPS origin. Set `HOST=0.0.0.0` inside a container. Use your hosting provider’s secret store for `AUTH_SECRET`, `DATABASE_URL`, mail credentials and sender settings.

Before exporting the web client, set `EXPO_PUBLIC_APP_MODE=live` and `EXPO_PUBLIC_API_URL` to that same public origin, without `/api`. Then export:

```bash
npx expo export --platform web
```

The public API URL is included in the client bundle. Never put database credentials, auth secrets or email-provider keys in `EXPO_PUBLIC_*` variables. Hosting configuration must support the app’s `/beta` route and invitation URLs. An API on a different origin also needs its actual browser origin, cookie and CORS configuration checked; do not assume the local two-port setup proves cross-site production authentication.

A physical phone cannot reach a developer computer through the phone’s own `localhost`. Native testing requires a reachable API URL, the matching server origins and native authentication/deep-link setup. Use a valid HTTPS endpoint for device testing and production; restart/rebuild the client after changing its public API URL. No native network-security exception is configured by this runbook.

Before inviting outside pilot participants, provide the actual host/domain, operator identity and practitioner roster; verify credentials, service scope and clinic details; configure email and password recovery; complete consent/privacy, retention/deletion, incident ownership and backup/restore review; and test the deployed multi-account journey. These deployment files do not certify those external operational requirements or claim that production has been deployed.
