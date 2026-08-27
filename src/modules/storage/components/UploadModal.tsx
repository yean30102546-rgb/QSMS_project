import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, UploadCloud, File, Loader2, Bot, AlertCircle, Trash2, CheckCircle2, Plus, RotateCw, ZoomIn, ZoomOut, Maximize2, Minimize2, RefreshCcw, Filter, LayoutGrid, LayoutList } from 'lucide-react';
import { useNotification } from '../../../contexts/NotificationContext';
import type { User } from '../../../services/auth';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';

import { UploadItem, UploadInitialData } from '../hooks/useUploadQueue';

interface UploadModalProps {
  user: User | null;
  initialData?: UploadInitialData;
  queue: ReturnType<typeof import('../hooks/useUploadQueue').useUploadQueue>;
  onMinimize: () => void;
  onClose?: () => void;
  onSuccess: () => void;
}

export function UploadModal({ user, initialData, queue, onMinimize, onSuccess }: UploadModalProps) {
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
  const [duplicates, setDuplicates] = useState<Record<string, boolean>>({});
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast, showConfirm } = useNotification();

  const fetchUsageStats = async () => {
    try {
      const res = await fetch('/api/drawings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_api_usage', model: aiModel })
      });
      const data = await res.json();
      if (data.success) {
        setUsageStats(data.usage);
        setLimits(data.limits);
      }
    } catch (err) {
      console.error('Failed to fetch usage stats', err);
    }
  };

  useEffect(() => {
    fetchUsageStats();
    // Poll usage every 10 seconds while the modal is open
    const interval = setInterval(fetchUsageStats, 10000);
    return () => clearInterval(interval);
  }, [aiModel]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      const itemsToCheck = items
        .filter(i => i.status !== 'success' && i.formData.drawing_number && i.formData.revision)
        .map(i => ({ type: i.formData.type, drawing_number: i.formData.drawing_number, revision: i.formData.revision }));
      
      if (itemsToCheck.length === 0) {
        setDuplicates({});
        return;
      }

      try {
        const res = await fetch('/api/drawings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'check_duplicates', items: itemsToCheck })
        });
        const data = await res.json();
        if (data.success) {
          setDuplicates(data.duplicates);
        }
      } catch (err) {
        console.error('Failed to check duplicates', err);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [items]);

  const handleCloseAttempt = () => {
    onMinimize();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(Array.from(e.target.files));
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDraggingOver) setIsDraggingOver(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf');
      if (filesArray.length > 0) {
        addFiles(filesArray);
      } else {
        showToast('Please upload PDF files only', 'error');
      }
    }
  };

  const handleReparseSingleItem = async (id: string) => {
    const item = items.find(i => i.id === id);
    if (!item || item.status === 'parsing' || item.status === 'uploading' || item.status === 'success') return;

    const now = Date.now();
    if (reparseCooldowns[id] && now - reparseCooldowns[id] < 5000) {
      showToast('กรุณารอประมาณ 5 วินาทีก่อนกดลองใหม่อีกครั้ง', 'warning');
      return;
    }

    setReparseCooldowns(prev => ({ ...prev, [id]: now }));
    setItems(prev => prev.map(i => i.id === id ? { ...i, status: 'parsing', errorMessage: undefined } : i));
    await triggerAiParsing(id, item.base64, aiModel);
  };

  const handleRetryFailed = async () => {
    const failedItems = items.filter(i => i.status === 'error' && i.errorMessage && i.errorMessage !== 'Upload failed');
    if (failedItems.length === 0) return;

    const now = Date.now();
    setItems(prev => prev.map(i => (i.status === 'error' && i.errorMessage && i.errorMessage !== 'Upload failed') ? { ...i, status: 'parsing', errorMessage: undefined } : i));
    
    for (const item of failedItems) {
      setReparseCooldowns(prev => ({ ...prev, [item.id]: now }));
      const result = await triggerAiParsing(item.id, item.base64, aiModel);
      
      if (result.isQuotaError) {
        setIsQuotaPaused(true);
        setQuotaCountdown(60);
        
        setItems(currentItems => currentItems.map(i => {
          if (i.status === 'parsing') {
            return { ...i, status: 'ready', errorMessage: 'Quota paused' };
          }
          return i;
        }));
        break;
      }
      
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
  };

  const handleBatchTypeChange = (type: 'drawing' | 'master') => {
    setItems(prev => prev.map(i => i.status !== 'success' ? {
      ...i,
      formData: { ...i.formData, type }
    } : i));
  };

  const handleApplyBatchCustomer = () => {
    if (!batchCustomer.trim()) return;
    setItems(prev => prev.map(i => (i.status !== 'success' && i.formData.type === 'drawing') ? {
      ...i,
      formData: { ...i.formData, customer_name: batchCustomer }
    } : i));
    showToast(`Applied customer "${batchCustomer}" to all drawings`, 'success');
  };

  const handleApplyBatchDate = () => {
    if (!batchDate.trim()) return;
    setItems(prev => prev.map(i => (i.status !== 'success' && i.formData.type === 'drawing') ? {
      ...i,
      formData: { ...i.formData, issue_date: batchDate }
    } : i));
    showToast(`Applied date "${batchDate}" to all drawings`, 'success');
  };

  const handleRotateCard = (id: string, degrees: number) => {
    setCardRotations(prev => ({
      ...prev,
      [id]: ((prev[id] || 0) + degrees) % 360
    }));
  };

  const handleZoomCard = (id: string, factor: number) => {
    setCardZooms(prev => {
      const current = prev[id] || 1;
      let next = current + factor;
      if (next < 0.5) next = 0.5;
      if (next > 3) next = 3;
      return { ...prev, [id]: next };
    });
  };

  const handleResetZoomRotate = (id: string) => {
    setCardZooms(prev => ({ ...prev, [id]: 1 }));
    setCardRotations(prev => ({ ...prev, [id]: 0 }));
  };

  const getInputClass = (item: UploadItem, fieldName: keyof UploadItem['formData']) => {
    const isLowConfidence = item.lowConfidenceFields?.includes(fieldName);
    const base = "w-full h-8 px-2 text-sm rounded border focus:ring-1 disabled:opacity-50 transition-colors";
    
    const isMono = ['drawing_number', 'revision', 'item_code', 'item_number'].includes(fieldName);
    const typography = isMono ? 'font-mono tracking-tight font-medium' : 'font-medium text-slate-900 dark:text-white';
    
    if (isLowConfidence) {
      return `${base} ${typography} border-amber-400 bg-amber-50 dark:bg-amber-500/10 focus:ring-amber-500 text-amber-900 dark:text-amber-100`;
    }
    return `${base} ${typography} border-slate-300 dark:border-white/20 bg-white dark:bg-black focus:ring-blue-500`;
  };

  const renderLabel = (item: UploadItem, fieldName: keyof UploadItem['formData'], label: string) => {
    const isLowConfidence = item.lowConfidenceFields?.includes(fieldName);
    return (
      <div className="flex items-center gap-1.5 mb-1">
        <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider leading-none">{label}</label>
        {isLowConfidence && (
          <span title="AI is not confident about this field">
            <AlertCircle className="h-3 w-3 text-amber-500" />
          </span>
        )}
      </div>
    );
  };



  const handleUpdateItem = (id: string, field: keyof UploadItem['formData'], value: string) => {
    setItems(prev => prev.map(i => i.id === id ? {
      ...i,
      formData: { ...i.formData, [field]: value }
    } : i));
  };

  const handleRemoveItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const handleSaveAll = async () => {
    const readyItems = items.filter(i => i.status === 'ready' || i.status === 'error');
    if (readyItems.length === 0) return;

    setIsUploading(true);
    let successCount = 0;

    for (const item of readyItems) {
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'uploading' } : i));
      
      try {
        const fileName = `${item.formData.item_code ? item.formData.item_code + ' ' : ''}${item.formData.drawing_number} rev.${item.formData.revision} ${item.formData.part_name}.pdf`;
        
        const formData = new FormData();
        formData.append('action', 'save_drawing');
        formData.append('file_name', fileName);
        formData.append('file', item.file);
        
        Object.entries(item.formData).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            formData.append(key, value as string);
          }
        });

        const res = await fetch('/api/drawings', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        
        if (data.success) {
          setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'success' } : i));
          successCount++;
        } else {
          setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'error', errorMessage: data.error } : i));
        }
      } catch (err) {
        setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'error', errorMessage: 'Upload failed' } : i));
      }
    }

    setIsUploading(false);
    
    if (successCount === readyItems.length) {
      showToast(`Successfully uploaded ${successCount} files!`, 'success');
      setTimeout(() => {
        onSuccess();
      }, 1000);
    } else {
      showToast(`Uploaded ${successCount} out of ${readyItems.length} files. Check errors.`, 'warning');
      setFilterStatus('error');
    }
  };

  const allSuccess = items.length > 0 && items.every(i => i.status === 'success');
  const isProcessing = isUploading || items.some(i => i.status === 'parsing');

  const totalItems = items.length;
  const parsedItemsCount = items.filter(i => i.status !== 'parsing').length;
  const parseProgressPercent = totalItems > 0 ? Math.round((parsedItemsCount / totalItems) * 100) : 0;

  const uploadedItemsCount = items.filter(i => i.status === 'success').length;
  const uploadProgressPercent = totalItems > 0 ? Math.round((uploadedItemsCount / totalItems) * 100) : 0;

  const showParseProgress = items.some(i => i.status === 'parsing');
  const showUploadProgress = isUploading;

  const isItemIncomplete = (item: UploadItem) => {
    const fd = item.formData;
    if (fd.type === 'drawing') {
      return !fd.drawing_number || !fd.customer_name || !fd.part_name;
    } else {
      return !fd.drawing_number || !fd.item_number || !fd.part_name || !fd.oil_group;
    }
  };

  const incompleteCount = items.filter(i => isItemIncomplete(i) && i.status !== 'success').length;
  const errorCount = items.filter(i => i.status === 'error').length;

  const filteredItems = items.filter(item => {
    if (filterStatus === 'error') return item.status === 'error';
    if (filterStatus === 'incomplete') return isItemIncomplete(item) && item.status !== 'success';
    return true;
  });

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDraggingOver && (
        <div className="absolute inset-0 z-[60] bg-blue-500/20 backdrop-blur-sm border-4 border-dashed border-blue-500 rounded-xl m-4 flex flex-col items-center justify-center pointer-events-none transition-all">
          <div className="bg-white dark:bg-black/80 p-8 rounded-2xl flex flex-col items-center justify-center shadow-2xl">
            <UploadCloud className="h-16 w-16 text-blue-500 animate-bounce mb-4" />
            <p className="text-xl font-bold text-slate-900 dark:text-white">Drop PDF files here</p>
            <p className="text-slate-500 mt-2">Release to add them to the queue</p>
          </div>
        </div>
      )}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-[95vw] 2xl:max-w-[1400px] bg-white dark:bg-[#1c1c1e] rounded-2xl shadow-xl overflow-hidden flex flex-col h-[95vh]"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-white/10 shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Smart Bulk Upload</h2>
            <p className="text-xs text-slate-500 mt-0.5">Upload multiple Drawings & Masters. Filenames will be parsed automatically.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center w-[220px]">
              <Select value={aiModel} onValueChange={setAiModel} disabled={isUploading || isProcessing}>
                <SelectTrigger className="h-9 bg-slate-50 dark:bg-[#2c2c2e] border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300">
                  <SelectValue placeholder="Select AI Model" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-[#2c2c2e] border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200">
                  <SelectItem value="gemini-3.1-flash" className="focus:bg-slate-100 dark:focus:bg-white/10 cursor-pointer">Gemini 3.1 Flash (Main)</SelectItem>
                  <SelectItem value="gemini-3.5-flash" className="focus:bg-slate-100 dark:focus:bg-white/10 cursor-pointer">Gemini 3.5 Flash</SelectItem>
                  <SelectItem value="gemini-3.1-flash-lite" className="focus:bg-slate-100 dark:focus:bg-white/10 cursor-pointer">Gemini 3.1 Flash Lite</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <button onClick={handleCloseAttempt} disabled={isUploading} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors disabled:opacity-50">
              <X className="h-5 w-5 text-slate-500" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {items.length > 0 && (showParseProgress || showUploadProgress) && (
            <div className="px-6 py-3 bg-blue-50/50 dark:bg-blue-500/5 border-b border-slate-200 dark:border-white/10 shrink-0">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                  <Bot className="h-3.5 w-3.5 text-blue-500" />
                  {showUploadProgress 
                    ? `Saving Documents: ${uploadedItemsCount} of ${totalItems} completed (${uploadProgressPercent}%)`
                    : `Gemini AI Processing: ${parsedItemsCount} of ${totalItems} completed (${parseProgressPercent}%)`
                  }
                </span>
                <span className="text-xs font-bold text-blue-700 dark:text-blue-400">
                  {showUploadProgress ? uploadProgressPercent : parseProgressPercent}%
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-white/10 h-2 rounded-full overflow-hidden">
                <motion.div 
                  className="bg-blue-600 dark:bg-blue-500 h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${showUploadProgress ? uploadProgressPercent : parseProgressPercent}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          )}
          {isQuotaPaused && items.some(i => i.status === 'ready' && i.errorMessage === 'Quota paused') && (
            <div className="px-6 py-3 bg-amber-50 dark:bg-amber-500/10 border-b border-amber-200 dark:border-amber-500/20 shrink-0 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                <div>
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                    AI Quota or Service Error Reached
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-400/80 mt-0.5">
                    {items.filter(i => i.status === 'ready' && i.errorMessage === 'Quota paused').length} files paused. You can switch AI model, fill data manually, or wait to resume.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs font-medium text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {quotaCountdown > 0 ? `Auto-resuming in ${quotaCountdown}s...` : 'Ready'}
                </span>
                <button
                  onClick={resumePausedParsing}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-medium transition-colors shadow-sm flex items-center gap-1.5"
                >
                  <RotateCw className="h-3.5 w-3.5" />
                  Resume Now
                </button>
              </div>
            </div>
          )}
          {items.length === 0 ? (
            <div className="flex-1 p-6 flex items-center justify-center">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 dark:border-white/20 rounded-xl p-16 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors group max-w-lg w-full"
              >
                <div className="h-20 w-20 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <UploadCloud className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-xl font-medium text-slate-900 dark:text-white mb-2">Drag & Drop PDFs here</p>
                <p className="text-sm text-slate-500 text-center mb-6">
                  Select multiple files to upload.<br />
                  Name format: <code className="bg-slate-100 dark:bg-black px-1.5 py-0.5 rounded text-xs">[DrawingNo]_[ItemCode]_rev.[Rev]_[M|D]_[PartName].pdf</code>
                </p>
                <button className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-full transition-colors shadow-sm">
                  Browse Files
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-auto p-6 bg-slate-50 dark:bg-black/20">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
                <h3 className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                  <File className="h-4 w-4 text-slate-400" />
                  Selected Files ({items.length})
                </h3>
                <div className="flex flex-wrap items-center gap-2">
                  {!isUploading && !allSuccess && items.some(i => i.status === 'error' && i.errorMessage && i.errorMessage !== 'Upload failed') && (
                    <button 
                      onClick={handleRetryFailed}
                      className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-700 dark:bg-amber-500/20 dark:hover:bg-amber-500/30 dark:text-amber-400 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                    >
                      <RotateCw className="h-3.5 w-3.5" />
                      Retry Failed AI ({items.filter(i => i.status === 'error' && i.errorMessage && i.errorMessage !== 'Upload failed').length})
                    </button>
                  )}
                  {!isUploading && !allSuccess && uploadedItemsCount > 0 && (
                    <button
                      onClick={() => setItems(prev => prev.filter(i => i.status !== 'success'))}
                      className="px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 dark:bg-green-500/20 dark:hover:bg-green-500/30 dark:text-green-400 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Clear Successful ({uploadedItemsCount})
                    </button>
                  )}
                  {!isUploading && !allSuccess && (
                    <>
                      <div className="h-6 w-px bg-slate-200 dark:bg-white/10 hidden xl:block"></div>
                      <div className="flex bg-white dark:bg-[#2c2c2e] rounded-lg border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm">
                        <button onClick={() => handleBatchTypeChange('drawing')} className="px-2.5 py-1.5 text-xs font-medium hover:bg-slate-50 dark:hover:bg-white/5 border-r border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 transition-colors">Set All Drawing</button>
                        <button onClick={() => handleBatchTypeChange('master')} className="px-2.5 py-1.5 text-xs font-medium hover:bg-slate-50 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300 transition-colors">Set All Master</button>
                      </div>
                      <div className="flex bg-white dark:bg-[#2c2c2e] rounded-lg border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm">
                        <input 
                          value={batchCustomer} 
                          onChange={e => setBatchCustomer(e.target.value)} 
                          placeholder="Customer..." 
                          className="w-24 px-2 py-1.5 text-xs bg-transparent border-none outline-none text-slate-700 dark:text-slate-300 placeholder:text-slate-400"
                        />
                        <button onClick={handleApplyBatchCustomer} className="px-2.5 py-1.5 text-xs font-medium hover:bg-slate-50 dark:hover:bg-white/5 border-l border-slate-200 dark:border-white/10 text-blue-600 dark:text-blue-400 transition-colors">Apply</button>
                      </div>
                      <div className="flex bg-white dark:bg-[#2c2c2e] rounded-lg border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm">
                        <input 
                          type="date"
                          value={batchDate} 
                          onChange={e => setBatchDate(e.target.value)} 
                          className="w-[110px] px-2 py-1.5 text-xs bg-transparent border-none outline-none text-slate-700 dark:text-slate-300"
                        />
                        <button onClick={handleApplyBatchDate} className="px-2.5 py-1.5 text-xs font-medium hover:bg-slate-50 dark:hover:bg-white/5 border-l border-slate-200 dark:border-white/10 text-blue-600 dark:text-blue-400 transition-colors">Apply</button>
                      </div>
                      
                      <div className="h-6 w-px bg-slate-200 dark:bg-white/10 hidden xl:block"></div>
                      <div className="flex items-center bg-white dark:bg-[#2c2c2e] rounded-lg border border-slate-200 dark:border-white/10 p-0.5 shadow-sm">
                        <button 
                          onClick={() => setFilterStatus('all')}
                          className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${filterStatus === 'all' ? 'bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                        >
                          All
                        </button>
                        <button 
                          onClick={() => setFilterStatus('incomplete')}
                          className={`px-3 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${filterStatus === 'incomplete' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400' : 'text-slate-500 hover:text-amber-600'}`}
                        >
                          Incomplete {incompleteCount > 0 && <span className="px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-[10px]">{incompleteCount}</span>}
                        </button>
                        <button 
                          onClick={() => setFilterStatus('error')}
                          className={`px-3 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${filterStatus === 'error' ? 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400' : 'text-slate-500 hover:text-red-600'}`}
                        >
                          Errors {errorCount > 0 && <span className="px-1.5 py-0.5 rounded-full bg-red-100 dark:bg-red-500/20 text-[10px]">{errorCount}</span>}
                        </button>
                      </div>

                      <div className="flex items-center bg-white dark:bg-[#2c2c2e] rounded-lg border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm">
                        <button 
                          onClick={() => setViewMode('detailed')}
                          className={`p-1.5 transition-colors ${viewMode === 'detailed' ? 'bg-slate-100 dark:bg-white/10 text-blue-600 dark:text-blue-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                          title="Detailed View"
                        >
                          <LayoutList className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => setViewMode('compact')}
                          className={`p-1.5 transition-colors ${viewMode === 'compact' ? 'bg-slate-100 dark:bg-white/10 text-blue-600 dark:text-blue-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                          title="Compact View"
                        >
                          <LayoutGrid className="h-4 w-4" />
                        </button>
                      </div>

                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 ml-2"
                      >
                        <Plus className="h-4 w-4" /> Add Files
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <AnimatePresence>
                  {filteredItems.map((item, index) => (
                    <motion.div 
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={`bg-white dark:bg-[#1c1c1e] border rounded-xl shadow-sm overflow-hidden ${
                        item.status === 'error' ? 'border-red-300 dark:border-red-500/30' : 
                        item.status === 'success' ? 'border-green-300 dark:border-green-500/30' :
                        'border-slate-200 dark:border-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-3 px-4 py-3 bg-slate-50/50 dark:bg-white/5 border-b border-slate-100 dark:border-white/10">
                        <div className="h-8 w-8 rounded bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                          <File className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-slate-900 dark:text-white truncate">{item.file.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-xs text-slate-500">{(item.file.size / 1024 / 1024).toFixed(2)} MB</p>
                            {item.status === 'parsing' && <span className="text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Analyzing with Gemini...</span>}
                            {item.status === 'uploading' && <span className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Uploading...</span>}
                            {item.status === 'success' && <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Uploaded</span>}
                            {item.formData.drawing_number && duplicates[`${item.formData.type}_${item.formData.drawing_number}_${item.formData.revision}`] && (
                              <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1 font-medium bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.5 rounded-md">
                                <AlertCircle className="h-3 w-3" /> Existing Record
                              </span>
                            )}
                            {item.status === 'error' && (
                              <span className="text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
                                Error: {item.errorMessage}
                              </span>
                            )}
                          </div>
                        </div>
                        {!isUploading && item.status !== 'success' && (
                          <div className="flex items-center gap-1">
                            {item.status !== 'parsing' && item.status !== 'uploading' && (
                              <button 
                                onClick={() => handleReparseSingleItem(item.id)}
                                title="Re-parse with AI"
                                className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded transition-colors"
                              >
                                <RotateCw className="h-4 w-4" />
                              </button>
                            )}
                            <button 
                              onClick={() => handleRemoveItem(item.id)}
                              title="Remove File"
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="p-5 flex flex-col xl:flex-row gap-6 bg-white dark:bg-[#1c1c1e]">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Section 1: Identity & Registration */}
                          <div className="md:col-span-2 flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-1">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                              Identity & Registration ({item.formData.type === 'master' ? 'Master Specification' : 'Customer Drawing'})
                            </h4>
                          </div>

                          <div className="space-y-1">
                            {renderLabel(item, 'type' as keyof UploadItem['formData'], 'Type')}
                            <Select 
                              value={item.formData.type}
                              onValueChange={val => handleUpdateItem(item.id, 'type', val)}
                              disabled={isProcessing || item.status === 'success'}
                            >
                              <SelectTrigger className="w-full h-8 px-3 text-sm rounded border border-slate-300 dark:border-white/20 bg-white dark:bg-black focus:ring-1 focus:ring-blue-500 disabled:opacity-50 transition-colors font-medium">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="z-[100]">
                                <SelectItem value="drawing">Drawing</SelectItem>
                                <SelectItem value="master">Master</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-1">
                            {renderLabel(item, 'drawing_number', item.formData.type === 'master' ? 'Master Doc No' : 'Drawing No')}
                            <input 
                              value={item.formData.drawing_number || ''}
                              onChange={e => handleUpdateItem(item.id, 'drawing_number', e.target.value)}
                              disabled={isProcessing || item.status === 'success'}
                              className={getInputClass(item, 'drawing_number')}
                              placeholder={item.formData.type === 'master' ? 'e.g. SM-ENTH-0014' : 'e.g. D-0376'}
                            />
                          </div>

                          <div className="space-y-1">
                            {renderLabel(item, 'revision', 'Revision')}
                            <input 
                              value={item.formData.revision || ''}
                              onChange={e => handleUpdateItem(item.id, 'revision', e.target.value)}
                              disabled={isProcessing || item.status === 'success'}
                              className={getInputClass(item, 'revision')}
                              placeholder="e.g. 00"
                            />
                          </div>

                          {item.formData.type === 'drawing' && (
                            <div className="space-y-1">
                              {renderLabel(item, 'customer_name', 'Customer')}
                              <input 
                                value={item.formData.customer_name || ''}
                                onChange={e => handleUpdateItem(item.id, 'customer_name', e.target.value)}
                                disabled={isProcessing || item.status === 'success'}
                                className={getInputClass(item, 'customer_name')}
                                placeholder="e.g. ENEOS"
                              />
                            </div>
                          )}

                          <div className={`space-y-1 ${item.formData.type === 'drawing' ? 'md:col-span-2' : ''}`}>
                            {renderLabel(item, 'item_code', 'Customer Item Code')}
                            <input 
                              value={item.formData.item_code || ''}
                              onChange={e => handleUpdateItem(item.id, 'item_code', e.target.value)}
                              disabled={isProcessing || item.status === 'success'}
                              className={getInputClass(item, 'item_code')}
                              placeholder="e.g. 40001809"
                            />
                          </div>

                          {item.formData.type === 'master' && (
                            <div className="space-y-1 md:col-span-2">
                              {renderLabel(item, 'item_number', 'Master Formula Code')}
                              <input 
                                value={item.formData.item_number || ''}
                                onChange={e => handleUpdateItem(item.id, 'item_number', e.target.value)}
                                disabled={isProcessing || item.status === 'success'}
                                className={getInputClass(item, 'item_number')}
                                placeholder="e.g. 61653013A700A"
                              />
                            </div>
                          )}

                          {viewMode === 'detailed' && (
                            <>
                              {/* Section 2: Technical & Packaging Specifications */}
                              <div className="md:col-span-2 flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-1 pt-2">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                  Technical & Packaging Specifications
                                </h4>
                              </div>

                              <div className="md:col-span-2 space-y-1">
                                {renderLabel(item, 'part_name', 'Part Name')}
                                <input 
                                  value={item.formData.part_name || ''}
                                  onChange={e => handleUpdateItem(item.id, 'part_name', e.target.value)}
                                  disabled={isProcessing || item.status === 'success'}
                                  className={getInputClass(item, 'part_name')}
                                  placeholder="Product description"
                                />
                              </div>

                              {item.formData.type === 'drawing' ? (
                                <>
                                  <div className="space-y-1">
                                    {renderLabel(item, 'issue_date', 'Issue Date')}
                                    <input 
                                      type="date"
                                      value={item.formData.issue_date || ''}
                                      onChange={e => handleUpdateItem(item.id, 'issue_date', e.target.value)}
                                      disabled={isProcessing || item.status === 'success'}
                                      className={getInputClass(item, 'issue_date')}
                                    />
                                  </div>

                                  <div className="space-y-1">
                                    {renderLabel(item, 'package_size', 'Package Size')}
                                    <input 
                                      value={item.formData.package_size || ''}
                                      onChange={e => handleUpdateItem(item.id, 'package_size', e.target.value)}
                                      disabled={isProcessing || item.status === 'success'}
                                      className={getInputClass(item, 'package_size')}
                                      placeholder="e.g. 1 x 24 L."
                                    />
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="space-y-1">
                                    {renderLabel(item, 'oil_group', 'Oil Group')}
                                    <Select 
                                      value={item.formData.oil_group || ''}
                                      onValueChange={val => handleUpdateItem(item.id, 'oil_group', val)}
                                      disabled={isProcessing || item.status === 'success'}
                                    >
                                      <SelectTrigger className="w-full h-8 px-3 text-sm rounded border border-slate-300 dark:border-white/20 bg-white dark:bg-black focus:ring-1 focus:ring-blue-500 disabled:opacity-50 transition-colors font-medium">
                                        <SelectValue placeholder="-- Select --" />
                                      </SelectTrigger>
                                      <SelectContent className="z-[100]">
                                        <SelectItem value="ENGINE OIL">ENGINE OIL</SelectItem>
                                        <SelectItem value="GEAR OIL">GEAR OIL</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <div className="space-y-1">
                                    {renderLabel(item, 'pallet_type', 'Pallet Type')}
                                    <input 
                                      value={item.formData.pallet_type || ''}
                                      onChange={e => handleUpdateItem(item.id, 'pallet_type', e.target.value)}
                                      disabled={isProcessing || item.status === 'success'}
                                      className={getInputClass(item, 'pallet_type')}
                                      placeholder="ไม้ / พลาสติก / CHEP"
                                    />
                                  </div>

                                  <div className="space-y-1">
                                    {renderLabel(item, 'boxes_per_pallet', 'Boxes / Pallet')}
                                    <input 
                                      type="number"
                                      value={item.formData.boxes_per_pallet || ''}
                                      onChange={e => handleUpdateItem(item.id, 'boxes_per_pallet', e.target.value)}
                                      disabled={isProcessing || item.status === 'success'}
                                      className={getInputClass(item, 'boxes_per_pallet')}
                                      placeholder="e.g. 30"
                                    />
                                  </div>

                                  <div className="space-y-1">
                                    {renderLabel(item, 'shelf_life', 'Shelf Life')}
                                    <input 
                                      value={item.formData.shelf_life || ''}
                                      onChange={e => handleUpdateItem(item.id, 'shelf_life', e.target.value)}
                                      disabled={isProcessing || item.status === 'success'}
                                      className={getInputClass(item, 'shelf_life')}
                                      placeholder="e.g. 2 years"
                                    />
                                  </div>
                                </>
                              )}
                            </>
                          )}
                        </div>

                        {/* PDF Preview Split Pane using iframe Blob URL */}
                        <div className="w-full xl:w-[460px] 2xl:w-[520px] h-[450px] xl:h-auto min-h-[420px] border border-slate-200 dark:border-white/10 rounded-xl bg-slate-50 dark:bg-black/50 overflow-hidden shrink-0 shadow-inner flex flex-col">
                          <div className="flex items-center justify-between p-2 border-b border-slate-200 dark:border-white/10 bg-white/50 dark:bg-black/20 backdrop-blur">
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                              <File className="h-3.5 w-3.5" /> Preview
                            </span>
                            <div className="flex items-center gap-1">
                              <button 
                                onClick={() => handleZoomCard(item.id, -0.25)}
                                className="p-1.5 hover:bg-slate-200 dark:hover:bg-white/10 rounded text-slate-500 dark:text-slate-400 transition-colors"
                                title="Zoom Out"
                              >
                                <ZoomOut className="h-3.5 w-3.5" />
                              </button>
                              <button 
                                onClick={() => handleZoomCard(item.id, 0.25)}
                                className="p-1.5 hover:bg-slate-200 dark:hover:bg-white/10 rounded text-slate-500 dark:text-slate-400 transition-colors"
                                title="Zoom In"
                              >
                                <ZoomIn className="h-3.5 w-3.5" />
                              </button>
                              <button 
                                onClick={() => handleResetZoomRotate(item.id)}
                                className="p-1.5 hover:bg-slate-200 dark:hover:bg-white/10 rounded text-slate-500 dark:text-slate-400 transition-colors"
                                title="Reset View"
                              >
                                <RefreshCcw className="h-3.5 w-3.5" />
                              </button>
                              <div className="w-px h-4 bg-slate-300 dark:bg-slate-600 mx-1"></div>
                              <button 
                                onClick={() => handleRotateCard(item.id, -90)}
                                className="p-1.5 hover:bg-slate-200 dark:hover:bg-white/10 rounded text-slate-500 dark:text-slate-400 transition-colors"
                                title="Rotate Left"
                              >
                                <RotateCw className="h-3.5 w-3.5 -scale-x-100" />
                              </button>
                              <button 
                                onClick={() => handleRotateCard(item.id, 90)}
                                className="p-1.5 hover:bg-slate-200 dark:hover:bg-white/10 rounded text-slate-500 dark:text-slate-400 transition-colors"
                                title="Rotate Right"
                              >
                                <RotateCw className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                          <div className="flex-1 relative overflow-hidden bg-white flex items-center justify-center">
                            {item.previewUrl ? (
                                <iframe 
                                  src={item.previewUrl} 
                                  title={item.file.name}
                                  className="w-full h-full border-0 transition-transform duration-300"
                                  style={{ 
                                    transform: `scale(${cardZooms[item.id] || 1}) rotate(${cardRotations[item.id] || 0}deg)`,
                                    transformOrigin: 'center center'
                                  }} 
                                />
                            ) : (
                              <div className="flex items-center justify-center h-full text-slate-400 text-sm p-4">
                                Loading PDF preview...
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="application/pdf" 
            multiple
            className="hidden" 
          />
        </div>

        {items.length > 0 && (
          <div className="p-4 bg-white dark:bg-[#1c1c1e] border-t border-slate-200 dark:border-white/10 flex items-center justify-end shrink-0">
            
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleCloseAttempt}
                disabled={isUploading}
                className="px-5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              
              {!allSuccess ? (
                <button
                  type="button"
                  onClick={handleSaveAll}
                  disabled={isProcessing || items.length === 0}
                  className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm hover:shadow disabled:opacity-50 disabled:hover:shadow-none"
                >
                  {isUploading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save All {items.length > 0 ? `(${items.length})` : ''}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onMinimize}
                  className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-xl transition-all shadow-sm"
                >
                  Done
                </button>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
