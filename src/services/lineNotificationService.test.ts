import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LineNotificationService } from './lineNotificationService';

describe('LineNotificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('builds a valid Dark-Mode Flex Message bubble for a RW case', () => {
    const flex = LineNotificationService.buildCaseAlertFlexMessage({
      caseId: 'RW-2026-001',
      caseType: 'RW',
      title: 'งานแก้ไขแกลลอนรั่ว SFC Line 2',
      status: 'In-Progress',
      itemsCount: 3,
      totalAmount: 1500,
      reporter: 'Somchai (SFC)',
      webUrl: 'https://qsms.internal/cases/RW-2026-001',
    });

    expect(flex.type).toBe('flex');
    expect(flex.altText).toContain('RW-2026-001');
    expect(flex.contents.type).toBe('bubble');
    expect(flex.contents.header.backgroundColor).toBe('#070B16');

    // Check caseId in header
    const headerContents = flex.contents.header.contents;
    expect(headerContents[1].text).toBe('RW-2026-001');

    // Check button in footer
    const footerButton = flex.contents.footer.contents[0];
    expect(footerButton.type).toBe('button');
    expect(footerButton.action.uri).toBe('https://qsms.internal/cases/RW-2026-001');
  });

  it('builds a valid Flex Message bubble for a RT (Customer) case', () => {
    const flex = LineNotificationService.buildCaseAlertFlexMessage({
      caseId: 'RT-2026-089',
      caseType: 'RT',
      title: 'ลูกค้ารายงานสินค้าเปื้อน',
      status: 'Completed',
      itemsCount: 1,
      totalAmount: 200,
      reporter: 'CS Team',
    });

    expect(flex.altText).toContain('RT-2026-089');
    expect(flex.contents.header.contents[0].contents[0].color).toBe('#38BDF8'); // Cyan for RT
    expect(flex.contents.header.contents[0].contents[1].color).toBe('#10B981'); // Emerald for Completed
  });
});
