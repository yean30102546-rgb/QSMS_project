# Title: Next.js RAG Module Architecture
[Updated: 2026-05-29]

## 1. Summary & Current Implementation
QSMS RAG is a Next.js portal module for unstructured document search. The backend uses the Google Gen AI SDK (`gemini-2.5-flash` for extraction, `gemini-3.1-flash-lite` for streaming chat) and Supabase PostgreSQL with `pgvector` for storage. 

Key features implemented in the current system:
- **Session Conversation Memory**: Passes client-side chat history (last 5 messages) to Gemini to allow follow-up questions.
- **Hybrid Search**: Combines Cosine Similarity vector matching with keyword-based Full-Text Search in PostgreSQL (`hybrid_search_chunks` function).
- **Streaming & SSE**: Streams responses in real-time from the backend to the React frontend using Server-Sent Events (SSE).
- **Suggestion Chips**: Generates 3 contextual follow-up questions from the LLM parsed from a hidden trailing JSON block.
- **RAG Feedback Loop**: Captures 👍/👎 operator feedback in a `rag_feedback` operational database table.
- **Source Citation (Phase 4 Plan)**: Appends metadata sources (filenames and content snippets) directly to the SSE stream and renders them in an expandable accordion badge under Nong Beepa's responses.

## 2. Technical Code Snippet (Best Practice)

### Hybrid Search RPC Function
```sql
create or replace function hybrid_search_chunks (
  query_text text,
  query_embedding vector(768),
  match_count int
)
returns table (
  id uuid,
  document_id uuid,
  content text,
  image_urls text[],
  similarity float
) language sql stable as $$
  with vector_matches as (
    select id, document_id, content, image_urls, 1 - (embedding <=> query_embedding) as score
    from rag_document_chunks
    order by embedding <=> query_embedding limit match_count
  ),
  keyword_matches as (
    select id, document_id, content, image_urls,
      ts_rank(to_tsvector('english', content), plainto_tsquery('english', query_text)) as score
    from rag_document_chunks
    where to_tsvector('english', content) @@ plainto_tsquery('english', query_text)
    order by score desc limit match_count
  )
  select distinct on (id) id, document_id, content, image_urls, score as similarity
  from (
    select * from vector_matches union all select * from keyword_matches
  ) combined
  order by id, score desc limit match_count;
$$;
```

### SSE Streaming Response (API Side)
```typescript
const stream = await ai.models.generateContentStream({
  model: 'gemini-3.1-flash-lite',
  contents: [
    { role: 'user', parts: [{ text: systemPrompt }] },
    ...historyContents,
    { role: 'user', parts: [{ text: `คำถามปัจจุบัน: ${message}` }] }
  ]
});

const encoder = new TextEncoder();
const readableStream = new ReadableStream({
  async start(controller) {
    // 1. Send metadata first (sources)
    const metadata = { sources: chunks.map(c => ({ content: c.content, image_urls: c.image_urls, similarity: c.similarity })) };
    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'metadata', data: metadata })}\n\n`));
    
    // 2. Stream chunks of generated text
    for await (const chunk of stream) {
      if (chunk.text) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'text', data: chunk.text })}\n\n`));
      }
    }
    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
    controller.close();
  }
});
```

## 3. Knowledge Relationships
- Depends On (must read): [[supabase-hybrid-migration.md]] (Supabase migrations schema detail)
- Impacted By (changes affect): [[lessons-learned/rbac-casing-and-e2e.md]]
- Contradicts (historical mismatch): [Deprecated] Older versions of QSMS-RAG using ChromaDB/Python-based local services are fully deprecated.
