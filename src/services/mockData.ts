/**
 * Mock Data for Development/Testing
 * When GAS backend is not available, use mock data for UI testing
 */

export const MOCK_CASES = [
  {
    id: 'REWORK-2024-001',
    date: '2024-04-20',
    caseSource: 'SFC',
    status: 'Pending',
    items: [
      {
        id: 'item-1',
        itemNumber: 'SFC-001',
        itemName: 'Bottle Assembly',
        itemCode: 'BA-100',
        amount: 5,
        reason: 'รั่ว',
        reasonSubtype: 'รั่วซึม',
        responsible: 'SFC',
        responsibleSubtype: 'PDB',
        details: 'Leak detected in cap assembly',
      },
    ],
  },
  {
    id: 'REWORK-2024-002',
    date: '2024-04-21',
    caseSource: 'Supplier',
    status: 'In-Progress',
    items: [
      {
        id: 'item-2',
        itemNumber: 'SFC-002',
        itemName: 'Cap',
        itemCode: 'CAP-50',
        amount: 3,
        reason: 'แตกตะเข็บ',
        reasonSubtype: '',
        responsible: 'Supplier',
        responsibleSubtype: 'PJW',
        details: 'Seam broken',
      },
    ],
  },
  {
    id: 'REWORK-2024-003',
    date: '2024-04-15',
    caseSource: 'SFC',
    status: 'Completed',
    items: [
      {
        id: 'item-3',
        itemNumber: 'SFC-003',
        itemName: 'Label',
        itemCode: 'LBL-30',
        amount: 10,
        reason: 'ขวดเปื้อน',
        reasonSubtype: '',
        responsible: 'SFC',
        responsibleSubtype: 'PDF',
        details: 'Bottle stained - cleaning completed',
      },
    ],
  },
];

export const MOCK_ITEM_MASTER = [
  { itemNumber: 'SFC-001', itemName: 'Bottle Assembly' },
  { itemNumber: 'SFC-002', itemName: 'Cap' },
  { itemNumber: 'SFC-003', itemName: 'Label' },
  { itemNumber: 'SFC-004', itemName: 'Foil' },
  { itemNumber: 'SFC-005', itemName: 'Box' },
];

export const MOCK_DASHBOARD_STATS = {
  totalCases: 3,
  pendingCases: 1,
  inProgressCases: 1,
  completedCases: 1,
  totalItems: 18,
  defectReasons: {
    'รั่ว': 5,
    'แตกตะเข็บ': 3,
    'ขวดเปื้อน': 10,
  },
  responsibleCounts: {
    SFC: 15,
    Supplier: 3,
  },
  averageResolutionDays: 5,
};
