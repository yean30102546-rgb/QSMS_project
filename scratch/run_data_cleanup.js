const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load .env variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_RAG_SUPABASE_URL;
const supabaseKey = process.env.RAG_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_RAG_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase credentials missing in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Normalizers
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

async function runCleanup() {
  console.log('🚀 Starting Data Cleanup on Supabase...');

  // Fetch all rows from engineering_drawings
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
    const newCustomer = normalizeCustomerName(row.customer_name);
    const newPallet = normalizePalletType(row.pallet_type);
    const newBoxes = normalizeBoxesPerPallet(row.boxes_per_pallet);
    const newOil = normalizeOilGroup(row.oil_group);
    const newPkg = normalizePackageSize(row.package_size);

    const updateData = {};
    if (row.customer_name !== newCustomer) updateData.customer_name = newCustomer;
    if (row.pallet_type !== newPallet) updateData.pallet_type = newPallet;
    if (row.boxes_per_pallet !== newBoxes) updateData.boxes_per_pallet = newBoxes;
    if (row.oil_group !== newOil) updateData.oil_group = newOil;
    if (row.package_size !== newPkg) updateData.package_size = newPkg;

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
