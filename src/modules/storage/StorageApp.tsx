import React, { useState, useEffect } from 'react';
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
  Plus
} from 'lucide-react';
import type { User } from '../../services/auth';
import { DocumentList } from './components/DocumentList';
import { GapAnalysis } from './components/GapAnalysis';
import { UploadModal, UploadInitialData } from './components/UploadModal';



interface StorageAppProps {
  user: User | null;
  onBackToPortal: () => void;
}

export type StorageTab = 'documents' | 'gap_analysis';

export function StorageApp({ user, onBackToPortal }: StorageAppProps) {
  const [activeTab, setActiveTab] = useState<StorageTab>('documents');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadInitialData, setUploadInitialData] = useState<UploadInitialData | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshKey, setRefreshKey] = useState(0); // Used to force refetch

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

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-slate-50 dark:bg-[#111111]">
      {/* Header */}
      <header className="z-10 flex h-16 shrink-0 items-center justify-between border-b border-slate-200 dark:border-white/10 bg-white/70 dark:bg-black/50 px-4 backdrop-blur-xl md:px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onBackToPortal}
            className="group flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-slate-600 dark:text-slate-300 group-hover:-translate-x-0.5 transition-transform" />
          </button>
          
          <div className="flex flex-col">
            <h1 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
              Drawing & Master Storage
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
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
              className="h-9 w-64 lg:w-96 rounded-full border border-slate-200 dark:border-white/10 bg-slate-100/50 dark:bg-white/5 pl-9 pr-4 text-sm outline-none transition-all focus:border-indigo-500 dark:focus:border-indigo-400 focus:bg-white dark:focus:bg-[#1c1c1e]"
            />
          </div>

          <button
            onClick={() => setRefreshKey(prev => prev + 1)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors text-slate-600 dark:text-slate-300"
          >
            <RefreshCw className="h-4 w-4" />
          </button>

          <button
            onClick={() => setIsUploadOpen(true)}
            className="flex h-9 items-center gap-2 rounded-full bg-indigo-600 hover:bg-indigo-700 px-4 text-sm font-medium text-white transition-all shadow-sm hover:shadow active:scale-95"
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
        <main className="relative flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 lg:p-8">
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
            onClose={handleCloseUpload}
            onSuccess={handleUploadSuccess}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
