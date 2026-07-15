import { NextResponse } from 'next/server'; // Force Turbopack Cache Invalidate
import { ragSupabaseServer } from '../../../lib/ragSupabaseServer';
import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    timeout: 60000 // 60 seconds
  }
});
// Keep a in-memory sliding window history of requests
interface ApiRequestLog {
  timestamp: number;
  model: string;
  tokens: number;
}

const globalRef = global as unknown as {
  requestLogs?: ApiRequestLog[];
};

if (!globalRef.requestLogs) {
  globalRef.requestLogs = [];
}

const MODEL_LIMITS: Record<string, { rpm: number; tpm: number; rpd: number }> = {
  'gemini-1.5-flash': { rpm: 15, tpm: 1000000, rpd: 1500 },
  'gemini-2.0-flash': { rpm: 15, tpm: 1000000, rpd: 1500 },
  'gemini-2.5-flash': { rpm: 15, tpm: 1000000, rpd: 1500 },
  'gemini-3.5-flash': { rpm: 15, tpm: 1000000, rpd: 1500 },
  'gemini-3.1-flash-lite': { rpm: 15, tpm: 1000000, rpd: 1500 },
  'gemini-1.5-pro': { rpm: 2, tpm: 32000, rpd: 50 },
  'gemini-2.0-pro': { rpm: 2, tpm: 32000, rpd: 50 },
  'gemini-2.5-pro': { rpm: 2, tpm: 32000, rpd: 50 },
  'gemini-3.5-pro': { rpm: 2, tpm: 32000, rpd: 50 },
};

const DEFAULT_LIMITS = { rpm: 15, tpm: 1000000, rpd: 1500 };

// Normalization function to standardize customer names
const normalizeCustomerName = (name: string | null | undefined): string | null | undefined => {
  if (!name) return name;
  const lower = name.toLowerCase();
  
  if (lower.includes('eneos')) {
    return 'ENEOS';
  }
  if (lower.includes('honda')) {
    return 'HONDA';
  }
  return name;
};

const normalizeOilGroup = (group: string | null | undefined): string | null => {
  if (!group) return null;
  const clean = group.trim().toUpperCase();
  if (clean === 'ENGINE OIL' || clean.includes('ENGINE') || clean.includes('MOTOR') || clean.includes('เครื่องยนต์') || clean.includes('ดีเซล') || clean.includes('เบนซิน')) {
    return 'ENGINE OIL';
  }
  if (clean === 'GEAR OIL' || clean.includes('GEAR') || clean.includes('เกียร์')) {
    return 'GEAR OIL';
  }
  return null;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    console.log(`🏗️ Drawings API Action: ${action}`);

    switch (action) {

      case 'parse_drawing': {
        const { base64Data, aiModel } = body;
        if (!base64Data) {
          return NextResponse.json({ success: false, error: 'Missing base64Data' }, { status: 400 });
        }

        if (!process.env.GEMINI_API_KEY) {
          return NextResponse.json({ success: false, error: 'GEMINI_API_KEY is not configured on the server.' }, { status: 500 });
        }

        const prompt = `You are a QSMS Document OCR specialist. 
Your task is to analyze this document (which could be an ENEOS-style Product Specification or an SFC MASTER Small Pack sheet) and extract the following metadata properties in Thai or English as present.

There are two common layouts:
Layout 1: ENEOS-style Product Specification (Table at bottom right)
- drawing_number: Extract from "Package Drawing No." (e.g., D-0159). If not found, check "Doc No." or "Effective date" area.
- revision: Extract from "Revision" in the bottom table (e.g., 07).
- part_name: Extract from "Product Name" in the bottom table (e.g., "Genuine Super Hypoid Gear Ecology GL-5 #80").
- customer_name: Look for logo/text (e.g., "ENEOS").
- item_code: Extract from "Product Code". For ENEOS, this is strictly an 8-digit number starting with 4 (e.g., 40001234).
- issue_date: Extract from "Issued date" (e.g., "8 Jul 26" -> convert to YYYY-MM-DD "2026-07-08").
- package_size: Extract from "Package size". Follow the QSMS Package Size Formatting Rules.
- oil_group: Extract from product name or viscosity grade. Follow the QSMS Oil Group Formatting Rules.
- pallet_type: Look under "Remark" (e.g., Wood, Plastic, ไม้, พลาสติก).
- boxes_per_pallet: Look under "Remark" (e.g., "วางเรียงพาเลท 20 กล่อง" -> 20).
- shelf_life: Look under "INKJET" or "Remark" (e.g., "Expired 2 years" -> "2 years").

Layout 2: SFC MASTER Small Pack (Table at the top)
- drawing_number: Extract from "Doc No." (e.g., SM-ENTH-0014).
- revision: Extract from "Rev." (e.g., 0).
- part_name: Extract from "ชื่อ" (e.g., DAIMOND ATF SP III (Domestic)40000468).
- customer_name: Extract from "ลูกค้า" (e.g., Eneos).
- item_code: For ENEOS, look for an 8-digit number starting with 4 (e.g., 40001234) in "ชื่อ" or "Product Code" or anywhere in the document.
- item_number: Extract from "Item Code" (e.g., 6023670E800A).
- issue_date: Look at bottom signature dates, convert the latest date to YYYY-MM-DD (e.g., "19/5/26" -> "2026-05-19", "20/5/2025" -> "2025-05-20").
- package_size: Extract from "ขนาดบรรจุ". Follow the QSMS Package Size Formatting Rules.
- oil_group: Extract from "กลุ่มน้ำมัน". Follow the QSMS Oil Group Formatting Rules.
- pallet_type: Extract from "พาเลท" (e.g., ไม้สีฟ้า).
- boxes_per_pallet: Extract from "จำนวนกล่องต่อพาเลท" (e.g., 24).
- shelf_life: Extract from "อายุการใช้งาน" (e.g., EXP. 2 ปี -> "2 ปี").

General rules:
- Format all dates as YYYY-MM-DD.
- Format package_size strictly according to QSMS Package Size Formatting Rules:
  * Small Pack (volume <= 200L): Format as "[Volume] x [Quantity] L." (e.g. "1 x 24 L.", "4 x 6 L.", "18 x 1 L."). If there's a free gift, format as "[Volume] x [Quantity] + [GiftVolume] L." (e.g. "4 x 6 + 1 L."). If no quantity/box layout is found, format as "[Volume] x 1 L.".
  * Pail/Drum (volume 200L to 999L): Format as "[Volume] L." (e.g. "200 L.").
  * IBC (volume >= 1000L): Format as "[Volume] L." (e.g. "1000 L.").
- Format oil_group strictly according to QSMS Oil Group Formatting Rules: MUST be exactly "ENGINE OIL" or "GEAR OIL". Do not output ATF, COOLANT, viscosity values (e.g. 5W-30), or any other terms. Map the product to one of these two main categories. If completely unknown, return null.
- If a field is not found in the document, return null or empty string. DO NOT guess or hallucinate.
- Return structured JSON matching the requested fields.`;

        const config = {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              drawing_number: { type: Type.STRING },
              revision: { type: Type.STRING },
              part_name: { type: Type.STRING },
              customer_name: { type: Type.STRING },
              item_code: { type: Type.STRING },
              item_number: { type: Type.STRING },
              issue_date: { type: Type.STRING },
              package_size: { type: Type.STRING },
              oil_group: { type: Type.STRING },
              pallet_type: { type: Type.STRING },
              boxes_per_pallet: { type: Type.STRING },
              shelf_life: { type: Type.STRING }
            }
          }
        };

        const contents = [
          { inlineData: { mimeType: 'application/pdf', data: base64Data } },
          { text: prompt }
        ];

        let response;
        const targetModel = aiModel || 'gemini-3-flash';
        console.log(`🤖 Parsing drawing PDF using ${targetModel}...`);
        
        try {
          response = await ai.models.generateContent({
            model: targetModel,
            contents,
            config
          });
        } catch (err: unknown) {
          const errMsg = err instanceof Error ? err.message : String(err);
          console.error(`❌ Gemini API Error (${targetModel}):`, errMsg);
          
          // Log request even if it failed (from a rate limit perspective it counts)
          globalRef.requestLogs!.push({ timestamp: Date.now(), model: targetModel, tokens: 0 });

          if (errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED')) {
            console.warn('⚠️ Gemini rate limit hit (429). Returning clear error.');
            return NextResponse.json({ 
              success: false, 
              error: `โมเดล ${targetModel} ติดลิมิตการใช้งาน กรุณาเปลี่ยนโมเดลและลองใหม่อีกครั้ง` 
            }, { status: 429 });
          }
          if (errMsg.includes('404') || errMsg.includes('NOT_FOUND') || errMsg.includes('no longer available')) {
            console.warn('⚠️ Gemini model not found or restricted (404).');
            return NextResponse.json({ 
              success: false, 
              error: `โมเดล ${targetModel} ถูกยกเลิกหรือไม่สามารถใช้งานได้กับ API Key นี้ กรุณาเลือกโมเดลอื่น` 
            }, { status: 404 });
          }
          throw err;
        }

        const parsedData: unknown = JSON.parse(response.text || '{}');
        
        // Log successful request with actual tokens consumed
        const tokensUsed = response.usageMetadata?.totalTokenCount || 0;
        const now = Date.now();
        globalRef.requestLogs!.push({ timestamp: now, model: targetModel, tokens: tokensUsed });
        // Clean older than 24h
        globalRef.requestLogs = globalRef.requestLogs!.filter(log => log.timestamp > now - 24 * 60 * 60 * 1000);

        return NextResponse.json({ success: true, data: parsedData });
      }

      case 'get_api_usage': {
        const { model } = body;
        const targetModel = model || 'gemini-3.5-flash';
        
        const now = Date.now();
        const oneMinuteAgo = now - 60 * 1000;
        const oneDayAgo = now - 24 * 60 * 60 * 1000;
        
        const modelLogs = globalRef.requestLogs!.filter(log => log.model === targetModel);
        
        const rpm = modelLogs.filter(log => log.timestamp > oneMinuteAgo).length;
        const tpm = modelLogs.filter(log => log.timestamp > oneMinuteAgo).reduce((acc, log) => acc + log.tokens, 0);
        const rpd = modelLogs.filter(log => log.timestamp > oneDayAgo).length;
        
        const limits = MODEL_LIMITS[targetModel] || DEFAULT_LIMITS;
        
        return NextResponse.json({
          success: true,
          usage: { rpm, tpm, rpd },
          limits
        });
      }


      case 'save_drawing': {
        const { drawing_number, revision, part_name, customer_name, item_code, item_number, issue_date, package_size, oil_group, pallet_type, boxes_per_pallet, shelf_life, file_name, type, base64Data, created_by } = body;

        if (!drawing_number || !revision || !part_name || !customer_name || !file_name || !type || !base64Data) {
          return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        const buffer = Buffer.from(base64Data, 'base64');
        const r2_key = `${type}/${drawing_number}_rev${revision}_${Date.now()}.pdf`;

        // Upload to Supabase Storage in RAG project
        console.log(`☁️ Uploading to Supabase Storage (RAG Project): ${r2_key}`);

        const { error: uploadError } = await ragSupabaseServer
          .storage
          .from('drawings')
          .upload(r2_key, buffer, {
            contentType: 'application/pdf',
            upsert: true
          });

        if (uploadError) {
          console.error('❌ Error uploading to storage:', uploadError);
          throw uploadError;
        }

        // Update existing drawing to inactive
        console.log(`🔄 Updating old drawings to inactive...`);
        const { error: updateError } = await ragSupabaseServer
          .from('engineering_drawings')
          .update({ is_active: false })
          .eq('drawing_number', drawing_number)
          .eq('type', type);

        if (updateError) {
          console.error('❌ Error updating old drawings:', updateError);
          throw updateError;
        }

        // Insert new drawing
        console.log(`💾 Inserting new drawing record...`);
        const { data: newDoc, error: insertError } = await ragSupabaseServer
          .from('engineering_drawings')
          .insert([{
            drawing_number,
            revision,
            part_name,
            customer_name: normalizeCustomerName(customer_name),
            item_code: item_code || null,
            item_number: item_number || null,
            issue_date: issue_date || null,
            package_size: package_size || null,
            oil_group: normalizeOilGroup(oil_group),
            pallet_type: pallet_type || null,
            boxes_per_pallet: boxes_per_pallet || null,
            shelf_life: shelf_life || null,
            r2_key,
            file_name,
            type,
            is_active: true,
            created_by
          }])
          .select()
          .single();

        if (insertError) {
          console.error('❌ Error inserting new drawing:', insertError);
          throw insertError;
        }

        return NextResponse.json({ success: true, data: newDoc });
      }

      case 'update_drawing': {
        const { 
          id,
          drawing_number,
          revision,
          part_name,
          customer_name,
          item_code,
          item_number,
          issue_date,
          package_size,
          oil_group,
          pallet_type,
          boxes_per_pallet,
          shelf_life
        } = body;

        if (!id) {
          return NextResponse.json({ success: false, error: 'Missing document id' }, { status: 400 });
        }

        console.log(`📝 Updating drawing metadata for ID: ${id}...`);
        
        const updateData: any = {
          drawing_number,
          revision,
          part_name,
          customer_name: normalizeCustomerName(customer_name),
        };

        if (item_code !== undefined) updateData.item_code = (typeof item_code === 'string' && item_code.trim() === '') ? null : item_code;
        if (item_number !== undefined) updateData.item_number = (typeof item_number === 'string' && item_number.trim() === '') ? null : item_number;
        if (issue_date !== undefined) updateData.issue_date = (typeof issue_date === 'string' && issue_date.trim() === '') ? null : issue_date;
        if (package_size !== undefined) updateData.package_size = (typeof package_size === 'string' && package_size.trim() === '') ? null : package_size;
        if (oil_group !== undefined) updateData.oil_group = normalizeOilGroup(oil_group);
        if (pallet_type !== undefined) updateData.pallet_type = (typeof pallet_type === 'string' && pallet_type.trim() === '') ? null : pallet_type;
        if (boxes_per_pallet !== undefined) updateData.boxes_per_pallet = (typeof boxes_per_pallet === 'string' && boxes_per_pallet.trim() === '') ? null : boxes_per_pallet;
        if (shelf_life !== undefined) updateData.shelf_life = (typeof shelf_life === 'string' && shelf_life.trim() === '') ? null : shelf_life;

        const { data: updatedDoc, error: updateError } = await ragSupabaseServer
          .from('engineering_drawings')
          .update(updateData)
          .eq('id', id)
          .select()
          .single();

        if (updateError) {
          console.error('❌ Error updating drawing:', updateError);
          throw updateError;
        }

        return NextResponse.json({ success: true, data: updatedDoc });
      }

      case 'get_download_url': {
        const { r2_key, file_name, preview } = body;
        if (!r2_key) {
          return NextResponse.json({ success: false, error: 'Missing r2_key' }, { status: 400 });
        }

        console.log(`🔗 Generating pre-signed URL for: ${r2_key}`);

        const options: { download?: string | boolean } = {};
        if (!preview) {
          options.download = file_name || 'document.pdf';
        }

        const { data, error } = await ragSupabaseServer
          .storage
          .from('drawings')
          .createSignedUrl(r2_key, 900, options);

        if (error || !data) {
          console.error('❌ Error generating signed url:', error);
          throw error;
        }

        return NextResponse.json({ success: true, url: data.signedUrl });
      }

      case 'list_drawings': {
        const { data, error } = await ragSupabaseServer
          .from('engineering_drawings')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('❌ Error fetching drawings:', error);
          throw error;
        }
        return NextResponse.json({ success: true, data: data || [] });
      }

      case 'get_drawing_history': {
        const { drawing_number, type } = body;
        if (!drawing_number || !type) {
          return NextResponse.json({ success: false, error: 'Missing drawing_number or type' }, { status: 400 });
        }

        const { data, error } = await ragSupabaseServer
          .from('engineering_drawings')
          .select('*')
          .eq('drawing_number', drawing_number)
          .eq('type', type)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('❌ Error fetching drawing history:', error);
          throw error;
        }
        return NextResponse.json({ success: true, data: data || [] });
      }

      default:
        return NextResponse.json({ success: false, error: `Invalid action: ${action}` }, { status: 400 });
    }
  } catch (error: unknown) {
    console.error('❌ Drawings API Handler Error:', error);
    const errMsg = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ success: false, error: errMsg }, { status: 500 });
  }
}
