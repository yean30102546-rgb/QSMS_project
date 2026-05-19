export type AppView = 'login' | 'portal' | 'rework' | 'roster';

export type PortalAppId = 'rework' | 'roster';

export interface PortalAppDefinition {
  id: PortalAppId;
  title: string;
  subtitle: string;
  description: string;
  route: AppView;
  status: 'active' | 'coming-soon';
  accent: 'blue' | 'gold';
}

export interface ModularizationBoundary {
  area: 'auth' | 'portal' | 'shared-ui' | 'rework-module' | 'transport';
  source: string;
  target: string;
  notes: string;
}
