import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../lib/supabaseServer';
import { GoogleGenAI } from '@google/genai';
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
        const { data, error } = await supabaseServer
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
        const { error } = await supabaseServer
          .from('rag_documents')
          .delete()
          .eq('id', id);

        if (error) {
          console.error('❌ Error deleting document:', error);
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
        const { data: docRecord, error: docError } = await supabaseServer
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

          console.log(`🤖 Requesting Gemini 2.5 Flash parsing for ${filename} (${mimeType})...`);
          const parseResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
              { inlineData: { mimeType, data: base64Data } },
              { text: parsePrompt }
            ]
          });

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

        // 3. Chunk the parsed text using LangChain MarkdownTextSplitter (Semantic Chunking)
        const splitter = new MarkdownTextSplitter({
          chunkSize: 1200,
          chunkOverlap: 200,
        });
        const langChainDocs = await splitter.createDocuments([parsedText]);
        const chunks = langChainDocs.map(d => d.pageContent).filter(c => c.length > 30);
        console.log(`📦 Generated ${chunks.length} chunks for indexing.`);

        // 4. Generate embeddings using Jina AI (768 dimensions to fit schema)
        console.log(`✨ Generating embeddings using Jina AI...`);
        const allInsertRecords: any[] = [];
        const jinaApiKey = process.env.JINA_API_KEY || '';

        if (!jinaApiKey) {
          throw new Error('JINA_API_KEY is not configured on the server. Please check your .env configuration.');
        }

        const BATCH_SIZE = 20;
        for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
          const batchChunks = chunks.slice(i, i + BATCH_SIZE);
          console.log(`Processing Jina batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(chunks.length / BATCH_SIZE)}...`);

          try {
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
            console.error('Error generating Jina embeddings for batch:', err);
            throw err;
          }
        }

        // 5. Bulk insert into Supabase
        console.log(`💾 Bulk inserting ${allInsertRecords.length} chunks into database...`);
        if (allInsertRecords.length > 0) {
          const { error: chunkError } = await supabaseServer
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

        // 1. Generate query embedding vector using Jina AI
        const jinaApiKey = process.env.JINA_API_KEY || '';
        if (!jinaApiKey) {
          throw new Error('JINA_API_KEY is not configured on the server. Please check your .env configuration.');
        }

        console.log('✨ Generating query embedding via Jina AI...');
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
            input: [message]
          })
        });

        if (!jinaRes.ok) {
          const errorText = await jinaRes.text();
          throw new Error(`Jina API error (${jinaRes.status}): ${errorText}`);
        }

        const jinaData = await jinaRes.json();
        const queryEmbedding = jinaData.data?.[0]?.embedding;

        if (!queryEmbedding || queryEmbedding.length !== 768) {
          throw new Error('Failed to generate embedding for the search query via Jina.');
        }

        // 2. Search similarity using Supabase RPC function (Hybrid Search)
        console.log('🔍 Executing Hybrid Search in database...');
        let matchedChunks: any = [];
        
        // Try hybrid search first
        const { data: hybridData, error: hybridError } = await supabaseServer.rpc(
          'hybrid_search_chunks',
          {
            query_text: message,
            query_embedding: queryEmbedding,
            match_count: 5
          }
        );

        if (hybridError || !hybridData) {
          console.warn('⚠️ Hybrid search failed or not available, falling back to pure vector search:', hybridError);
          const { data: vectorData, error: matchError } = await supabaseServer.rpc(
            'match_document_chunks',
            {
              query_embedding: queryEmbedding,
              match_threshold: 0.3,
              match_count: 5
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

        console.log(`🎯 Found ${(matchedChunks as DocumentChunk[] | null)?.length || 0} matching document chunks.`);

        const chunks = (matchedChunks as DocumentChunk[] | null) || [];

        // 3. Construct Context
        const contextText = chunks
          .map((chunk, index: number) => `[Source Block #${index + 1}]:\n${chunk.content}\nRelated Images: ${JSON.stringify(chunk.image_urls || [])}`)
          .join('\n\n');

        // 4. Formulate System Prompt and request answer from Gemini
        const systemPrompt = `You are "น้องผึ้งพา" (Nong Beepa), the QSMS DocAI RAG assistant. 
Persona: Friendly, Helpful, & Empathetic. You always communicate with a supportive, accessible tone to reduce user stress. You frequently use polite particles (ครับ/ค่ะ) and appropriate emojis (🐝✨😊👍). You are highly knowledgeable about product packaging specifications, Master Small Packs, and factory procedures.

Retrieved Context:
${contextText}

Instructions:
1. Answer in the Thai language. Keep the tone friendly and encouraging.
2. Be precise and detail-oriented regarding numbers, revisions, item codes, and packaging details from the Context.
3. If the context contains image URLs in the image_urls list, you MUST reference them in your markdown response using standard markdown image syntax: ![description](url) so the UI can display them.
4. If the information is not in the context, state politely that you do not have that specific document detail, and offer to help with something else.
5. DO NOT use markdown asterisks (* or **) for text formatting (like bolding or bullet points). Use plain text, numbers, or dashes (-) instead.
6. Suggestion Chips: At the very end of your response, you MUST append a hidden JSON block containing 3 suggested follow-up questions relevant to the topic. Format exactly like this: \`\`\`json\n{"suggested_questions": ["Question 1?", "Question 2?", "Question 3?"]}\n\`\`\`
`;

        console.log('🤖 Requesting streaming response from Gemini chat model (using gemini-3.1-flash-lite)...');
        
        // Map conversation history
        const historyContents = messages.map((m: any) => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.text }]
        }));

        try {
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
              // Send metadata first (sources)
              const metadata = { 
                sources: chunks.map((c: any) => ({
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
              } catch (err: any) {
                console.error('Streaming error:', err);
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', data: err.message || 'Stream failed' })}\n\n`));
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

        } catch (genErr: any) {
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
        
        const { error } = await supabaseServer
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
