import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const JINA_API_KEY = process.env.JINA_API_KEY;

if (!JINA_API_KEY) {
  console.error('❌ JINA_API_KEY is not defined in environment variables.');
  process.exit(1);
}

// 1. Copy Context files to .llm-wiki/1_raw/
const rawDir = path.resolve('.llm-wiki/1_raw');
if (!fs.existsSync(rawDir)) {
  fs.mkdirSync(rawDir, { recursive: true });
}

const contextFiles = [
  'CONTEXT.md',
  'GEMINI.md',
  'PRODUCT.md',
  'AGENTS.md'
];

console.log('📂 Copying context files to 1_raw...');
for (const file of contextFiles) {
  const src = path.resolve(file);
  const dest = path.join(rawDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`✅ Copied ${file} to 1_raw/`);
  } else {
    console.warn(`⚠️ Warning: ${file} not found in root.`);
  }
}

// 2. Read all files in 1_raw
const allRawFiles = fs.readdirSync(rawDir).filter(file => {
  const ext = path.extname(file).toLowerCase();
  return ext === '.md' || ext === '.txt' || ext === '.json' || ext === '.canvas' || ext === '.ts';
});

console.log(`📝 Found ${allRawFiles.length} files in 1_raw to ingest.`);

async function generateEmbeddings(chunks) {
  const BATCH_SIZE = 20;
  const allEmbeddings = [];

  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    console.log(`   ⚡ Generating embeddings for batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(chunks.length / BATCH_SIZE)}...`);

    const res = await fetch('https://api.jina.ai/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${JINA_API_KEY}`
      },
      body: JSON.stringify({
        model: 'jina-embeddings-v5-text-small',
        dimensions: 768,
        normalized: true,
        input: batch
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Jina API Error: ${errText}`);
    }

    const data = await res.json();
    const batchEmbeddings = data.data || [];
    allEmbeddings.push(...batchEmbeddings.map(item => item.embedding));
  }

  return allEmbeddings;
}

function chunkText(text, chunkSize = 1200, overlap = 200) {
  const chunks = [];
  let index = 0;
  while (index < text.length) {
    let end = index + chunkSize;
    if (end > text.length) {
      end = text.length;
    }
    chunks.push(text.slice(index, end));
    if (end === text.length) break;
    index = end - overlap;
  }
  return chunks;
}

async function ingestAll() {
  try {
    // 3. Clear database tables
    console.log('🧹 Clearing rag_documents and rag_document_chunks tables...');
    
    // Deleting rag_documents cascade-deletes rag_document_chunks
    const { error: deleteError } = await supabase
      .from('rag_documents')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (deleteError) {
      console.error('❌ Failed to clear database tables:', deleteError);
      return;
    }
    console.log('✅ Database cleared.');

    // 4. Ingest each file
    for (const filename of allRawFiles) {
      const filePath = path.join(rawDir, filename);
      const content = fs.readFileSync(filePath, 'utf-8');
      const fileType = path.extname(filename).replace('.', '') || 'txt';

      if (!content.trim()) {
        console.log(`⏭️ Skipping empty file: ${filename}`);
        continue;
      }

      console.log(`📥 Ingesting: ${filename} (${content.length} chars)...`);

      // Insert parent document
      const { data: docRecord, error: docError } = await supabase
        .from('rag_documents')
        .insert([{ filename, file_type: fileType }])
        .select()
        .single();

      if (docError) {
        console.error(`❌ Failed to insert document metadata for ${filename}:`, docError);
        continue;
      }

      // Chunk file
      const chunks = chunkText(content);
      console.log(`   📦 Created ${chunks.length} chunks.`);

      if (chunks.length === 0) continue;

      // Generate Jina Embeddings
      const embeddings = await generateEmbeddings(chunks);

      // Prepare records for DB
      const records = chunks.map((chunk, idx) => ({
        document_id: docRecord.id,
        content: chunk,
        embedding: embeddings[idx],
        image_urls: []
      }));

      // Insert chunks
      const { error: chunkError } = await supabase
        .from('rag_document_chunks')
        .insert(records);

      if (chunkError) {
        console.error(`❌ Failed to insert chunks for ${filename}:`, chunkError);
      } else {
        console.log(`🎉 Ingestion completed successfully for ${filename}`);
      }
    }

    console.log('🌟 ALL INGESTION TASKS COMPLETED SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ Ingestion process failed:', err);
  }
}

ingestAll();
