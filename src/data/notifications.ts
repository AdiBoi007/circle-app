import type { AppNotification } from '@/types';

export const notifications: AppNotification[] = [
  { id: 'n1', title: 'Evening blood pressure is due', body: 'Rajiv’s 7:30 pm reading is ready to log.', memberId: 'rajiv', time: 'Now', group: 'Today', read: false, href: '/tasks' },
  { id: 'n2', title: 'Mobility exercises are overdue', body: 'Savita’s gentle mobility session is still open.', memberId: 'savita', time: '36m', group: 'Today', read: false, href: '/tasks' },
  { id: 'n3', title: 'Physiotherapy confirmed', body: 'Savita’s home session is confirmed for 14 July at 10:00 am.', memberId: 'savita', time: '1h', group: 'Today', read: false, href: '/booking/physio-savita' },
  { id: 'n4', title: 'Morning medication complete', body: 'Neha marked her levothyroxine as taken.', memberId: 'neha', time: '4h', group: 'Today', read: true, href: '/medications' },
  { id: 'n5', title: 'Diabetes report is ready', body: 'Rajiv’s Comprehensive Diabetes Panel has been organised.', memberId: 'rajiv', time: '5h', group: 'Today', read: false, href: '/record/rajiv-diabetes-jul' },
  { id: 'n6', title: 'Sunday family check-in', body: 'Next check-in: Sunday, 19 July at 7:00 pm IST.', time: 'Yesterday', group: 'Earlier', read: true, href: '/goals' },
  { id: 'n7', title: 'Apple Health sync completed', body: 'Arjun’s latest activity, sleep and heart-rate data are available.', memberId: 'arjun', time: 'Yesterday', group: 'Earlier', read: true, href: '/member/arjun' },
  { id: 'n8', title: 'Appointment approaching', body: 'Neha’s online yoga introduction is on 15 July at 7:30 am.', memberId: 'neha', time: '2d', group: 'Earlier', read: false, href: '/care' },
  { id: 'n9', title: 'Dinner medication at 8:15 pm', body: 'Rajiv’s metformin and evening routine are coming up.', memberId: 'rajiv', time: '3h', group: 'Today', read: false, href: '/medications' },
  { id: 'n10', title: 'Knee pain improved by one point', body: 'Savita logged 6/10, down from her previous 7/10 check-in.', memberId: 'savita', time: 'Yesterday', group: 'Earlier', read: true, href: '/metric/savita/knee-pain' },
  { id: 'n11', title: 'Sleep was shorter last night', body: 'Arjun logged 6h 48m, fourteen minutes below the previous night.', memberId: 'arjun', time: 'Yesterday', group: 'Earlier', read: true, href: '/metric/arjun/sleep' },
  { id: 'n12', title: 'New thyroid report linked', body: 'Neha’s July panel is ready beside her March comparison.', memberId: 'neha', time: '2d', group: 'Earlier', read: false, href: '/record/neha-thyroid-jul' },
  { id: 'n13', title: 'Dietitian questions due Thursday', body: 'Add questions for Rajiv before his nutrition consultation.', memberId: 'rajiv', time: '2d', group: 'Earlier', read: true, href: '/tasks' },
  { id: 'n14', title: 'Family goal halfway complete', body: 'Two of four Sunday health check-ins are complete.', time: '3d', group: 'Earlier', read: true, href: '/goals' },
  { id: 'n15', title: 'Medical ID reviewed', body: 'Arjun checked Savita’s conditions, medicines and emergency contacts.', memberId: 'savita', time: '4d', group: 'Earlier', read: true, href: '/emergency' },
  { id: 'n16', title: 'Record vault now has a comparison', body: 'Rajiv’s April and July diabetes panels are linked.', memberId: 'rajiv', time: '5d', group: 'Earlier', read: true, href: '/records' },
];
