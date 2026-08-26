import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AddCaseTab } from './AddCaseTab';
import { CaseUpdateView } from './CaseUpdateView';
import { ReworkCase, MaterialRequestItem } from '@/src/services/api';

// Mock Notification Context
vi.mock('@/src/contexts/NotificationContext', () => ({
  useNotification: () => ({
    showToast: vi.fn(),
    showAlert: vi.fn(),
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
  });

  it('renders Step 1 WPK Case Initiation with auto case ID and fast ticket mode', () => {
    render(<AddCaseTab onOpenTutorial={vi.fn()} />);

    expect(screen.getByText(/Step 1: WPK เปิดเคสแจ้งเรื่อง/i)).toBeInTheDocument();
    expect(screen.getByText(/⚡ WPK Fast Ticket/i)).toBeInTheDocument();
    expect(screen.getByText(/📋 Advanced Item Entry/i)).toBeInTheDocument();

    expect(screen.getByText(/รหัสเคสอัตโนมัติ:/i)).toBeInTheDocument();
    expect(screen.getByText(/รอวิเคราะห์ \(Pending Analysis\)/i)).toBeInTheDocument();
    expect(screen.getByText(/🚀 เปิดเคสใหม่และส่งต่อให้ QSMS วิเคราะห์/i)).toBeInTheDocument();
  });

  it('renders 4-Stage Stepper and provides Edit mode for QSMS in Step 2', () => {
    mockCurrentUser.mockReturnValue({ name: 'QSMS Officer', role: 'QSMS' });

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
          itemCode: '40001234',
          itemNumber: '61653013A700A',
          itemName: 'น้ำมันเครื่องยนต์ 4T 10W-40 1L',
          amount: 50,
          completedBoxes: 0,
          reason: 'รั่ว',
          reasonSubtype: 'รั่วซึม',
          responsible: 'SFC'
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
        onBack={vi.fn()}
        onSuccess={vi.fn()}
        onDelete={vi.fn()}
        isAdmin={false}
        isOperator={false}
      />
    );

    // 4-Stage Stepper Header buttons
    expect(screen.getByText(/1. รายการสินค้า & รูปภาพ/i)).toBeInTheDocument();
    expect(screen.getByText(/2. QSMS วิเคราะห์ & ภาชนะ/i)).toBeInTheDocument();
    expect(screen.getByText(/3. WPK คลังเบิกจ่ายภาชนะ/i)).toBeInTheDocument();
    expect(screen.getByText(/4. PDF ซ่อม & Defend/i)).toBeInTheDocument();

    // Auto-opened on Step 2 because status is 'Pending Analysis'
    expect(screen.getByText(/Step 2: ผลการวิเคราะห์และระบุภาชนะที่ต้องใช้/i)).toBeInTheDocument();
    expect(screen.getByText(/✏️ โหมดวิเคราะห์ & ขอเบิก \(QSMS \/ Admin\)/i)).toBeInTheDocument();
    expect(screen.getByText(/บันทึกผล & ส่งขอเบิกภาชนะ ➔/i)).toBeInTheDocument();
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
    fireEvent.click(screen.getByText(/3. WPK คลังเบิกจ่ายภาชนะ/i));

    // QSMS sees Preview Only mode for Step 3
    expect(screen.getByText(/👁️ โหมดดูการเบิกจ่าย \(Preview Only\)/i)).toBeInTheDocument();
    // Handover button should not be present for QSMS
    expect(screen.queryByText(/จ่ายของครบ & ส่งให้ PDF ซ่อม ➔/i)).not.toBeInTheDocument();
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
    expect(screen.getByText(/✏️ โหมดเบิกจ่ายของ \(WPK \/ Admin\)/i)).toBeInTheDocument();
    expect(screen.getByText(/จ่ายของครบ & ส่งให้ PDF ซ่อม ➔/i)).toBeInTheDocument();
  });
});
