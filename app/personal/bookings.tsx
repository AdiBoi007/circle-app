import { ConsumerPracticeRequests } from '@/practitioner/ConsumerPracticeRequests';
import { router } from 'expo-router';
import { View } from 'react-native';
import { DetailHeader, ScreenContainer, Text } from '@/components';
import { DemoNotice, PersonalAccess, PersonalBookingCard, PersonalButton, PersonalSection, ui } from '@/accounts/individual/PersonalUI';
import { useAppState } from '@/state';

export default function IndividualBookings() {
  const { activeAccountId, individualBookings } = useAppState();
  if (activeAccountId !== 'riya') return <PersonalAccess />;
  const upcoming = individualBookings.filter((item) => item.status === 'Confirmed').sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));
  const cancelled = individualBookings.filter((item) => item.status === 'Cancelled');
  return <ScreenContainer bottomInset={40} contentStyle={ui.page}><DetailHeader title="My appointments" /><DemoNotice /><ConsumerPracticeRequests /><PersonalSection title="Upcoming">{upcoming.length ? upcoming.map((booking) => <PersonalBookingCard key={booking.id} booking={booking} />) : <View style={ui.card}><Text>Your diary is clear. Find support when you’re ready.</Text></View>}</PersonalSection><PersonalButton title="Find care" onPress={() => router.push('/care')} />{cancelled.length ? <PersonalSection title="Cancelled">{cancelled.map((booking) => <PersonalBookingCard key={booking.id} booking={booking} />)}</PersonalSection> : null}</ScreenContainer>;
}
