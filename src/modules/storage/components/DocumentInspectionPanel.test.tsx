import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DocumentInspectionPanel, DrawingItem } from './DocumentInspectionPanel';

const mockNotification = {
  showToast: vi.fn(),
};

vi.mock('../../../contexts/NotificationContext', () => ({
  useNotification: () => mockNotification,
}));

describe('DocumentInspectionPanel Component', () => {
  const sampleDrawing: DrawingItem = {
    id: 'doc-123',
    drawing_number: 'D-0152',
    revision: '01',
    part_name: 'CAN 1L ENEOS MOTOR OIL',
    customer_name: 'ENEOS',
    item_code: '40001584',
    type: 'drawing',
    file_name: 'D-0152_01.pdf',
    r2_key: 'drawings/D-0152_01.pdf'
  };

  const onCloseMock = vi.fn();
  const onSaveMock = vi.fn().mockResolvedValue(true);
  const onSelectMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders document metadata correctly', () => {
    render(
      <DocumentInspectionPanel
        document={sampleDrawing}
        allDocuments={[sampleDrawing]}
        onClose={onCloseMock}
        onSaveDocument={onSaveMock}
        onSelectDocument={onSelectMock}
      />
    );

    expect(screen.getAllByText('D-0152')[0]).toBeInTheDocument();
    expect(screen.getByText('Rev.01')).toBeInTheDocument();
    expect(screen.getAllByText('CAN 1L ENEOS MOTOR OIL')[0]).toBeInTheDocument();
    expect(screen.getByText('Drawing')).toBeInTheDocument();
  });

  it('handles PDF rotation button clicks and stores preference in localStorage', () => {
    render(
      <DocumentInspectionPanel
        document={sampleDrawing}
        allDocuments={[sampleDrawing]}
        onClose={onCloseMock}
        onSaveDocument={onSaveMock}
        onSelectDocument={onSelectMock}
      />
    );

    const landscapeBtn = screen.getByTitle('ปรับเป็นแนวนอน (Landscape View)');
    fireEvent.click(landscapeBtn);

    expect(localStorage.getItem('qsms_pdf_rot_doc-123')).toBe('270');
    expect(mockNotification.showToast).toHaveBeenCalledWith('หมุนเอกสาร 270° (บันทึกทิศทางแล้ว)', 'info');
  });

  it('switches to edit mode and triggers save handler', async () => {
    render(
      <DocumentInspectionPanel
        document={sampleDrawing}
        allDocuments={[sampleDrawing]}
        initialMode="view"
        onClose={onCloseMock}
        onSaveDocument={onSaveMock}
        onSelectDocument={onSelectMock}
      />
    );

    const editBtn = screen.getByText('แก้ไขข้อมูล');
    fireEvent.click(editBtn);

    const partNameInput = screen.getByDisplayValue('CAN 1L ENEOS MOTOR OIL');
    fireEvent.change(partNameInput, { target: { value: 'UPDATED PART NAME' } });

    const saveBtn = screen.getByText('บันทึก');
    fireEvent.click(saveBtn);

    expect(onSaveMock).toHaveBeenCalledWith(
      expect.objectContaining({
        part_name: 'UPDATED PART NAME'
      })
    );
  });
});
