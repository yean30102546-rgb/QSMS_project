import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../lib/supabaseServer';
import { GoogleGenAI } from '@google/genai';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
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

        // 2. Parse file content (Gemini for PDF, xlsx parser for Excel)
        let parsedText = '';

        if (fileType === 'pdf') {
          const mimeType = 'application/pdf';
          const parsePrompt = 'จงสกัดข้อมูลรายละเอียดทั้งหมดในเอกสารนี้ให้ออกมาเป็นข้อความโครงสร้าง JSON ที่ระบุค่าฟิลด์แต่ละหัวข้อ และตรวจดูว่ามีรูปภาพใดๆ (เช่น แกลลอน, ฝา, พาเลท) หรือไม่ พร้อมเขียนคำอธิบายรายละเอียดของรูปภาพเหล่านั้นอย่างลึกซึ้ง';

          console.log(`🤖 Requesting Gemma 4 26B parsing for PDF ${filename}...`);
          const parseResponse = await ai.models.generateContent({
            model: 'gemma-4-26b-a4b-it',
            contents: [
              { inlineData: { mimeType, data: base64Data } },
              { text: parsePrompt }
            ]
          });

          parsedText = parseResponse.text || '';
        } else if (fileType === 'xlsx') {
          console.log(`📊 Parsing Excel file server-side with SheetJS for ${filename}...`);
          try {
            const buffer = Buffer.from(base64Data, 'base64');
            const workbook = XLSX.read(buffer, { type: 'buffer' });
            let excelText = '';

            for (const sheetName of workbook.SheetNames) {
              const worksheet = workbook.Sheets[sheetName];
              const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];
              if (rows.length === 0) continue;

              const sheetText = rows
                .map(row => row.map(cell => (cell === null || cell === undefined ? '' : String(cell).trim())).join(' | '))
                .filter(line => line.trim().replace(/\|/g, '').trim().length > 0)
                .join('\n');

              if (sheetText.trim()) {
                excelText += `### Sheet: ${sheetName}\n${sheetText}\n\n`;
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

        // 3. Chunk the parsed text using LangChain
        const splitter = new RecursiveCharacterTextSplitter({
          chunkSize: 1000,
          chunkOverlap: 200,
        });
        const langChainDocs = await splitter.createDocuments([parsedText]);
        const chunks = langChainDocs.map(d => d.pageContent).filter(c => c.length > 30);
        console.log(`📦 Generated ${chunks.length} chunks for indexing.`);

        // 4. Generate embeddings (Batch processing to avoid rate limit 429)
        console.log(`✨ Generating embeddings in batches...`);
        const BATCH_SIZE = 5;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const allInsertRecords: any[] = [];

        for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
          const batchChunks = chunks.slice(i, i + BATCH_SIZE);
          console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(chunks.length / BATCH_SIZE)}...`);

          const embedPromises = batchChunks.map(async (chunk) => {
            try {
              const embedResponse = await ai.models.embedContent({
                model: 'gemini-embedding-2',
                contents: chunk,
                config: { outputDimensionality: 768 }
              });
              return {
                chunk,
                embeddingValues: embedResponse.embeddings?.[0]?.values
              };
            } catch (err) {
              console.error('Error embedding chunk:', err);
              return { chunk, embeddingValues: null };
            }
          });

          const results = await Promise.all(embedPromises);

          results.forEach(res => {
            if (res.embeddingValues) {
              allInsertRecords.push({
                document_id: docRecord.id,
                content: res.chunk,
                embedding: res.embeddingValues,
                image_urls: imageUrls || []
              });
            }
          });
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
        const { message } = body;
        if (!message) {
          return NextResponse.json({ success: false, error: 'Missing query message' }, { status: 400 });
        }

        console.log(`💬 Processing chat query: "${message.substring(0, 50)}..."`);

        // 1. Generate query embedding vector
        const embedResponse = await ai.models.embedContent({
          model: 'gemini-embedding-2',
          contents: message,
          config: { outputDimensionality: 768 }
        });

        const queryEmbedding = embedResponse.embeddings?.[0]?.values;
        if (!queryEmbedding) {
          throw new Error('Failed to generate embedding for the search query.');
        }

        // 2. Search similarity using Supabase RPC function
        console.log('🔍 Executing similarity search in database...');
        const { data: matchedChunks, error: matchError } = await supabaseServer.rpc(
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

        console.log(`🎯 Found ${(matchedChunks as DocumentChunk[] | null)?.length || 0} matching document chunks.`);

        const chunks = (matchedChunks as DocumentChunk[] | null) || [];

        // 3. Construct Context
        const contextText = chunks
          .map((chunk, index: number) => `[Source Block #${index + 1}]:\n${chunk.content}\nRelated Images: ${JSON.stringify(chunk.image_urls || [])}`)
          .join('\n\n');

        // 4. Formulate System Prompt and request answer from Gemini
        const systemPrompt = `You are the QSMS DocAI RAG assistant. Answer the user's questions about product packaging specifications, Master Small Packs, and Excel datasets based strictly on the retrieved context below.

Retrieved Context:
${contextText}

Instructions:
1. Answer in the Thai language.
2. Be precise and detail-oriented regarding numbers, revisions, item codes, and packaging details.
3. If the context contains image URLs in the image_urls list, you MUST reference them in your markdown response using standard markdown image syntax: ![description](url) so the UI can display them.
4. If the information is not in the context, state politely that you do not have that specific document detail.
5. DO NOT use markdown asterisks (* or **) for text formatting (like bolding or bullet points). Use plain text, numbers, or dashes (-) instead.`;

        console.log('🤖 Requesting response from Gemini chat model (using Gemma 4 26B for higher RPD)...');
        const chatResponse = await ai.models.generateContent({
          model: 'gemma-4-26b-a4b-it',
          contents: [
            { role: 'user', parts: [{ text: `${systemPrompt}\n\nUser Question: ${message}` }] }
          ]
        });

        return NextResponse.json({
          success: true,
          data: {
            text: chatResponse.text || 'ขออภัยด้วยครับ ไม่สามารถประมวลผลคำตอบได้',
            sources: chunks.map((c) => ({
              content: c.content,
              image_urls: c.image_urls,
              similarity: c.similarity
            }))
          }
        });
      }

      default:
        return NextResponse.json({ success: false, error: `Invalid action: ${action}` }, { status: 400 });
    }
  } catch (error: unknown) {
    console.error('❌ RAG API Handler Error:', error);

    let errMsg = error instanceof Error ? error.message : 'Internal Server Error';
    let statusCode = 500;

    // Check for Rate Limit / Quota Exceeded from Gemini API
    if (errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('exceeded your current quota')) {
      errMsg = 'โทเคนลิมิตเต็ม';
      statusCode = 429;
    }

    return NextResponse.json(
      { success: false, error: errMsg },
      { status: statusCode }
    );
  }
}
