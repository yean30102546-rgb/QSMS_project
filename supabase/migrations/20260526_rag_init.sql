-- 1. Enable the pgvector extension to work with embedding vectors
create extension if not exists vector;

-- 2. Create the document metadata table
create table if not exists public.rag_documents (
  id uuid primary key default gen_random_uuid(),
  filename text not null,
  file_type text not null, -- 'pdf' | 'xlsx'
  supabase_storage_path text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Create the document chunks / embeddings table
create table if not exists public.rag_document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references public.rag_documents(id) on delete cascade not null,
  content text not null,
  embedding vector(768) not null, -- text-embedding-004 has 768 dimensions
  image_urls text[], -- array of related image URLs from Supabase Storage
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Create an index for cosine distance vector search (HNSW)
create index on public.rag_document_chunks using hnsw (embedding vector_cosine_ops);

-- 5. Create the pgvector similarity matching function
create or replace function match_document_chunks (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  document_id uuid,
  content text,
  image_urls text[],
  similarity float
)
language sql stable
as $$
  select
    rag_document_chunks.id,
    rag_document_chunks.document_id,
    rag_document_chunks.content,
    rag_document_chunks.image_urls,
    1 - (rag_document_chunks.embedding <=> query_embedding) as similarity
  from rag_document_chunks
  where 1 - (rag_document_chunks.embedding <=> query_embedding) > match_threshold
  order by rag_document_chunks.embedding <=> query_embedding
  limit match_count;
$$;
