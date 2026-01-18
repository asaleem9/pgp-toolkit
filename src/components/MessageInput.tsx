import { useCallback, useRef } from 'react';
import { DropZone } from './DropZone';

interface MessageInputProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  error: string | null;
  id: string;
  rows?: number;
  allowFileUpload?: boolean;
  fileAccept?: string;
}

export function MessageInput({
  label,
  placeholder,
  value,
  onChange,
  error,
  id,
  rows = 6,
  allowFileUpload = false,
  fileAccept = '.asc,.gpg,.txt',
}: MessageInputProps) {
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

      {allowFileUpload ? (
        <DropZone onDrop={onChange} hint="Drop file here">
          <textarea
            id={id}
            className={`w-full px-4 py-3 text-sm border rounded-xl resize-none focus:outline-none focus:ring-2 transition-all duration-200 ${
              error
                ? 'border-error/50 focus:ring-error/20 focus:border-error bg-error/5'
                : 'border-gray-300 focus:ring-primary/20 focus:border-primary bg-white hover:border-gray-400'
            }`}
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={rows}
            spellCheck={false}
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-error` : undefined}
          />
        </DropZone>
      ) : (
        <textarea
          id={id}
          className={`w-full px-4 py-3 text-sm border rounded-xl resize-none focus:outline-none focus:ring-2 transition-all duration-200 ${
            error
              ? 'border-error/50 focus:ring-error/20 focus:border-error bg-error/5'
              : 'border-gray-300 focus:ring-primary/20 focus:border-primary bg-white hover:border-gray-400'
          }`}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          spellCheck={false}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
        />
      )}

      {/* File upload button */}
      {allowFileUpload && (
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept={fileAccept}
            onChange={handleFileUpload}
            className="hidden"
            aria-label="Upload file"
          />
          <button
            type="button"
            onClick={handleUploadClick}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-secondary hover:text-primary border border-gray-300 rounded-md hover:border-primary transition-colors"
          >
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
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
            Upload .asc File
          </button>
        </div>
      )}

      {/* Error message */}
      {error && (
        <p id={`${id}-error`} className="text-sm text-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
