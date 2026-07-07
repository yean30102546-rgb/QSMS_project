# Title: RAG Streaming, Function Calling & Impeccable UI Lessons
[Updated: 2026-06-15]

## 1. Summary & Current Implementation
During the implementation of Phase 2 and 3 upgrades for QSMS DocAI, we added true streaming responses (SSE), hybrid search (combining pgvector and full-text search), chat session memory, suggestion chips, and user feedback logs. This document captures the architectural insights, gotchas, and solutions.

## 2. Key Learnings & Technical Solutions

### 1. Server-Sent Events (SSE) Streaming in Next.js App Router
- **Issue**: Standard JSON responses create a high perceived latency for the operator (waiting 5-10 seconds for the entire answer).
- **Solution**: We implemented `generateContentStream` on the backend and returned a `ReadableStream` with `TextEncoder`.
- **Gotcha**: The SSE message format requires a `data: ` prefix and two newlines (`\n\n`) at the end of each block. If the newlines are omitted or if only a single newline is sent, client-side stream readers (e.g., standard `ReadableStreamDefaultReader`) may batch events together, causing parse failures.
- **Client Parsing Pattern**:
  ```typescript
  const reader = res.body?.getReader();
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunkText = decoder.decode(value, { stream: true });
    const lines = chunkText.split('\n\n');
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const payload = JSON.parse(line.replace('data: ', ''));
        if (payload.type === 'text') responseText += payload.data;
      }
    }
  }
  ```

### 2. Eliminating Duplicates in Hybrid Search RPC
- **Issue**: Combining vector search matches and full-text keyword matches using `UNION ALL` can return duplicate document chunks if a chunk matches both semantic meaning and keyword query.
- **Solution**: Use `select distinct on (id)` to filter duplicates, sorting by the highest score in the combined subquery:
  ```sql
  select distinct on (id) id, document_id, content, score
  from (
    select id, document_id, content, score from vector_matches
    union all
    select id, document_id, content, score from keyword_matches
  ) combined
  order by id, score desc;
  ```

### 3. Hidden JSON block for Suggestion Chips
- **Issue**: We need suggestion chips from the AI, but showing raw JSON to users is unacceptable.
- **Solution**: Instruct the model to output a `json` code block at the very end. The frontend extracts this block via regex and strips it before rendering the final text:
  ```typescript
  const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
  if (jsonMatch) {
    const parsed = JSON.parse(jsonMatch[1]);
    const suggestions = parsed.suggested_questions;
    responseText = responseText.replace(jsonMatch[0], '').trim();
  }
  ```

### 4. Sliding Context Window for Token Safety
- **Issue**: Storing complete long-running histories in memory accumulates high token costs and risks hitting model context limits.
- **Solution**: We implemented a client-side sliding window in `RagApp.tsx`, sending only the last 5 messages to the API. This maintains sufficient context for follow-up questions while capping token overhead.

## 3. Gemini Function Calling within SSE Streams
- **Issue**: Standard Gemini Function Calling returns a tool call response that interrupts normal text streaming.
- **Solution**: We implemented the `@google/genai` SDK `tools` and `systemInstruction` options. When the LLM decides to call `get_rework_statistics`, it returns a `functionCall`. The backend natively executes the query against Supabase, formats the JSON string, and then pushes the `functionResponse` back into `generateContentStream` history to resume the generation flow without breaking the SSE structure.
- **Gotcha**: The SSE parser must be able to ignore or properly handle intermediate function call metadata so the frontend doesn't render raw JSON tools.

## 4. Impeccable UI & Product-Grade Animation
- **Issue**: Default AI UI elements often feel "slop-like" or "playful" (e.g., bouncy spring animations, chat bubbles scaling up).
- **Solution**: Adopted the Impeccable Design guidelines for the `RagApp`. 
  - Converted the interface from a centered modal to a robust **Slide-in Sidebar Overlay**.
  - Replaced `type: 'spring'` with exponential `ease: [0.16, 1, 0.3, 1]` for solid, professional transitions.
  - Added global hotkey (`Ctrl+K` at `App.tsx` level) for power-user accessibility across all modules without having to navigate back to the Portal.

## 5. Gemini 3.1 Flash Lite Model Transition
- **Issue**: Large document parsing ingestion previously used `gemini-2.5-flash` which is a heavier model. Under high document load or rapid user uploads, this triggered Gemini's free-tier rate limits and quota exhaustion (e.g., `RESOURCE_EXHAUSTED` / `429` error).
- **Solution**: Changed the primary ingestion parsing model in the `ingest` route to `gemini-3.1-flash-lite`. It is faster, more cost-efficient, consumes fewer tokens, and is less likely to hit aggressive rate-limiting, while keeping `gemini-2.0-flash` as a reliable fallback.
- **Gotcha**: Multimodal parsing inputs (base64 image/PDF data and prompt instructions) are fully supported on `gemini-3.1-flash-lite` just as they were on `gemini-2.5-flash`, meaning no ingestion prompt changes were required.

## 6. Knowledge Relationships
- Depends On (must read): [[../architecture/rag-module-nextjs.md]]
- Impacted By (changes affect): `src/modules/rag/RagApp.tsx`, `src/app/api/rag/route.ts`
