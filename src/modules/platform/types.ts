export type AppView = 'login' | 'portal' | 'rework' | 'roster' | 'rag' | 'guide';

export type PortalAppId = 'rework' | 'roster' | 'rag' | 'guide';

export interface PortalAppDefinition {
  id: PortalAppId;
  title: string;
  subtitle: string;
  description: string;
  route: AppView;
  status: 'active' | 'coming-soon';
  accent: 'blue' | 'gold' | 'purple';
}

export interface ModularizationBoundary {
  area: 'auth' | 'portal' | 'shared-ui' | 'rework-module' | 'transport';
  source: string;
  target: string;
  notes: string;
}
