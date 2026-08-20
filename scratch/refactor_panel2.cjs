const fs = require('fs');

const panelPath = 'src/modules/storage/components/DocumentInspectionPanel.tsx';
let content = fs.readFileSync(panelPath, 'utf8');

// 1. Move the buttons.
const buttonsContainerStart = '<div className="flex items-center gap-1 shrink-0">';
const rotationButtons = `
          {/* PDF Rotation Controls */}
          <div className="flex items-center gap-1 mr-2 pr-2 border-r border-slate-200 dark:border-white/10">
            <button
              onClick={() => handleRotate(90)}
              className="p-1.5 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-slate-200/60 dark:hover:bg-white/10 transition-colors flex items-center gap-1"
              title="หมุน 90 องศา"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleRotate(270)}
              className="p-1.5 text-emerald-600 hover:text-emerald-700 dark:hover:text-emerald-400 rounded-lg hover:bg-slate-200/60 dark:hover:bg-white/10 transition-colors flex items-center gap-1"
              title="ปรับเป็นแนวนอน (Landscape View)"
            >
              <Compass className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleRotate(0)}
              className="px-2 py-1 text-xs font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/60 dark:hover:bg-white/10 transition-colors"
              title="รีเซ็ตเป็น 0 องศา"
            >
              0°
            </button>
          </div>
`;

if (!content.includes('PDF Rotation Controls')) {
  content = content.replace(buttonsContainerStart, buttonsContainerStart + '\\n' + rotationButtons);
}

// 2. Remove the sub-header
const subHeaderStart = '<div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">';
const subHeaderEnd = '</div>\\n          </div>\\n\\n          <div className="relative w-full';

let startIndex = content.indexOf(subHeaderStart);
if (startIndex !== -1) {
  let endIndex = content.indexOf('<div className="relative w-full', startIndex);
  if (endIndex !== -1) {
    // Also remove the enclosing <div className="space-y-2">. Wait, no, just the subheader.
    content = content.substring(0, startIndex) + content.substring(endIndex);
  }
}

// Ensure <div className="space-y-2"> is changed to just <div className="relative w-full ..."> or keep it if needed.
// Actually, let's remove the <div className="space-y-2"> wrapper since it's just wrapping the PDF viewer now.
content = content.replace(
  '{/* PDF Viewer & Rotation Toolbar Container */}\\n        <div className="space-y-2">',
  '{/* PDF Viewer Container */}'
);

content = content.replace(
  '\\n              </div>\\n            ) : (\\n              <div className="flex flex-col items-center gap-2 text-slate-400">\\n                <FileText className="w-8 h-8 opacity-20" />\\n                <span className="text-xs">ไม่มีไฟล์ตัวอย่าง</span>\\n              </div>\\n            )}\n          </div>\\n        </div>',
  '\\n              </div>\\n            ) : (\\n              <div className="flex flex-col items-center gap-2 text-slate-400">\\n                <FileText className="w-8 h-8 opacity-20" />\\n                <span className="text-xs">ไม่มีไฟล์ตัวอย่าง</span>\\n              </div>\\n            )}\n          </div>'
);

fs.writeFileSync(panelPath, content);
console.log('DocumentInspectionPanel.tsx updated successfully');
