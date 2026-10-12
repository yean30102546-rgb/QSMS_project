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

  it('correctly matches linked master using drawing_number fallback when item_code is missing', () => {
    const drawingWithoutCode: DrawingItem = {
      id: 'doc-no-code',
      drawing_number: 'DWG-999',
      revision: '00',
      part_name: 'TEST PART NO CODE',
      customer_name: 'ENEOS',
      item_code: null,
      type: 'drawing',
      file_name: 'DWG-999_00.pdf',
    };

    const matchingMaster: DrawingItem = {
      id: 'master-999',
      drawing_number: 'DWG-999',
      revision: '01',
      part_name: 'TEST PART MASTER',
      customer_name: 'ENEOS',
      item_code: null,
      type: 'master',
      file_name: 'MASTER-999_01.pdf',
    };

    render(
      <DocumentInspectionPanel
        document={drawingWithoutCode}
        allDocuments={[drawingWithoutCode, matchingMaster]}
        onClose={onCloseMock}
        onSaveDocument={onSaveMock}
        onSelectDocument={onSelectMock}
      />
    );

    // Verify Fallback Badge by Doc No
    expect(screen.getByText('Matched by Doc No (DWG-999)')).toBeInTheDocument();
    expect(screen.getByText(/พบ Master Specification : DWG-999/)).toBeInTheDocument();

    // Verify switch button calls onSelectDocument with matching master
    const switchBtn = screen.getByText(/สลับไปดู Master/);
    fireEvent.click(switchBtn);
    expect(onSelectMock).toHaveBeenCalledWith(matchingMaster);
  });

  it('renders multi-match revision selector when multiple linked documents match', () => {
    const drawing: DrawingItem = {
      id: 'doc-multi',
      drawing_number: 'DWG-MULTI',
      revision: '01',
      part_name: 'MULTI ITEM',
      customer_name: 'ENEOS',
      item_code: '40008888',
      type: 'drawing',
      file_name: 'DWG-MULTI_01.pdf',
    };

    const masterRev0: DrawingItem = {
      id: 'master-rev0',
      drawing_number: 'DWG-MULTI',
      revision: '00',
      part_name: 'MULTI ITEM',
      customer_name: 'ENEOS',
      item_code: '40008888',
      type: 'master',
      is_active: false,
      file_name: 'MASTER-MULTI_00.pdf',
    };

    const masterRev1: DrawingItem = {
      id: 'master-rev1',
      drawing_number: 'DWG-MULTI',
      revision: '01',
      part_name: 'MULTI ITEM',
      customer_name: 'ENEOS',
      item_code: '40008888',
      type: 'master',
      is_active: true,
      file_name: 'MASTER-MULTI_01.pdf',
    };

    render(
      <DocumentInspectionPanel
        document={drawing}
        allDocuments={[drawing, masterRev0, masterRev1]}
        onClose={onCloseMock}
        onSaveDocument={onSaveMock}
        onSelectDocument={onSelectMock}
      />
    );

    // Verify multi-match heading
    expect(screen.getByText(/พบเอกสารที่จับคู่ได้ 2 ฉบับ/)).toBeInTheDocument();
    expect(screen.getByText('Rev.00')).toBeInTheDocument();
    expect(screen.getAllByText('Rev.01').length).toBeGreaterThan(0);

    // Click Rev.00 to select it
    const rev0Btn = screen.getByRole('button', { name: /Rev.00/ });
    fireEvent.click(rev0Btn);

    // Click switch button
    const switchBtn = screen.getByText(/สลับไปดู Master/);
    fireEvent.click(switchBtn);
    expect(onSelectMock).toHaveBeenCalledWith(masterRev0);
  });

  it('supports PDF zoom in, zoom out, and reset', () => {
    render(
      <DocumentInspectionPanel
        document={sampleDrawing}
        allDocuments={[sampleDrawing]}
        onClose={onCloseMock}
        onSaveDocument={onSaveMock}
        onSelectDocument={onSelectMock}
      />
    );

    const zoomInBtn = screen.getByTitle('ขยายขนาด (+25%)');
    const zoomOutBtn = screen.getByTitle('ย่อขนาด (-25%)');

    expect(screen.getByText('100%')).toBeInTheDocument();

    // Zoom in
    fireEvent.click(zoomInBtn);
    expect(screen.getByText('125%')).toBeInTheDocument();

    // Reset zoom
    const resetBtn = screen.getByText('รีเซ็ต');
    fireEvent.click(resetBtn);
    expect(screen.getByText('100%')).toBeInTheDocument();

    // Zoom out
    fireEvent.click(zoomOutBtn);
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('supports mobile view switcher toggling between PDF and Metadata full view', () => {
    render(
      <DocumentInspectionPanel
        document={sampleDrawing}
        allDocuments={[sampleDrawing]}
        onClose={onCloseMock}
        onSaveDocument={onSaveMock}
        onSelectDocument={onSelectMock}
      />
    );

    // Switch to PDF full view
    const pdfTabBtn = screen.getByRole('button', { name: /แบบแปลน/ });
    fireEvent.click(pdfTabBtn);
    expect(screen.queryByText('Metadata Specifications (7 Drawing Fields)')).not.toBeInTheDocument();

    // Switch to Metadata full view
    const metaTabBtn = screen.getByRole('button', { name: /สเปก/ });
    fireEvent.click(metaTabBtn);
    expect(screen.getByText('Metadata Specifications (7 Drawing Fields)')).toBeInTheDocument();
  });
});

