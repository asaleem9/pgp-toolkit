import { useState } from 'react';
import { EyeIcon, EyeOffIcon } from './ui/icons';

interface PassphraseInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hasError?: boolean;
  className?: string;
}

/**
 * Password input with a show/hide toggle. Defaults to hidden and carries the
 * password-manager suppression attributes used across the app.
 */
export function PassphraseInput({
  id,
  value,
  onChange,
  placeholder = 'Enter your passphrase',
  hasError = false,
  className = '',
}: PassphraseInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={`relative ${className}`.trim()}>
      <input
        type={visible ? 'text' : 'password'}
        id={id}
        className={`w-full px-4 py-2.5 pr-10 border rounded-xl focus:outline-none focus:ring-2 transition-colors ${
          hasError
            ? 'border-error focus:ring-error/20 focus:border-error'
            : 'border-gray-300 focus:ring-primary/20 focus:border-primary'
        }`}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="off"
        data-1p-ignore="true"
        data-lpignore="true"
        data-form-type="other"
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide passphrase' : 'Show passphrase'}
        aria-pressed={visible}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-secondary hover:text-primary transition-colors"
      >
        {visible ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
      </button>
    </div>
  );
}
