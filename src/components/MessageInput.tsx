import { useState } from 'react';
import { DropZone } from './DropZone';
import { FileUploadButton } from './FileUploadButton';
import { UploadIcon } from './ui/icons';

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
  const [uploadError, setUploadError] = useState<string | null>(null);

  const displayError = error ?? uploadError;

  const textarea = (
    <textarea
      id={id}
      className={`w-full px-4 py-3 text-sm border rounded-xl resize-none focus:outline-none focus:ring-2 transition-all duration-200 ${
        displayError
          ? 'border-error/50 focus:ring-error/20 focus:border-error bg-error/5'
          : 'border-gray-300 focus:ring-primary/20 focus:border-primary bg-white hover:border-gray-400'
      }`}
      placeholder={placeholder}
      value={value}
      onChange={(e) => {
        setUploadError(null);
        onChange(e.target.value);
      }}
      rows={rows}
      spellCheck={false}
      aria-invalid={!!displayError}
      aria-describedby={displayError ? `${id}-error` : undefined}
    />
  );

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
      </label>

      {allowFileUpload ? (
        <DropZone onDrop={onChange} hint="Drop file here">
          {textarea}
        </DropZone>
      ) : (
        textarea
      )}

      {/* File upload button */}
      {allowFileUpload && (
        <FileUploadButton
          accept={fileAccept}
          onLoad={onChange}
          onError={setUploadError}
          ariaLabel="Upload file"
          icon={<UploadIcon className="w-4 h-4" />}
        >
          Upload .asc File
        </FileUploadButton>
      )}

      {/* Error message */}
      {displayError && (
        <p id={`${id}-error`} className="text-sm text-error" role="alert">
          {displayError}
        </p>
      )}
    </div>
  );
}
