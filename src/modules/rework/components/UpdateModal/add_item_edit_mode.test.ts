import { describe, it, expect } from 'vitest';
import type { ReworkItem } from '@/src/services/api';

describe('Add Item in Case Edit Mode Unit Tests', () => {
  it('validates appending a new item to editedItems array', () => {
    const existingItems: ReworkItem[] = [
      {
        id: 'item-1',
        itemNumber: '60001234A',
        itemCode: '40001234',
        itemName: 'Engine Oil A',
        amount: 10,
        reason: 'รั่ว',
        responsible: 'SFC'
      }
    ];

    const addItem = (items: ReworkItem[]): ReworkItem[] => {
      const newItemId = `new-item-${Date.now()}`;
      const newItem: ReworkItem = {
        id: newItemId,
        customerName: items[0]?.customerName || 'SFC',
        itemNumber: '',
        itemCode: '',
        itemName: '',
        amount: 1,
        boxNumber: '1',
        reason: 'รั่ว',
        reasonSubtype: 'รั่วซึม',
        responsible: 'SFC',
        responsibleSubtype: 'PDF',
        details: '',
        verificationStatus: 'idle',
        status: 'Pending',
        completedBoxes: 0,
        imageUrls: []
      };
      return [...items, newItem];
    };

    const updated = addItem(existingItems);
    expect(updated.length).toBe(2);
    expect(updated[1].id).toContain('new-item-');
    expect(updated[1].amount).toBe(1);
  });
});
