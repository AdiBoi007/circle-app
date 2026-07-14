import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import { goals as seedGoals, medications as seedMedications, notifications as seedNotifications, records as seedRecords, todayItems } from '@/data';
import type { AppNotification, Booking, DemoAccountId, FamilyLog, Goal, HealthRecord, Medication, MemberId, PersonalAccountPreferences, TodayItem } from '@/types';

const seedBookings: Booking[] = [
  { id: 'physio-savita', providerId: 'arvind-nair', memberId: 'savita', service: 'Home physiotherapy', date: '14 July 2026', time: '10:00 am', mode: 'Home visit', status: 'Confirmed' },
  { id: 'yoga-neha', providerId: 'ananya-sen', memberId: 'neha', service: 'Yoga introduction', date: '15 July 2026', time: '7:30 am', mode: 'Online', status: 'Confirmed' },
  { id: 'diet-rajiv', providerId: 'rhea-malhotra', memberId: 'rajiv', service: 'Dietitian consultation', date: '16 July 2026', time: '6:30 pm', mode: 'Online', status: 'Confirmed' },
  { id: 'trainer-arjun', providerId: 'kabir-sethi', memberId: 'arjun', service: 'Trainer introduction', date: '18 July 2026', time: '8:00 am', mode: 'Online', status: 'Confirmed' },
  { id: 'sleep-arjun', providerId: 'tara-menon', memberId: 'arjun', service: 'Sleep routine review', date: '21 July 2026', time: '7:00 pm', mode: 'Online', status: 'Confirmed', note: 'Bring the last two weeks of sleep trends.' },
  { id: 'nurse-rajiv', providerId: 'amanpreet-kaur', memberId: 'rajiv', service: 'Diabetes education follow-up', date: '23 July 2026', time: '5:30 pm', mode: 'Online', status: 'Confirmed' },
  { id: 'physio-savita-assessment', providerId: 'arvind-nair', memberId: 'savita', service: 'Mobility assessment', date: '2 July 2026', time: '10:00 am', mode: 'Home visit', status: 'Completed' },
  { id: 'nutrition-neha-complete', providerId: 'maya-iyer', memberId: 'neha', service: 'Thyroid nutrition review', date: '28 June 2026', time: '6:00 pm', mode: 'Online', status: 'Completed' },
  { id: 'wellness-arjun-complete', providerId: 'olivia-reed', memberId: 'arjun', service: 'Student wellbeing check-in', date: '20 June 2026', time: '11:00 am', mode: 'Online', status: 'Completed' },
  { id: 'yoga-savita-cancelled', providerId: 'kavita-joshi', memberId: 'savita', service: 'Chair yoga introduction', date: '5 July 2026', time: '9:00 am', mode: 'Online', status: 'Cancelled', note: 'Rescheduled while the physiotherapy plan is established.' },
];

const seedPersonalPreferences: PersonalAccountPreferences = {
  largerText: true,
  readAloud: false,
  reduceMotion: false,
  highContrast: true,
  medicineNotifications: true,
  appointmentNotifications: true,
  careNotifications: true,
};

type State = {
  activeAccountId: DemoAccountId;
  personalPreferences: PersonalAccountPreferences;
  tasks: TodayItem[];
  goals: Goal[];
  records: HealthRecord[];
  medications: Medication[];
  notifications: AppNotification[];
  bookings: Booking[];
  savedProviders: string[];
  takenMedicationIds: string[];
  aiHistoryKey: number;
  familyLogs: FamilyLog[];
  setActiveAccountId: (id: DemoAccountId) => void;
  updatePersonalPreference: (key: keyof PersonalAccountPreferences, value: boolean) => void;
  toggleTask: (id: string) => void;
  rescheduleTask: (id: string, time: string) => void;
  addTask: (task: TodayItem) => void;
  updateGoal: (id: string, value: number) => void;
  replaceGoal: (id: string, title: string) => void;
  addRecord: (record: HealthRecord) => void;
  deleteRecord: (id: string) => void;
  markNotification: (id: string) => void;
  addNotification: (notification: AppNotification) => void;
  markAllRead: () => void;
  toggleSavedProvider: (id: string) => void;
  addBooking: (booking: Booking) => void;
  updateBooking: (id: string, update: Partial<Booking>) => void;
  toggleMedication: (id: string) => void;
  addMedication: (medication: Medication) => void;
  updateMedication: (id: string, update: Partial<Medication>) => void;
  clearAiHistory: () => void;
  addFamilyLog: (log: FamilyLog) => void;
  resetDemo: () => void;
};

const AppContext = createContext<State | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [activeAccountId, setActiveAccount] = useState<DemoAccountId>('arjun');
  const [personalPreferences, setPersonalPreferences] = useState<PersonalAccountPreferences>(seedPersonalPreferences);
  const [tasks, setTasks] = useState(todayItems);
  const [goals, setGoals] = useState(seedGoals);
  const [records, setRecords] = useState(seedRecords);
  const [medications, setMedications] = useState(seedMedications);
  const [notifications, setNotifications] = useState(seedNotifications);
  const [bookings, setBookings] = useState(seedBookings);
  const [savedProviders, setSavedProviders] = useState<string[]>(['rhea-malhotra', 'arvind-nair']);
  const [takenMedicationIds, setTakenMedicationIds] = useState<string[]>(['neha-levothyroxine']);
  const [aiHistoryKey, setAiHistoryKey] = useState(0);
  const [familyLogs, setFamilyLogs] = useState<FamilyLog[]>([]);

  const setActiveAccountId = useCallback((id: DemoAccountId) => setActiveAccount(id), []);
  const updatePersonalPreference = useCallback((key: keyof PersonalAccountPreferences, value: boolean) => {
    setPersonalPreferences((current) => ({ ...current, [key]: value }));
  }, []);

  const toggleTask = useCallback((id: string) => setTasks((items) => items.map((item) => item.id === id ? { ...item, completed: !item.completed } : item)), []);
  const rescheduleTask = useCallback((id: string, time: string) => setTasks((items) => items.map((item) => item.id === id ? { ...item, time, date: 'Tomorrow' } : item)), []);
  const addTask = useCallback((task: TodayItem) => setTasks((items) => [task, ...items]), []);
  const updateGoal = useCallback((id: string, value: number) => setGoals((items) => items.map((item) => item.id === id ? { ...item, current: Math.max(0, Math.min(value, item.target)), caption: `${Math.max(0, Math.min(value, item.target))} of ${item.target} ${item.unit}` } : item)), []);
  const replaceGoal = useCallback((id: string, title: string) => setGoals((items) => { const old = items.find((item) => item.id === id); if (!old) return items; return [...items.map((item) => item.id === id ? { ...item, active: false } : item), { ...old, id: `${id}-replacement`, title, current: 0, caption: `0 of ${old.target} ${old.unit}`, active: true }]; }), []);
  const addRecord = useCallback((record: HealthRecord) => setRecords((items) => [record, ...items]), []);
  const deleteRecord = useCallback((id: string) => setRecords((items) => items.filter((item) => item.id !== id)), []);
  const markNotification = useCallback((id: string) => setNotifications((items) => items.map((item) => item.id === id ? { ...item, read: true } : item)), []);
  const addNotification = useCallback((notification: AppNotification) => setNotifications((items) => [notification, ...items]), []);
  const markAllRead = useCallback(() => setNotifications((items) => items.map((item) => ({ ...item, read: true }))), []);
  const toggleSavedProvider = useCallback((id: string) => setSavedProviders((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id]), []);
  const addBooking = useCallback((booking: Booking) => setBookings((items) => [booking, ...items]), []);
  const updateBooking = useCallback((id: string, update: Partial<Booking>) => setBookings((items) => items.map((item) => item.id === id ? { ...item, ...update } : item)), []);
  const toggleMedication = useCallback((id: string) => setTakenMedicationIds((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id]), []);
  const addMedication = useCallback((medication: Medication) => setMedications((items) => [medication, ...items]), []);
  const updateMedication = useCallback((id: string, update: Partial<Medication>) => setMedications((items) => items.map((item) => item.id === id ? { ...item, ...update } : item)), []);
  const clearAiHistory = useCallback(() => setAiHistoryKey((key) => key + 1), []);
  const addFamilyLog = useCallback((log: FamilyLog) => setFamilyLogs((items) => [log, ...items]), []);
  const resetDemo = useCallback(() => {
    setTasks(todayItems); setGoals(seedGoals); setRecords(seedRecords); setMedications(seedMedications); setNotifications(seedNotifications);
    setBookings(seedBookings); setSavedProviders(['rhea-malhotra', 'arvind-nair']); setTakenMedicationIds(['neha-levothyroxine']); setFamilyLogs([]); setPersonalPreferences(seedPersonalPreferences); setActiveAccount('arjun'); setAiHistoryKey((key) => key + 1);
  }, []);

  const value = useMemo<State>(() => ({ activeAccountId, personalPreferences, tasks, goals, records, medications, notifications, bookings, savedProviders, takenMedicationIds, aiHistoryKey, familyLogs, setActiveAccountId, updatePersonalPreference, toggleTask, rescheduleTask, addTask, updateGoal, replaceGoal, addRecord, deleteRecord, markNotification, addNotification, markAllRead, toggleSavedProvider, addBooking, updateBooking, toggleMedication, addMedication, updateMedication, clearAiHistory, addFamilyLog, resetDemo }), [activeAccountId, personalPreferences, tasks, goals, records, medications, notifications, bookings, savedProviders, takenMedicationIds, aiHistoryKey, familyLogs, setActiveAccountId, updatePersonalPreference, toggleTask, rescheduleTask, addTask, updateGoal, replaceGoal, addRecord, deleteRecord, markNotification, addNotification, markAllRead, toggleSavedProvider, addBooking, updateBooking, toggleMedication, addMedication, updateMedication, clearAiHistory, addFamilyLog, resetDemo]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppState(): State {
  const state = useContext(AppContext);
  if (!state) throw new Error('useAppState must be used inside AppStateProvider');
  return state;
}

export function memberName(id: MemberId): string { return ({ arjun: 'Arjun', rajiv: 'Rajiv', neha: 'Neha', savita: 'Savita' })[id]; }
