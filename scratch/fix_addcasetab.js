const fs = require('fs');
let code = fs.readFileSync('src/components/tabs/AddCaseTab.tsx', 'utf-8');

// Replace \` with `
code = code.replace(/\\`/g, '`');

// Replace \$ with $
code = code.replace(/\\\$/g, '$');

// Remove the lingering `; at the end of the file if it exists
code = code.replace(/^`;\s*$/m, '');

fs.writeFileSync('src/components/tabs/AddCaseTab.tsx', code);
console.log('Fixed completely!');
