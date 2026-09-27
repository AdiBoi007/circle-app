/* global __dirname */
// Run: node docs/redesign-checks.cjs [project-root]
// Executes the real TS/TSX state handlers and route components without adding
// dependencies. Native primitives are inert element descriptors; this checks
// behaviour and route selection, not visual layout or native accessibility.
// Protected-route assertions cover demo UI boundaries, not backend security.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(process.argv[2] || path.join(__dirname, '..'));
const ts = require(path.join(root, 'node_modules/typescript'));
const results = [];

function check(name, action) {
  try { action(); results.push({ name, passed: true }); console.log(`PASS ${name}`); }
  catch (error) { results.push({ name, passed: false }); console.error(`FAIL ${name}\n  ${error.message}`); }
}

const element = (type, props, key) => ({ type, props: props || {}, key });
const primitives = new Map();
function primitive(name) {
  if (!primitives.has(name)) {
    const fn = (props) => element(name, props);
    Object.defineProperty(fn, 'name', { value: name });
    fn.displayName = name;
    fn.glyphMap = {};
    primitives.set(name, fn);
  }
  return primitives.get(name);
}
const primitiveModule = new Proxy({}, { get: (_, name) => name === '__esModule' ? true : primitive(String(name)) });

function createHooks() {
  const slots = [];
  let cursor = 0;
  return {
    begin() { cursor = 0; },
    react: {
      useState(initial) {
        const index = cursor++;
        if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial;
        return [slots[index], (update) => { slots[index] = typeof update === 'function' ? update(slots[index]) : update; }];
      },
      useRef(initial) { const index = cursor++; if (!(index in slots)) slots[index] = { current: initial }; return slots[index]; },
      useMemo: (factory) => factory(),
      useCallback: (callback) => callback,
      useEffect: () => {},
      useLayoutEffect: () => {},
      createContext: () => ({ Provider: primitive('ContextProvider') }),
      useContext: () => { throw new Error('The hook harness expects context to be read through its explicit state adapter.'); },
      forwardRef: (render) => render,
    },
  };
}

function createRuntime({ hooks = createHooks(), state, params = {}, markers = false, env = {} } = {}) {
  const cache = new Map();
  const navigation = [];
  const routeParams = { ...params };
  // Exercise the real mode module while keeping the fixture independent of the
  // developer's shell environment and without initialising live authentication.
  const environment = { EXPO_PUBLIC_APP_MODE: 'demo', ...env };
  const router = {
    push(href) { navigation.push({ action: 'push', href }); },
    replace(href) { navigation.push({ action: 'replace', href }); },
    back() { navigation.push({ action: 'back' }); },
    setParams(next) { Object.assign(routeParams, next); },
  };
  const native = new Proxy({
    StyleSheet: { create: (styles) => styles, hairlineWidth: 1, absoluteFillObject: {} },
    Platform: { OS: 'web', select: (choices) => choices.web ?? choices.default },
    useWindowDimensions: () => ({ width: 390, height: 844, scale: 1, fontScale: 1 }),
    AccessibilityInfo: { isReduceMotionEnabled: async () => false, addEventListener: () => ({ remove() {} }) },
    Alert: { alert() {} },
    Keyboard: { dismiss() {} },
  }, { get(target, key) { return key in target ? target[key] : primitive(String(key)); } });
  function load(relative) {
    let absolute = path.resolve(root, relative);
    if (!fs.existsSync(absolute) || fs.statSync(absolute).isDirectory()) {
      absolute = ['.ts', '.tsx', '.js', '/index.ts', '/index.tsx'].map((suffix) => absolute + suffix).find((candidate) => fs.existsSync(candidate));
    }
    if (!absolute) throw new Error(`Cannot resolve ${relative}`);
    if (/\.(jpg|png|ttf)$/.test(absolute)) return absolute;
    if (cache.has(absolute)) return cache.get(absolute).exports;
    const module = { exports: {} };
    cache.set(absolute, module);
    function localRequire(specifier) {
      if (specifier === 'react') return hooks.react;
      if (specifier === 'react/jsx-runtime') return { jsx: element, jsxs: element, Fragment: 'Fragment' };
      if (specifier === 'react-native') return native;
      if (specifier === 'expo-router') return { router, Redirect: primitive('Redirect'), useLocalSearchParams: () => routeParams, usePathname: () => '/', useSegments: () => [], Stack: Object.assign(primitive('Stack'), { Screen: primitive('StackScreen'), Protected: primitive('StackProtected') }) };
      if (specifier === 'expo-router/ui') return primitiveModule;
      if (specifier === 'react-native-safe-area-context') return { SafeAreaView: primitive('SafeAreaView'), SafeAreaProvider: primitive('SafeAreaProvider'), useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) };
      if (specifier === '@expo/vector-icons' || specifier === 'expo-linear-gradient' || specifier === 'react-native-svg') return primitiveModule;
      if (specifier === 'expo-speech') return { speak() {}, stop() {} };
      if (specifier === 'expo-splash-screen') return { preventAutoHideAsync: async () => {}, hideAsync: async () => {} };
      if (specifier === 'expo-status-bar') return { StatusBar: primitive('StatusBar') };
      if (specifier === '@/state' && state) return { useAppState: state, AppStateProvider: primitive('AppStateProvider') };
      if (specifier === '@/components' || specifier.startsWith('@/components/')) return primitiveModule;
      if (specifier === '@/experience/ExperienceHeader') return primitiveModule;
      if (markers && (specifier.startsWith('@/accounts/') || specifier.startsWith('@/experience/'))) return primitiveModule;
      if (specifier.startsWith('@/')) return load(`src/${specifier.slice(2)}`);
      if (specifier.startsWith('.')) return load(path.relative(root, path.resolve(path.dirname(absolute), specifier)));
      throw new Error(`Unexpected dependency ${specifier} in ${path.relative(root, absolute)}`);
    }
    const output = ts.transpileModule(fs.readFileSync(absolute, 'utf8'), { fileName: absolute, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
    vm.runInNewContext(output, { module, exports: module.exports, require: localRequire, process: { env: environment }, Date, console, setTimeout() {}, clearTimeout() {} }, { filename: absolute });
    return module.exports;
  }
  return { load, hooks, routeParams, navigation, render(Component) { hooks.begin(); return Component({}); } };
}

function nodes(tree) {
  if (tree === undefined || tree === null || typeof tree === 'boolean') return [];
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  if (typeof tree !== 'object') return [tree];
  return [tree, ...nodes(tree.props?.children)];
}
function stackRoutes(tree, ancestors = []) {
  if (Array.isArray(tree)) return tree.flatMap((child) => stackRoutes(child, ancestors));
  if (!tree || typeof tree !== 'object') return [];
  const guards = tree.type?.name === 'StackProtected' ? [...ancestors, tree] : ancestors;
  if (tree.type?.name === 'StackScreen') return [{ name: tree.props.name, guards, nearestGuard: guards.at(-1), enabled: guards.every((guard) => Boolean(guard.props.guard)) }];
  return stackRoutes(tree.props?.children, guards);
}
function stackRoute(tree, name) {
  const registrations = stackRoutes(tree).filter((route) => route.name === name);
  assert.equal(registrations.length, 1, `${name} must be registered exactly once`);
  return registrations[0];
}
function textOf(tree) { return nodes(tree).filter((node) => typeof node === 'string' || typeof node === 'number').join(' '); }
function findByTitle(tree, title) {
  const node = nodes(tree).find((item) => item && typeof item === 'object' && item.props?.title === title);
  assert(node, `Missing control: ${title}`);
  return node;
}
const same = (actual, expected, label) => assert.equal(JSON.stringify(actual), JSON.stringify(expected), label);

const stateRuntime = createRuntime();
const { AppStateProvider } = stateRuntime.load('src/state/AppState.tsx');
function readState() { return stateRuntime.render(AppStateProvider).props.value; }
const initial = readState();
const familyKeys = ['tasks', 'goals', 'records', 'medications', 'notifications', 'bookings', 'savedProviders', 'takenMedicationIds', 'familyLogs'];
const familySnapshot = (state) => Object.fromEntries(familyKeys.map((key) => [key, state[key]]));
const initialFamily = JSON.stringify(familySnapshot(initial));
const individualData = stateRuntime.load('src/data/individual.ts');

check('Initial state separates personal and family bookings and starts at onboarding', () => {
  assert.equal(initial.hasStarted, false);
  assert.equal(initial.activeAccountId, 'arjun');
  assert(initial.bookings.every((booking) => !booking.id.startsWith('riya-')));
  assert(initial.individualBookings.every((booking) => !('memberId' in booking)));
  assert(initial.individualBookings.length > 0);
});

for (const [audience, enterLabel, account] of [['Myself', 'Explore as Riya', 'riya'], ['My family & me', 'Explore family management', 'arjun'], ['My family & me', 'Try the simple view', 'savita']]) {
  check(`Onboarding requires an audience and ${audience} can enter as ${account}`, () => {
    readState().resetDemo();
    const runtime = createRuntime({ state: readState });
    const Onboarding = runtime.load('app/onboarding.tsx').default;
    let tree = runtime.render(Onboarding);
    assert.equal(findByTitle(tree, 'Continue').props.disabled, true, 'Continue starts disabled');
    assert.equal(readState().hasStarted, false);
    assert.equal(runtime.navigation.length, 0);
    findByTitle(tree, audience).props.onPress();
    tree = runtime.render(Onboarding);
    assert.equal(findByTitle(tree, 'Continue').props.disabled, false, 'Choosing an audience enables Continue');
    findByTitle(tree, 'Continue').props.onPress();
    tree = runtime.render(Onboarding);
    if (audience === 'Myself') {
      assert(textOf(tree).includes('Riya Shah'));
      assert(!nodes(tree).some((node) => typeof node === 'object' && node.props?.title === 'Explore family management'));
    } else {
      findByTitle(tree, 'Explore family management');
      findByTitle(tree, 'Try the simple view');
      assert(!nodes(tree).some((node) => typeof node === 'object' && node.props?.title === 'Explore as Riya'));
    }
    findByTitle(tree, enterLabel).props.onPress();
    assert.equal(readState().activeAccountId, account);
    assert.equal(readState().hasStarted, true);
    same(runtime.navigation.at(-1), { action: 'replace', href: '/' });
    assert.equal(JSON.stringify(familySnapshot(readState())), initialFamily);
  });
}

check('Selecting Riya preserves family data and ends onboarding', () => {
  initial.setActiveAccountId('riya');
  const state = readState();
  assert.equal(state.activeAccountId, 'riya');
  assert.equal(state.hasStarted, true);
  assert.equal(JSON.stringify(familySnapshot(state)), initialFamily);
});

check('Habit completion and undo use separate state without completing family tasks', () => {
  const id = individualData.individualHabits[0].id;
  readState().toggleHabit(id);
  assert(readState().completedHabitIds.includes(id));
  assert.equal(JSON.stringify(familySnapshot(readState())), initialFamily);
  readState().toggleHabit(id);
  assert(!readState().completedHabitIds.includes(id));
});

check('Saving and unsaving a personal provider does not change the family shortlist', () => {
  const id = individualData.individualProviders[0].id;
  readState().toggleIndividualSavedProvider(id);
  assert(readState().individualSavedProviders.includes(id));
  assert.equal(JSON.stringify(familySnapshot(readState())), initialFamily);
  readState().toggleIndividualSavedProvider(id);
  assert(!readState().individualSavedProviders.includes(id));
});

check('Booking UI chooses a slot, reviews, confirms centrally, then cancels centrally', () => {
  const runtime = createRuntime({ state: readState, params: { id: 'personal-emily-chen' } });
  const BookingScreen = runtime.load('app/personal/booking/[id].tsx').default;
  let tree = runtime.render(BookingScreen);
  assert.equal(findByTitle(tree, 'Review appointment').props.disabled, true);
  assert.equal(findByTitle(tree, '5:00 pm · Busy').props.disabled, true, 'Seed appointment must occupy its time');
  findByTitle(tree, '9:00 am').props.onPress();
  tree = runtime.render(BookingScreen);
  assert.equal(findByTitle(tree, 'Review appointment').props.disabled, false);
  findByTitle(tree, 'Review appointment').props.onPress();
  tree = runtime.render(BookingScreen);
  assert(textOf(tree).includes('No payment details are needed'));
  const confirm = findByTitle(tree, 'Confirm demo appointment').props.onPress;
  const beforeBookingCount = readState().individualBookings.length;
  confirm();
  confirm();
  const state = readState();
  assert.equal(state.individualBookings.length, beforeBookingCount + 1, 'Repeated confirmation must not create duplicate appointments');
  const created = state.individualBookings.find((booking) => booking.id !== individualData.seedIndividualBookings[0].id);
  assert(created, 'Confirmation must add to AppState');
  assert.equal(created.time, '09:00');
  assert.equal(created.date, '2026-09-28');
  assert.equal(created.mode, 'Online');
  assert.equal(created.status, 'Confirmed');
  assert.equal(runtime.navigation.at(-1).href, `/personal/booking/${created.id}`);
  assert.equal(JSON.stringify(familySnapshot(state)), initialFamily);
  runtime.routeParams.id = created.id;
  tree = runtime.render(BookingScreen);
  assert(textOf(tree).includes('You’re in the diary'));
  const cancel = nodes(tree).find((node) => typeof node === 'object' && node.props?.onPress && textOf(node).includes('Cancel demo appointment'));
  assert(cancel, 'Cancellation control is discoverable');
  cancel.props.onPress();
  tree = runtime.render(BookingScreen);
  findByTitle(tree, 'Yes, cancel appointment').props.onPress();
  assert.equal(readState().individualBookings.find((booking) => booking.id === created.id).status, 'Cancelled');
  assert.equal(JSON.stringify(familySnapshot(readState())), initialFamily);
});

check('Personal booking handlers preserve the family diary even across account switches', () => {
  readState().setActiveAccountId('savita');
  const familyBooking = readState().bookings[0];
  readState().updateBooking(familyBooking.id, { status: 'Cancelled' });
  const personalBefore = JSON.stringify(readState().individualBookings);
  readState().setActiveAccountId('riya');
  assert.equal(JSON.stringify(readState().individualBookings), personalBefore);
  assert.equal(readState().bookings.find((booking) => booking.id === familyBooking.id).status, 'Cancelled');
  readState().updateBooking(familyBooking.id, { status: familyBooking.status });
});

check('Cancelled appointments are excluded from next-up and chronological ordering is stable', () => {
  const seed = individualData.seedIndividualBookings[0];
  const next = individualData.nextPersonalBooking([{ ...seed, id: 'later', date: '2026-09-30' }, { ...seed, id: 'cancelled', date: '2026-09-27', status: 'Cancelled' }, { ...seed, id: 'earliest', time: '09:00' }]);
  assert.equal(next.id, 'earliest');
});

check('Personal catalogue has one currency and only Chandigarh service locations', () => {
  const providers = individualData.individualProviders;
  assert.equal(new Set(providers.map((provider) => provider.id)).size, providers.length);
  same([...new Set(providers.map((provider) => provider.category))].sort(), ['Fitness', 'Nutrition', 'Physio', 'Therapy', 'Yoga']);
  assert(providers.every((provider) => provider.currency === 'INR' && provider.price > 0 && provider.slots.length > 0));
  assert(providers.every((provider) => provider.location.includes('Chandigarh')));
});


check('Family care eligibility uses Chandigarh consistently for every family member', () => {
  const runtime = createRuntime();
  const { family } = runtime.load('src/data/family.ts');
  const { careProfessionals } = runtime.load('src/data/care.ts');
  const { availableCareModes } = runtime.load('src/utils/careEligibility.ts');
  assert(family.every((member) => member.location.includes('Chandigarh')));
  assert(careProfessionals.length > 0);
  for (const provider of careProfessionals) {
    assert.equal(provider.currency, '₹');
    assert.equal(provider.timezone, 'Asia/Kolkata');
    assert(provider.location.includes('Chandigarh'));
    assert(provider.jurisdictions.includes('Chandigarh'));
    for (const member of family) same(availableCareModes(provider, member.id), provider.modes);
  }
  const provider = careProfessionals[0];
  same(availableCareModes({ ...provider, jurisdictions: ['New Delhi'] }, 'arjun'), []);
  same(availableCareModes({ ...provider, location: 'New Delhi' }, 'arjun'), []);
  same(availableCareModes({ ...provider, timezone: 'Australia/Sydney' }, 'savita'), []);
  same(availableCareModes({ ...provider, currency: 'A$' }, 'rajiv'), []);
  same(availableCareModes(provider, 'unknown'), []);
});

check('Ask Circle reads current personal bookings and check-ins without family data', () => {
  const runtime = createRuntime({ state: readState });
  const { personalPreviewAnswer } = runtime.load('src/accounts/individual/IndividualAI.tsx');
  const live = { id: 'probe', providerId: 'personal-claire-wong', service: 'Nutrition consultation', date: '2026-09-29', time: '14:00', mode: 'In person', status: 'Confirmed' };
  const response = personalPreviewAnswer('What is my next appointment?', [live], []);
  assert(response.text.includes('Claire Wong'));
  assert(response.text.includes('2:00 pm'));
  assert(response.text.includes('Chandigarh'));
  assert(response.text.includes('IST'));
  assert(!/Mehra|Rajiv|Savita|Arjun|Neha/.test(response.text));
  assert(personalPreviewAnswer('My next appointment', [{ ...live, status: 'Cancelled' }], []).text.includes('no confirmed'));
  const allDone = individualData.individualHabits.map((habit) => habit.id);
  assert(personalPreviewAnswer('Plan my week', [], allDone).text.includes('all three'));
});

check('Marketplace search includes languages and combines category, mode and saved filters', () => {
  readState().setActiveAccountId('riya');
  const runtime = createRuntime({ state: readState });
  const { IndividualCare } = runtime.load('src/accounts/individual/IndividualCare.tsx');
  const providerIds = (tree) => nodes(tree).filter((node) => typeof node === 'object' && node.type?.name === 'PersonalProviderCard').map((node) => node.props.provider.id);
  let tree = runtime.render(IndividualCare);
  assert.equal(providerIds(tree).length, 6);
  const search = nodes(tree).find((node) => typeof node === 'object' && node.props?.accessibilityLabel === 'Search practitioners by name, focus or language');
  search.props.onChangeText('Mandarin');
  tree = runtime.render(IndividualCare);
  same(providerIds(tree), ['personal-emily-chen']);
  search.props.onChangeText('');
  tree = runtime.render(IndividualCare);
  function pressText(label) {
    const target = nodes(tree).find((node) => typeof node === 'object' && node.props?.onPress && textOf(node) === label);
    assert(target, `Filter ${label} exists`);
    target.props.onPress();
    tree = runtime.render(IndividualCare);
  }
  pressText('In person');
  assert.equal(providerIds(tree).length, 5);
  assert(!providerIds(tree).includes('personal-olivia-reed'));
  pressText('Therapy');
  same(providerIds(tree), ['personal-emily-chen']);
  pressText('Online');
  assert.equal(providerIds(tree).length, 2);
  readState().toggleIndividualSavedProvider('personal-olivia-reed');
  pressText('Saved');
  same(providerIds(tree), ['personal-olivia-reed']);
  readState().toggleIndividualSavedProvider('personal-olivia-reed');
});

check('Health tool search shows the personal diary without exposing family records', () => {
  readState().setActiveAccountId('riya');
  const runtime = createRuntime({ state: readState });
  const Screen = runtime.load('app/(tabs)/health.tsx').default;
  let tree = runtime.render(Screen);
  const headline = nodes(tree).find((node) => typeof node === 'object' && node.type?.name === 'ExperienceHeader');
  assert.equal(headline.props.title, 'My Health');
  assert(!textOf(tree).includes('across your family'));
  const search = nodes(tree).find((node) => typeof node === 'object' && node.props?.accessibilityLabel === 'Search health tools');
  search.props.onChangeText('appointments');
  tree = runtime.render(Screen);
  const links = nodes(tree).filter((node) => typeof node === 'object' && node.props?.onPress);
  const diary = links.find((node) => textOf(node).includes('Appointments'));
  assert(diary, 'Diary survives tool search');
  diary.props.onPress();
  assert.equal(runtime.navigation.at(-1).href, '/personal/bookings');
  assert(!textOf(tree).includes('Health records'));
});

check('Home chooses the correct experience for each of the three accounts', () => {
  const runtime = createRuntime({ state: readState, markers: true });
  const Home = runtime.load('app/(tabs)/index.tsx').default;
  for (const [id, expected] of [['arjun', 'FamilyHome'], ['savita', 'SavitaHome'], ['riya', 'IndividualHome']]) {
    readState().setActiveAccountId(id);
    assert.equal(runtime.render(Home).type.name, expected);
  }
});

for (const [route, names] of [['care', { arjun: 'FamilyCare', savita: 'SavitaCare', riya: 'IndividualCare' }], ['ai', { arjun: 'FamilyAI', savita: 'SavitaAI', riya: 'IndividualAI' }], ['settings', { arjun: 'ArjunSettingsScreen', savita: 'SavitaSettings', riya: 'IndividualSettings' }]]) {
  check(`${route} chooses the correct experience for all three accounts`, () => {
    const runtime = createRuntime({ state: readState, markers: true });
    const Screen = runtime.load(`app/(tabs)/${route}.tsx`).default;
    for (const [account, expected] of Object.entries(names)) {
      readState().setActiveAccountId(account);
      assert.equal(runtime.render(Screen).type.name, expected);
    }
  });
}

check('Personal deep links show an account switch gate in family mode', () => {
  readState().setActiveAccountId('arjun');
  for (const [relative, id] of [['provider/[id]', 'personal-emily-chen'], ['booking/[id]', 'riya-intro-emily'], ['bookings', undefined], ['records', undefined]]) {
    const runtime = createRuntime({ state: readState, params: { id } });
    const Screen = runtime.load(`app/personal/${relative}.tsx`).default;
    assert.equal(runtime.render(Screen).type.name, 'PersonalAccess', relative);
  }
});

check('Navigation exposes five organiser tabs, three simple tabs and four personal tabs', () => {
  const runtime = createRuntime({ state: readState });
  const Layout = runtime.load('app/(tabs)/_layout.tsx').default;
  for (const [account, expected] of [['arjun', ['Today', 'Family', 'Health', 'Care', 'Ask Circle']], ['savita', ['Today', 'Ask Circle', 'My care']], ['riya', ['Today', 'My health', 'Find care', 'Ask Circle']]]) {
    readState().setActiveAccountId(account);
    const labels = nodes(runtime.render(Layout)).filter((node) => typeof node === 'object' && node.type?.name === 'TabButton').map((node) => node.props.label);
    same(labels, expected, `Visible tabs for ${account}`);
  }
});

check('Central Stack.Protected disables family detail routes for Riya and before onboarding', () => {
  let scenario = { ...readState(), activeAccountId: 'riya', hasStarted: true };
  const runtime = createRuntime({ state: () => scenario });
  const RootLayout = runtime.load('app/_layout.tsx').default;
  const navigator = nodes(runtime.render(RootLayout)).find((node) => typeof node === 'object' && node.type?.name === 'AppNavigator');
  assert(navigator, 'Root layout must render its central navigator');
  const familyRoutes = ['notifications', 'quick-add/[kind]', 'savita-upload', 'appointment-prep/[id]', 'records', 'record/[id]', 'medications', 'booking/[id]', 'provider/[id]', 'emergency', 'settings/[section]', 'consultation/[id]', 'member/[id]', 'metric/[memberId]/[kind]', 'calendar', 'tasks', 'goals', 'insights'];
  for (const [account, started, expected] of [['riya', true, false], ['arjun', false, false], ['savita', false, false], ['arjun', true, true], ['savita', true, true]]) {
    scenario = { ...readState(), activeAccountId: account, hasStarted: started };
    const tree = runtime.render(navigator.type);
    const guard = stackRoute(tree, 'records').nearestGuard;
    assert(guard, 'Family records must be inside a protected stack group');
    assert.equal(guard.props.guard, expected, `${account}, started=${started}`);
    for (const name of familyRoutes) {
      const route = stackRoute(tree, name);
      assert.equal(route.nearestGuard, guard, `${name} must share the central family UI guard`);
      assert.equal(route.enabled, expected, `${name}: ${account}, started=${started}`);
    }
    for (const name of ['(tabs)', 'onboarding']) {
      const route = stackRoute(tree, name);
      assert.equal(route.enabled, true, `${name} remains available in demo mode before onboarding`);
      assert(!route.guards.includes(guard), `${name} must not depend on the family UI guard`);
    }
  }
});

check('Direct family-tab access redirects Riya and Savita, while Arjun sees the organiser view', () => {
  const runtime = createRuntime({ state: readState });
  const FamilyScreen = runtime.load('app/(tabs)/family.tsx').default;
  for (const account of ['riya', 'savita']) {
    readState().setActiveAccountId(account);
    const tree = runtime.render(FamilyScreen);
    assert.equal(tree.type.name, 'Redirect');
    assert.equal(tree.props.href, '/');
    assert(!textOf(tree).includes('Rajiv'));
  }
  readState().setActiveAccountId('arjun');
  const tree = runtime.render(FamilyScreen);
  assert.notEqual(tree.type.name, 'Redirect');
  const heading = nodes(tree).find((node) => typeof node === 'object' && node.type?.name === 'ExperienceHeader');
  assert.equal(heading.props.title, 'Family');
});

check('Reset restores both independent demos and sends users back to onboarding', () => {
  readState().toggleHabit(individualData.individualHabits[0].id);
  readState().toggleIndividualSavedProvider(individualData.individualProviders[0].id);
  readState().resetDemo();
  const state = readState();
  assert.equal(state.activeAccountId, 'arjun');
  assert.equal(state.hasStarted, false);
  same(state.individualBookings, individualData.seedIndividualBookings);
  assert.equal(state.individualSavedProviders.length, 0);
  assert.equal(state.completedHabitIds.length, 0);
  assert.equal(JSON.stringify(familySnapshot(state)), initialFamily);
  const runtime = createRuntime({ state: readState });
  const Layout = runtime.load('app/(tabs)/_layout.tsx').default;
  assert.equal(runtime.render(Layout).props.href, '/onboarding');
});

// Connected practitioner workflow: exercise real domain transitions and store
// callbacks. These are local demo ownership checks, not server authorization.
const practiceModel = stateRuntime.load('src/practitioner/model.ts');
const requestInput = (overrides = {}) => ({ serviceId: 'practice-assessment', recipientId: 'riya', mode: 'Online', date: '2026-09-30', time: '09:30', note: 'Example visit note', ...overrides });
function practiceCase(seed = practiceModel.initialPractice()) {
  let snapshot = seed;
  return {
    read: () => snapshot,
    act(actor, action, expectedOk = true) {
      const before = snapshot;
      const beforeJson = JSON.stringify(before);
      const next = practiceModel.applyPracticeAction(before, actor, action, '2026-09-25T09:15:00+05:30');
      assert.equal(next.result.ok, expectedOk, `${actor} ${action.type}: ${next.result.error || 'unexpected success'}`);
      assert.equal(JSON.stringify(before), beforeJson, 'A transition must not mutate its input snapshot');
      if (!expectedOk) assert.equal(next.state, before, 'Rejected changes must preserve the same state');
      snapshot = next.state;
      return next.result;
    },
  };
}
function isolatedAppState() {
  const runtime = createRuntime();
  const Provider = runtime.load('src/state/AppState.tsx').AppStateProvider;
  return () => runtime.render(Provider).props.value;
}
function findByLabel(tree, label) {
  const node = nodes(tree).find((item) => item?.props?.accessibilityLabel === label);
  assert(node, `Missing accessible control: ${label}`);
  return node;
}

check('Practice request, acceptance and cancellation preserve a chronological actor-labelled history', () => {
  const flow = practiceCase();
  const originalCount = flow.read().requests.length;
  flow.act('riya', { type: 'request', input: requestInput(), id: 'roundtrip' });
  let request = flow.read().requests.find((item) => item.id === 'roundtrip');
  assert.equal(request.status, 'Requested');
  assert.equal(request.sessionDetails, '');
  assert.equal(request.clientAccountId, 'riya');
  flow.act('practitioner', { type: 'confirm', id: request.id, sessionDetails: 'Example online session instructions' });
  flow.act('riya', { type: 'cancel', id: request.id, reason: 'Plans changed' });
  request = flow.read().requests.find((item) => item.id === 'roundtrip');
  assert.equal(flow.read().requests.length, originalCount + 1);
  assert.equal(request.status, 'Cancelled');
  assert.equal(request.reason, 'Plans changed');
  same(request.events.map((event) => [event.status, event.actor]), [['Requested', 'Riya Shah'], ['Confirmed', 'Arvind Nair'], ['Cancelled', 'Riya Shah']]);
  assert.equal(request.events.at(-1).note, 'Plans changed');
});

check('Practice mutations and cancellations enforce demo actor and recipient ownership', () => {
  const flow = practiceCase();
  const state = flow.read();
  const practitionerOnly = [
    { type: 'profile', profile: state.profile },
    { type: 'service', service: state.services[0] },
    { type: 'remove-service', id: state.services[0].id },
    { type: 'hours', hours: state.hours },
    { type: 'blocked-date', date: '2026-09-30' },
    { type: 'confirm', id: 'practice-riya-request', sessionDetails: 'Example clinic address' },
    { type: 'decline', id: 'practice-riya-request', reason: 'Unavailable' },
    { type: 'complete', id: 'practice-today' },
  ];
  for (const actor of ['arjun', 'savita', 'riya']) for (const action of practitionerOnly) flow.act(actor, action, false);
  for (const actor of ['arjun', 'savita']) flow.act(actor, { type: 'cancel', id: 'practice-riya-request', reason: 'Wrong profile' }, false);
  for (const [actor, recipientId] of [['riya', 'savita'], ['savita', 'arjun'], ['arjun', 'riya'], ['practitioner', 'riya']]) {
    flow.act(actor, { type: 'request', input: requestInput({ recipientId }), id: `${actor}-wrong-recipient` }, false);
  }
  for (const recipientId of ['arjun', 'rajiv', 'neha', 'savita']) flow.act('arjun', { type: 'request', input: requestInput({ recipientId }), id: `family-${recipientId}` });
  flow.act('savita', { type: 'request', input: requestInput({ recipientId: 'savita' }), id: 'savita-self' });
  flow.act('practitioner', { type: 'cancel', id: 'savita-self', reason: 'Example practice closure' });
});

check('Repeated appointment requests resolve to the existing request without duplicate events', () => {
  const flow = practiceCase();
  const input = requestInput();
  flow.act('riya', { type: 'request', input, id: 'first-request' });
  const before = flow.read();
  const repeated = flow.act('riya', { type: 'request', input, id: 'second-request' });
  assert.equal(repeated.id, 'first-request');
  assert.equal(flow.read(), before);
  flow.act('practitioner', { type: 'confirm', id: 'first-request', sessionDetails: 'Example joining instructions' });
  const confirmed = flow.read();
  assert.equal(flow.act('riya', { type: 'request', input, id: 'third-request' }).id, 'first-request');
  assert.equal(flow.read(), confirmed);
  flow.act('riya', { type: 'cancel', id: 'first-request', reason: 'Choose again later' });
  flow.act('riya', { type: 'request', input, id: 'new-after-cancellation' });
  assert.equal(flow.read().requests.find((request) => request.id === 'new-after-cancellation').status, 'Requested');
});

check('Changing visit format at an already requested time requires cancelling the original request', () => {
  const flow = practiceCase();
  flow.act('riya', { type: 'request', input: requestInput({ mode: 'Online' }), id: 'original-format' });
  const result = flow.act('riya', { type: 'request', input: requestInput({ mode: 'In person' }), id: 'changed-format' }, false);
  assert(result.error.includes('different format'));
  assert.equal(flow.read().requests.find((request) => request.id === 'original-format').mode, 'Online');
  flow.act('riya', { type: 'cancel', id: 'original-format', reason: 'Prefer a clinic visit' });
  flow.act('riya', { type: 'request', input: requestInput({ mode: 'In person' }), id: 'changed-format' });
  assert.equal(flow.read().requests.find((request) => request.id === 'changed-format').mode, 'In person');
});

check('Confirmed visit durations block overlaps across services and clients while allowing adjacent visits', () => {
  const flow = practiceCase();
  flow.act('riya', { type: 'request', input: requestInput({ time: '10:30' }), id: 'overlapping-pending' });
  flow.act('arjun', { type: 'request', input: requestInput({ serviceId: 'practice-home', recipientId: 'savita', mode: 'Home visit', time: '10:00' }), id: 'one-hour-visit' });
  flow.act('practitioner', { type: 'confirm', id: 'one-hour-visit', sessionDetails: 'Sample home, Sector 22, Chandigarh' });
  const assessmentSlots = practiceModel.availablePracticeSlots(flow.read(), 'practice-assessment', '2026-09-30', 'Online');
  assert(!assessmentSlots.includes('09:30'), 'A 45-minute visit starting before 10:00 would overlap');
  assert(!assessmentSlots.includes('10:30'), 'A different start time can still overlap');
  const followupSlots = practiceModel.availablePracticeSlots(flow.read(), 'practice-followup', '2026-09-30', 'Online');
  assert(followupSlots.includes('09:30'), 'A 30-minute visit may finish exactly when the next starts');
  assert(followupSlots.includes('11:00'), 'A visit may start exactly at the confirmed visit end');
  flow.act('practitioner', { type: 'confirm', id: 'overlapping-pending', sessionDetails: 'Sample online session instructions' }, false);
  flow.act('riya', { type: 'request', input: requestInput({ time: '10:00' }), id: 'new-overlap' }, false);
  flow.act('riya', { type: 'request', input: requestInput({ serviceId: 'practice-followup', time: '11:00' }), id: 'adjacent' });
  flow.act('practitioner', { type: 'confirm', id: 'adjacent', sessionDetails: 'Sample online session instructions' });
});

check('Availability changes protect confirmed visits and closed dates stop requests and acceptance', () => {
  const flow = practiceCase();
  flow.act('practitioner', { type: 'hours', hours: flow.read().hours.map((day) => day.day === 5 ? { ...day, end: '10:00' } : day) }, false);
  flow.act('practitioner', { type: 'blocked-date', date: '2026-09-25' }, false);
  flow.act('practitioner', { type: 'blocked-date', date: '2026-09-28' });
  same(practiceModel.availablePracticeSlots(flow.read(), 'practice-assessment', '2026-09-28', 'Online'), []);
  flow.act('practitioner', { type: 'confirm', id: 'practice-riya-request', sessionDetails: 'Example clinic address' }, false);
  flow.act('riya', { type: 'request', input: requestInput({ date: '2026-09-28' }), id: 'closed-date' }, false);
  flow.act('practitioner', { type: 'blocked-date', date: '2026-09-28' });
  assert(practiceModel.availablePracticeSlots(flow.read(), 'practice-assessment', '2026-09-28', 'Online').length > 0);
  flow.act('practitioner', { type: 'hours', hours: flow.read().hours.map((day) => day.day === 3 ? { ...day, start: '13:00', end: '15:00' } : day) });
  same(practiceModel.availablePracticeSlots(flow.read(), 'practice-home', '2026-09-30', 'Home visit'), ['13:00', '13:30', '14:00']);
  same(practiceModel.availablePracticeSlots(flow.read(), 'practice-assessment', '2026-09-27', 'Online'), [], 'Sunday is closed');
});

check('An ongoing confirmed appointment remains protected by schedule and closed-date guards', () => {
  const seed = practiceModel.initialPractice();
  const flow = practiceCase({ ...seed,
    hours: seed.hours.map((day) => day.day === 5 ? { ...day, start: '08:00' } : day),
    requests: seed.requests.map((request) => request.id === 'practice-today' ? { ...request, time: '08:30', durationMinutes: 60 } : request),
  });
  assert.equal(practiceModel.practiceRequestHasEnded(flow.read().requests.find((request) => request.id === 'practice-today')), false);
  flow.act('practitioner', { type: 'hours', hours: flow.read().hours.map((day) => day.day === 5 ? { ...day, start: '09:00' } : day) }, false);
  flow.act('practitioner', { type: 'blocked-date', date: '2026-09-25' }, false);
  flow.act('practitioner', { type: 'complete', id: 'practice-today' }, false);
});

check('A finished confirmed appointment permits closing its date without erasing its history', () => {
  const seed = practiceModel.initialPractice();
  const flow = practiceCase({ ...seed,
    hours: seed.hours.map((day) => day.day === 5 ? { ...day, start: '08:00' } : day),
    requests: seed.requests.map((request) => request.id === 'practice-today' ? { ...request, time: '08:00', durationMinutes: 60 } : request),
  });
  const ended = flow.read().requests.find((request) => request.id === 'practice-today');
  assert.equal(practiceModel.practiceRequestHasEnded(ended), true, 'The exact scheduled end is eligible');
  flow.act('practitioner', { type: 'blocked-date', date: '2026-09-25' });
  flow.act('practitioner', { type: 'hours', hours: flow.read().hours.map((day) => day.day === 5 ? { ...day, enabled: false } : day) });
  assert.equal(flow.read().requests.find((request) => request.id === ended.id), ended);
  flow.act('practitioner', { type: 'complete', id: ended.id });
  assert.equal(flow.read().requests.find((request) => request.id === ended.id).status, 'Completed');
});

check('Service edits preserve requested fee, duration and name snapshots', () => {
  const flow = practiceCase();
  flow.act('riya', { type: 'request', input: requestInput(), id: 'priced-request' });
  const original = flow.read().requests.find((request) => request.id === 'priced-request');
  const service = flow.read().services.find((item) => item.id === original.serviceId);
  flow.act('practitioner', { type: 'service', service: { ...service, name: 'Extended assessment', priceInr: 1800, durationMinutes: 90 } });
  const snapshot = flow.read().requests.find((request) => request.id === original.id);
  assert.equal(snapshot.priceInr, 900);
  assert.equal(snapshot.durationMinutes, 45);
  assert.equal(snapshot.serviceName, 'Physiotherapy assessment');
  flow.act('practitioner', { type: 'confirm', id: original.id, sessionDetails: 'Example joining instructions' });
  assert.equal(flow.read().requests.find((request) => request.id === original.id).durationMinutes, 45);
  flow.act('practitioner', { type: 'remove-service', id: service.id }, false);
  flow.act('practitioner', { type: 'service', service: { ...service, active: false } });
  same(practiceModel.availablePracticeSlots(flow.read(), service.id, '2026-09-30', 'Online'), []);
});

check('Pausing the practice stops new requests while retaining existing appointment management', () => {
  const flow = practiceCase();
  flow.act('practitioner', { type: 'profile', profile: { ...flow.read().profile, acceptingRequests: false } });
  same(practiceModel.availablePracticeSlots(flow.read(), 'practice-assessment', '2026-09-30', 'Online'), []);
  flow.act('riya', { type: 'request', input: requestInput(), id: 'paused-request' }, false);
  flow.act('practitioner', { type: 'confirm', id: 'practice-riya-request', sessionDetails: 'Example clinic instructions' });
  flow.act('riya', { type: 'cancel', id: 'practice-riya-request', reason: 'Plans changed' });
  flow.act('practitioner', { type: 'profile', profile: { ...flow.read().profile, acceptingRequests: true } });
  flow.act('riya', { type: 'request', input: requestInput(), id: 'reopened-request' });
});

check('Invalid practitioner profile, service and schedule saves leave the last valid state intact', () => {
  const flow = practiceCase();
  for (const patch of [{ name: '' }, { title: 'x' }, { bio: 'Short' }, { qualification: '' }, { languages: [] }, { address: 'New Delhi practice' }, { email: 'invalid' }, { phone: 'not a phone' }, { category: 'Unsupported' }]) {
    flow.act('practitioner', { type: 'profile', profile: { ...flow.read().profile, ...patch } }, false);
  }
  for (const patch of [{ id: '' }, { name: 'x' }, { durationMinutes: 0 }, { durationMinutes: 30.5 }, { priceInr: -1 }, { priceInr: 12.5 }, { modes: [] }, { modes: ['Unsupported'] }, { description: 'x'.repeat(601) }]) {
    flow.act('practitioner', { type: 'service', service: { ...flow.read().services[0], ...patch } }, false);
  }
  flow.act('practitioner', { type: 'hours', hours: flow.read().hours.slice(1) }, false);
  flow.act('practitioner', { type: 'hours', hours: flow.read().hours.map((day) => ({ ...day, day: 1 })) }, false);
  flow.act('practitioner', { type: 'hours', hours: flow.read().hours.map((day) => day.day === 1 ? { ...day, start: '25:00' } : day) }, false);
  flow.act('practitioner', { type: 'hours', hours: flow.read().hours.map((day) => day.day === 1 ? { ...day, end: '08:00' } : day) }, false);
  for (const date of ['2026-09-24', '2026-02-30', 'not-a-date']) flow.act('practitioner', { type: 'blocked-date', date }, false);
});

check('Invalid request dates, times, formats and oversized notes do not create appointments', () => {
  const flow = practiceCase();
  for (const patch of [{ date: '2026-09-24' }, { date: '2026-02-30' }, { date: '2026-09-25', time: '09:00' }, { time: '25:00' }, { time: '09:15' }, { time: '16:30' }, { mode: 'Home visit' }, { serviceId: 'missing' }, { note: 'x'.repeat(1001) }]) {
    flow.act('riya', { type: 'request', input: requestInput(patch), id: 'invalid-request' }, false);
  }
  flow.act('riya', { type: 'request', input: requestInput(), id: 'practice-today' }, false);
  assert.equal(flow.read().requests.length, practiceModel.initialPractice().requests.length);
});

check('Request status transitions require reasons and details, and prevent premature completion', () => {
  const flow = practiceCase();
  for (const sessionDetails of ['', 'tiny', 'x'.repeat(501)]) flow.act('practitioner', { type: 'confirm', id: 'practice-riya-request', sessionDetails }, false);
  for (const reason of ['', 'x'.repeat(501)]) {
    flow.act('practitioner', { type: 'decline', id: 'practice-riya-request', reason }, false);
    flow.act('riya', { type: 'cancel', id: 'practice-riya-request', reason }, false);
  }
  flow.act('practitioner', { type: 'complete', id: 'practice-riya-request' }, false);
  flow.act('practitioner', { type: 'complete', id: 'practice-today' }, false);
  flow.act('practitioner', { type: 'decline', id: 'practice-riya-request', reason: 'Requested time is unavailable' });
  for (const action of [{ type: 'confirm', sessionDetails: 'Example session details' }, { type: 'decline', reason: 'Another reason' }, { type: 'cancel', reason: 'Another reason' }, { type: 'complete' }]) {
    flow.act('practitioner', { ...action, id: 'practice-riya-request' }, false);
  }
  const seed = practiceModel.initialPractice();
  const past = practiceCase({ ...seed, requests: seed.requests.map((request) => request.id === 'practice-today' ? { ...request, date: '2026-09-24' } : request) });
  past.act('practitioner', { type: 'complete', id: 'practice-today' });
  assert.equal(past.read().requests.find((request) => request.id === 'practice-today').status, 'Completed');
  past.act('practitioner', { type: 'cancel', id: 'practice-today', reason: 'Too late' }, false);
  past.act('practitioner', { type: 'complete', id: 'practice-today' }, false);
});

check('AppState practice callbacks share current state across rapid requests, profile switches and reset', () => {
  const read = isolatedAppState();
  const initialPractice = JSON.stringify(read().practice);
  const familyBefore = JSON.stringify(familySnapshot(read()));
  const personalBefore = JSON.stringify(read().individualBookings);
  read().setActiveAccountId('riya');
  const send = read().requestPracticeAppointment;
  const first = send(requestInput());
  const repeated = send(requestInput());
  assert(first.ok && repeated.ok);
  assert.equal(repeated.id, first.id, 'Back-to-back callbacks must use the current ref, not stale React state');
  read().setActiveAccountId('practitioner');
  assert.equal(read().confirmPracticeRequest(first.id, 'Example session instructions').ok, true);
  read().setActiveAccountId('riya');
  assert.equal(read().practice.requests.find((request) => request.id === first.id).status, 'Confirmed');
  assert.equal(read().cancelPracticeRequest(first.id, 'Plans changed').ok, true);
  assert.equal(JSON.stringify(familySnapshot(read())), familyBefore);
  assert.equal(JSON.stringify(read().individualBookings), personalBefore);
  read().resetDemo();
  assert.equal(JSON.stringify(read().practice), initialPractice);
  assert.equal(read().hasStarted, false);
  assert.equal(read().activeAccountId, 'arjun');
});

check('Consumer form callbacks choose, review and submit one Requested appointment with the selected recipient', () => {
  const read = isolatedAppState();
  read().setActiveAccountId('riya');
  const runtime = createRuntime({ state: read });
  const Form = runtime.load('app/request-care.tsx').default;
  let tree = runtime.render(Form);
  assert.equal(findByTitle(tree, 'Review request').props.disabled, true);
  const recipients = nodes(tree).filter((node) => node?.props?.accessibilityLabel?.startsWith('Request care for'));
  assert.equal(recipients.length, 1);
  assert.equal(recipients[0].props.label, 'Riya Shah');
  const note = findByLabel(tree, 'Optional note for the practitioner, 1000 characters maximum');
  assert.equal(note.props.maxLength, 1000);
  note.props.onChangeText('Example desk discomfort');
  findByLabel(tree, 'Request 9:30 am IST').props.onPress();
  tree = runtime.render(Form);
  assert.equal(findByTitle(tree, 'Review request').props.disabled, false);
  findByTitle(tree, 'Review request').props.onPress();
  tree = runtime.render(Form);
  assert(textOf(tree).includes('not confirmed yet'));
  const send = findByTitle(tree, 'Send appointment request').props.onPress;
  const count = read().practice.requests.length;
  send(); send();
  assert.equal(read().practice.requests.length, count + 1);
  const created = read().practice.requests[0];
  assert.equal(created.status, 'Requested');
  assert.equal(created.recipientId, 'riya');
  assert.equal(created.note, 'Example desk discomfort');
  assert.equal(created.priceInr, 900);
  assert.equal(created.time, '09:30');
  assert.equal(runtime.navigation.at(-1).href, `/care-request/${created.id}`);
});

check('Consumer review rechecks availability when a practitioner closes the selected date', () => {
  const read = isolatedAppState();
  read().setActiveAccountId('riya');
  const runtime = createRuntime({ state: read });
  const Form = runtime.load('app/request-care.tsx').default;
  let tree = runtime.render(Form);
  const day = nodes(tree).find((node) => node?.props?.label === practiceModel.practiceDateLabel('2026-09-30'));
  assert(day);
  day.props.onPress();
  tree = runtime.render(Form);
  findByLabel(tree, 'Request 9:30 am IST').props.onPress();
  tree = runtime.render(Form);
  findByTitle(tree, 'Review request').props.onPress();
  const count = read().practice.requests.length;
  read().setActiveAccountId('practitioner');
  assert.equal(read().togglePracticeBlockedDate('2026-09-30').ok, true);
  read().setActiveAccountId('riya');
  tree = runtime.render(Form);
  assert.equal(findByTitle(tree, 'Send appointment request').props.disabled, true);
  findByTitle(tree, 'Send appointment request').props.onPress();
  assert.equal(read().practice.requests.length, count);
  assert(textOf(runtime.render(Form)).includes('no longer available'));
});

check('Consumer detail reflects practitioner acceptance and its cancellation sheet changes central state', () => {
  const read = isolatedAppState();
  read().setActiveAccountId('practitioner');
  assert.equal(read().confirmPracticeRequest('practice-riya-request', 'Sample practice, Sector 22, Chandigarh').ok, true);
  read().setActiveAccountId('riya');
  const runtime = createRuntime({ state: read, params: { id: 'practice-riya-request' } });
  const Detail = runtime.load('app/care-request/[id].tsx').default;
  let tree = runtime.render(Detail);
  assert(textOf(tree).includes('accepted this appointment'));
  assert(textOf(tree).includes('Sample practice, Sector 22, Chandigarh'));
  findByTitle(tree, 'Cancel appointment').props.onPress();
  tree = runtime.render(Detail);
  let sheet = findByTitle(tree, 'Cancel this appointment?');
  assert.equal(sheet.props.visible, true);
  assert.equal(findByTitle(sheet.props.footer, 'Confirm cancellation').props.disabled, true);
  const reason = findByLabel(tree, 'Reason for cancelling, required, 500 characters maximum');
  assert.equal(reason.props.maxLength, 500);
  reason.props.onChangeText('Plans changed');
  tree = runtime.render(Detail);
  sheet = findByTitle(tree, 'Cancel this appointment?');
  findByTitle(sheet.props.footer, 'Confirm cancellation').props.onPress();
  const request = read().practice.requests.find((item) => item.id === 'practice-riya-request');
  assert.equal(request.status, 'Cancelled');
  assert.equal(request.events.at(-1).note, 'Plans changed');
  tree = runtime.render(Detail);
  assert(!nodes(tree).some((node) => node?.props?.title === 'Cancel appointment'));
});

check('Consumer details and request lists exclude other actors and the empty state links to the sample practice', () => {
  const read = isolatedAppState();
  read().setActiveAccountId('arjun');
  const runtime = createRuntime({ state: read, params: { id: 'practice-riya-request' } });
  const Detail = runtime.load('app/care-request/[id].tsx').default;
  assert(textOf(runtime.render(Detail)).includes('Request not available'));
  const List = runtime.load('src/practitioner/ConsumerPracticeRequests.tsx').ConsumerPracticeRequests;
  let tree = runtime.render(List);
  assert(!textOf(tree).includes('Riya Shah'));
  assert.equal(nodes(tree).filter((node) => node?.props?.accessibilityLabel?.startsWith('View ')).length, 2);
  const emptyRuntime = createRuntime({ state: () => ({ ...read(), practice: { ...read().practice, requests: [] } }) });
  tree = emptyRuntime.render(emptyRuntime.load('src/practitioner/ConsumerPracticeRequests.tsx').ConsumerPracticeRequests);
  findByTitle(tree, 'View sample practice').props.onPress();
  assert.equal(emptyRuntime.navigation.at(-1).href, '/practitioner-profile');
  for (const [actor, expectedNames] of [['arjun', ['Arjun Mehra', 'Rajiv Mehra', 'Neha Mehra', 'Savita Mehra']], ['savita', ['Savita Mehra']]]) {
    read().setActiveAccountId(actor);
    const formRuntime = createRuntime({ state: read });
    tree = formRuntime.render(formRuntime.load('app/request-care.tsx').default);
    same(nodes(tree).filter((node) => node?.props?.accessibilityLabel?.startsWith('Request care for')).map((node) => node.props.label), expectedNames);
  }
});

check('Consumer profile reflects live service edits and paused practice request controls', () => {
  const read = isolatedAppState();
  read().setActiveAccountId('practitioner');
  assert.equal(read().savePracticeProfile({ ...read().practice.profile, name: 'Arvind Sample Practice', acceptingRequests: false }).ok, true);
  const service = read().practice.services[0];
  assert.equal(read().savePracticeService({ ...service, priceInr: 1600, name: 'Example extended assessment' }).ok, true);
  read().setActiveAccountId('riya');
  const runtime = createRuntime({ state: read });
  const Profile = runtime.load('app/practitioner-profile.tsx').default;
  const tree = runtime.render(Profile);
  assert(textOf(tree).includes('Arvind Sample Practice'));
  assert(textOf(tree).includes('₹1,600'));
  assert.equal(findByTitle(tree, 'Requests paused').props.disabled, true);
  assert.equal(findByTitle(tree, 'Request Example extended assessment').props.disabled, true);
  read().setActiveAccountId('practitioner');
  assert(textOf(runtime.render(Profile)).includes('Switch to a client profile'));
  const Form = runtime.load('app/request-care.tsx').default;
  assert.equal(runtime.render(Form).type.name, 'RequestAccess');
});

check('Edited practice details and active service fees propagate through family and personal directory filters', () => {
  const read = isolatedAppState();
  read().setActiveAccountId('practitioner');
  assert.equal(read().savePracticeProfile({ ...read().practice.profile, name: 'Arvind Nutrition Demo', title: 'Nutrition practitioner', category: 'Nutrition', languages: ['Kannada'] }).ok, true);
  for (const [index, service] of read().practice.services.entries()) {
    assert.equal(read().savePracticeService({ ...service, active: index === 0, priceInr: 1750, modes: ['Online'] }).ok, true);
  }
  const runtime = createRuntime({ state: read });
  const { practiceDirectoryEntry, practiceMatchesFilters } = runtime.load('src/practitioner/directory.ts');
  const entry = practiceDirectoryEntry(read().practice);
  assert.equal(entry.name, 'Arvind Nutrition Demo');
  assert.equal(entry.category, 'nutrition');
  assert.equal(entry.price, 1750);
  same(entry.modes, ['Online']);
  assert(practiceMatchesFilters(read().practice, { category: 'Nutrition', mode: 'Online', query: ' Kannada ' }));
  assert(!practiceMatchesFilters(read().practice, { category: 'Physio' }));
  assert(!practiceMatchesFilters(read().practice, { mode: 'In person' }));
  read().setActiveAccountId('arjun');
  const Care = runtime.load('app/(tabs)/care.tsx').default;
  const FamilyCare = runtime.render(Care).type;
  const familyTree = runtime.render(FamilyCare);
  const card = nodes(familyTree).find((node) => node?.type?.name === 'ProfessionalCard' && node.props.pro.id === 'arvind-nair');
  assert(card, 'Edited practitioner remains visible in the family directory');
  assert.equal(card.props.pro.name, entry.name);
  assert.equal(card.props.pro.price, entry.price);
  read().setActiveAccountId('riya');
  const personalRuntime = createRuntime({ state: read, params: { category: 'Nutrition' } });
  const PersonalCare = personalRuntime.load('src/accounts/individual/IndividualCare.tsx').IndividualCare;
  let tree = personalRuntime.render(PersonalCare);
  findByLabel(tree, 'Search practitioners by name, focus or language').props.onChangeText('Kannada');
  tree = personalRuntime.render(PersonalCare);
  assert(nodes(tree).some((node) => node?.type?.name === 'PracticeDirectoryCard'));
  assert(!nodes(tree).some((node) => node?.type?.name === 'PersonalProviderCard'));
  personalRuntime.routeParams.category = 'Physio';
  assert(!nodes(personalRuntime.render(PersonalCare)).some((node) => node?.type?.name === 'PracticeDirectoryCard'));
  const DirectoryCard = personalRuntime.load('src/practitioner/PracticeDirectoryCard.tsx').PracticeDirectoryCard;
  tree = personalRuntime.render(DirectoryCard);
  assert(textOf(tree).includes('From ₹1,750'));
  const familySavedBefore = JSON.stringify(read().savedProviders);
  findByLabel(tree, 'Save Arvind Nutrition Demo').props.onPress();
  assert(read().individualSavedProviders.includes('arvind-nair'));
  assert.equal(JSON.stringify(read().savedProviders), familySavedBefore, 'Personal shortlist does not mutate family shortlist');
});

check('Family recipient selection survives both practitioner profile request entry points', () => {
  const read = isolatedAppState();
  read().setActiveAccountId('arjun');
  const runtime = createRuntime({ state: read, params: { memberId: 'savita' } });
  const Profile = runtime.load('app/practitioner-profile.tsx').default;
  const tree = runtime.render(Profile);
  for (const title of ['Request an appointment', 'Request Physiotherapy assessment']) {
    findByTitle(tree, title).props.onPress();
    const href = runtime.navigation.at(-1).href;
    assert.equal(href.pathname, '/request-care');
    assert.equal(href.params.memberId, 'savita', `${title} retains the selected family member`);
    const formRuntime = createRuntime({ state: read, params: href.params });
    const form = formRuntime.render(formRuntime.load('app/request-care.tsx').default);
    assert.equal(findByLabel(form, 'Request care for Savita Mehra').props.selected, true);
  }
  for (const [actor, recipient] of [['riya', 'Riya Shah'], ['savita', 'Savita Mehra'], ['arjun', 'Arjun Mehra']]) {
    read().setActiveAccountId(actor);
    const formRuntime = createRuntime({ state: read, params: { memberId: actor === 'arjun' ? 'unknown-person' : 'rajiv' } });
    const form = formRuntime.render(formRuntime.load('app/request-care.tsx').default);
    assert.equal(findByLabel(form, `Request care for ${recipient}`).props.selected, true, 'Invalid or other-profile params cannot select another recipient');
  }
});

check('Compact care request lists omit closed requests and link to each actor’s full diary', () => {
  const read = isolatedAppState();
  read().setActiveAccountId('arjun');
  const runtime = createRuntime({ state: read });
  const List = runtime.load('src/practitioner/ConsumerPracticeRequests.tsx').ConsumerPracticeRequests;
  let tree = runtime.render(() => List({ limit: 1, activeOnly: true }));
  assert.equal(nodes(tree).filter((node) => node?.props?.accessibilityLabel?.startsWith('View ')).length, 1);
  findByTitle(tree, 'View all 2 care requests').props.onPress();
  assert.equal(runtime.navigation.at(-1).href, '/calendar');
  for (const request of read().practice.requests.filter((item) => item.clientAccountId === 'arjun')) read().cancelPracticeRequest(request.id, 'Example plans changed');
  assert.equal(runtime.render(() => List({ limit: 1, activeOnly: true })), null);
  tree = runtime.render(List);
  assert.equal(nodes(tree).filter((node) => node?.props?.accessibilityLabel?.startsWith('View cancelled')).length, 2, 'Full diary retains closed history');
});

check('Practitioner detail callbacks require session details and communicate confirmations and declines centrally', () => {
  const read = isolatedAppState();
  read().setActiveAccountId('practitioner');
  function detailRuntime(id) {
    const runtime = createRuntime({ state: read, params: { id } });
    const Screen = runtime.load('app/practice/request/[id].tsx').default;
    return {
      render() { const detail = runtime.render(Screen); return runtime.render(() => detail.type(detail.props)); },
    };
  }
  const confirm = detailRuntime('practice-rajiv-request');
  let tree = confirm.render();
  findByTitle(tree, 'Confirm appointment').props.onPress();
  assert.equal(read().practice.requests.find((request) => request.id === 'practice-rajiv-request').status, 'Requested');
  tree = confirm.render();
  assert(textOf(tree).includes('before confirming'));
  findByLabel(tree, 'Required online session details').props.onChangeText('Example online session instructions');
  tree = confirm.render();
  findByTitle(tree, 'Confirm appointment').props.onPress();
  assert.equal(read().practice.requests.find((request) => request.id === 'practice-rajiv-request').status, 'Confirmed');
  tree = confirm.render();
  assert(textOf(tree).includes('Example online session instructions'));
  assert(!nodes(tree).some((node) => node?.props?.title === 'Mark visit completed'), 'Future appointment cannot be completed from the UI');
  const decline = detailRuntime('practice-riya-request');
  tree = decline.render();
  const openReason = nodes(tree).find((node) => node?.props?.onPress && textOf(node) === 'Decline request');
  assert(openReason);
  openReason.props.onPress();
  tree = decline.render();
  findByLabel(tree, 'Required reason for declining').props.onChangeText('Example time unavailable');
  tree = decline.render();
  findByTitle(tree, 'Decline request').props.onPress();
  const request = read().practice.requests.find((item) => item.id === 'practice-riya-request');
  assert.equal(request.status, 'Declined');
  assert.equal(request.reason, 'Example time unavailable');
  assert.equal(request.events.at(-1).actor, 'Arvind Nair');
});

check('Practitioner onboarding opens a separate workspace with four useful tabs and a pending badge', () => {
  const read = isolatedAppState();
  const runtime = createRuntime({ state: read });
  const Onboarding = runtime.load('app/onboarding.tsx').default;
  findByTitle(runtime.render(Onboarding), 'I’m a practitioner').props.onPress();
  assert.equal(read().activeAccountId, 'practitioner');
  assert.equal(read().hasStarted, true);
  assert.equal(runtime.navigation.at(-1).href, '/practice');
  const ConsumerTabs = runtime.load('app/(tabs)/_layout.tsx').default;
  assert.equal(runtime.render(ConsumerTabs).props.href, '/practice');
  const PracticeTabs = runtime.load('app/practice/(tabs)/_layout.tsx').default;
  const tabs = nodes(runtime.render(PracticeTabs)).filter((node) => node?.type?.name === 'PracticeTabButton');
  same(tabs.map((node) => node.props.tab.label), ['Today', 'Requests', 'Schedule', 'My practice']);
  assert.equal(tabs.find((node) => node.props.tab.label === 'Requests').props.count, 3);
  read().declinePracticeRequest('practice-riya-request', 'Example unavailable time');
  const updated = nodes(runtime.render(PracticeTabs)).find((node) => node?.type?.name === 'PracticeTabButton' && node.props.tab.label === 'Requests');
  assert.equal(updated.props.count, 2);
});

check('Central UI route guards separate practitioner workspace, consumer requests and family details', () => {
  let scenario = { ...readState(), activeAccountId: 'practitioner', hasStarted: true };
  const runtime = createRuntime({ state: () => scenario });
  const RootLayout = runtime.load('app/_layout.tsx').default;
  const navigator = nodes(runtime.render(RootLayout)).find((node) => node?.type?.name === 'AppNavigator');
  assert(navigator);
  for (const actor of ['arjun', 'savita', 'riya', 'practitioner']) for (const started of [false, true]) {
    scenario = { ...scenario, activeAccountId: actor, hasStarted: started };
    const tree = runtime.render(navigator.type);
    for (const [route, expected] of [['practice', started && actor === 'practitioner'], ['practitioner-profile', started], ['request-care', started && actor !== 'practitioner'], ['care-request/[id]', started && actor !== 'practitioner'], ['records', started && (actor === 'arjun' || actor === 'savita')]]) {
      const registration = stackRoute(tree, route);
      assert(registration.nearestGuard, `${route} must be centrally protected`);
      assert.equal(registration.nearestGuard.props.guard, expected, `${route}: ${actor}, started=${started}`);
      assert.equal(registration.enabled, expected, `${route} effective access: ${actor}, started=${started}`);
    }
  }
});

check('Live mode protects every legacy sample route while beta stays available for every demo state', () => {
  const legacyRoutes = ['(tabs)', 'onboarding', 'practice', 'practitioner-profile', 'request-care', 'care-request/[id]', 'notifications', 'quick-add/[kind]', 'savita-upload', 'appointment-prep/[id]', 'records', 'record/[id]', 'medications', 'booking/[id]', 'provider/[id]', 'emergency', 'settings/[section]', 'consultation/[id]', 'member/[id]', 'metric/[memberId]/[kind]', 'calendar', 'tasks', 'goals', 'insights', 'personal/bookings', 'personal/records', 'personal/booking/[id]', 'personal/provider/[id]'];
  for (const live of [false, true]) {
    let scenario = { ...readState() };
    const runtime = createRuntime({ state: () => scenario, ...(live ? { env: { EXPO_PUBLIC_APP_MODE: 'live' } } : {}) });
    assert.equal(runtime.load('src/live/mode.ts').liveMode, live, 'The real mode module must read the supplied environment');
    const RootLayout = runtime.load('app/_layout.tsx').default;
    const navigator = nodes(runtime.render(RootLayout)).find((node) => node?.type?.name === 'AppNavigator');
    assert(navigator);
    for (const actor of ['arjun', 'savita', 'riya', 'practitioner']) for (const started of [false, true]) {
      scenario = { ...scenario, activeAccountId: actor, hasStarted: started };
      const tree = runtime.render(navigator.type);
      assert.equal(stackRoute(tree, 'beta').enabled, true, `Beta must remain available: live=${live}, ${actor}, started=${started}`);
      const demoGuard = stackRoute(tree, '(tabs)').nearestGuard;
      assert(demoGuard, 'Sample tabs must be protected by the app-mode guard');
      assert.equal(demoGuard.props.guard, !live, 'The sample boundary follows the actual app mode');
      for (const name of legacyRoutes) stackRoute(tree, name);
      for (const route of stackRoutes(tree).filter((item) => item.name !== 'beta')) {
        assert(route.guards.includes(demoGuard), `${route.name} must share the sample boundary`);
        if (live) assert.equal(route.enabled, false, `${route.name} must be inaccessible in live mode: ${actor}, started=${started}`);
      }
    }
  }
});

// Calendar calculations use ISO civil dates in the practice timezone. Test the
// public helpers and real screen callbacks, without asserting pixel positions.
const calendar = stateRuntime.load('src/practitioner/calendar.ts');
const calendarRequest = (id, overrides = {}) => ({ ...practiceModel.initialPractice().requests[0], id, date: '2026-09-28', time: '09:00', durationMinutes: 30, status: 'Confirmed', ...overrides });

check('Calendar day arithmetic crosses month, year and leap boundaries without local-time drift', () => {
  for (const [date, offset, expected] of [
    ['2026-12-31', 1, '2027-01-01'], ['2027-01-01', -1, '2026-12-31'],
    ['2024-02-28', 1, '2024-02-29'], ['2024-02-29', 1, '2024-03-01'],
    ['2024-03-01', -1, '2024-02-29'], ['2023-02-28', 1, '2023-03-01'],
    ['1900-02-28', 1, '1900-03-01'], ['2000-02-28', 1, '2000-02-29'],
    ['2026-09-25', 7, '2026-10-02'],
  ]) assert.equal(calendar.addCalendarDays(date, offset), expected, `${date} plus ${offset} days`);
  for (const date of ['2026-02-30', 'not-a-date', '2026-9-25']) assert.throws(() => calendar.addCalendarDays(date, 1), { name: 'RangeError' });
  assert.equal(calendar.calendarMonthLabel('2026-09-25'), 'September 2026');
  assert.equal(calendar.calendarDayLabel('2026-09-25'), 'Friday, 25 September');
});

check('Calendar weeks start on Monday and month grids include every leap day and spillover date once', () => {
  for (const [date, monday] of [['2026-09-21', '2026-09-21'], ['2026-09-25', '2026-09-21'], ['2026-09-27', '2026-09-21'], ['2027-01-03', '2026-12-28']]) {
    assert.equal(calendar.startOfCalendarWeek(date), monday);
    assert.equal(calendar.calendarWeekday(monday), 1);
  }
  assert.equal(calendar.calendarWeekday('2026-09-27'), 0);
  for (const [month, days] of [['2024-02', 29], ['2023-02', 28], ['2026-09', 30], ['2027-01', 31]]) {
    const grid = calendar.calendarMonthDays(`${month}-15`);
    assert.equal(grid.length, 42);
    assert.equal(new Set(grid).size, 42);
    assert.equal(calendar.calendarWeekday(grid[0]), 1);
    assert.equal(grid.filter((date) => date.startsWith(month)).length, days);
    for (let index = 1; index < grid.length; index++) assert.equal(grid[index], calendar.addCalendarDays(grid[index - 1], 1));
  }
});

check('Schedule dates show requested, confirmed and completed visits in time order, hiding closed requests', () => {
  const requests = [
    calendarRequest('cancelled', { time: '07:00', status: 'Cancelled' }),
    calendarRequest('requested', { time: '10:00', status: 'Requested' }),
    calendarRequest('completed', { time: '08:00', status: 'Completed' }),
    calendarRequest('other-day', { date: '2026-09-29' }),
    calendarRequest('declined', { time: '08:30', status: 'Declined' }),
    calendarRequest('confirmed', { time: '09:00' }),
  ];
  const practice = { ...practiceModel.initialPractice(), requests };
  const before = JSON.stringify(practice);
  same(calendar.scheduleRequests(practice, '2026-09-28').map((request) => request.id), ['completed', 'confirmed', 'requested']);
  same(calendar.scheduleRequests(practice, '2026-09-30'), []);
  assert.equal(JSON.stringify(practice), before, 'Date filtering must not reorder the store');
});

check('Calendar overlap lanes keep intersecting visits separate and reuse space for adjacent visits', () => {
  const requests = [
    calendarRequest('adjacent', { time: '11:00', durationMinutes: 30 }),
    calendarRequest('bridge', { time: '09:30', durationMinutes: 90 }),
    calendarRequest('first', { time: '09:00', durationMinutes: 60 }),
    calendarRequest('reuse', { time: '10:00', durationMinutes: 30 }),
  ];
  const before = JSON.stringify(requests);
  const layouts = calendar.layoutCalendarEvents(requests);
  assert.equal(layouts.length, requests.length);
  const byId = Object.fromEntries(layouts.map((event) => [event.request.id, event]));
  assert.notEqual(byId.first.column, byId.bridge.column);
  assert.notEqual(byId.reuse.column, byId.bridge.column);
  assert.equal(byId.reuse.column, byId.first.column, 'A lane is available at the exact previous end');
  for (const id of ['first', 'bridge', 'reuse']) assert.equal(byId[id].columns, 2, 'Connected overlap group has consistent widths');
  assert.equal(byId.adjacent.column, 0);
  assert.equal(byId.adjacent.columns, 1);
  assert.equal(byId.first.startMinutes, 540);
  assert.equal(byId.bridge.endMinutes, 660);
  assert.equal(JSON.stringify(requests), before);
});

check('Calendar lane allocation handles simultaneous requests and skips malformed event times', () => {
  const events = calendar.layoutCalendarEvents([
    calendarRequest('one', { time: '09:00', durationMinutes: 60 }),
    calendarRequest('two', { time: '09:00', durationMinutes: 45 }),
    calendarRequest('three', { time: '09:00', durationMinutes: 30 }),
    calendarRequest('invalid-time', { time: '25:00' }),
    calendarRequest('zero-duration', { durationMinutes: 0 }),
  ]);
  assert.equal(events.length, 3);
  assert.equal(new Set(events.map((event) => event.column)).size, 3);
  assert(events.every((event) => event.columns === 3));
  assert.equal(calendar.calendarMinutes('00:00'), 0);
  assert.equal(calendar.calendarMinutes('23:59'), 1439);
  for (const time of ['24:00', '9:00', '09:60', 'invalid']) assert(Number.isNaN(calendar.calendarMinutes(time)));
});

check('Calendar bounds include visible practice hours and full appointment durations within the day', () => {
  const seed = practiceModel.initialPractice();
  const empty = { ...seed, hours: seed.hours.map((day) => ({ ...day, enabled: false })), requests: [] };
  same(calendar.calendarBounds(empty, ['2026-09-28']), { startHour: 8, endHour: 18 });
  const longHours = { ...empty, hours: empty.hours.map((day) => day.day === 1 ? { ...day, enabled: true, start: '06:15', end: '22:45' } : day) };
  same(calendar.calendarBounds(longHours, ['2026-09-28']), { startHour: 6, endHour: 23 });
  same(calendar.calendarBounds(longHours, ['2026-09-29']), { startHour: 8, endHour: 18 }, 'Hours from a hidden day do not expand the view');
  const visits = { ...empty, requests: [calendarRequest('early', { time: '06:45' }), calendarRequest('late', { time: '18:30', durationMinutes: 90 }), calendarRequest('hidden', { date: '2026-09-29', time: '01:00' }), calendarRequest('cancelled', { time: '02:00', status: 'Cancelled' })] };
  same(calendar.calendarBounds(visits, ['2026-09-28']), { startHour: 6, endHour: 20 });
  same(calendar.calendarBounds(visits, ['2026-09-28', '2026-09-29']), { startHour: 1, endHour: 20 });
  same(calendar.calendarBounds({ ...empty, requests: [calendarRequest('midnight', { time: '00:00' }), calendarRequest('late', { time: '23:30', durationMinutes: 90 })] }, ['2026-09-28']), { startHour: 0, endHour: 24 });
});

check('Availability editor keeps invalid drafts local and protects confirmed appointments when saving', () => {
  const read = isolatedAppState();
  read().setActiveAccountId('practitioner');
  const runtime = createRuntime({ state: read });
  const Editor = runtime.load('src/practitioner/PracticeAvailabilityEditor.tsx').PracticeAvailabilityEditor;
  let done = 0;
  const render = () => runtime.render(() => Editor({ onDone: () => { done++; } }));
  let tree = render();
  assert.equal(findByTitle(tree, 'Save weekly hours').props.disabled, true);
  findByLabel(tree, 'Friday closing time in HH:mm').props.onChangeText('10:00');
  tree = render();
  assert.equal(findByTitle(tree, 'Done').props.disabled, true);
  findByTitle(tree, 'Save weekly hours').props.onPress();
  tree = render();
  assert.equal(read().practice.hours.find((day) => day.day === 5).end, '17:00');
  assert(nodes(tree).some((node) => node?.props?.message?.includes('exclude a confirmed appointment')));
  findByLabel(tree, 'Friday closing time in HH:mm').props.onChangeText('25:00');
  tree = render();
  findByTitle(tree, 'Save weekly hours').props.onPress();
  tree = render();
  assert(nodes(tree).some((node) => node?.props?.message?.includes('valid HH:mm')));
  findByTitle(tree, 'Cancel changes').props.onPress();
  tree = render();
  assert.equal(findByLabel(tree, 'Friday closing time in HH:mm').props.value, '17:00');
  assert.equal(findByTitle(tree, 'Save weekly hours').props.disabled, true);
  findByLabel(tree, 'Monday opening time in HH:mm').props.onChangeText('10:00');
  tree = render();
  findByTitle(tree, 'Save weekly hours').props.onPress();
  tree = render();
  assert.equal(read().practice.hours.find((day) => day.day === 1).start, '10:00');
  assert.equal(findByTitle(tree, 'Done').props.disabled, false);
  findByTitle(tree, 'Done').props.onPress();
  assert.equal(done, 1);
});

check('Availability editor seeds the selected date, guards confirmed visits, and reopens a closed day', () => {
  const read = isolatedAppState();
  read().setActiveAccountId('practitioner');
  const runtime = createRuntime({ state: read });
  const Editor = runtime.load('src/practitioner/PracticeAvailabilityEditor.tsx').PracticeAvailabilityEditor;
  const render = () => runtime.render(() => Editor({ initialDate: '2026-09-25' }));
  let tree = render();
  assert.equal(findByLabel(tree, 'Date to close or reopen, YYYY-MM-DD').props.value, '2026-09-25');
  findByTitle(tree, 'Close date').props.onPress();
  tree = render();
  assert(!read().practice.blockedDates.includes('2026-09-25'));
  assert(nodes(tree).some((node) => node?.props?.message?.includes('confirmed appointment')));
  findByLabel(tree, 'Date to close or reopen, YYYY-MM-DD').props.onChangeText('2026-09-30');
  tree = render();
  findByTitle(tree, 'Close date').props.onPress();
  tree = render();
  assert(read().practice.blockedDates.includes('2026-09-30'));
  assert.equal(findByTitle(tree, 'Close date').props.disabled, true, 'Successful immediate update clears the date input');
  findByLabel(tree, `Reopen ${practiceModel.practiceDateLabel('2026-09-30')}`).props.onPress();
  assert(!read().practice.blockedDates.includes('2026-09-30'));
});

check('Availability editor shows current saved hours and cancelling a draft restores the latest practice values', () => {
  const read = isolatedAppState();
  read().setActiveAccountId('practitioner');
  const runtime = createRuntime({ state: read });
  const Editor = runtime.load('src/practitioner/PracticeAvailabilityEditor.tsx').PracticeAvailabilityEditor;
  let tree = runtime.render(Editor);
  assert.equal(findByLabel(tree, 'Monday opening time in HH:mm').props.value, '09:00');
  read().savePracticeHours(read().practice.hours.map((day) => day.day === 1 ? { ...day, start: '10:00' } : day));
  tree = runtime.render(Editor);
  assert.equal(findByLabel(tree, 'Monday opening time in HH:mm').props.value, '10:00');
  findByLabel(tree, 'Monday opening time in HH:mm').props.onChangeText('11:00');
  read().savePracticeHours(read().practice.hours.map((day) => day.day === 1 ? { ...day, start: '12:00' } : day));
  tree = runtime.render(Editor);
  assert.equal(findByLabel(tree, 'Monday opening time in HH:mm').props.value, '11:00', 'Unsaved input stays a draft');
  findByTitle(tree, 'Cancel changes').props.onPress();
  tree = runtime.render(Editor);
  assert.equal(findByLabel(tree, 'Monday opening time in HH:mm').props.value, '12:00');
  assert.equal(findByTitle(tree, 'Save weekly hours').props.disabled, true);
});

function timelineNode(tree) {
  const node = nodes(tree).find((item) => item?.type?.name === 'CalendarTimeline');
  assert(node, 'Schedule must render its timeline');
  return node;
}

check('Schedule Day, Week and List controls navigate real dates and Today resets the selected day', () => {
  const read = isolatedAppState();
  read().setActiveAccountId('practitioner');
  const runtime = createRuntime({ state: read });
  const Screen = runtime.load('app/practice/(tabs)/availability.tsx').default;
  let tree = runtime.render(Screen);
  same(timelineNode(tree).props.dates, ['2026-09-25']);
  assert.equal(findByLabel(tree, 'Day calendar view').props.accessibilityState.selected, true);
  findByLabel(tree, 'Week calendar view').props.onPress();
  tree = runtime.render(Screen);
  same(timelineNode(tree).props.dates, ['2026-09-21', '2026-09-22', '2026-09-23', '2026-09-24', '2026-09-25', '2026-09-26', '2026-09-27']);
  assert.equal(findByLabel(tree, 'Week calendar view').props.accessibilityState.selected, true);
  findByLabel(tree, 'Next week').props.onPress();
  tree = runtime.render(Screen);
  same(timelineNode(tree).props.dates, ['2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04']);
  findByLabel(tree, 'Day calendar view').props.onPress();
  tree = runtime.render(Screen);
  same(timelineNode(tree).props.dates, ['2026-10-02']);
  findByLabel(tree, 'Previous week').props.onPress();
  tree = runtime.render(Screen);
  findByLabel(tree, 'Tuesday, 22 September, 0 appointments').props.onPress();
  tree = runtime.render(Screen);
  same(timelineNode(tree).props.dates, ['2026-09-22']);
  findByLabel(tree, 'List calendar view').props.onPress();
  tree = runtime.render(Screen);
  assert.equal(findByLabel(tree, 'List calendar view').props.accessibilityState.selected, true);
  assert(!nodes(tree).some((node) => node?.type?.name === 'CalendarTimeline'));
  assert(textOf(tree).includes('Next 14 days'));
  findByLabel(tree, 'Go to today in the demo calendar').props.onPress();
  tree = runtime.render(Screen);
  findByLabel(tree, 'Day calendar view').props.onPress();
  same(timelineNode(runtime.render(Screen)).props.dates, ['2026-09-25']);
});

check('Calendar month picker crosses the year, selects a date and resets its displayed month on reopening', () => {
  const read = isolatedAppState();
  read().setActiveAccountId('practitioner');
  const runtime = createRuntime({ state: read });
  const Screen = runtime.load('app/practice/(tabs)/availability.tsx').default;
  let tree = runtime.render(Screen);
  findByLabel(tree, 'Choose date, September 2026').props.onPress();
  tree = runtime.render(Screen);
  assert.equal(findByTitle(tree, 'Choose a date').props.visible, true);
  for (let month = 0; month < 4; month++) {
    findByLabel(tree, 'Next month').props.onPress();
    tree = runtime.render(Screen);
  }
  assert(textOf(findByTitle(tree, 'Choose a date')).includes('January 2027'));
  findByLabel(tree, 'Previous month').props.onPress();
  tree = runtime.render(Screen);
  assert(textOf(findByTitle(tree, 'Choose a date')).includes('December 2026'));
  findByLabel(tree, 'Next month').props.onPress();
  tree = runtime.render(Screen);
  findByLabel(tree, 'Choose Friday, 1 January').props.onPress();
  tree = runtime.render(Screen);
  same(timelineNode(tree).props.dates, ['2027-01-01']);
  assert.equal(findByTitle(tree, 'Choose a date').props.visible, false);
  findByLabel(tree, 'Go to today in the demo calendar').props.onPress();
  tree = runtime.render(Screen);
  findByLabel(tree, 'Choose date, September 2026').props.onPress();
  tree = runtime.render(Screen);
  assert(textOf(findByTitle(tree, 'Choose a date')).includes('September 2026'));
  findByLabel(tree, 'Choose Monday, 28 September').props.onPress();
  tree = runtime.render(Screen);
  same(timelineNode(tree).props.dates, ['2026-09-28']);
  findByLabel(tree, 'Choose date, September 2026').props.onPress();
  tree = runtime.render(Screen);
  findByTitle(tree, 'Back to today').props.onPress();
  tree = runtime.render(Screen);
  same(timelineNode(tree).props.dates, ['2026-09-25']);
  assert.equal(findByTitle(tree, 'Choose a date').props.visible, false);
});

check('Calendar timeline and list appointment callbacks open details and reflect current request statuses', () => {
  const read = isolatedAppState();
  read().setActiveAccountId('practitioner');
  const runtime = createRuntime({ state: read });
  const Screen = runtime.load('app/practice/(tabs)/availability.tsx').default;
  const childRuntime = createRuntime({ state: read });
  const Timeline = childRuntime.load('src/practitioner/PractitionerAvailability.tsx').CalendarTimeline;
  let tree = runtime.render(Screen);
  let timeline = childRuntime.render(() => Timeline(timelineNode(tree).props));
  const appointments = (rendered) => nodes(rendered).filter((node) => node?.props?.accessibilityLabel?.endsWith('Open appointment.'));
  assert.equal(appointments(timeline).length, 1);
  appointments(timeline)[0].props.onPress();
  assert.equal(runtime.navigation.at(-1).href, '/practice/request/practice-today');
  findByLabel(tree, 'Next week').props.onPress();
  tree = runtime.render(Screen);
  findByLabel(tree, 'Monday, 28 September, 2 appointments').props.onPress();
  tree = runtime.render(Screen);
  timeline = childRuntime.render(() => Timeline(timelineNode(tree).props));
  assert.equal(appointments(timeline).length, 2);
  assert(appointments(timeline).every((node) => node.props.accessibilityLabel.includes('Requested')));
  assert.equal(read().confirmPracticeRequest('practice-riya-request', 'Sample clinic details').ok, true);
  tree = runtime.render(Screen);
  timeline = childRuntime.render(() => Timeline(timelineNode(tree).props));
  assert(appointments(timeline).some((node) => node.props.accessibilityLabel.startsWith('Riya Shah') && node.props.accessibilityLabel.includes('Confirmed')));
  assert.equal(read().cancelPracticeRequest('practice-riya-request', 'Example change').ok, true);
  assert.equal(read().declinePracticeRequest('practice-savita-request', 'Example unavailable time').ok, true);
  tree = runtime.render(Screen);
  timeline = childRuntime.render(() => Timeline(timelineNode(tree).props));
  assert.equal(appointments(timeline).length, 0, 'Cancelled and declined requests leave the timeline');
  assert(textOf(timeline).includes('No appointments'));
  findByLabel(tree, 'Go to today in the demo calendar').props.onPress();
  tree = runtime.render(Screen);
  findByLabel(tree, 'List calendar view').props.onPress();
  tree = runtime.render(Screen);
  const rows = nodes(tree).filter((node) => node?.type?.name === 'AgendaRow');
  same(rows.map((node) => node.props.request.id), ['practice-today', 'practice-rajiv-request']);
  rows[1].props.onPress();
  assert.equal(runtime.navigation.at(-1).href, '/practice/request/practice-rajiv-request');
});

check('Calendar reflects changed weekly hours, days off and paused requests without hiding existing appointments', () => {
  const read = isolatedAppState();
  read().setActiveAccountId('practitioner');
  const runtime = createRuntime({ state: read });
  const Screen = runtime.load('app/practice/(tabs)/availability.tsx').default;
  let tree = runtime.render(Screen);
  findByLabel(tree, 'Choose date, September 2026').props.onPress();
  tree = runtime.render(Screen);
  findByLabel(tree, 'Choose Wednesday, 30 September').props.onPress();
  tree = runtime.render(Screen);
  assert(textOf(tree).includes('9:00 am–5:00 pm'));
  assert.equal(read().savePracticeHours(read().practice.hours.map((day) => day.day === 3 ? { ...day, start: '12:00', end: '15:00' } : day)).ok, true);
  tree = runtime.render(Screen);
  assert(textOf(tree).includes('12:00 pm–3:00 pm'));
  assert.equal(read().togglePracticeBlockedDate('2026-09-30').ok, true);
  tree = runtime.render(Screen);
  assert(textOf(tree).includes('0 appointments · Day off'));
  findByLabel(tree, 'Edit availability and days off').props.onPress();
  tree = runtime.render(Screen);
  assert.equal(findByTitle(tree, 'Availability').props.visible, true);
  const editor = nodes(tree).find((node) => node?.type?.name === 'PracticeAvailabilityEditor');
  assert(editor);
  assert.equal(editor.props.initialDate, '2026-09-30');
  editor.props.onDone();
  tree = runtime.render(Screen);
  assert.equal(findByTitle(tree, 'Availability').props.visible, false);
  assert(!nodes(tree).some((node) => node?.type?.name === 'PracticeAvailabilityEditor'));
  read().savePracticeProfile({ ...read().practice.profile, acceptingRequests: false });
  findByLabel(tree, 'Go to today in the demo calendar').props.onPress();
  tree = runtime.render(Screen);
  assert(textOf(tree).includes('New requests are paused'));
  assert.equal(calendar.scheduleRequests(timelineNode(tree).props.practice, '2026-09-25').length, 1);
});

const failures = results.filter((result) => !result.passed);
console.log(`\n${results.length - failures.length}/${results.length} redesign checks passed.`);
if (failures.length) process.exitCode = 1;
