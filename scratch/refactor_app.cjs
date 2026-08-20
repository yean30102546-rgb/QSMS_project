const fs = require('fs');
const path = require('path');

const filePath = path.join((path.join(__dirname, "..")), 'src', 'modules', 'storage', 'StorageApp.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Add imports
content = content.replace(
  /import \{ UploadModal, UploadInitialData \} from '\.\/components\/UploadModal';/,
  `import { UploadModal } from './components/UploadModal';\nimport { useUploadQueue, UploadInitialData } from './hooks/useUploadQueue';\nimport { UploadMiniDock } from './components/UploadMiniDock';`
);

// 2. Add useUploadQueue to component state
content = content.replace(
  /const \[activeTab, setActiveTab\] = useState<StorageTab>\('documents'\);/,
  `const [activeTab, setActiveTab] = useState<StorageTab>('documents');\n  const uploadQueue = useUploadQueue(uploadInitialData);`
);

// 3. Remove droppedFiles
content = content.replace(/const \[droppedFiles, setDroppedFiles\] = useState<File\[\]>\(\[\]\);\n/, '');

// 4. Update handleCloseUpload
content = content.replace(
  /const handleCloseUpload = \(\) => \{[\s\S]*?setDroppedFiles\(\[\]\);\n  \};/,
  `const handleCloseUpload = () => {\n    setIsUploadOpen(false);\n    setUploadInitialData(undefined);\n  };`
);

// 5. Update handleDrop
content = content.replace(
  /const handleDrop = \(\e: React.DragEvent\) => \{[\s\S]*?if \(files\.length > 0\) \{\n      setDroppedFiles\(files\);\n      setIsUploadOpen\(true\);\n    \}\n  \};/,
  `const handleDrop = (e: React.DragEvent) => {\n    e.preventDefault();\n    e.stopPropagation();\n    dragCounter.current = 0;\n    setIsDragging(false);\n    \n    const files = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf');\n    if (files.length > 0) {\n      uploadQueue.addFiles(files);\n      setIsUploadOpen(true);\n    }\n  };`
);

// 6. Update Render UploadModal
content = content.replace(
  /<UploadModal[\s\S]*?\/>/,
  `<UploadModal\n            user={user}\n            initialData={uploadInitialData}\n            queue={uploadQueue}\n            onMinimize={() => setIsUploadOpen(false)}\n            onSuccess={handleUploadSuccess}\n          />\n        )}\n      </AnimatePresence>\n\n      {/* Mini Dock */}\n      <AnimatePresence>\n        {!isUploadOpen && uploadQueue.items.length > 0 && (\n          <UploadMiniDock\n            items={uploadQueue.items}\n            isQuotaPaused={uploadQueue.isQuotaPaused}\n            onExpand={() => setIsUploadOpen(true)}\n            onCancel={uploadQueue.clearAll}\n          />`
);

fs.writeFileSync(filePath, content, 'utf-8');
console.log('StorageApp refactored successfully.');

