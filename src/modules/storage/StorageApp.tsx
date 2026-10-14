import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Upload, 
  FileText, 
  RefreshCw,
  Plus,
  Keyboard,
  X
} from 'lucide-react';
import type { User } from '../../services/auth';
import { MainLayout, type WorkspaceModule } from '../../components/layout/MainLayout';
import { useNotification } from '../../contexts/NotificationContext';
import { DocumentList } from './components/DocumentList';
import { GapAnalysis } from './components/GapAnalysis';
import { UploadModal } from './components/UploadModal';
import { useUploadQueue, UploadInitialData } from './hooks/useUploadQueue';
import { UploadMiniDock } from './components/UploadMiniDock';



interface StorageAppProps {
  user: User | null;
  onBackToPortal: () => void;
  onLogout: () => void;
  onNavigateToModule?: (module: WorkspaceModule) => void;
}

export type StorageTab = 'documents' | 'gap_analysis';

export function StorageApp({ user, onBackToPortal, onLogout, onNavigateToModule }: StorageAppProps) {
  const canEdit = user?.role === 'ADMIN' || user?.role === 'QSMS';
  const [activeTab, setActiveTab] = useState<StorageTab>('documents');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadInitialData, setUploadInitialData] = useState<UploadInitialData | undefined>(undefined);
  const uploadQueue = useUploadQueue(uploadInitialData);
    const [searchQuery, setSearchQuery] = useState('');
  const { showToast } = useNotification();
  const [refreshKey, setRefreshKey] = useState(0); // Used to force refetch
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  const handleUploadSuccess = () => {
    setIsUploadOpen(false);
    setUploadInitialData(undefined);
    setRefreshKey(prev => prev + 1);
  };

  const handleCloseUpload = () => {
    setIsUploadOpen(false);
    setUploadInitialData(undefined);
  };

  const handleUploadMaster = (data: UploadInitialData) => {
    if (!canEdit) return;
    setUploadInitialData(data);
    setIsUploadOpen(true);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!canEdit) return;
    dragCounter.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setIsDragging(false);
    if (!canEdit) return;
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    const files = droppedFiles.filter(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
    if (files.length > 0) {
      uploadQueue.addFiles(files);
      setIsUploadOpen(true);
    }
    if (droppedFiles.length > files.length) {
      showToast('รองรับเฉพาะไฟล์ PDF ไฟล์อื่นไม่ได้ถูกเพิ่ม', 'warning');
    }
  };

  return (
    <div
      className="relative h-full w-full"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
    <MainLayout
      module="storage"
      activeTab={activeTab}
      setActiveTab={(tab) => {
        if (tab === 'documents' || tab === 'gap_analysis') setActiveTab(tab);
      }}
      onLogout={onLogout}
      onBackToPortal={onBackToPortal}
      onNavigateToModule={onNavigateToModule}
      userName={user?.name || ''}
      userRole={user?.role || ''}
      onOpenTutorial={() => undefined}
    >
    <div className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-[#f5f5f7]">
      {/* Drag & Drop Overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-blue-500/10 backdrop-blur-xs border-4 border-dashed border-blue-500">
          <div className="flex flex-col items-center rounded-2xl border border-[#e0e0e0] bg-white p-8 pointer-events-none">
            <Upload className="mb-4 h-12 w-12 text-[#0066cc]" />
            <h2 className="text-xl font-bold text-[#1d1d1f]">วางไฟล์ PDF ที่นี่</h2>
            <p className="mt-2 text-[#7a7a7a]">ปล่อยเมาส์เพื่อเพิ่มไฟล์เข้ารายการอัปโหลด</p>
          </div>
        </div>
      )}

      <header className="shrink-0 border-b border-[#e0e0e0] bg-white px-4 py-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold tracking-tight text-[#1d1d1f] sm:text-xl">
              {activeTab === 'documents' ? 'เอกสาร Drawing และ Master' : 'ตรวจสอบเอกสารที่ขาด'}
            </h1>
            <p className="mt-1 text-xs text-[#7a7a7a] sm:text-sm">
              {activeTab === 'documents' ? 'ค้นหา ตรวจสอบเวอร์ชัน และจัดการเอกสารวิศวกรรม' : 'ตรวจหาคู่ Drawing และ Master ที่ยังไม่ครบ'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setRefreshKey(prev => prev + 1)} className="flex h-11 w-11 items-center justify-center rounded-lg border border-[#e0e0e0] bg-white text-slate-600 transition-colors hover:bg-[#f5f5f7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3]" title="โหลดข้อมูลใหม่" aria-label="โหลดข้อมูลใหม่">
              <RefreshCw className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => setIsShortcutsOpen(true)} className="flex h-11 w-11 items-center justify-center rounded-lg border border-[#e0e0e0] bg-white text-slate-600 transition-colors hover:bg-[#f5f5f7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3]" title="ดูปุ่มลัด" aria-label="ดูปุ่มลัด">
              <Keyboard className="h-4 w-4" />
            </button>
            {canEdit ? (
              <button type="button" onClick={() => setIsUploadOpen(true)} className="flex min-h-11 items-center gap-2 rounded-full bg-[#0066cc] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#0071e3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3] focus-visible:ring-offset-2 active:scale-[0.98]">
                <Plus className="h-4 w-4 shrink-0" />
                <span>อัปโหลดไฟล์</span>
              </button>
            ) : (
              <span className="flex min-h-11 items-center gap-2 rounded-lg border border-[#e0e0e0] bg-[#f5f5f7] px-3 text-xs font-medium text-slate-600" title="สิทธิ์ของคุณเป็นโหมดดูและดาวน์โหลดเท่านั้น">
                <FileText className="h-4 w-4 text-slate-500" />
                <span>ดูและดาวน์โหลด</span>
              </span>
            )}
          </div>
        </div>
        {activeTab === 'documents' && (
          <div className="relative mt-3 w-full sm:max-w-xl">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              aria-label="ค้นหาเอกสาร Drawing และ Master"
              placeholder="ค้นหาด้วยรหัสสินค้า เลขแบบ หรือชื่อชิ้นส่วน"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-11 w-full rounded-lg border border-[#d1d5db] bg-white pl-10 pr-4 text-sm text-[#1d1d1f] outline-none transition-colors placeholder:text-slate-500 focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20"
            />
          </div>
        )}
      </header>

      <section className="relative min-h-0 flex-1 overflow-hidden p-3 sm:p-4 lg:p-6" aria-label={activeTab === 'documents' ? 'รายการเอกสาร' : 'ผลตรวจเอกสารที่ขาด'}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {activeTab === 'documents' ? (
                <DocumentList searchQuery={searchQuery} refreshKey={refreshKey} canEdit={canEdit} />
              ) : (
                <GapAnalysis refreshKey={refreshKey} onUploadMaster={handleUploadMaster} canEdit={canEdit} />
              )}
            </motion.div>
          </AnimatePresence>
      </section>

      {/* Upload Modal */}
      <AnimatePresence>
        {isUploadOpen && (
          <UploadModal
            user={user}
            initialData={uploadInitialData}
            queue={uploadQueue}
            onMinimize={() => setIsUploadOpen(false)}
            onSuccess={handleUploadSuccess}
          />
        )}
      </AnimatePresence>

      {/* Mini Dock */}
      <AnimatePresence>
        {!isUploadOpen && uploadQueue.items.length > 0 && (
          <UploadMiniDock
            items={uploadQueue.items}
            isQuotaPaused={uploadQueue.isQuotaPaused}
            onExpand={() => setIsUploadOpen(true)}
            onCancel={uploadQueue.clearAll}
          />
        )}
      </AnimatePresence>

      {/* Keyboard Shortcuts Modal */}
      <AnimatePresence>
        {isShortcutsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md bg-white dark:bg-[#1c1c1e] rounded-2xl shadow-xl overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-white/10 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <Keyboard className="h-4 w-4" />
                  </div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">ปุ่มลัดแป้นพิมพ์</h2>
                </div>
                <button 
                  onClick={() => setIsShortcutsOpen(false)}
                  className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors text-slate-500"
                  aria-label="ปิดหน้าต่างปุ่มลัด"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-300">เลื่อนดูรายการเอกสาร</span>
                    <div className="flex gap-1.5">
                      <kbd className="px-2 py-1 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded text-xs font-mono text-slate-700 dark:text-slate-300 shadow-sm">↑</kbd>
                      <kbd className="px-2 py-1 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded text-xs font-mono text-slate-700 dark:text-slate-300 shadow-sm">↓</kbd>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-300">ปิดแผงตรวจสอบ</span>
                    <kbd className="px-2 py-1 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded text-xs font-mono text-slate-700 dark:text-slate-300 shadow-sm">Esc</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-300">หมุน PDF</span>
                    <div className="flex gap-1.5 items-center">
                      <kbd className="px-2 py-1 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded text-xs font-mono text-slate-700 dark:text-slate-300 shadow-sm">R</kbd>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-300">ค้นหาเอกสาร</span>
                    <div className="flex gap-1.5 items-center">
                      <kbd className="px-2 py-1 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded text-xs font-mono text-slate-700 dark:text-slate-300 shadow-sm">Ctrl</kbd>
                      <span className="text-xs text-slate-400">+</span>
                      <kbd className="px-2 py-1 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded text-xs font-mono text-slate-700 dark:text-slate-300 shadow-sm">K</kbd>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
    </MainLayout>
    </div>
  );
}
