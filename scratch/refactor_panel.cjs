const fs = require('fs');

const panelPath = 'src/modules/storage/components/DocumentInspectionPanel.tsx';
let content = fs.readFileSync(panelPath, 'utf8');

// 1. We want to insert the rotation buttons before the ExternalLink / Fullscreen / Close buttons
// Find the div containing the buttons: <div className="flex items-center gap-1 shrink-0">
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

content = content.replace(buttonsContainerStart, buttonsContainerStart + '\\n' + rotationButtons);

// 2. We want to remove the sub-header
// Find:
/*
        {/* PDF Viewer & Rotation Toolbar Container *\/}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-500" />
              PDF Preview ({rotation}° Landscape Alignment)
            </span>
            <div className="flex items-center gap-1.5">
...
            </div>
          </div>
*/

const subHeaderRegex = /\{\/\*\s*PDF Viewer & Rotation Toolbar Container\s*\*\/\}\s*<div className="space-y-2">\s*<div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">[\s\S]*?<\/div>\s*<\/div>/m;

// Replace the sub-header and the wrapping <div className="space-y-2"> that we matched.
// Oh wait, the space-y-2 wrapper contains the PDF viewer div as well!
// Let's use a simpler regex.

const subHeaderBarRegex = /<div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">[\s\S]*?<\/button>\s*<\/div>\s*<\/div>/m;

content = content.replace(subHeaderBarRegex, '');

// Wait, I should just use multi_replace_file_content or a robust string replace. Let's do it manually with split.

fs.writeFileSync(panelPath, content);
console.log('DocumentInspectionPanel.tsx updated successfully');
