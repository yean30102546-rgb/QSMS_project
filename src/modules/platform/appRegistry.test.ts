import { describe, it, expect } from 'vitest';
import { portalAppRegistry, modularizationBoundaries, getPortalAppById, getActivePortalApps } from './appRegistry';

describe('Platform App Registry & Helpers', () => {
  it('contains expected registered portal apps', () => {
    expect(portalAppRegistry).toHaveLength(4);
    const appIds = portalAppRegistry.map(app => app.id);
    expect(appIds).toEqual(['rework', 'storage', 'rag', 'guide']);
  });

  it('retrieves portal app by ID via getPortalAppById', () => {
    const reworkApp = getPortalAppById('rework');
    expect(reworkApp).toBeDefined();
    expect(reworkApp?.title).toBe('QSMS Rework');
    expect(reworkApp?.route).toBe('rework');

    const nonExistentApp = getPortalAppById('unknown-app');
    expect(nonExistentApp).toBeUndefined();
  });

  it('filters active portal apps via getActivePortalApps', () => {
    const activeApps = getActivePortalApps();
    expect(activeApps.length).toBeGreaterThan(0);
    activeApps.forEach(app => {
      expect(app.status).toBe('active');
    });
  });

  it('defines valid modularization boundaries', () => {
    expect(modularizationBoundaries.length).toBeGreaterThan(0);
    modularizationBoundaries.forEach(boundary => {
      expect(boundary.area).toBeTruthy();
      expect(boundary.source).toBeTruthy();
      expect(boundary.target).toBeTruthy();
    });
  });
});
