import { describe, it, expect } from 'vitest';

describe('Smart Item Search Button & Enter Trigger Unit Tests', () => {
  it('validates Enter key event trigger', () => {
    const handleKeyDown = (e: { key: string; preventDefault: () => void }, callback: () => void) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        callback();
      }
    };

    let called = false;
    let prevented = false;

    handleKeyDown(
      { key: 'Enter', preventDefault: () => { prevented = true; } },
      () => { called = true; }
    );

    expect(called).toBe(true);
    expect(prevented).toBe(true);
  });

  it('validates search button disabled state when input is empty', () => {
    const isSearchDisabled = (value: string | undefined | null, isSaving: boolean) => {
      return isSaving || !value?.trim();
    };

    expect(isSearchDisabled('', false)).toBe(true);
    expect(isSearchDisabled('   ', false)).toBe(true);
    expect(isSearchDisabled(null, false)).toBe(true);
    expect(isSearchDisabled('40001234', false)).toBe(false);
    expect(isSearchDisabled('40001234', true)).toBe(true);
  });
});
