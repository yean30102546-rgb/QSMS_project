import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Try to load .env.local first, then .env
const envLocalPath = path.resolve(process.cwd(), '.env.local');
const envPath = path.resolve(process.cwd(), '.env');

if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
} else {
  dotenv.config({ path: envPath });
}

const supabaseUrl = process.env.NEXT_PUBLIC_RAG_SUPABASE_URL;
const supabaseKey = process.env.RAG_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_RAG_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Error: Missing NEXT_PUBLIC_RAG_SUPABASE_URL or RAG_SUPABASE_SERVICE_ROLE_KEY in environment variables.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface PackageDetails {
  volume: number;
  unit: string;
  qty: number;
  free: number;
}

function parsePackageSize(rawStr: string): PackageDetails | null {
  if (!rawStr || typeof rawStr !== 'string') return null;

  const str = rawStr.trim().toUpperCase();

  const normalizeUnit = (u: string) => (u.startsWith('ML') || u.startsWith('MILLI') ? 'ML' : 'L');

  // Pattern 1: {volume} x {qty} + {free} {unit}
  // e.g., "1 x 12 L.", "4 x 4 + 1 L.", "0.8 x 12 L.", "0.12 x 24 L.", "6 x 3 + 1 L."
  const p1 = /^([\d\.]+)\s*X\s*(\d+)(?:\s*\+\s*([\d\.]+))?\s*(L\.|L|ML|LITER|LITERS|MILLILITER|MILLILITERS)?\.?$/;
  const m1 = str.match(p1);
  if (m1) {
    return {
      volume: parseFloat(m1[1]),
      qty: parseInt(m1[2], 10),
      free: m1[3] ? parseFloat(m1[3]) : 0,
      unit: normalizeUnit(m1[4] || 'L'),
    };
  }

  // Pattern 2: {volume} {unit} X {qty}
  // e.g., "100 ML X 24", "180 ML X 12", "1 LITER X 24"
  const p2 = /^([\d\.]+)\s*(L\.|L|ML|LITER|LITERS|MILLILITER|MILLILITERS)\.?\s*X\s*(\d+)$/;
  const m2 = str.match(p2);
  if (m2) {
    return {
      volume: parseFloat(m2[1]),
      unit: normalizeUnit(m2[2]),
      qty: parseInt(m2[3], 10),
      free: 0,
    };
  }

  // Pattern 3: {qty} + {free} X {volume} {unit}
  // e.g., "4+1 X 4 L."
  const p3 = /^(\d+)\s*\+\s*([\d\.]+)\s*X\s*([\d\.]+)\s*(L\.|L|ML|LITER|LITERS|MILLILITER|MILLILITERS)?\.?$/;
  const m3 = str.match(p3);
  if (m3) {
    return {
      qty: parseInt(m3[1], 10),
      free: parseFloat(m3[2]),
      volume: parseFloat(m3[3]),
      unit: normalizeUnit(m3[4] || 'L'),
    };
  }

  // Pattern 4: {volume} {unit}
  // e.g., "200 L.", "209 L."
  const p4 = /^([\d\.]+)\s*(L\.|L|ML|LITER|LITERS|MILLILITER|MILLILITERS)\.?$/;
  const m4 = str.match(p4);
  if (m4) {
    return {
      volume: parseFloat(m4[1]),
      unit: normalizeUnit(m4[2]),
      qty: 1,
      free: 0,
    };
  }
  
  // Pattern 5: Reversed volume and qty "20 x 1 L." (Assuming 1 L., 20 qty)
  const p5 = /^(\d+)\s*X\s*([\d\.]+)\s*(L\.|L|ML|LITER|LITERS|MILLILITER|MILLILITERS)?\.?$/;
  const m5 = str.match(p5);
  if (m5) {
     return {
      qty: parseInt(m5[1], 10),
      volume: parseFloat(m5[2]),
      unit: normalizeUnit(m5[3] || 'L'),
      free: 0,
    };
  }

  // Fallback for completely weird patterns
  return null;
}

async function run() {
  console.log("Fetching records from engineering_drawings...");
  
  const { data: records, error } = await supabase
    .from('engineering_drawings')
    .select('id, package_size');
    
  if (error) {
    console.error("Error fetching data:", error);
    process.exit(1);
  }
  
  if (!records || records.length === 0) {
    console.log("No records found.");
    return;
  }
  
  console.log(`Found ${records.length} records. Processing...`);
  
  let successCount = 0;
  let outlierCount = 0;
  let skippedCount = 0;
  
  for (const record of records) {
    if (!record.package_size) {
      skippedCount++;
      continue;
    }
    
    const parsed = parsePackageSize(record.package_size);
    
    if (parsed) {
      // Valid pattern
      const { error: updateError } = await supabase
        .from('engineering_drawings')
        .update({ package_details: parsed })
        .eq('id', record.id);
        
      if (updateError) {
        console.error(`Error updating ID ${record.id}:`, updateError);
      } else {
        successCount++;
      }
    } else {
      // Outlier pattern
      console.warn(`[OUTLIER DETECTED] Unrecognized pattern for ID ${record.id}: "${record.package_size}"`);
      outlierCount++;
      
      // Update with null for package_details
      await supabase
        .from('engineering_drawings')
        .update({ package_details: null })
        .eq('id', record.id);
    }
  }
  
  console.log("-----------------------------------------");
  console.log("Migration Complete.");
  console.log(`Total Records: ${records.length}`);
  console.log(`Successfully parsed: ${successCount}`);
  console.log(`Outliers (set to null): ${outlierCount}`);
  console.log(`Skipped (no package_size): ${skippedCount}`);
}

run().catch(console.error);
