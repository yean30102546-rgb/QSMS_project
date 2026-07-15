import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, FileText, Loader2 } from 'lucide-react';
import { useNotification } from '../../../contexts/NotificationContext';

export interface EditableDocument {
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
  type: 'drawing' | 'master';
}

interface EditDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: EditableDocument | null;
  onSuccess: () => void;
}

export function EditDocumentModal({ isOpen, onClose, document, onSuccess }: EditDocumentModalProps) {
  const { showToast } = useNotification();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<EditableDocument | null>(null);

  useEffect(() => {
    if (document && isOpen) {
      setFormData({ ...document });
    } else {
      setFormData(null);
    }
  }, [document, isOpen]);

  if (!isOpen || !formData) return null;

  const handleChange = (field: keyof EditableDocument, value: string) => {
    setFormData((prev) => prev ? { ...prev, [field]: value } : null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/drawings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_drawing',
          ...formData
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Document updated successfully', 'success');
        onSuccess();
        onClose();
      } else {
        showToast(data.error || 'Failed to update document', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error while updating document', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const isMaster = formData.type === 'master';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          onClick={() => !isSaving && onClose()}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-2xl bg-white dark:bg-[#1c1c1e] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-white/10 shrink-0">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isMaster ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400'}`}>
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Edit {isMaster ? 'Master Specification' : 'Customer Drawing'}
                </h3>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isSaving}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Document No. <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  value={formData.drawing_number} 
                  onChange={(e) => handleChange('drawing_number', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-black/20 border border-slate-300 dark:border-white/10 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Revision</label>
                <input 
                  type="text" 
                  value={formData.revision} 
                  onChange={(e) => handleChange('revision', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-black/20 border border-slate-300 dark:border-white/10 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Part Name <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  value={formData.part_name} 
                  onChange={(e) => handleChange('part_name', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-black/20 border border-slate-300 dark:border-white/10 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Customer Name <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  value={formData.customer_name} 
                  onChange={(e) => handleChange('customer_name', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-black/20 border border-slate-300 dark:border-white/10 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Item Code (Customer)</label>
                <input 
                  type="text" 
                  value={formData.item_code || ''} 
                  onChange={(e) => handleChange('item_code', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-black/20 border border-slate-300 dark:border-white/10 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
                />
              </div>

              {isMaster && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Item Number (Own)</label>
                    <input 
                      type="text" 
                      value={formData.item_number || ''} 
                      onChange={(e) => handleChange('item_number', e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-black/20 border border-slate-300 dark:border-white/10 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Issue Date</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 2026-07-13 or DD/MM/YYYY"
                      value={formData.issue_date || ''} 
                      onChange={(e) => handleChange('issue_date', e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-black/20 border border-slate-300 dark:border-white/10 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Package Size</label>
                    <input 
                      type="text" 
                      value={formData.package_size || ''} 
                      onChange={(e) => handleChange('package_size', e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-black/20 border border-slate-300 dark:border-white/10 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Oil Group</label>
                    <select 
                      value={formData.oil_group || ''} 
                      onChange={(e) => handleChange('oil_group', e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-black/20 border border-slate-300 dark:border-white/10 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
                    >
                      <option value="">-- Select Oil Group --</option>
                      <option value="ENGINE OIL">ENGINE OIL</option>
                      <option value="GEAR OIL">GEAR OIL</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Pallet Type</label>
                    <input 
                      type="text" 
                      value={formData.pallet_type || ''} 
                      onChange={(e) => handleChange('pallet_type', e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-black/20 border border-slate-300 dark:border-white/10 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Boxes per Pallet</label>
                    <input 
                      type="text" 
                      value={formData.boxes_per_pallet || ''} 
                      onChange={(e) => handleChange('boxes_per_pallet', e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-black/20 border border-slate-300 dark:border-white/10 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Shelf Life</label>
                    <input 
                      type="text" 
                      value={formData.shelf_life || ''} 
                      onChange={(e) => handleChange('shelf_life', e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-black/20 border border-slate-300 dark:border-white/10 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 flex justify-end gap-3 shrink-0">
            <button
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !formData.drawing_number || !formData.part_name || !formData.customer_name}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
