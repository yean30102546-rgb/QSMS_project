import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AddCaseTab } from './AddCaseTab';
import { CaseUpdateView } from './CaseUpdateView';
import { ReworkCase, MaterialRequestItem } from '@/src/services/api';

// Mock Notification Context
const mockShowAlert = vi.fn();
const mockShowToast = vi.fn();
vi.mock('@/src/contexts/NotificationContext', () => ({
  useNotification: () => ({
    showToast: mockShowToast,
    showAlert: mockShowAlert,
    showConfirm: vi.fn((msg, onConfirm) => onConfirm())
  })
}));

// Mock ReworkData Context
vi.mock('@/src/contexts/ReworkDataContext', () => ({
  useReworkData: () => ({
    cases: [] as ReworkCase[],
    loadCases: vi.fn(),
    itemMaster: [
      { itemCode: '40001234', itemNumber: '61653013A700A', itemName: 'น้ำมันเครื่องยนต์ 4T 10W-40 1L' }
    ]
  })
}));

// Mock API & Auth
const mockCurrentUser = vi.fn().mockReturnValue({ name: 'QSMS Officer', role: 'QSMS' });

vi.mock('@/src/services/auth', () => ({
  getCurrentUser: () => mockCurrentUser(),
  isAuthenticated: () => true
}));

vi.mock('@/src/services/api', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('@/src/services/api');
  return {
    ...actual,
    insertCase: vi.fn().mockResolvedValue({ success: true, data: { caseId: 'RW-2026-001', itemIds: [] } }),
    updateCase: vi.fn().mockResolvedValue({ success: true }),
    getCurrentUser: () => mockCurrentUser()
  };
});

describe('4-Stage Stepper Workflow & Role-Based Authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.clear();
    }
  });

  it('renders Step 1 WPK Case Initiation with auto case ID and advanced item entry', () => {
    render(<AddCaseTab onOpenTutorial={vi.fn()} />);

    expect(screen.getByText(/Step 1: เปิดเคสแจ้งเรื่อง/i)).toBeInTheDocument();
    expect(screen.getByText(/Rework Entry Form/i)).toBeInTheDocument();
    expect(screen.queryByText(/⚡ WPK Fast Ticket/i)).not.toBeInTheDocument();

    expect(screen.getByText(/รหัสเคสอัตโนมัติ:/i)).toBeInTheDocument();
    expect(screen.getAllByText(/รอวิเคราะห์/i).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /เปิดเคสใหม่และส่งต่อให้ QSMS วิเคราะห์/i })).toBeInTheDocument();
  });

  it('allows duplicating and adding multiple items without limit', () => {
    render(<AddCaseTab onOpenTutorial={vi.fn()} />);

    // Initially 1 item
    expect(screen.getAllByText(/รายการที่/i).length).toBe(1);

    // Click duplicate button on item 1
    const duplicateBtn = screen.getByRole('button', { name: /คัดลอกรายการ/i });
    fireEvent.click(duplicateBtn);

    // After duplicate, should have 2 items
    expect(screen.getAllByText(/รายการที่/i).length).toBe(2);
    expect(mockShowToast).toHaveBeenCalledWith(
      expect.stringContaining('คัดลอกข้อมูลจากรายการที่ 1 เรียบร้อยแล้ว'),
      'success'
    );

    // Click Add item button
    const addBtn = screen.getByRole('button', { name: /เพิ่มรายการสินค้า/i });
    fireEvent.click(addBtn);

    // After add, should have 3 items
    expect(screen.getAllByText(/รายการที่/i).length).toBe(3);
  });

  it('renders 4-Stage Stepper, defaults to Step 1 on Pending Analysis, and provides Back to Overall UI', () => {
    mockCurrentUser.mockReturnValue({ name: 'QSMS Officer', role: 'QSMS' });
    const mockOnBack = vi.fn();

    const mockCase: ReworkCase = {
      id: 'RW-2026-001',
      date: '2026-08-26',
      source: 'SFC',
      caseName: 'เคสน้ำมันรั่วซึมล็อต 26/08',
      status: 'Pending Analysis',
      customerName: 'SFC',
      items: [
        {
          id: 'item-1',
          itemNumber: '61653013A700A',
          itemCode: '40001234',
          itemName: 'น้ำมันเครื่องเกรดพรีเมียม',
          amount: 10,
          defectSymptom: 'รั่วซึม',
          cause: 'ซีลฟอยล์ไม่สนิท',
          responsibleParty: 'Supplier',
          evidenceImages: [{ url: 'https://placehold.co/100x100.png', publicId: 'ev1' }]
        }
      ],
      materialRequests: [
        {
          id: 'mat-1',
          materialName: 'กล่องใหม่',
          requestedQty: 50,
          issuedQty: 0,
          unit: 'กล่อง',
          status: 'pending'
        }
      ]
    };

    render(
      <CaseUpdateView
        caseData={mockCase}
        onBack={mockOnBack}
        onSuccess={vi.fn()}
        onDelete={vi.fn()}
        isAdmin={false}
        isOperator={false}
      />
    );

    // 4-Stage Stepper Header buttons
    expect(screen.getAllByText(/1\. ข้อมูลสินค้า & รูปภาพ/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/2\. QSMS วิเคราะห์ & ภาชนะ/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/3\. WPK คลังเบิกจ่ายภาชนะ/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/4\. PDF ซ่อม & Defend/i).length).toBeGreaterThan(0);

    // Back to Overall UI
    const backBtn = screen.getByRole('button', { name: /กลับหน้าภาพรวมเคส/i });
    expect(backBtn).toBeInTheDocument();
    fireEvent.click(backBtn);
    expect(mockOnBack).toHaveBeenCalledTimes(1);

    // Auto-opened on Step 1 because status is 'Pending Analysis'
    expect(screen.getByText(/Step 1: ข้อมูลสินค้าและรูปภาพหลักฐาน/i)).toBeInTheDocument();

    // When clicking Step 2 tab, QSMS sees edit mode
    fireEvent.click(screen.getAllByText(/2\. QSMS วิเคราะห์ & ภาชนะ/i)[0]);
    expect(screen.getByText(/Step 2: ผลการวิเคราะห์และระบุภาชนะที่ต้องใช้/i)).toBeInTheDocument();
    expect(screen.getByText(/โหมดวิเคราะห์ & ขอเบิก \(QSMS \/ Admin\)/i)).toBeInTheDocument();
    expect(screen.getByText(/บันทึกผล & ส่งขอเบิกภาชนะ/i)).toBeInTheDocument();
  });

  it('switches to Step 3 and enforces Preview mode for QSMS (WPK Only editing)', () => {
    mockCurrentUser.mockReturnValue({ name: 'QSMS Officer', role: 'QSMS' });

    const mockCase: ReworkCase = {
      id: 'RW-2026-001',
      date: '2026-08-26',
      source: 'SFC',
      caseName: 'เคสน้ำมันรั่วซึมล็อต 26/08',
      status: 'Awaiting Materials',
      customerName: 'SFC',
      items: [],
      materialRequests: [
        {
          id: 'mat-1',
          materialName: 'กล่องใหม่',
          requestedQty: 50,
          issuedQty: 0,
          unit: 'กล่อง',
          status: 'pending'
        }
      ]
    };

    render(
      <CaseUpdateView
        caseData={mockCase}
        onBack={vi.fn()}
        onSuccess={vi.fn()}
        onDelete={vi.fn()}
        isAdmin={false}
        isOperator={false}
      />
    );

    // Click to Step 3 tab
    fireEvent.click(screen.getAllByText(/คลังเบิกจ่ายภาชนะ/i)[0]);

    // QSMS sees Preview Only mode for Step 3
    expect(screen.getByText(/โหมดดูการเบิกจ่าย \(Preview Only\)/i)).toBeInTheDocument();
    // Handover button should not be present for QSMS
    expect(screen.queryByText(/จ่ายของครบ & ส่งให้ PDF ซ่อม/i)).not.toBeInTheDocument();
  });

  it('provides Edit mode for WPK in Step 3', () => {
    mockCurrentUser.mockReturnValue({ name: 'WPK Staff', role: 'WPK' });

    const mockCase: ReworkCase = {
      id: 'RW-2026-001',
      date: '2026-08-26',
      source: 'SFC',
      caseName: 'เคสน้ำมันรั่วซึมล็อต 26/08',
      status: 'Awaiting Materials',
      customerName: 'SFC',
      items: [],
      materialRequests: [
        {
          id: 'mat-1',
          materialName: 'กล่องใหม่',
          requestedQty: 50,
          issuedQty: 0,
          unit: 'กล่อง',
          status: 'pending'
        }
      ]
    };

    render(
      <CaseUpdateView
        caseData={mockCase}
        onBack={vi.fn()}
        onSuccess={vi.fn()}
        onDelete={vi.fn()}
        isAdmin={false}
        isOperator={false}
      />
    );

    // WPK sees Edit mode for Step 3
    expect(screen.getByText(/โหมดเบิกจ่ายของ \(WPK \/ Admin\)/i)).toBeInTheDocument();
    expect(screen.getByText(/จ่ายของครบ & ส่งให้ PDF ซ่อม/i)).toBeInTheDocument();
  });

  it('allows opening RW case immediately without reference attachments', async () => {
    render(<AddCaseTab onOpenTutorial={vi.fn()} />);

    // Default source is SFC / RW
    const submitBtn = screen.getByRole('button', { name: /เปิดเคสใหม่และส่งต่อให้ QSMS วิเคราะห์/i });
    fireEvent.click(submitBtn);

    // Should not trigger alert for missing attachments on RW case
    expect(mockShowAlert).not.toHaveBeenCalledWith(
      expect.stringContaining('งาน RT (เคสลูกค้า) จำเป็นต้องมีเอกสาร'),
      'error'
    );
  });

  it('moves saved item to bottom of queue and auto-expands next item while preserving original sequence number', async () => {
    mockCurrentUser.mockReturnValue({ name: 'QSMS Officer', role: 'QSMS' });

    const mockCase: ReworkCase = {
      id: 'RW-2026-001',
      date: '2026-08-26',
      source: 'SFC',
      caseName: 'เคสทดสอบคิวไอเทม',
      status: 'Pending Analysis',
      customerName: 'SFC',
      items: [
        {
          id: 'item-1',
          itemCode: '40001111',
          itemNumber: '61651111A700A',
          itemName: 'สินค้าชิ้นที่หนึ่ง',
          amount: 10,
          completedBoxes: 0,
          reason: 'รั่ว',
          reasonSubtype: 'รั่วซึม',
          responsible: 'SFC'
        },
        {
          id: 'item-2',
          itemCode: '40002222',
          itemNumber: '61652222A700A',
          itemName: 'สินค้าชิ้นที่สอง',
          amount: 20,
          completedBoxes: 0,
          reason: 'เปื้อน',
          reasonSubtype: 'เปื้อนฝุ่น',
          responsible: 'SFC'
        }
      ]
    };

    render(
      <CaseUpdateView
        caseData={mockCase}
        onBack={vi.fn()}
        onSuccess={vi.fn()}
        onDelete={vi.fn()}
        isAdmin={false}
        isOperator={false}
      />
    );

    // Initial state: Item 1 is expanded, Item 2 is collapsed
    expect(screen.getAllByText('สินค้าชิ้นที่หนึ่ง').length).toBeGreaterThan(0);
    expect(screen.getAllByText('สินค้าชิ้นที่สอง').length).toBeGreaterThan(0);

    // Find and click the per-item save button on Item 1
    const saveSingleItemBtn = screen.getByRole('button', { name: /บันทึกรายการนี้/i });
    expect(saveSingleItemBtn).toBeInTheDocument();
    fireEvent.click(saveSingleItemBtn);

    // After save: toast shows item sequence was saved and moved to bottom
    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.stringContaining('บันทึกรายการที่ 1 แล้ว ➔ ย้ายลงล่าง และเปิดรายการถัดไปให้อัตโนมัติ'),
        'success'
      );
    });
  });
});

