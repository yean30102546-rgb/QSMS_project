import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UploadModal } from './UploadModal';
import type { UploadItem } from '../hooks/useUploadQueue';

// Mock NotificationContext
const mockShowConfirm = vi.fn();
vi.mock('../../../contexts/NotificationContext', () => ({
  useNotification: () => ({
    showToast: vi.fn(),
    showConfirm: mockShowConfirm,
  }),
}));

// Mock ResizeObserver since it might be needed by some components or framer-motion
if (typeof global.ResizeObserver === 'undefined') {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

function createMockQueue(overrides: Record<string, unknown> = {}) {
  return {
    items: [] as UploadItem[],
    setItems: vi.fn(),
    isUploading: false,
    setIsUploading: vi.fn(),
    aiModel: 'gemini-3.1-flash',
    setAiModel: vi.fn(),
    isQuotaPaused: false,
    setIsQuotaPaused: vi.fn(),
    quotaCountdown: 0,
    setQuotaCountdown: vi.fn(),
    addFiles: vi.fn(),
    cancelQueue: vi.fn(),
    clearCompleted: vi.fn(),
    clearAll: vi.fn(),
    resumePausedParsing: vi.fn(),
    triggerAiParsing: vi.fn(),
    ...overrides,
  } as ReturnType<typeof import('../hooks/useUploadQueue').useUploadQueue>;
}

describe('UploadModal Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls onMinimize when clicking the close button with no items', () => {
    const onMinimize = vi.fn();
    const mockQueue = createMockQueue();

    const { container } = render(
      <UploadModal user={null} queue={mockQueue} onMinimize={onMinimize} onSuccess={vi.fn()} />
    );

    // The close button has lucide-x icon inside
    const closeBtn = container.querySelector('.lucide-x')?.closest('button');
    expect(closeBtn).not.toBeNull();

    if (closeBtn) {
      fireEvent.click(closeBtn);
    }

    expect(onMinimize).toHaveBeenCalledTimes(1);
  });

  it('calls addFiles when a file is selected via file input', () => {
    const mockAddFiles = vi.fn();
    const mockQueue = createMockQueue({ addFiles: mockAddFiles });

    const { container } = render(
      <UploadModal user={null} queue={mockQueue} onMinimize={vi.fn()} onSuccess={vi.fn()} />
    );

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).not.toBeNull();

    const file = new File(['fake content'], 'DWG123_CODE1_rev.1_M_Part.pdf', { type: 'application/pdf' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(mockAddFiles).toHaveBeenCalledTimes(1);
  });

  it('renders empty state when queue has no items', () => {
    const mockQueue = createMockQueue();

    const { container } = render(
      <UploadModal user={null} queue={mockQueue} onMinimize={vi.fn()} onSuccess={vi.fn()} />
    );

    // Should show the drag & drop empty state with "Browse Files" button
    expect(container.textContent).toContain('Browse Files');
  });
});
