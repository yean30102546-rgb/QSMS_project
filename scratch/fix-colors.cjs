const fs = require('fs');
const path = require('path');

const filePath = path.resolve('c:/Workplace/Mytask/Projects/QSMS_project/src/modules/rework/views/Dashboard.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// Replacements for light mode visibility
content = content.replace(/border-white\/10/g, 'border-slate-200');
content = content.replace(/border-white\/5/g, 'border-slate-100');
content = content.replace(/border-white\/20/g, 'border-slate-300');
content = content.replace(/bg-white\/5/g, 'bg-slate-50');
content = content.replace(/bg-white\/10/g, 'bg-slate-100');
content = content.replace(/hover:bg-white\/10/g, 'hover:bg-slate-100');
content = content.replace(/hover:bg-white\/5/g, 'hover:bg-slate-50');
content = content.replace(/hover:border-white\/5/g, 'hover:border-slate-200');
content = content.replace(/shadow-glass/g, 'shadow-sm hover:shadow-md');
content = content.replace(/glass-panel/g, 'bg-white');
content = content.replace(/glass-card/g, 'bg-white');
content = content.replace(/rgba\(255,255,255,0\.05\)/g, '#f1f5f9');
content = content.replace(/rgba\(255,255,255,0\.3\)/g, '#94a3b8');
content = content.replace(/rgba\(255,255,255,0\.6\)/g, '#64748b');
content = content.replace(/rgba\(255,255,255,0\.1\)/g, '#e2e8f0');
content = content.replace(/bg-slate-950\/95/g, 'bg-white');
content = content.replace(/text-white/g, 'text-foreground');
content = content.replace(/text-foreground text-xs/g, 'text-foreground text-xs shadow-md border-slate-200'); // for tooltip

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Dashboard.tsx updated with light mode styling.');
