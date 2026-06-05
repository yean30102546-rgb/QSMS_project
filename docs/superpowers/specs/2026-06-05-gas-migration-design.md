# GAS to Next.js API Migration & Secure Auth Design

## 1. Goal
Migrate QSMS backend operations away from Google Apps Script (GAS) to a pure Next.js API and Supabase architecture. This achieves two critical objectives:
1. Replaces `sessionStorage` with highly secure HTTP-Only Cookies for JWTs.
2. Removes external dependency on Google Drive and Google Sheets, using Supabase Storage and PostgreSQL as the single source of truth.

## 2. Architecture & Components

### 2.1 Authentication (Server-State JWT)
- **POST `/api/auth/login`**: Authenticates user against `rework_profiles` (or existing mock logic). Generates a signed JWT and sets it as an HTTP-Only, Secure, SameSite=Lax cookie (`qsms_session`).
- **GET `/api/auth/me`**: Reads the `qsms_session` cookie, verifies the JWT signature, and returns the user payload (Name, Role).
- **POST `/api/auth/logout`**: Clears the `qsms_session` cookie.
- **Client Session Restore**: `src/App.tsx` (or auth service) fetches `/api/auth/me` on mount to establish the authentication state, showing a brief loading spinner during the check. All `sessionStorage` token interactions will be stripped.

### 2.2 Storage Migration (Supabase Storage)
- **Image Uploading**: The `uploadImage` case in `src/app/api/rework/route.ts` will use the Supabase JS Admin client to upload Base64 images directly into the `rework_images` bucket.
- **Public URLs**: Images will be accessed via Supabase Public URLs instead of Google Drive URLs.
- **Deprecated Features**: Generation of `caseFolderUrl` and `orFolderUrl` (Google Drive folders) will be completely removed from the system, as flat storage in Supabase negates the need for traditional folder hierarchies.

### 2.3 Database Integrity (Supabase PostgreSQL)
- **Removing `proxyToGAS`**: All operations (`insertCase`, `updateCaseStatus`, `saveItemMaster`) will no longer attempt to synchronize data to Google Sheets via `proxyToGAS`. The function `proxyToGAS` will be deleted entirely.
- Supabase PostgreSQL becomes the exclusive transactional database.

## 3. Data Flow
1. **Login**: User submits credentials -> Next.js verifies -> Next.js issues HTTP-Only Cookie.
2. **Mount**: Browser opens -> React fetches `/api/auth/me` -> Next.js reads cookie -> Returns User -> React sets Auth state.
3. **Upload Evidence**: React sends Base64 image to `/api/rework` (`uploadImage`) -> Next.js uploads to Supabase Storage -> Returns Supabase Public URL.
4. **Submit Case**: React sends case data to `/api/rework` (`insertCase`) -> Next.js writes exclusively to Supabase PostgreSQL -> Success (no GAS sync).

## 4. Error Handling
- **Invalid/Expired Cookie**: `/api/auth/me` returns 401. React clears local state and redirects to `/login`.
- **Storage Failure**: Supabase image upload aborts, throws standard 500 error to the client, triggering the existing UI error boundaries to prevent orphaned database records.

## 5. Scope Boundaries
- **Exclusions**: LINE Notifications are out of scope for this migration. RAG Async processing is out of scope and remains deferred to a future plan.
