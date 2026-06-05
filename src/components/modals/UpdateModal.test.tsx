import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdateModal } from './UpdateModal';
import { ReworkCase } from '../../services/api';

// Mock dependencies
vi.mock('../../hooks/useSaveProgress', () => ({
  useSaveProgress: () => ({
    progress: 0,
    isSaving: false,
    statusText: '',
    isComplete: false,
    startSaving: vi.fn(),
    finishSaving: vi.fn(),
    failSaving: vi.fn()
  })
}));

vi.mock('../../hooks/useExportReport', () => ({
  useExportReport: () => ({
    isExporting: false,
    exportProgress: 0,
    exportPNG: vi.fn(),
    exportPDF: vi.fn()
  })
}));

vi.mock('../../services/auth', () => ({
  getCurrentUserRole: vi.fn(() => 'QSMS')
}));

const mockCaseData: ReworkCase = {
  id: 'RT001-2026',
  caseName: 'RT001-2026',
  source: 'Customer',
  date: '2026-05-27T00:00:00Z',
  items: [
    {
      id: 'item-1',
      uid: 'uid-1',
      itemNumber: '123',
      itemCode: 'CODE1',
      itemName: 'Item 1',
      amount: 10,
      reason: 'Defect',
      responsible: 'QSMS',
      imageUrls: []
    }
  ],
  status: 'Pending',
  orFilesUrls: []
};

describe('UpdateModal Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly when open', () => {
    render(
      <UpdateModal
        isOpen={true}
        caseData={mockCaseData}
        isLoading={false}
        onClose={vi.fn()}
        onUpdate={vi.fn()}
      />
    );
    expect(screen.getByText('Update Status')).toBeInTheDocument();
    expect(screen.getAllByText('RT001-2026')[0]).toBeInTheDocument();
  });

  it('allows entering edit mode for admin', async () => {
    render(
      <UpdateModal
        isOpen={true}
        caseData={mockCaseData}
        isLoading={false}
        onClose={vi.fn()}
        onUpdate={vi.fn()}
      />
    );
    
    // Find the edit button
    const editModeBtn = screen.getByText('แก้ไข');
    fireEvent.click(editModeBtn);

    // Should reveal source dropdown and editable case number input
    await waitFor(() => {
      expect(screen.getByText('แหล่งที่มา')).toBeInTheDocument();
    });
    
    // Check if the select exists
    const sourceSelect = screen.getAllByRole('combobox')[0];
    expect(sourceSelect).toBeInTheDocument();
    expect(sourceSelect).toHaveValue('Customer');
    
    // Check editable middle case number exists
    const caseNameInput = screen.getByDisplayValue('001');
    expect(caseNameInput).toBeInTheDocument();
  });

  it('updates state when changing case number in edit mode', async () => {
    render(
      <UpdateModal
        isOpen={true}
        caseData={mockCaseData}
        isLoading={false}
        onClose={vi.fn()}
        onUpdate={vi.fn()}
      />
    );
    
    fireEvent.click(screen.getByText('แก้ไข'));
    
    const caseNameInput = screen.getByDisplayValue('001');
    fireEvent.change(caseNameInput, { target: { value: '999' } });
    
    expect(caseNameInput).toHaveValue('999');
  });

  it('calls onUpdate with the updated caseName on save', async () => {
    const mockOnUpdate = vi.fn().mockResolvedValue(true);
    
    render(
      <UpdateModal
        isOpen={true}
        caseData={mockCaseData}
        isLoading={false}
        onClose={vi.fn()}
        onUpdate={mockOnUpdate}
      />
    );
    fireEvent.click(screen.getByText('แก้ไข'));
    
    const caseNameInput = screen.getByDisplayValue('001');
    fireEvent.change(caseNameInput, { target: { value: '999' } });
    
    // Find save button
    const saveButton = screen.getByText('บันทึกการแก้ไข');
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalledWith('RT001-2026', expect.objectContaining({
        caseName: 'RT999-2026',
        source: 'Customer'
      }));
    });
  });

  it('switches caseName prefix to RW when source is SFC', async () => {
    const mockOnUpdate = vi.fn().mockResolvedValue(true);

    render(
      <UpdateModal
        isOpen={true}
        caseData={mockCaseData}
        isLoading={false}
        onClose={vi.fn()}
        onUpdate={mockOnUpdate}
      />
    );

    fireEvent.click(screen.getByText('แก้ไข'));

    const sourceSelect = screen.getAllByRole('combobox')[0];
    fireEvent.change(sourceSelect, { target: { value: 'SFC' } });

    const caseNameInput = screen.getByDisplayValue('001');
    fireEvent.change(caseNameInput, { target: { value: '084' } });
    fireEvent.click(screen.getByText('บันทึกการแก้ไข'));

    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalledWith('RT001-2026', expect.objectContaining({
        caseName: 'RW084-2026',
        source: 'SFC'
      }));
    });
  });

  it('exits edit mode when clicking cancel and confirming', async () => {
    const confirmMock = vi.spyOn(window, 'confirm').mockImplementation(() => true);

    render(
      <UpdateModal
        isOpen={true}
        caseData={mockCaseData}
        isLoading={false}
        onClose={vi.fn()}
        onUpdate={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText('แก้ไข'));
    expect(screen.getByText('โหมดแก้ไข')).toBeInTheDocument();

    fireEvent.click(screen.getByText('ยกเลิก'));
    expect(screen.getByText('Update Status')).toBeInTheDocument();

    confirmMock.mockRestore();
  });

  it('warns before closing the modal while editing', async () => {
    const onClose = vi.fn();
    const confirmMock = vi.spyOn(window, 'confirm').mockImplementation(() => false);

    render(
      <UpdateModal
        isOpen={true}
        caseData={mockCaseData}
        isLoading={false}
        onClose={onClose}
        onUpdate={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText('แก้ไข'));
    fireEvent.click(screen.getByText('ยกเลิก'));

    expect(confirmMock).toHaveBeenCalledWith('คุณมีข้อมูลที่ยังไม่ได้บันทึก ต้องการปิดใช่หรือไม่?');
    expect(onClose).not.toHaveBeenCalled();

    confirmMock.mockImplementation(() => true);
    fireEvent.click(screen.getByText('ยกเลิก'));
    expect(onClose).toHaveBeenCalledTimes(1);

    confirmMock.mockRestore();
  });
});
