-- Create a new storage bucket for RAG rendered PDF page images
2: insert into storage.buckets (id, name, public) 
3: values ('rag_images', 'rag_images', true)
4: on conflict (id) do nothing;
5: 
6: -- Set up access controls (allow public read, authenticated insert)
7: create policy "Public Access"
8: on storage.objects for select
9: using ( bucket_id = 'rag_images' );
10: 
11: create policy "Authenticated Insert"
12: on storage.objects for insert
13: with check ( bucket_id = 'rag_images' and auth.role() = 'authenticated' );
14: 
15: -- Allow anon insert for local testing if needed, or stick to authenticated.
16: create policy "Anon Insert (Local)"
17: on storage.objects for insert
18: with check ( bucket_id = 'rag_images' and auth.role() = 'anon' );
