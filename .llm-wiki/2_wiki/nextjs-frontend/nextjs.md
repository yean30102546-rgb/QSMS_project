# Title: Next.js Frontend Runtime
[Updated: 2026-05-28]

## 1. Summary & Current Implementation
The frontend is a Next.js `16.2.6` + React `19.0.0` portal using a client-side root shell in `src/App.tsx`.
The shell persists selected view in `sessionStorage`, lazy-loads feature modules, and uses role-aware navigation so operators cannot enter restricted apps such as roster.

## 2. Technical Code Snippet (Best Practice)
```tsx
// src/App.tsx keeps bundle size lower by loading apps on demand.
const WorkspacePortal = dynamic(() => import('./modules/platform/WorkspacePortal'));
const Login = dynamic(() => import('./components/Login').then((m) => m.Login));
const ReworkApp = dynamic(() => import('./modules/rework/ReworkApp').then((m) => m.ReworkApp));
const RosterApp = dynamic(() => import('./modules/roster/RosterApp').then((m) => m.RosterApp));
const RagApp = dynamic(() => import('./modules/rag/RagApp').then((m) => m.RagApp));
```

## 3. App Structure
- `src/app/api/rework/route.ts`: Rework API route with Supabase persistence, server auth, and legacy GAS proxy side effects.
- `src/app/api/roster/route.ts`: Roster API route with Supabase-backed employee/leave/override data and GAS fallback.
- `src/app/api/rag/route.ts`: DocAI RAG API route with Gemini extraction/chat and Supabase pgvector retrieval.
- `src/modules/platform/appRegistry.ts`: portal app registry for `rework`, `roster`, and `rag`.
- `src/services/auth.ts`: password login and client session storage helpers.
- `src/services/api.ts` and `src/services/rosterApi.ts`: client API wrappers that attach token/profile/email metadata to requests.

## 4. Tooling & Scripts
- Available package scripts: `dev`, `build`, `start`, `clean`, and `lint`.
- Test configs exist for Vitest (`vitest.config.ts`) and Playwright (`playwright.config.ts`), but `package.json` currently has no `test` or `test:e2e` scripts.
- TypeScript is configured with `strict: false`, `noImplicitAny: true`, `allowJs: true`, and the Next.js plugin.

## 5. Knowledge Relationships
- Depends On (must read): [[../architecture/system-architecture.md]], [[auth-flow.md]], [[portal-shell.md]]
- Impacted By (changes here affect): [[rework-module.md]], [[roster-module.md]], [[../architecture/multimodal-rag.md]]
- Contradicts (historical mismatch): Older wiki and README notes mention Next.js 15-era assumptions and test scripts that are not present in the current `package.json`.
