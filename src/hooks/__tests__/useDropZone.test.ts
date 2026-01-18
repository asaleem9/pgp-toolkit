/**
 * Tests for useDropZone hook
 * Target: 95%+ coverage
 */

import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDropZone } from '../useDropZone';
import { createDragEvent } from '../../test/helpers/testUtils';
import { createMockFile, setupFileReaderMock } from '../../test/helpers/mockFileReader';

describe('useDropZone', () => {
  it('should initialize with isDragging false', () => {
    const onDrop = vi.fn();
    const { result } = renderHook(() => useDropZone({ onDrop }));

    expect(result.current.isDragging).toBe(false);
  });

  it('should set isDragging true on dragEnter', () => {
    const onDrop = vi.fn();
    const { result } = renderHook(() => useDropZone({ onDrop }));

    const event = createDragEvent('dragenter');

    act(() => {
      result.current.handleDragEnter(event);
    });

    expect(result.current.isDragging).toBe(true);
  });

  it('should set isDragging false on dragLeave', () => {
    const onDrop = vi.fn();
    const { result } = renderHook(() => useDropZone({ onDrop }));

    const enterEvent = createDragEvent('dragenter');
    const leaveEvent = createDragEvent('dragleave');

    act(() => {
      result.current.handleDragEnter(enterEvent);
    });

    expect(result.current.isDragging).toBe(true);

    act(() => {
      result.current.handleDragLeave(leaveEvent);
    });

    expect(result.current.isDragging).toBe(false);
  });

  it('should handle nested drag events with counter', () => {
    const onDrop = vi.fn();
    const { result } = renderHook(() => useDropZone({ onDrop }));

    // Enter twice (nested)
    act(() => {
      result.current.handleDragEnter(createDragEvent('dragenter'));
      result.current.handleDragEnter(createDragEvent('dragenter'));
    });

    expect(result.current.isDragging).toBe(true);

    // Leave once - should still be dragging
    act(() => {
      result.current.handleDragLeave(createDragEvent('dragleave'));
    });

    expect(result.current.isDragging).toBe(true);

    // Leave again - now should stop dragging
    act(() => {
      result.current.handleDragLeave(createDragEvent('dragleave'));
    });

    expect(result.current.isDragging).toBe(false);
  });

  it('should accept .asc files', () => {
    const onDrop = vi.fn();
    const { result } = renderHook(() => useDropZone({ onDrop }));

    setupFileReaderMock('test key content');
    const file = createMockFile('test content', 'key.asc');
    const event = createDragEvent('drop', [file]);

    act(() => {
      result.current.handleDrop(event);
    });

    expect(result.current.isDragging).toBe(false);
    expect(onDrop).toHaveBeenCalledWith('test key content');
  });

  it('should accept .gpg files', () => {
    const onDrop = vi.fn();
    const { result } = renderHook(() => useDropZone({ onDrop }));

    setupFileReaderMock('gpg content');
    const file = createMockFile('test', 'message.gpg');
    const event = createDragEvent('drop', [file]);

    act(() => {
      result.current.handleDrop(event);
    });

    expect(onDrop).toHaveBeenCalledWith('gpg content');
  });

  it('should accept custom extensions', () => {
    const onDrop = vi.fn();
    const { result } = renderHook(() =>
      useDropZone({ onDrop, acceptedExtensions: ['.custom', '.test'] })
    );

    setupFileReaderMock('custom file');
    const file = createMockFile('test', 'file.custom');
    const event = createDragEvent('drop', [file]);

    act(() => {
      result.current.handleDrop(event);
    });

    expect(onDrop).toHaveBeenCalledWith('custom file');
  });

  it('should reject files with wrong extension', () => {
    const onDrop = vi.fn();
    const { result } = renderHook(() => useDropZone({ onDrop }));

    const file = createMockFile('test', 'document.pdf');
    const event = createDragEvent('drop', [file]);

    act(() => {
      result.current.handleDrop(event);
    });

    expect(onDrop).not.toHaveBeenCalled();
  });

  it('should be case insensitive for extensions', () => {
    const onDrop = vi.fn();
    const { result } = renderHook(() => useDropZone({ onDrop }));

    setupFileReaderMock('content');
    const file = createMockFile('test', 'FILE.ASC'); // Uppercase
    const event = createDragEvent('drop', [file]);

    act(() => {
      result.current.handleDrop(event);
    });

    expect(onDrop).toHaveBeenCalledWith('content');
  });

  it('should handle drop with no files', () => {
    const onDrop = vi.fn();
    const { result } = renderHook(() => useDropZone({ onDrop }));

    const event = createDragEvent('drop', []);

    act(() => {
      result.current.handleDrop(event);
    });

    expect(onDrop).not.toHaveBeenCalled();
    expect(result.current.isDragging).toBe(false);
  });

  it('should only process first file', () => {
    const onDrop = vi.fn();
    const { result } = renderHook(() => useDropZone({ onDrop }));

    setupFileReaderMock('first file');
    const file1 = createMockFile('first', 'file1.asc');
    const file2 = createMockFile('second', 'file2.asc');
    const event = createDragEvent('drop', [file1, file2]);

    act(() => {
      result.current.handleDrop(event);
    });

    expect(onDrop).toHaveBeenCalledTimes(1);
    expect(onDrop).toHaveBeenCalledWith('first file');
  });

  it('should reset counter on drop', () => {
    const onDrop = vi.fn();
    const { result } = renderHook(() => useDropZone({ onDrop }));

    // Multiple drag enters
    act(() => {
      result.current.handleDragEnter(createDragEvent('dragenter'));
      result.current.handleDragEnter(createDragEvent('dragenter'));
      result.current.handleDragEnter(createDragEvent('dragenter'));
    });

    expect(result.current.isDragging).toBe(true);

    // Drop should reset everything
    setupFileReaderMock('content');
    const file = createMockFile('test', 'file.asc');
    const event = createDragEvent('drop', [file]);

    act(() => {
      result.current.handleDrop(event);
    });

    expect(result.current.isDragging).toBe(false);

    // One leave should not make it dragging again (counter was reset)
    act(() => {
      result.current.handleDragLeave(createDragEvent('dragleave'));
    });

    expect(result.current.isDragging).toBe(false);
  });

  it('should handle dragOver', () => {
    const onDrop = vi.fn();
    const { result } = renderHook(() => useDropZone({ onDrop }));

    const event = createDragEvent('dragover');
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

    act(() => {
      result.current.handleDragOver(event);
    });

    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it('should accept all default extensions', () => {
    const onDrop = vi.fn();
    const { result } = renderHook(() => useDropZone({ onDrop }));

    const extensions = ['.asc', '.gpg', '.key', '.pgp', '.txt'];

    extensions.forEach(ext => {
      onDrop.mockClear();
      setupFileReaderMock(`content${ext}`);
      const file = createMockFile('test', `file${ext}`);
      const event = createDragEvent('drop', [file]);

      act(() => {
        result.current.handleDrop(event);
      });

      expect(onDrop).toHaveBeenCalledWith(`content${ext}`);
    });
  });
});
