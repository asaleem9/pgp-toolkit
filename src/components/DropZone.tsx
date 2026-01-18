import { ReactNode } from 'react';
import { useDropZone } from '../hooks/useDropZone';

interface DropZoneProps {
  children: ReactNode;
  onDrop: (content: string) => void;
  acceptedExtensions?: string[];
  hint?: string;
}

export function DropZone({
  children,
  onDrop,
  acceptedExtensions,
  hint = 'Drop file here',
}: DropZoneProps) {
  const { isDragging, handleDragEnter, handleDragLeave, handleDragOver, handleDrop } =
    useDropZone({ onDrop, acceptedExtensions });

  return (
    <div
      className="relative"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {children}

      {/* Drop overlay */}
      {isDragging && (
        <div className="absolute inset-0 bg-primary/10 border-2 border-dashed border-primary rounded-lg flex items-center justify-center z-10 pointer-events-none">
          <div className="bg-white px-4 py-2 rounded-md shadow-sm">
            <div className="flex items-center gap-2 text-primary font-medium">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              {hint}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
