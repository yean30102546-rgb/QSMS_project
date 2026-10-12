import fs from 'fs';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import ExcelJS from 'exceljs';
import dotenv from 'dotenv';
import {
  normalizeCustomerName,
  normalizeRevision,
  normalizePalletType,
  normalizeBoxesPerPallet,
  normalizeItemCode,
  normalizeItemNumber,
  normalizeOilGroup,
  normalizePackageSize,
  normalizeShelfLife
} from '../src/app/api/drawings/normalizers';

dotenv.config({ path: '.env.local' });

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: { timeout: 60000 }
});

const OCR_PROMPT = `You are a QSMS Document OCR specialist. 
Your task is to analyze this document (which could be an ENEOS-style Product Specification or an SFC MASTER Small Pack sheet) and extract the following metadata properties in Thai or English as present.

Layout 1: ENEOS-style Product Specification (Table at bottom right)
- drawing_number: Extract from "Package Drawing No." (e.g., D-0159). If not found, check "Doc No." or "Effective date" area.
- revision: Extract from "Revision" in the bottom table (e.g., 07).
- part_name: Extract from "Product Name" in the bottom table (e.g., "Genuine Super Hypoid Gear Ecology GL-5 #80").
- customer_name: Look for logo/text (e.g., "ENEOS").
- item_code: Extract from "Product Code". For ENEOS/PTT, this is strictly a 6 to 8-digit number (e.g., 40001234, 407697).
- item_number: Set to null for Drawing sheets (Layout 1).
- issue_date: Extract from "Issued date" (e.g., "8 Jul 26" -> convert to YYYY-MM-DD "2026-07-08").
- package_size: Extract from "Package size".
- oil_group: Extract from product name or viscosity grade.
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
- issue_date: Look at bottom signature dates, convert the latest date to YYYY-MM-DD.
- package_size: Extract from "ขนาดบรรจุ".
- oil_group: Extract from "กลุ่มน้ำมัน".
- pallet_type: Extract from "พาเลท".
- boxes_per_pallet: Extract from "จำนวนกล่องต่อพาเลท" (e.g., 24, or if specified as "ตามความเหมาะสม" / "appropriate" -> "ตามความเหมาะสม").
- shelf_life: Extract from "อายุการใช้งาน" (e.g., EXP. 2 ปี -> "2 years"). Format strictly as "[Number] years".

General rules:
- Format all dates as YYYY-MM-DD.
- Format package_size: e.g. "1 x 24 L.", "4 x 6 L.", "0.5L x 24", "Box12/1L", "200 L.".
- Format oil_group: "ENGINE OIL" or "GEAR OIL" if applicable, or product type.
- Format shelf_life: strictly as "[Number] years".
- document_type: "drawing" for Layout 1, "master" for Layout 2.

Return JSON matching:
{
  "drawing_number": string,
  "revision": string,
  "part_name": string,
  "customer_name": string,
  "item_code": string,
  "item_number": string,
  "issue_date": string,
  "package_size": string,
  "oil_group": string,
  "pallet_type": string,
  "boxes_per_pallet": string,
  "shelf_life": string,
  "document_type": string
}`;

function parseSimpleCSV(content: string) {
  const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
  const parseLine = (line: string) => {
    const res: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') inQuotes = !inQuotes;
      else if (c === ',' && !inQuotes) { res.push(cur.trim()); cur = ''; }
      else cur += c;
    }
    res.push(cur.trim());
    return res;
  };
  const headers = parseLine(lines[0]);
  return lines.slice(1).map(l => {
    const parts = parseLine(l);
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => obj[h] = parts[i] || '');
    return obj;
  });
}

async function extractWithRetry(pdfPath: string, maxRetries = 3): Promise<any> {
  const base64Data = fs.readFileSync(pdfPath).toString('base64');
  const models = ['gemini-3.1-flash-lite', 'gemini-3.8-flash'];

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    for (const model of models) {
      try {
        const res = await ai.models.generateContent({
          model,
          contents: [
            { inlineData: { mimeType: 'application/pdf', data: base64Data } },
            { text: OCR_PROMPT }
          ],
          config: { responseMimeType: 'application/json' }
        });
        if (res?.text) {
          return JSON.parse(res.text);
        }
      } catch (err: any) {
        const errMsg = err?.message || String(err);
        console.warn(`[OCR] ${path.basename(pdfPath)} attempt ${attempt} (${model}) failed: ${errMsg.slice(0, 80)}`);
        if (errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED')) {
          await new Promise(r => setTimeout(r, 4000));
        } else if (errMsg.includes('503') || errMsg.includes('UNAVAILABLE')) {
          await new Promise(r => setTimeout(r, 2000));
        }
      }
    }
    await new Promise(r => setTimeout(r, 2000 * attempt));
  }
  throw new Error(`Failed to extract ${pdfPath} after ${maxRetries} attempts`);
}

function normalizeExtracted(raw: any): Record<string, any> {
  const norm: Record<string, any> = { ...raw };
  if (norm.revision !== undefined) norm.revision = normalizeRevision(norm.revision);
  if (norm.customer_name !== undefined) norm.customer_name = normalizeCustomerName(norm.customer_name);
  if (norm.oil_group !== undefined) norm.oil_group = normalizeOilGroup(norm.oil_group);
  if (norm.package_size !== undefined) norm.package_size = normalizePackageSize(norm.package_size);
  if (norm.boxes_per_pallet !== undefined) norm.boxes_per_pallet = normalizeBoxesPerPallet(norm.boxes_per_pallet);
  if (norm.item_code !== undefined) norm.item_code = normalizeItemCode(norm.item_code);
  if (norm.item_number !== undefined) norm.item_number = normalizeItemNumber(norm.item_number, norm.document_type);
  if (norm.shelf_life !== undefined) norm.shelf_life = normalizeShelfLife(norm.shelf_life);
  if (norm.document_type) norm.document_type = norm.document_type.toLowerCase().includes('master') ? 'master' : 'drawing';
  return norm;
}

async function processSet(folder: string, manifestPath: string, cacheFile: string) {
  const manifest = parseSimpleCSV(fs.readFileSync(manifestPath, 'utf8'));
  let cache: Record<string, { raw: any; normalized: any }> = {};
  if (fs.existsSync(cacheFile)) {
    try {
      cache = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
    } catch {
      cache = {};
    }
  }

  console.log(`\n=== Processing ${manifest.length} files in ${folder} (cached: ${Object.keys(cache).length}) ===`);

  for (let i = 0; i < manifest.length; i++) {
    const item = manifest[i];
    const fileName = item.FileName;
    const fullPath = path.join(folder, fileName);

    if (cache[fileName]) {
      console.log(`[${i + 1}/${manifest.length}] CACHED: ${fileName}`);
      continue;
    }

    if (!fs.existsSync(fullPath)) {
      console.error(`File not found: ${fullPath}`);
      continue;
    }

    const t0 = Date.now();
    try {
      const raw = await extractWithRetry(fullPath);
      const normalized = normalizeExtracted(raw);
      cache[fileName] = { raw, normalized };
      fs.writeFileSync(cacheFile, JSON.stringify(cache, null, 2), 'utf8');
      console.log(`[${i + 1}/${manifest.length}] OK (${Date.now() - t0}ms): ${fileName} -> Doc: ${normalized.drawing_number}, Rev: ${normalized.revision}`);
    } catch (err: any) {
      console.error(`[${i + 1}/${manifest.length}] ERROR: ${fileName}: ${err.message}`);
    }

    // Rate-limiting pause
    await new Promise(r => setTimeout(r, 1200));
  }

  return cache;
}

async function main() {
  const drawingFolder = 'Drawing files/Test_50_Unique';
  const drawingManifest = 'Drawing files/Test_50_Unique/test_manifest.csv';
  const drawingCache = 'data/ocr_cache_drawings.json';

  const masterFolder = 'Master files/Test_50_Unique';
  const masterManifest = 'Master files/Test_50_Unique/test_manifest.csv';
  const masterCache = 'data/ocr_cache_masters.json';

  console.log('Starting Ground Truth extraction pipeline...');
  const dResults = await processSet(drawingFolder, drawingManifest, drawingCache);
  const mResults = await processSet(masterFolder, masterManifest, masterCache);

  console.log('\n Extraction complete!');
  console.log(`Drawings extracted: ${Object.keys(dResults).length}/50`);
  console.log(`Masters extracted: ${Object.keys(mResults).length}/50`);
}

main().catch(err => {
  console.error('Fatal pipeline error:', err);
  process.exit(1);
});
