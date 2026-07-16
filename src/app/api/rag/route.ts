import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../lib/supabaseServer';
import { ragSupabaseServer } from '../../../lib/ragSupabaseServer';
import { GoogleGenAI, Type } from '@google/genai';
import { MarkdownTextSplitter } from '@langchain/textsplitters';
import * as XLSX from 'xlsx';

interface DocumentChunk {
  content: string;
  image_urls?: string[];
  similarity: number;
}

// Initialize the Google Gen AI client with the API Key
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    console.log(`🤖 RAG API Action: ${action}`);

    if (!process.env.GEMINI_API_KEY) {
      console.error('❌ GEMINI_API_KEY is missing in environment variables.');
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
          console.error('❌ Error fetching rag_documents:', error);
          throw error;
        }
        return NextResponse.json({ success: true, data: data || [] });
      }

      case 'delete_document': {
        const { id } = body;
        if (!id) {
          return NextResponse.json({ success: false, error: 'Missing document ID.' }, { status: 400 });
        }

        console.log(`🗑️ Deleting document and chunks for ID: ${id}`);
        // Chunks are automatically deleted via ON DELETE CASCADE foreign key
        const { error } = await ragSupabaseServer
          .from('rag_documents')
          .delete()
          .eq('id', id);

        if (error) {
          console.error('❌ Error deleting document:', error);
          throw error;
        }
        return NextResponse.json({ success: true });
      }

      case 'get_document_chunks': {
        const { documentId } = body;
        if (!documentId) {
          return NextResponse.json({ success: false, error: 'Missing document ID.' }, { status: 400 });
        }

        console.log(`🔍 Fetching chunks for document ID: ${documentId}`);
        const { data, error } = await ragSupabaseServer
          .from('rag_document_chunks')
          .select('id, content, image_urls')
          .eq('document_id', documentId);

        if (error) {
          console.error('❌ Error fetching document chunks:', error);
          throw error;
        }
        return NextResponse.json({ success: true, data: data || [] });
      }

      case 'bulk_delete_documents': {
        const { ids } = body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
          return NextResponse.json({ success: false, error: 'Missing or invalid document IDs.' }, { status: 400 });
        }

        console.log(`🗑️ Bulk deleting documents for ${ids.length} IDs`);
        const { error } = await ragSupabaseServer
          .from('rag_documents')
          .delete()
          .in('id', ids);

        if (error) {
          console.error('❌ Error bulk deleting documents:', error);
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

        console.log(`📥 Ingesting document: ${filename} (${fileType})`);

        // 1. Insert parent document metadata record
        const { data: docRecord, error: docError } = await ragSupabaseServer
          .from('rag_documents')
          .insert([{ filename, file_type: fileType }])
          .select()
          .single();

        if (docError) {
          console.error('❌ Error inserting rag_documents metadata:', docError);
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
            console.log(`🤖 Requesting Gemini 3.1 Flash Lite parsing for ${filename} (${mimeType})...`);
            parseResponse = await ai.models.generateContent({
              model: 'gemini-3.1-flash-lite',
              contents: [
                { inlineData: { mimeType, data: base64Data } },
                { text: parsePrompt }
              ]
            });
          } catch (error: unknown) {
            console.warn(`⚠️ Gemini 3.1 Flash Lite failed (possibly 503 high demand). Falling back to gemini-2.0-flash:`, error instanceof Error ? error.message : String(error));
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
          console.log(`📊 Parsing Excel file server-side with SheetJS for ${filename}...`);
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
            console.error('❌ Error parsing Excel with SheetJS:', err);
            throw new Error(`Failed to parse Excel file: ${err instanceof Error ? err.message : String(err)}`);
          }
        } else {
          throw new Error(`Unsupported file type: ${fileType}`);
        }

        if (!parsedText.trim()) {
          throw new Error('Parsed document content is empty.');
        }

        console.log(`📝 Parsing completed. Length: ${parsedText.length} characters.`);

        // 3. Chunk the parsed text using Markdown Headers (Semantic Header-based Chunking)
        console.log(`📦 Segmenting text based on markdown headers...`);
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
        console.log(`📦 Generated ${filteredChunks.length} header-based chunks for indexing.`);

        // 4. Generate embeddings using Jina AI or Gemini as fallback (768 dimensions)
        console.log(`✨ Generating embeddings...`);
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
                console.warn(`⚠️ Warning: Missing or invalid embedding at index ${index} in batch.`);
              }
            });
          } catch (err) {
            console.warn('⚠️ Jina Embeddings failed, falling back to Gemini text-embedding-004:', err instanceof Error ? err.message : String(err));
            
            try {
              console.log(`Processing Gemini embedding batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(filteredChunks.length / BATCH_SIZE)}...`);
              const embedPromises = batchChunks.map(async (chunk) => {
                const embedResponse = await ai.models.embedContent({
                  model: 'text-embedding-004',
                  contents: chunk
                });
                const embeddingValues = embedResponse.embeddings?.[0]?.values;
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
              console.error('❌ Critical: Both Jina and Gemini embeddings failed:', geminiErr);
              throw geminiErr;
            }
          }
        }

        // 5. Bulk insert into Supabase
        console.log(`💾 Bulk inserting ${allInsertRecords.length} chunks into database...`);
        if (allInsertRecords.length > 0) {
          const { error: chunkError } = await ragSupabaseServer
            .from('rag_document_chunks')
            .insert(allInsertRecords);

          if (chunkError) {
            console.error(`❌ Error bulk inserting chunks:`, chunkError);
            throw chunkError;
          }
        }

        console.log(`🎉 Ingest successful for document: ${filename}`);
        return NextResponse.json({ success: true, data: { docId: docRecord.id, totalChunks: chunks.length } });
      }

      case 'chat': {
        const { message, messages = [] } = body;
        if (!message) {
          return NextResponse.json({ success: false, error: 'Missing query message' }, { status: 400 });
        }

        console.log(`💬 Processing chat query: "${message.substring(0, 50)}..."`);

        // 1. Query Expansion (Gemini generates 3 variations)
        let searchQueries = [message];
        try {
          console.log('🤖 Expanding search queries with Gemini...');
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
            console.log('🔍 Expanded queries:', searchQueries);
          }
        } catch (e) {
          console.warn('⚠️ Query expansion failed, using original message:', e);
        }

        // 2. Generate query embedding vector (Jina AI with Gemini fallback)
        let queryEmbedding: number[] = new Array(768).fill(0);
        const jinaApiKey = process.env.JINA_API_KEY || '';

        try {
          if (!jinaApiKey) {
            throw new Error('JINA_API_KEY is not configured. Forcing fallback.');
          }

          console.log('✨ Generating query embeddings via Jina AI...');
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
          console.warn('⚠️ Jina query embedding failed, falling back to Gemini text-embedding-004:', err instanceof Error ? err.message : String(err));
          
          try {
            const embedPromises = searchQueries.map(async (q) => {
              const embedResponse = await ai.models.embedContent({
                model: 'text-embedding-004',
                contents: q
              });
              return embedResponse.embeddings?.[0]?.values;
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
            console.error('❌ Critical: Both Jina and Gemini query embedding failed:', geminiErr);
            throw geminiErr;
          }
        }

        // 3. Search similarity using Supabase RPC function (Hybrid Search)
        console.log('🔍 Executing Hybrid Search in database (Match Count 12)...');
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
          console.warn('⚠️ Hybrid search failed, falling back to pure vector search:', hybridError);
          const { data: vectorData, error: matchError } = await ragSupabaseServer.rpc(
            'match_document_chunks',
            {
              query_embedding: queryEmbedding,
              match_threshold: 0.25,
              match_count: 12
            }
          );

          if (matchError) {
            console.error('❌ Error executing match_document_chunks RPC:', matchError);
            throw matchError;
          }
          matchedChunks = vectorData;
        } else {
          matchedChunks = hybridData;
        }

        console.log(`🎯 Found ${(matchedChunks as DocumentChunk[] | null)?.length || 0} raw matching document chunks.`);
        const rawChunks = (matchedChunks as DocumentChunk[] | null) || [];
        
        // 4. Jina Rerank to pick top 8 relevant chunks
        let rerankedChunks: DocumentChunk[] = [];
        if (rawChunks.length > 0 && jinaApiKey) {
          try {
            console.log(`✨ Reranking ${rawChunks.length} chunks via Jina Reranker...`);
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
              console.log(`🎯 Rerank completed. Filtered down to ${rerankedChunks.length} high-relevance chunks.`);
            } else {
              const errorText = await rerankRes.text();
              console.warn(`⚠️ Jina Rerank API error (${rerankRes.status}): ${errorText}. Using top 8 raw chunks.`);
              rerankedChunks = rawChunks.slice(0, 8);
            }
          } catch (rerankErr) {
            console.warn('⚠️ Jina Reranking failed, using raw vector chunks:', rerankErr);
            rerankedChunks = rawChunks.slice(0, 8);
          }
        } else {
          rerankedChunks = rawChunks.slice(0, 8);
        }

        const chunks = rerankedChunks;

        // 3. Construct Context
        const contextText = chunks
          .map((chunk, index: number) => `[Source Block #${index + 1}]:\n${chunk.content}\nRelated Images: ${JSON.stringify(chunk.image_urls || [])}`)
          .join('\n\n');

        // 4. Formulate System Prompt and request answer from Gemini
        const systemPrompt = `You are the "QSMS AI Assistant", the DocAI RAG assistant and Data Analyst for QSMS.
Persona: Professional, concise, highly knowledgeable, and helpful. You communicate in a clear, supportive tone suitable for an enterprise environment. Use polite particles (ครับ/ค่ะ) appropriately but avoid excessive emojis. You are an expert on product packaging specifications, Master Small Packs, factory procedures, and real-time rework statistics.

Retrieved Context:
${contextText}

Instructions:
1. Answer in the Thai language. Keep the tone professional and concise.
2. Be precise and detail-oriented regarding numbers, revisions, item codes, and packaging details from the Context or System Data.
3. If the context contains image URLs in the image_urls list, you MUST reference them in your markdown response using standard markdown image syntax: ![description](url) so the UI can display them.
4. If the information is not in the context or system data, state politely that you do not have that specific detail, and offer to help with something else.
5. DO NOT use markdown asterisks (* or **) for text formatting (like bolding or bullet points). Use plain text, numbers, or dashes (-) instead.
6. Suggestion Chips: At the very end of your response, you MUST append a hidden JSON block containing 3 suggested follow-up questions relevant to the topic. Format exactly like this: \`\`\`json\n{"suggested_questions": ["Question 1?", "Question 2?", "Question 3?"]}\n\`\`\`
`;

        console.log('🤖 Requesting streaming response from Gemini chat model (using gemini-3.1-flash-lite)...');

        // Map conversation history
        const historyContents = messages.map((m: { role: string; text: string }) => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.text }]
        }));

        let functionResponseContext = '';
        try {
          // Pre-flight Agentic Tool Check
          console.log('🔍 Checking if query requires system data tools...');
          const toolResponse = await ai.models.generateContent({
            model: 'gemini-3.1-flash-lite',
            contents: [
              ...historyContents,
              { role: 'user', parts: [{ text: `คำถามปัจจุบัน: ${message}` }] }
            ],
            config: {
              tools: [{
                functionDeclarations: [
                  {
                    name: 'get_rework_statistics',
                    description: 'Fetch real-time statistics about rework cases from the system database (e.g., total rework items, counts of defects like leak (รั่ว) or stain (เปื้อน)). Call this ONLY when the user specifically asks for statistics, data, or counts.'
                  },
                  {
                    name: 'search_rework_history',
                    description: 'Search recent rework cases from the operational database to get actual rework history, issues, and resolutions. Use this when the user asks about recent rework cases or specific problems.',
                    parameters: {
                      type: Type.OBJECT,
                      properties: {
                        limit: { type: Type.NUMBER, description: 'Number of recent cases to fetch (default 5)' }
                      }
                    }
                  },
                  {
                    name: 'get_rework_item_detail',
                    description: 'Get details of a specific rework item by its item code or item number.',
                    parameters: {
                      type: Type.OBJECT,
                      properties: {
                        keyword: { type: Type.STRING, description: 'The item code or item number to search for' }
                      },
                      required: ['keyword']
                    }
                  }
                ]
              }]
            }
          });

          if (toolResponse.functionCalls && toolResponse.functionCalls.length > 0) {
            const call = toolResponse.functionCalls[0];
            if (call.name === 'get_rework_statistics') {
              console.log('🔧 Model requested get_rework_statistics tool. Executing query...');
              const { data: statsData, error: statsError } = await supabaseServer.from('rework_items').select('reason');
              if (!statsError && statsData) {
                const total = statsData.length;
                const leaks = statsData.filter(d => d.reason === 'รั่ว').length;
                const stains = statsData.filter(d => d.reason === 'เปื้อน').length;
                functionResponseContext = `\n\n[System Data (Real-time)]:\n- Total Rework Items: ${total}\n- Leaks (รั่ว): ${leaks}\n- Stains (เปื้อน): ${stains}\n`;
                console.log(`📊 Tool executed. Total: ${total}, Leaks: ${leaks}, Stains: ${stains}`);
              } else {
                console.error('Failed to fetch statistics:', statsError);
              }
            } else if (call.name === 'search_rework_history') {
              console.log('🔧 Model requested search_rework_history tool. Executing query...');
              const args = call.args as Record<string, unknown> | undefined;
              const limit = typeof args?.limit === 'number' ? args.limit : 5;
              const { data: casesData, error: casesError } = await supabaseServer.from('rework_cases')
                .select('id, status, resolution_method, items:rework_items(item_code, reason)')
                .order('created_at', { ascending: false })
                .limit(limit);
              if (!casesError && casesData) {
                const casesStr = casesData.map(c => `- Case ${c.id}: Status: ${c.status}, Fix: ${c.resolution_method || 'N/A'}, Items: ${c.items ? (c.items as { item_code: string; reason: string }[]).map((i: { item_code: string; reason: string }) => i.item_code + ' (' + i.reason + ')').join(', ') : 'None'}`).join('\n');
                functionResponseContext = `\n\n[System Data (Recent Rework Cases)]:\n${casesStr}\n`;
                console.log(`📊 Tool search_rework_history executed. Fetched ${casesData.length} cases.`);
              } else {
                console.error('Failed to fetch rework history:', casesError);
              }
            } else if (call.name === 'get_rework_item_detail') {
              console.log('🔧 Model requested get_rework_item_detail tool. Executing query...');
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
                  console.log(`📊 Tool get_rework_item_detail executed for ${keyword}.`);
                } else {
                  functionResponseContext = `\n\n[System Data]: No details found for item '${keyword}'.\n`;
                  console.error('Failed to fetch item detail:', itemError);
                }
              }
            }
          }
        } catch (e) {
          console.error('Tool check failed, proceeding normally', e);
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
                sources: chunks.map((c: DocumentChunk) => ({
                  content: c.content,
                  image_urls: c.image_urls,
                  similarity: c.similarity
                }))
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

        console.log(`📝 Saving RAG Feedback: ${is_positive ? '👍' : '👎'}`);

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
          console.warn('⚠️ Could not save feedback (table might not exist):', error.message);
        }

        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ success: false, error: `Invalid action: ${action}` }, { status: 400 });
    }
  } catch (error: unknown) {
    console.error('❌ RAG API Handler Error:', error);

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
