import { useCallback, useRef } from 'react';
import { KeyInfo, formatFingerprint, getExpiryStatus } from '../utils/pgp';
import { KeyExpiryWarning } from './KeyExpiryWarning';
import { DropZone } from './DropZone';

interface KeyInputProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  keyInfo: KeyInfo | null;
  error: string | null;
  keyType: 'public' | 'private';
  id: string;
}

export function KeyInput({
  label,
  placeholder,
  value,
  onChange,
  onBlur,
  keyInfo,
  error,
  keyType,
  id,
}: KeyInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        onChange(content);
      };
      reader.readAsText(file);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [onChange]
  );

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
      </label>

      <DropZone onDrop={onChange} hint={`Drop ${keyType} key file`}>
        <textarea
          id={id}
          className={`w-full h-40 px-4 py-3 font-mono text-sm border rounded-xl resize-none focus:outline-none focus:ring-2 transition-all duration-200 ${
            error
              ? 'border-error/50 focus:ring-error/20 focus:border-error bg-error/5'
              : 'border-gray-300 focus:ring-primary/20 focus:border-primary bg-white hover:border-gray-400'
          }`}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          spellCheck={false}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : keyInfo ? `${id}-info` : undefined}
        />
      </DropZone>

      {/* File upload button */}
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept=".asc,.gpg,.key,.pgp,.txt"
          onChange={handleFileUpload}
          className="hidden"
          aria-label={`Upload ${keyType} key file`}
        />
        <button
          type="button"
          onClick={handleUploadClick}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-secondary hover:text-primary border border-gray-300 rounded-lg hover:border-primary hover:bg-gray-50 transition-all duration-200 group"
        >
          <svg
            className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
            />
          </svg>
          Upload Key File
        </button>
      </div>

      {/* Error message */}
      {error && (
        <p id={`${id}-error`} className="text-sm text-error" role="alert">
          {error}
        </p>
      )}

      {/* Key info display */}
      {keyInfo && !error && (
        <div
          id={`${id}-info`}
          className="bg-gradient-to-br from-success/5 to-success/10 border border-success/20 rounded-xl p-4 text-sm animate-fade-in"
        >
          <div className="flex items-center gap-2 text-success mb-2">
            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-success/10 flex items-center justify-center">
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <span className="font-semibold">Valid {keyType} key detected</span>
          </div>
          {keyInfo.userIds.length > 0 && (
            <p className="text-gray-600">
              <span className="font-medium">Identity:</span> {keyInfo.userIds[0]}
            </p>
          )}
          <p className="text-gray-600 font-mono text-xs mt-1">
            <span className="font-sans font-medium">Fingerprint:</span>{' '}
            {formatFingerprint(keyInfo.fingerprint)}
          </p>
          {keyType === 'private' && keyInfo.isEncrypted && (
            <p className="text-warning mt-2 flex items-center gap-1">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m0 0v2m0-2h2m-2 0H9m3-2a3 3 0 100-6 3 3 0 000 6z"
                />
              </svg>
              This key is passphrase-protected
            </p>
          )}
          <KeyExpiryWarning
            expirationDate={keyInfo.expirationDate}
            status={getExpiryStatus(keyInfo.expirationDate)}
            keyType={keyType}
          />
        </div>
      )}
    </div>
  );
}
