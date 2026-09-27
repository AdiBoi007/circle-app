import { useEffect, useRef, useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';

import { Button, ScreenContainer, Sheet, Text } from '@/components';
import { useAppState } from '@/state';
import { colors } from '@/theme';
import type { PracticeRequest, PracticeSnapshot } from './types';
import { practiceDemoDate, practiceTimeLabel } from './model';
import { addCalendarDays, calendarBounds, calendarDayLabel, calendarMinutes, calendarMonthDays, calendarMonthLabel, calendarWeekday, layoutCalendarEvents, scheduleRequests, startOfCalendarWeek } from './calendar';
import { PracticeAvailabilityEditor } from './PracticeAvailabilityEditor';

const weekdays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const HOUR_HEIGHT = 96;
const GUTTER = 48;
type CalendarView = 'Day' | 'Week' | 'List';
const appearance = (request: PracticeRequest) => request.status === 'Requested'
  ? { color: colors.amber, tint: colors.amberTint, label: 'Requested' }
  : request.status === 'Completed' ? { color: colors.sage, tint: colors.sageTint, label: 'Completed' }
    : { color: colors.blue, tint: colors.blueTint, label: 'Confirmed' };
const requestLabel = (request: PracticeRequest) => `${request.recipientName}, ${request.serviceName}, ${practiceTimeLabel(request.time)}, ${request.durationMinutes} minutes, ${request.mode}, ${request.status}. Open appointment.`;
const hourLabel = (hour: number) => `${hour % 12 || 12} ${hour < 12 || hour === 24 ? 'AM' : 'PM'}`;
const monthStep = (date: string, amount: number) => {
  const value = new Date(`${date.slice(0, 7)}-01T12:00:00Z`);
  value.setUTCMonth(value.getUTCMonth() + amount);
  return value.toISOString().slice(0, 10);
};
const weekLabel = (start: string, end: string) => {
  const first = `${Number(start.slice(8))} ${calendarMonthLabel(start).split(' ')[0]!.slice(0, 3)}`;
  const last = `${Number(end.slice(8))} ${calendarMonthLabel(end).split(' ')[0]!.slice(0, 3)} ${end.slice(0, 4)}`;
  return `${first}${start.slice(0, 4) !== end.slice(0, 4) ? ` ${start.slice(0, 4)}` : ''} – ${last}`;
};

export function PractitionerAvailability() {
  const { practice } = useAppState();
  const { width, fontScale } = useWindowDimensions();
  const [selectedDate, setSelectedDate] = useState(practiceDemoDate);
  const [view, setView] = useState<CalendarView>('Day');
  const [monthOpen, setMonthOpen] = useState(false);
  const [month, setMonth] = useState(practiceDemoDate);
  const [editing, setEditing] = useState(false);
  const weekStart = startOfCalendarWeek(selectedDate);
  const week = Array.from({ length: 7 }, (_, index) => addCalendarDays(weekStart, index));
  const dayRequests = scheduleRequests(practice, selectedDate);
  const dayHours = practice.hours.find((day) => day.day === calendarWeekday(selectedDate));
  const closed = practice.blockedDates.includes(selectedDate) || !dayHours?.enabled;
  const listedDates = Array.from({ length: 14 }, (_, index) => addCalendarDays(selectedDate, index));
  const agenda = listedDates.filter((date) => scheduleRequests(practice, date).length);
  const calendarWidth = Math.min(width, 760);
  const largeText = fontScale > 1.3;
  const openAppointment = (id: string) => router.push(`/practice/request/${id}`);
  const selectDate = (date: string) => { setSelectedDate(date); setMonthOpen(false); };
  const jumpToday = () => setSelectedDate(practiceDemoDate);

  return <ScreenContainer scroll={false} gutter={false} edges={[]} contentStyle={styles.root}>
    <View style={styles.toolbar}>
      <View style={[styles.topRow, largeText && styles.wrap]}>
        <Pressable accessibilityRole="button" accessibilityLabel={`Choose date, ${calendarMonthLabel(selectedDate)}`} onPress={() => { setMonth(selectedDate); setMonthOpen(true); }} style={({ pressed }) => [styles.monthButton, pressed && styles.pressed]}>
          <View><Text variant="title1" accessibilityRole="header" style={styles.monthTitle}>{calendarMonthLabel(selectedDate).split(' ')[0]}</Text><Text variant="footnote" color={colors.textSecondary}>{selectedDate.slice(0, 4)} · Chandigarh · IST</Text></View><Feather name="chevron-down" size={18} color={colors.red} />
        </Pressable>
        <View style={styles.actions}><Pressable accessibilityRole="button" accessibilityLabel="Go to today in the demo calendar" onPress={jumpToday} style={({ pressed }) => [styles.todayButton, pressed && styles.pressed]}><Text variant="headline" color={colors.red}>Today</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Edit availability and days off" onPress={() => setEditing(true)} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}><Feather name="sliders" size={21} color={colors.textPrimary} /></Pressable></View>
      </View>
      <View style={[styles.controls, largeText && styles.wrap]}>
        <View style={styles.segmented}>{(['Day', 'Week', 'List'] as const).map((mode) => <Pressable key={mode} accessibilityRole="button" accessibilityLabel={`${mode} calendar view`} accessibilityState={{ selected: view === mode }} aria-pressed={view === mode} onPress={() => setView(mode)} style={[styles.segment, view === mode && styles.activeSegment]}><Text variant="subhead" style={{ fontWeight: view === mode ? '600' : '400' }}>{mode}</Text></Pressable>)}</View>
        <View style={styles.arrows}><Pressable accessibilityRole="button" accessibilityLabel="Previous week" onPress={() => setSelectedDate(addCalendarDays(selectedDate, -7))} style={styles.iconButton}><Feather name="chevron-left" size={23} color={colors.red} /></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Next week" onPress={() => setSelectedDate(addCalendarDays(selectedDate, 7))} style={styles.iconButton}><Feather name="chevron-right" size={23} color={colors.red} /></Pressable></View>
      </View>
    </View>

    <View style={styles.weekStrip}>{week.map((date, index) => {
      const selected = date === selectedDate;
      const today = date === practiceDemoDate;
      const requests = scheduleRequests(practice, date);
      return <Pressable key={date} accessibilityRole="button" accessibilityLabel={`${calendarDayLabel(date)}, ${requests.length} appointments${today ? ', today' : ''}`} accessibilityState={{ selected }} onPress={() => setSelectedDate(date)} style={styles.weekDay}>
        <Text variant="caption" color={today ? colors.red : colors.textSecondary} style={styles.weekdayLabel}>{weekdays[index]}</Text>
        <View style={[styles.dateCircle, selected && styles.selectedDate]}><Text variant="title3" color={selected ? colors.white : today ? colors.red : colors.textPrimary}>{Number(date.slice(8))}</Text></View>
        <View style={styles.dots}>{requests.length > 0 ? <View style={[styles.dot, { backgroundColor: requests.some((request) => request.status === 'Confirmed') ? colors.blue : colors.amber }]} /> : <View style={styles.emptyDot} />}</View>
      </Pressable>;
    })}</View>

    <View style={styles.context}>
      <View style={styles.contextCopy}><Text variant="headline">{view === 'Week' ? 'Your week' : view === 'List' ? 'Next 14 days' : calendarDayLabel(selectedDate)}</Text><Text variant="footnote" color={colors.textSecondary}>{view === 'Day' ? `${dayRequests.length} ${dayRequests.length === 1 ? 'appointment' : 'appointments'} · ${closed ? 'Day off' : `${practiceTimeLabel(dayHours!.start)}–${practiceTimeLabel(dayHours!.end)}`}` : view === 'Week' ? weekLabel(week[0]!, week[6]!) : `From ${calendarDayLabel(selectedDate)}`}</Text></View>
      <Pressable accessibilityRole="button" accessibilityLabel="Manage working hours for the selected date" onPress={() => setEditing(true)} style={styles.hoursButton}><Feather name="clock" size={15} color={colors.blue} /><Text variant="footnote" color={colors.blue}>Hours</Text></Pressable>
    </View>
    {!practice.profile.acceptingRequests ? <View style={styles.paused}><Feather name="pause-circle" size={16} color={colors.amber} /><Text variant="footnote" color={colors.amber} style={styles.flex}>New requests are paused. Existing appointments still appear.</Text></View> : null}

    {view === 'List' ? <ScrollView style={styles.flex} contentContainerStyle={styles.agenda} showsVerticalScrollIndicator={false}>
      {agenda.length ? agenda.map((date) => <View key={date} style={styles.agendaSection}><Text variant="headline" color={date === practiceDemoDate ? colors.red : colors.textPrimary}>{date === practiceDemoDate ? 'Today' : calendarDayLabel(date)}</Text><View style={styles.agendaGroup}>{scheduleRequests(practice, date).map((request, index) => <AgendaRow key={request.id} request={request} bordered={index > 0} onPress={() => openAppointment(request.id)} />)}</View></View>) : <View style={styles.empty}><Feather name="calendar" size={30} color={colors.textSecondary} /><Text variant="title3">A little breathing room</Text><Text variant="callout" align="center" color={colors.textSecondary}>No appointments in these 14 days.</Text><Button title="Review requests" variant="secondary" size="md" onPress={() => router.push('/practice/requests')} /></View>}
      <Text variant="footnote" color={colors.textSecondary}>Demo calendar · Today is 25 September 2026</Text>
    </ScrollView> : <CalendarTimeline key={`${view}-${selectedDate}`} practice={practice} dates={view === 'Week' ? week : [selectedDate]} width={calendarWidth} onOpen={openAppointment} largeText={largeText} />}

    <View style={styles.legend}><LegendDot color={colors.blue} label="Confirmed" /><LegendDot color={colors.amber} label="Requested" /><Text variant="caption" color={colors.textSecondary}>Demo · 25 Sep</Text></View>
    <Sheet visible={monthOpen} onClose={() => setMonthOpen(false)} title="Choose a date">
      <View style={styles.monthNav}><Pressable accessibilityRole="button" accessibilityLabel="Previous month" onPress={() => setMonth(monthStep(month, -1))} style={styles.iconButton}><Feather name="chevron-left" size={23} color={colors.red} /></Pressable><Text variant="title3" style={styles.monthNavTitle}>{calendarMonthLabel(month)}</Text><Pressable accessibilityRole="button" accessibilityLabel="Next month" onPress={() => setMonth(monthStep(month, 1))} style={styles.iconButton}><Feather name="chevron-right" size={23} color={colors.red} /></Pressable></View>
      <View style={styles.monthGrid}>{weekdays.map((day) => <View key={day} style={styles.monthCell}><Text variant="caption" color={colors.textSecondary}>{day}</Text></View>)}{calendarMonthDays(month).map((date) => <Pressable key={date} accessibilityRole="button" accessibilityLabel={`Choose ${calendarDayLabel(date)}`} accessibilityState={{ selected: date === selectedDate }} onPress={() => selectDate(date)} style={styles.monthCell}><View style={[styles.dateCircle, date === selectedDate && styles.selectedDate]}><Text variant="headline" color={date === selectedDate ? colors.white : date.slice(0, 7) !== month.slice(0, 7) ? colors.textSecondary : date === practiceDemoDate ? colors.red : colors.textPrimary}>{Number(date.slice(8))}</Text></View><View style={[styles.dot, { opacity: scheduleRequests(practice, date).length ? 1 : 0, backgroundColor: colors.blue }]} /></Pressable>)}</View>
      <Button title="Back to today" variant="tertiary" onPress={() => selectDate(practiceDemoDate)} />
    </Sheet>
    <Sheet visible={editing} onClose={() => setEditing(false)} title="Availability">{editing ? <PracticeAvailabilityEditor initialDate={selectedDate} onDone={() => setEditing(false)} /> : null}</Sheet>
  </ScreenContainer>;
}

function LegendDot({ color, label }: { color: string; label: string }) { return <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: color }]} /><Text variant="caption" color={colors.textSecondary}>{label}</Text></View>; }

export function CalendarTimeline({ practice, dates, width, onOpen, largeText }: { practice: PracticeSnapshot; dates: string[]; width: number; onOpen: (id: string) => void; largeText: boolean }) {
  const scroll = useRef<ScrollView>(null);
  const headerScroll = useRef<ScrollView>(null);
  const initiallyFocused = useRef(false);
  const { startHour, endHour } = calendarBounds(practice, dates);
  const isWeek = dates.length > 1;
  const columnWidth = isWeek ? Math.max(100, (width - GUTTER) / 7) : width - GUTTER;
  const gridWidth = columnWidth * dates.length;
  const height = (endHour - startHour) * HOUR_HEIGHT;
  const hours = Array.from({ length: endHour - startHour + 1 }, (_, index) => startHour + index);
  const nowMinutes = 9 * 60; // The shared practice model deliberately uses a fixed demo clock.
  const firstEvent = dates.flatMap((date) => scheduleRequests(practice, date)).sort((a, b) => a.time.localeCompare(b.time))[0];
  const focusMinutes = dates.includes(practiceDemoDate) ? nowMinutes : firstEvent ? calendarMinutes(firstEvent.time) : calendarMinutes(practice.hours.find((day) => day.day === calendarWeekday(dates[0]!))?.start ?? '09:00');
  const focusY = Math.max(0, (focusMinutes / 60 - startHour - 0.5) * HOUR_HEIGHT);
  useEffect(() => { scroll.current?.scrollTo({ y: focusY, animated: false }); }, [focusY]);
  const grid = <View style={{ width: gridWidth, height: height + 15 }}>
          {hours.map((hour) => <View key={hour} pointerEvents="none" style={[styles.hourRow, { top: (hour - startHour) * HOUR_HEIGHT, width: gridWidth }]}><View style={styles.hourLine} /></View>)}
          <View style={[styles.columns, { left: 0, width: gridWidth, height }]}>{dates.map((date) => {
            const hoursForDate = practice.hours.find((day) => day.day === calendarWeekday(date));
            const isClosed = practice.blockedDates.includes(date) || !hoursForDate?.enabled;
            const openStart = isClosed ? 0 : Math.max(0, (calendarMinutes(hoursForDate!.start) / 60 - startHour) * HOUR_HEIGHT);
            const openEnd = isClosed ? height : Math.min(height, (calendarMinutes(hoursForDate!.end) / 60 - startHour) * HOUR_HEIGHT);
            const events = layoutCalendarEvents(scheduleRequests(practice, date));
            return <View key={date} style={[styles.dayColumn, { width: columnWidth, height }]}>
              {isClosed ? <View pointerEvents="none" style={[styles.closedShade, { top: 0, height }]}><Text variant="footnote" color={colors.textSecondary} style={styles.closedLabel}>Day off</Text></View> : <><View pointerEvents="none" style={[styles.closedShade, { top: 0, height: openStart }]} /><View pointerEvents="none" style={[styles.closedShade, { top: openEnd, height: height - openEnd }]} /></>}
              {!events.length && !isClosed && !isWeek ? <View pointerEvents="none" style={[styles.emptyDay, { top: openStart + 22 }]}><Text variant="headline" color={colors.textSecondary}>No appointments</Text><Text variant="footnote" color={colors.textSecondary}>Your working hours are open.</Text></View> : null}
              {events.map(({ request, column, columns, startMinutes, endMinutes }) => {
                const tone = appearance(request);
                const eventHeight = (endMinutes - startMinutes) / 60 * HOUR_HEIGHT;
                const compact = isWeek || columns > 1 || eventHeight < 66;
                return <Pressable key={request.id} accessibilityRole="button" accessibilityLabel={requestLabel(request)} onPress={() => onOpen(request.id)} style={({ pressed }) => [styles.event, { top: (startMinutes / 60 - startHour) * HOUR_HEIGHT + 1, left: column / columns * columnWidth + 3, width: columnWidth / columns - 6, height: Math.max(22, eventHeight - 2), backgroundColor: tone.tint, borderLeftColor: tone.color }, request.status === 'Requested' && styles.requestedEvent, pressed && styles.pressed]}>
                  <Text variant={compact ? 'footnote' : 'headline'} maxFontSizeMultiplier={1.25} numberOfLines={1} color={tone.color} style={styles.eventTitle}>{isWeek ? request.recipientName.split(' ')[0] : request.recipientName}</Text>
                  {eventHeight >= 44 ? <Text variant="caption" maxFontSizeMultiplier={1.2} numberOfLines={1} color={tone.color}>{request.status === 'Requested' ? 'Requested · ' : ''}{compact ? request.serviceName : `${practiceTimeLabel(request.time)} · ${request.mode}`}</Text> : null}
                  {!compact && !largeText ? <Text variant="footnote" numberOfLines={1} color={tone.color}>{request.serviceName}</Text> : null}
                </Pressable>;
              })}
              {date === practiceDemoDate && nowMinutes >= startHour * 60 && nowMinutes <= endHour * 60 ? <View pointerEvents="none" style={[styles.nowLine, { top: (nowMinutes / 60 - startHour) * HOUR_HEIGHT }]}><View style={styles.nowDot} /><View style={styles.nowRule} /><Text maxFontSizeMultiplier={1.2} style={styles.nowText}>9:00</Text></View> : null}
            </View>;
          })}</View>
        </View>;

  return <View style={styles.timelineContainer}>
    {isWeek ? <View style={styles.timelineWeekLabels}>
      <View style={styles.timeGutter} />
      <ScrollView ref={headerScroll} horizontal scrollEnabled={false} showsHorizontalScrollIndicator={false} style={styles.timelineHorizontal} contentContainerStyle={styles.weekHeaderContent}>
        {dates.map((date) => <View key={date} style={[styles.timelineWeekDay, { width: columnWidth }]}><Text variant="footnote" color={date === practiceDemoDate ? colors.red : colors.textSecondary}>{weekdays[(calendarWeekday(date) + 6) % 7]} {Number(date.slice(8))}</Text></View>)}
      </ScrollView>
    </View> : null}
    <ScrollView ref={scroll} style={styles.timelineScroll} contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false} nestedScrollEnabled onContentSizeChange={() => {
      if (!initiallyFocused.current) { scroll.current?.scrollTo({ y: focusY, animated: false }); initiallyFocused.current = true; }
    }}>
      <View style={styles.timelineBody}>
        <View pointerEvents="none" style={[styles.timeGutter, { height: height + 15 }]}>
          {hours.map((hour) => <View key={hour} style={[styles.hourRow, { top: (hour - startHour) * HOUR_HEIGHT }]}><Text maxFontSizeMultiplier={1.2} style={styles.hourLabel} color={colors.textSecondary}>{hourLabel(hour)}</Text></View>)}
        </View>
        {isWeek ? <ScrollView horizontal style={styles.timelineHorizontal} showsHorizontalScrollIndicator nestedScrollEnabled scrollEventThrottle={16} onScroll={({ nativeEvent }) => headerScroll.current?.scrollTo({ x: nativeEvent.contentOffset.x, animated: false })}>{grid}</ScrollView> : grid}
      </View>
      {isWeek && gridWidth + GUTTER > width ? <Text variant="caption" color={colors.textSecondary} align="center" style={{ marginTop: 12 }}>Swipe across to see the whole week</Text> : null}
    </ScrollView>
  </View>;
}

function AgendaRow({ request, bordered, onPress }: { request: PracticeRequest; bordered: boolean; onPress: () => void }) {
  const tone = appearance(request);
  return <Pressable accessibilityRole="button" accessibilityLabel={requestLabel(request)} onPress={onPress} style={({ pressed }) => [styles.agendaRow, bordered && styles.rowBorder, pressed && styles.pressed]}><View style={styles.agendaTime}><Text variant="subhead">{practiceTimeLabel(request.time)}</Text><Text variant="caption" color={colors.textSecondary}>{request.durationMinutes} min</Text></View><View style={[styles.eventBar, { backgroundColor: tone.color }]} /><View style={styles.flex}><Text variant="headline">{request.recipientName}</Text><Text variant="subhead" color={colors.textSecondary}>{request.serviceName}</Text><Text variant="footnote" color={tone.color}>{request.status} · {request.mode}</Text></View><Feather name="chevron-right" size={16} color={colors.textSecondary} /></Pressable>;
}

const styles = StyleSheet.create({
  root: { flex: 1 }, flex: { flex: 1, minWidth: 0 }, wrap: { flexWrap: 'wrap' },
  toolbar: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12, gap: 12 }, topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  monthButton: { flexDirection: 'row', alignItems: 'center', gap: 7, minHeight: 58, flexShrink: 1 }, monthTitle: { fontSize: 29, lineHeight: 35, letterSpacing: -0.6 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 7 }, todayButton: { minHeight: 44, paddingHorizontal: 12, justifyContent: 'center', backgroundColor: colors.surface, borderRadius: 22 }, iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22 },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }, segmented: { flexDirection: 'row', padding: 3, borderRadius: 13, backgroundColor: colors.surfaceMuted, flex: 1, maxWidth: 300 }, segment: { flex: 1, minHeight: 44, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center', borderRadius: 10 }, activeSegment: { backgroundColor: colors.surface, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }, arrows: { flexDirection: 'row' },
  weekStrip: { flexDirection: 'row', paddingHorizontal: 12, paddingTop: 12, paddingBottom: 8, backgroundColor: colors.surface, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  weekDay: { flex: 1, alignItems: 'center', gap: 3, minHeight: 76 }, weekdayLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 0.3 }, dateCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }, selectedDate: { backgroundColor: colors.red }, dots: { height: 8, justifyContent: 'center' }, dot: { width: 5, height: 5, borderRadius: 3 }, emptyDot: { width: 5, height: 5 },
  context: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingHorizontal: 20, paddingVertical: 12, backgroundColor: colors.surface }, contextCopy: { flex: 1, gap: 3 }, hoursButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 5 },
  paused: { flexDirection: 'row', gap: 7, alignItems: 'center', paddingHorizontal: 20, paddingVertical: 8, backgroundColor: colors.amberTint },
  timelineContainer: { flex: 1, minHeight: 0, backgroundColor: colors.surface }, timelineScroll: { flex: 1, backgroundColor: colors.surface }, timelineBody: { flexDirection: 'row', marginTop: 10 }, timeGutter: { width: GUTTER, flexShrink: 0 }, timelineHorizontal: { flex: 1, minWidth: 0 }, timelineWeekLabels: { flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }, weekHeaderContent: { flexDirection: 'row' }, timelineWeekDay: { alignItems: 'center', paddingVertical: 9 },
  hourRow: { position: 'absolute', flexDirection: 'row', alignItems: 'center' }, hourLabel: { width: GUTTER, textAlign: 'center', fontSize: 10, lineHeight: 13, marginTop: -7 }, hourLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  columns: { position: 'absolute', top: 0, flexDirection: 'row' }, dayColumn: { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: colors.border }, closedShade: { position: 'absolute', left: 0, right: 0, backgroundColor: 'rgba(232,225,214,0.35)' }, closedLabel: { marginTop: 24, textAlign: 'center' }, emptyDay: { position: 'absolute', left: 18, right: 12, gap: 4 },
  event: { position: 'absolute', borderRadius: 7, borderLeftWidth: 3, paddingHorizontal: 8, paddingVertical: 3, overflow: 'hidden', gap: 1 }, eventTitle: { fontWeight: '600' }, requestedEvent: { borderTopWidth: 1, borderRightWidth: 1, borderBottomWidth: 1, borderColor: 'rgba(156,87,0,0.32)', borderStyle: 'dashed' },
  nowLine: { position: 'absolute', left: -4, right: 0, flexDirection: 'row', alignItems: 'center', zIndex: 2 }, nowDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.red }, nowRule: { flex: 1, height: 1.5, backgroundColor: colors.red }, nowText: { fontSize: 10, lineHeight: 14, color: colors.red, paddingHorizontal: 4, backgroundColor: colors.surface },
  legend: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 9, gap: 8, backgroundColor: colors.surface, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }, legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  agenda: { padding: 20, gap: 23 }, agendaSection: { gap: 10 }, agendaGroup: { borderRadius: 16, overflow: 'hidden', backgroundColor: colors.surface }, agendaRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 96, padding: 14 }, agendaTime: { width: 70, gap: 3 }, eventBar: { width: 3, alignSelf: 'stretch', borderRadius: 2 }, rowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }, empty: { gap: 12, alignItems: 'center', paddingVertical: 35 },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }, monthNavTitle: { flex: 1, minWidth: 0, textAlign: 'center' }, monthGrid: { flexDirection: 'row', flexWrap: 'wrap' }, monthCell: { width: '14.285714%', minHeight: 48, alignItems: 'center', justifyContent: 'center', gap: 2 }, pressed: { opacity: 0.65 },
});
