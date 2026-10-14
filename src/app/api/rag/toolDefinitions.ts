import { Type } from '@google/genai';

export interface ToolDeclaration {
  name: string;
  description: string;
  parameters?: {
    type: unknown;
    properties?: Record<string, unknown>;
    required?: string[];
  };
}

export const ALL_DOCAI_TOOLS: ToolDeclaration[] = [
  {
    name: 'search_rework_case',
    description:
      'Search for a specific rework case by its Case ID (e.g. RW-2026-001, RT-2026-002, RW001, RT002, 001) in the operational database (rework_cases). Returns real-time status, items, defect reasons (stain/leak), amount, and department responsible.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        caseQuery: {
          type: Type.STRING,
          description:
            'The case ID, case number, or reference to search for (e.g. RW001, RW-2026-001, 001, RT002, RW888)',
        },
      },
      required: ['caseQuery'],
    },
  },
  {
    name: 'query_rework_analytics',
    description:
      'Fetch real-time statistics and details about rework cases, defects (leak/รั่ว or stain/เปื้อน), box counts, case status (Pending, In-Progress, Completed), and resolution progress from the operational database.',
  },
  {
    name: 'lookup_item_master',
    description:
      'Lookup item specifications from the central Item Master database (rework_master_items), including item code, item number, oil group, pallet type, boxes per pallet, and shelf life.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        keyword: {
          type: Type.STRING,
          description:
            'Item code or item number to search for (e.g. 40001234 or 61653013A700A)',
        },
      },
    },
  },
  {
    name: 'search_engineering_drawings',
    description:
      'Search engineering drawings and internal master sheets from the engineering_drawings registry table, including drawing numbers, customer names, revisions, part names, item codes, issue dates, and package sizes.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: {
          type: Type.STRING,
          description:
            'Search term for drawing number, customer name, part name, item code, or item number',
        },
      },
    },
  },
  {
    name: 'get_rework_statistics',
    description:
      'Fetch real-time statistics about rework cases from the system database (e.g., total rework items, counts of defects like leak (รั่ว) or stain (เปื้อน)).',
  },
  {
    name: 'search_rework_history',
    description: 'Search recent rework cases from the operational database.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        limit: {
          type: Type.NUMBER,
          description: 'Number of recent cases to fetch (default 5)',
        },
      },
    },
  },
  {
    name: 'get_rework_item_detail',
    description:
      'Get details of a specific rework item by its item code or item number.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        keyword: {
          type: Type.STRING,
          description: 'The item code or item number to search for',
        },
      },
      required: ['keyword'],
    },
  },
];

/**
 * Checks if the caller role is authorized to inspect engineering drawings.
 * OPERATOR role is restricted from accessing engineering drawings.
 */
export function canRoleAccessDrawings(role?: string): boolean {
  if (!role) return false;
  const upper = role.trim().toUpperCase();
  if (upper === 'OPERATOR') return false;
  return true;
}

/**
 * Checks if the caller role is authorized to access organizational analytics & dashboard statistics.
 * OPERATOR role is restricted from viewing overall system analytics.
 */
export function canRoleAccessAnalytics(role?: string): boolean {
  if (!role) return false;
  const upper = role.trim().toUpperCase();
  if (upper === 'OPERATOR' || upper === 'GUEST') return false;
  return true;
}

/**
 * Returns tool declarations tailored to the current module context, cross-module expansion preference,
 * and user role permissions.
 */
export function getScopedToolDeclarations(
  moduleContext?: string,
  expandCrossModule = false,
  role?: string
): ToolDeclaration[] {
  const normModule = (moduleContext || 'rework').toLowerCase();
  const allowDrawings = canRoleAccessDrawings(role);
  const allowAnalytics = canRoleAccessAnalytics(role);

  let tools = [...ALL_DOCAI_TOOLS];

  if (!allowDrawings) {
    tools = tools.filter((t) => t.name !== 'search_engineering_drawings');
  }

  if (!allowAnalytics) {
    tools = tools.filter(
      (t) => t.name !== 'query_rework_analytics' && t.name !== 'get_rework_statistics'
    );
  }

  // If user explicitly expanded cross-module search
  if (expandCrossModule) {
    return tools;
  }

  // Default: Scoped to current module
  if (normModule === 'storage') {
    if (!allowDrawings) return [];
    return tools.filter((t) => t.name === 'search_engineering_drawings');
  }

  // Default for 'rework' (or other modules)
  return tools.filter((t) => t.name !== 'search_engineering_drawings');
}
