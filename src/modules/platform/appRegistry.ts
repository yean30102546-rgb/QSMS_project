import type { ModularizationBoundary, PortalAppDefinition } from './types';

export const portalAppRegistry: PortalAppDefinition[] = [
  {
    id: 'rework',
    title: 'QSMS Rework',
    subtitle: 'Quality control and case resolution',

    description: 'Manage rework cases, images, valuations, and role-based workflow from one operational workspace.',
    route: 'rework',
    status: 'active',
    accent: 'blue',
  },
  {
    id: 'roster',
    title: 'QSMS Roster',
    subtitle: 'Workforce schedule and shift planning',
    description: 'Manage Saturday rotation plans, swaps, holidays, and overtime directly from the central portal.',
    route: 'roster',
    status: 'active',
    accent: 'gold',
  },
];

export const modularizationBoundaries: ModularizationBoundary[] = [
  {
    area: 'auth',
    source: 'src/components/Login.tsx + src/services/auth.ts',
    target: 'platform auth entry',
    notes: 'Login UI can be promoted to the root entry flow while keeping token issuance and session storage unchanged.',
  },
  {
    area: 'portal',
    source: 'new feature',
    target: 'central control workspace',
    notes: 'Portal should be a neutral launcher layer that knows app metadata but not business logic.',
  },
  {
    area: 'shared-ui',
    source: 'src/index.css + selected shared UI primitives',
    target: 'shared Apple-inspired design system',
    notes: 'Theme tokens, buttons, shells, and typography rules should be reusable across Rework and Roster.',
  },
  {
    area: 'rework-module',
    source: 'src/App.tsx + src/components/layout/MainLayout.tsx + src/components/tabs/*',
    target: 'feature module: rework',
    notes: 'Current Rework application shell is feature-specific and should move behind a dedicated entry point.',
  },
  {
    area: 'transport',
    source: 'src/app/api/rework/route.ts + src/services/api.ts',
    target: 'shared transport contract',
    notes: 'Proxy and API contract remain shared platform infrastructure even after the UI is modularized.',
  },
];
