import { describe, it, expect } from 'vitest';

describe('Global DocAI Access & Item PDF File Cards Unit Tests', () => {
  it('validates Ctrl+K and Cmd+K keyboard shortcut detection', () => {
    const isShortcutTrigger = (e: { ctrlKey: boolean; metaKey: boolean; key: string }) => {
      return (e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K');
    };

    expect(isShortcutTrigger({ ctrlKey: true, metaKey: false, key: 'k' })).toBe(true);
    expect(isShortcutTrigger({ ctrlKey: false, metaKey: true, key: 'K' })).toBe(true);
    expect(isShortcutTrigger({ ctrlKey: false, metaKey: false, key: 'a' })).toBe(false);
  });

  it('validates PDF document file URL regex parsing', () => {
    const sampleLine = 'File: [📄 Drawing_40001234.pdf](/api/drawings?action=view&key=drawings/123.pdf)';
    const fileLinkRegex = /\[📄?\s*(.*?)\]\((.*?\/api\/drawings.*?)\)/g;
    const match = fileLinkRegex.exec(sampleLine);

    expect(match).not.toBeNull();
    if (match) {
      expect(match[1]).toBe('Drawing_40001234.pdf');
      expect(match[2]).toBe('/api/drawings?action=view&key=drawings/123.pdf');
    }
  });
});
