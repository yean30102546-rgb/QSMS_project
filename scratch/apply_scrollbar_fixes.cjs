const fs = require('fs');
const path = require('path');

const targetPath = path.resolve('src/modules/storage/components/DocumentList.tsx');
let content = fs.readFileSync(targetPath, 'utf8');

// 1. DocumentList main wrapper height
const oldContainer = `<div className="w-full bg-white dark:bg-[#1c1c1e] rounded-xl shadow-sm border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col">`;
const newContainer = `<div className="w-full h-full bg-white dark:bg-[#1c1c1e] rounded-xl shadow-sm border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col">`;
content = content.replace(oldContainer, newContainer);

// 2. Master-Detail wrapper to stretch
const oldWorkspaceWrapper = `<div className={\`flex flex-col xl:flex-row items-start min-h-[700px] border-t border-slate-200 dark:border-white/10 \${selectedInspectionDoc ? 'divide-x-0 xl:divide-x divide-slate-200 dark:divide-white/10' : ''}\`}>`;
const newWorkspaceWrapper = `<div className={\`flex flex-col xl:flex-row items-stretch flex-1 overflow-hidden border-t border-slate-200 dark:border-white/10 \${selectedInspectionDoc ? 'divide-x-0 xl:divide-x divide-slate-200 dark:divide-white/10' : ''}\`}>`;
content = content.replace(oldWorkspaceWrapper, newWorkspaceWrapper);

// 3. Left pane scroll
const oldLeftPane = `<div className={\`transition-all duration-300 min-w-0 \${selectedInspectionDoc ? 'xl:w-[55%] w-full' : 'w-full'}\`}>
          <div className="overflow-x-auto">`;
const newLeftPane = `<div className={\`transition-all duration-300 min-w-0 h-full flex flex-col \${selectedInspectionDoc ? 'xl:w-[55%] w-full' : 'w-full'}\`}>
          <div className="flex-1 overflow-y-auto overflow-x-auto">`;
content = content.replace(oldLeftPane, newLeftPane);

fs.writeFileSync(targetPath, content, 'utf8');
console.log('DocumentList updated');
