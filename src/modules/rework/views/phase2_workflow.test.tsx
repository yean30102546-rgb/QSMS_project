import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.clear();
    }
  });

  it('renders the case initiation form with auto case ID and item entry', () => {
    render(<AddCaseTab onOpenTutorial={vi.fn()} />);

    expect(screen.getByText(/เปิดเคสใหม่ \(Case Initiation\)/i)).toBeInTheDocument();
    expect(screen.getByText(/สร้าง Case ID อัตโนมัติและส่งต่อข้อมูลเข้าสู่ระบบ Rework/i)).toBeInTheDocument();
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

  it('renders the current three-tab workspace, opens item details for Pending Analysis, and provides Back to Overall', () => {
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
          reason: 'รั่วซึม',
          details: 'ซีลฟอยล์ไม่สนิท',
          responsible: 'Supplier',
          imageUrls: ['https://placehold.co/100x100.png']
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

    expect(screen.getByRole('button', { name: /1\. บันทึกข้อมูลสินค้า/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /1\. บันทึกข้อมูลสินค้า/i })).toHaveAttribute('aria-current', 'step');
    expect(screen.getByRole('button', { name: /2\. วิเคราะห์และออกใบเบิก/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /3\. จัดเตรียมและจ่ายวัสดุ/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /4\. ซ่อมแซมและตรวจรับ/i })).toBeInTheDocument();

    // Back to Overall UI
    const backBtn = screen.getByRole('button', { name: /กลับหน้าภาพรวมเคส/i });
    expect(backBtn).toBeInTheDocument();
    fireEvent.click(backBtn);
    expect(mockOnBack).toHaveBeenCalledTimes(1);

    // Auto-opened on Step 1 because status is 'Pending Analysis'
    expect(screen.getByText(/Step 1: บันทึกข้อมูลสินค้า/i)).toBeInTheDocument();

    // The second step opens the QSMS analysis panel.
    fireEvent.click(screen.getByRole('button', { name: /2\. วิเคราะห์และออกใบเบิก/i }));
    expect(screen.getByText(/Step 2: วิเคราะห์และออกใบเบิก/i)).toBeInTheDocument();
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

    // Awaiting Materials opens the warehouse panel automatically for the user.
    expect(screen.getByText(/Step 3: จัดเตรียมและจ่ายวัสดุ/i)).toBeInTheDocument();
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
    // WPK sees Edit mode for Step 3, with dynamic handover button showing shortage when issuedQty < requestedQty
    expect(screen.getByText(/โหมดเบิกจ่ายของ \(WPK \/ Admin\)/i)).toBeInTheDocument();
    expect(screen.getByText(/ส่งมอบงาน \(มีของขาด\)/i)).toBeInTheDocument();
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

  it('saves item in-place, preserves sequence number, and auto-advances to next incomplete item', async () => {
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

    // After save: toast shows item sequence was saved in-place with missing status and auto-advances
    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.stringContaining('บันทึกรายการที่ 1 แล้ว (ยังขาด: ผู้รับผิดชอบย่อย, รูปภาพหลักฐาน) ➔ ตรวจสอบรายการที่ 2'),
        'info'
      );
    });
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
 
    expect(screen.getByText(/Operations Flow & Bottleneck Monitor/i)).toBeInTheDocument();
    expect(screen.getByText(/รอ QSMS วิเคราะห์/i)).toBeInTheDocument();
    expect(screen.getByText(/รอ WPK เบิกภาชนะ/i)).toBeInTheDocument();
    expect(screen.getByText(/กำลังดำเนินการซ่อม/i)).toBeInTheDocument();
    expect(screen.getByText(/เสร็จสมบูรณ์ 100%/i)).toBeInTheDocument();
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

    expect(screen.getByText(/รอดำเนินการ & เบิกของ/i)).toBeInTheDocument();
    expect(screen.getByText(/รายการงาน Rework/i)).toBeInTheDocument();
    expect(screen.getAllByText(/รอเบิกภาชนะ/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/ติดปัญหา Defend/i).length).toBeGreaterThanOrEqual(1);
  });

  it('renders Local Draft Recovery Banner and recovers saved draft in AddCaseTab', () => {
    const mockDraft = {
      savedAt: '14:00 น.',
      caseSource: 'SFC',
      customerName: 'SFC',
      items: [
        {
          id: 'draft-item-1',
          itemNumber: '61653013A700A',
          itemCode: '40001234',
          itemName: 'สินค้าร่างที่บันทึกค้างไว้',
          amount: 5,
          customerName: 'SFC'
        }
      ]
    };
    window.localStorage.setItem('rework_case_draft_v1', JSON.stringify(mockDraft));

    render(<AddCaseTab onOpenTutorial={vi.fn()} />);

    expect(screen.getByText(/พบข้อมูลร่างในอุปกรณ์นี้/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /กู้คืนข้อมูลร่าง/i })).toBeInTheDocument();
    
    // Click restore
    fireEvent.click(screen.getByRole('button', { name: /กู้คืนข้อมูลร่าง/i }));
    expect(mockShowToast).toHaveBeenCalledWith(expect.stringContaining('กู้คืนข้อมูลร่าง'), 'success');
  });

  it('confirms material receipt handshake in Step 3 of CaseUpdateView', async () => {
    mockCurrentUser.mockReturnValue({ name: 'PDF Tech Officer', role: 'PDF' });

    const mockCase: ReworkCase = {
      id: 'RW-2026-001',
      date: '2026-08-26',
      source: 'SFC',
      caseName: 'เคสรอเบิกของ',
      status: 'Awaiting Materials',
      items: [],
      materialRequests: [
        { id: 'm-1', materialName: 'กล่องใหม่', requestedQty: 10, issuedQty: 10, unit: 'กล่อง', status: 'fulfilled' }
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

    // Awaiting Materials opens the warehouse panel automatically.
    expect(screen.getByText(/Step 3: จัดเตรียมและจ่ายวัสดุ/i)).toBeInTheDocument();
    const handshakeBtn = screen.getByRole('button', { name: /ยืนยันตรวจรับชิ้นส่วนครบชุด/i });
    expect(handshakeBtn).toBeInTheDocument();

    fireEvent.click(handshakeBtn);
    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.stringContaining('ยืนยันตรวจนับและรับมอบชิ้นส่วนครบชุดหน้างานเรียบร้อยแล้ว'),
        'success'
      );
    });
  });

  it('handles material shortage with partial handshake or defect defend blockage when materials are unavailable', async () => {
    mockCurrentUser.mockReturnValue({ name: 'PDF Tech Officer', role: 'PDF' });

    const mockCase: ReworkCase = {
      id: 'RW-2026-002',
      date: '2026-08-26',
      source: 'SFC',
      caseName: 'เคสของขาด',
      status: 'Awaiting Materials',
      items: [],
      materialRequests: [
        { id: 'm-1', materialName: 'กล่องใหม่', requestedQty: 10, issuedQty: 5, unit: 'กล่อง', status: 'partial' },
        { id: 'm-2', materialName: 'แกลลอน 1L', requestedQty: 4, issuedQty: 0, unit: 'ใบ', status: 'unavailable' }
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

    // Full handshake button should NOT be present when materials are lacking
    expect(screen.queryByRole('button', { name: /^ยืนยันตรวจรับชิ้นส่วนครบชุด$/i })).not.toBeInTheDocument();

    // Partial and Blockage buttons must be visible
    const partialBtn = screen.getByRole('button', { name: /รับมอบบางส่วน \(เริ่มซ่อมเท่าที่มี\)/i });
    const defendBtn = screen.getByRole('button', { name: /ของไม่พอซ่อม - แจ้งติดปัญหา/i });
    expect(partialBtn).toBeInTheDocument();
    expect(defendBtn).toBeInTheDocument();

    // Verify derived shortage summary is displayed
    expect(screen.getByText(/พบวัสดุขาด 2 รายการ/i)).toBeInTheDocument();
    expect(screen.getAllByText(/ขาด 5 กล่อง/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/ขาด 4 ใบ/i).length).toBeGreaterThanOrEqual(1);

    // Test partial handshake click
    fireEvent.click(partialBtn);
    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.stringContaining('บันทึกการรับมอบบางส่วน'),
        'warning'
      );
    });
  });

  it('allows PDF to confirm full receipt of remainder when previous receipt was partial and remaining materials are now fulfilled', async () => {
    mockCurrentUser.mockReturnValue({ name: 'PDF Tech Officer', role: 'PDF' });

    const mockCase: ReworkCase = {
      id: 'RW-2026-003',
      date: '2026-08-26',
      source: 'SFC',
      caseName: 'เคสรอรับส่วนที่เหลือ',
      status: 'Awaiting Materials',
      items: [],
      materialReceivedInfo: {
        receivedBy: 'PDF Tech Officer',
        receivedAt: '2026-08-26 10:00 น.',
        isPartial: true,
        status: 'partial',
        missingSummary: 'ขาด 5 กล่อง'
      },
      materialRequests: [
        { id: 'm-1', materialName: 'กล่องใหม่', requestedQty: 10, issuedQty: 10, unit: 'กล่อง', status: 'fulfilled' }
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

    // Initial state: shows partial status and remainder prompt
    expect(screen.getByText(/คลังจ่ายส่วนที่เหลือครบแล้ว • รอตรวจรับ/i)).toBeInTheDocument();
    expect(screen.getByText(/ยืนยันรับมอบบางส่วนแล้ว/i)).toBeInTheDocument();
    expect(screen.getByText(/คลังได้จัดส่งชิ้นส่วนส่วนที่เหลือครบถ้วนแล้ว/i)).toBeInTheDocument();

    // The remainder button should be rendered
    const remainderBtn = screen.getByRole('button', { name: /ยืนยันรับมอบส่วนที่เหลือครบชุด ➔/i });
    expect(remainderBtn).toBeInTheDocument();

    // Clicking remainder confirmation button
    fireEvent.click(remainderBtn);
    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.stringContaining('ตรวจรับชิ้นส่วนส่วนที่เหลือครบชุด 100% เรียบร้อยแล้ว'),
        'success'
      );
    });

    // Verify status badge flips to complete
    await waitFor(() => {
      expect(screen.getByText(/รับมอบครบชุดเรียบร้อย/i)).toBeInTheDocument();
    });
  });

  it('allows PDF to update partial receipt or report Defend Mode blockage while materials remain lacking', async () => {
    mockCurrentUser.mockReturnValue({ name: 'PDF Tech Officer', role: 'PDF' });

    const mockCase: ReworkCase = {
      id: 'RW-2026-004',
      date: '2026-08-26',
      source: 'SFC',
      caseName: 'เคสของยังขาดต่อเนื่อง',
      status: 'Awaiting Materials',
      items: [],
      materialReceivedInfo: {
        receivedBy: 'PDF Tech Officer',
        receivedAt: '2026-08-26 10:00 น.',
        isPartial: true,
        status: 'partial',
        missingSummary: 'ขาด 5 กล่อง'
      },
      materialRequests: [
        { id: 'm-1', materialName: 'กล่องใหม่', requestedQty: 10, issuedQty: 5, unit: 'กล่อง', status: 'partial' }
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

    // Both action buttons should be available for ongoing partial state
    const updateBtn = screen.getByRole('button', { name: /อัปเดตบันทึกรับมอบ/i });
    const defendBtn = screen.getByRole('button', { name: /ของไม่พอซ่อม - แจ้งติดปัญหา/i });
    expect(updateBtn).toBeInTheDocument();
    expect(defendBtn).toBeInTheDocument();

    // Remainder 100% button should NOT be shown yet because shortage remains
    expect(screen.queryByRole('button', { name: /ยืนยันรับมอบส่วนที่เหลือครบชุด ➔/i })).not.toBeInTheDocument();

    // Clicking update receipt
    fireEvent.click(updateBtn);
    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.stringContaining('บันทึกการรับมอบบางส่วน'),
        'warning'
      );
    });
  });

  it('renders QC Verification Gate and allows QSMS sign-off on 100% completion in Step 4', async () => {
    mockCurrentUser.mockReturnValue({ name: 'QSMS Lead', role: 'QSMS' });
    const mockSuccess = vi.fn();

    const mockCase: ReworkCase = {
      id: 'RW-2026-001',
      date: '2026-08-26',
      source: 'SFC',
      caseName: 'เคสซ่อมเสร็จแล้ว',
      status: 'In-Progress',
      items: [
        { id: 'item-1', itemNumber: '61653013A700A', itemCode: '40001234', itemName: 'น้ำมัน', amount: 10, completedBoxes: 10, reason: 'รั่ว', responsible: 'SFC' }
      ]
    };

    render(
      <CaseUpdateView
        caseData={mockCase}
        onBack={vi.fn()}
        onSuccess={mockSuccess}
        onDelete={vi.fn()}
        isAdmin={false}
        isOperator={false}
      />
    );

    // In-Progress cases open the repair panel automatically.
    expect(screen.getByText(/Step 4: ซ่อมแซมและตรวจรับ/i)).toBeInTheDocument();

    expect(screen.getByText(/QC Verification Gate/i)).toBeInTheDocument();
    const qcSignoffBtn = screen.getByRole('button', { name: /ลงนามตรวจรับ QC & ปิดเคส/i });
    expect(qcSignoffBtn).toBeInTheDocument();

    fireEvent.click(qcSignoffBtn);
    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.stringContaining('ตรวจรับงานผ่านเกณฑ์ QC และลงนามปิดเคสสมบูรณ์ 100%'),
        'success'
      );
      expect(mockSuccess).toHaveBeenCalled();
    });
  });
});

