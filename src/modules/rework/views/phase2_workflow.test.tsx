import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AddCaseTab } from './AddCaseTab';
import { CaseUpdateView } from './CaseUpdateView';
import { Dashboard } from './Dashboard';
import { OverallTab } from './OverallTab';
import { RequisitionSlipModal } from '../components/RequisitionSlipModal';
import { ReworkCase, MaterialRequestItem, updateCase } from '@/src/services/api';

// Mock recharts for Dashboard
vi.mock('recharts', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="responsive-container">{children}</div>,
    AreaChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Area: () => <div />,
    XAxis: () => <div />,
    YAxis: () => <div />,
    CartesianGrid: () => <div />,
    Tooltip: () => <div />,
  };
});

// Mock Notification Context
vi.mock('@/src/contexts/NotificationContext', () => ({
  useNotification: () => ({
    showToast: vi.fn(),
    showAlert: vi.fn(),
    showConfirm: vi.fn((msg, onConfirm) => onConfirm())
  })
}));

// Mock ReworkData Context
const mockCasesState = {
  cases: [] as ReworkCase[],
  stats: {
    total: 0,
    pendingAnalysis: 0,
    awaitingMaterials: 0,
    pending: 0,
    inProgress: 0,
    blocked: 0,
    completed: 0,
    completionRate: 0,
    linkedCount: 0,
  }
};

vi.mock('@/src/contexts/ReworkDataContext', () => ({
  useReworkData: () => ({
    cases: mockCasesState.cases,
    isLoadingCases: false,
    caseError: null as string | null,
    searchQuery: '',
    setSearchQuery: vi.fn(),
    loadCases: vi.fn(),
    updateCasesLocally: vi.fn(),
    stats: mockCasesState.stats,
    itemMaster: [
      { itemCode: '40001234', itemNumber: '61653013A700A', itemName: 'น้ำมันเครื่องยนต์ 4T 10W-40 1L' }
    ]
  })
}));

// Mock API & Auth
const mockCurrentUser = vi.fn().mockReturnValue({ name: 'QSMS Officer', role: 'QSMS' });

vi.mock('@/src/services/auth', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('@/src/services/auth');
  return {
    ...actual,
    getCurrentUser: () => mockCurrentUser(),
    getCurrentUserRole: () => mockCurrentUser()?.role || 'Admin',
    isAuthenticated: () => true
  };
});

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

  it('preserves Pending Analysis status on draft save instead of forcing In-Progress', async () => {
    const updateCaseMock = vi.mocked(updateCase);
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
          completedBoxes: 10,
          reason: 'รั่ว',
          responsible: 'SFC'
        }
      ],
    };

    render(
      <CaseUpdateView
        caseData={mockCase}
        onBack={vi.fn()}
        onSuccess={vi.fn()}
        onDelete={vi.fn()}
        isAdmin={true}
        isOperator={false}
      />
    );

    const saveDraftBtn = screen.getByRole('button', { name: /บันทึกร่าง/i });
    fireEvent.click(saveDraftBtn);

    expect(updateCaseMock).toHaveBeenCalled();
    const lastCall = updateCaseMock.mock.calls[updateCaseMock.mock.calls.length - 1];
    expect(lastCall[1].status).toBe('Pending Analysis');
  });

  it('renders RequisitionSlipModal and triggers print', () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});

    const mockCase: ReworkCase = {
      id: 'RW-2026-001',
      date: '2026-08-26',
      source: 'SFC',
      caseName: 'เคสน้ำมันรั่วซึมล็อต 26/08',
      status: 'Awaiting Materials',
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
          responsible: 'SFC',
        },
      ],
      materialRequests: [
        {
          id: 'mat-1',
          materialName: 'กล่องเปล่าใหม่',
          requestedQty: 50,
          issuedQty: 50,
          unit: 'กล่อง',
          status: 'fulfilled' as const,
        },
      ],
    };

    render(
      <RequisitionSlipModal
        isOpen={true}
        onClose={vi.fn()}
        caseData={mockCase}
        materialRequests={mockCase.materialRequests!}
        resolutionMethod="เปลี่ยนกล่องและซีลใหม่"
      />
    );

    expect(screen.getByText(/ใบขอเบิกภาชนะและวัสดุสำหรับงานซ่อม/i)).toBeInTheDocument();
    expect(screen.getByText(/RW-2026-001/i)).toBeInTheDocument();
    expect(screen.getByText(/กล่องเปล่าใหม่/i)).toBeInTheDocument();
    expect(screen.getByText(/เปลี่ยนกล่องและซีลใหม่/i)).toBeInTheDocument();
    expect(screen.getByText(/1\. ผู้ขอเบิก \(QSMS Officer\)/i)).toBeInTheDocument();
    expect(screen.getByText(/2\. ผู้จ่ายของ \(WPK Warehouse\)/i)).toBeInTheDocument();
    expect(screen.getByText(/3\. ผู้รับของไปซ่อม \(PDF Technician\)/i)).toBeInTheDocument();

    const printButton = screen.getByRole('button', { name: /สั่งพิมพ์ \(Print \/ PDF\)/i });
    fireEvent.click(printButton);
    expect(printSpy).toHaveBeenCalled();
    printSpy.mockRestore();
  });

  it('renders Dashboard 4-Stage Workflow Pipeline and 6-status metrics', () => {
    const mockCases: ReworkCase[] = [
      { id: '1', status: 'Pending Analysis', date: '2026-08-01', items: [] },
      { id: '2', status: 'Awaiting Materials', date: '2026-08-01', items: [] },
      { id: '3', status: 'Pending', date: '2026-08-01', items: [] },
      { id: '4', status: 'In-Progress', date: '2026-08-01', items: [] },
      { id: '5', status: 'Blocked', date: '2026-08-01', items: [] },
      { id: '6', status: 'Completed', date: '2026-08-01', items: [] },
    ] as unknown as ReworkCase[];

    render(<Dashboard cases={mockCases} isLoading={false} />);

    expect(screen.getByText(/4-Stage Workflow Pipeline/i)).toBeInTheDocument();
    expect(screen.getByText(/1. รอวิเคราะห์/i)).toBeInTheDocument();
    expect(screen.getByText(/2. รอเบิกภาชนะ/i)).toBeInTheDocument();
    expect(screen.getByText(/3. กำลังซ่อม/i)).toBeInTheDocument();
    expect(screen.getByText(/4. เสร็จสมบูรณ์/i)).toBeInTheDocument();
  });

  it('renders OverallTab 1-Click Workflow Stage Swimlane Bar with stage buttons and badges', () => {
    mockCasesState.cases = [
      { id: '1', status: 'Pending Analysis', date: '2026-08-01', items: [] },
      { id: '2', status: 'Awaiting Materials', date: '2026-08-01', items: [] },
      { id: '3', status: 'In-Progress', date: '2026-08-01', items: [] },
      { id: '4', status: 'Blocked', date: '2026-08-01', items: [] },
      { id: '5', status: 'Completed', date: '2026-08-01', items: [] },
    ] as unknown as ReworkCase[];

    render(<OverallTab userRole="Admin" />);

    expect(screen.getByText(/รอวิเคราะห์ & เบิกของ/i)).toBeInTheDocument();
    expect(screen.getByText(/รายการงาน Rework ล่าสุด/i)).toBeInTheDocument();
    expect(screen.getAllByText(/รอเบิกภาชนะ/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/ติดปัญหา Defend/i).length).toBeGreaterThanOrEqual(1);
  });
});
