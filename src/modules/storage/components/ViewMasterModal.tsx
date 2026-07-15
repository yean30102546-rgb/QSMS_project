import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, ImageIcon, FileText, Tag, Package, Calendar, RotateCw, RotateCcw, Maximize2, Edit2, Save, Loader2 } from 'lucide-react';
import { useNotification } from '../../../contexts/NotificationContext';

interface MasterRecord {
  id: string;
  drawing_number: string;
  revision: string;
  part_name: string;
  customer_name: string;
  item_code: string | null;
  item_number?: string | null;
  issue_date?: string | null;
  package_size?: string | null;
  oil_group?: string | null;
  pallet_type?: string | null;
  boxes_per_pallet?: string | null;
  shelf_life?: string | null;
  r2_key: string;
  file_name: string;
  type?: 'drawing' | 'master';
}

interface ViewMasterModalProps {
  isOpen: boolean;
  onClose: () => void;
  masterDoc: MasterRecord | null;
  onSuccess?: (updatedDoc?: MasterRecord) => void;
}

export function ViewMasterModal({ isOpen, onClose, masterDoc, onSuccess }: ViewMasterModalProps) {
  const { showToast } = useNotification();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loadingImg, setLoadingImg] = useState(false);
  const [rotation, setRotation] = useState(-90);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<MasterRecord | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setIsEditing(false);
      setFormData(null);
      return;
    }
    
    // Set up resize observer to dynamically track container size for perfect rotation fit
    const timeout = setTimeout(() => {
      if (!containerRef.current) return;
      
      const observer = new ResizeObserver((entries) => {
        if (entries[0]) {
          setContainerSize({
            width: entries[0].contentRect.width,
            height: entries[0].contentRect.height
          });
        }
      });
      
      observer.observe(containerRef.current);
      setContainerSize({
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight
      });
      
      return () => observer.disconnect();
    }, 100);

    return () => clearTimeout(timeout);
  }, [isOpen, imageUrl]);

  useEffect(() => {
    if (isOpen && masterDoc) {
      setRotation(-90); // Default to landscape for Master
      fetchImageUrl(masterDoc);
      setFormData({ ...masterDoc });
    } else {
      setImageUrl(null);
    }
  }, [isOpen, masterDoc]);

  const handleChange = (field: keyof MasterRecord, value: string) => {
    setFormData((prev) => prev ? { ...prev, [field]: value } : null);
  };

  const handleSave = async () => {
    if (!formData) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/drawings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_drawing',
          ...formData,
          type: formData.type || masterDoc.type || 'master'
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Document updated successfully', 'success');
        setIsEditing(false);
        if (onSuccess) onSuccess(data.data);
      } else {
        showToast(data.error || 'Failed to update document', 'error');
      }
    } catch (err) {
      showToast('Network error while saving', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const fetchImageUrl = async (doc: MasterRecord) => {
    setLoadingImg(true);
    try {
      const res = await fetch('/api/drawings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'get_download_url',
          r2_key: doc.r2_key,
          file_name: doc.file_name,
          preview: true
        })
      });
      const data = await res.json();
      if (data.success && data.url) {
        setImageUrl(data.url);
      }
    } catch (err) {
      console.error("Failed to load image url", err);
    } finally {
      setLoadingImg(false);
    }
  };

  const handleDownload = () => {
    if (imageUrl) {
      window.open(imageUrl, '_blank');
    }
  };

  if (!isOpen || !masterDoc) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {masterDoc.type === 'drawing' ? 'Customer Drawing' : 'Master Document'}: {masterDoc.part_name}
                </h3>
                <p className="text-sm text-slate-500">
                  {masterDoc.customer_name}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 flex flex-col md:flex-row gap-6">
            {/* Left: Details */}
            <div className="w-full md:w-1/2 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Doc No. <span className="text-red-500">*</span></span>
                  {isEditing ? (
                    <input type="text" value={formData?.drawing_number || ''} onChange={(e) => handleChange('drawing_number', e.target.value)} className="w-full px-3 py-1.5 bg-white dark:bg-black/20 border border-slate-300 dark:border-white/10 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white" />
                  ) : (
                    <div className="text-sm font-medium text-slate-900 dark:text-white">{masterDoc.drawing_number}</div>
                  )}
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Revision</span>
                  {isEditing ? (
                    <input type="text" value={formData?.revision || ''} onChange={(e) => handleChange('revision', e.target.value)} className="w-full px-3 py-1.5 bg-white dark:bg-black/20 border border-slate-300 dark:border-white/10 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white" />
                  ) : (
                    <div className="text-sm font-medium text-slate-900 dark:text-white">{masterDoc.revision}</div>
                  )}
                </div>
                <div className="space-y-1 col-span-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Product Name <span className="text-red-500">*</span></span>
                  {isEditing ? (
                    <input type="text" value={formData?.part_name || ''} onChange={(e) => handleChange('part_name', e.target.value)} className="w-full px-3 py-1.5 bg-white dark:bg-black/20 border border-slate-300 dark:border-white/10 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white" />
                  ) : (
                    <div className="text-sm font-medium text-slate-900 dark:text-white">{masterDoc.part_name}</div>
                  )}
                </div>
                <div className="space-y-1 col-span-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer <span className="text-red-500">*</span></span>
                  {isEditing ? (
                    <input type="text" value={formData?.customer_name || ''} onChange={(e) => handleChange('customer_name', e.target.value)} className="w-full px-3 py-1.5 bg-white dark:bg-black/20 border border-slate-300 dark:border-white/10 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white" />
                  ) : (
                    <div className="text-sm font-medium text-slate-900 dark:text-white">{masterDoc.customer_name}</div>
                  )}
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Item Code (Customer)</span>
                  {isEditing ? (
                    <input type="text" value={formData?.item_code || ''} onChange={(e) => handleChange('item_code', e.target.value)} className="w-full px-3 py-1.5 bg-white dark:bg-black/20 border border-slate-300 dark:border-white/10 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white" />
                  ) : (
                    <div className="text-sm font-medium text-slate-900 dark:text-white flex items-center gap-1">
                      <Tag className="w-3 h-3 text-slate-400" />
                      {masterDoc.item_code || '-'}
                    </div>
                  )}
                </div>
                {masterDoc.type !== 'drawing' && (
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Item Number (Own)</span>
                    {isEditing ? (
                      <input type="text" value={formData?.item_number || ''} onChange={(e) => handleChange('item_number', e.target.value)} className="w-full px-3 py-1.5 bg-white dark:bg-black/20 border border-slate-300 dark:border-white/10 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white" />
                    ) : (
                      <div className="text-sm font-medium text-slate-900 dark:text-white flex items-center gap-1">
                        <Tag className="w-3 h-3 text-slate-400" />
                        {masterDoc.item_number || '-'}
                      </div>
                    )}
                  </div>
                )}
                <div className="space-y-1 col-span-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Issue Date</span>
                  {isEditing ? (
                    <input type="text" placeholder="e.g. 2026-07-13" value={formData?.issue_date || ''} onChange={(e) => handleChange('issue_date', e.target.value)} className="w-full px-3 py-1.5 bg-white dark:bg-black/20 border border-slate-300 dark:border-white/10 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white" />
                  ) : (
                    <div className="text-sm font-medium text-slate-900 dark:text-white flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {masterDoc.issue_date ? new Date(masterDoc.issue_date).toLocaleDateString('th-TH') : '-'}
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-200 dark:border-slate-800 pt-6">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-500" />
                  Packaging & Master Details
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Package Size</span>
                    {isEditing ? (
                      <input type="text" value={formData?.package_size || ''} onChange={(e) => handleChange('package_size', e.target.value)} className="w-full px-3 py-1.5 bg-white dark:bg-black/20 border border-slate-300 dark:border-white/10 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white" />
                    ) : (
                      <div className="text-sm font-medium text-slate-900 dark:text-white">{masterDoc.package_size || '-'}</div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Oil Group</span>
                    {isEditing ? (
                      <input type="text" value={formData?.oil_group || ''} onChange={(e) => handleChange('oil_group', e.target.value)} className="w-full px-3 py-1.5 bg-white dark:bg-black/20 border border-slate-300 dark:border-white/10 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white" />
                    ) : (
                      <div className="text-sm font-medium text-slate-900 dark:text-white">{masterDoc.oil_group || '-'}</div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pallet Type</span>
                    {isEditing ? (
                      <input type="text" value={formData?.pallet_type || ''} onChange={(e) => handleChange('pallet_type', e.target.value)} className="w-full px-3 py-1.5 bg-white dark:bg-black/20 border border-slate-300 dark:border-white/10 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white" />
                    ) : (
                      <div className="text-sm font-medium text-slate-900 dark:text-white">{masterDoc.pallet_type || '-'}</div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Boxes / Pallet</span>
                    {isEditing ? (
                      <input type="text" value={formData?.boxes_per_pallet || ''} onChange={(e) => handleChange('boxes_per_pallet', e.target.value)} className="w-full px-3 py-1.5 bg-white dark:bg-black/20 border border-slate-300 dark:border-white/10 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white" />
                    ) : (
                      <div className="text-sm font-medium text-slate-900 dark:text-white">{masterDoc.boxes_per_pallet || '-'}</div>
                    )}
                  </div>
                  <div className="space-y-1 col-span-2">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Shelf Life</span>
                    {isEditing ? (
                      <input type="text" value={formData?.shelf_life || ''} onChange={(e) => handleChange('shelf_life', e.target.value)} className="w-full px-3 py-1.5 bg-white dark:bg-black/20 border border-slate-300 dark:border-white/10 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white" />
                    ) : (
                      <div className="text-sm font-medium text-slate-900 dark:text-white">{masterDoc.shelf_life || '-'}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Image Preview */}
            <div className="w-full md:w-1/2 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Document Preview</span>
                <div className="flex items-center gap-1">
                  {imageUrl && (
                    <button 
                      onClick={() => window.open(imageUrl, '_blank')} 
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 dark:hover:text-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors" 
                      title="Open Fullscreen"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                  )}
                  <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />
                  <button 
                    onClick={() => setRotation(r => r - 90)} 
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 dark:hover:text-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors" 
                    title="Rotate Left"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setRotation(r => r + 90)} 
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 dark:hover:text-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors" 
                    title="Rotate Right"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div 
                ref={containerRef}
                className="flex-1 min-h-[450px] bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden relative"
              >
                {loadingImg ? (
                  <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-500 gap-2">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    Loading preview...
                  </div>
                ) : imageUrl ? (
                  <div 
                    className="absolute top-1/2 left-1/2 transition-all duration-300 ease-in-out"
                    style={{
                      transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
                      width: Math.abs(rotation) % 180 === 90 && containerSize.height > 0 ? `${containerSize.height}px` : '100%',
                      height: Math.abs(rotation) % 180 === 90 && containerSize.width > 0 ? `${containerSize.width}px` : '100%',
                      opacity: containerSize.width > 0 ? 1 : 0
                    }}
                  >
                    <iframe src={`${imageUrl}#toolbar=0&navpanes=0&view=Fit`} title={masterDoc.part_name} className="w-full h-full rounded-lg border-0 shadow-sm" />
                  </div>
                ) : (
                  <div className="text-sm text-slate-500 flex flex-col items-center gap-2">
                    <ImageIcon className="w-8 h-8 opacity-50" />
                    No preview available
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-between gap-3">
            <div>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
                >
                  <Edit2 className="w-4 h-4" />
                  {masterDoc.type === 'drawing' ? 'Edit Drawing' : 'Edit Master'}
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    disabled={isSaving || !formData?.drawing_number || !formData?.part_name || !formData?.customer_name}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({ ...masterDoc });
                    }}
                    disabled={isSaving}
                    className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleDownload}
                disabled={!imageUrl}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                {masterDoc.type === 'drawing' ? 'Download Drawing' : 'Download Master'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
