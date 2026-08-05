import ExcelJS from 'exceljs';

export interface OrItemInfo {
  itemCode: string;
  description?: string;
  qir: string;
  batchNo?: string;
  lpn?: string;
  amount?: number;
}

export interface OrParsedResult {
  success: boolean;
  itemMap: Record<string, OrItemInfo>;
  itemsList: OrItemInfo[];
  error?: string;
}

/**
 * Parses an OR reference Excel file (Sheet 2) and extracts Item and QIR mapping
 */
export async function parseOrExcelFile(file: File): Promise<OrParsedResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);

    // Try Sheet2, or sheet named containing Sheet2, or second sheet, or first sheet
    let sheet = workbook.getWorksheet('Sheet2');
    if (!sheet) {
      sheet = workbook.worksheets.find(w => w.name.toLowerCase().includes('sheet2') || w.name.toLowerCase().includes('sheet 2')) || workbook.worksheets[1] || workbook.worksheets[0];
    }

    if (!sheet) {
      return { success: false, itemMap: {}, itemsList: [], error: 'Sheet not found' };
    }

    let itemColIdx = -1;
    let qirColIdx = -1;
    let descColIdx = -1;
    let batchColIdx = -1;
    let lpnColIdx = -1;
    let amountColIdx = -1;

    const itemMap: Record<string, OrItemInfo> = {};
    const itemsList: OrItemInfo[] = [];

    sheet.eachRow((row) => {
      const values: string[] = [];
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        let cellVal = cell.value;
        if (cellVal && typeof cellVal === 'object') {
          if ('result' in cellVal && cellVal.result !== undefined) {
            cellVal = cellVal.result;
          } else if ('text' in cellVal && cellVal.text !== undefined) {
            cellVal = cellVal.text;
          } else if ('richText' in cellVal && Array.isArray(cellVal.richText)) {
            cellVal = cellVal.richText.map((rt: { text: string }) => rt.text).join('');
          }
        }
        values[colNumber - 1] = String(cellVal ?? '').trim();
      });

      // Find Header Row (row containing 'item' and 'qir')
      const lowerValues = values.map(v => v.toLowerCase());
      const foundItem = lowerValues.findIndex(v => v === 'item');
      const foundQir = lowerValues.findIndex(v => v === 'qir');

      if (foundItem !== -1 && foundQir !== -1 && itemColIdx === -1) {
        itemColIdx = foundItem;
        qirColIdx = foundQir;
        descColIdx = lowerValues.findIndex(v => v.includes('description') || v.includes('รายละเอียด'));
        batchColIdx = lowerValues.findIndex(v => v.includes('batch'));
        lpnColIdx = lowerValues.findIndex(v => v === 'lpn');
        amountColIdx = lowerValues.findIndex(v => v.includes('sum of on hand') || v.includes('จำนวน') || v.includes('qty') || v.includes('on hand'));
        return;
      }

      // Process Data Rows
      if (itemColIdx !== -1 && qirColIdx !== -1) {
        const itemVal = values[itemColIdx];
        const qirVal = values[qirColIdx];

        if (itemVal && itemVal.toLowerCase() !== 'item' && itemVal.toLowerCase() !== 'grand total' && qirVal) {
          const cleanItemCode = String(itemVal).trim();
          const cleanQir = String(qirVal).trim();
          const desc = descColIdx !== -1 ? values[descColIdx] : '';
          const batch = batchColIdx !== -1 ? values[batchColIdx] : '';
          const lpn = lpnColIdx !== -1 ? values[lpnColIdx] : '';
          const amt = amountColIdx !== -1 ? (parseInt(values[amountColIdx], 10) || undefined) : undefined;

          const info: OrItemInfo = {
            itemCode: cleanItemCode,
            description: desc,
            qir: cleanQir,
            batchNo: batch,
            lpn: lpn,
            amount: amt
          };

          itemMap[cleanItemCode] = info;
          itemsList.push(info);
        }
      }
    });

    return {
      success: true,
      itemMap,
      itemsList
    };
  } catch (err) {
    console.error('Error parsing OR Excel:', err);
    return {
      success: false,
      itemMap: {},
      itemsList: [],
      error: err instanceof Error ? err.message : String(err)
    };
  }
}

/**
 * Helper to match an item code against the parsed OR map
 */
export function findOrMatch(
  itemCode: string,
  itemNumber: string,
  itemMap: Record<string, OrItemInfo>
): OrItemInfo | undefined {
  const cleanCode = (itemCode || '').trim().toLowerCase();
  const cleanNum = (itemNumber || '').trim().toLowerCase();

  if (!cleanCode && !cleanNum) return undefined;

  for (const [key, info] of Object.entries(itemMap)) {
    const keyLower = key.trim().toLowerCase();
    if (!keyLower) continue;

    // 1. Direct equality
    if ((cleanCode && cleanCode === keyLower) || (cleanNum && cleanNum === keyLower)) {
      return info;
    }

    // 2. Suffix / Substring match (e.g. "404038" matches "40004038" or vice versa)
    if (cleanCode && (cleanCode.endsWith(keyLower) || keyLower.endsWith(cleanCode))) {
      return info;
    }
    if (cleanNum && (cleanNum.endsWith(keyLower) || keyLower.endsWith(cleanNum))) {
      return info;
    }
  }

  return undefined;
}
