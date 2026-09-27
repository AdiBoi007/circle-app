# Circle interface refinement — 25 September 2026

This pass refines the three working experiences from the dual-direction prototype. It keeps family coordination, the older adult's simple view, and individual health management distinct while giving them a consistent visual language.

## Research and decisions

- [Apple: Get to know the new design system, WWDC25](https://developer.apple.com/videos/play/wwdc2025/356/): stronger type hierarchy, related content grouped together, rounded control geometry, and persistent navigation. Circle uses large leading titles, quiet white content groups, capsule controls and a separate navigation surface. The current implementation is React Native styling; it does not implement Apple's native Liquid Glass material.
- [Apple UI Design Dos and Don'ts](https://developer.apple.com/design/tips/): legible text, contrast, adequate touch targets and alignment. Primary actions remain explicit; compact layouts wrap rather than truncate essential information.
- [Apple Health](https://support.apple.com/en-sg/104997): a summary leads into health categories and details. Riya's home now starts with understandable sleep and step highlights; Arjun gets an actionable family overview instead of a decorative banner.
- [Things](https://culturedcode.com/things/features/): a focused daily task view informed the next-action treatment and visible completion/undo feedback. Savita sees two concrete reminders and direct help actions.
- [Expo SDK 57 documentation](https://docs.expo.dev/versions/v57.0.0/) was read before implementation, as required by AGENTS.md. No packages were added for this pass.

## What changed

- Shared palette: neutral grouped backgrounds, white surfaces, restrained separators and shadows, blue actions, and category-specific accents. System typography and consistent spacing replace competing ornamental elements.
- Navigation: a persistent capsule tab bar with selected filled icons and explicit selected states. Family organisers have five destinations, the simple view has three, and personal health has four.
- Shared headers: large titles, a compact named profile switcher, accessible notifications and a clearer profile sheet. Fixed a web flex issue that squeezed the profile name into a vertical column.
- Arjun: live task count and completion ring, one next task with completion/undo, a grouped essentials grid, family access and an appointment preview. Family and Health screens use clear grouped rows.
- Savita: larger reminder rows with explicit Mark done/Undo, direct Ask Circle and Ask Arjun actions, and simpler appointment presentation. Care, booking and preparation screens use the same quieter hierarchy.
- Riya: meaningful sample metric visuals, grouped habits, clearer practitioner search/filtering, compact practitioner cards and prominent price/booking actions. Booking and chat layouts accommodate narrow widths and longer labels.
- Onboarding: a shorter two-path introduction with visible selection states and clear entry into the three demo profiles.
- Accessibility fixes found during review: native and web progress values agree; SVG decoration no longer produces invalid DOM attribute warnings; the active tab is explicitly exposed to assistive technology.

## Verification

Safari responsive previews were inspected at 393 × 700 and 320 × 700. Reviewed onboarding, Arjun's summary, Savita's home, the account sheet, Riya's summary, practitioner marketplace/profile, and personal chat including a rendered sample response. Profile switching and navigation were exercised in the running app. The final review used a dedicated Safari window after the initial background window failed to paint modal transitions correctly.

TypeScript, ESLint, all 23 checks in `docs/redesign-checks.cjs`, and Expo exports for web, iOS and Android passed. The interaction checks exercise actual state handlers and screen callbacks through an inert component harness; they are not full native device tests.

The preview remains at http://localhost:8081. Metro runs from the local runtime copy at `/Users/adhirajdogra/.cache/circle/runtime` because the original project previously encountered cloud-backed file stalls. Updated source files are synchronised back to the project, checking their baseline hashes first to avoid overwriting intervening user edits.

## Remaining product limits

This remains an in-memory prototype with sample health data, practitioner listings and scripted assistant replies. Bookings do not contact practitioners or take payment. Reloading resets session changes. Native device interaction, VoiceOver navigation and large system font settings still need device testing; successful native bundle export does not establish those results.

The next meaningful quality measure is task-based testing with an organiser, an older adult and an individual user: can each find their next action, complete it, and recover without help? Visual polish alone cannot establish that the usability problem is solved.
