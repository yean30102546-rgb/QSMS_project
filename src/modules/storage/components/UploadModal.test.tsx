import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UploadModal } from './UploadModal';

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

describe('UploadModal Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls onClose immediately when there are no items', () => {
    const onClose = vi.fn();

    const { container } = render(
      <UploadModal user={null} onClose={onClose} onSuccess={vi.fn()} />
    );

    // Find the X button in the header. It has 'rounded-full' class.
    const closeBtn = container.querySelector('button.rounded-full');
    expect(closeBtn).not.toBeNull();
    
    if (closeBtn) {
      fireEvent.click(closeBtn);
    }

    expect(mockShowConfirm).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('warns before closing when there are unsaved files via UI confirm', async () => {
    const onClose = vi.fn();
    mockShowConfirm.mockImplementation((msg, onConfirm) => {
      // Do nothing by default to simulate waiting
    });

    const { container } = render(
      <UploadModal user={null} onClose={onClose} onSuccess={vi.fn()} />
    );

    // Add a file to trigger the state change
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['fake content'], 'DWG123_CODE1_rev.1_M_Part.pdf', { type: 'application/pdf' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    // Wait for the item to appear in the UI
    await waitFor(() => {
      expect(screen.getByText(/DWG123_CODE1_rev\.1_M_Part\.pdf/)).toBeInTheDocument();
    });

    // Now click Cancel button (since items > 0, "Cancel" button is rendered)
    const cancelBtn = screen.getByText('Cancel');
    fireEvent.click(cancelBtn);

    expect(mockShowConfirm).toHaveBeenCalledWith(
      'คุณมีไฟล์ที่ยังไม่ได้บันทึกหรือกำลังประมวลผลอยู่ ต้องการปิดและยกเลิกทั้งหมดใช่หรือไม่?',
      expect.any(Function)
    );
    expect(onClose).not.toHaveBeenCalled();

    // Simulate accepting the confirm dialog
    mockShowConfirm.mockImplementation((msg, onConfirm) => {
      onConfirm(); // Simulate clicking 'Yes'
    });
    fireEvent.click(cancelBtn);
    
    expect(onClose).toHaveBeenCalledTimes(1);
  });
  
  it('registers beforeunload event listener', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = render(
      <UploadModal user={null} onClose={vi.fn()} onSuccess={vi.fn()} />
    );

    expect(addEventListenerSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));
    
    unmount();
    
    expect(removeEventListenerSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));
    
    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });
});
