export type AppView = 'login' | 'forgot-password' | 'portal' | 'rework' | 'storage' | 'rag' | 'guide' | 'admin';

export type PortalAppId = 'rework' | 'storage' | 'rag' | 'guide' | 'admin';

export interface PortalAppDefinition {
  id: PortalAppId;
  title: string;
  subtitle: string;
  description: string;
  route: AppView;
  status: 'active' | 'coming-soon';
  accent: 'blue' | 'gold' | 'purple' | 'red' | 'emerald' | 'indigo';
  requiredRole?: string[];
}

export interface ModularizationBoundary {
  area: 'auth' | 'portal' | 'shared-ui' | 'rework-module' | 'storage-module' | 'rag-module' | 'guide-module' | 'drawings-module' | 'transport';
  source: string;
  target: string;
  notes: string;
}
