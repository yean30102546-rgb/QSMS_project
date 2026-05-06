/**
 * Update Modal Component
 * Fast, smooth modal for updating case status
 * Optimized animations for 60fps performance
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle2, Clock, AlertCircle, Image, ImageOff, ExternalLink, FileText, Download, FileImage } from 'lucide-react';
import { ReworkCase } from '../services/api';
import { formatThaiDate } from '../utils/helpers';
import { useExportReport } from '../hooks/useExportReport';
import { ExportTemplate } from './ExportTemplate';

interface UpdateModalProps {
  isOpen: boolean;
  caseData: ReworkCase | null;
  isLoading: boolean;
  onClose: () => void;
  onUpdate: (caseId: string, updates: Partial<ReworkCase>) => Promise<void>;
}

export function UpdateModal({
  isOpen,
  caseData,
  isLoading,
  onClose,
  onUpdate,
}: UpdateModalProps) {
  const [caseStatus, setCaseStatus] = React.useState<'Pending' | 'In-Progress' | 'Completed'>(
    caseData?.status || 'Pending'
  );
  // State สำหรับ lightbox (ดูรูปเต็มจอ)
  const [lightboxUrl, setLightboxUrl] = React.useState<string | null>(null);

  // ===== Export Hook =====
  const { exportRef, isExporting, exportProgress, exportPNG, exportPDF } = useExportReport();

  // Fix layout shift by managing body overflow
  React.useEffect(() => {
    if (isOpen) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
      return () => {
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
      };
    }
  }, [isOpen]);

  React.useEffect(() => {
    if (caseData) {
      setCaseStatus(caseData.status);
    }
  }, [caseData]);

  const handleUpdate = async () => {
    if (!caseData) return;

    await onUpdate(caseData.id, {
      status: caseStatus,
    });
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {isOpen && (
          <>
            {/* Backdrop - quick fade */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/40 z-40 will-change-opacity"
            />

            {/* Modal - slide-up quickly */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none will-change-transform"
            >
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 30 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="pointer-events-auto w-full max-w-3xl max-h-[90vh] will-change-transform"
              >
                <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-slate-200/80 max-h-[90vh] flex flex-col">
                  {/* Header */}
                  <div className="bg-slate-50 px-8 py-6 flex items-center justify-between border-b border-slate-200">
                    <div>
                      <h2 className="text-xl font-bold text-foreground">อัปเดตสถานะงาน</h2>
                      <p className="text-sm text-muted mt-1">{caseData?.id}</p>
                    </div>
                    <motion.button
                      type="button"
                      onClick={onClose}
                      disabled={isLoading}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      transition={{ duration: 0.15 }}
                      className="p-2 hover:bg-white rounded-lg disabled:opacity-50 will-change-transform"
                    >
                      <X size={20} className="text-foreground" />
                    </motion.button>
                  </div>

                  {/* Content — scrollable */}
                  <div className="px-8 py-6 space-y-8 overflow-y-auto flex-1">
                    {/* Case Info */}
                    {caseData && (
                      <div className="bg-slate-50 rounded-xl p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <p className="text-[10px] font-bold text-muted uppercase tracking-wider mb-2">
                              แหล่งที่มา
                            </p>
                            <p className="text-base font-semibold text-foreground">{caseData.source}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-muted uppercase tracking-wider mb-2">
                              วันที่
                            </p>
                            <p className="text-base font-semibold text-foreground">{formatThaiDate(caseData.date)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-muted uppercase tracking-wider mb-2">
                              จำนวนรายการ
                            </p>
                            <p className="text-base font-semibold text-foreground">
                              {caseData.items.length} items
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-muted uppercase tracking-wider mb-2">
                              สถานะปัจจุบัน
                            </p>
                            <StatusBadge status={caseData.status} />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ===== รายละเอียดและรูปภาพแนบ แบ่งตาม Item ===== */}
                    {caseData && (() => {
                      // กรองเฉพาะ Item ที่มีรูปภาพ หรือ มีรายละเอียด
                      const itemsToShow = caseData.items.filter(item =>
                        (item.imageUrls && item.imageUrls.length > 0) ||
                        (item.details && item.details.trim().length > 0)
                      );

                      if (itemsToShow.length === 0) {
                        return (
                          <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl text-sm text-muted">
                            <ImageOff size={18} className="text-slate-300" />
                            <span>ไม่มีรายละเอียดและรูปภาพแนบสำหรับ Case นี้</span>
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-5">
                          <div className="flex items-center gap-2">
                            <FileText size={16} className="text-accent" />
                            <label className="text-[10px] font-bold text-muted uppercase tracking-[0.1em]">
                              รายละเอียดเพิ่มเติมและรูปภาพ
                            </label>
                          </div>

                          {itemsToShow.map((item, index) => {
                            const images = item.imageUrls || [];
                            const hasImages = images.length > 0;
                            const hasDetails = item.details && item.details.trim().length > 0;

                            return (
                              <div key={item.id || index} className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3">
                                {/* หัวข้อ Item */}
                                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                  <div className="flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-md bg-accent/10 text-accent text-[10px] font-black flex items-center justify-center">
                                      {caseData.items.findIndex(i => i.id === item.id) + 1}
                                    </span>
                                    <p className="text-sm font-bold text-foreground">
                                      {item.itemName || item.itemNumber || `Item`}
                                    </p>
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 font-medium">
                                      {item.amount} ชิ้น
                                    </span>
                                  </div>
                                  {/* ลิงก์ไปยัง Google Drive folder */}
                                  {item.imageFolderUrl && (
                                    <a
                                      href={item.imageFolderUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1 text-[10px] text-accent font-semibold hover:underline bg-white px-2 py-1 rounded-md border border-slate-200 shadow-sm"
                                    >
                                      <ExternalLink size={12} />
                                      Drive Folder
                                    </a>
                                  )}
                                </div>

                                <div className={`grid grid-cols-1 ${hasDetails && hasImages ? 'md:grid-cols-2' : ''} gap-4`}>
                                  {/* ส่วนรายละเอียด */}
                                  {hasDetails && (
                                    <div className="space-y-1">
                                      <p className="text-[10px] font-bold text-muted uppercase">รายละเอียด / อาการเสีย:</p>
                                      <div className="bg-white p-3 rounded-lg border border-slate-100 text-sm text-slate-700 whitespace-pre-wrap">
                                        {item.details}
                                      </div>
                                    </div>
                                  )}

                                  {/* ส่วนรูปภาพ */}
                                  {hasImages && (
                                    <div className="space-y-1">
                                      <p className="text-[10px] font-bold text-muted uppercase">รูปภาพแนบ ({images.length}):</p>
                                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                        {images.map((url, imgIndex) => {
                                          let displayUrl = url;
                                          const driveIdMatch = url.match(/id=([^&]+)/);
                                          if (driveIdMatch && driveIdMatch[1]) {
                                            displayUrl = `https://lh3.googleusercontent.com/d/${driveIdMatch[1]}`;
                                          }
                                          return (
                                          <motion.button
                                            key={imgIndex}
                                            type="button"
                                            whileHover={{ scale: 1.03 }}
                                            whileTap={{ scale: 0.97 }}
                                            onClick={() => setLightboxUrl(displayUrl)}
                                            className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 bg-white hover:border-accent/50 transition-colors group cursor-zoom-in"
                                          >
                                            <img
                                              src={displayUrl}
                                              alt={`${item.itemName || 'Item'} - รูปที่ ${imgIndex + 1}`}
                                              className="w-full h-full object-cover"
                                              loading="lazy"
                                              onError={(e) => {
                                                const target = e.currentTarget;
                                                target.style.display = 'none';
                                                target.parentElement?.classList.add('flex', 'items-center', 'justify-center');
                                                const placeholder = document.createElement('div');
                                                placeholder.className = 'flex flex-col items-center gap-1 text-slate-300';
                                                placeholder.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg><span class="text-[9px]">โหลดไม่ได้</span>`;
                                                target.parentElement?.appendChild(placeholder);
                                              }}
                                            />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                              <span className="text-white text-[10px] font-bold opacity-0 group-hover:opacity-100 bg-black/50 px-2 py-1 rounded-md transition-opacity">
                                                ดูเต็ม
                                              </span>
                                            </div>
                                          </motion.button>
                                        )})}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}

                    {/* Status Update Section - Case Level */}
                    <div className="space-y-4">
                      <label className="text-[10px] font-bold text-muted uppercase tracking-[0.1em]">
                        สถานะ Case ทั้งหมด *
                      </label>
                      <div className="grid grid-cols-3 gap-4">
                        {(['Pending', 'In-Progress', 'Completed'] as const).map((status) => (
                          <motion.button
                            key={status}
                            type="button"
                            onClick={() => setCaseStatus(status)}
                            disabled={isLoading}
                            whileHover={{ y: -2 }}
                            whileTap={{ y: 0 }}
                            transition={{ duration: 0.15 }}
                            className={`p-4 rounded-xl border-2 font-semibold disabled:opacity-50 transition-colors duration-200 will-change-transform ${caseStatus === status
                              ? 'border-accent bg-accent/5 text-accent'
                              : 'border-slate-200 text-muted hover:border-accent/50'
                              }`}
                          >
                            {status === 'Pending' && (
                              <AlertCircle size={20} className="mx-auto mb-2" />
                            )}
                            {status === 'In-Progress' && (
                              <Clock size={20} className="mx-auto mb-2" />
                            )}
                            {status === 'Completed' && (
                              <CheckCircle2 size={20} className="mx-auto mb-2" />
                            )}
                            <div className="text-xs">{status}</div>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Footer — ปุ่ม Export (minimal) + ปุ่ม Action */}
                  <div className="bg-slate-50 px-8 py-5 flex items-center justify-between border-t border-slate-200">
                    {/* Export buttons (minimal icon + text) */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => caseData && exportPNG(caseData.id)}
                        disabled={isExporting || !caseData}
                        title="Export PNG"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <FileImage size={14} />
                        PNG
                      </button>
                      <button
                        type="button"
                        onClick={() => caseData && exportPDF(caseData.id)}
                        disabled={isExporting || !caseData}
                        title="Export PDF"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Download size={14} />
                        PDF
                      </button>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-6 py-2.5 rounded-xl border border-slate-300 text-slate-600 text-sm font-semibold hover:bg-slate-100 active:bg-slate-200 transition-colors disabled:opacity-50"
                      >
                        ยกเลิก
                      </button>
                      <motion.button
                        type="button"
                        onClick={handleUpdate}
                        disabled={isLoading || !caseData}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        transition={{ duration: 0.15 }}
                        className="px-6 py-2.5 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-black active:bg-black transition-colors disabled:opacity-50 flex items-center justify-center gap-2 will-change-transform"
                      >
                        {isLoading ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            กำลังบันทึก...
                          </>
                        ) : (
                          'บันทึก'
                        )}
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ===== Lightbox: ดูรูปเต็มจอ ===== */}
      <AnimatePresence>
        {lightboxUrl && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setLightboxUrl(null)}
              className="fixed inset-0 bg-black/80 z-[60] cursor-zoom-out"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[70] flex items-center justify-center p-8"
              onClick={() => setLightboxUrl(null)}
            >
              <img
                src={lightboxUrl}
                alt="ดูรูปเต็ม"
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              />
              <button
                type="button"
                onClick={() => setLightboxUrl(null)}
                className="absolute top-6 right-6 w-10 h-10 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center text-white transition-colors"
              >
                <X size={20} />
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ===== Export Overlay: แสดง Loading ขณะ Export ===== */}
      <AnimatePresence>
        {isExporting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-black/60 flex items-center justify-center"
          >
            <div className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-4 max-w-xs w-full">
              <div className="w-12 h-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
              <p className="text-sm font-semibold text-foreground">กำลัง Export...</p>
              <p className="text-xs text-muted text-center">{exportProgress}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== Ghost Export Template (ซ่อนจาก UI) ===== */}
      <ExportTemplate ref={exportRef} caseData={caseData} />
    </>
  );
}

function StatusBadge({ status }: { status: 'Pending' | 'In-Progress' | 'Completed' }) {
  const styles = {
    Pending: 'bg-amber-50 text-amber-700 border-amber-200',
    'In-Progress': 'bg-slate-100 text-slate-700 border-slate-300',
    Completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };

  return (
    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${styles[status]}`}>
      {status}
    </span>
  );
}
