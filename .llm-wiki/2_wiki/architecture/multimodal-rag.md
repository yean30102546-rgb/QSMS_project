# Title: QSMS DocAI Multimodal RAG
[Updated: 2026-05-28]

## 1. Summary & Current Implementation
QSMS DocAI RAG is implemented by `src/modules/rag/RagApp.tsx` and `/api/rag`.
The UI uploads PDF/XLSX files, the API extracts document text with Gemini, stores documents/chunks in Supabase, creates `gemini-embedding-2` (768 dimensions) vectors, and answers questions through a pgvector similarity search plus Gemini response generation.

## 2. Technical Code Snippet (Best Practice)
```ts
// /api/rag action model
switch (action) {
  case 'ingest':
    // Parse document -> chunk -> embed -> insert into rag_document_chunks.
    break;
  case 'chat':
    // Embed question -> match_document_chunks RPC -> answer with Gemini.
    break;
}
```

## 3. Current Storage & Retrieval Model
- Tables: `rag_documents` stores file metadata and summaries; `rag_document_chunks` stores chunk text, optional image URLs, metadata, and `vector(768)` embeddings.
- RPC: `match_document_chunks` ranks chunks by cosine similarity using `pgvector`.
- Models: Gemini `gemini-flash-latest` parses documents and generates answers; `gemini-embedding-2` generates embeddings (constrained to 768 dimensions in config).
- Chunking: Powered by LangChain's `RecursiveCharacterTextSplitter` with `chunkSize: 1000` and `chunkOverlap: 200`.
- File handling: The frontend sends uploaded file bytes as Base64 data URLs; the current backend stores text/chunk metadata in Supabase but does not persist the original binary file in Supabase Storage.

## 4. Operational Notes
- `/api/rag` currently has no `requireServerAuth` guard, unlike `/api/rework` and `/api/roster`.
- The UI supports markdown image references in assistant answers, but current ingestion passes `imageUrls: []` unless another extraction step populates image references.
- Ingestion embeddings are generated in parallel batches (batch size of 5) to prevent `429 Too Many Requests` API quota limits.
- `SUPABASE_SERVICE_ROLE_KEY` and `GEMINI_API_KEY` are required server-side secrets for ingestion and chat.

## 5. Future Enhancements & Roadmap
- **Real-time Data Access (Function Calling / Tool Use):** Provide Gemini with tool definitions (e.g. `get_active_cases()`, `query_roster_table()`) to allow the AI to retrieve real-time operational status from Supabase tables rather than querying static files.
- **Enterprise Data Privacy:** Transition the Google Gen AI client to Google AI Studio Paid Tier or Vertex AI to guarantee that company data and specifications are not used to train Gemini models.
- **Advanced Retrieval (Hybrid Search):** Combine pgvector similarity search with Postgres Full-Text Search (FTS) to ensure precise matching for specific codes, serial numbers, and technical terms.
- **Image Pipeline Completion:** Save extracted images from PDF uploads to Supabase Storage, and map them to their corresponding text chunks in `rag_document_chunks.image_urls`.
- **Comparative Analysis Optimization:** Dynamically scale `match_count` or execute dual query branches when users request comparative analysis ("Compare item X to item Y").

## 6. Knowledge Relationships
- Depends On (must read): [[system-architecture.md]], [[supabase-hybrid-migration.md]]
- Impacted By (changes here affect): [[../nextjs-frontend/nextjs.md]], [[../nextjs-frontend/portal-shell.md]]
- Contradicts (historical mismatch): Earlier design notes described planned Supabase Storage image persistence; current code keeps original uploaded files transient and persists searchable text chunks plus metadata.
