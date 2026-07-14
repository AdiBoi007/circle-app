import { useEffect, useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Avatar, Button, Card, DetailHeader, ScreenContainer, Sheet, StatusPill, Text } from '@/components';
import { family, providerById } from '@/data';
import { useAppState } from '@/state';
import { colors, radius, spacing } from '@/theme';

type Stage = 'waiting' | 'session' | 'summary';

export default function ConsultationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { bookings, updateBooking, addTask } = useAppState();
  const booking = bookings.find((item) => item.id === id);
  const pro = providerById(booking?.providerId ?? 'arvind-nair');
  const member = family.find((item) => item.id === booking?.memberId);
  const [stage, setStage] = useState<Stage>('waiting');
  const [camera, setCamera] = useState(true);
  const [mic, setMic] = useState(true);
  const [speaker, setSpeaker] = useState(true);
  const [seconds, setSeconds] = useState(0);
  const [end, setEnd] = useState(false);
  const [chat, setChat] = useState(false);
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (stage !== 'session') return;
    const timer = setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, [stage]);

  if (!booking || !pro || !member) return <ScreenContainer><DetailHeader title="Consultation" /><Card><Text>Booking not found.</Text></Card></ScreenContainer>;

  if (stage === 'waiting') {
    return (
      <ScreenContainer edges={['top', 'bottom']}>
        <DetailHeader title="Waiting room" />
        <View style={styles.hero}>
          <Avatar name={pro.name} accent={pro.accent} size={84} />
          <Text variant="title1">{pro.name}</Text>
          <Text variant="callout" color={colors.textSecondary}>{member.name} · {booking.date}, {booking.time}</Text>
          <StatusPill label="Connection is strong" accent="sage" />
        </View>
        <Card><Text variant="headline">Shared context preview</Text><Text variant="callout" color={colors.textSecondary} style={styles.gap}>Current care goal, selected records and your booking note are ready for the session. Nothing is transmitted in this UI-only simulation.</Text></Card>
        <View style={styles.controls}>
          <Control icon={camera ? 'video' : 'video-off'} label={camera ? 'Camera on' : 'Camera off'} active={camera} onPress={() => setCamera((value) => !value)} />
          <Control icon={mic ? 'mic' : 'mic-off'} label={mic ? 'Mic on' : 'Mic off'} active={mic} onPress={() => setMic((value) => !value)} />
        </View>
        <Button title="Join consultation" onPress={() => setStage('session')} />
      </ScreenContainer>
    );
  }

  if (stage === 'summary') {
    return (
      <ScreenContainer edges={['top', 'bottom']}>
        <DetailHeader title="Session complete" />
        <View style={styles.hero}><View style={styles.completeIcon}><Feather name="check" size={34} color={colors.blue} /></View><Text variant="title1">Care plan ready</Text><Text variant="callout" color={colors.textSecondary}>A local simulated summary for {member.name}.</Text></View>
        <Card><Text variant="title3">Session summary</Text><Text variant="callout" color={colors.textSecondary} style={styles.gap}>Reviewed current routines, agreed on one gentle next step, and planned a follow-up. This is a demo summary and not clinical advice.</Text></Card>
        <Card style={styles.gap}><Text variant="title3">Care-plan tasks</Text><Text variant="callout" style={styles.gap}>Complete the agreed 10-minute routine three times before the next session.</Text></Card>
        <View style={styles.buttons}>
          <Button title={saved ? 'Care plan saved' : 'Save care plan'} disabled={saved} onPress={() => { setSaved(true); addTask({ id: `care-${Date.now()}`, title: `Complete ${pro.category} care-plan routine`, memberId: member.id, who: member.name.split(' ')[0]!, date: 'Tomorrow', time: '10:00 am', icon: 'check-square', accent: member.accent, completed: false }); }} />
          <Button title="Set follow-up reminder" variant="secondary" onPress={() => router.push('/quick-add/reminder')} />
          <Button title="Rebook" variant="secondary" onPress={() => router.push(`/booking/new?providerId=${pro.id}&memberId=${member.id}`)} />
          <Button title="Rate session · ★★★★★" variant="tertiary" onPress={() => setSaved(true)} />
        </View>
      </ScreenContainer>
    );
  }

  const minutes = String(Math.floor(seconds / 60)).padStart(2, '0');
  const secs = String(seconds % 60).padStart(2, '0');
  return (
    <View style={styles.session}>
      <SafeTop><DetailHeader title={`${minutes}:${secs}`} /></SafeTop>
      <View style={styles.video}>
        <View style={styles.proVideo}>
          <Avatar name={pro.name} accent={pro.accent} size={116} />
          <Text variant="title2" color={colors.white}>{pro.name}</Text>
          <Text variant="subhead" color="#D7D9D1">Simulated professional video</Text>
        </View>
        <View style={styles.preview}>
          {camera ? <><Avatar name="Arjun Mehra" accent="blue" size={60} /><Text variant="caption" color={colors.white}>You</Text></> : <Feather name="video-off" size={24} color={colors.white} />}
        </View>
      </View>
      <View style={styles.sessionControls}>
        <Control icon={mic ? 'mic' : 'mic-off'} label="Mute" active={mic} onPress={() => setMic((value) => !value)} dark />
        <Control icon={camera ? 'video' : 'video-off'} label="Camera" active={camera} onPress={() => setCamera((value) => !value)} dark />
        <Control icon={speaker ? 'volume-2' : 'volume-x'} label="Speaker" active={speaker} onPress={() => setSpeaker((value) => !value)} dark />
        <Control icon="message-circle" label="Chat" active={chat} onPress={() => setChat(true)} dark />
        <Pressable onPress={() => setEnd(true)} style={styles.end}><Feather name="phone-off" size={22} color={colors.white} /><Text variant="caption" color={colors.white}>End</Text></Pressable>
      </View>
      <Sheet visible={chat} onClose={() => setChat(false)} title="Session notes & chat" footer={<Button title="Save note" onPress={() => setChat(false)} />}><TextInput value={notes} onChangeText={setNotes} multiline placeholder="Write a private note…" placeholderTextColor={colors.textTertiary} style={styles.note} /></Sheet>
      <Sheet visible={end} onClose={() => setEnd(false)} title="End consultation?" footer={<View style={styles.buttons}><Button title="Continue session" variant="secondary" onPress={() => setEnd(false)} /><Button title="End and view summary" onPress={() => { updateBooking(booking.id, { status: 'Completed' }); setEnd(false); setStage('summary'); }} /></View>}><Text variant="callout" color={colors.textSecondary}>Your private notes will remain available in the local post-session summary.</Text></Sheet>
    </View>
  );
}

function SafeTop({ children }: { children: React.ReactNode }) { return <View style={styles.safeTop}>{children}</View>; }
function Control({ icon, label, active, onPress, dark }: { icon: keyof typeof Feather.glyphMap; label: string; active: boolean; onPress: () => void; dark?: boolean }) {
  return <Pressable onPress={onPress} style={styles.control}><View style={[styles.controlIcon, dark && styles.controlDark, !active && styles.controlOff]}><Feather name={icon} size={21} color={dark || !active ? colors.white : colors.textPrimary} /></View><Text variant="caption" color={dark ? colors.white : colors.textSecondary}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: spacing.sm, marginVertical: spacing.xxxl },
  completeIcon: { width: 78, height: 78, borderRadius: 39, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.blueTint },
  gap: { marginTop: spacing.lg },
  controls: { flexDirection: 'row', justifyContent: 'center', gap: spacing.xxxl, marginVertical: spacing.xxxl },
  control: { alignItems: 'center', gap: spacing.xs },
  controlIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  controlDark: { backgroundColor: '#383A35' },
  controlOff: { backgroundColor: colors.red },
  buttons: { gap: spacing.sm },
  session: { flex: 1, backgroundColor: '#11120F' },
  safeTop: { paddingTop: 54, paddingHorizontal: spacing.xl, backgroundColor: '#11120F' },
  video: { flex: 1, margin: spacing.lg, borderRadius: radius.cardLarge, backgroundColor: '#2B3A35', overflow: 'hidden' },
  proVideo: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  preview: { position: 'absolute', right: spacing.lg, bottom: spacing.lg, width: 95, height: 130, borderRadius: radius.card, backgroundColor: '#566278', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  sessionControls: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingBottom: 38 },
  end: { alignItems: 'center', gap: spacing.xs },
  note: { minHeight: 150, backgroundColor: colors.surfaceMuted, borderRadius: radius.input, padding: spacing.lg, textAlignVertical: 'top', fontSize: 16, color: colors.textPrimary },
});
