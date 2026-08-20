const fs = require('fs');
const content = fs.readFileSync('scratch/gen_addcase.cjs', 'utf-8');
const lines = content.split('\n');
const codeLines = lines.slice(3, -5);
fs.writeFileSync('src/components/tabs/AddCaseTab.tsx', codeLines.join('\n'));
console.log('Extracted!');
