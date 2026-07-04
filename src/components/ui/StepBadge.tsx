import { ReactNode } from 'react';
import { CheckIcon, XIcon } from './icons';

type StepTone = 'primary' | 'success' | 'error';

interface StepBadgeProps {
  /** Step number (or any glyph). Omit to show a check/cross for result tones. */
  step?: ReactNode;
  tone?: StepTone;
  /** Extra hint rendered after the label, e.g. "(Recommended)" */
  hint?: ReactNode;
  children: ReactNode;
}

const toneClasses: Record<StepTone, string> = {
  primary: 'bg-gradient-to-br from-primary-500 to-primary-600',
  success: 'bg-gradient-to-br from-success to-success/90',
  error: 'bg-gradient-to-br from-error to-error/90',
};

export function StepBadge({ step, tone = 'primary', hint, children }: StepBadgeProps) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span
        className={`flex items-center justify-center w-8 h-8 rounded-xl text-white text-sm font-semibold shadow-md ${toneClasses[tone]}`}
      >
        {step ?? (tone === 'error' ? <XIcon className="w-5 h-5" /> : <CheckIcon className="w-5 h-5" />)}
      </span>
      <span className="text-sm font-semibold text-gray-900">{children}</span>
      {hint && <span className="text-xs text-secondary">{hint}</span>}
    </div>
  );
}
