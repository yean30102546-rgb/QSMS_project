# Title: Next.js RAG Module Architecture
[Updated: 2026-05-28]

## 1. Summary & Current Implementation
QSMS RAG is now integrated directly into the `QSMS_project` (Next.js) portal as a module. It uses Google Gemini API (`gemini-1.5-flash` for extraction/chat, `text-embedding-004` for embeddings) and Supabase PostgreSQL with `pgvector`. When uploading a PDF, the frontend uses `pdfjs-dist` to render pages into images, uploads them to Supabase Storage (`rag_images` bucket), and passes the image URLs to the backend. The backend uses Gemini to parse the document text, splits it, and saves it into `rag_document_chunks` along with the image URLs.

## 2. Technical Code Snippet (Best Practice)
```typescript
// PDF Page to Image conversion in frontend (RagApp.tsx)
import * as pdfjsLib from 'pdfjs-dist';
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const page = await pdf.getPage(pageNum);
const viewport = page.getViewport({ scale: 1.5 });
const canvas = document.createElement('canvas');
const context = canvas.getContext('2d');
// ...render canvas and convert to blob, then upload to Supabase Storage
```

```sql
-- Supabase Schema for Vector Search (20260526_rag_init.sql)
create table if not exists public.rag_document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references public.rag_documents(id) on delete cascade not null,
  content text not null,
  embedding vector(768) not null,
  image_urls text[]
);
create index on public.rag_document_chunks using hnsw (embedding vector_cosine_ops);
```

## 3. Knowledge Relationships
- Depends On (must read): [[prisma-orm.md]] (N/A here, but using supabase-js directly for RPC calls)
- Impacted By (changes affect): [[gemini-api.md]] (If Gemini changes embedding dimension from 768)
- Contradicts (historical mismatch): [Deprecated] The Python-based `QSMS-RAG` with `Ollama` and `ChromaDB` is deprecated. This cloud-native architecture replaces it.
