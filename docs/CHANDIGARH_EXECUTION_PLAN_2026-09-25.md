# Circle: Chandigarh execution plan

25 September 2026. Recommendations following the founder's request to turn the prototype into a substantial business. Confirmed constraints: Chandigarh first; both individual and family experiences; the founder can recruit a mix of physiotherapists, therapists/counsellors, trainers and dietitians. The prices, cohort sizes, targets and sequence below are proposed experiments, not validated demand, committed dates or approved live offers.

## First business hypothesis

Circle helps adults arrange and keep ongoing care organised with local practitioners, either for themselves or for a relative who has granted permission. The first promise is operational: a suitable practitioner, an explicit appointment response, a dependable visit, and a clear next step. Circle does not promise clinical outcomes or emergency coverage.

Keep both entry paths, but share one real care workflow:

Request → practitioner accepts → visit occurs → agreed next step → follow-up when needed.

Invite a small mixed roster. Start with people who already have a reason for an appointment or an ongoing service; do not encourage unnecessary visits to improve retention metrics. Treat personal and family cohorts separately so success in one does not hide failure in the other. Each account has one identity; family participation is an optional permission relationship, and paying does not confer access to another adult's private information.

## Current reality

Four demo experiences exist: organiser, simple personal view, individual, practitioner. Schedule now includes Day, Week and List views. The latest prototype snapshot passes 62 source-level interaction/regression checks and web/iOS/Android bundle export; those results do not establish deployed security, real device behaviour or multi-user operation.

Authentication, database persistence, server authorization, actual notifications, multi-practitioner isolation, operator tooling and a live deployment are absent. Local persona switching is not account security. Legacy booking screens can still create instant Confirmed fixtures, and some uploads/settings simulate success. These must be isolated from live accounts.

Missing launch roles:

- **Invited adult family member:** accepts/rejects sharing, views their own care, completes assigned actions and revokes access. Reuse standard or simple presentation; simple view is a preference, not consent or a different security model.
- **Operator/admin:** approves and pauses practitioner listings, resolves overdue requests and delivery failures, handles support, and records every override. No general access to private health records.
- Practitioner reception/clinic staff delegation can follow evidence of need. Do not create separate apps for each professional category.

## Competitive reality

Official pages advertise meaningful overlap:

- [Practo](https://www.practo.com/) offers consultation discovery and booking. [Practo Ray](https://www.practo.com/providers/clinics/ray) advertises scheduling, reminders, records and follow-up communication.
- [Portea](https://care.portea.com/) advertises managed care, care coordination and family updates. Its [Chandigarh physiotherapy page](https://www.portea.com/physiotherapy/chandigarh/) advertises home visits locally.
- [Emoha plans](https://emoha.com/plans) advertise care coordinators, family/elder app access, care plans and health updates.

These are vendor claims, not independent proof of service quality, and do not establish local availability for every service. They do establish that a directory, calendar or family dashboard is insufficient evidence of differentiation.

Our proposed distinction is a better experience with independent local practitioners and optional family participation. Test it against each participant's actual phone/WhatsApp/calendar routine. Potential defensibility would have to be earned through repeat use, dependable supply, efficient local operations and low-cost referrals; it does not exist merely because the screens are built. Do not describe private health information as a commercial moat.

## Build sequence and launch gates

| Order | Deliverable | Observable acceptance |
| --- | --- | --- |
| 1 | Real invited sign-in, database, server permissions, isolated demo/live environments | Two independent accounts cannot access each other's objects through forged API calls; a restart or second device retains data; live data contains no seeded identities. |
| 2 | One approved practitioner → client request → confirmation/cancellation | Separate devices see the same durable record; retries create one request; a database transaction prevents conflicting confirmations; use real server time and IST display. |
| 3 | Multiple practitioner ownership and internal operator console | Each practitioner owns their listing/services/hours/inbox; another practitioner cannot read requests; an operator can approve/suspend a listing and resolve an exception with actor/time/reason recorded. |
| 4 | Real invitations and family access | The recipient explicitly accepts a defined scope; attendee, requester and payer remain distinct; revocation prevents subsequent access. Sensitive notes are private unless specifically shared. |
| 5 | Reliable messages and a small follow-up workflow | An invitation/request/status change produces a delivered or retryable message. Persist status in-app even when delivery fails. A practitioner can record an agreed next action/date; the client can see it without relying on AI-generated clinical instructions. |
| 6 | Invite-only release and operating readiness | Phone-browser trials with separate accounts; authorization and concurrency tests; no simulated-success live routes; reviewed roster; support owner and hours; appropriate privacy/terms and working deletion/export for data collected; monitoring, backup/recovery and deployment. |

Prefer an invite-only web release for the first test; this is a recommendation while distribution remains undecided. Existing screens can be connected incrementally, but do not call the product a live beta until the gates pass. A more complete internal operator mock alone would not satisfy them.

Still needed from the founder before external launch: backend/hosting project access or selection, actual practitioner details and permission to publish them, an invitation cohort, a support/operator owner, and the final distribution choice. Do not ask anyone to paste service secrets into chat; use the provider connection or environment configuration when implementation reaches that step.

Defer native-store distribution, live medical AI, wearable imports, integrated video, an unrestricted records vault, public ratings and payment/payout automation. Consultation fees can remain with the practitioner for an initial operational pilot. Do not expose record upload until private storage and sharing/revocation actually work.

## Six-week pilot after release readiness

Proposed cohort: **20 family households, 10 individual clients, 5–10 known practitioners**. Start from the available mixed roster; publish only practitioners who complete review and onboarding. Recruit some participants outside the immediate founder network and report their results separately. One household is one purchasing unit, not one person per family invitation.

Before release, interviews and prototype walkthroughs can happen in parallel with engineering. Ask for a recent concrete incident: the last appointment arranged, who chased whom, how long it took, what failed, and what they already pay for. A compliment or signup is not demand evidence.

Once the real workflow passes the launch gates:

1. Establish each participant's existing process and operational effort. Confirm the service they already need and the actual practitioner availability. Show the exact scope and price before collecting any payment.
2. Run the booking/follow-up workflow with operator assistance where necessary. Log request outcomes, cancellations, message failures and operator minutes, including founder labour. Keep clinical text out of analytics.
3. After a full month, ask for actual paid renewal at the same stated scope. Interview people who decline or stop using the service.
4. Review the two cohorts separately. Narrow the next cohort to the use case with the strongest paid retention and manageable support; a small pilot is directional evidence, not proof of a large market.

## Pricing and economics experiments

These numbers are illustrative test offers, **not market pricing or a revenue forecast**. Consultation fees are separate and are not Circle revenue. Do not assume practitioner commissions or permission to split professional fees.

| Hypothesis | Exact initial scope to test | Experimental price |
| --- | --- | --- |
| Household coordination | Appointment arranging, status/reminders, consented appointment sharing and tracking agreed follow-up; defined support hours. No emergency promise or unlimited concierge work. | ₹799 per household per month |
| Individual arranged booking | One successfully arranged appointment, clear response and appointment details; transparently state when the fee is payable and refundable. | ₹99 per successful booking |

These are alternative value tests, not a requirement to charge everyone or implement both billing models immediately. If individuals will not pay a booking fee, test whether the repeat workflow or practitioner-paid scheduling value exists rather than hiding fees or adding unsupported commissions.

Example contribution sensitivity, assuming the stated amount is net Circle revenue after any applicable taxes/refunds, operator cost of ₹300/hour, and all other variable costs of ₹75/household-month or ₹15/booking:

| Unit | Operator time | Illustrative contribution before acquisition and fixed costs |
| --- | --- | --- |
| ₹799 household-month | 45 minutes | ₹499 |
| ₹799 household-month | 120 minutes | ₹124 |
| ₹99 completed booking | 10 minutes | ₹34 |
| ₹99 completed booking | 20 minutes | −₹16 |

Replace every assumption with measured costs. Include failure handling, cancellations/refunds, messaging, processing and practitioner subsidies if any. Operator cost should include employment overhead where relevant. Upfront onboarding should be tracked separately and allocated over observed retained lifetime rather than ignored. A positive contribution is not company profit; acquisition and fixed costs remain.

## Proposed decision gates, with denominators

These are provisional experiment thresholds, not industry benchmarks or evidence already achieved.

- **Paid demand:** 10 of the 20 eligible family households buy the clearly scoped offer. Record all offers, declines, sources and reasons; do not omit reluctant participants from the denominator.
- **Renewal:** at least 7 of the first 10 paying households with a full month of exposure renew at the same price. Report the raw counts and exposure window; do not count trial extensions or verbal promises as renewals.
- **Individual value:** at least 5 of 10 eligible individual participants pay for an appointment they already needed; measure later paid repeats separately. Interpret against free alternatives.
- **Response:** at least 80% of valid requests receive a definitive confirmation or rejection within two stated working hours. Report confirmed/valid requests as well so fast rejections cannot masquerade as successful fulfilment.
- **Attendance:** completed visits divided by confirmed visits whose scheduled time has passed. Retain cancellations and no-shows as distinct reasons. Reconcile disputed completion with the client; a practitioner clicking Complete is not independent evidence of attendance.
- **Ongoing usefulness:** among people with a practitioner-agreed follow-up due during the observation window, report those who completed the agreed next care action or follow-up appointment. Keep this distinct from app opens and from clinical outcomes.
- **Economics:** report contribution per paying household-month and per completed booking, including all operator time. Record acquisition cost by source, including founder outreach time and referral incentives; calculate payback only from observed contribution and retention.
- **Less chasing:** compare the organiser's reported baseline coordination time and unresolved tasks with the pilot. Ask renewing participants what work they would have had to do themselves.

Do not expand the service geography on signup counts alone. A larger business would require repeatable paid retention, reliable practitioner participation, affordable acquisition and delivery, and a repeatable local operating model. Chandigarh is where to learn whether those conditions can exist.

## Immediate engineering ticket

Build the first durable, permissioned booking vertical slice and the minimum operator queue needed to support it. Definition of done: one approved practitioner and one real client on separate devices can request, accept, receive a notification, cancel and reload without disagreement or unauthorized access. Generalise practitioner ownership from the beginning so onboarding a second provider does not create another hardcoded demo account.
