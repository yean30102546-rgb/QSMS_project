import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../lib/supabaseServer';
import { GoogleGenAI } from '@google/genai';

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

        // 2. Query Gemini model to parse file content
        const mimeType = fileType === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        const parsePrompt = fileType === 'pdf' 
          ? 'จงสกัดข้อมูลรายละเอียดทั้งหมดในเอกสารนี้ให้ออกมาเป็นข้อความโครงสร้าง JSON ที่ระบุค่าฟิลด์แต่ละหัวข้อ และตรวจดูว่ามีรูปภาพใดๆ (เช่น แกลลอน, ฝา, พาเลท) หรือไม่ พร้อมเขียนคำอธิบายรายละเอียดของรูปภาพเหล่านั้นอย่างลึกซึ้ง'
          : 'จงอ่านและแปลงข้อมูลสเปรดชีต Excel นี้ให้ออกมาเป็นรูปแบบข้อความ Markdown ที่อ่านเข้าใจง่าย แบ่งออกเป็นแต่ละรายการสินค้าตามแถวและคอลัมน์โดยละเอียด';

        console.log(`🤖 Requesting Gemini parsing for ${filename}...`);
        const parseResponse = await ai.models.generateContent({
          model: 'gemini-1.5-flash',
          contents: [
            { inlineData: { mimeType, data: base64Data } },
            parsePrompt
          ]
        });

        const parsedText = parseResponse.text || '';
        if (!parsedText.trim()) {
          throw new Error('Gemini model returned empty text output.');
        }

        console.log(`📝 Parsing completed. Length: ${parsedText.length} characters.`);

        // 3. Chunk the parsed text
        // We split by double newlines (paragraphs/markdown blocks) to preserve context boundaries
        const rawChunks = parsedText
          .split('\n\n')
          .map(c => c.trim())
          .filter(c => c.length > 30);

        // Fallback if split yields nothing
        const chunks = rawChunks.length > 0 ? rawChunks : [parsedText];
        console.log(`📦 Generated ${chunks.length} chunks for indexing.`);

        // 4. Generate embeddings and insert into Supabase
        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          console.log(`✨ Generating embedding for chunk ${i + 1}/${chunks.length} (length: ${chunk.length})`);
          
          const embedResponse = await ai.models.embedContent({
            model: 'text-embedding-004',
            contents: chunk
          });

          const embeddingValues = embedResponse.embeddings?.[0]?.values;
          if (!embeddingValues) {
            console.warn(`⚠️ Failed to generate embedding for chunk index ${i}. Skipping.`);
            continue;
          }

          const { error: chunkError } = await supabaseServer
            .from('rag_document_chunks')
            .insert([{
              document_id: docRecord.id,
              content: chunk,
              embedding: embeddingValues,
              image_urls: imageUrls || []
            }]);

          if (chunkError) {
            console.error(`❌ Error inserting chunk index ${i}:`, chunkError);
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
          model: 'text-embedding-004',
          contents: message
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

        console.log(`🎯 Found ${matchedChunks?.length || 0} matching document chunks.`);

        // 3. Construct Context
        const contextText = (matchedChunks || [])
          .map((chunk: any, index: number) => `[Source Block #${index + 1}]:\n${chunk.content}\nRelated Images: ${JSON.stringify(chunk.image_urls || [])}`)
          .join('\n\n');

        // 4. Formulate System Prompt and request answer from Gemini
        const systemPrompt = `You are the QSMS DocAI RAG assistant. Answer the user's questions about product packaging specifications, Master Small Packs, and Excel datasets based strictly on the retrieved context below.

Retrieved Context:
${contextText}

Instructions:
1. Answer in the Thai language.
2. Be precise and detail-oriented regarding numbers, revisions, item codes, and packaging details.
3. If the context contains image URLs in the image_urls list, you MUST reference them in your markdown response using standard markdown image syntax: ![description](url) so the UI can display them.
4. If the information is not in the context, state politely that you do not have that specific document detail.`;

        console.log('🤖 Requesting response from Gemini chat model...');
        const chatResponse = await ai.models.generateContent({
          model: 'gemini-1.5-flash',
          contents: [
            { role: 'user', parts: [{ text: `${systemPrompt}\n\nUser Question: ${message}` }] }
          ]
        });

        return NextResponse.json({
          success: true,
          data: {
            text: chatResponse.text || 'ขออภัยด้วยครับ ไม่สามารถประมวลผลคำตอบได้',
            sources: (matchedChunks || []).map((c: any) => ({
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
  } catch (error: any) {
    console.error('❌ RAG API Handler Error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
