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
  embedding vector(768) not null, -- jina-embeddings-v5-text-small has 768 dimensions
  image_urls text[], -- array of related image URLs from Supabase Storage
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Create an index for cosine distance vector search (HNSW)
create index if not exists rag_document_chunks_embedding_hnsw_idx 
on public.rag_document_chunks using hnsw (embedding vector_cosine_ops);

-- 5. Create RAG Feedback Table
create table if not exists public.rag_feedback (
  id uuid primary key default gen_random_uuid(),
  query text not null,
  response text not null,
  context_used text,
  is_positive boolean not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Create the pgvector similarity matching function
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

-- 7. Hybrid Search Function
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
)
language sql stable
as $$
  with vector_matches as (
    select
      id,
      document_id,
      content,
      image_urls,
      1 - (embedding <=> query_embedding) as score
    from rag_document_chunks
    order by embedding <=> query_embedding
    limit match_count
  ),
  keyword_matches as (
    select
      id,
      document_id,
      content,
      image_urls,
      ts_rank(to_tsvector('english', content), plainto_tsquery('english', query_text)) as score
    from rag_document_chunks
    where to_tsvector('english', content) @@ plainto_tsquery('english', query_text)
    order by score desc
    limit match_count
  )
  select distinct on (id)
    id,
    document_id,
    content,
    image_urls,
    score as similarity
  from (
    select * from vector_matches
    union all
    select * from keyword_matches
  ) combined
  order by id, score desc
  limit match_count;
$$;

-- 8. Create a new storage bucket for RAG rendered PDF page images
insert into storage.buckets (id, name, public) 
values ('rag_images', 'rag_images', true)
on conflict (id) do nothing;

-- Set up access controls (allow public read, authenticated & anonymous insert)
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'rag_images' );

create policy "Authenticated Insert"
on storage.objects for insert
with check ( bucket_id = 'rag_images' and auth.role() = 'authenticated' );

create policy "Anon Insert"
on storage.objects for insert
with check ( bucket_id = 'rag_images' and auth.role() = 'anon' );
