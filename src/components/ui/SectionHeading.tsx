import { ReactNode } from 'react';

interface SectionHeadingProps {
  className?: string;
  children: ReactNode;
}

export function SectionHeading({ className = 'mb-6', children }: SectionHeadingProps) {
  return (
    <h2 className={`font-display text-xl font-semibold text-gray-900 flex items-center gap-2 ${className}`.trim()}>
      <span className="w-1 h-6 bg-gradient-to-b from-primary-500 to-primary-600 rounded-full" aria-hidden="true" />
      {children}
    </h2>
  );
}
