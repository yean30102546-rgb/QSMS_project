import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  RotateCw, 
  Download, 
  ExternalLink, 
  Save, 
  Loader2, 
  FileText, 
  Link2, 
  Maximize2,
  Minimize2,
  Compass,
  CheckCircle2,
  Pencil
} from 'lucide-react';
import { useNotification } from '../../../contexts/NotificationContext';

export interface DrawingItem {
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
  file_name: string;
  type: 'drawing' | 'master';
  r2_key?: string;
  created_at?: string;
  created_by?: string;
}

interface DocumentInspectionPanelProps {
  document: DrawingItem;
  allDocuments: DrawingItem[];
  initialMode?: 'view' | 'edit';
  onClose: () => void;
  onSaveDocument: (updatedDoc: DrawingItem) => Promise<boolean>;
  onSelectDocument: (doc: DrawingItem) => void;
  onDirtyChange?: (isDirty: boolean) => void;
  onCancelEdit?: () => void;
  onModeChange?: (mode: 'view' | 'edit') => void;
}
// Cache for PDF signed URLs to achieve 0ms load time on switching
const pdfUrlCache = new Map<string, { url: string; timestamp: number }>();
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour

export function DocumentInspectionPanel({
  document,
  allDocuments,
  initialMode = 'view',
  onClose,
  onSaveDocument,
  onSelectDocument,
  onDirtyChange,
  onCancelEdit,
  onModeChange
}: DocumentInspectionPanelProps) {
  const { showToast } = useNotification();
  const [mode, setMode] = useState<'view' | 'edit'>(initialMode);
  const [formData, setFormData] = useState<DrawingItem>({ ...document });
  const [isSaving, setIsSaving] = useState(false);
  const [rotation, setRotation] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoadingPdf, setIsLoadingPdf] = useState(true);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  const isMaster = formData.type === 'master';
  const isLandscape = rotation === 90 || rotation === 270;
  const containerHeight = isLandscape ? 520 : 400;

  // Track container width for precise aspect-ratio inversion during rotation
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    setContainerWidth(el.getBoundingClientRect().width);
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(entries => {
        if (entries[0]) {
          setContainerWidth(entries[0].contentRect.width);
        }
      });
      observer.observe(el);
      return () => observer.disconnect();
    }
  }, [document.id, containerRef.current]);

  // Load persistent rotation preference
  useEffect(() => {
    setFormData({ ...document });
    setMode(initialMode);
    const savedRot = localStorage.getItem(`qsms_pdf_rot_${document.id}`);
    if (savedRot !== null) {
      setRotation(parseInt(savedRot, 10) || 0);
    } else {
      setRotation(0);
    }
  }, [document, initialMode]);

  const isDirty = JSON.stringify(formData) !== JSON.stringify(document);
  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  // Load PDF Blob URL for clean iframe rendering
  useEffect(() => {
    let active = true;

    if (document.r2_key) {
      const cached = pdfUrlCache.get(document.r2_key);
      if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
        setPreviewUrl(cached.url);
        setIsLoadingPdf(false);
        return;
      }

      setIsLoadingPdf(true);
      setPreviewUrl(null); // Clear previous URL to avoid showing wrong document

      const fetchPdf = async () => {
        try {
          const res = await fetch('/api/drawings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'get_download_url',
              r2_key: document.r2_key,
              preview: true
            })
          });
          if (!res.ok) {
            console.warn(`HTTP ${res.status} fetching PDF signed URL`);
            return;
          }
          const data = await res.json();
          if (active && data.success && data.url) {
            pdfUrlCache.set(document.r2_key, { url: data.url, timestamp: Date.now() });
            setPreviewUrl(data.url);
          }
        } catch (err) {
          console.error('Failed to load PDF URL:', err);
        } finally {
          if (active) setIsLoadingPdf(false);
        }
      };
      fetchPdf();
    } else {
      setIsLoadingPdf(false);
    }

    return () => {
      active = false;
    };
  }, [document.id, document.r2_key]);

  // Handle Rotation Changes & Save Preference
  const handleRotate = (degrees?: number) => {
    const nextRot = degrees !== undefined ? degrees : (rotation + 90) % 360;
    setRotation(nextRot);
    localStorage.setItem(`qsms_pdf_rot_${document.id}`, String(nextRot));
    showToast(`หมุนเอกสาร ${nextRot}° (บันทึกทิศทางแล้ว)`, 'info');
  };

  const handleChange = (field: keyof DrawingItem, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const ok = await onSaveDocument(formData);
      if (ok) {
        showToast('บันทึกข้อมูลเรียบร้อยแล้ว', 'success');
      }
    } catch (err) {
      console.error(err);
      showToast('เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Find linked Master or Drawing document by item_code
  const linkedDoc = document.item_code 
    ? allDocuments.find(d => d.id !== document.id && d.item_code === document.item_code)
    : null;

  const FieldValue = ({ value, fallback = 'N/A', className = '' }: { value: string | null | undefined, fallback?: string, className?: string }) => (
    <div className={`w-full px-2.5 py-1.5 text-slate-900 dark:text-white font-medium break-words bg-slate-50/50 dark:bg-white/[0.02] border border-transparent rounded-lg ${className}`}>
      {value ? value : <span className="text-slate-400 italic text-xs font-sans">{fallback}</span>}
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-slate-50/30 dark:bg-black/10 overflow-hidden transition-all duration-300">
      {/* Panel Top Header Bar */}
      <div className="px-5 py-3.5 border-b border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-black/30 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <span className={`px-2.5 py-1 text-xs font-bold uppercase rounded-md tracking-wider shrink-0 ${
            isMaster 
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30' 
              : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-500/30'
          }`}>
            {isMaster ? 'Master' : 'Drawing'}
          </span>
          <div className="truncate">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate flex items-center gap-2">
              <span className="font-mono tracking-tight">{formData.drawing_number}</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300 font-mono">
                Rev.{formData.revision}
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{formData.part_name}</p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* PDF Rotation Controls */}
          <div className="flex items-center gap-1 mr-2 pr-2 border-r border-slate-200 dark:border-white/10">
            <button
              onClick={() => handleRotate(90)}
              className="p-1.5 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-slate-200/60 dark:hover:bg-white/10 transition-colors flex items-center gap-1"
              title="หมุน 90 องศา"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleRotate(270)}
              className="p-1.5 text-emerald-600 hover:text-emerald-700 dark:hover:text-emerald-400 rounded-lg hover:bg-slate-200/60 dark:hover:bg-white/10 transition-colors flex items-center gap-1"
              title="ปรับเป็นแนวนอน (Landscape View)"
            >
              <Compass className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleRotate(0)}
              className="px-2 py-1 text-xs font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/60 dark:hover:bg-white/10 transition-colors"
              title="รีเซ็ตเป็น 0 องศา"
            >
              0°
            </button>
          </div>

          {previewUrl && (
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-slate-200/60 dark:hover:bg-white/10 transition-colors"
              title="เปิดในแท็บใหม่"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-slate-200/60 dark:hover:bg-white/10 transition-colors"
            title={isFullscreen ? "ย่อหน้าจอ" : "ขยายเต็มจอ"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-200/60 dark:hover:bg-white/10 transition-colors"
            title="ปิดแผงตรวจทาน (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Body Grid */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        
        {/* PDF Viewer & Rotation Toolbar Container */}
        <div className="space-y-2">
          <div 
            ref={containerRef}
            className="relative w-full bg-slate-100 dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden shadow-inner flex items-center justify-center transition-all duration-300"
            style={{ height: containerHeight }}
          >
            {isLoadingPdf ? (
              <div className="flex flex-col items-center gap-2 text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                <span className="text-xs">กำลังโหลดเอกสาร PDF...</span>
              </div>
            ) : previewUrl ? (
              <div 
                className="transition-all duration-300 ease-in-out flex items-center justify-center animate-in fade-in zoom-in-95"
                style={{
                  width: isLandscape ? containerHeight : '100%',
                  height: isLandscape && containerWidth > 0 ? containerWidth : '100%',
                  transform: `rotate(${rotation}deg)`,
                  transformOrigin: 'center center',
                  willChange: 'transform',
                  transformStyle: 'preserve-3d'
                }}
              >
                <iframe
                  src={`${previewUrl}#toolbar=0&navpanes=0&scrollbar=0&view=Fit`}
                  className="w-full h-full border-none rounded-xl"
                  title="PDF Preview"
                />
              </div>
            ) : (
              <div className="text-xs text-slate-400 flex flex-col items-center gap-1">
                <FileText className="w-8 h-8 stroke-1 text-slate-300 dark:text-slate-600" />
                <span>ไม่พบไฟล์ PDF พรีวิว</span>
              </div>
            )}
          </div>
        </div>

        {/* Linked Master/Drawing Reference Card */}
        {document.item_code && (
          <div className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-500/20 bg-blue-50/50 dark:bg-blue-900/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
                <Link2 className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] uppercase font-bold text-blue-600 dark:text-blue-400 tracking-wider">
                  Linked Document Status (Item Code: {document.item_code})
                </div>
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                  {linkedDoc ? (
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      พบ {linkedDoc.type === 'master' ? 'Master Specification' : 'Customer Drawing'} : {linkedDoc.drawing_number}
                    </span>
                  ) : (
                    <span className="text-amber-600 dark:text-amber-400">
                      ยังไม่มี {isMaster ? 'Customer Drawing' : 'Master Specification'} แนบกับไอเทมนี้
                    </span>
                  )}
                </div>
              </div>
            </div>

            {linkedDoc && (
              <button
                onClick={() => onSelectDocument(linkedDoc)}
                className="px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 rounded-lg transition-colors shrink-0"
              >
                สลับไปดู {linkedDoc.type === 'master' ? 'Master' : 'Drawing'} ➔
              </button>
            )}
          </div>
        )}

        {/* Decoupled Metadata Editor Form */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-2">
              Metadata Specifications ({isMaster ? '8 Master Fields' : '7 Drawing Fields'})
              {isDirty && <span className="ml-2 text-[10px] text-amber-500 bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-500/20">Unsaved</span>}
            </h4>
            <div className="flex items-center gap-2">
              {mode === 'view' ? (
                <button
                  onClick={() => {
                    setMode('edit');
                    onModeChange?.('edit');
                  }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm border border-slate-200 dark:border-white/10"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>แก้ไขข้อมูล</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      if (onCancelEdit) {
                        onCancelEdit();
                      } else {
                        if (isDirty) {
                          if (window.confirm("คุณมีการแก้ไขที่ยังไม่ได้บันทึก ต้องการยกเลิกและทิ้งการเปลี่ยนแปลงหรือไม่?")) {
                            setFormData({ ...document });
                            setMode('view');
                          }
                        } else {
                          setFormData({ ...document });
                          setMode('view');
                        }
                      }
                    }}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold transition-colors"
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={async () => {
                      await handleSave();
                      setMode('view');
                    }}
                    disabled={isSaving || !formData.drawing_number || !formData.part_name || !isDirty}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-50 shadow-sm"
                  >
                    {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    <span>{isSaving ? 'กำลังบันทึก...' : 'บันทึก'}</span>
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Common Fields */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-600 dark:text-slate-400">
                {isMaster ? 'Master Doc No.' : 'Drawing No.'} <span className="text-red-500">*</span>
              </label>
              {mode === 'edit' ? (
                <input
                  type="text"
                  value={formData.drawing_number || ''}
                  onChange={e => handleChange('drawing_number', e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-black/30 border border-slate-300 dark:border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white font-medium font-mono tracking-tight"
                />
              ) : (
                <FieldValue value={formData.drawing_number} className="font-mono tracking-tight" />
              )}
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-600 dark:text-slate-400">Revision</label>
              {mode === 'edit' ? (
                <input
                  type="text"
                  value={formData.revision || ''}
                  onChange={e => handleChange('revision', e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-black/30 border border-slate-300 dark:border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white font-medium font-mono tracking-tight"
                />
              ) : (
                <FieldValue value={formData.revision} className="font-mono tracking-tight" />
              )}
            </div>

            {!isMaster && (
              <div className="space-y-1">
                <label className="font-semibold text-slate-600 dark:text-slate-400">Customer Name</label>
                {mode === 'edit' ? (
                  <input
                    type="text"
                    value={formData.customer_name || ''}
                    onChange={e => handleChange('customer_name', e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-black/30 border border-slate-300 dark:border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white font-medium"
                  />
                ) : (
                  <FieldValue value={formData.customer_name} />
                )}
              </div>
            )}

            <div className="space-y-1">
              <label className="font-semibold text-slate-600 dark:text-slate-400">Customer Item Code</label>
              {mode === 'edit' ? (
                <input
                  type="text"
                  value={formData.item_code || ''}
                  onChange={e => handleChange('item_code', e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-black/30 border border-slate-300 dark:border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white font-medium font-mono tracking-tight"
                  placeholder="e.g. 40001809"
                />
              ) : (
                <FieldValue value={formData.item_code} className="font-mono tracking-tight" />
              )}
            </div>

            {isMaster && (
              <div className="space-y-1">
                <label className="font-semibold text-slate-600 dark:text-slate-400">Master Formula Code</label>
                {mode === 'edit' ? (
                  <input
                    type="text"
                    value={formData.item_number || ''}
                    onChange={e => handleChange('item_number', e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-black/30 border border-slate-300 dark:border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white font-medium font-mono tracking-tight"
                    placeholder="e.g. 61653013A700A"
                  />
                ) : (
                  <FieldValue value={formData.item_number} className="font-mono tracking-tight" />
                )}
              </div>
            )}

            <div className="sm:col-span-2 space-y-1">
              <label className="font-semibold text-slate-600 dark:text-slate-400">Part Name <span className="text-red-500">*</span></label>
              {mode === 'edit' ? (
                <input
                  type="text"
                  value={formData.part_name || ''}
                  onChange={e => handleChange('part_name', e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-black/30 border border-slate-300 dark:border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white font-medium"
                />
              ) : (
                <FieldValue value={formData.part_name} />
              )}
            </div>

            {/* Drawing specific fields */}
            {!isMaster ? (
              <>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-600 dark:text-slate-400">Issue Date</label>
                  {mode === 'edit' ? (
                    <input
                      type="date"
                      value={formData.issue_date || ''}
                      onChange={e => handleChange('issue_date', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-black/30 border border-slate-300 dark:border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white font-medium"
                    />
                  ) : (
                    <FieldValue value={formData.issue_date} />
                  )}
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-600 dark:text-slate-400">Package Size</label>
                  {mode === 'edit' ? (
                    <input
                      type="text"
                      value={formData.package_size || ''}
                      onChange={e => handleChange('package_size', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-black/30 border border-slate-300 dark:border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white font-medium"
                      placeholder="e.g. 1 x 24 L."
                    />
                  ) : (
                    <FieldValue value={formData.package_size} />
                  )}
                </div>
              </>
            ) : (
              /* Master specific fields */
              <>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-600 dark:text-slate-400">Oil Group</label>
                  {mode === 'edit' ? (
                    <select
                      value={formData.oil_group || ''}
                      onChange={e => handleChange('oil_group', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-black/30 border border-slate-300 dark:border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white font-medium"
                    >
                      <option value="">-- Select Oil Group --</option>
                      <option value="ENGINE OIL">ENGINE OIL</option>
                      <option value="GEAR OIL">GEAR OIL</option>
                    </select>
                  ) : (
                    <FieldValue value={formData.oil_group} />
                  )}
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-600 dark:text-slate-400">Pallet Type</label>
                  {mode === 'edit' ? (
                    <input
                      type="text"
                      value={formData.pallet_type || ''}
                      onChange={e => handleChange('pallet_type', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-black/30 border border-slate-300 dark:border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white font-medium"
                      placeholder="ไม้ / พลาสติก / CHEP"
                    />
                  ) : (
                    <FieldValue value={formData.pallet_type} />
                  )}
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-600 dark:text-slate-400">Boxes per Pallet</label>
                  {mode === 'edit' ? (
                    <input
                      type="text"
                      value={formData.boxes_per_pallet || ''}
                      onChange={e => handleChange('boxes_per_pallet', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-black/30 border border-slate-300 dark:border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white font-medium"
                      placeholder="e.g. 30"
                    />
                  ) : (
                    <FieldValue value={formData.boxes_per_pallet} />
                  )}
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-600 dark:text-slate-400">Shelf Life</label>
                  {mode === 'edit' ? (
                    <input
                      type="text"
                      value={formData.shelf_life || ''}
                      onChange={e => handleChange('shelf_life', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-black/30 border border-slate-300 dark:border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white font-medium"
                      placeholder="e.g. 2 years"
                    />
                  ) : (
                    <FieldValue value={formData.shelf_life} />
                  )}
                </div>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
