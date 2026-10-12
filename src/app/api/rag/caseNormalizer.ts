export interface NormalizedCaseFilter {
  raw: string;
  token: string;
  noSpace: string;
  prefix: 'RW' | 'RT' | null;
  year: string | null;
  seqNum: number | null;
  paddedSeq: string | null;
  isExactId: boolean;
}

/**
 * Normalizes user queries for rework cases (e.g., "RW001", "RT 001", "RT-2026-001", "001", "RW888")
 * to enable robust fuzzy matching against the operational database.
 */
export function normalizeCaseQuery(input: string): NormalizedCaseFilter {
  // Capture full prefix + numbers e.g. RT-2026-001, RW888-2026, RW001, RT 001, RW-2026-007
  const match = input.match(/(?:RW|RT)[-\s]?\d+(?:[-\s]?\d+)*/i) || input.match(/\d{3,4}/);
  const token = match ? match[0].trim() : input.trim();
  const noSpace = token.replace(/[\s-]+/g, '').toUpperCase();
  const prefixMatch = token.match(/^(?:RW|RT)/i);
  const prefix = prefixMatch ? prefixMatch[0].toUpperCase() as 'RW' | 'RT' : null;

  const nums = token.match(/\d+/g) || [];
  let seq: string | null = null;
  let year: string | null = null;

  if (nums.length >= 2) {
    if (nums[0].length === 4) {
      year = nums[0];
      seq = nums[1];
    } else if (nums[1].length === 4) {
      seq = nums[0];
      year = nums[1];
    } else {
      seq = nums[nums.length - 1];
    }
  } else if (nums.length === 1) {
    seq = nums[0];
  }

  const numVal = seq ? parseInt(seq, 10) : null;
  const paddedSeq = numVal !== null ? String(numVal).padStart(3, '0') : null;
  const isExactId = /^(RW|RT)-\d{4}-\d{3,4}$/i.test(token) || /^(RW|RT)\d+-\d{4}$/i.test(token);

  return {
    raw: input.trim(),
    token,
    noSpace,
    prefix,
    year,
    seqNum: numVal,
    paddedSeq,
    isExactId
  };
}
