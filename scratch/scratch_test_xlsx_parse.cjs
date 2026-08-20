const XLSX = require('xlsx');

// Create a workbook with some mock data
const wb = XLSX.utils.book_new();
const wsData = [
  ['Product Code', 'Name', 'Description'],
  ['PTT-001', 'PTT MAX SPEED', 'Red cap, 1L bottle'],
  ['PTT-002', 'PTT CHALLENGER', 'Blue cap, 0.8L bottle']
];
const ws = XLSX.utils.aoa_to_sheet(wsData);
XLSX.utils.book_append_sheet(wb, ws, 'Products');

// Write to buffer
const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
const base64Data = buffer.toString('base64');

// Parse it back using the same logic as our API
console.log('--- Testing parsing logic ---');
const readBuffer = Buffer.from(base64Data, 'base64');
const readWb = XLSX.read(readBuffer, { type: 'buffer' });
let excelText = '';
for (const sheetName of readWb.SheetNames) {
  const worksheet = readWb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
  const sheetText = rows
    .map(row => row.map(cell => (cell === null || cell === undefined ? '' : String(cell).trim())).join(' | '))
    .filter(line => line.trim().replace(/\|/g, '').trim().length > 0)
    .join('\n');

  excelText += `### Sheet: ${sheetName}\n${sheetText}\n\n`;
}

console.log('Result:\n' + excelText);
if (excelText.includes('PTT MAX SPEED')) {
  console.log('✅ TEST PASSED: Excel parsed successfully!');
} else {
  console.log('❌ TEST FAILED: Parsing output mismatch');
}
