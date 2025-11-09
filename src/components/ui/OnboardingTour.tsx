import React from 'react';
import type { OnboardingStep } from '@/hooks/useOnboarding';

type Props = {
  isOpen: boolean;
  stepIndex: number;
  steps: OnboardingStep[];
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onComplete: () => void;
};

export default function OnboardingTour(props: Props) {
  if (!props.isOpen) return null;
  const step = props.steps[props.stepIndex];
  const isLast = props.stepIndex === props.steps.length - 1;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-lg bg-white dark:bg-neutral-900 shadow-2xl ring-1 ring-black/10 dark:ring-white/10">
          <div className="px-6 py-5">
            <div className="mb-1 text-xs uppercase tracking-wide text-neutral-500">Tour Noxus</div>
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">{step.title}</h2>
            <p className="mt-2 text-neutral-700 dark:text-neutral-300">{step.description}</p>
          </div>

          <div className="flex items-center justify-between border-t border-neutral-200 dark:border-neutral-800 px-6 py-4">
            <button
              className="text-sm text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
              onClick={props.onSkip}
            >
              Pular
            </button>
            <div className="flex gap-2">
              <button
                className="rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-1.5 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-50"
                onClick={props.onPrev}
                disabled={props.stepIndex === 0}
              >
                Voltar
              </button>
              {isLast ? (
                <button
                  className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
                  onClick={props.onComplete}
                >
                  Concluir
                </button>
              ) : (
                <button
                  className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
                  onClick={props.onNext}
                >
                  Próximo
                </button>
              )}
            </div>
          </div>

          <div className="px-6 pb-4 text-xs text-neutral-500">
            Etapa {props.stepIndex + 1} de {props.steps.length}
          </div>
        </div>
      </div>
    </div>
  );
}