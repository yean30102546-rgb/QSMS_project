const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/modules/storage/components/DocumentList.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Wrapper Outer
content = content.replace(
  '<div className="flex flex-col xl:flex-row gap-5 items-start">',
  '<div className={`flex flex-col xl:flex-row items-start min-h-[700px] border-t border-slate-200 dark:border-white/10 ${selectedInspectionDoc ? \'divide-x-0 xl:divide-x divide-slate-200 dark:divide-white/10\' : \'\'}`}>'
);

// 2. Left Split Wrapper
content = content.replace(
  '<div className={`transition-all duration-300 ${selectedInspectionDoc ? \'xl:w-[55%] w-full min-w-0\' : \'w-full\'}`}>',
  '<div className={`transition-all duration-300 min-w-0 ${selectedInspectionDoc ? \'xl:w-[55%] w-full\' : \'w-full\'}`}>'
);

// 3. Right Split Wrapper
content = content.replace(
  '<div className="w-full xl:w-[45%] h-[750px] xl:h-[calc(100vh-140px)] sticky top-4 shrink-0 animate-in slide-in-from-right-4 duration-300 z-30">',
  '<div className="w-full xl:w-[45%] h-[750px] xl:h-[calc(100vh-160px)] sticky top-0 shrink-0 animate-in slide-in-from-right-4 duration-300 z-30">'
);

// 4. Drawing Tab Header Hiding
content = content.replace(
  '<th className="px-6 py-4">Issue Date</th>\n                    <th className="px-6 py-4">Package Size</th>',
  '<th className={`px-6 py-4 transition-all duration-300 ${selectedInspectionDoc ? \'hidden 2xl:table-cell\' : \'\'}`}>Issue Date</th>\n                    <th className={`px-6 py-4 transition-all duration-300 ${selectedInspectionDoc ? \'hidden 2xl:table-cell\' : \'\'}`}>Package Size</th>'
);

// 5. Drawing Tab Body Hiding
content = content.replace(
  '<td className="px-6 py-4">\n                      {doc.issue_date ? new Date(doc.issue_date).toLocaleDateString(\'th-TH\') : <span className="text-slate-400">-</span>}\n                    </td>\n                    <td className="px-6 py-4">{doc.package_size || <span className="text-slate-400">-</span>}</td>',
  '<td className={`px-6 py-4 transition-all duration-300 ${selectedInspectionDoc ? \'hidden 2xl:table-cell\' : \'\'}`}>\n                      {doc.issue_date ? new Date(doc.issue_date).toLocaleDateString(\'th-TH\') : <span className="text-slate-400">-</span>}\n                    </td>\n                    <td className={`px-6 py-4 transition-all duration-300 ${selectedInspectionDoc ? \'hidden 2xl:table-cell\' : \'\'}`}>{doc.package_size || <span className="text-slate-400">-</span>}</td>'
);

// 6. Master Tab Header Hiding
content = content.replace(
  '<th className="px-6 py-4">Oil Group</th>\n                <th className="px-6 py-4">Packaging</th>\n                <th className="px-6 py-4">Shelf Life</th>',
  '<th className={`px-6 py-4 transition-all duration-300 ${selectedInspectionDoc ? \'hidden 2xl:table-cell\' : \'\'}`}>Oil Group</th>\n                <th className={`px-6 py-4 transition-all duration-300 ${selectedInspectionDoc ? \'hidden 2xl:table-cell\' : \'\'}`}>Packaging</th>\n                <th className={`px-6 py-4 transition-all duration-300 ${selectedInspectionDoc ? \'hidden 2xl:table-cell\' : \'\'}`}>Shelf Life</th>'
);

// 7. Master Tab Body Hiding
content = content.replace(
  '<td className="px-6 py-4">{doc.oil_group || <span className="text-slate-400">-</span>}</td>\n                    <td className="px-6 py-4 whitespace-nowrap">\n                      <div className="flex flex-col gap-0.5">\n                        <span className="text-slate-700 dark:text-slate-300 font-medium">{doc.pallet_type || \'-\'}</span>\n                        {doc.boxes_per_pallet && <span className="text-[11px] text-slate-500">{doc.boxes_per_pallet} boxes/pallet</span>}\n                      </div>\n                    </td>\n                    <td className="px-6 py-4">{doc.shelf_life || <span className="text-slate-400">-</span>}</td>',
  '<td className={`px-6 py-4 transition-all duration-300 ${selectedInspectionDoc ? \'hidden 2xl:table-cell\' : \'\'}`}>{doc.oil_group || <span className="text-slate-400">-</span>}</td>\n                    <td className={`px-6 py-4 whitespace-nowrap transition-all duration-300 ${selectedInspectionDoc ? \'hidden 2xl:table-cell\' : \'\'}`}>\n                      <div className="flex flex-col gap-0.5">\n                        <span className="text-slate-700 dark:text-slate-300 font-medium">{doc.pallet_type || \'-\'}</span>\n                        {doc.boxes_per_pallet && <span className="text-[11px] text-slate-500">{doc.boxes_per_pallet} boxes/pallet</span>}\n                      </div>\n                    </td>\n                    <td className={`px-6 py-4 transition-all duration-300 ${selectedInspectionDoc ? \'hidden 2xl:table-cell\' : \'\'}`}>{doc.shelf_life || <span className="text-slate-400">-</span>}</td>'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('DocumentList.tsx updated successfully');
