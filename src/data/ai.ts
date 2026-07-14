import type { SuggestedPrompt } from '@/types';

/** Short, calm description of what Circle AI does (no medical advice claims). */
export const aiIntro =
  'Circle AI helps you understand your family’s health in plain language and points you toward the right care professional. It never replaces a clinician.';

/** Starter prompt chips shown in the empty conversation state. */
export const suggestedPrompts: SuggestedPrompt[] = [
  { id: 'p1', text: 'Compare Dad’s latest glucose report', icon: 'bar-chart-2' },
  { id: 'p2', text: 'Summarise today for my family', icon: 'sun' },
  { id: 'p3', text: 'Find Dad a Hindi-speaking diabetes dietitian under ₹1,200', icon: 'search' },
  { id: 'p4', text: 'What are everyone’s monthly goals?', icon: 'compass' },
];
