const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_RAG_SUPABASE_URL;
const supabaseKey = process.env.RAG_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_RAG_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase credentials missing in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const normalizeRevision = (rev) => {
  if (!rev) return '00';
  let clean = String(rev).trim().toUpperCase();
  clean = clean.replace(/^(REV\.?|V|R)/i, '').trim();

  if (/^\d$/.test(clean)) {
    return clean.padStart(2, '0');
  }
  if (/^\d{2,}$/.test(clean)) {
    return clean;
  }
  return clean === '' || clean === '-' ? '00' : clean;
};

const normalizeCustomerName = (name) => {
  if (!name) return 'ENEOS';
  const clean = name.trim().toLowerCase();
  if (clean.includes('eneos') || clean.includes('honda') || clean.includes('suzuki') || clean.includes('yamalube')) {
    return 'ENEOS';
  }
  if (clean === 'or' || clean.includes('ptt')) {
    return 'PTTOR';
  }
  if (clean.includes('petronas')) {
    return 'PETRONAS';
  }
  if (clean.includes('valvoline')) {
    return 'VALVOLINE';
  }
  if (clean.includes('bcp') || clean.includes('bangchak')) {
    return 'BCP';
  }
  return name.trim().toUpperCase();
};

const normalizePalletType = (type) => {
  if (!type) return null;
  const clean = type.trim().toLowerCase();
  if (clean.includes('พลาสติก') || clean.includes('plastic')) return 'พลาสติก';
  if (clean.includes('ไม้') || clean.includes('wood')) return 'ไม้';
  if (clean.includes('chep')) return 'CHEP';
  if (clean.includes('กระดาษ') || clean.includes('paper')) return 'กระดาษ';
  return null;
};

const normalizeBoxesPerPallet = (val) => {
  if (val === null || val === undefined) return null;
  const str = String(val).trim();
  const digits = str.replace(/[^0-9]/g, '');
  return digits.length > 0 ? digits : null;
};

const normalizeOilGroup = (group) => {
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

const normalizePackageSize = (raw) => {
  if (!raw) return null;
  let clean = raw.trim().toUpperCase().replace(/\s+/g, ' ');

  const pailMatch = clean.match(/^(\d+)\s*L(?:\.|\s|$)/i);
  if (pailMatch) {
    const vol = parseInt(pailMatch[1]);
    if (vol >= 200) return `${vol} L.`;
  }

  const giftMatch = clean.replace(/[*X]/g, 'x').match(/^(\d+(?:\.\d+)?)\s*L?\s*x\s*(\d+)\s*\+\s*(\d+(?:\.\d+)?)\s*L?(\.|\s|$)/i);
  if (giftMatch) return `${giftMatch[1]} x ${giftMatch[2]} + ${giftMatch[3]} L.`;

  const smallMatch = clean.replace(/[*X]/g, 'x').match(/^(\d+(?:\.\d+)?)\s*L?\s*x\s*(\d+)\s*L?(\.|\s|$)/i);
  if (smallMatch) return `${smallMatch[1]} x ${smallMatch[2]} L.`;

  const singleMatch = clean.match(/^(\d+(?:\.\d+)?)\s*L(?:\.|\s|$)/i);
  if (singleMatch) {
    const vol = parseFloat(singleMatch[1]);
    if (vol < 200) return `${singleMatch[1]} x 1 L.`;
    else return `${singleMatch[1]} L.`;
  }

  return clean === '' || clean === 'NULL' ? null : clean;
};

const normalizeItemCode = (val, partName) => {
  if (val) {
    const match = String(val).match(/\b([4-9]\d{5,7})\b/);
    if (match) return match[1];
    const digitsOnly = String(val).replace(/[^0-9]/g, '');
    if (digitsOnly.length >= 6 && digitsOnly.length <= 8) return digitsOnly;
  }
  if (partName) {
    const match = String(partName).match(/\b([4-9]\d{7})\b/);
    if (match) return match[1];
  }
  return null;
};

const normalizeItemNumber = (val, docType) => {
  if (docType === 'drawing') return null; // Drawings should not have master item_number
  if (!val) return null;
  const str = String(val).trim().toUpperCase();
  if (/^\d{6,8}$/.test(str)) return null;
  return str === '' || str === 'NULL' ? null : str;
};

const normalizeShelfLife = (val) => {
  if (val === null || val === undefined) return null;
  let str = String(val).trim().toLowerCase();
  
  if (str === 'null' || str === '') return null;
  if (str === '24 months') return '2 years';
  if (str === '48 months') return '4 years';
  
  if (str.includes('ปี') || str.includes('exp.')) {
    const digits = str.replace(/[^0-9]/g, '');
    if (digits.length > 0) return `${digits} years`;
  }
  
  if (!str.includes('years') && !str.includes('year')) {
    const digits = str.replace(/[^0-9]/g, '');
    if (digits.length > 0) return `${digits} years`;
  }
  
  // ensure format "X years"
  const digits = str.replace(/[^0-9]/g, '');
  if (digits.length > 0) return `${digits} years`;
  
  return str;
};

async function runCleanup() {
  console.log('🚀 Starting Data Cleanup on Supabase...');

  const { data: rows, error } = await supabase
    .from('engineering_drawings')
    .select('*');

  if (error) {
    console.error('❌ Error fetching rows:', error);
    process.exit(1);
  }

  console.log(`📦 Fetched ${rows.length} rows from engineering_drawings.`);

  let updatedCount = 0;

  for (const row of rows) {
    let currentItemCode = row.item_code;
    // If drawing has item_number containing 8-digit code, swap it to item_code if item_code is missing
    if (!currentItemCode && row.item_number && /^\d{6,8}$/.test(row.item_number.trim())) {
      currentItemCode = row.item_number.trim();
    }

    const newRev = normalizeRevision(row.revision);
    const newCustomer = normalizeCustomerName(row.customer_name);
    const newPallet = normalizePalletType(row.pallet_type);
    const newBoxes = normalizeBoxesPerPallet(row.boxes_per_pallet);
    const newOil = normalizeOilGroup(row.oil_group);
    const newPkg = normalizePackageSize(row.package_size);
    const newCode = normalizeItemCode(currentItemCode, row.part_name);
    const newNum = normalizeItemNumber(row.item_number, row.type);
    const newShelfLife = normalizeShelfLife(row.shelf_life);

    const updateData = {};
    if (row.revision !== newRev) updateData.revision = newRev;
    if (row.customer_name !== newCustomer) updateData.customer_name = newCustomer;
    if (row.pallet_type !== newPallet) updateData.pallet_type = newPallet;
    if (row.boxes_per_pallet !== newBoxes) updateData.boxes_per_pallet = newBoxes;
    if (row.oil_group !== newOil) updateData.oil_group = newOil;
    if (row.package_size !== newPkg) updateData.package_size = newPkg;
    if (row.item_code !== newCode) updateData.item_code = newCode;
    if (row.item_number !== newNum) updateData.item_number = newNum;
    if (row.shelf_life !== newShelfLife) updateData.shelf_life = newShelfLife;

    if (Object.keys(updateData).length > 0) {
      const { error: updateErr } = await supabase
        .from('engineering_drawings')
        .update(updateData)
        .eq('id', row.id);

      if (updateErr) {
        console.error(`❌ Failed to update row ${row.id} (${row.drawing_number}):`, updateErr.message);
      } else {
        updatedCount++;
        console.log(`✅ Updated row ${row.drawing_number} (${row.id}):`, updateData);
      }
    }
  }

  console.log(`🎉 Cleanup complete! Successfully updated ${updatedCount} out of ${rows.length} rows.`);
}

runCleanup();
