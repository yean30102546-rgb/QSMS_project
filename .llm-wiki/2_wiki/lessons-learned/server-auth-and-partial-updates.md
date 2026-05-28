# Title: Server Auth And Partial Updates
[Updated: 2026-05-22]

## 1. Summary & Current Implementation
Next.js API routes for Rework and Roster use the Supabase service-role key, so they now verify the GAS-issued JWT on the server before reading or writing data.
`updateCaseStatus` also loads the current `rework_cases` row and merges only the fields present in the request, preserving existing valuation and OR-file data during partial saves.

## 2. Technical Code Snippet (Best Practice)
```typescript
// src/lib/serverAuth.ts
const auth = await requireServerAuth(body);
assertPermission(auth, 'update_status');

// src/app/api/rework/route.ts
const { data: existingCase } = await supabaseServer
  .from('rework_cases')
  .select('total_rework_cost, labor_rate, materials, or_files_urls')
  .eq('id', caseId)
  .maybeSingle();

await supabaseServer.from('rework_cases').update({
  total_rework_cost: reworkCost ?? updates.reworkCost ?? existingCase?.total_rework_cost,
  labor_rate: updates.laborRate ?? existingCase?.labor_rate,
  materials: updates.materials ?? existingCase?.materials ?? [],
  or_files_urls: gasResponse.data?.orFilesUrls ?? updates.orFilesUrls ?? existingCase?.or_files_urls ?? [],
});
```

## 3. Knowledge Relationships
Depends On: [[gas-backend/gas-api.md]] (GAS signs the JWT with `AUTH_TOKEN_SECRET`)

Depends On: [[nextjs-frontend/roles.md]] (server permissions mirror the role matrix)

Impacted By: [[nextjs-frontend/auth-flow.md]] (browser login still stores the GAS-issued JWT in sessionStorage)

Contradicts: trusting `userRole` or `authProfile` from the client for privileged Supabase writes; server-side verification is now required
