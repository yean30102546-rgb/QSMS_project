# Title: QSMS Project Overview
[Updated: 2026-07-02]

## 1. Summary & Current Implementation
QSMS is a Next.js 16 App Router portal for quality operations. The root client shell (`src/App.tsx`) restores server-state auth from an HTTP-only `auth_token` cookie, routes users through the Workspace Portal, and lazy-loads the active modules: Rework, Roster, Guide, and DocAI RAG.

The operational backend is mostly Supabase through Next.js route handlers. Google Apps Script remains only as a compatibility sidecar/fallback for selected legacy flows. Rework is the main workflow, Roster handles workforce scheduling, Guide provides interactive tutorials, and DocAI RAG uses Gemini plus Jina embeddings with Supabase `pgvector`.

## 2. Technical Code Snippet (Best Practice)
```typescript
// src/App.tsx
const WorkspacePortal = dynamic(() => import('./components/apps/portal/WorkspacePortal').then(mod => mod.WorkspacePortal), { ssr: false });
const RosterApp = dynamic(() => import('./modules/roster/RosterApp').then(mod => mod.RosterApp), { ssr: false });
const ReworkApp = dynamic(() => import('./modules/rework/ReworkApp').then(mod => mod.ReworkApp), { ssr: false });
const GuideApp = dynamic(() => import('./modules/guide/GuideApp').then(mod => mod.GuideApp), { ssr: false });
const RagApp = dynamic(() => import('./modules/rag/RagApp').then(mod => mod.RagApp), { ssr: false });
```

Primary boundaries to inspect before changes:
- `src/App.tsx`: auth restore, view routing, role gating, global RAG hotkey.
- `src/modules/platform/appRegistry.ts`: portal app metadata and modularization notes.
- `src/app/api/auth/*/route.ts`: PIN/mock login, logout, and session restore.
- `src/app/api/rework/route.ts`: Rework actions, Supabase writes, storage uploads, legacy compatibility.
- `src/app/api/roster/route.ts`: Roster month data, employee/override/leave mutations, GAS fallback.
- `src/app/api/rag/route.ts`: document ingestion, hybrid search, SSE chat, feedback logging.
- `src/lib/serverAuth.ts`: JWT signing/verification and backend permission checks.
- `src/services/api.ts`, `src/services/rosterApi.ts`, `src/services/auth.ts`: client transport contracts.

Core tables/storage by module:
- Rework: `rework_cases`, `rework_items`, `rework_master_items`, `rework_logs`, Supabase Storage bucket `rework_images`.
- Roster: `roster_employees`, `roster_overrides`, `roster_leaves`.
- RAG: `rag_documents`, `rag_document_chunks`, `rag_feedback`, Supabase Storage bucket `rag_images`, RPC `hybrid_search_chunks`.

## 3. Knowledge Relationships
- Depends On (must read): [[nextjs-supabase-auth-storage.md]], [[rag-module-nextjs.md]], [[../lessons-learned/item-master-upsert-flow.md]], [[../lessons-learned/rag-ui-and-hybrid-search.md]]
- Impacted By (changes affect): `src/App.tsx`, `src/app/api/*/route.ts`, `src/services/*`, `src/modules/*`
- Contradicts (historical mismatch): [Conflict Note] Some older docs/README text still describe Google Sheets/Drive as the main backend. Current code uses Supabase as the primary operational database/storage, while GAS remains a compatibility sidecar/fallback in selected flows.

## 4. Operational Notes
- Use `npm run lint` for TypeScript validation, `npm run test:unit` for Vitest, and `npm run test:e2e` for Playwright.
- Do not use `any`; prefer `unknown` and narrow the type.
- Treat `.env.example` carefully: it currently contains commented example values that look like real secrets and should be sanitized before public sharing.
- Current worktree may be dirty; avoid reverting existing user changes.
