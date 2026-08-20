const fs = require('fs');

const data = fs.readFileSync('engineering_drawings_rows.csv', 'utf8');
const lines = data.split('\n');

const shelfLifeIndex = 17; // 0-indexed, based on header
const uniqueValues = new Map();

for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;
  
  // Handle CSV splitting properly, taking quotes into account
  const parts = [];
  let currentPart = '';
  let inQuotes = false;
  
  for (let j = 0; j < line.length; j++) {
    const char = line[j];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      parts.push(currentPart);
      currentPart = '';
    } else {
      currentPart += char;
    }
  }
  parts.push(currentPart);
  
  if (parts.length > shelfLifeIndex) {
    let val = parts[shelfLifeIndex].trim();
    if (val === '') val = '<empty string>';
    uniqueValues.set(val, (uniqueValues.get(val) || 0) + 1);
  }
}

console.log('Unique shelf_life values in CSV:');
const sorted = Array.from(uniqueValues.entries()).sort((a, b) => b[1] - a[1]);
for (const [val, count] of sorted) {
  console.log(`- "${val}" (Count: ${count})`);
}
