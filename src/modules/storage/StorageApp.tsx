import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  FolderOpen, 
  Search, 
  Upload, 
  FileText, 
  AlertCircle,
  Database,
  RefreshCw,
  Plus,
  Keyboard,
  X,
  Command
} from 'lucide-react';
import type { User } from '../../services/auth';
import { DocumentList } from './components/DocumentList';
import { GapAnalysis } from './components/GapAnalysis';
import { UploadModal } from './components/UploadModal';
import { useUploadQueue, UploadInitialData } from './hooks/useUploadQueue';
import { UploadMiniDock } from './components/UploadMiniDock';



interface StorageAppProps {
  user: User | null;
  onBackToPortal: () => void;
}

export type StorageTab = 'documents' | 'gap_analysis';

export function StorageApp({ user, onBackToPortal }: StorageAppProps) {
  const [activeTab, setActiveTab] = useState<StorageTab>('documents');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadInitialData, setUploadInitialData] = useState<UploadInitialData | undefined>(undefined);
  const uploadQueue = useUploadQueue(uploadInitialData);
    const [searchQuery, setSearchQuery] = useState('');
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
    setUploadInitialData(data);
    setIsUploadOpen(true);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
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
    
    const files = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf');
    if (files.length > 0) {
      uploadQueue.addFiles(files);
      setIsUploadOpen(true);
    }
  };

  return (
    <div 
      className="relative flex h-screen w-full flex-col overflow-hidden bg-slate-50 dark:bg-[#111111]"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag & Drop Overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-amber-500/10 backdrop-blur-xs border-4 border-dashed border-amber-500">
          <div className="flex flex-col items-center bg-white dark:bg-slate-900 p-8 rounded-xl shadow-2xl pointer-events-none border border-amber-300">
            <Upload className="h-12 w-12 text-amber-600 mb-4 animate-bounce" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Drop PDF files here</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2">Release to open upload modal</p>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="z-10 flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 md:px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onBackToPortal}
            className="group flex h-9 w-9 items-center justify-center rounded-md bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 text-slate-600 group-hover:-translate-x-0.5 transition-transform" />
          </button>
          
          <div className="flex flex-col">
            <h1 className="text-base font-bold tracking-tight text-slate-900">
              Drawing & Master Storage
            </h1>
            <p className="text-xs text-slate-500">
              Supabase RAG Engineering File Vault
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Search Bar */}
          <div className="relative hidden md:flex items-center">
            <div className="absolute left-3 text-slate-400">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              placeholder="Search by item code, number, drawing no, part..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-64 lg:w-96 rounded-md border border-slate-300 bg-white pl-9 pr-4 text-xs text-slate-900 outline-none transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          <button
            onClick={() => setRefreshKey(prev => prev + 1)}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white hover:bg-slate-50 transition-colors text-slate-600"
            title="Refresh Data"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          
          <button
            onClick={() => setIsShortcutsOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white hover:bg-slate-50 transition-colors text-slate-600"
            title="Keyboard Shortcuts"
          >
            <Keyboard className="h-4 w-4" />
          </button>

          <button
            onClick={() => setIsUploadOpen(true)}
            className="flex h-9 items-center gap-2 rounded-md bg-amber-500 hover:bg-amber-600 px-3.5 text-xs font-bold text-slate-950 transition-all shadow-xs active:scale-95 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Upload File</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Tabs */}
        <div className="w-56 shrink-0 border-r border-slate-200 dark:border-white/10 bg-white/40 dark:bg-black/20 p-4 hidden md:flex flex-col gap-2">
          <button
            onClick={() => setActiveTab('documents')}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              activeTab === 'documents'
                ? 'bg-slate-100 text-slate-900 dark:bg-white/10 dark:text-white'
                : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-200'
            }`}
          >
            <Database className="h-4 w-4" />
            <span>All Documents</span>
          </button>
          <button
            onClick={() => setActiveTab('gap_analysis')}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              activeTab === 'gap_analysis'
                ? 'bg-slate-100 text-slate-900 dark:bg-white/10 dark:text-white'
                : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-200'
            }`}
          >
            <AlertCircle className="h-4 w-4" />
            <span>Gap Analysis</span>
          </button>
        </div>

        {/* Tab Content */}
        <main className="relative flex-1 overflow-hidden p-3 md:p-4 lg:p-6">
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
                <DocumentList searchQuery={searchQuery} refreshKey={refreshKey} />
              ) : (
                <GapAnalysis refreshKey={refreshKey} onUploadMaster={handleUploadMaster} />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

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
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Keyboard Shortcuts</h2>
                </div>
                <button 
                  onClick={() => setIsShortcutsOpen(false)}
                  className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors text-slate-500"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-300">Navigate Documents List</span>
                    <div className="flex gap-1.5">
                      <kbd className="px-2 py-1 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded text-xs font-mono text-slate-700 dark:text-slate-300 shadow-sm">↑</kbd>
                      <kbd className="px-2 py-1 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded text-xs font-mono text-slate-700 dark:text-slate-300 shadow-sm">↓</kbd>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-300">Close Inspection Panel</span>
                    <kbd className="px-2 py-1 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded text-xs font-mono text-slate-700 dark:text-slate-300 shadow-sm">Esc</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-300">Rotate PDF</span>
                    <div className="flex gap-1.5 items-center">
                      <kbd className="px-2 py-1 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded text-xs font-mono text-slate-700 dark:text-slate-300 shadow-sm">R</kbd>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-300">Search Documents</span>
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
  );
}
