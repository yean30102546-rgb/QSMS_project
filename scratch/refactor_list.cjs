const fs = require('fs');

const listPath = 'src/modules/storage/components/DocumentList.tsx';
let content = fs.readFileSync(listPath, 'utf8');

// 1. Strict column hiding (change hidden 2xl:table-cell to hidden)
content = content.replace(/hidden 2xl:table-cell/g, 'hidden');

// 2. Clean filename subtext
// Find: <div className="text-xs mt-1 truncate max-w-[200px] text-slate-400">{doc.file_name}</div>
content = content.replace(/<div className="text-xs mt-1 truncate max-w-\[200px\] text-slate-400">\{doc\.file_name\}<\/div>/g, '');

fs.writeFileSync(listPath, content);
console.log('DocumentList.tsx updated successfully');
