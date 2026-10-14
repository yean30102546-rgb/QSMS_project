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
  Pencil,
  ZoomIn,
  ZoomOut,
  Layers
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
  is_active?: boolean;
  created_at?: string;
  created_by?: string;
}

interface DocumentInspectionPanelProps {
  document: DrawingItem;
  allDocuments: DrawingItem[];
  initialMode?: 'view' | 'edit';
  canEdit?: boolean;
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
  canEdit = true,
  onClose,
  onSaveDocument,
  onSelectDocument,
  onDirtyChange,
  onCancelEdit,
  onModeChange
}: DocumentInspectionPanelProps) {
  const { showToast } = useNotification();
  const [mode, setMode] = useState<'view' | 'edit'>(initialMode);
  const [panelViewMode, setPanelViewMode] = useState<'both' | 'pdf' | 'metadata'>('both');
  const [formData, setFormData] = useState<DrawingItem>({ ...document });
  const [isSaving, setIsSaving] = useState(false);
  const [rotation, setRotation] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isModalFullscreen, setIsModalFullscreen] = useState<boolean>(false);
  const [selectedLinkedDocId, setSelectedLinkedDocId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoadingPdf, setIsLoadingPdf] = useState(true);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  const isMaster = formData.type === 'master';
  const isLandscape = rotation === 90 || rotation === 270;
  const containerHeight = panelViewMode === 'pdf'
    ? (isFullscreen ? 'calc(100vh - 140px)' : 'calc(100vh - 220px)')
    : (isLandscape ? 520 : 400);

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

  // Linked docs matching with Hierarchy: item_code -> drawing_number fallback
  const { linkedDocs, matchType } = React.useMemo(() => {
    let type: 'item_code' | 'drawing_number' | null = null;
    let matches: DrawingItem[] = [];

    const code = document.item_code?.trim();
    if (code) {
      const byCode = allDocuments.filter(d => d.id !== document.id && d.item_code?.trim() === code);
      if (byCode.length > 0) {
        type = 'item_code';
        matches = byCode;
      }
    }

    const dwgNum = document.drawing_number?.trim().toLowerCase();
    if (matches.length === 0 && dwgNum) {
      const byDwg = allDocuments.filter(d => d.id !== document.id && d.drawing_number?.trim().toLowerCase() === dwgNum);
      if (byDwg.length > 0) {
        type = 'drawing_number';
        matches = byDwg;
      }
    }

    // Sort: active revision first, then revision desc
    matches.sort((a, b) => {
      const aActive = a.is_active !== false ? 1 : 0;
      const bActive = b.is_active !== false ? 1 : 0;
      if (aActive !== bActive) return bActive - aActive;
      return (b.revision || '').localeCompare(a.revision || '');
    });

    return { linkedDocs: matches, matchType: type };
  }, [document.id, document.item_code, document.drawing_number, allDocuments]);

  // Reset selected linked doc and zoom on document change
  useEffect(() => {
    setSelectedLinkedDocId(null);
    setZoomLevel(100);
  }, [document.id]);

  const activeLinkedDoc = (selectedLinkedDocId && linkedDocs.find(d => d.id === selectedLinkedDocId)) || linkedDocs[0] || null;
  const linkedDoc = activeLinkedDoc;

  const FieldValue = ({ value, fallback = 'N/A', className = '' }: { value: string | null | undefined, fallback?: string, className?: string }) => (
    <div className={`w-full px-2.5 py-1.5 text-slate-900 dark:text-white font-medium break-words bg-slate-50/50 dark:bg-white/[0.02] border border-transparent rounded-lg ${className}`}>
      {value ? value : <span className="text-slate-400 italic text-xs font-sans">{fallback}</span>}
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-slate-50/30 dark:bg-black/10 overflow-hidden transition-all duration-300">
      {/* Panel Top Header Bar */}
      <div className="px-3 sm:px-5 py-2.5 sm:py-3.5 border-b border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-black/30 flex items-center justify-between shrink-0 gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <span className={`px-2 sm:px-2.5 py-0.5 sm:py-1 text-[11px] sm:text-xs font-bold uppercase rounded-md tracking-wider shrink-0 ${
            isMaster 
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30' 
              : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-500/30'
          }`}>
            {isMaster ? 'Master' : 'Drawing'}
          </span>
          <div className="truncate min-w-0">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate flex items-center gap-1.5 sm:gap-2">
              <span className="font-mono tracking-tight">{formData.drawing_number}</span>
              <span className="text-[10px] sm:text-xs font-semibold px-1.5 sm:px-2 py-0.5 rounded bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300 font-mono">
                Rev.{formData.revision}
              </span>
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">{formData.part_name}</p>
          </div>
        </div>

        <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
          {/* PDF Rotation Controls */}
          <div className="flex items-center gap-0.5 sm:gap-1 mr-1 sm:mr-2 pr-1 sm:pr-2 border-r border-slate-200 dark:border-white/10">
            <button
              onClick={() => handleRotate(90)}
              className="min-h-9 min-w-9 sm:min-h-8 sm:min-w-8 p-1.5 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-slate-200/60 dark:hover:bg-white/10 transition-colors flex items-center justify-center gap-1"
              title="หมุน 90 องศา"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleRotate(270)}
              className="hidden sm:flex p-1.5 text-emerald-600 hover:text-emerald-700 dark:hover:text-emerald-400 rounded-lg hover:bg-slate-200/60 dark:hover:bg-white/10 transition-colors items-center gap-1"
              title="ปรับเป็นแนวนอน (Landscape View)"
            >
              <Compass className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleRotate(0)}
              className="hidden sm:flex px-2 py-1 text-xs font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/60 dark:hover:bg-white/10 transition-colors"
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
              className="min-h-9 min-w-9 sm:min-h-8 sm:min-w-8 p-1.5 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-slate-200/60 dark:hover:bg-white/10 transition-colors flex items-center justify-center"
              title="เปิดในแท็บใหม่"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="hidden sm:flex p-1.5 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-slate-200/60 dark:hover:bg-white/10 transition-colors"
            title={isFullscreen ? "ย่อหน้าจอ" : "ขยายเต็มจอ"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={onClose}
            className="min-h-9 min-w-9 sm:min-h-8 sm:min-w-8 p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-200/60 dark:hover:bg-white/10 transition-colors flex items-center justify-center"
            title="ปิดแผงตรวจทาน (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* View Switcher Bar */}
      <div className="px-3 sm:px-5 py-2 border-b border-slate-200 dark:border-white/10 bg-white/60 dark:bg-black/20 flex items-center justify-between shrink-0 gap-2">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium flex-1 sm:flex-initial">
          <span className="hidden sm:inline">มุมมอง:</span>
          <div className="flex items-center bg-slate-200/80 dark:bg-white/10 p-0.5 rounded-lg text-xs w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setPanelViewMode('both')}
              className={`hidden sm:inline-flex px-2.5 py-1 rounded-md transition-all font-semibold ${panelViewMode === 'both' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
            >
              แบ่งดู (Split)
            </button>
            <button
              type="button"
              onClick={() => setPanelViewMode('pdf')}
              className={`flex-1 sm:flex-initial px-2 sm:px-2.5 py-1 rounded-md transition-all font-semibold text-center ${panelViewMode === 'pdf' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
            >
              <span className="sm:hidden">แบบแปลน (PDF)</span>
              <span className="hidden sm:inline">แบบแปลนเต็มจอ (PDF)</span>
            </button>
            <button
              type="button"
              onClick={() => setPanelViewMode('metadata')}
              className={`flex-1 sm:flex-initial px-2 sm:px-2.5 py-1 rounded-md transition-all font-semibold text-center ${panelViewMode === 'metadata' ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
            >
              <span className="sm:hidden">สเปก (Metadata)</span>
              <span className="hidden sm:inline">สเปกเต็มจอ (Metadata)</span>
            </button>
          </div>
        </div>

        {!canEdit && (
          <span className="text-[10px] sm:text-[11px] font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 sm:px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 shrink-0">
            โหมดอ่านอย่างเดียว
          </span>
        )}
      </div>

      {/* Main Body Grid */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4 sm:space-y-6">
        
        {/* PDF Viewer & Rotation Toolbar Container */}
        {panelViewMode !== 'metadata' && (
          <div className="space-y-2">
            {/* iPad / Tablet PDF Zoom and View Toolbar */}
            <div className="flex items-center justify-between px-2 py-1 text-xs text-slate-500 bg-slate-100/70 dark:bg-white/[0.04] rounded-lg border border-slate-200/80 dark:border-white/5">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-slate-400 pl-1">ซูม:</span>
                <button
                  type="button"
                  onClick={() => setZoomLevel(prev => Math.max(50, prev - 25))}
                  disabled={zoomLevel <= 50}
                  className="p-1 rounded hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 disabled:opacity-30 transition-colors"
                  title="ย่อขนาด (-25%)"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono text-[11px] px-1 font-semibold text-slate-700 dark:text-slate-200 tabular-nums">
                  {zoomLevel}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoomLevel(prev => Math.min(250, prev + 25))}
                  disabled={zoomLevel >= 250}
                  className="p-1 rounded hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 disabled:opacity-30 transition-colors"
                  title="ขยายขนาด (+25%)"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                {zoomLevel !== 100 && (
                  <button
                    type="button"
                    onClick={() => setZoomLevel(100)}
                    className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline px-1 font-medium"
                  >
                    รีเซ็ต
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1">
                {previewUrl && (
                  <a
                    href={previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 text-[11px] transition-colors"
                    title="เปิดดูผ่านเบราว์เซอร์เนทีฟในแท็บใหม่"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">แท็บใหม่</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setIsModalFullscreen(true)}
                  className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 text-[11px] transition-colors"
                  title="เปิดแบบแปลนเต็มหน้าจอ (Modal Fullscreen)"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">ขยายเต็มจอ</span>
                </button>
              </div>
            </div>

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
                    transform: `rotate(${rotation}deg) scale(${zoomLevel / 100})`,
                    transformOrigin: 'center center',
                    willChange: 'transform',
                    transformStyle: 'preserve-3d',
                    transition: 'transform 0.2s ease-in-out'
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
        )}

        {/* Linked Master/Drawing Reference Card and Decoupled Metadata Editor Form */}
        {panelViewMode !== 'pdf' && (
          <>
            {/* Smart Linked Master/Drawing Reference Card */}
            {(document.item_code || document.drawing_number || linkedDocs.length > 0) && (
              <div className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-500/20 bg-blue-50/50 dark:bg-blue-900/10">
                <div className="flex items-start sm:items-center justify-between gap-3">
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 shrink-0">
                      <Link2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] uppercase font-bold text-blue-600 dark:text-blue-400 tracking-wider">
                          Linked Document Status
                        </span>
                        {matchType === 'item_code' && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30">
                            Matched by Item Code ({document.item_code})
                          </span>
                        )}
                        {matchType === 'drawing_number' && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30">
                            Matched by Doc No ({document.drawing_number})
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-1">
                        {activeLinkedDoc ? (
                          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            พบ {activeLinkedDoc.type === 'master' ? 'Master Specification' : 'Customer Drawing'} : {activeLinkedDoc.drawing_number} (Rev.{activeLinkedDoc.revision})
                          </span>
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400">
                            ยังไม่มี {isMaster ? 'Customer Drawing' : 'Master Specification'} แนบกับเอกสารนี้
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {activeLinkedDoc && (
                    <button
                      onClick={() => onSelectDocument(activeLinkedDoc)}
                      className="px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 rounded-lg transition-colors shrink-0 flex items-center gap-1 border border-blue-200/50 dark:border-blue-500/30"
                    >
                      <span>สลับไปดู {activeLinkedDoc.type === 'master' ? 'Master' : 'Drawing'}</span>
                      <span className="font-mono text-[11px]">(Rev.{activeLinkedDoc.revision})</span>
                      <span>➔</span>
                    </button>
                  )}
                </div>

                {/* Multiple matching documents selector */}
                {linkedDocs.length > 1 && (
                  <div className="mt-3 pt-2.5 border-t border-blue-200/60 dark:border-blue-500/20">
                    <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1">
                      <Layers className="w-3 h-3 text-blue-500" />
                      <span>พบเอกสารที่จับคู่ได้ {linkedDocs.length} ฉบับ (คลิกเพื่อเลือกดู):</span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {linkedDocs.map((ld) => {
                        const isSelected = activeLinkedDoc?.id === ld.id;
                        return (
                          <button
                            key={ld.id}
                            type="button"
                            onClick={() => setSelectedLinkedDocId(ld.id)}
                            className={`px-2 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 border ${
                              isSelected
                                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                : 'bg-white dark:bg-white/5 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-blue-400'
                            }`}
                          >
                            <span>{ld.type === 'master' ? 'Master' : 'Drawing'}</span>
                            <span className="font-mono">Rev.{ld.revision}</span>
                            {ld.is_active !== false ? (
                              <span className={`text-[9px] px-1 rounded font-semibold ${
                                isSelected ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                              }`}>
                                Active
                              </span>
                            ) : (
                              <span className="text-[9px] text-slate-400">Prev</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
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
                    canEdit && (
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
                    )
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
        </>
      )}

      </div>

      {/* Fullscreen Modal View for iPad / Tablet / Technical Inspection */}
      {isModalFullscreen && previewUrl && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col p-3 sm:p-5 animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-white/10 text-white shrink-0">
            <div className="flex items-center gap-3">
              <span className="font-mono font-bold text-sm bg-white/10 px-2.5 py-1 rounded">
                {formData.drawing_number} (Rev.{formData.revision})
              </span>
              <span className="text-xs text-slate-300 truncate max-w-[300px]">{formData.part_name}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setZoomLevel(prev => Math.max(50, prev - 25))}
                  className="p-1 text-white hover:text-blue-300"
                  title="ย่อ"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="font-mono text-xs px-1 text-slate-200">{zoomLevel}%</span>
                <button
                  type="button"
                  onClick={() => setZoomLevel(prev => Math.min(250, prev + 25))}
                  className="p-1 text-white hover:text-blue-300"
                  title="ขยาย"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel(100)}
                  className="text-[11px] text-blue-300 hover:underline px-1.5"
                >
                  100%
                </button>
              </div>
              <button
                type="button"
                onClick={() => handleRotate(90)}
                className="p-1.5 text-white bg-white/10 hover:bg-white/20 rounded-lg"
                title="หมุน 90°"
              >
                <RotateCw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsModalFullscreen(false)}
                className="p-1.5 text-white bg-white/10 hover:bg-red-500 rounded-lg ml-2 transition-colors"
                title="ปิดหน้าต่างเต็มจอ (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto flex items-center justify-center p-2 min-h-0">
            <div 
              className="w-full h-full flex items-center justify-center"
              style={{
                transform: `rotate(${rotation}deg) scale(${zoomLevel / 100})`,
                transformOrigin: 'center center',
                transition: 'transform 0.2s ease-in-out'
              }}
            >
              <iframe
                src={`${previewUrl}#toolbar=0&navpanes=0&scrollbar=0&view=Fit`}
                className="w-[92vw] h-[82vh] border-none rounded-xl shadow-2xl bg-white"
                title="PDF Fullscreen Modal View"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
