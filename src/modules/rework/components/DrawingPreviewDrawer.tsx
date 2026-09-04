'use client';

import React, { useState, useEffect } from 'react';
import { X, ExternalLink, FileText, Loader2, AlertCircle, RotateCw, ZoomIn, ZoomOut, CheckCircle2 } from 'lucide-react';

interface DrawingPreviewDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  query: string;
  itemTitle?: string;
}

interface DrawingRecord {
  id: string;
  drawing_number: string;
  revision: string;
  part_name: string;
  customer_name: string;
  item_code: string | null;
  item_number?: string | null;
  package_size?: string | null;
  r2_key: string;
  file_name: string;
  type: 'drawing' | 'master';
}

export function DrawingPreviewDrawer({
  isOpen,
  onClose,
  query,
  itemTitle,
}: DrawingPreviewDrawerProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [documents, setDocuments] = useState<DrawingRecord[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<DrawingRecord | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(100);

  useEffect(() => {
    if (!isOpen || !query?.trim()) return;

    const fetchDrawings = async () => {
      setLoading(true);
      setError(null);
      setDocuments([]);
      setSelectedDoc(null);
      setPdfUrl(null);
      setRotation(0);
      setZoom(100);

      try {
        const res = await fetch('/api/drawings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'list_drawings',
            search: query.trim(),
            page: 1,
            pageSize: 10,
          }),
        });

        const data = await res.json();
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          setDocuments(data.data);
          setSelectedDoc(data.data[0]);
        } else {
          setError(`ไม่พบแบบแปลน Drawing หรือ Master Sheet ที่ตรงกับรหัส "${query}"`);
        }
      } catch (err) {
        setError('เกิดข้อผิดพลาดในการเชื่อมต่อเพื่อดึงแบบแปลน');
      } finally {
        setLoading(false);
      }
    };

    fetchDrawings();
  }, [isOpen, query]);

  // When selected document changes, fetch signed URL for PDF preview
  useEffect(() => {
    if (!selectedDoc?.r2_key) {
      setPdfUrl(null);
      return;
    }

    const fetchSignedUrl = async () => {
      setPdfLoading(true);
      try {
        const res = await fetch('/api/drawings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'get_download_url',
            r2_key: selectedDoc.r2_key,
            file_name: selectedDoc.file_name,
          }),
        });
        const data = await res.json();
        if (data.success && data.url) {
          setPdfUrl(data.url);
        } else {
          setPdfUrl(null);
        }
      } catch {
        setPdfUrl(null);
      } finally {
        setPdfLoading(false);
      }
    };

    fetchSignedUrl();
  }, [selectedDoc]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs">
      <div 
        className="w-full max-w-2xl sm:max-w-3xl lg:max-w-4xl h-full bg-white shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-300"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/90 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">
                แบบแปลน Drawing & Master Sheet
              </h3>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold">
                {query}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 truncate max-w-md">
              {itemTitle || 'แสดงรายละเอียดแบบแปลนและสเปกการบรรจุสินค้า'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {pdfUrl && (
              <a
                href={pdfUrl}
                target="_blank"
                rel="noreferrer"
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
                title="เปิดในแท็บใหม่"
              >
                <ExternalLink size={16} />
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
              title="ปิด (ESC)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Multi-document Tabs (if multiple revisions or both drawing & master found) */}
        {documents.length > 1 && (
          <div className="flex items-center gap-2 px-6 py-2.5 bg-slate-100/80 border-b border-slate-200 overflow-x-auto scrollbar-hide shrink-0">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0">เอกสารที่พบ ({documents.length}):</span>
            {documents.map((doc) => {
              const isSelected = selectedDoc?.id === doc.id;
              return (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => setSelectedDoc(doc)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200/80'
                  }`}
                >
                  <span>{doc.type === 'master' ? '📋 Master Sheet' : '📐 Drawing'}</span>
                  <span className="font-mono opacity-80">({doc.drawing_number} R{doc.revision})</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Drawer Body */}
        <div className="flex-1 flex flex-col overflow-hidden p-6 gap-4 bg-slate-50/50">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
              <p className="text-xs font-semibold text-slate-600">กำลังสืบค้นแบบแปลนและสเปกสินค้า...</p>
            </div>
          ) : error ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-8 bg-white rounded-2xl border border-dashed border-slate-200">
              <AlertCircle className="w-10 h-10 text-amber-500" />
              <p className="text-sm font-bold text-slate-800">{error}</p>
              <p className="text-xs text-slate-500 max-w-sm">
                ยังไม่มีการอัปโหลดไฟล์ Drawing หรือ Master Sheet สำหรับรหัสนี้ในระบบ Vault คุณสามารถไปที่หน้า Drawing & Master Storage เพื่อนำเข้าไฟล์ PDF
              </p>
            </div>
          ) : selectedDoc ? (
            <>
              {/* Document Metadata Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs shrink-0 text-xs">
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Drawing / Doc No.</span>
                  <span className="font-bold font-mono text-slate-900">{selectedDoc.drawing_number} (Rev. {selectedDoc.revision})</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">ลูกค้า (Customer)</span>
                  <span className="font-semibold text-slate-800">{selectedDoc.customer_name}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">รหัสสินค้า (Item Code)</span>
                  <span className="font-mono text-slate-800">{selectedDoc.item_code || '-'}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">ขนาดบรรจุ (Package)</span>
                  <span className="font-semibold text-slate-800">{selectedDoc.package_size || '-'}</span>
                </div>
              </div>

              {/* PDF Viewer & Toolbar */}
              <div className="flex-1 flex flex-col bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-inner relative">
                {/* PDF Toolbar */}
                <div className="flex items-center justify-between px-4 py-2 bg-slate-800 text-white text-xs border-b border-slate-700 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-300 text-[11px] truncate max-w-xs">{selectedDoc.file_name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setRotation(r => (r + 90) % 360)}
                      className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer text-slate-300 hover:text-white"
                      title="หมุนเอกสาร 90 องศา"
                    >
                      <RotateCw size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setZoom(z => Math.max(50, z - 15))}
                      className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer text-slate-300 hover:text-white"
                      title="ซูมออก"
                    >
                      <ZoomOut size={14} />
                    </button>
                    <span className="text-[11px] font-mono text-slate-400 w-10 text-center">{zoom}%</span>
                    <button
                      type="button"
                      onClick={() => setZoom(z => Math.min(200, z + 15))}
                      className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer text-slate-300 hover:text-white"
                      title="ซูมเข้า"
                    >
                      <ZoomIn size={14} />
                    </button>
                  </div>
                </div>

                {/* PDF Canvas / Embed */}
                <div className="flex-1 overflow-auto flex items-center justify-center p-4 bg-slate-950/80">
                  {pdfLoading ? (
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
                      <span className="text-xs">กำลังโหลดหน้าเอกสาร PDF...</span>
                    </div>
                  ) : pdfUrl ? (
                    <div 
                      className="w-full h-full flex items-center justify-center transition-transform duration-200"
                      style={{
                        transform: `rotate(${rotation}deg) scale(${zoom / 100})`,
                        transformOrigin: 'center center',
                      }}
                    >
                      <iframe
                        src={`${pdfUrl}#toolbar=0&navpanes=0`}
                        title="PDF Preview"
                        className="w-full h-full min-h-[500px] rounded-lg border-0 bg-white"
                      />
                    </div>
                  ) : (
                    <div className="text-slate-400 text-xs text-center">
                      ไม่สามารถโหลดตัวอย่าง PDF ได้
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
