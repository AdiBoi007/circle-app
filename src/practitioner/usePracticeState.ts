import { useCallback, useRef, useState } from 'react';
import { applyPracticeAction, initialPractice, type PracticeAction } from './model';
import type { PracticeActor, PracticeStore } from './types';

export function usePracticeState(actor: PracticeActor): PracticeStore {
  const [practice, setPractice] = useState(initialPractice);
  const current = useRef(practice);
  const sequence = useRef(0);
  const resetPractice = useCallback(() => { const next = initialPractice(); current.current = next; setPractice(next); }, []);
  const apply = (action: PracticeAction) => {
    const transition = applyPracticeAction(current.current, actor, action);
    if (transition.result.ok && transition.state !== current.current) {
      current.current = transition.state;
      setPractice(transition.state);
    }
    return transition.result;
  };
  return {
    practice,
    savePracticeProfile: (profile) => apply({ type: 'profile', profile }),
    savePracticeService: (service) => apply({ type: 'service', service }),
    removePracticeService: (id) => apply({ type: 'remove-service', id }),
    savePracticeHours: (hours) => apply({ type: 'hours', hours }),
    togglePracticeBlockedDate: (date) => apply({ type: 'blocked-date', date }),
    requestPracticeAppointment: (input) => apply({ type: 'request', input, id: `practice-${Date.now()}-${++sequence.current}` }),
    confirmPracticeRequest: (id, sessionDetails) => apply({ type: 'confirm', id, sessionDetails }),
    declinePracticeRequest: (id, reason) => apply({ type: 'decline', id, reason }),
    cancelPracticeRequest: (id, reason) => apply({ type: 'cancel', id, reason }),
    completePracticeRequest: (id) => apply({ type: 'complete', id }),
    resetPractice,
  };
}
