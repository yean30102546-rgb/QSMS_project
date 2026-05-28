# Title: QSMS Portal System Architecture
[Updated: 2026-05-28]

## 1. Summary & Current Implementation
QSMS is a modular Next.js portal with four runtime views: `portal`, `rework`, `roster`, and `rag`.
`src/App.tsx` owns client-side shell state, session restore, role-aware navigation, and lazy module loading.
Server API routes own privileged data access: Supabase is the primary database, while legacy Google Apps Script remains for Drive uploads, Sheets/notification compatibility, and selected fallback actions.

## 2. Technical Code Snippet (Best Practice)
```ts
// Client shell loads modules only when selected.
const ReworkApp = dynamic(() => import('./modules/rework/ReworkApp').then((m) => m.ReworkApp));
const RosterApp = dynamic(() => import('./modules/roster/RosterApp').then((m) => m.RosterApp));
const RagApp = dynamic(() => import('./modules/rag/RagApp').then((m) => m.RagApp));

// Server API routes should authenticate before touching protected data.
const auth = await requireServerAuth(body);
assertPermission(auth, 'update_status');
```

## 3. Runtime Modules
- `WorkspacePortal`: landing shell driven by `src/modules/platform/appRegistry.ts`.
- `ReworkApp`: complaint/rework case workflow, item verification, master data, image access, and legacy GAS media integration.
- `RosterApp`: employee, override, leave, and calendar-style roster operations backed by Supabase with GAS fallback for legacy actions.
- `RagApp`: QSMS DocAI RAG for PDF/XLSX ingestion and chat over embedded document chunks.

## 4. Backend & Data Flow
- `/api/rework`: supports public overview and password login; protected actions use `requireServerAuth`, Supabase tables, and GAS proxy for Drive/notification side effects.
- `/api/roster`: requires `requireServerAuth`; reads/writes Supabase roster tables and proxies unsupported legacy actions to GAS.
- `/api/rag`: ingests and chats with Gemini plus Supabase pgvector; current route does not call `requireServerAuth`, so access control should be reviewed before production exposure.
- `src/lib/serverAuth.ts`: verifies HS256 JWTs from `AUTH_TOKEN_SECRET` or `GAS_AUTH_TOKEN_SECRET`, maps `WFG`/`PDB` to `OPERATOR`, checks expiry/type/profile, and logs email mismatch without failing the request.

## 5. Tech Stack Snapshot
- Frontend: Next.js `16.2.6`, React `19.0.0`, TypeScript `~5.8.2`, Tailwind CSS v4, Radix UI primitives, Motion, Recharts.
- Backend: Next.js App Router route handlers, Supabase JS `^2.106.1`, PostgreSQL, `pgvector`, Google Apps Script integration.
- AI/RAG: `@google/genai`, Gemini `gemini-1.5-flash`, embeddings with `text-embedding-004`, Supabase RPC `match_document_chunks`.
- Tooling: ESLint 9, Vitest + jsdom config, Playwright config, but `package.json` currently exposes only `dev`, `build`, `start`, `clean`, and `lint` scripts.
- Configuration: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `AUTH_TOKEN_SECRET`, `GAS_*`, and `GEMINI_API_KEY`.

## 6. Knowledge Relationships
- Depends On (must read): [[../nextjs-frontend/nextjs.md]], [[../nextjs-frontend/auth-flow.md]], [[supabase-hybrid-migration.md]], [[multimodal-rag.md]]
- Impacted By (changes here affect): [[../nextjs-frontend/rework-module.md]], [[../nextjs-frontend/roster-module.md]], [[../nextjs-frontend/portal-shell.md]]
- Contradicts (historical mismatch): Older notes that describe the app as Next.js 15-only or Google Sheets as the sole primary store are outdated; the current implementation is Next.js 16 with Supabase as the primary operational database and GAS as a compatibility/media sidecar.
