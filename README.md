# Circle by Swasth

The single source of truth for an entire family's health — records, metrics,
medications, reminders, care tasks, goals and bookings, with **Circle AI** to
explain it all and help match the family with non-doctor care professionals.

Built to feel like Apple Health / Fitness reimagined as a premium family
product: warm off-white surfaces, soft pastel bento cards, large bold headings
and calm, medically-trustworthy hierarchy.

> **Status: Phase 1 — foundation only.** This build ships the project
> foundation, design system, navigation and a polished four-tab application
> shell. Every screen is a real, navigable placeholder backed by local typed
> mock data. There is **no backend, database, network layer, auth, payments or
> real AI** yet — all future functionality will use local typed mock data and
> local state.

---

## Running the app

You'll need [Node.js](https://nodejs.org) 18+ and the Expo tooling (bundled via
`npx`). No global install required.

```bash
npm install
```

### Expo Go (fastest — physical device)

1. Install **Expo Go** from the App Store / Play Store.
2. Start the dev server:
   ```bash
   npm start
   ```
3. Scan the QR code shown in the terminal with your phone
   (Camera app on iOS, Expo Go on Android). The app loads over the local
   network — keep phone and computer on the same Wi-Fi.

### iOS Simulator (macOS + Xcode)

```bash
npm run ios
```

Boots the iOS Simulator and opens Circle in Expo Go. Requires Xcode with an
iOS Simulator installed.

### Android emulator / device

```bash
npm run android
```

Launches on a running Android emulator or a USB-connected device with USB
debugging enabled (requires Android Studio for the emulator).

### Other useful scripts

| Command             | What it does                                        |
| ------------------- | --------------------------------------------------- |
| `npm start`         | Start the Metro dev server (QR code for Expo Go)    |
| `npm run ios`       | Open on the iOS Simulator                           |
| `npm run android`   | Open on an Android emulator/device                  |
| `npm run web`       | Open in the browser (react-native-web)              |
| `npm run typecheck` | `tsc --noEmit` — strict TypeScript check            |
| `npm run lint`      | ESLint via `eslint-config-expo`                     |

---

## Tech stack

- **React Native** + **Expo** (SDK 57)
- **TypeScript** (strict)
- **Expo Router** for file-based navigation (headless `expo-router/ui` tabs)
- **react-native-safe-area-context** for safe areas
- **@expo/vector-icons** (Ionicons / Feather) — no emoji icons
- **react-native-svg** for the vector logo
- **expo-linear-gradient** for subtle pastel card depth

One codebase, iOS + Android.

---

## Project structure

```
app/                         # Expo Router routes
  _layout.tsx                # Root stack + providers + splash
  (tabs)/
    _layout.tsx              # Custom premium four-tab bar (headless UI tabs)
    index.tsx                # Home  (pastel bento dashboard)
    ai.tsx                   # Circle AI  (empty state + dark composer)
    care.tsx                 # Care  (search, categories, professionals)
    settings.tsx             # Settings (account + grouped rows)

src/
  theme/                     # Design tokens: colors, spacing, typography,
                             #   radius, shadows, pastels
  components/                # Reusable typed UI (Button, Card, Avatar, …)
    brand/                   # CircleMark + CircleWordmark (vector logo)
  types/                     # Domain models (FamilyMember, Metric, …)
  data/                      # Local typed mock data
  hooks/                     # e.g. useReducedMotion
  utils/                     # e.g. time / greeting helpers
```

Import via the `@/*` alias, e.g. `import { Card } from '@/components'`.

---

## Design system

Tokens live in [`src/theme`](src/theme) and are the single source of truth:

- **Colors** — warm background `#F6F1E8`, surface `#FFFDF8`, near-black text,
  restrained semantic accents (blue / sage / amber / plum / red) and soft
  pastels (lavender / blue / mint / peach) for metric cards.
- **Spacing** — 8-point rhythm. **Radii** — cards 24–28, buttons 20, pills full.
- **Typography** — Apple-style ramp with compact letter spacing, capped font
  scaling so large accessibility text never breaks layouts.
- **Shadows** — soft, warm, low-opacity elevation.

Reusable components include `ScreenContainer`, `Button`, `IconButton`, `Card`,
`MetricCard`, `StatusPill`, `Avatar`, `SectionHeading`, `ScreenHeader`,
`ListRow`, `ProgressBar`, `EmptyState`, `Skeleton`, `Sheet`, `FamilySelector`
and the `CircleMark` / `CircleWordmark` logo.

Accessibility baked in: large touch targets, labels on icon-only buttons,
status never communicated by colour alone, and reduced-motion support.

### The logo

`CircleMark` / `CircleWordmark` ([`src/components/brand`](src/components/brand))
are pure SVG — a calm botanical family-tree glyph (ring, stem, five leaves).
They scale crisply from 24px to splash size, with compact/default/splash
variants and dark/light (reversed) tones. Used in the composer empty state,
Settings footer and the "next phase" sheet.

---

## What's next (Phase 2)

Detailed family data and member profiles, Circle AI conversation simulation,
the full Care directory, reminders/goals interactions and real data plumbing.
Placeholder actions currently open a polished "this flow will be completed in
the next phase" sheet — there are no dead taps.
