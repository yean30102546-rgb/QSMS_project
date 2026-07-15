import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, UploadCloud, File, Loader2, Sparkles, AlertCircle, Trash2, CheckCircle2, Plus } from 'lucide-react';
import { useNotification } from '../../../contexts/NotificationContext';
import type { User } from '../../../services/auth';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';

export interface UploadInitialData {
  type?: 'drawing' | 'master';
  drawing_number?: string;
  revision?: string;
  part_name?: string;
  customer_name?: string;
  item_code?: string;
  item_number?: string;
  issue_date?: string;
  package_size?: string;
  oil_group?: string;
  pallet_type?: string;
  boxes_per_pallet?: string;
  shelf_life?: string;
}

interface UploadModalProps {
  user: User | null;
  initialData?: UploadInitialData;
  onClose: () => void;
  onSuccess: () => void;
}

interface UploadItem {
  id: string;
  file: File;
  base64: string;
  status: 'pending' | 'parsing' | 'ready' | 'uploading' | 'success' | 'error';
  errorMessage?: string;
  formData: {
    drawing_number: string;
    revision: string;
    part_name: string;
    customer_name: string;
    item_code: string;
    item_number: string;
    issue_date: string;
    package_size: string;
    oil_group: string;
    pallet_type: string;
    boxes_per_pallet: string;
    shelf_life: string;
    type: 'drawing' | 'master';
  };
}

export function UploadModal({ user, initialData, onClose, onSuccess }: UploadModalProps) {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [aiModel, setAiModel] = useState<string>('gemini-3.5-flash');
  const [usageStats, setUsageStats] = useState<{ rpm: number; tpm: number; rpd: number } | null>(null);
  const [limits, setLimits] = useState<{ rpm: number; tpm: number; rpd: number } | null>(null);
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

  const handleCloseAttempt = () => {
    const hasUnsavedChanges = items.some(
      item => item.status === 'parsing' || item.status === 'ready' || item.status === 'uploading' || item.status === 'error'
    );
    
    if (hasUnsavedChanges) {
      showConfirm(
        "คุณมีไฟล์ที่ยังไม่ได้บันทึกหรือกำลังประมวลผลอยู่ ต้องการปิดและยกเลิกทั้งหมดใช่หรือไม่?",
        () => {
          onClose();
        }
      );
    } else {
      onClose();
    }
  };

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const hasUnsavedChanges = items.some(
        item => item.status === 'parsing' || item.status === 'ready' || item.status === 'uploading' || item.status === 'error'
      );
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [items]);

  const toBase64 = (f: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(f);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newItems: UploadItem[] = [];

    for (const file of files) {
      if (file.type !== 'application/pdf') {
        showToast(`Skipped ${file.name} - Not a PDF`, 'warning');
        continue;
      }

      const id = Math.random().toString(36).substring(7);
      const b64 = await toBase64(file);
      const base64Data = b64.split(',')[1];
      
      // Regex parse: 60231323A713P_40001954_rev.00_M_ENEOS...
      const match = file.name.match(/^([a-zA-Z0-9-]+)_([a-zA-Z0-9-]+)_rev\.([a-zA-Z0-9.-]+)_(M|D)_(.+)\.pdf$/i);
      
      let initialType: 'drawing' | 'master' = 'drawing';
      if (initialData?.type) {
        initialType = initialData.type;
      } else if (match && match[4]) {
        initialType = match[4].toUpperCase() === 'M' ? 'master' : 'drawing';
      }

      if (match) {
        newItems.push({
          id, file, base64: base64Data, status: 'parsing',
          formData: {
            drawing_number: match[1],
            item_code: initialType === 'master' ? '' : match[2],
            item_number: initialType === 'master' ? match[2] : '',
            revision: match[3],
            type: initialType,
            part_name: match[5].replace(/_/g, ' ').trim(),
            customer_name: initialData?.customer_name || match[5].split(/[ _-]/)[0] || '',
            issue_date: initialData?.issue_date || '',
            package_size: initialData?.package_size || '',
            oil_group: initialData?.oil_group || '',
            pallet_type: initialData?.pallet_type || '',
            boxes_per_pallet: initialData?.boxes_per_pallet || '',
            shelf_life: initialData?.shelf_life || ''
          }
        });
      } else {
        newItems.push({
          id, file, base64: base64Data, status: 'parsing',
          formData: {
            drawing_number: initialData?.drawing_number || '',
            revision: initialData?.revision || '',
            part_name: initialData?.part_name || '',
            customer_name: initialData?.customer_name || '',
            item_code: initialData?.item_code || '',
            item_number: initialData?.item_number || '',
            issue_date: initialData?.issue_date || '',
            package_size: initialData?.package_size || '',
            oil_group: initialData?.oil_group || '',
            pallet_type: initialData?.pallet_type || '',
            boxes_per_pallet: initialData?.boxes_per_pallet || '',
            shelf_life: initialData?.shelf_life || '',
            type: initialType,
          }
        });
      }
    }

    setItems(prev => [...prev, ...newItems]);

    // Trigger AI parsing sequentially to avoid hitting Gemini rate limits (429 Too Many Requests)
    const processSequentially = async () => {
      for (const item of newItems) {
        await triggerAiParsing(item.id, item.base64);
        // Add 1.5s delay between requests
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    };
    processSequentially();
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerAiParsing = async (id: string, base64Data: string) => {
    try {
      const res = await fetch('/api/drawings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'parse_drawing',
          base64Data,
          aiModel
        })
      });
      const data = await res.json() as {
        success: boolean;
        error?: string;
        data?: {
          drawing_number?: string;
          revision?: string;
          part_name?: string;
          customer_name?: string;
          item_code?: string;
          item_number?: string;
          issue_date?: string;
          package_size?: string;
          oil_group?: string;
          pallet_type?: string;
          boxes_per_pallet?: string;
          shelf_life?: string;
        };
      };

      if (data.success && data.data) {
        const metadata = data.data;
        setItems(prev => prev.map(i => {
          if (i.id === id) {
            return {
              ...i,
              status: 'ready',
              formData: {
                ...i.formData,
                drawing_number: metadata.drawing_number || i.formData.drawing_number,
                revision: metadata.revision || i.formData.revision,
                part_name: metadata.part_name || i.formData.part_name,
                customer_name: metadata.customer_name || i.formData.customer_name,
                item_code: metadata.item_code || i.formData.item_code,
                item_number: metadata.item_number || i.formData.item_number,
                issue_date: metadata.issue_date || i.formData.issue_date,
                package_size: metadata.package_size || i.formData.package_size,
                oil_group: metadata.oil_group || i.formData.oil_group,
                pallet_type: metadata.pallet_type || i.formData.pallet_type,
                boxes_per_pallet: metadata.boxes_per_pallet || i.formData.boxes_per_pallet,
                shelf_life: metadata.shelf_life || i.formData.shelf_life,
              }
            };
          }
          return i;
        }));
      } else {
        setItems(prev => prev.map(i => i.id === id ? { ...i, status: 'ready', errorMessage: data.error } : i));
        if (data.error && data.error.includes('ติดลิมิต')) {
          showToast(data.error, 'error');
        }
      }
    } catch (err: unknown) {
      console.error('Error calling parse_drawing API:', err);
      setItems(prev => prev.map(i => i.id === id ? { ...i, status: 'ready', errorMessage: 'AI parsing failed' } : i));
      showToast('เกิดข้อผิดพลาดในการเชื่อมต่อ AI กรุณาลองใหม่', 'error');
    } finally {
      fetchUsageStats();
    }
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
        
        const res = await fetch('/api/drawings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            action: 'save_drawing',
            ...item.formData,
            file_name: fileName,
            base64Data: item.base64,
            created_by: user?.email || 'Unknown'
          }),
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-6xl bg-white dark:bg-[#1c1c1e] rounded-2xl shadow-xl overflow-hidden flex flex-col h-[90vh]"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-white/10 shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Smart Bulk Upload</h2>
            <p className="text-xs text-slate-500 mt-0.5">Upload multiple Drawings & Masters. Filenames will be parsed automatically.</p>
          </div>
          <div className="flex items-center gap-4">
            {usageStats && limits && (
              <div className="hidden md:flex items-center gap-3 bg-slate-50 dark:bg-white/5 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-white/10 text-xs text-slate-500">
                <div className="flex flex-col items-end">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    RPM: <span className={usageStats.rpm >= limits.rpm * 0.8 ? 'text-red-500 font-bold' : 'text-slate-600 dark:text-slate-400'}>{usageStats.rpm}</span> / {limits.rpm}
                  </span>
                  <span className="text-[9px] text-slate-400">Reqs/min</span>
                </div>
                <div className="w-px h-6 bg-slate-200 dark:bg-white/10" />
                <div className="flex flex-col items-end">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    TPM: <span className={usageStats.tpm >= limits.tpm * 0.8 ? 'text-red-500 font-bold' : 'text-slate-600 dark:text-slate-400'}>{(usageStats.tpm / 1000).toFixed(0)}k</span> / {(limits.tpm / 1000).toFixed(0)}k
                  </span>
                  <span className="text-[9px] text-slate-400">Tokens/min</span>
                </div>
              </div>
            )}
            <div className="flex items-center w-[220px]">
              <Select value={aiModel} onValueChange={setAiModel} disabled={isUploading || isProcessing}>
                <SelectTrigger className="h-9 bg-slate-50 dark:bg-[#2c2c2e] border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300">
                  <SelectValue placeholder="Select AI Model" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-[#2c2c2e] border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200">
                  <SelectItem value="gemini-3.5-flash" className="focus:bg-slate-100 dark:focus:bg-white/10 cursor-pointer">Gemini 3.5 Flash (Main)</SelectItem>
                  <SelectItem value="gemini-3.1-flash-lite" className="focus:bg-slate-100 dark:focus:bg-white/10 cursor-pointer">Gemini 3.1 Flash Lite</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <button onClick={handleCloseAttempt} disabled={isUploading} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors disabled:opacity-50">
              <X className="h-5 w-5 text-slate-500" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col">
          {items.length > 0 && (showParseProgress || showUploadProgress) && (
            <div className="px-6 py-3 bg-blue-50/50 dark:bg-blue-500/5 border-b border-slate-200 dark:border-white/10 shrink-0">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 animate-pulse text-blue-500" />
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
              <div className="flex justify-between items-end mb-4">
                <h3 className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                  <File className="h-4 w-4 text-slate-400" />
                  Selected Files ({items.length})
                </h3>
                {!isUploading && !allSuccess && (
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <Plus className="h-4 w-4" /> Add More Files
                  </button>
                )}
              </div>

              <div className="space-y-4">
                <AnimatePresence>
                  {items.map((item, index) => (
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
                            {item.status === 'error' && (
                              <span className="text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
                                Error: {item.errorMessage}
                              </span>
                            )}
                          </div>
                        </div>
                        {!isUploading && item.status !== 'success' && (
                          <button 
                            onClick={() => handleRemoveItem(item.id)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white dark:bg-[#1c1c1e]">
                        {/* Primary Identifiers */}
                        <div className="lg:col-span-7 space-y-4">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-white/5 pb-1">Primary Identifiers</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Type</label>
                              <select 
                                value={item.formData.type}
                                onChange={e => handleUpdateItem(item.id, 'type', e.target.value)}
                                disabled={isProcessing || item.status === 'success'}
                                className="w-full h-8 px-2 text-sm rounded border border-slate-300 dark:border-white/20 bg-white dark:bg-black focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                              >
                                <option value="drawing">Drawing</option>
                                <option value="master">Master</option>
                              </select>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Drawing No</label>
                              <input 
                                value={item.formData.drawing_number || ''}
                                onChange={e => handleUpdateItem(item.id, 'drawing_number', e.target.value)}
                                disabled={isProcessing || item.status === 'success'}
                                className="w-full h-8 px-2 text-sm rounded border border-slate-300 dark:border-white/20 bg-white dark:bg-black focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                                placeholder="Req."
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Rev</label>
                              <input 
                                value={item.formData.revision || ''}
                                onChange={e => handleUpdateItem(item.id, 'revision', e.target.value)}
                                disabled={isProcessing || item.status === 'success'}
                                className="w-full h-8 px-2 text-sm rounded border border-slate-300 dark:border-white/20 bg-white dark:bg-black focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                                placeholder="Req."
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Customer Item Code</label>
                              <input 
                                value={item.formData.item_code || ''}
                                onChange={e => handleUpdateItem(item.id, 'item_code', e.target.value)}
                                disabled={isProcessing || item.status === 'success'}
                                className="w-full h-8 px-2 text-sm rounded border border-slate-300 dark:border-white/20 bg-white dark:bg-black focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                              />
                            </div>
                            {item.formData.type === 'master' && (
                              <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Internal Item Number</label>
                                <input 
                                  value={item.formData.item_number || ''}
                                  onChange={e => handleUpdateItem(item.id, 'item_number', e.target.value)}
                                  disabled={isProcessing || item.status === 'success'}
                                  className="w-full h-8 px-2 text-sm rounded border border-slate-300 dark:border-white/20 bg-white dark:bg-black focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                                  placeholder="e.g. 6036708B71A"
                                />
                              </div>
                            )}
                            <div className={`${item.formData.type === 'master' ? 'sm:col-span-1' : 'sm:col-span-2'} space-y-1`}>
                              <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Customer</label>
                              <input 
                                value={item.formData.customer_name || ''}
                                onChange={e => handleUpdateItem(item.id, 'customer_name', e.target.value)}
                                disabled={isProcessing || item.status === 'success'}
                                className="w-full h-8 px-2 text-sm rounded border border-slate-300 dark:border-white/20 bg-white dark:bg-black focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                                placeholder="Req."
                              />
                            </div>
                          </div>
                        </div>

                        {/* Technical Specifications */}
                        <div className="lg:col-span-5 space-y-4 border-t lg:border-t-0 lg:border-l border-slate-100 dark:border-white/5 pt-4 lg:pt-0 lg:pl-6">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-white/5 pb-1">Technical Specifications</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="sm:col-span-2 space-y-1">
                              <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Part Name</label>
                              <input 
                                value={item.formData.part_name || ''}
                                onChange={e => handleUpdateItem(item.id, 'part_name', e.target.value)}
                                disabled={isProcessing || item.status === 'success'}
                                className="w-full h-8 px-2 text-sm rounded border border-slate-300 dark:border-white/20 bg-white dark:bg-black focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                                placeholder="Req."
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Issue Date</label>
                              <input 
                                type="date"
                                value={item.formData.issue_date || ''}
                                onChange={e => handleUpdateItem(item.id, 'issue_date', e.target.value)}
                                disabled={isProcessing || item.status === 'success'}
                                className="w-full h-8 px-2 text-sm rounded border border-slate-300 dark:border-white/20 bg-white dark:bg-black focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Pkg Size</label>
                              <input 
                                value={item.formData.package_size || ''}
                                onChange={e => handleUpdateItem(item.id, 'package_size', e.target.value)}
                                disabled={isProcessing || item.status === 'success'}
                                className="w-full h-8 px-2 text-sm rounded border border-slate-300 dark:border-white/20 bg-white dark:bg-black focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                              />
                            </div>
                            {item.formData.type === 'master' && (
                              <>
                                <div className="space-y-1">
                                  <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Oil Group</label>
                                  <select 
                                    value={item.formData.oil_group || ''}
                                    onChange={e => handleUpdateItem(item.id, 'oil_group', e.target.value)}
                                    disabled={isProcessing || item.status === 'success'}
                                    className="w-full h-8 px-2 text-sm rounded border border-slate-300 dark:border-white/20 bg-white dark:bg-black focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                                  >
                                    <option value="">-- Select --</option>
                                    <option value="ENGINE OIL">ENGINE OIL</option>
                                    <option value="GEAR OIL">GEAR OIL</option>
                                  </select>
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Pallet</label>
                                  <input 
                                    value={item.formData.pallet_type || ''}
                                    onChange={e => handleUpdateItem(item.id, 'pallet_type', e.target.value)}
                                    disabled={isProcessing || item.status === 'success'}
                                    className="w-full h-8 px-2 text-sm rounded border border-slate-300 dark:border-white/20 bg-white dark:bg-black focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Boxes/Pallet</label>
                                  <input 
                                    type="number"
                                    value={item.formData.boxes_per_pallet || ''}
                                    onChange={e => handleUpdateItem(item.id, 'boxes_per_pallet', e.target.value)}
                                    disabled={isProcessing || item.status === 'success'}
                                    className="w-full h-8 px-2 text-sm rounded border border-slate-300 dark:border-white/20 bg-white dark:bg-black focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Shelf Life</label>
                                  <input 
                                    value={item.formData.shelf_life || ''}
                                    onChange={e => handleUpdateItem(item.id, 'shelf_life', e.target.value)}
                                    disabled={isProcessing || item.status === 'success'}
                                    className="w-full h-8 px-2 text-sm rounded border border-slate-300 dark:border-white/20 bg-white dark:bg-black focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                                  />
                                </div>
                              </>
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
                  onClick={onClose}
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
