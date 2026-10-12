import fs from 'fs';
import ExcelJS from 'exceljs';

function parseCSV(content: string) {
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

async function main() {
  const dManifest = parseCSV(fs.readFileSync('Drawing files/Test_50_Unique/test_manifest.csv', 'utf8'));
  const mManifest = parseCSV(fs.readFileSync('Master files/Test_50_Unique/test_manifest.csv', 'utf8'));
  const dbRows = parseCSV(fs.readFileSync('sample_data/engineering_drawings_rows.csv', 'utf8'));

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile('Ground_Truth_Manual_Entry_Form.xlsx');
  const dSheet = wb.getWorksheet('Drawing')!;
  const mSheet = wb.getWorksheet('Master')!;

  console.log('=== DRAWING (50 files) ===');
  dManifest.forEach((item, idx) => {
    const row = dSheet.getRow(idx + 2);
    const excelPart = row.getCell(9).value;
    const excelCode = row.getCell(11).value;
    const dbMatch = dbRows.find(r => 
      (r.drawing_number === item.DocumentId && (r.revision === item.Revision || r.revision === item.Revision.padStart(2, '0'))) ||
      (r.r2_key && r.r2_key.includes(item.FileName.replace('.pdf', '')))
    );

    console.log(`D[${idx+1}] ${item.DocumentId} rev${item.Revision}: ExcelPart=${excelPart ? 'YES' : 'NO'}, DbMatch=${dbMatch ? 'YES (' + dbMatch.part_name + ')' : 'NO'}`);
  });

  console.log('\n=== MASTER (50 files) ===');
  mManifest.forEach((item, idx) => {
    const row = mSheet.getRow(idx + 2);
    const excelPart = row.getCell(9).value;
    const excelItemNum = row.getCell(12).value;
    const dbMatch = dbRows.find(r => 
      (r.drawing_number === item.DocumentId && (r.revision === item.Revision || r.revision === item.Revision.padStart(2, '0'))) ||
      (r.r2_key && r.r2_key.includes(item.FileName.replace('.pdf', '')))
    );

    console.log(`M[${idx+1}] ${item.DocumentId} rev${item.Revision}: ExcelPart=${excelPart ? 'YES' : 'NO'}, DbMatch=${dbMatch ? 'YES (' + dbMatch.part_name + ')' : 'NO'}`);
  });
}

main().catch(console.error);
