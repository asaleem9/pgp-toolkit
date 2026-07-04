import { ButtonHTMLAttributes, ReactNode } from 'react';
import { SpinnerIcon } from './icons';

type ButtonVariant = 'primary' | 'outline' | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
  loadingText?: string;
  icon?: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-xl hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.985]',
  outline:
    'inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-secondary border border-gray-300 rounded-lg hover:border-primary hover:text-primary hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200 active:scale-[0.97] group',
  ghost:
    'text-sm font-medium text-secondary hover:text-primary transition-colors',
};

export function Button({
  variant = 'primary',
  loading = false,
  loadingText,
  icon,
  type = 'button',
  className = '',
  disabled,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`${variantClasses[variant]} ${className}`.trim()}
      {...rest}
    >
      {loading ? (
        <>
          <SpinnerIcon />
          {loadingText}
        </>
      ) : (
        <>
          {icon}
          {children}
        </>
      )}
    </button>
  );
}
