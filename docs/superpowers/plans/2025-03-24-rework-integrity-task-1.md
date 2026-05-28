# QSMS Rework Integrity Implementation - Task 1 Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update the `verifyItem` backend action to detect and report identity conflicts where `itemNumber` and `itemCode` belong to different master items.

**Architecture:** Modify the `POST` handler in the Next.js API route to query up to 2 records from `rework_master_items` and compare their IDs if both search criteria were provided.

**Tech Stack:** Next.js (App Router), Supabase (PostgREST API).

---

### Task 1: Backend Conflict Detection

**Files:**
- Modify: `src/app/api/rework/route.ts`

- [ ] **Step 1: Update the verifyItem case in src/app/api/rework/route.ts**

Modify the `verifyItem` case to fetch up to 2 records and detect if `itemNumber` and `itemCode` point to different records.

```typescript
      case 'verifyItem': {
        const { itemNumber, itemCode } = body;

        const conditions: string[] = [];
        if (itemNumber) conditions.push(`item_number.eq.${itemNumber}`);
        if (itemCode) conditions.push(`item_code.eq.${itemCode}`);

        if (conditions.length === 0) {
          return NextResponse.json(
            { success: true, data: { found: false } },
            { headers: { 'Content-Type': 'application/json; charset=utf-8' } }
          );
        }

        const { data, error } = await supabaseServer
          .from('rework_master_items')
          .select('*')
          .or(conditions.join(','))
          .limit(2); // Detect if multiple items match

        if (error) throw error;

        if (!data || data.length === 0) {
          return NextResponse.json(
            { success: true, data: { found: false } },
            { headers: { 'Content-Type': 'application/json; charset=utf-8' } }
          );
        }

        // Detect identity conflict
        if (itemNumber && itemCode && data.length > 1) {
          const matchByNumber = data.find(r => r.item_number === itemNumber);
          const matchByCode = data.find(r => r.item_code === itemCode);

          if (matchByNumber && matchByCode && matchByNumber.id !== matchByCode.id) {
            return NextResponse.json(
              { success: true, data: { found: true, conflict: true } },
              { headers: { 'Content-Type': 'application/json; charset=utf-8' } }
            );
          }
        }

        const record = data[0];
        return NextResponse.json(
          {
            success: true,
            data: {
              found: true,
              id: record.id,
              itemName: record.item_name,
              itemCode: record.item_code,
              itemNumber: record.item_number
            }
          },
          { headers: { 'Content-Type': 'application/json; charset=utf-8' } }
        );
      }
```

- [ ] **Step 2: Verify the logic manually**

Review the logic to ensure:
1. It returns `found: false` if no records match.
2. It returns `conflict: true` only if `itemNumber` and `itemCode` are both provided and they match different records.
3. It returns the record details if there's no conflict.

- [ ] **Step 3: Commit the changes**

Run:
```bash
git add src/app/api/rework/route.ts
git commit -m "feat(api): add identity conflict detection to verifyItem"
```
