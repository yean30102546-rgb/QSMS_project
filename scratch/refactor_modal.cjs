const fs = require('fs');
const path = require('path');

const filePath = path.join((path.join(__dirname, "..")), 'src', 'modules', 'storage', 'components', 'UploadModal.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Add import for useUploadQueue and UploadInitialData (remove local UploadInitialData, UploadItem)
content = content.replace(
  /export interface UploadInitialData \{[\s\S]*?\}\n\ninterface UploadModalProps/,
  `import { UploadItem, UploadInitialData } from '../hooks/useUploadQueue';\n\ninterface UploadModalProps`
);

// 2. Remove UploadItem interface
content = content.replace(
  /interface UploadItem \{[\s\S]*?\}\n\nexport function UploadModal/,
  `export function UploadModal`
);

// 3. Update UploadModalProps
content = content.replace(
  /interface UploadModalProps \{[\s\S]*?\}\n\nexport function UploadModal/,
  `interface UploadModalProps {\n  user: User | null;\n  initialData?: UploadInitialData;\n  queue: ReturnType<typeof import('../hooks/useUploadQueue').useUploadQueue>;\n  onMinimize: () => void;\n  onSuccess: () => void;\n}\n\nexport function UploadModal`
);

// 4. Update Component Signature and destructure queue
const componentSignatureOld = `export function UploadModal({ user, initialData, initialFiles, onClose, onSuccess }: UploadModalProps) {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [aiModel, setAiModel] = useState<string>('gemini-3.1-flash');
  const [usageStats, setUsageStats] = useState<{ rpm: number; tpm: number; rpd: number } | null>(null);
  const [limits, setLimits] = useState<{ rpm: number; tpm: number; rpd: number } | null>(null);
  const [reparseCooldowns, setReparseCooldowns] = useState<Record<string, number>>({});
  const [cardRotations, setCardRotations] = useState<Record<string, number>>({});
  const [cardZooms, setCardZooms] = useState<Record<string, number>>({});
  const [batchCustomer, setBatchCustomer] = useState('');
  const [batchDate, setBatchDate] = useState('');
  
  const [viewMode, setViewMode] = useState<'detailed' | 'compact'>('detailed');
  const [filterStatus, setFilterStatus] = useState<'all' | 'incomplete' | 'error'>('all');
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [duplicates, setDuplicates] = useState<Record<string, boolean>>({});
  
  const [isQuotaPaused, setIsQuotaPaused] = useState(false);
  const [quotaCountdown, setQuotaCountdown] = useState(0);`;

const componentSignatureNew = `export function UploadModal({ user, initialData, queue, onMinimize, onSuccess }: UploadModalProps) {
  const {
    items, setItems, isUploading, setIsUploading, aiModel, setAiModel,
    isQuotaPaused, setIsQuotaPaused, quotaCountdown, setQuotaCountdown,
    addFiles, cancelQueue, clearCompleted, clearAll, resumePausedParsing, triggerAiParsing
  } = queue;

  const [usageStats, setUsageStats] = useState<{ rpm: number; tpm: number; rpd: number } | null>(null);
  const [limits, setLimits] = useState<{ rpm: number; tpm: number; rpd: number } | null>(null);
  const [reparseCooldowns, setReparseCooldowns] = useState<Record<string, number>>({});
  const [cardRotations, setCardRotations] = useState<Record<string, number>>({});
  const [cardZooms, setCardZooms] = useState<Record<string, number>>({});
  const [batchCustomer, setBatchCustomer] = useState('');
  const [batchDate, setBatchDate] = useState('');
  
  const [viewMode, setViewMode] = useState<'detailed' | 'compact'>('detailed');
  const [filterStatus, setFilterStatus] = useState<'all' | 'incomplete' | 'error'>('all');
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [duplicates, setDuplicates] = useState<Record<string, boolean>>({});`;

content = content.replace(componentSignatureOld, componentSignatureNew);

// 5. Replace `onClose` calls with `onMinimize`
content = content.replace(/onClose\(\)/g, 'onMinimize()');
content = content.replace(/onClose=\{onClose\}/g, 'onClose={onMinimize}'); // For children components if any

// 6. Remove initialFiles useEffect and processFiles, triggerAiParsing, resumePausedParsing, etc.
// This is a large chunk of code to remove.
// Let's use regex to remove from `const handleCloseAttempt` up to `const handleReparseSingleItem`
const toRemoveRegex = /const handleCloseAttempt = \(\) => \{[\s\S]*?(?=const handleReparseSingleItem)/;
const replacement = `const handleCloseAttempt = () => {\n    onMinimize();\n  };\n\n  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {\n    if (e.target.files && e.target.files.length > 0) {\n      addFiles(Array.from(e.target.files));\n      if (fileInputRef.current) fileInputRef.current.value = '';\n    }\n  };\n\n  const handleDragEnter = (e: React.DragEvent) => {\n    e.preventDefault();\n    e.stopPropagation();\n  };\n  const handleDragOver = (e: React.DragEvent) => {\n    e.preventDefault();\n    e.stopPropagation();\n    if (!isDraggingOver) setIsDraggingOver(true);\n  };\n  const handleDragLeave = (e: React.DragEvent) => {\n    e.preventDefault();\n    e.stopPropagation();\n    setIsDraggingOver(false);\n  };\n  const handleDrop = async (e: React.DragEvent) => {\n    e.preventDefault();\n    e.stopPropagation();\n    setIsDraggingOver(false);\n    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {\n      const filesArray = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf');\n      if (filesArray.length > 0) {\n        addFiles(filesArray);\n      } else {\n        showToast('Please upload PDF files only', 'error');\n      }\n    }\n  };\n\n  `;

content = content.replace(toRemoveRegex, replacement);

// 7. handleRetryFailed also needs to be removed since it's mostly handled or needs to use queue functions
// Wait, we need handleRetryFailed to just use `triggerAiParsing` which is now available.
// Actually handleRetryFailed uses `triggerAiParsing` and sets items. Since `triggerAiParsing` updates items internally now, it's fine.
// But wait, `triggerAiParsing` in `useUploadQueue` sets `items` internally. Let's see how `handleRetryFailed` is written now:
// Let's just leave handleRetryFailed as is, but it accesses `setIsQuotaPaused` etc. which are available from `queue`.

// 8. Replace `setItems([])` in handleClearAll with `clearAll()`
content = content.replace(/const handleClearAll = \(\) => \{[\s\S]*?\};/, `const handleClearAll = () => {\n    showConfirm(\n      "ต้องการยกเลิกและล้างรายการอัปโหลดทั้งหมดใช่หรือไม่?",\n      () => {\n        clearAll();\n      }\n    );\n  };`);

// 9. Update "Close Workspace" button
content = content.replace(
  /<button\s+onClick=\{handleCloseAttempt\}\s+className="p-2[^>]*>\s*<X className="h-5 w-5" \/>\s*<\/button>/,
  `<button onClick={handleCloseAttempt} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors text-slate-500" title="Minimize to Dock">\n              <Minimize2 className="h-5 w-5" />\n            </button>`
);

fs.writeFileSync(filePath, content, 'utf-8');
console.log('UploadModal refactored successfully.');

