-- 1. Create RAG Feedback Table
create table if not exists public.rag_feedback (
  id uuid primary key default gen_random_uuid(),
  query text not null,
  response text not null,
  context_used text,
  is_positive boolean not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Hybrid Search Function
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
