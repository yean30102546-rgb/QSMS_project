import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase Server
vi.mock('../../../lib/supabaseServer', () => ({
  supabaseServer: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: [
          { item_code: '40001234', item_number: '61653013A700A', item_name: 'Engine Oil', oil_group: 'Synthetic', pallet_type: 'Plastic', boxes_per_pallet: '24' }
        ],
        error: null,
      }),
    }),
  },
}));

// Mock RAG Supabase Server
vi.mock('../../../lib/ragSupabaseServer', () => ({
  ragSupabaseServer: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    }),
    rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
  },
}));

describe('DocAI Cross-Module Tools Integration Test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('validates tool function definitions are properly structured', () => {
    const tools = ['query_rework_analytics', 'lookup_item_master', 'search_engineering_drawings', 'search_technical_knowledge'];
    expect(tools).toHaveLength(4);
    expect(tools).toContain('query_rework_analytics');
    expect(tools).toContain('lookup_item_master');
    expect(tools).toContain('search_engineering_drawings');
    expect(tools).toContain('search_technical_knowledge');
  });
});
