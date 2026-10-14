import { describe, it, expect } from 'vitest';
import {
  getScopedToolDeclarations,
  canRoleAccessDrawings,
  canRoleAccessAnalytics,
  ALL_DOCAI_TOOLS,
} from './toolDefinitions';

describe('DocAI Cross-Module Scoping & Authorization Unit Tests', () => {
  describe('canRoleAccessDrawings', () => {
    it('grants drawing access to ADMIN, QSMS, and default authenticated staff', () => {
      expect(canRoleAccessDrawings('ADMIN')).toBe(true);
      expect(canRoleAccessDrawings('QSMS')).toBe(true);
      expect(canRoleAccessDrawings('PDF')).toBe(true);
      expect(canRoleAccessDrawings('WPK')).toBe(true);
      expect(canRoleAccessDrawings('WFG')).toBe(true);
    });

    it('denies drawing access to OPERATOR role', () => {
      expect(canRoleAccessDrawings('OPERATOR')).toBe(false);
      expect(canRoleAccessDrawings('operator')).toBe(false);
      expect(canRoleAccessDrawings('')).toBe(false);
    });
  });

  describe('canRoleAccessAnalytics', () => {
    it('grants analytics access to authorized organizational roles', () => {
      expect(canRoleAccessAnalytics('ADMIN')).toBe(true);
      expect(canRoleAccessAnalytics('QSMS')).toBe(true);
      expect(canRoleAccessAnalytics('WFG')).toBe(true);
      expect(canRoleAccessAnalytics('CS')).toBe(true);
    });

    it('denies analytics access to OPERATOR and unauthenticated Guest', () => {
      expect(canRoleAccessAnalytics('OPERATOR')).toBe(false);
      expect(canRoleAccessAnalytics('operator')).toBe(false);
      expect(canRoleAccessAnalytics('GUEST')).toBe(false);
      expect(canRoleAccessAnalytics('')).toBe(false);
      expect(canRoleAccessAnalytics(undefined)).toBe(false);
    });
  });

  describe('getScopedToolDeclarations', () => {
    it('returns only storage tools when moduleContext is storage and expandCrossModule is false', () => {
      const tools = getScopedToolDeclarations('storage', false, 'ADMIN');
      const toolNames = tools.map((t) => t.name);

      expect(toolNames).toContain('search_engineering_drawings');
      expect(toolNames).not.toContain('search_rework_case');
      expect(toolNames).not.toContain('query_rework_analytics');
      expect(toolNames).not.toContain('get_rework_item_detail');
    });

    it('returns rework & item master tools when moduleContext is rework and expandCrossModule is false', () => {
      const tools = getScopedToolDeclarations('rework', false, 'ADMIN');
      const toolNames = tools.map((t) => t.name);

      expect(toolNames).toContain('search_rework_case');
      expect(toolNames).toContain('query_rework_analytics');
      expect(toolNames).toContain('lookup_item_master');
      expect(toolNames).toContain('get_rework_statistics');
      expect(toolNames).toContain('search_rework_history');
      expect(toolNames).toContain('get_rework_item_detail');
      expect(toolNames).not.toContain('search_engineering_drawings');
    });

    it('expands tools cross-module when expandCrossModule is true for authorized roles', () => {
      const toolsFromRework = getScopedToolDeclarations('rework', true, 'ADMIN');
      const namesRework = toolsFromRework.map((t) => t.name);
      expect(namesRework).toContain('search_engineering_drawings');
      expect(namesRework).toContain('search_rework_case');
      expect(namesRework).toContain('lookup_item_master');

      const toolsFromStorage = getScopedToolDeclarations('storage', true, 'QSMS');
      const namesStorage = toolsFromStorage.map((t) => t.name);
      expect(namesStorage).toContain('search_engineering_drawings');
      expect(namesStorage).toContain('query_rework_analytics');
    });

    it('strictly denies search_engineering_drawings and analytics to OPERATOR even when expandCrossModule is true', () => {
      const tools = getScopedToolDeclarations('rework', true, 'OPERATOR');
      const toolNames = tools.map((t) => t.name);

      expect(toolNames).not.toContain('search_engineering_drawings');
      expect(toolNames).not.toContain('query_rework_analytics');
      expect(toolNames).not.toContain('get_rework_statistics');
      expect(toolNames).toContain('search_rework_case');
    });
  });

  describe('ALL_DOCAI_TOOLS declarations validation', () => {
    it('has valid tool specifications and parameters', () => {
      const drawingTool = ALL_DOCAI_TOOLS.find((t) => t.name === 'search_engineering_drawings');
      expect(drawingTool).toBeDefined();
      expect(drawingTool?.description).toContain('engineering_drawings');

      const caseTool = ALL_DOCAI_TOOLS.find((t) => t.name === 'search_rework_case');
      expect(caseTool).toBeDefined();
      expect(caseTool?.parameters?.required).toContain('caseQuery');
    });
  });
});
