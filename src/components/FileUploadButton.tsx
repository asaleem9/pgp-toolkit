import { useCallback, useRef, ReactNode } from 'react';
import { MAX_MESSAGE_SIZE } from '../utils/validation';
import { Button } from './ui/Button';
import { UploadIcon } from './ui/icons';

interface FileUploadButtonProps {
  accept: string;
  onLoad: (content: string) => void;
  onError: (message: string | null) => void;
  ariaLabel: string;
  children: ReactNode;
  icon?: ReactNode;
}

/**
 * Hidden file input + outline button with the shared 1MB size guard.
 * Errors are reported through onError so the parent renders them in its
 * existing alert slot.
 */
export function FileUploadButton({
  accept,
  onLoad,
  onError,
  ariaLabel,
  children,
  icon,
}: FileUploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];

      // Reset file input so selecting the same file again re-triggers change
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      if (!file) return;

      if (file.size > MAX_MESSAGE_SIZE) {
        onError(
          `File is too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Maximum size is 1MB.`
        );
        return;
      }

      onError(null);
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        onLoad(content);
      };
      reader.onerror = () => {
        onError('Could not read the selected file.');
      };
      reader.readAsText(file);
    },
    [onLoad, onError]
  );

  return (
    <div className="flex items-center gap-2">
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileUpload}
        className="hidden"
        aria-label={ariaLabel}
      />
      <Button
        variant="outline"
        onClick={() => fileInputRef.current?.click()}
        icon={icon ?? <UploadIcon className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />}
      >
        {children}
      </Button>
    </div>
  );
}
