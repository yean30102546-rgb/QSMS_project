import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CaseListTable } from './CaseListTable';
import type { ReworkCase } from '../../services/api';
import React from 'react';

const mockCase: ReworkCase = {
  id: 'RW123-2024',
  date: '2024-03-10',
  timestamp: '2024-03-10T10:00:00Z',
  source: 'SFC',
  status: 'Pending',
  items: [
    {
      id: 'item1',
      itemNumber: '60000001',
      itemCode: '40000001',
      itemName: 'Test Item 1',
      amount: 10,
      reason: 'รั่ว',
      reasonSubtype: 'รั่วซึม',
      responsible: 'SFC',
    }
  ]
};

describe('CaseListTable', () => {
  it('renders a list of cases', () => {
    const mockOnRowClick = vi.fn();
    render(<CaseListTable cases={[mockCase]} onRowClick={mockOnRowClick} />);

    // Check case id
    expect(screen.getByText('RW123-2024')).toBeInTheDocument();
    
    // Check item name
    expect(screen.getByText('Test Item 1')).toBeInTheDocument();
    
    // Check status pill
    expect(screen.getByText('รอดำเนินการ')).toBeInTheDocument();

    // Check reason and subtype
    expect(screen.getByText('รั่ว (รั่วซึม)')).toBeInTheDocument();
  });

  it('renders correctly when items array is empty', () => {
    const emptyCase = { ...mockCase, items: [] };
    render(<CaseListTable cases={[emptyCase]} onRowClick={vi.fn()} />);
    
    expect(screen.getByText('N/A')).toBeInTheDocument();
  });

  it('handles multiple items correctly', () => {
    const multipleItemsCase: ReworkCase = {
      ...mockCase,
      items: [
        mockCase.items[0],
        {
          id: 'item2',
          itemNumber: '60000002',
          itemCode: '40000002',
          itemName: 'Test Item 2',
          amount: 5,
          reason: 'เปื้อน',
          responsible: 'SFC',
        }
      ]
    };

    render(<CaseListTable cases={[multipleItemsCase]} onRowClick={vi.fn()} />);

    // Should show first item name + (+1 รายการ)
    expect(screen.getByText('Test Item 1 (+1 รายการ)')).toBeInTheDocument();
    
    // Should show both reasons combined
    expect(screen.getByText('รั่ว (รั่วซึม), เปื้อน')).toBeInTheDocument();
    
    // Total amount should be 15
    expect(screen.getByText('15 กล่อง')).toBeInTheDocument();
  });
});
