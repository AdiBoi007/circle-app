# Circle: two paths, three experiences

This document records the product direction and interactive prototype built on 25 September 2026. The earlier [product audit](PRODUCT_AUDIT_2026-09-25.md) remains the broader production-readiness backlog.

## Product recommendation

Keep one Circle product. Personal health is the common foundation: my records, my routines, my appointments and people who can help. A family circle adds shared responsibilities and consent-based access. A person should eventually be able to manage their own health and help relatives without creating a second identity.

Keep families coordinating care across countries as the first commercial audience. That is the clearest differentiator in this concept. Explore the individual path as a way into the product, and test whether users come back for their own health between consultations. A broad practitioner directory by itself is a different business: it needs supply, local coverage, reliable availability and a reason to choose it over established booking services. Treat that as a hypothesis to validate, not evidence of product-market fit.

Ask **“Who are you managing health for?”** with **“Myself”** and **“My family & me.”** This is more directly related to the user's task than asking whether they have a family. The prototype offers separate sample profiles; adding a real family to an existing account is a future connected flow.

Simple view is a presentation preference, not a synonym for age or a permission level. Savita demonstrates it because the current feedback calls out her experience. In a production model, anyone should be able to choose it, while sharing permissions remain separate.

## What the prototype now does

| Experience | Primary navigation | Main job |
| --- | --- | --- |
| Arjun, family organiser | Today · Family · Health · Care · Ask Circle | See what needs attention and coordinate the next action |
| Savita, simple view | Today · Ask Circle · My care | Complete a daily action, understand a report or ask for help |
| Riya, personal health | Today · My health · Find care · Ask Circle | Build a routine and find individual support |

### Onboarding and switching

The previous twelve-step walkthrough is replaced by a two-step choice. The personal path introduces Riya Shah, 29, in Sydney. The family path offers Arjun's organiser view and Savita's simple view. A named profile control in each main header opens all three profiles and settings. Reloading returns the in-memory demo to its initial state.

### Family organiser

Today shows four labeled shortcuts for records, medicines, tasks and appointments; all four family members; current task completion and undo; and the next dated sample booking. Family is now a first-class destination with each member's profile, latest record and Medical ID. Health provides a searchable directory of existing features, including goals, insights and emergency information. Counts use session state where applicable.

Care exposes recipient, specialty and consultation format before secondary filters. The selected recipient is carried through the provider page into booking. Sample country and local-area eligibility are checked in listing, profile and booking. The old synthetic match and verification claims have been removed from the redesigned directory and provider detail. Legacy appointments with incompatible fixture data are identified rather than silently made bookable.

### Simple view

Savita's Today has two large completion controls: mobility exercises and applying her knee gel. Both support undo. Ask Circle and asking Arjun for help are visible actions. Medicines and reports have plain labels. My care leads with appointments; additional practitioners and history are behind labeled disclosure controls.

Appointment preparation uses the actual selected booking and provider. Report answers use Savita's selected record and its stored explanation. A family note is reviewed before saving, and each confirmation stays tied to its original note. The demo does not pretend to record voice input or send an external message.

### Individual health and marketplace

Riya has her own habits, saved providers and appointment state. The mock catalogue contains six practitioners across therapy, fitness, nutrition, physiotherapy and yoga. It supports text search, specialty and online/in-person filters, saved profiles, practitioner details, date/time selection, booking review, confirmation and cancellation. All in-person examples are around Sydney, with prices in Australian dollars and explicit time zones.

My health includes habits, sample sleep/movement detail, appointments and a personal records empty state. It does not invent uploaded documents or device connections. Family screens are excluded from Riya's root navigation; personal deep links also ask family users to switch profile. These are prototype presentation boundaries, not backend authorisation.

### Ask Circle

All three profiles have a direct conversation entry point. Family and personal composers remain visible below scrolling messages. Suggested questions show what the preview can answer. Responses use current session tasks, bookings and habits where applicable; the interface identifies the answers as previews. Family updates save as notes, without interpreting a sentence as a completed medicine dose or task.

## Research translated into design decisions

These are design interpretations of published patterns, not a claim that copying a successful app guarantees success.

| Source | Observed principle | Circle decision |
| --- | --- | --- |
| [Apple Health user guide](https://support.apple.com/en-sg/104997) | Summary with pinned categories and access to category detail | A personal or family summary, visible essential tools, and detail one step deeper |
| [ChatGPT usage guide](https://learn.chatgpt.com/docs/use-chatgpt) | Begin with a clear request, provide relevant context, and refine the result | A visible composer, example questions, clear scope and follow-up actions |
| [Nielsen Norman Group usability heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/) | Visible options, familiar language, feedback, recovery and user control | Labeled destinations, live completion state, undo, booking review and an explicit close control on sheets |
| [Nielsen Norman Group progressive disclosure](https://www.nngroup.com/articles/progressive-disclosure/) | Put primary actions first and reveal secondary complexity when needed | Three simple-view tabs; appointments before browsing; optional history and advanced filters |
| [Zocdoc search explanation](https://www.zocdoc.com/about/how-search-works/) | Relevant search criteria help patients find suitable options | Recipient/location/format filters and factual listing details, without invented match certainty |

The visual system keeps Circle's warm neutral background, with deep green focal cards, restrained pastel category colors, rounded surfaces and generous spacing. Headings establish the page purpose; icon-and-text controls identify actions. Standard content is capped at 760px on larger displays. Senior actions use larger targets and readable body copy. Buttons can grow with text, and sheets scroll with a visible close control.

## What is still a mock

- All people, health examples and provider availability are fixtures. Family scenarios use a labeled July 2026 demo day; the personal scenario uses September 2026.
- Bookings, habits, saved providers and notes live in memory. Nothing is persisted after a reload.
- There is no real authentication, clinician verification, calendar integration, payment processing, file storage, health-device connection, live AI or consultation session.
- The individual records page is an honest empty state, not a functioning upload service.
- The earlier audit's dependency and production infrastructure work remains outstanding. This redesign does not claim to close every audit finding.

Before live service, permissions must be enforced on the server and professional eligibility must come from verified service rules. The prototype's hardcoded country filters are an interaction demonstration.

## How to judge the next iteration

Run short sessions with representatives of all three experiences. Ask them to complete tasks without a tutorial; observe the first tap, completion time, wrong turns and whether help was needed. Record an after-task ease rating as well as overall preference.

| Person | Tasks to test | Proposed acceptance target |
| --- | --- | --- |
| Family organiser | Find a parent's report; find a medicine; complete and undo a task; book for the correct recipient | At least 4 of 5 participants complete each core task without assistance |
| Simple-view user | Mark exercises done; undo; find the next visit; save a note for family | At least 4 of 5 participants finish without navigating through settings |
| Individual | Find an online therapist; compare an in-person trainer; book and cancel; change a habit check-in | At least 4 of 5 participants complete the journey and can explain what was saved |

These are proposed success criteria, not achieved results. Also check 320px widths, large system text, VoiceOver/TalkBack, keyboard navigation, modal focus and back behavior on real devices. A higher UI score should follow those sessions, not a self-assigned rating.

## Engineering verification

The project uses Expo SDK 57. Its exact [versioned documentation](https://docs.expo.dev/versions/v57.0.0/) and local router types were checked before implementation.

Run from the project root:

```sh
npm run typecheck
npm run lint
node docs/redesign-checks.cjs
npx expo export --platform all --output-dir /tmp/circle-redesign-export
```

The regression harness executes the real state handlers and relevant screen callbacks using inert native primitives. It covers account separation, booking review/confirm/cancel, repeated confirmation, habit undo, filtering, route selection, search and reset. It is not a browser test or an accessibility certification.

Final results: TypeScript and ESLint passed; all 23 regression checks passed; web, iOS and Android production exports completed. The running Metro server returned HTTP 200 for the updated web bundle. Source and documentation changes were copied back to the original project and verified byte-for-byte against the tested runtime checkout.

Visual inspection could not be completed in this session: the computer-use tool reported no browser and macOS Accessibility/Screen Recording permissions were pending for Safari. Production exports verify bundling for web, iOS and Android; they do not establish native runtime or visual correctness.
