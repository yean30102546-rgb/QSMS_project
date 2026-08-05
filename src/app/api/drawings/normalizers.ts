export interface PackageDetails {
  volume: number;
  unit: string;
  qty: number;
  free: number;
}

export const normalizeCustomerName = (name: string | null | undefined): string => {
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
  if (clean.includes('nissan')) return 'NISSAN';
  if (clean.includes('toyota')) return 'TOYOTA';
  if (clean.includes('isuzu')) return 'ISUZU';
  if (clean.includes('mitsubishi')) return 'MITSUBISHI';
  if (clean.includes('mazda')) return 'MAZDA';
  if (clean.includes('ford')) return 'FORD';

  return name.trim().toUpperCase();
};

export const normalizeRevision = (rev: string | null | undefined): string => {
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

export const normalizePalletType = (type: string | null | undefined): string | null => {
  if (!type) return null;
  const clean = type.trim().toLowerCase();

  if (clean.includes('พลาสติก') || clean.includes('plastic')) {
    return 'พลาสติก';
  }
  if (clean.includes('ไม้') || clean.includes('wood')) {
    return 'ไม้';
  }
  if (clean.includes('chep')) {
    return 'CHEP';
  }
  if (clean.includes('กระดาษ') || clean.includes('paper')) {
    return 'กระดาษ';
  }

  return null;
};

export const normalizeBoxesPerPallet = (val: string | number | null | undefined): string | null => {
  if (val === null || val === undefined) return null;
  const str = String(val).trim();
  if (str.includes('ความเหมาะสม') || str.toLowerCase().includes('appropriate')) {
    return 'ตามความเหมาะสม';
  }
  const digits = str.replace(/[^0-9]/g, '');
  return digits.length > 0 ? digits : null;
};

export const normalizeItemCode = (val: string | null | undefined): string | null => {
  if (!val) return null;
  const str = String(val).trim();
  const match = str.match(/\b([4-9]\d{5,7})\b/);
  if (match) return match[1];

  const digitsOnly = str.replace(/[^0-9]/g, '');
  if (digitsOnly.length >= 6 && digitsOnly.length <= 8) return digitsOnly;
  return null;
};

export const normalizeItemNumber = (val: string | null | undefined, docType?: string): string | null => {
  if (!val) return null;
  if (docType === 'drawing') return null;

  const str = String(val).trim().toUpperCase();
  if (/^\d{6,8}$/.test(str)) return null;

  return str === '' || str === 'NULL' ? null : str;
};

export const normalizeOilGroup = (group: string | null | undefined): string | null => {
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

export const normalizePackageSize = (raw: string | null | undefined): string | null => {
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

export const parsePackageDetails = (rawStr: string | null | undefined): PackageDetails | null => {
  if (!rawStr || typeof rawStr !== 'string') return null;

  const str = rawStr.trim().toUpperCase();
  const normalizeUnit = (u: string) => (u.startsWith('ML') || u.startsWith('MILLI') ? 'ML' : 'L');

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

  const p6 = /^([\d\.]+)\s*L?\s*\+\s*([\d\.]+)\s*L?$/;
  const m6 = str.match(p6);
  if (m6) {
    return {
      volume: parseFloat(m6[1]),
      unit: 'L',
      qty: 1,
      free: parseFloat(m6[2]),
    };
  }

  return null;
};

export const normalizeShelfLife = (val: string | null | undefined): string | null => {
  if (!val) return null;
  let str = String(val).trim().toLowerCase();

  if (str === 'null' || str === '') return null;
  if (str === '24 months') return '2 years';
  if (str === '48 months') return '4 years';

  const digits = str.replace(/[^0-9]/g, '');
  if (digits.length > 0) return `${digits} years`;

  return null;
};
