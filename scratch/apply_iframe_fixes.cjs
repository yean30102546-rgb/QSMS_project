const fs = require('fs');
const path = require('path');

const targetPath = path.resolve('src/modules/storage/components/DocumentInspectionPanel.tsx');
let content = fs.readFileSync(targetPath, 'utf8');

// Disable native scrollbar in PDF iframe by appending view parameters
const oldIframe = `<iframe
                  src={previewUrl}
                  className="w-full h-full border-none rounded-xl"`;
const newIframe = `<iframe
                  src={\`\${previewUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH\`}
                  className="w-full h-full border-none rounded-xl"`;
content = content.replace(oldIframe, newIframe);

fs.writeFileSync(targetPath, content, 'utf8');
console.log('DocumentInspectionPanel updated');
