import { useState, useCallback, DragEvent } from 'react';
import { MAX_MESSAGE_SIZE } from '../utils/validation';

interface UseDropZoneOptions {
  onDrop: (content: string) => void;
  onError?: (message: string) => void;
  acceptedExtensions?: string[];
  maxSize?: number;
}

interface UseDropZoneReturn {
  isDragging: boolean;
  handleDragEnter: (e: DragEvent) => void;
  handleDragLeave: (e: DragEvent) => void;
  handleDragOver: (e: DragEvent) => void;
  handleDrop: (e: DragEvent) => void;
}

const DEFAULT_EXTENSIONS = ['.asc', '.gpg', '.key', '.pgp', '.txt'];

export function useDropZone({
  onDrop,
  onError,
  acceptedExtensions = DEFAULT_EXTENSIONS,
  maxSize = MAX_MESSAGE_SIZE,
}: UseDropZoneOptions): UseDropZoneReturn {
  const [isDragging, setIsDragging] = useState(false);
  const [, setDragCounter] = useState(0);

  const isValidFile = useCallback(
    (file: File): boolean => {
      const fileName = file.name.toLowerCase();
      return acceptedExtensions.some((ext) => fileName.endsWith(ext));
    },
    [acceptedExtensions]
  );

  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter((prev) => prev + 1);
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter((prev) => {
      const newCount = prev - 1;
      if (newCount === 0) {
        setIsDragging(false);
      }
      return newCount;
    });
  }, []);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      setDragCounter(0);

      const files = e.dataTransfer?.files;
      if (!files || files.length === 0) return;

      const file = files[0];
      if (!isValidFile(file)) {
        onError?.(
          `This file type isn't supported. Accepted types: ${acceptedExtensions.join(', ')}`
        );
        return;
      }

      if (file.size > maxSize) {
        onError?.(
          `File is too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Maximum size is ${maxSize / 1024 / 1024}MB.`
        );
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) {
          onDrop(content);
        }
      };
      reader.onerror = () => {
        onError?.('Could not read the dropped file.');
      };
      reader.readAsText(file);
    },
    [isValidFile, onDrop, onError, acceptedExtensions, maxSize]
  );

  return {
    isDragging,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
  };
}
