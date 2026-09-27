# Live beta implementation — 25 September 2026

Circle now has an invite-only live application at `/beta`, alongside the existing sample app. The server uses PostgreSQL, Hono and Better Auth; live screens read the authenticated API rather than sample state. The initial market remains Chandigarh, with INR prices and Asia/Kolkata appointment times.

## Implemented

- Invitation-bound registration, password sign-in, revocable sessions, conditional email password recovery and a first-operator bootstrap command.
- Personal accounts, a simpler personal view, accepted family permissions, family invitation revocation, and booking on behalf of authorised members.
- Separate practitioner accounts, editable practice profiles/services/fees, working hours and closed dates, and operator review before marketplace publication.
- Durable appointment requests, practitioner confirmation/decline, reasoned cancellation, completion and follow-ups. Pricing and duration are snapshotted when requesting; changes after review require a fresh review before submission. Concurrent confirmations cannot overlap at the database level; retrying a request preserves idempotency.
- An operator workspace for practice review, invitations, operational booking status, email failures and audit history. Clinical notes, joining details and follow-ups are excluded from operator booking responses.
- In-app updates plus an encrypted email outbox and optional Resend worker. `Sent` means provider acceptance; inbox delivery/bounce webhooks are not implemented. With mail disabled, email is shown as failed/unconfigured, never delivered.
- Account information export and account closure with session/grant revocation, appointment cancellation and personal-field anonymisation. Some operational records remain; the retention policy still needs review before handling real health data.
- Live-mode route protection prevents navigating into sample uploads, records, consultations and assistant screens.

## Validation performed

- Client TypeScript and ESLint passed.
- 63/63 existing interaction/route regression checks passed, including the new live-versus-demo boundary. This harness uses inert native components and is not a device end-to-end test.
- 18/18 real PostgreSQL and HTTP tests passed (16 individual cases plus two parent tests). These exercise invitation/email/role binding, actual Better Auth cookie sessions, sign-out, account closure, ownership, family revocation, durable idempotency, concurrent confirmations, reviewed fee/duration changes, availability and redaction.
- Fresh `npm ci` and the committed parser compatibility checks passed. Those checks also passed on the exact minimum Node 22.13.0 runtime. Both installed Metro asset readers, normal/Unicode/malformed query parsing, and Xcode ID generation were exercised. The client dependency audit now reports zero vulnerabilities.
- Web, iOS and Android production bundle exports passed with `EXPO_PUBLIC_APP_MODE=live`. Export success does not verify native device behaviour.
- Browser review verified the sign-in screen renders. A complete authenticated browser walkthrough was not verified: computer-use capture failed during the session. Native devices, the deployed web workflow and real email receipt remain release checks.
- The supplied Docker/Compose configuration was checked structurally; Docker is absent on this machine, so container startup was not executed. CI is configured but has not run on a remote runner in this session.

## Local processes and data

The app and actual empty beta API run at `http://localhost:8081/beta` and `http://localhost:8787/api/health`. Runtime code and private development configuration are under `/Users/adhirajdogra/.cache/circle/runtime` because the original project is backed by cloud placeholders. Source changes are synchronised back after checking original-file hashes.

The local PostgreSQL instance is isolated on `127.0.0.1:15432`; `circle_live`, `circle_test` and `circle_preview` are separate databases. Real account/role tests use only synthetic `example.test` identities, and no external email was sent. The actual beta database has no default operator or practitioner roster. No credentials are committed in the source tree.

## External launch still requires

1. A founder/operator email and the actual practitioner roster. The local bootstrap command creates a private invitation for that specific address; it does not install a default administrator password.
2. A hosting project/domain, HTTPS and production secrets, a managed database, backups and a tested restore.
3. A verified email sender/provider and a real invitation/password-recovery delivery check.
4. Practitioner credential/service-scope review and the product's consent, privacy, retention and support arrangements.
5. A complete deployed, multi-account browser test and native device testing before claiming mobile readiness.

Payments, document storage/uploads, integrated video, medical AI and migration of all sample health-record features are outside this live booking beta. They remain separate future work; no public deployment or app-store release has been performed.

Setup and deployment steps: [Live beta runbook](LIVE_BETA_RUNBOOK.md).

## Dependency compatibility maintenance

Compatible transitive updates removed the initial XML/YAML, brace-expansion and browser-data findings. Narrow overrides now select the patched URI decoder, image parser and UUID packages. `scripts/patch-sdk-parsers.cjs` adapts the two older callers (query-string’s CommonJS import and Metro’s pathname input) without modifying parser algorithms. It checks exact versions, actual resolution and complete source hashes before applying changes; unexpected source changes stop installation. `npm run check:dependencies` rejects unpatched installs. Do not skip installation scripts. Review these guards when upgrading the SDK or dependencies; run fresh `npm ci`, compatibility checks and platform exports. See the source links in the patch script.
