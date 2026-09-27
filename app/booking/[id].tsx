import { launchMarket } from '@/config/launch';
import { availableCareModes as availableModes } from '@/utils/careEligibility';
import { useRef, useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Avatar, Button, Card, DetailHeader, ProgressBar, ScreenContainer, StatusPill, Text } from '@/components';
import { family, providerById } from '@/data';
import { useAppState } from '@/state';
import { colors, radius, spacing } from '@/theme';
import type { CareMode, MemberId } from '@/types';
import { SavitaBooking } from '@/accounts/savita/SavitaBooking';

const dates = ['20 July 2026', '21 July 2026', '23 July 2026'];
const times = ['6:30 pm', '7:00 pm', '8:00 pm'];
const stepNames = ['Your visit', 'Choose a time', 'Review'] as const;

export default function BookingScreen() {
  const { activeAccountId, bookings } = useAppState();
  const { id, providerId, memberId } = useLocalSearchParams<{ id: string; providerId?: string; memberId?: string }>();
  if (activeAccountId === 'riya') return <Unavailable message="Your individual profile has its own care directory and appointments." />;
  if (id === 'new' && providerId === 'arvind-nair') return <Redirect href={{ pathname: '/request-care', params: { memberId } }} />;
  if (activeAccountId === 'savita') {
    const existing = bookings.find((item) => item.id === id && item.memberId === 'savita');
    const pro = providerById(existing?.providerId ?? providerId ?? '');
    const allowed = pro ? availableModes(pro, 'savita') : [];
    if (!pro || !allowed.length || (id === 'new' && allowed.length !== pro.modes.length) || (existing && !allowed.includes(existing.mode))) return <Unavailable message="This professional or visit format is not available for your location in this demo." />;
    return <SavitaBooking />;
  }
  return <ArjunBookingScreen key={`${id}-${providerId ?? ''}-${memberId ?? ''}`} />;
}

function ArjunBookingScreen() {
  const { id, providerId: queryProvider, memberId: queryMember } = useLocalSearchParams<{ id: string; providerId?: string; memberId?: string }>();
  const { bookings, addBooking, updateBooking } = useAppState();
  const existing = bookings.find((item) => item.id === id);
  const pro = providerById(existing?.providerId ?? queryProvider ?? '');
  const eligibleMembers = family.filter((member) => pro && availableModes(pro, member.id).length > 0);
  const requested = queryMember ? family.find((member) => member.id === queryMember)?.id : undefined;
  const initialMember = existing?.memberId ?? (queryMember ? requested : eligibleMembers.find((member) => pro?.recommendedFor.includes(member.id))?.id ?? eligibleMembers[0]?.id);
  const [memberId, setMemberId] = useState<MemberId | undefined>(initialMember);
  const [service, setService] = useState(existing?.service ?? pro?.services[0] ?? '');
  const [mode, setMode] = useState<CareMode>(existing?.mode ?? (pro && initialMember ? availableModes(pro, initialMember)[0] : undefined) ?? 'Online');
  const [date, setDate] = useState(existing?.date ?? dates[0]);
  const [time, setTime] = useState(existing?.time ?? times[0]);
  const [note, setNote] = useState(existing?.note ?? '');
  const [step, setStep] = useState(0);
  const [createdId, setCreatedId] = useState('');
  const [editing, setEditing] = useState(false);
  const [cancel, setCancel] = useState(false);
  const [notice, setNotice] = useState('');
  const saving = useRef(false);
  const sequence = useRef(0);
  const person = family.find((member) => member.id === memberId);
  const modes = pro && memberId ? availableModes(pro, memberId) : [];
  const eligible = Boolean(pro && memberId && modes.includes(mode));
  const timezone = `${launchMarket.timeZoneLabel} (UTC${launchMarket.utcOffset})`;

  const providerKey = pro?.id;
  const save = (bookingId: string) => {
    const selectedProfessional = providerById(providerKey ?? '');
    if (!selectedProfessional || !memberId || !availableModes(selectedProfessional, memberId).includes(mode) || !selectedProfessional.services.includes(service) || saving.current) return;
    saving.current = true;
    addBooking({ id: bookingId, providerId: selectedProfessional.id, memberId, service, date, time, mode, status: 'Confirmed', note });
    setCreatedId(bookingId);
  };

  if (!pro || (id !== 'new' && !existing)) return <Unavailable message="We could not find this appointment or care professional." />;

  const selectMember = (selected: MemberId) => {
    const nextModes = availableModes(pro, selected);
    if (!nextModes.length) return;
    setMemberId(selected);
    if (!nextModes.includes(mode)) setMode(nextModes[0]);
  };

  if (createdId) return <ScreenContainer edges={['top', 'bottom']} contentStyle={styles.content}>
    <DetailHeader title="Sample visit saved" />
    <View style={styles.hero}><View style={styles.successBadge}><Feather name="check" size={32} color={colors.sage} /></View><Text variant="title1" align="center">Your demo visit is saved.</Text><Text variant="callout" align="center">{person?.name} with {pro.name}</Text><Text variant="callout" color={colors.textSecondary} align="center">{date} · {time}{`\n`}{timezone} · {mode}</Text></View>
    <Card><Text variant="headline">See it in your care list</Text><Text variant="callout" color={colors.textSecondary} style={styles.gap}>This is a sample appointment in Circle. No professional was contacted and no payment was made.</Text></Card>
    <Button title="View sample appointment" onPress={() => router.replace(`/booking/${createdId}`)} /><Button title="Back to Find care" variant="secondary" onPress={() => router.replace('/care')} />
  </ScreenContainer>;

  if (existing && id !== 'new') return <ScreenContainer edges={['top', 'bottom']} contentStyle={styles.content}>
    <DetailHeader title="Appointment details" />
    <View style={styles.hero}><Avatar name={pro.name} accent={pro.accent} size={82} /><StatusPill label={existing.status} accent={existing.status === 'Cancelled' ? 'neutral' : 'sage'} /><Text variant="title1" align="center">{pro.name}</Text><Text variant="headline" color={colors.textSecondary} align="center">{existing.service}</Text></View>
    <Text variant="callout" color={colors.textSecondary}>Sample appointment · no professional has been contacted.</Text>
    <Card><Info label="For" value={person?.name ?? 'Family member'} /><Info label="When" value={`${existing.date}, ${existing.time}`} /><Info label="Local time" value={timezone} /><Info label="Format" value={existing.mode} />{existing.note ? <Info label="Your note" value={existing.note} /> : null}</Card>
    {!eligible ? <Card background={colors.amberTint}><Text variant="callout">This saved demo appointment has a location or format mismatch. Choose a professional who supports {person?.location ?? 'this recipient’s location'} before rebooking.</Text></Card> : null}
    {notice ? <Text accessibilityLiveRegion="polite" variant="callout" style={styles.notice}>{notice}</Text> : null}
    {existing.status === 'Confirmed' && !editing && !cancel ? <>
      {existing.mode === 'Online' && eligible ? <Button title="Preview online waiting room" onPress={() => router.push(`/consultation/${existing.id}`)} /> : null}
      <Button title="Change appointment time" disabled={!eligible} variant="secondary" onPress={() => setEditing(true)} />
      <Button title="Cancel sample appointment" variant="secondary" onPress={() => setCancel(true)} />
    </> : null}
    {editing ? <Card style={styles.section}><Text variant="title2">Choose a new time</Text><Text variant="callout">All times are {timezone.toLowerCase()}.</Text><Choices title="Date" options={dates} value={date} onChange={setDate} /><Choices title="Time" options={times} value={time} onChange={setTime} /><Button title="Save new time" disabled={!eligible} onPress={() => { if (!eligible) return; updateBooking(existing.id, { date, time }); setEditing(false); setNotice('The new time is saved in this demo.'); }} /><Button title="Keep original time" variant="secondary" onPress={() => { setDate(existing.date); setTime(existing.time); setEditing(false); }} /></Card> : null}
    {cancel ? <Card style={styles.section}><Text variant="title2">Cancel this sample appointment?</Text><Text variant="callout">It will leave your upcoming care list.</Text><Button title="Keep appointment" onPress={() => setCancel(false)} /><Button title="Yes, cancel appointment" variant="secondary" onPress={() => { updateBooking(existing.id, { status: 'Cancelled' }); setCancel(false); setNotice('Sample appointment cancelled.'); }} /></Card> : null}
    {eligible ? <Button title="Plan another visit" variant="secondary" onPress={() => router.push(`/booking/new?providerId=${pro.id}&memberId=${existing.memberId}`)} /> : null}<Button title="Back to Find care" variant="tertiary" onPress={() => router.replace('/care')} />
  </ScreenContainer>;

  return <ScreenContainer edges={['top', 'bottom']} contentStyle={styles.content}>
    <DetailHeader title="Plan a visit" />
    <View style={styles.providerBar}><Avatar name={pro.name} accent={pro.accent} size={56} /><View style={styles.flex}><Text variant="title3">{pro.name}</Text><Text variant="callout" color={colors.textSecondary}>{pro.title}</Text></View></View>
    <Text variant="callout" color={colors.textSecondary}>Sample booking · no payment or real appointment.</Text>
    <Text variant="headline">{step + 1} of 3 · {stepNames[step]}</Text><ProgressBar progress={(step + 1) / 3} accent="sage" accessibilityLabel={`Step ${step + 1} of 3: ${stepNames[step]}`} />
    <Card style={styles.section}>
      {step === 0 ? <><Text variant="title2">Who is this visit for?</Text><Text variant="callout" color={colors.textSecondary}>Only recipients and formats supported in the professional’s listed region are available.</Text>{!eligible ? <Text variant="callout" color={colors.red}>{person ? `This provider does not support ${person.name.split(' ')[0]} in ${launchMarket.city}. Choose an eligible recipient or another provider.` : 'Choose a recipient to continue.'}</Text> : null}
        {eligibleMembers.map((member) => <Pressable key={member.id} onPress={() => selectMember(member.id)} accessibilityRole="radio" accessibilityState={{ checked: memberId === member.id }} style={({ pressed }) => [styles.choice, memberId === member.id && styles.choiceActive, pressed && styles.pressed]}><View style={styles.personChoice}><Avatar name={member.name} accent={member.accent} size={42} /><View style={styles.flex}><Text variant="headline">{member.name}</Text><Text variant="callout" color={colors.textSecondary}>{member.location}</Text></View></View><Feather name={memberId === member.id ? 'check-circle' : 'circle'} size={22} color={colors.sage} /></Pressable>)}
        <Choices title="Choose a service" options={pro.services} value={service} onChange={setService} />{modes.length ? <Choices title="Visit format" options={modes} value={mode} onChange={setMode} /> : null}
      </> : null}
      {step === 1 ? <><Text variant="title2">A time for {person?.name.split(' ')[0]}</Text><Text variant="callout" color={colors.textSecondary}>Sample availability. All times are {timezone.toLowerCase()}.</Text><Choices title="Date" options={dates} value={date} onChange={setDate} /><Choices title="Time" options={times} value={time} onChange={setTime} /></> : null}
      {step === 2 ? <><Text variant="title2">Review your visit</Text><Info label="For" value={person?.name ?? 'Choose a recipient'} /><Info label="Service" value={service} /><Info label="When" value={`${date} · ${time} · ${timezone}`} /><Info label="Format" value={mode} /><Info label="Example price" value={`${pro.currency}${pro.price}${pro.priceSuffix ?? ''}`} /><Text variant="headline">Add a note (optional)</Text><TextInput value={note} onChangeText={setNote} multiline maxLength={600} accessibilityLabel="Optional note for this sample appointment" placeholder="What would you like to discuss?" placeholderTextColor={colors.textSecondary} style={styles.note} /><Text variant="callout" color={colors.textSecondary}>Your note stays in this demo. No health records are sent.</Text></> : null}
    </Card>
    <Button title={step === 2 ? 'Save sample appointment' : 'Continue'} disabled={!eligible || !pro.services.includes(service)} onPress={() => { if (!eligible) return; if (step < 2) setStep((value) => value + 1); else save(`booking-${Date.now()}-${++sequence.current}`); }} />{step > 0 ? <Button title="Back" variant="secondary" onPress={() => setStep((value) => value - 1)} /> : <Button title="Choose another professional" variant="tertiary" onPress={() => router.replace('/care')} />}
  </ScreenContainer>;
}


function Unavailable({ message }: { message: string }) { return <ScreenContainer contentStyle={styles.content}><DetailHeader title="Appointment" /><Card style={styles.section}><Text variant="title2">Let’s find suitable care</Text><Text variant="callout">{message}</Text><Button title="Back to Find care" onPress={() => router.replace('/care')} /></Card></ScreenContainer>; }
function Choices<T extends string>({ title, options, value, onChange }: { title: string; options: readonly T[]; value: T; onChange: (value: T) => void }) {
  return <View style={styles.choiceBlock}><Text variant="title3">{title}</Text>{options.map((item) => <Pressable key={item} onPress={() => onChange(item)} accessibilityRole="radio" accessibilityState={{ checked: value === item }} style={({ pressed }) => [styles.choice, value === item && styles.choiceActive, pressed && styles.pressed]}><Text variant="callout" style={styles.flex}>{item}</Text><Feather name={value === item ? 'check-circle' : 'circle'} size={22} color={colors.sage} /></Pressable>)}</View>;
}
function Info({ label, value }: { label: string; value: string }) { return <View style={styles.info}><Text variant="caption" color={colors.textSecondary}>{label.toUpperCase()}</Text><Text variant="headline">{value}</Text></View>; }

const styles = StyleSheet.create({
  content: { gap: spacing.lg },
  hero: { alignItems: 'center', gap: spacing.md, marginVertical: spacing.xl },
  successBadge: { width: 78, height: 78, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.sageTint },
  providerBar: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  gap: { marginTop: spacing.md },
  section: { gap: spacing.lg },
  choiceBlock: { gap: spacing.md },
  choice: { minHeight: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, padding: spacing.lg, borderRadius: radius.input, backgroundColor: colors.surfaceMuted, borderWidth: 1, borderColor: 'transparent' },
  choiceActive: { backgroundColor: colors.sageTint, borderColor: colors.sage },
  personChoice: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  flex: { flex: 1, minWidth: 0 },
  note: { minHeight: 120, backgroundColor: colors.surfaceMuted, borderRadius: radius.input, padding: spacing.lg, fontSize: 18, textAlignVertical: 'top', color: colors.textPrimary },
  info: { gap: spacing.xs, marginVertical: spacing.sm },
  notice: { padding: spacing.lg, backgroundColor: colors.sageTint, borderRadius: radius.input },
  pressed: { opacity: 0.7 },
});
