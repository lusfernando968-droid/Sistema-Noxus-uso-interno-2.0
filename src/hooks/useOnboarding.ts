import { useCallback, useEffect, useMemo, useState } from 'react';

export type OnboardingStep = { title: string; description: string };

const STORAGE_KEY = 'noxus:onboarding:completed';

export function useOnboarding(initialSteps: OnboardingStep[]) {
  const [isOpen, setIsOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const steps = useMemo(() => initialSteps, [initialSteps]);

  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY) === 'true';
    if (!completed) {
      setIsOpen(true);
    }
  }, []);

  const start = useCallback(() => {
    setStepIndex(0);
    setIsOpen(true);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const next = useCallback(() => {
    setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  }, [steps.length]);

  const prev = useCallback(() => {
    setStepIndex((i) => Math.max(i - 1, 0));
  }, []);

  const skip = useCallback(() => {
    setIsOpen(false);
    localStorage.setItem(STORAGE_KEY, 'true');
  }, []);

  const complete = useCallback(() => {
    setIsOpen(false);
    localStorage.setItem(STORAGE_KEY, 'true');
  }, []);

  return { isOpen, stepIndex, steps, start, next, prev, skip, complete };
}