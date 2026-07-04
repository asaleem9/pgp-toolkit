import { ReactNode } from 'react';

type CardTone = 'default' | 'success' | 'error' | 'info';

interface CardProps {
  tone?: CardTone;
  className?: string;
  children: ReactNode;
}

const toneClasses: Record<CardTone, string> = {
  default:
    'bg-white/90 backdrop-blur-sm rounded-2xl shadow-soft border border-gray-200/50 p-6 hover:shadow-lg transition-shadow duration-300',
  success:
    'bg-gradient-to-br from-success/5 to-success/10 backdrop-blur-sm rounded-2xl shadow-soft border border-success/20 p-6',
  error:
    'bg-gradient-to-br from-error/5 to-error/10 backdrop-blur-sm rounded-2xl shadow-soft border border-error/20 p-6',
  info:
    'bg-gradient-to-br from-primary/5 to-primary/10 backdrop-blur-sm rounded-2xl shadow-soft border border-primary/20 p-6',
};

export function Card({ tone = 'default', className = '', children }: CardProps) {
  return <div className={`${toneClasses[tone]} ${className}`.trim()}>{children}</div>;
}
