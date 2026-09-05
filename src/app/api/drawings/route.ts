import { NextResponse } from 'next/server'; // Force Turbopack Cache Invalidate
import { ragSupabaseServer } from '../../../lib/ragSupabaseServer';
import { requireServerAuth, AuthError } from '../../../lib/serverAuth';
import { GoogleGenAI, Type } from '@google/genai';
import {
  normalizeCustomerName,
  normalizeRevision,
  normalizePalletType,
  normalizeBoxesPerPallet,
  normalizeItemCode,
  normalizeItemNumber,
  normalizeOilGroup,
  normalizePackageSize,
  parsePackageDetails,
  normalizeShelfLife
} from './normalizers';

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
  'gemini-3.1-flash': { rpm: 15, tpm: 1000000, rpd: 1500 },
  'gemini-3.1-flash-lite': { rpm: 15, tpm: 1000000, rpd: 1500 },
  'gemini-1.5-pro': { rpm: 2, tpm: 32000, rpd: 50 },
  'gemini-2.0-pro': { rpm: 2, tpm: 32000, rpd: 50 },
  'gemini-2.5-pro': { rpm: 2, tpm: 32000, rpd: 50 },
  'gemini-3.5-pro': { rpm: 2, tpm: 32000, rpd: 50 },
};

const DEFAULT_LIMITS = { rpm: 15, tpm: 1000000, rpd: 1500 };


export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const key = searchParams.get('key') || searchParams.get('r2_key');

    if ((action === 'get_drawing_url' || action === 'get_download_url') && key) {
      const { data, error } = await ragSupabaseServer
        .storage
        .from('drawings')
        .createSignedUrl(key, 900);

      if (error || !data) {
        return NextResponse.json({ success: false, error: 'Failed to create signed URL' }, { status: 400 });
      }
      return NextResponse.json({ success: true, url: data.signedUrl });
    }

    return NextResponse.json({ success: false, error: 'Method Not Allowed or Invalid Action' }, { status: 405 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let body: any;
    let fileBuffer: Buffer | null = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      body = Object.fromEntries(formData.entries());
      const file = formData.get('file');
      if (file && typeof file === 'object' && 'arrayBuffer' in file) {
        const arrayBuffer = await (file as any).arrayBuffer();
        fileBuffer = Buffer.from(arrayBuffer);
      }
    } else {
      body = await request.json();
    }

    const { action } = body;

    // Auth Check - Securing the entire API Boundary
    const auth = await requireServerAuth(body);

    console.log(`[Drawings API] ️ Drawings API Action: ${action} | User: ${auth.email}`);

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

Layout 1: ENEOS-style Product Specification (Table at bottom right)
- drawing_number: Extract from "Package Drawing No." (e.g., D-0159). If not found, check "Doc No." or "Effective date" area.
- revision: Extract from "Revision" in the bottom table (e.g., 07).
- part_name: Extract from "Product Name" in the bottom table (e.g., "Genuine Super Hypoid Gear Ecology GL-5 #80").
- customer_name: Look for logo/text (e.g., "ENEOS").
- item_code: Extract from "Product Code". For ENEOS/PTT, this is strictly a 6 to 8-digit number (e.g., 40001234, 407697).
- item_number: Set to null for Drawing sheets (Layout 1).
- issue_date: Extract from "Issued date" (e.g., "8 Jul 26" -> convert to YYYY-MM-DD "2026-07-08").
- package_size: Extract from "Package size". Follow the QSMS Package Size Formatting Rules.
- oil_group: Extract from product name or viscosity grade. Follow the QSMS Oil Group Formatting Rules.
- pallet_type: Look under "Remark" (e.g., Wood, Plastic, ไม้, พลาสติก).
- boxes_per_pallet: Look under "Remark" (e.g., "วางเรียงพาเลท 20 กล่อง" -> 20, or if specified as "ตามความเหมาะสม" / "appropriate" -> "ตามความเหมาะสม").
- shelf_life: Look under "INKJET" or "Remark" (e.g., "Expired 2 years" -> "2 years"). Format strictly as "[Number] years".

Layout 2: SFC MASTER Small Pack (Table at the top)
- drawing_number: Extract from "Doc No." (e.g., SM-ENTH-0014).
- revision: Extract from "Rev." (e.g., 0).
- part_name: Extract from "ชื่อ" (e.g., DAIMOND ATF SP III (Domestic)40000468).
- customer_name: Extract from "ลูกค้า" (e.g., Eneos).
- item_code: Look for an 8-digit number starting with 4 (e.g., 40001234, 40000468) in "ชื่อ", "Product Code" or anywhere in the document.
- item_number: Extract internal Master Item Code from "Item Code" (e.g., 6023670E800A, 61653013A700A). Do NOT put 8-digit numbers like 40001234 here.
- issue_date: Look at bottom signature dates, convert the latest date to YYYY-MM-DD (e.g., "19/5/26" -> "2026-05-19", "20/5/2025" -> "2025-05-20").
- package_size: Extract from "ขนาดบรรจุ". Follow the QSMS Package Size Formatting Rules.
- oil_group: Extract from "กลุ่มน้ำมัน". Follow the QSMS Oil Group Formatting Rules.
- pallet_type: Extract from "พาเลท" (e.g., ไม้สีฟ้า).
- boxes_per_pallet: Extract from "จำนวนกล่องต่อพาเลท" (e.g., 24, or if specified as "ตามความเหมาะสม" / "appropriate" -> "ตามความเหมาะสม").
- shelf_life: Extract from "อายุการใช้งาน" (e.g., EXP. 2 ปี -> "2 years"). Format strictly as "[Number] years".

General rules:
- Format all dates as YYYY-MM-DD.
- Format package_size strictly according to QSMS Package Size Formatting Rules:
  * Small Pack (volume <= 200L): Format as "[Volume] x [Quantity] L." (e.g. "1 x 24 L.", "4 x 6 L.", "18 x 1 L."). If there's a free gift, format as "[Volume] x [Quantity] + [GiftVolume] L." (e.g. "4 x 6 + 1 L."). If no quantity/box layout is found, format as "[Volume] x 1 L.".
  * Pail/Drum (volume 200L to 999L): Format as "[Volume] L." (e.g. "200 L.").
  * IBC (volume >= 1000L): Format as "[Volume] L." (e.g. "1000 L.").
- Format oil_group strictly according to QSMS Oil Group Formatting Rules: MUST be exactly "ENGINE OIL" or "GEAR OIL". Do not output ATF, COOLANT, viscosity values (e.g. 5W-30), or any other terms. Map the product to one of these two main categories. If completely unknown, return null.
- Format shelf_life strictly as "[Number] years" (e.g. "2 years", "5 years"). Convert Thai words or months to number + "years". If unknown, return null.
- Format boxes_per_pallet: Extract numeric digits if specific number is stated (e.g. 24). If the document states "ตามความเหมาะสม" or "ความเหมาะสม", output "ตามความเหมาะสม" directly. DO NOT guess a numeric value.
- If a field is not found in the document, return null or empty string. DO NOT guess or hallucinate.
- If you are unsure about any extracted value, or if the text is blurry/ambiguous, add the exact field name (e.g. 'package_size') to the low_confidence_fields array.
- document_type: Determine if the document is a Customer Drawing (Layout 1) or an Internal Master Sheet (Layout 2). Master sheets typically contain the "SFC Excellence" logo. Customer Drawings typically contain the customer's logo (e.g., ENEOS, NISSAN). Return strictly "drawing" or "master".
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
              shelf_life: { type: Type.STRING },
              document_type: { type: Type.STRING },
              low_confidence_fields: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            }
          }
        };

        const contents = [
          { inlineData: { mimeType: 'application/pdf', data: base64Data } },
          { text: prompt }
        ];

        let response;
        const requestedModel = aiModel || 'gemini-3.1-flash';
        const fallbackCascade = [requestedModel, 'gemini-3.1-flash-lite', 'gemini-2.0-flash'];
        const modelsToTry = Array.from(new Set(fallbackCascade));
        let lastError: any = null;

        for (const currentModel of modelsToTry) {
          console.log(`[Drawings API] Parsing drawing PDF using ${currentModel}...`);
          try {
            response = await ai.models.generateContent({
              model: currentModel,
              contents,
              config
            });
            if (response?.text) {
              console.log(`[Drawings API] Gemini OCR succeeded with model: ${currentModel}`);
              globalRef.requestLogs!.push({ timestamp: Date.now(), model: currentModel, tokens: response.usageMetadata?.totalTokenCount || 0 });
              break;
            }
          } catch (err: unknown) {
            const errMsg = err instanceof Error ? err.message : String(err);
            console.warn(`[Drawings API] ️ Gemini API Error (${currentModel}): ${errMsg}`);
            lastError = err;

            const isRetryableError = errMsg.includes('503') || errMsg.includes('UNAVAILABLE') || errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('404') || errMsg.includes('NOT_FOUND');
            if (isRetryableError && currentModel !== modelsToTry[modelsToTry.length - 1]) {
              console.warn(`[Drawings API] Model ${currentModel} failed (Demand/Limit/Not Found). Falling back to next model...`);
              await new Promise(res => setTimeout(res, 600));
              continue;
            } else {
              break;
            }
          }
        }

        if (!response || !response.text) {
          const errMsg = lastError instanceof Error ? lastError.message : String(lastError);
          console.error(`[Drawings API] All Gemini model fallbacks failed for ${requestedModel}:`, errMsg);

          if (errMsg.includes('503') || errMsg.includes('UNAVAILABLE')) {
            return NextResponse.json({
              success: false,
              error: `เซิร์ฟเวอร์ Gemini กำลังมีผู้ใช้งานสูงชั่วคราว (503 High Demand) กรุณากดปุ่มลองใหม่อีกครั้ง`
            }, { status: 503 });
          }
          if (errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED')) {
            return NextResponse.json({
              success: false,
              error: `โมเดล ${requestedModel} ติดลิมิตการใช้งาน กรุณาเปลี่ยนโมเดลและลองใหม่อีกครั้ง`
            }, { status: 429 });
          }
          throw lastError;
        }

        const parsedData: any = JSON.parse(response.text || '{}');

        // Apply normalizers to parsedData fields
        if (parsedData.revision) parsedData.revision = normalizeRevision(parsedData.revision);
        if (parsedData.customer_name) parsedData.customer_name = normalizeCustomerName(parsedData.customer_name);
        if (parsedData.oil_group) parsedData.oil_group = normalizeOilGroup(parsedData.oil_group);
        if (parsedData.package_size) {
          parsedData.package_size = normalizePackageSize(parsedData.package_size);
          parsedData.package_details = parsePackageDetails(parsedData.package_size);
        }
        if (parsedData.pallet_type) parsedData.pallet_type = normalizePalletType(parsedData.pallet_type);
        if (parsedData.boxes_per_pallet) parsedData.boxes_per_pallet = normalizeBoxesPerPallet(parsedData.boxes_per_pallet);
        if (parsedData.item_code) parsedData.item_code = normalizeItemCode(parsedData.item_code);
        if (parsedData.item_number) parsedData.item_number = normalizeItemNumber(parsedData.item_number);
        if (parsedData.shelf_life) parsedData.shelf_life = normalizeShelfLife(parsedData.shelf_life);

        // Log successful request with actual tokens consumed
        const tokensUsed = response.usageMetadata?.totalTokenCount || 0;
        const now = Date.now();
        // Clean older than 24h
        globalRef.requestLogs = globalRef.requestLogs!.filter(log => log.timestamp > now - 24 * 60 * 60 * 1000);

        return NextResponse.json({ success: true, data: parsedData });
      }

      case 'get_api_usage': {
        const { model } = body;
        const targetModel = model || 'gemini-3.1-flash';

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
        const { drawing_number, revision, part_name, customer_name, item_code, item_number, issue_date, package_size, oil_group, pallet_type, boxes_per_pallet, shelf_life, file_name, type } = body;

        // Either base64Data (old way) or fileBuffer (new way via FormData)
        const base64Data = body.base64Data;
        const buffer = fileBuffer || (base64Data ? Buffer.from(base64Data, 'base64') : null);

        if (!drawing_number || !revision || !part_name || !customer_name || !file_name || !type || !buffer) {
          return NextResponse.json({ success: false, error: 'Missing required fields or file data' }, { status: 400 });
        }

        const r2_key = `${type}/${drawing_number}_rev${revision}_${Date.now()}.pdf`;

        // Upload to Supabase Storage in RAG project
        console.log(`[Drawings API] ️ Uploading to Supabase Storage (RAG Project): ${r2_key}`);

        const { error: uploadError } = await ragSupabaseServer
          .storage
          .from('drawings')
          .upload(r2_key, buffer, {
            contentType: 'application/pdf',
            upsert: true
          });

        if (uploadError) {
          console.error('[Drawings API] Error uploading to storage:', uploadError);
          throw uploadError;
        }

        // Update existing drawing to inactive
        console.log(`[Drawings API] Updating old drawings to inactive...`);
        const { error: updateError } = await ragSupabaseServer
          .from('engineering_drawings')
          .update({ is_active: false })
          .eq('drawing_number', drawing_number)
          .eq('type', type);

        if (updateError) {
          console.error('[Drawings API] Error updating old drawings:', updateError);
          await ragSupabaseServer.storage.from('drawings').remove([r2_key]);
          throw updateError;
        }

        // Insert new drawing
        console.log(`[Drawings API] Inserting new drawing record...`);
        const { data: newDoc, error: insertError } = await ragSupabaseServer
          .from('engineering_drawings')
          .insert([{
            drawing_number,
            revision: normalizeRevision(revision),
            part_name,
            customer_name: normalizeCustomerName(customer_name),
            item_code: normalizeItemCode(item_code),
            item_number: normalizeItemNumber(item_number, type),
            issue_date: issue_date || null,
            package_size: normalizePackageSize(package_size),
            package_details: parsePackageDetails(normalizePackageSize(package_size)),
            oil_group: normalizeOilGroup(oil_group),
            pallet_type: normalizePalletType(pallet_type),
            boxes_per_pallet: normalizeBoxesPerPallet(boxes_per_pallet),
            shelf_life: normalizeShelfLife(shelf_life),
            r2_key,
            file_name,
            type,
            is_active: true,
            created_by: auth.email
          }])
          .select()
          .single();

        if (insertError) {
          console.error('[Drawings API] Error inserting new drawing:', insertError);
          // Rollback storage
          await ragSupabaseServer.storage.from('drawings').remove([r2_key]);
          // Revert update (set is_active=true)
          await ragSupabaseServer.from('engineering_drawings').update({ is_active: true }).eq('drawing_number', drawing_number).eq('type', type);
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

        console.log(`[Drawings API] Updating drawing metadata for ID: ${id}...`);

        const updateData: any = {
          drawing_number,
          part_name,
          customer_name: normalizeCustomerName(customer_name),
        };

        let docType = body.type;
        if (!docType && item_number !== undefined) {
          const { data: existing } = await ragSupabaseServer
            .from('engineering_drawings')
            .select('type')
            .eq('id', id)
            .maybeSingle();
          docType = existing?.type;
        }

        if (item_code !== undefined) updateData.item_code = normalizeItemCode(item_code);
        if (item_number !== undefined) updateData.item_number = normalizeItemNumber(item_number, docType);
        if (issue_date !== undefined) updateData.issue_date = (typeof issue_date === 'string' && issue_date.trim() === '') ? null : issue_date;
        if (package_size !== undefined) {
          const normSize = normalizePackageSize(package_size);
          updateData.package_size = normSize;
          updateData.package_details = parsePackageDetails(normSize);
        }
        if (oil_group !== undefined) updateData.oil_group = normalizeOilGroup(oil_group);
        if (pallet_type !== undefined) updateData.pallet_type = normalizePalletType(pallet_type);
        if (boxes_per_pallet !== undefined) updateData.boxes_per_pallet = normalizeBoxesPerPallet(boxes_per_pallet);
        if (shelf_life !== undefined) updateData.shelf_life = normalizeShelfLife(shelf_life);

        const { data: updatedDoc, error: updateError } = await ragSupabaseServer
          .from('engineering_drawings')
          .update(updateData)
          .eq('id', id)
          .select()
          .single();

        if (updateError) {
          console.error('[Drawings API] Error updating drawing:', updateError);
          throw updateError;
        }

        return NextResponse.json({ success: true, data: updatedDoc });
      }

      case 'get_download_url': {
        const { r2_key, file_name, preview } = body;
        if (!r2_key) {
          return NextResponse.json({ success: false, error: 'Missing r2_key' }, { status: 400 });
        }

        console.log(`[Drawings API] Generating pre-signed URL for: ${r2_key}`);

        const options: { download?: string | boolean } = {};
        if (!preview) {
          options.download = file_name || 'document.pdf';
        }

        const { data, error } = await ragSupabaseServer
          .storage
          .from('drawings')
          .createSignedUrl(r2_key, 3600, options);

        if (error || !data) {
          console.error('[Drawings API] Error generating signed url:', error);
          throw error;
        }

        return NextResponse.json({ success: true, url: data.signedUrl });
      }

      case 'check_duplicates': {
        const { items } = body;
        if (!items || !Array.isArray(items)) {
          return NextResponse.json({ success: false, error: 'Invalid items array' }, { status: 400 });
        }

        const results: Record<string, boolean> = {};
        const drawingNumbers = items.map((i: any) => i.drawing_number).filter(Boolean);

        if (drawingNumbers.length === 0) {
          return NextResponse.json({ success: true, duplicates: {} });
        }

        const { data, error } = await ragSupabaseServer
          .from('engineering_drawings')
          .select('drawing_number, revision, type')
          .in('drawing_number', drawingNumbers)
          .eq('is_active', true);

        if (error) {
          console.error('[Drawings API] Error checking duplicates:', error);
          throw error;
        }

        for (const item of items) {
          if (!item.drawing_number || !item.revision) {
            results[`${item.type}_${item.drawing_number}_${item.revision}`] = false;
            continue;
          }
          const isDup = data?.some(
            dbItem =>
              dbItem.drawing_number === item.drawing_number &&
              dbItem.revision === item.revision &&
              dbItem.type === item.type
          );
          results[`${item.type}_${item.drawing_number}_${item.revision}`] = !!isDup;
        }

        return NextResponse.json({ success: true, duplicates: results });
      }

      case 'list_drawings': {
        const { page = 1, pageSize = 50, search = '', filters = {}, show_inactive = false, type } = body;

        let query = ragSupabaseServer.from('engineering_drawings').select('*', { count: 'exact' });

        if (type && type !== 'link') {
          query = query.eq('type', type);
        }

        if (!show_inactive) {
          query = query.eq('is_active', true);
        }

        if (search) {
          query = query.or(`drawing_number.ilike.%${search}%,part_name.ilike.%${search}%,customer_name.ilike.%${search}%,item_code.ilike.%${search}%`);
        }

        if (filters.packageSize && filters.packageSize !== 'all') {
          query = query.eq('package_size', filters.packageSize);
        }
        if (filters.oilGroup && Array.isArray(filters.oilGroup) && filters.oilGroup.length > 0) {
          query = query.in('oil_group', filters.oilGroup);
        }
        if (filters.customer && Array.isArray(filters.customer) && filters.customer.length > 0) {
          query = query.in('customer_name', filters.customer);
        }
        if (filters.palletType && Array.isArray(filters.palletType) && filters.palletType.length > 0) {
          query = query.in('pallet_type', filters.palletType);
        }
        if (filters.revision && Array.isArray(filters.revision) && filters.revision.length > 0) {
          query = query.in('revision', filters.revision);
        }

        // Pagination
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        query = query.order('created_at', { ascending: false }).range(from, to);

        const { data, error, count } = await query;

        if (error) {
          console.error('[Drawings API] Error fetching drawings:', error);
          throw error;
        }
        return NextResponse.json({ success: true, data: data || [], total: count || 0, page, pageSize });
      }

      case 'get_overview_stats': {
        const { data, error } = await ragSupabaseServer
          .from('engineering_drawings')
          .select('type, drawing_number, item_code')
          .eq('is_active', true);

        if (error) {
          console.error('[Drawings API] Error fetching overview stats:', error);
          throw error;
        }

        const docs = data || [];
        const drawings = docs.filter(d => d.type === 'drawing');
        const masters = docs.filter(d => d.type === 'master');

        const gaps = drawings.filter(d => {
          return !masters.some(m => {
            const matchByItemCode = !!(d.item_code && m.item_code && d.item_code === m.item_code);
            const matchByDrawingNo = !!(d.drawing_number && m.drawing_number && d.drawing_number === m.drawing_number);
            return matchByItemCode || matchByDrawingNo;
          });
        });

        const totalDrawings = drawings.length;
        const missingMasters = gaps.length;
        const completedMasters = totalDrawings - missingMasters;
        const coverageRate = totalDrawings > 0 ? Math.round((completedMasters / totalDrawings) * 100) : 0;

        return NextResponse.json({
          success: true,
          data: {
            totalDrawings,
            completedMasters,
            missingMasters,
            coverageRate
          }
        });
      }

      case 'get_filter_options': {
        const { data, error } = await ragSupabaseServer
          .from('engineering_drawings')
          .select('package_size, oil_group, customer_name, pallet_type, revision')
          .eq('is_active', true);

        if (error) {
          throw error;
        }

        const packageSizes = new Set<string>();
        const oilGroups = new Set<string>();
        const customers = new Set<string>();
        const palletTypes = new Set<string>();
        const revisions = new Set<string>();

        (data || []).forEach((row: any) => {
          if (row.package_size) packageSizes.add(row.package_size);
          if (row.oil_group) oilGroups.add(row.oil_group);
          if (row.customer_name) customers.add(row.customer_name);
          if (row.pallet_type) palletTypes.add(row.pallet_type);
          if (row.revision) revisions.add(row.revision);
        });

        const small: string[] = [];
        const pail: string[] = [];
        const ibc: string[] = [];
        const other: string[] = [];

        Array.from(packageSizes).forEach(size => {
          const num = parseFloat(size);
          if (isNaN(num)) other.push(size);
          else if (num < 20) small.push(size);
          else if (num < 1000) pail.push(size);
          else ibc.push(size);
        });

        const sortFn = (a: string, b: string) => (parseFloat(a) || 0) - (parseFloat(b) || 0);
        small.sort(sortFn);
        pail.sort(sortFn);
        ibc.sort(sortFn);
        other.sort();

        return NextResponse.json({
          success: true,
          options: {
            packageSizes: { small, pail, ibc, other },
            oilGroups: Array.from(oilGroups).sort(),
            customers: Array.from(customers).sort(),
            palletTypes: Array.from(palletTypes).sort(),
            revisions: Array.from(revisions).sort(),
          }
        });
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
          console.error('[Drawings API] Error fetching drawing history:', error);
          throw error;
        }
        return NextResponse.json({ success: true, data: data || [] });
      }

      default:
        return NextResponse.json({ success: false, error: `Invalid action: ${action}` }, { status: 400 });
    }
  } catch (error: any) {
    if (error && error.name === 'AuthError') {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status || 401 });
    }
    console.error('[Drawings API] Handler Error:', error);
    const errMsg = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ success: false, error: errMsg }, { status: 500 });
  }
}
