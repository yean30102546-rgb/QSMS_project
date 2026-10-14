import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../lib/supabaseServer';
import { ragSupabaseServer } from '../../../lib/ragSupabaseServer';
import { assertPermission, AuthError, requireServerAuth } from '../../../lib/serverAuth';
import { GoogleGenAI, Type } from '@google/genai';
import { MarkdownTextSplitter } from '@langchain/textsplitters';
import * as XLSX from 'xlsx';
import { normalizeCaseQuery } from './caseNormalizer';
import { canRoleAccessAnalytics, canRoleAccessDrawings, getScopedToolDeclarations } from './toolDefinitions';

interface DocumentChunk {
  content: string;
  image_urls?: string[];
  similarity: number;
  document_id?: string;
  filename?: string;
}

// Initialize the Google Gen AI client with the API Key
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    const auth = await requireServerAuth(body);
    if (['delete_document', 'bulk_delete_documents', 'ingest'].includes(action)) {
      assertPermission(auth, 'manage_rag');
    }

    console.log(`[RAG API] RAG API Action: ${action}`);

    if (!process.env.GEMINI_API_KEY) {
      console.error('[RAG API] GEMINI_API_KEY is missing in environment variables.');
      return NextResponse.json(
        { success: false, error: 'GEMINI_API_KEY is not configured on the server. Please check your .env configuration.' },
        { status: 500 }
      );
    }

    switch (action) {
      case 'list_documents': {
        const { data, error } = await ragSupabaseServer
          .from('rag_documents')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('[RAG API] Error fetching rag_documents:', error);
          throw error;
        }
        return NextResponse.json({ success: true, data: data || [] });
      }

      case 'delete_document': {
        const { id } = body;
        if (!id) {
          return NextResponse.json({ success: false, error: 'Missing document ID.' }, { status: 400 });
        }

        console.log(`[RAG API] ️ Deleting document and chunks for ID: ${id}`);
        // Chunks are automatically deleted via ON DELETE CASCADE foreign key
        const { error } = await ragSupabaseServer
          .from('rag_documents')
          .delete()
          .eq('id', id);

        if (error) {
          console.error('[RAG API] Error deleting document:', error);
          throw error;
        }
        return NextResponse.json({ success: true });
      }

      case 'get_document_chunks': {
        const { documentId } = body;
        if (!documentId) {
          return NextResponse.json({ success: false, error: 'Missing document ID.' }, { status: 400 });
        }

        console.log(`[RAG API] Fetching chunks for document ID: ${documentId}`);
        const { data, error } = await ragSupabaseServer
          .from('rag_document_chunks')
          .select('id, content, image_urls')
          .eq('document_id', documentId);

        if (error) {
          console.error('[RAG API] Error fetching document chunks:', error);
          throw error;
        }
        return NextResponse.json({ success: true, data: data || [] });
      }

      case 'bulk_delete_documents': {
        const { ids } = body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
          return NextResponse.json({ success: false, error: 'Missing or invalid document IDs.' }, { status: 400 });
        }

        console.log(`[RAG API] ️ Bulk deleting documents for ${ids.length} IDs`);
        const { error } = await ragSupabaseServer
          .from('rag_documents')
          .delete()
          .in('id', ids);

        if (error) {
          console.error('[RAG API] Error bulk deleting documents:', error);
          throw error;
        }
        return NextResponse.json({ success: true });
      }

      case 'ingest': {
        const { filename, fileType, base64Data, imageUrls } = body;
        if (!filename || !fileType || !base64Data) {
          return NextResponse.json(
            { success: false, error: 'Missing required parameters: filename, fileType, base64Data' },
            { status: 400 }
          );
        }

        console.log(`[RAG API] Ingesting document: ${filename} (${fileType})`);

        // 1. Insert parent document metadata record
        const { data: docRecord, error: docError } = await ragSupabaseServer
          .from('rag_documents')
          .insert([{ filename, file_type: fileType }])
          .select()
          .single();

        if (docError) {
          console.error('[RAG API] Error inserting rag_documents metadata:', docError);
          throw docError;
        }

        // 2. Parse file content (Gemini for PDF/Images, xlsx parser for Excel)
        let parsedText = '';

        if (fileType === 'pdf' || fileType.startsWith('image/')) {
          let mimeType = fileType === 'pdf' ? 'application/pdf' : fileType;
          // Clean up generic image types if passed
          if (mimeType === 'image/jpg') mimeType = 'image/jpeg';

          const parsePrompt = `วิเคราะห์เอกสาร/รูปภาพนี้อย่างละเอียด และแปลงเป็นรูปแบบ Markdown (ใช้ # หรือ ## ในการแบ่งหัวข้อ) 
สิ่งที่ต้องทำ:
1. วิเคราะห์หมวดหมู่ของเอกสาร (Document Category) และคำค้นหาหลัก (Keywords) แล้วใส่ไว้ในส่วนบนสุดของไฟล์เสมอ ในรูปแบบ:
# Document Metadata
- Category: [หมวดหมู่ เช่น คู่มือ, ฉลากสินค้า, แจ้งซ่อม]
- Keywords: [คำค้นหาที่เกี่ยวข้อง คั่นด้วยลูกน้ำ]

2. ถอดความข้อมูลทั้งหมดในเอกสารนี้ออกมาให้ครบถ้วน 
3. หากมีรูปภาพหรือแผนผังแทรกอยู่ (เช่น แกลลอน, ฝา, พาเลท) ให้อธิบายรูปภาพนั้นอย่างละเอียดและเชื่อมโยงกับเนื้อหา

จัดหน้าด้วย Markdown เสมอเพื่อให้แบ่ง Chunking ตามหัวข้อได้อย่างแม่นยำ`;

          let parseResponse;
          try {
            console.log(`[RAG API] Requesting Gemini 3.1 Flash Lite parsing for ${filename} (${mimeType})...`);
            parseResponse = await ai.models.generateContent({
              model: 'gemini-3.1-flash-lite',
              contents: [
                { inlineData: { mimeType, data: base64Data } },
                { text: parsePrompt }
              ]
            });
          } catch (error: unknown) {
            console.warn(`[RAG API] ️ Gemini 3.1 Flash Lite failed (possibly 503 high demand). Falling back to gemini-2.0-flash:`, error instanceof Error ? error.message : String(error));
            parseResponse = await ai.models.generateContent({
              model: 'gemini-2.0-flash',
              contents: [
                { inlineData: { mimeType, data: base64Data } },
                { text: parsePrompt }
              ]
            });
          }

          parsedText = parseResponse.text || '';
        } else if (fileType === 'xlsx' || fileType === 'xls') {
          console.log(`[RAG API] Parsing Excel file server-side with SheetJS for ${filename}...`);
          try {
            const buffer = Buffer.from(base64Data, 'base64');
            const workbook = XLSX.read(buffer, { type: 'buffer' });
            let excelText = `# Document Metadata\n- Category: Excel Data\n- Keywords: Spreadsheet, Data, ${filename.split('.')[0]}\n\n`;

            for (const sheetName of workbook.SheetNames) {
              const worksheet = workbook.Sheets[sheetName];
              const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];
              if (rows.length === 0) continue;

              const sheetText = rows
                .map(row => row.map(cell => (cell === null || cell === undefined ? '' : String(cell).trim())).join(' | '))
                .filter(line => line.trim().replace(/\|/g, '').trim().length > 0)
                .join('\n');

              if (sheetText.trim()) {
                excelText += `## Sheet: ${sheetName}\n${sheetText}\n\n`;
              }
            }

            parsedText = excelText;
          } catch (err) {
            console.error('[RAG API] Error parsing Excel with SheetJS:', err);
            throw new Error(`Failed to parse Excel file: ${err instanceof Error ? err.message : String(err)}`);
          }
        } else {
          throw new Error(`Unsupported file type: ${fileType}`);
        }

        if (!parsedText.trim()) {
          throw new Error('Parsed document content is empty.');
        }

        console.log(`[RAG API] Parsing completed. Length: ${parsedText.length} characters.`);

        // 3. Chunk the parsed text using Markdown Headers (Semantic Header-based Chunking)
        console.log(`[RAG API] Segmenting text based on markdown headers...`);
        const rawChunks = parsedText.split(/(?=\n#{1,3}\s)/);
        const chunks: string[] = [];
        let currentChunk = '';

        for (const rawChunk of rawChunks) {
          const trimmed = rawChunk.trim();
          if (!trimmed) continue;
          
          // Combine chunks if they are small (e.g. less than 500 chars) to prevent micro-chunks
          if (currentChunk.length + trimmed.length < 500) {
            currentChunk = currentChunk ? currentChunk + '\n\n' + trimmed : trimmed;
          } else {
            if (currentChunk) chunks.push(currentChunk);
            currentChunk = trimmed;
          }
        }
        if (currentChunk) {
          chunks.push(currentChunk);
        }

        const filteredChunks = chunks.filter(c => c.length > 20);
        console.log(`[RAG API] Generated ${filteredChunks.length} header-based chunks for indexing.`);

        // 4. Generate embeddings using Jina AI or Gemini as fallback (768 dimensions)
        console.log(`[RAG API] Generating embeddings...`);
        const allInsertRecords: Record<string, unknown>[] = [];
        const jinaApiKey = process.env.JINA_API_KEY || '';

        const BATCH_SIZE = 20;
        for (let i = 0; i < filteredChunks.length; i += BATCH_SIZE) {
          const batchChunks = filteredChunks.slice(i, i + BATCH_SIZE);
          
          try {
            if (!jinaApiKey) {
              throw new Error('JINA_API_KEY is not configured. Forcing fallback.');
            }

            console.log(`Processing Jina embedding batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(filteredChunks.length / BATCH_SIZE)}...`);
            const jinaRes = await fetch('https://api.jina.ai/v1/embeddings', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${jinaApiKey}`
              },
              body: JSON.stringify({
                model: 'jina-embeddings-v5-text-small',
                dimensions: 768,
                normalized: true,
                input: batchChunks
              })
            });

            if (!jinaRes.ok) {
              const errorText = await jinaRes.text();
              throw new Error(`Jina API error (${jinaRes.status}): ${errorText}`);
            }

            const jinaData = await jinaRes.json();
            const embeddingsList = jinaData.data || [];

            batchChunks.forEach((chunk, index) => {
              const embeddingValues = embeddingsList[index]?.embedding;
              if (embeddingValues && embeddingValues.length === 768) {
                allInsertRecords.push({
                  document_id: docRecord.id,
                  content: chunk,
                  embedding: embeddingValues,
                  image_urls: imageUrls || []
                });
              } else {
                console.warn(`[RAG API] ️ Warning: Missing or invalid embedding at index ${index} in batch.`);
              }
            });
          } catch (err) {
            console.warn('[RAG API] Jina Embeddings failed, falling back to Gemini text-embedding-004:', err instanceof Error ? err.message : String(err));
            
            try {
              console.log(`Processing Gemini embedding batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(filteredChunks.length / BATCH_SIZE)}...`);
              const embedPromises = batchChunks.map(async (chunk) => {
                const embedResponse = await ai.models.embedContent({
                  model: 'text-embedding-004',
                  contents: chunk
                });
                const rawResp = embedResponse as { embedding?: { values?: number[] }; embeddings?: { values?: number[] }[] };
                const embeddingValues = rawResp.embedding?.values || rawResp.embeddings?.[0]?.values;
                if (!embeddingValues || embeddingValues.length !== 768) {
                  throw new Error(`Invalid Gemini embedding size: ${embeddingValues?.length}`);
                }
                return embeddingValues;
              });

              const embeddingsList = await Promise.all(embedPromises);

              batchChunks.forEach((chunk, index) => {
                const embeddingValues = embeddingsList[index];
                allInsertRecords.push({
                  document_id: docRecord.id,
                  content: chunk,
                  embedding: embeddingValues,
                  image_urls: imageUrls || []
                });
              });
            } catch (geminiErr) {
              console.error('[RAG API] Critical: Both Jina and Gemini embeddings failed:', geminiErr);
              throw geminiErr;
            }
          }
        }

        // 5. Bulk insert into Supabase
        console.log(`[RAG API] Bulk inserting ${allInsertRecords.length} chunks into database...`);
        if (allInsertRecords.length > 0) {
          const { error: chunkError } = await ragSupabaseServer
            .from('rag_document_chunks')
            .insert(allInsertRecords);

          if (chunkError) {
            console.error(`[RAG API] Error bulk inserting chunks:`, chunkError);
            throw chunkError;
          }
        }

        console.log(`[RAG API] Ingest successful for document: ${filename}`);
        return NextResponse.json({ success: true, data: { docId: docRecord.id, totalChunks: chunks.length } });
      }

      case 'chat': {
        const { message, messages = [], moduleContext, expandCrossModule } = body;
        if (!message) {
          return NextResponse.json({ success: false, error: 'Missing query message' }, { status: 400 });
        }

        console.log(`[RAG API] Processing chat query: "${message.substring(0, 50)}..."`);

        // 1. Query Expansion (Gemini generates 3 variations)
        let searchQueries = [message];
        try {
          console.log('[RAG API] Expanding search queries with Gemini...');
          const expansionResponse = await ai.models.generateContent({
            model: 'gemini-3.1-flash-lite',
            contents: `คุณคือผู้เชี่ยวชาญการสืบค้นข้อมูลคู่มือโรงงาน หน้าที่ของคุณคือสร้างประโยคคำค้นหาภาษาไทยที่แตกต่างกันแต่องค์ความรู้คล้ายคลึงกัน 3 ประโยค จากคำถามเริ่มต้น เพื่อใช้ในการทำ Semantic Search หาคู่มือการซ่อมหรือข้อมูลสเปกสินค้า
            
คำถามเริ่มต้น: "${message}"

คืนค่าผลลัพธ์เป็นประโยคคำค้นหาโดยตรง คั่นด้วยเครื่องหมายขึ้นบรรทัดใหม่เท่านั้น (ห้ามใส่เลขข้อ หรือคำอธิบายเพิ่มเติม)`
          });
          
          const expansionText = expansionResponse.text || '';
          const expandedList = expansionText
            .split('\n')
            .map(q => q.trim())
            .filter(q => q.length > 0 && !q.startsWith('-') && !q.match(/^\d+\./));
          
          if (expandedList.length > 0) {
            searchQueries = [...searchQueries, ...expandedList.slice(0, 3)];
            console.log('[RAG API] Expanded queries:', searchQueries);
          }
        } catch (e) {
          console.warn('[RAG API] Query expansion failed, using original message:', e);
        }

        // 2. Generate query embedding vector (Jina AI with Gemini fallback)
        let queryEmbedding: number[] = new Array(768).fill(0);
        const jinaApiKey = process.env.JINA_API_KEY || '';

        try {
          if (!jinaApiKey) {
            throw new Error('JINA_API_KEY is not configured. Forcing fallback.');
          }

          console.log('[RAG API] Generating query embeddings via Jina AI...');
          const jinaRes = await fetch('https://api.jina.ai/v1/embeddings', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${jinaApiKey}`
            },
            body: JSON.stringify({
              model: 'jina-embeddings-v5-text-small',
              dimensions: 768,
              normalized: true,
              input: searchQueries
            })
          });

          if (!jinaRes.ok) {
            const errorText = await jinaRes.text();
            throw new Error(`Jina API error (${jinaRes.status}): ${errorText}`);
          }

          const jinaData = await jinaRes.json();
          const embeddingsList = jinaData.data || [];

          if (embeddingsList.length > 0) {
            embeddingsList.forEach((item: { embedding: number[] }) => {
              const emb = item.embedding;
              if (emb && emb.length === 768) {
                for (let d = 0; d < 768; d++) {
                  queryEmbedding[d] += emb[d];
                }
              }
            });
            for (let d = 0; d < 768; d++) {
              queryEmbedding[d] /= embeddingsList.length;
            }
          }
        } catch (err) {
          console.warn('[RAG API] Jina query embedding failed, falling back to Gemini text-embedding-004:', err instanceof Error ? err.message : String(err));
          
          try {
            const embedPromises = searchQueries.map(async (q) => {
              const embedResponse = await ai.models.embedContent({
                model: 'text-embedding-004',
                contents: q
              });
              const rawResp = embedResponse as { embedding?: { values?: number[] }; embeddings?: { values?: number[] }[] };
              return rawResp.embedding?.values || rawResp.embeddings?.[0]?.values;
            });
            
            const embeddingsList = await Promise.all(embedPromises);
            let validCount = 0;
            
            for (const emb of embeddingsList) {
              if (emb && emb.length === 768) {
                validCount++;
                for (let d = 0; d < 768; d++) {
                  queryEmbedding[d] += emb[d];
                }
              }
            }
            
            if (validCount > 0) {
              for (let d = 0; d < 768; d++) {
                queryEmbedding[d] /= validCount;
              }
            } else {
              throw new Error('Gemini returned empty embeddings.');
            }
          } catch (geminiErr) {
            console.error('[RAG API] Critical: Both Jina and Gemini query embedding failed:', geminiErr);
            throw geminiErr;
          }
        }

        // 3. Search similarity using Supabase RPC function (Hybrid Search)
        console.log('[RAG API] Executing Hybrid Search in database (Match Count 12)...');
        let matchedChunks: DocumentChunk[] | null = [];

        // Try hybrid search first
        const { data: hybridData, error: hybridError } = await ragSupabaseServer.rpc(
          'hybrid_search_chunks',
          {
            query_text: message,
            query_embedding: queryEmbedding,
            match_count: 12
          }
        );

        if (hybridError || !hybridData) {
          console.warn('[RAG API] Hybrid search failed, falling back to pure vector search:', hybridError);
          const { data: vectorData, error: matchError } = await ragSupabaseServer.rpc(
            'match_document_chunks',
            {
              query_embedding: queryEmbedding,
              match_threshold: 0.25,
              match_count: 12
            }
          );

          if (matchError) {
            console.error('[RAG API] Error executing match_document_chunks RPC:', matchError);
            throw matchError;
          }
          matchedChunks = vectorData;
        } else {
          matchedChunks = hybridData;
        }

        console.log(`[RAG API] Found ${(matchedChunks as DocumentChunk[] | null)?.length || 0} raw matching document chunks.`);
        const rawChunks = (matchedChunks as DocumentChunk[] | null) || [];
        
        // 4. Jina Rerank to pick top 8 relevant chunks
        let rerankedChunks: DocumentChunk[] = [];
        if (rawChunks.length > 0 && jinaApiKey) {
          try {
            console.log(`[RAG API] Reranking ${rawChunks.length} chunks via Jina Reranker...`);
            const rerankRes = await fetch('https://api.jina.ai/v1/rerank', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${jinaApiKey}`
              },
              body: JSON.stringify({
                model: 'jina-reranker-v2-base-multilingual',
                query: message,
                top_n: 8,
                documents: rawChunks.map(c => c.content)
              })
            });

            if (rerankRes.ok) {
              const rerankData = await rerankRes.json();
              const results = rerankData.results || [];
              
              results.forEach((res: { index: number; relevance_score: number }) => {
                if (res.relevance_score > 0.35) {
                  const originalChunk = rawChunks[res.index];
                  rerankedChunks.push({
                    ...originalChunk,
                    similarity: res.relevance_score
                  });
                }
              });
              console.log(`[RAG API] Rerank completed. Filtered down to ${rerankedChunks.length} high-relevance chunks.`);
            } else {
              const errorText = await rerankRes.text();
              console.warn(`[RAG API] ️ Jina Rerank API error (${rerankRes.status}): ${errorText}. Using top 8 raw chunks.`);
              rerankedChunks = rawChunks.slice(0, 8);
            }
          } catch (rerankErr) {
            console.warn('[RAG API] Jina Reranking failed, using raw vector chunks:', rerankErr);
            rerankedChunks = rawChunks.slice(0, 8);
          }
        } else {
          rerankedChunks = rawChunks.slice(0, 8);
        }

        const chunks = rerankedChunks;

        // Fetch document filenames for high-fidelity citations
        const docIds = Array.from(
          new Set(
            chunks
              .map((c: DocumentChunk) => c.document_id)
              .filter((id): id is string => Boolean(id))
          )
        );
        const docMap = new Map<string, string>();
        if (docIds.length > 0) {
          try {
            const { data: docRecords } = await ragSupabaseServer
              .from('rag_documents')
              .select('id, filename')
              .in('id', docIds);
            if (docRecords) {
              docRecords.forEach((d: { id: string; filename: string }) => {
                docMap.set(d.id, d.filename);
              });
            }
          } catch (docErr) {
            console.warn('[RAG API] Error fetching filenames for citations:', docErr);
          }
        }

        // Attach filename directly to chunk objects
        chunks.forEach((c: DocumentChunk) => {
          if (c.document_id && docMap.has(c.document_id)) {
            c.filename = docMap.get(c.document_id);
          }
        });

        // 3. Construct Context
        const contextText = chunks
          .map((chunk, index: number) => {
            const docName = chunk.filename || 'เอกสารคู่มือ SOP / ข้อกำหนดทางเทคนิค';
            return `[Source Block #${index + 1} | ไฟล์: ${docName}]:\n${chunk.content}\nRelated Images: ${JSON.stringify(chunk.image_urls || [])}`;
          })
          .join('\n\n');

        // 4. Formulate System Prompt and request answer from Gemini
        const systemPrompt = `You are the "QSMS Enterprise AI Assistant", the DocAI RAG assistant and Technical Data Analyst for QSMS.
Persona: Professional, concise, highly knowledgeable, and helpful. You communicate in a clear, supportive tone suitable for an enterprise environment. Use polite particles (ครับ/ค่ะ) appropriately but avoid excessive emojis. You are an expert on product packaging specifications, Master Small Packs, factory procedures, engineering drawings, and real-time rework statistics.

Retrieved Context:
${contextText}

Instructions:
1. ตอบคำถามเป็นภาษาไทยอย่างกระชับ ตรงประเด็น และเป็นมืออาชีพ
2. ระบุตัวเลข, Revision, รหัสสินค้า (Item Code/Item No), เลขที่แบบ (Drawing No), และสเปกบรรจุภัณฑ์ให้แม่นยำตาม Context หรือ System Data
3. กฎการอ้างอิงเอกสาร (Strict Evidence Citations):
- ทุกคำตอบที่ดึงมาจากเอกสารคู่มือหรือสเปก ต้องระบุชื่อเอกสาร (เช่น [📄 ชื่อไฟล์.pdf]), Revision หรือหน้าอ้างอิง และข้อความยืนยันสั้นๆ (Quote Snippet) เสมอ
- หากตอบจากฐานข้อมูลระบบ ให้ระบุแหล่งข้อมูลชัดเจน เช่น [ข้อมูลเคสจริง], [คลังแบบแปลนวิศวกรรม], หรือ [ข้อมูลสินค้ากลาง]
- แยกความแตกต่างของข้อมูลชัดเจนระหว่าง: ข้อมูลคู่มือทางเทคนิค (RAG Documents) กับ ข้อมูลสดจากระบบธุรกรรม (Engineering Drawings Registry, Rework Database, Item Master)
4. Anti-Hallucination & Strict Grounding:
- คุณต้องตอบโดยอ้างอิงจาก Retrieved Context หรือ [System Data] เท่านั้น
- ห้ามคิดค้นหรือเดาข้อมูลสินค้า, สเปกบรรจุภัณฑ์, อาการเสีย หรือสร้างลิงก์ URL สมมติ (เช่น https://qsms.internal/... หรือชื่อไฟล์ที่ไม่มีอยู่จริงในระบบ) โดยเด็ดขาด
- หากสืบค้นแล้วไม่พบข้อมูล หรือข้อมูลไม่เพียงพอ ให้ตอบตามตรงว่า "ไม่พบข้อมูลในเอกสารหรือฐานข้อมูลของระบบ QSMS" และแนะนำคำค้นหา (Keyword) หรือเอกสารที่ผู้ใช้ควรนำเข้าหรือตรวจสอบเพิ่มเติม โดยห้ามคาดเดาจากความรู้ทั่วไปเด็ดขาด
5. Case Action Links & Navigation:
- เมื่อตอบข้อมูลเกี่ยวกับเคส Rework จริงที่ได้รับจาก [System Data] คุณต้องแนบ Action Link รูปแบบ [🔍 เปิดดูเคส <CaseID>](action:case:<CaseID>) ไว้ในคำตอบเสมอ เพื่อให้ผู้ใช้สามารถคลิกเปิดหน้าเคสในระบบได้ทันที
6. Suggestion Chips: At the very end of your response, you MUST append a hidden JSON block containing 3 suggested follow-up questions relevant to the topic. Format exactly like this: \`\`\`json\n{"suggested_questions": ["Question 1?", "Question 2?", "Question 3?"]}\n\`\`\`
7. File Attachments: If System Data contains drawing/master PDF file links [📄 filename](url), include them cleanly in your answer so users can view the attached document.
8. DO NOT use markdown asterisks (* or **) for text formatting (like bolding or bullet points). Use plain text, numbers, or dashes (-) instead.
9. If the context contains image URLs in the image_urls list, you MUST reference them in your markdown response using standard markdown image syntax: ![description](url) so the UI can display them.
`;

        console.log('[RAG API] Requesting streaming response from Gemini chat model (using gemini-3.1-flash-lite)...');

        // Map conversation history
        const historyContents = messages.map((m: { role: string; text: string }) => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.text }]
        }));

        let functionResponseContext = '';

        // Helper to query and format case context using real Supabase columns
        const buildCaseResponseContext = async (caseQuery: string): Promise<string> => {
          const norm = normalizeCaseQuery(caseQuery);
          const patterns = new Set<string>();

          // 1. Direct contains (case-insensitive substring)
          if (norm.token) {
            patterns.add(`id.ilike.%${norm.token}%`);
            patterns.add(`case_name.ilike.%${norm.token}%`);
          }
          if (norm.noSpace && norm.noSpace !== norm.token) {
            patterns.add(`id.ilike.%${norm.noSpace}%`);
            patterns.add(`case_name.ilike.%${norm.noSpace}%`);
          }

          // 2. Structured patterns (supports RT-2026-001, RW888-2026, RT 001)
          if (norm.prefix && norm.paddedSeq) {
            patterns.add(`id.ilike.${norm.prefix}-%-${norm.paddedSeq}`);
            patterns.add(`id.ilike.${norm.prefix}${norm.paddedSeq}-%`);
            patterns.add(`case_name.ilike.${norm.prefix}-%-${norm.paddedSeq}`);
            patterns.add(`case_name.ilike.${norm.prefix}${norm.paddedSeq}-%`);
            if (norm.year) {
              patterns.add(`id.ilike.${norm.prefix}-${norm.year}-${norm.paddedSeq}`);
              patterns.add(`case_name.ilike.${norm.prefix}-${norm.year}-${norm.paddedSeq}`);
            }
          } else if (norm.paddedSeq) {
            patterns.add(`id.ilike.%-%-${norm.paddedSeq}`);
            patterns.add(`case_name.ilike.%-%-${norm.paddedSeq}`);
          }

          const orClause = Array.from(patterns).join(',');
          console.log(`[RAG API] Searching rework_cases for '${caseQuery}', OR filter: ${orClause}`);

          interface MatchedCaseRow {
            id: string;
            case_name?: string | null;
            source?: string | null;
            customer_name?: string | null;
            status?: string | null;
            submission_date?: string | null;
            created_at?: string | null;
            items?: Array<{
              item_code: string;
              item_number?: string | null;
              item_name?: string | null;
              amount?: number | null;
              completed_boxes?: number | null;
              reason?: string | null;
              reason_subtype?: string | null;
              responsible?: string | null;
            }> | null;
          }

          const { data: matchedCases, error: queryErr } = await supabaseServer
            .from('rework_cases')
            .select('id, case_name, source, customer_name, status, submission_date, created_at, items:rework_items(item_code, item_number, item_name, amount, completed_boxes, reason, reason_subtype, responsible)')
            .eq('is_deleted', false)
            .or(orClause)
            .limit(5);

          if (queryErr) {
            console.error('[RAG API] Error querying rework_cases:', queryErr);
            return `\n\n[System Data - ผลการค้นหาเคส Rework]: เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูลเคส\n`;
          }

          if (matchedCases && matchedCases.length > 0) {
            const casesStr = (matchedCases as MatchedCaseRow[]).map(c => {
              const itemList = (c.items && c.items.length > 0)
                ? c.items.map((it, idx) =>
                    `    ${idx + 1}. รหัสสินค้า: ${it.item_code} | ชื่อ: ${it.item_name || 'N/A'} | จำนวน: ${it.amount || 0} กล่อง (ซ่อมเสร็จ: ${it.completed_boxes || 0}) | ปัญหา: ${it.reason || 'N/A'}${it.reason_subtype ? ' (' + it.reason_subtype + ')' : ''} | แผนก: ${it.responsible || '-'}`
                  ).join('\n')
                : '    (ไม่มีรายการสินค้า)';

              return `- รหัสเคส: ${c.id} (ชื่อเคส: ${c.case_name || c.id})
  - แหล่งที่มา: ${c.source || 'N/A'} ${c.customer_name ? `(ลูกค้า: ${c.customer_name})` : ''}
  - วันที่เปิดเคส: ${c.submission_date || c.created_at || 'N/A'}
  - สถานะปัจจุบัน: ${c.status || 'N/A'}
  - จำนวนรายการสินค้า: ${(c.items || []).length} รายการ
  - รายการสินค้าในเคส:
${itemList}
  - Action Link: [🔍 เปิดดูเคส ${c.id}](action:case:${c.id})`;
            }).join('\n\n');

            return `\n\n[System Data - ข้อมูลเคสจริงจากฐานข้อมูลระบบ QSMS สำหรับ '${caseQuery}']:\n${casesStr}\n`;
          }

          // If not found in active cases, check if it was soft-deleted
          const { data: deletedCases } = await supabaseServer
            .from('rework_cases')
            .select('id, case_name')
            .eq('is_deleted', true)
            .or(orClause)
            .limit(3);

          if (deletedCases && deletedCases.length > 0) {
            const delList = deletedCases.map(d => d.id).join(', ');
            return `\n\n[System Data - ผลการค้นหาเคส Rework]: พบรหัสเคส '${delList}' ในระบบ แต่เคสดังกล่าวอยู่ในสถานะ "ถูกลบออกจากระบบแล้ว (Deleted)"\n(คำแนะนำสำหรับ AI: ชี้แจงผู้ใช้ว่าพบเคส ${delList} ในฐานข้อมูลจริงแต่เคสนี้ถูกลบออกจากระบบแล้ว จึงไม่มีข้อมูลสินค้าที่ดำเนินการอยู่ และแนะนำให้ค้นหาเคสที่ยังเปิดใช้งานอยู่ เช่น RW-2026-002 ถึง RW-2026-009 หรือ RT-2026-001 โดยห้ามแต่งข้อมูลสินค้าขึ้นมาเองเด็ดขาด)\n`;
          }

          return `\n\n[System Data - ผลการค้นหาเคส Rework]: ไม่พบเคสที่ตรงกับรหัส '${caseQuery}' ในฐานข้อมูลระบบ QSMS (ตรวจสอบทั้งรหัสตรงและรูปแบบใกล้เคียงแล้วไม่พบ)\n(คำแนะนำสำหรับ AI: แจ้งผู้ใช้ตามความจริงว่าไม่พบเคส '${caseQuery}' ในระบบ และห้ามแต่งข้อมูลสินค้าหรือชื่อเคสขึ้นมาเองเด็ดขาด ให้แนะนำผู้ใช้ตรวจสอบเลขเคส เช่น รูปแบบ RW-2026-xxx หรือ RT-2026-xxx)\n`;
        };
        try {
          // Pre-flight Agentic Tool Check scoped to current module context and user permissions
          const scopedTools = getScopedToolDeclarations(
            typeof moduleContext === 'string' ? moduleContext : undefined,
            Boolean(expandCrossModule),
            auth.profile
          );

          if (scopedTools.length > 0) {
            console.log(`[RAG API] Pre-flight tool check (${scopedTools.length} tools for module: ${moduleContext || 'rework'}, expand: ${Boolean(expandCrossModule)}, role: ${auth.profile})...`);
            const toolResponse = await ai.models.generateContent({
              model: 'gemini-3.1-flash-lite',
              contents: [
                ...historyContents,
                { role: 'user', parts: [{ text: `คำถามปัจจุบัน: ${message}` }] }
              ],
              config: {
                tools: [{
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  functionDeclarations: scopedTools as any
                }]
              }
            });

            if (toolResponse.functionCalls && toolResponse.functionCalls.length > 0) {
              const call = toolResponse.functionCalls[0];
            
            if (call.name === 'search_rework_case') {
              console.log('[RAG API] Model requested search_rework_case tool. Executing query...');
              const args = call.args as Record<string, unknown> | undefined;
              const caseQuery = typeof args?.caseQuery === 'string' ? args.caseQuery : '';
              if (caseQuery) {
                functionResponseContext = await buildCaseResponseContext(caseQuery);
              }
            } else if (call.name === 'query_rework_analytics' || call.name === 'get_rework_statistics') {
              console.log('[RAG API] Model requested rework analytics tool. Executing query...');
              const { data: statsData, error: statsError } = await supabaseServer.from('rework_items').select('reason, amount, completed_boxes');
              const { data: casesData, error: casesError } = await supabaseServer.from('rework_cases').select('status');

              if (!statsError && statsData) {
                const total = statsData.length;
                const leaks = statsData.filter(d => d.reason === 'รั่ว').length;
                const stains = statsData.filter(d => d.reason === 'เปื้อน').length;
                
                let pendingAnalysis = 0, awaitingMaterials = 0, inProgress = 0, blocked = 0, completed = 0;
                if (!casesError && casesData) {
                  pendingAnalysis = casesData.filter(c => c.status === 'Pending Analysis' || c.status === 'Pending').length;
                  awaitingMaterials = casesData.filter(c => c.status === 'Awaiting Materials').length;
                  inProgress = casesData.filter(c => c.status === 'In-Progress').length;
                  blocked = casesData.filter(c => c.status === 'Blocked').length;
                  completed = casesData.filter(c => c.status === 'Completed').length;
                }

                functionResponseContext = `\n\n[System Data - สถิติเคส Rework สด (Operational Database)]:\n- จำนวนรายการสินค้าที่พบปัญหาทั้งหมด: ${total} รายการ\n- จำแนกประเภทความเสียหาย: รั่ว (Leak): ${leaks} รายการ, เปื้อน (Stain): ${stains} รายการ\n- จำแนกสถานะเคส: รอวิเคราะห์ (Pending Analysis): ${pendingAnalysis}, รอเบิกวัสดุ (Awaiting Materials): ${awaitingMaterials}, กำลังซ่อม (In-Progress): ${inProgress}, ติดปัญหา (Blocked): ${blocked}, เสร็จสิ้น (Completed): ${completed}\n`;
                console.log(`[RAG API] Analytics tool executed. Total items: ${total}, Leaks: ${leaks}, Stains: ${stains}`);
              } else {
                console.error('Failed to fetch rework analytics:', statsError);
              }
            } else if (call.name === 'lookup_item_master') {
              console.log('[RAG API] Model requested lookup_item_master tool. Executing query...');
              const args = call.args as Record<string, unknown> | undefined;
              const keyword = typeof args?.keyword === 'string' ? args.keyword.trim() : '';

              let query = supabaseServer.from('rework_master_items').select('item_code, item_number, item_name').limit(5);
              if (keyword) {
                query = query.or(`item_code.ilike.%${keyword}%,item_number.ilike.%${keyword}%,item_name.ilike.%${keyword}%`);
              }

              const { data: itemsData, error: itemsError } = await query;
              if (!itemsError && itemsData && itemsData.length > 0) {
                const itemStr = itemsData.map(i => `- รหัสสินค้า (Item Code): ${i.item_code} | รหัสสูตรผลิต (Item No): ${i.item_number || 'N/A'} | ชื่อสินค้า: ${i.item_name || 'N/A'}`).join('\n');
                functionResponseContext = `\n\n[System Data - ข้อมูลสเปกสินค้ากลาง (Central Item Master: ${keyword || 'All'})]:\n${itemStr}\n`;
                console.log(`[RAG API] Item master lookup executed. Found ${itemsData.length} items.`);
              } else {
                functionResponseContext = `\n\n[System Data - ข้อมูลสินค้ากลาง (Item Master)]: ไม่พบสเปกสินค้าที่ตรงกับคำค้นหา '${keyword}' ในฐานข้อมูล Item Master\n`;
              }
            } else if (call.name === 'search_engineering_drawings') {
              console.log('[RAG API] Model requested search_engineering_drawings tool. Executing query...');
              const args = call.args as Record<string, unknown> | undefined;
              const searchQuery = typeof args?.query === 'string' ? args.query.trim() : '';

              if (!canRoleAccessDrawings(auth.profile)) {
                functionResponseContext = `\n\n[System Data - คลังแบบแปลนวิศวกรรม]: ปฏิเสธการเข้าถึง - ผู้ใช้งานบทบาท ${auth.profile} ไม่มีสิทธิ์เข้าถึงแบบแปลนวิศวกรรมและ Master Sheet\n`;
              } else {
                let query = ragSupabaseServer
                  .from('engineering_drawings')
                  .select('id, drawing_number, revision, part_name, customer_name, item_code, item_number, package_size, oil_group, pallet_type, boxes_per_pallet, shelf_life, type, file_url, issue_date')
                  .eq('is_active', true)
                  .order('created_at', { ascending: false })
                  .limit(5);

                if (searchQuery) {
                  query = query.or(
                    `drawing_number.ilike.%${searchQuery}%,part_name.ilike.%${searchQuery}%,customer_name.ilike.%${searchQuery}%,item_code.ilike.%${searchQuery}%,item_number.ilike.%${searchQuery}%`
                  );
                }

                const { data: drawData, error: drawError } = await query;
                if (!drawError && drawData && drawData.length > 0) {
                  const drawStr = drawData.map(d => {
                    const typeLabel = d.type === 'master' ? 'Master Sheet' : 'Engineering Drawing';
                    return `- [${typeLabel}] เลขที่แบบ/เอกสาร: ${d.drawing_number} | Rev: ${d.revision || '-'} | ชิ้นส่วน: ${d.part_name || '-'} | ลูกค้า: ${d.customer_name || '-'} | Item Code: ${d.item_code || '-'} | Item No: ${d.item_number || '-'} | บรรจุภัณฑ์: ${d.package_size || '-'} | กลุ่มน้ำมัน: ${d.oil_group || '-'} | พาเลท: ${d.pallet_type || '-'} | กล่อง/พาเลท: ${d.boxes_per_pallet || '-'} ${d.file_url ? `| ลิงก์ไฟล์: [📄 ${d.drawing_number}](${d.file_url})` : ''}`;
                  }).join('\n');
                  functionResponseContext = `\n\n[System Data - คลังแบบแปลนวิศวกรรม & Master Sheets (Engineering Drawings Registry)]:\n${drawStr}\n`;
                  console.log(`[RAG API] Real engineering_drawings search executed. Found ${drawData.length} records.`);
                } else {
                  functionResponseContext = `\n\n[System Data - คลังแบบแปลนวิศวกรรม (Engineering Drawings Registry)]: ไม่พบแบบแปลนหรือ Master Sheet ที่ตรงกับคำค้นหา '${searchQuery}' ในระบบ (กรุณาตรวจสอบเลขที่แบบ Drawing Number, Item Code, หรือชื่อชิ้นส่วน)\n`;
                }
              }
            } else if (call.name === 'search_rework_history') {
              console.log('[RAG API] Model requested search_rework_history tool. Executing query...');
              const args = call.args as Record<string, unknown> | undefined;
              const limit = typeof args?.limit === 'number' ? args.limit : 5;
              const { data: casesData, error: casesError } = await supabaseServer.from('rework_cases')
                .select('id, status, resolution_method, items:rework_items(item_code, reason)')
                .order('created_at', { ascending: false })
                .limit(limit);
              if (!casesError && casesData) {
                const casesStr = casesData.map(c => `- Case ${c.id}: Status: ${c.status}, Fix: ${c.resolution_method || 'N/A'}, Items: ${c.items ? (c.items as { item_code: string; reason: string }[]).map((i: { item_code: string; reason: string }) => i.item_code + ' (' + i.reason + ')').join(', ') : 'None'}`).join('\n');
                functionResponseContext = `\n\n[System Data (Recent Rework Cases)]:\n${casesStr}\n`;
                console.log(`[RAG API] Tool search_rework_history executed. Fetched ${casesData.length} cases.`);
              } else {
                console.error('Failed to fetch rework history:', casesError);
              }
            } else if (call.name === 'get_rework_item_detail') {
              console.log('[RAG API] Model requested get_rework_item_detail tool. Executing query...');
              const args = call.args as Record<string, unknown> | undefined;
              const keyword = typeof args?.keyword === 'string' ? args.keyword : '';
              if (keyword) {
                const { data: itemData, error: itemError } = await supabaseServer.from('rework_items')
                  .select('case_id, item_code, item_number, reason, amount, responsible, rework_cases(status, resolution_method)')
                  .or(`item_code.ilike.%${keyword}%,item_number.ilike.%${keyword}%`)
                  .limit(3);
                if (!itemError && itemData && itemData.length > 0) {
                  const itemsStr = itemData.map(c => {
                    const caseInfo = c.rework_cases ? (Array.isArray(c.rework_cases) ? c.rework_cases[0] : c.rework_cases) : null;
                    return `- Item ${c.item_code} (${c.item_number}): Defect: ${c.reason}, Fix: ${caseInfo?.resolution_method || 'N/A'}, Status: ${caseInfo?.status || 'Unknown'}, Amount: ${c.amount}, Responsible: ${c.responsible}`;
                  }).join('\n');
                  functionResponseContext = `\n\n[System Data (Item Detail for ${keyword})]:\n${itemsStr}\n`;
                  console.log(`[RAG API] Tool get_rework_item_detail executed for ${keyword}.`);
                } else {
                  functionResponseContext = `\n\n[System Data]: No details found for item '${keyword}'.\n`;
                  console.error('Failed to fetch item detail:', itemError);
                }
              }
            }
          }
        }
      } catch (e) {
          console.error('Tool check failed, proceeding normally', e);
        }

        // Proactive Case Lookup Fallback: If no tool was invoked by model, but user query contains a case pattern (e.g. RW888, RW001, RT-2026-001)
        if (!functionResponseContext) {
          const casePatternMatch = message.match(/(?:RW|RT)[-\s]?\d+(?:[-\s]?\d+)*/i) || message.match(/\b\d{3}\b/);
          if (casePatternMatch) {
            const detectedCaseQuery = casePatternMatch[0];
            console.log(`[RAG API] Proactive case pattern detected: '${detectedCaseQuery}'. Searching database...`);
            functionResponseContext = await buildCaseResponseContext(detectedCaseQuery);
          }
        }

        try {
          const stream = await ai.models.generateContentStream({
            model: 'gemini-3.1-flash-lite',
            contents: [
              { role: 'user', parts: [{ text: systemPrompt + functionResponseContext }] },
              ...historyContents,
              { role: 'user', parts: [{ text: `คำถามปัจจุบัน: ${message}` }] }
            ]
          });

          const encoder = new TextEncoder();
          const readableStream = new ReadableStream({
            async start(controller) {
              // Send metadata first (sources)
              const metadata = {
                sources: chunks.map((c: DocumentChunk) => {
                  const filename = c.filename || (c.document_id ? docMap.get(c.document_id) : undefined) || 'เอกสารคู่มือ SOP / ข้อกำหนดทางเทคนิค';
                  return {
                    content: c.content,
                    filename,
                    source_type: 'rag_document',
                    quote_snippet: c.content.length > 200 ? c.content.substring(0, 200) + '...' : c.content,
                    image_urls: c.image_urls,
                    similarity: c.similarity
                  };
                })
              };
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'metadata', data: metadata })}\n\n`));

              // Stream chunks
              try {
                for await (const chunk of stream) {
                  if (chunk.text) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'text', data: chunk.text })}\n\n`));
                  }
                }
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
              } catch (err: unknown) {
                console.error('Streaming error:', err);
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', data: err instanceof Error ? err.message : 'Stream failed' })}\n\n`));
              } finally {
                controller.close();
              }
            }
          });

          return new Response(readableStream, {
            headers: {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              'Connection': 'keep-alive'
            }
          });

        } catch (genErr: unknown) {
          console.error('Gemini Generation Error:', genErr);
          // If quota limit or model error occurs before stream starts, throw to be caught by main handler
          throw genErr;
        }
      }

      case 'feedback': {
        const { query, response, context, is_positive } = body;

        if (!query || !response || is_positive === undefined) {
          return NextResponse.json({ success: false, error: 'Missing required feedback fields' }, { status: 400 });
        }

        console.log(`[RAG API] Saving RAG Feedback: ${is_positive ? 'positive' : 'negative'}`);

        const { error } = await ragSupabaseServer
          .from('rag_feedback')
          .insert([{
            query,
            response,
            context_used: context,
            is_positive
          }]);

        if (error) {
          // If table doesn't exist yet, we just log it and return success to not break UI
          console.warn('[RAG API] Could not save feedback (table might not exist):', error.message);
        }

        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ success: false, error: `Invalid action: ${action}` }, { status: 400 });
    }
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }

    console.error('[RAG API] Handler Error:', error);

    let errMsg = error instanceof Error ? error.message : 'Internal Server Error';
    let statusCode = 500;

    // Check for Rate Limit / Quota Exceeded from API
    if (errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('exceeded your current quota')) {
      if (errMsg.includes('Jina API error')) {
        errMsg = 'โควตา Jina Embeddings เต็ม (เกินจำนวน Token) โปรดตรวจสอบ API Key ของ Jina';
      } else {
        errMsg = 'โควตา Gemini AI เต็ม โปรดรอสักครู่หรือเปลี่ยน API Key';
      }
      statusCode = 429;
    }

    return NextResponse.json(
      { success: false, error: errMsg },
      { status: statusCode }
    );
  }
}
