import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Download, FileText, Tag, Clock, Eye, Layers, Link, CheckCircle2, AlertTriangle, AlertCircle, Pencil, MoreHorizontal, SlidersHorizontal, RotateCcw, ChevronLeft, ChevronRight, History, Search } from 'lucide-react';
import * as Popover from '@radix-ui/react-popover';
import { motion, AnimatePresence } from 'motion/react';
import { useNotification } from '../../../contexts/NotificationContext';
import { ViewMasterModal } from './ViewMasterModal';
import { EditDocumentModal, EditableDocument } from './EditDocumentModal';
import { DocumentInspectionPanel } from './DocumentInspectionPanel';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
} from '../../../components/ui/select';
import { MultiSelect } from '../../../components/ui/multi-select';

interface DocumentRecord {
  id: string;
  drawing_number: string;
  revision: string;
  part_name: string;
  customer_name: string;
  item_code: string | null;
  item_number?: string | null;
  issue_date?: string | null;
  package_size?: string | null;
  package_details?: { volume?: number; unit?: string; qty?: number; free?: number } | null;
  oil_group?: string | null;
  pallet_type?: string | null;
  boxes_per_pallet?: string | null;
  shelf_life?: string | null;
  r2_key: string;
  file_name: string;
  type: 'drawing' | 'master';
  created_at: string;
  created_by: string;
}

interface LinkMapItem {
  key: string;
  item_code: string | null;
  item_number: string | null;
  part_name: string;
  customer_name: string;
  drawing: DocumentRecord | null;
  master: DocumentRecord | null;
  status: 'complete' | 'missing_master' | 'missing_drawing' | 'incomplete_code';
}
function renderPackageSize(doc: DocumentRecord) {
  if (doc.package_details) {
    const { volume, unit, qty, free } = doc.package_details;
    const unitText = unit?.toUpperCase() === 'ML' ? 'ML' : 'Liter';
    
    let text = `${volume} ${unitText}`;
    if (qty && qty > 1) {
      text += ` x ${qty}`;
    }
    if (free && free > 0) {
      text += ` (+ ${free} Free)`;
    }
    return <span className="font-medium text-slate-700 dark:text-slate-300">{text}</span>;
  }
  
  if (doc.package_size) {
    const raw = doc.package_size.trim();
    // Normalize raw combo pack e.g. 6L+1L or 6L + 1L -> 6 Liter (+ 1 Free)
    const comboMatch = raw.match(/^(\d+(?:\.\d+)?)\s*L?\s*\+\s*(\d+(?:\.\d+)?)\s*L?$/i);
    if (comboMatch) {
      return <span className="font-medium text-slate-700 dark:text-slate-300">{comboMatch[1]} Liter (+ {comboMatch[2]} Free)</span>;
    }
    // Normalize 1L x 24 -> 1 Liter x 24
    const cleanStr = raw.replace(/(\d+(?:\.\d+)?)\s*L\b/gi, '$1 Liter').replace(/\s*\*\s*/g, ' x ');
    return <span className="font-medium text-slate-700 dark:text-slate-300">{cleanStr}</span>;
  }
  
  return <span className="text-slate-400">-</span>;
}

function formatIssueDate(dateStr?: string | null) {
  if (!dateStr) return <span className="text-slate-400">-</span>;
  const clean = dateStr.trim();
  const parts = clean.split(/[\/\-]/);
  if (parts.length === 3) {
    // If YYYY-MM-DD
    if (parts[0].length === 4) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    // If DD/MM/YYYY
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    return `${day}/${month}/${parts[2]}`;
  }
  return clean;
}

function getPackageSizeGroup(size: string): 'Small' | 'Pail' | 'IBC' | 'Other' | null {
  if (!size) return null;
  const num = parseFloat(size);
  if (isNaN(num)) return 'Other';
  if (num < 20) return 'Small';
  if (num < 1000) return 'Pail';
  return 'IBC';
}

function getPageNumbers(currentPage: number, totalPages: number): (number | 'ellipsis')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, 'ellipsis', totalPages];
  }
  if (currentPage >= totalPages - 3) {
    return [1, 'ellipsis', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }
  return [1, 'ellipsis', currentPage - 1, currentPage, currentPage + 1, 'ellipsis', totalPages];
}

function TableSkeleton({ cols = 7, rows = 5 }: { cols?: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rIdx) => (
        <tr key={rIdx} className="border-b border-slate-100 dark:border-white/5 animate-pulse">
          {Array.from({ length: cols }).map((_, cIdx) => (
            <td key={cIdx} className="px-6 py-4">
              <div className="h-4 bg-slate-200 dark:bg-white/10 rounded w-3/4" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function DocumentList({ searchQuery, refreshKey }: { searchQuery: string, refreshKey: number }) {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'drawing' | 'master' | 'link'>('drawing');
  
  // Pagination & Server State
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalDocs, setTotalDocs] = useState(0);
  const [drawingCount, setDrawingCount] = useState<number | null>(null);
  const [masterCount, setMasterCount] = useState<number | null>(null);
  const [linkCount, setLinkCount] = useState<number | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [filterOptions, setFilterOptions] = useState<{
    packageSizes: { small: string[], pail: string[], ibc: string[], other: string[] },
    oilGroups: string[],
    customers: string[],
    palletTypes: string[],
    revisions: string[]
  }>({
    packageSizes: { small: [], pail: [], ibc: [], other: [] },
    oilGroups: [],
    customers: [],
    palletTypes: [],
    revisions: []
  });
  const [selectedMasterDoc, setSelectedMasterDoc] = useState<DocumentRecord | null>(null);
  const [editingDoc, setEditingDoc] = useState<EditableDocument | null>(null);
  const [selectedInspectionDoc, setSelectedInspectionDoc] = useState<DocumentRecord | null>(null);
  
  // Resizable Splitter State
  const [splitRatio, setSplitRatio] = useState(55); // Left panel percentage
  const [isDraggingSplitter, setIsDraggingSplitter] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isDraggingSplitter) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.getBoundingClientRect().width;
      const leftOffset = containerRef.current.getBoundingClientRect().left;
      
      const newRatio = ((e.clientX - leftOffset) / containerWidth) * 100;
      if (newRatio >= 30 && newRatio <= 70) {
        setSplitRatio(newRatio);
      }
    };

    const handleMouseUp = () => setIsDraggingSplitter(false);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingSplitter]);
  const [isInspectionDirty, setIsInspectionDirty] = useState(false);
  const [inspectionMode, setInspectionMode] = useState<'view' | 'edit'>('view');
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    type: 'switch' | 'tab' | 'close' | 'edit' | 'cancelEdit';
    doc?: DocumentRecord | null;
    tab?: 'drawing' | 'master' | 'link';
    mode?: 'view' | 'edit';
  } | null>(null);

  const handleDocumentSelect = (doc: DocumentRecord | null, mode: 'view' | 'edit' = 'view') => {
    if (isInspectionDirty) {
      setPendingAction({ type: doc ? 'switch' : 'close', doc, mode });
      setShowUnsavedDialog(true);
      return;
    }
    setSelectedInspectionDoc(doc);
    setInspectionMode(mode);
  };

  const [statusFilter, setStatusFilter] = useState<'all' | 'complete' | 'missing_master' | 'missing_drawing' | 'incomplete_code'>('all');
  const { showToast } = useNotification();

  const handleSaveInspectionDocument = async (updatedDoc: DocumentRecord): Promise<boolean> => {
    try {
      const res = await fetch('/api/drawings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_drawing',
          ...updatedDoc
        }),
      });
      const data = await res.json();
      if (data.success) {
        setDocuments(prev => prev.map(d => d.id === updatedDoc.id ? { ...d, ...updatedDoc } : d));
        setSelectedInspectionDoc(updatedDoc);
        return true;
      } else {
        showToast(data.error || 'Failed to update document', 'error');
        return false;
      }
    } catch (err) {
      console.error(err);
      showToast('Network error updating document', 'error');
      return false;
    }
  };

  const [showFilters, setShowFilters] = useState(false);
  const [packageSizeFilter, setPackageSizeFilter] = useState('all');
  const [oilGroupFilter, setOilGroupFilter] = useState<string[]>([]);
  const [customerFilter, setCustomerFilter] = useState<string[]>([]);
  const [palletTypeFilter, setPalletTypeFilter] = useState<string[]>([]);
  const [revisionFilter, setRevisionFilter] = useState<string[]>([]);


  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (packageSizeFilter !== 'all') count++;
    if (oilGroupFilter.length > 0) count++;
    if (customerFilter.length > 0) count++;
    if (palletTypeFilter.length > 0) count++;
    if (revisionFilter.length > 0) count++;
    if (activeTab === 'link' && statusFilter !== 'all') count++;
    return count;
  }, [packageSizeFilter, oilGroupFilter, customerFilter, palletTypeFilter, revisionFilter, statusFilter, activeTab]);

  const resetFilters = () => {
    setPackageSizeFilter('all');
    setOilGroupFilter([]);
    setCustomerFilter([]);
    setPalletTypeFilter([]);
    setRevisionFilter([]);
    setStatusFilter('all');
  };

  const handleTabChange = (newTab: 'drawing' | 'master' | 'link') => {
    if (newTab !== activeTab) {
      if (isInspectionDirty) {
        setPendingAction({ type: 'tab', tab: newTab });
        setShowUnsavedDialog(true);
        return;
      }
      setLoading(true);
      if (newTab === 'link') {
        setLinkCount(null); // Clear count to show loading state
      }
      setPage(1);
      setActiveTab(newTab);
      setSelectedInspectionDoc(null); // Auto-close inspection panel on tab switch
    }
  };

  // For Drawing and Master tabs, documents are already filtered by the server.
  const filteredDrawings = activeTab === 'drawing' ? documents : [];
  const filteredMasters = activeTab === 'master' ? documents : [];

  // Keyboard Navigation listener for Inspection Panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Guard against firing when any dialog or input element is active
      if (selectedMasterDoc || editingDoc || showUnsavedDialog) return;

      const targetTag = (e.target as HTMLElement)?.tagName;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(targetTag)) return;

      // Spacebar to Quick Peek or Toggle
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        if (selectedInspectionDoc) {
          if (isInspectionDirty) {
            setPendingAction({ type: 'close', doc: null });
            setShowUnsavedDialog(true);
          } else {
            setSelectedInspectionDoc(null);
          }
        } else {
          const currentList = activeTab === 'drawing' ? filteredDrawings : activeTab === 'master' ? filteredMasters : [];
          if (currentList.length > 0) {
            setSelectedInspectionDoc(currentList[0]);
          }
        }
        return;
      }

      if (!selectedInspectionDoc) return;

      if (e.key === 'Escape') {
        if (isInspectionDirty) {
          setPendingAction({ type: 'close', doc: null });
          setShowUnsavedDialog(true);
        } else {
          setSelectedInspectionDoc(null);
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (isInspectionDirty) return; // Prevent navigation if dirty
        const currentList = activeTab === 'drawing' ? filteredDrawings : activeTab === 'master' ? filteredMasters : documents;
        const currentIndex = currentList.findIndex(d => d.id === selectedInspectionDoc.id);
        if (currentIndex >= 0 && currentIndex < currentList.length - 1) {
          setSelectedInspectionDoc(currentList[currentIndex + 1]);
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (isInspectionDirty) return; // Prevent navigation if dirty
        const currentList = activeTab === 'drawing' ? filteredDrawings : activeTab === 'master' ? filteredMasters : documents;
        const currentIndex = currentList.findIndex(d => d.id === selectedInspectionDoc.id);
        if (currentIndex > 0) {
          setSelectedInspectionDoc(currentList[currentIndex - 1]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedInspectionDoc, activeTab, documents, filteredDrawings, filteredMasters, isInspectionDirty, selectedMasterDoc, editingDoc, showUnsavedDialog]);

  // Track filter changes to avoid dual request races
  const prevFilterStateRef = useRef({ searchQuery, packageSizeFilter, oilGroupFilter, customerFilter, palletTypeFilter, revisionFilter, showInactive });

  const fetchFilterOptions = async () => {
    try {
      const res = await fetch('/api/drawings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_filter_options' }),
      });
      const data = await res.json();
      if (data.success && data.options) {
        setFilterOptions(data.options);
      }
    } catch (err) {
      console.error('Failed to fetch filter options:', err);
    }
  };

  useEffect(() => {
    fetchFilterOptions();
  }, [refreshKey]);

  useEffect(() => {
    const filtersChanged = 
      prevFilterStateRef.current.searchQuery !== searchQuery ||
      prevFilterStateRef.current.packageSizeFilter !== packageSizeFilter ||
      prevFilterStateRef.current.oilGroupFilter !== oilGroupFilter ||
      prevFilterStateRef.current.customerFilter !== customerFilter ||
      prevFilterStateRef.current.palletTypeFilter !== palletTypeFilter ||
      prevFilterStateRef.current.revisionFilter !== revisionFilter ||
      prevFilterStateRef.current.showInactive !== showInactive;

    prevFilterStateRef.current = { searchQuery, packageSizeFilter, oilGroupFilter, customerFilter, palletTypeFilter, revisionFilter, showInactive };

    if (filtersChanged && page !== 1) {
      setPage(1); // Will trigger fetch with page=1
      return;
    }

    fetchDocuments();
  }, [refreshKey, page, pageSize, searchQuery, activeTab, showInactive, packageSizeFilter, oilGroupFilter, customerFilter, palletTypeFilter, revisionFilter]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/drawings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'list_drawings',
          page,
          pageSize: activeTab === 'link' ? 10000 : pageSize, // Fetch all for link overview
          search: searchQuery,
          type: activeTab,
          show_inactive: showInactive,
          filters: {
             packageSize: packageSizeFilter,
             oilGroup: oilGroupFilter,
             customer: customerFilter,
             palletType: palletTypeFilter,
             revision: revisionFilter
          }
        }),
      });
      const data = await res.json();
      if (data.success) {
        setDocuments(data.data);
        setTotalDocs(data.total);
        if (activeTab === 'drawing') {
          setDrawingCount(data.total);
        } else if (activeTab === 'master') {
          setMasterCount(data.total);
        }
      } else {
        showToast(data.error || 'Failed to fetch documents', 'error');
      }
    } catch (err) {
      showToast('Network error fetching documents', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (doc: DocumentRecord) => {
    try {
      const res = await fetch('/api/drawings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_download_url',
          r2_key: doc.r2_key,
          file_name: doc.file_name
        }),
      });
      const data = await res.json();
      if (data.success) {
        window.open(data.url, '_blank');
      } else {
        showToast(data.error || 'Download Failed', 'error');
      }
    } catch (err) {
      showToast('Network error', 'error');
    }
  };

  const handlePreview = async (doc: DocumentRecord) => {
    try {
      const res = await fetch('/api/drawings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_download_url',
          r2_key: doc.r2_key,
          file_name: doc.file_name,
          preview: true
        }),
      });
      const data = await res.json();
      if (data.success) {
        window.open(data.url, '_blank');
      } else {
        showToast(data.error || 'Preview Failed', 'error');
      }
    } catch (err) {
      showToast('Network error', 'error');
    }
  };


  // 3. Compute Link Overview map (Primary Match by item_code, with fallback to part_name embedded codes)
  const linkMapItems: LinkMapItem[] = [];
  const processedDocIds = new Set<string>();

  const itemCodes = Array.from(new Set(
    documents
      .map(d => d.item_code)
      .filter((code): code is string => !!code && /^\d+$/.test(code))
  ));

  for (const code of itemCodes) {
    const matchingDrawings = documents.filter(d => d.type === 'drawing' && d.item_code === code);
    const matchingMasters = documents.filter(d => d.type === 'master' && d.item_code === code);

    // If multiple exist, we take the first for the overview summary
    const drawing = matchingDrawings[0] || null;
    const master = matchingMasters[0] || null;

    if (!drawing && !master) continue;
    
    // Mark ALL matching documents as processed so they don't fall into remainingDocs
    matchingDrawings.forEach(d => processedDocIds.add(d.id));
    matchingMasters.forEach(d => processedDocIds.add(d.id));

    const partName = drawing?.part_name || master?.part_name || '';
    const customerName = drawing?.customer_name || master?.customer_name || 'ENEOS';
    const itemNumber = master?.item_number || null;

    let status: 'complete' | 'missing_master' | 'missing_drawing' = 'complete';
    if (drawing && !master) status = 'missing_master';
    else if (!drawing && master) status = 'missing_drawing';

    linkMapItems.push({
      key: code,
      item_code: code,
      item_number: itemNumber,
      part_name: partName,
      customer_name: customerName,
      drawing,
      master,
      status
    });
  }

  // Handle remaining standalone documents (Documents missing Item Code or not processed)
  const remainingDocs = documents.filter(d => !processedDocIds.has(d.id));
  for (const doc of remainingDocs) {
    const isDrawing = doc.type === 'drawing';
    linkMapItems.push({
      key: doc.id,
      item_code: doc.item_code || null,
      item_number: doc.item_number || null,
      part_name: doc.part_name || '',
      customer_name: doc.customer_name || 'ENEOS',
      drawing: isDrawing ? doc : null,
      master: isDrawing ? null : doc,
      status: 'incomplete_code'
    });
  }

  // Filter Link Map Items
  const filteredLinks = linkMapItems
    .filter(item => statusFilter === 'all' || item.status === statusFilter);

  // Link Summary Stats
  const linkStats = useMemo(() => {
    const linked = linkMapItems.filter(i => i.status === 'complete').length;
    const missingMaster = linkMapItems.filter(i => i.status === 'missing_master').length;
    const missingDrawing = linkMapItems.filter(i => i.status === 'missing_drawing').length;
    const total = linkMapItems.length;
    return { linked, missingMaster, missingDrawing, total };
  }, [linkMapItems]);

  useEffect(() => {
    if (activeTab === 'link' && !loading) {
      setLinkCount(linkMapItems.length);
    }
  }, [linkMapItems.length, activeTab, loading]);



  return (
    <div className="w-full h-full bg-white dark:bg-[#1c1c1e] rounded-xl shadow-sm border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col min-h-0">
      {/* Tab Selectors & Filter Trigger */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-200 dark:border-white/10 px-6 bg-slate-50/50 dark:bg-white/5 shrink-0">
        <div className="flex flex-wrap -mb-px">
          <button
            onClick={() => handleTabChange('drawing')}
            className={`flex items-center gap-2 py-4 px-4 text-sm font-semibold border-b-2 transition-all -mb-px whitespace-nowrap ${activeTab === 'drawing'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400'
              }`}
          >
            <FileText className="w-4 h-4" />
            Customer Drawings {drawingCount !== null ? `(${drawingCount})` : ''}
          </button>
          <button
            onClick={() => handleTabChange('master')}
            className={`flex items-center gap-2 py-4 px-4 text-sm font-semibold border-b-2 transition-all -mb-px whitespace-nowrap ${activeTab === 'master'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400'
              }`}
          >
            <Layers className="w-4 h-4" />
            Master Specifications {masterCount !== null ? `(${masterCount})` : ''}
          </button>
          <button
            onClick={() => handleTabChange('link')}
            className={`flex items-center gap-2 py-4 px-4 text-sm font-semibold border-b-2 transition-all -mb-px whitespace-nowrap ${activeTab === 'link'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400'
              }`}
          >
            <Link className="w-4 h-4" />
            Link Overview {activeTab === 'link' && loading ? '( ... )' : linkCount !== null ? `(${linkCount})` : ''}
          </button>
        </div>

        <div className="py-2 flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${showFilters || activeFiltersCount > 0
                ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-400'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-[#2c2c2e] dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5'
              }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span className="bg-blue-600 dark:bg-blue-500 text-white rounded-full px-1.5 py-0.5 text-[9px] font-bold">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {activeFiltersCount > 0 && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
              title="Reset Filters"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Collapsible Filter Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden bg-slate-50/50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10"
          >
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {/* Customer Filter */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Customer</label>
                <MultiSelect 
                  options={filterOptions.customers} 
                  value={customerFilter} 
                  onChange={setCustomerFilter} 
                  placeholder="All Customers" 
                />
              </div>

              {/* Package Size Filter */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Package Size</label>
                <Select value={packageSizeFilter} onValueChange={setPackageSizeFilter}>
                  <SelectTrigger className="w-full h-[34px] bg-white dark:bg-[#2c2c2e] border border-slate-200 dark:border-white/10 rounded-lg text-xs outline-none text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-blue-500 focus:ring-offset-0 px-3">
                    <SelectValue placeholder="All Sizes" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px] bg-white dark:bg-[#2c2c2e] border-slate-200 dark:border-white/10 shadow-lg z-[100]">
                    <SelectItem value="all" className="focus:bg-slate-100 dark:focus:bg-white/10">All Sizes</SelectItem>

                    {filterOptions.packageSizes.small.length > 0 && (
                      <SelectGroup>
                        <SelectLabel className="text-[10px] text-slate-500 tracking-wider">Small (0.1 - 19)</SelectLabel>
                        <SelectItem value="GROUP:Small" className="font-semibold text-blue-600 dark:text-blue-400 focus:bg-blue-50 dark:focus:bg-blue-900/30 focus:text-blue-700 dark:focus:text-blue-300">-- All Small --</SelectItem>
                        {filterOptions.packageSizes.small.map(s => <SelectItem key={s} value={s} className="focus:bg-slate-100 dark:focus:bg-white/10">{s}</SelectItem>)}
                        <SelectSeparator />
                      </SelectGroup>
                    )}

                    {filterOptions.packageSizes.pail.length > 0 && (
                      <SelectGroup>
                        <SelectLabel className="text-[10px] text-slate-500 tracking-wider">Pail (20 - 999)</SelectLabel>
                        <SelectItem value="GROUP:Pail" className="font-semibold text-blue-600 dark:text-blue-400 focus:bg-blue-50 dark:focus:bg-blue-900/30 focus:text-blue-700 dark:focus:text-blue-300">-- All Pail --</SelectItem>
                        {filterOptions.packageSizes.pail.map(s => <SelectItem key={s} value={s} className="focus:bg-slate-100 dark:focus:bg-white/10">{s}</SelectItem>)}
                        <SelectSeparator />
                      </SelectGroup>
                    )}

                    {filterOptions.packageSizes.ibc.length > 0 && (
                      <SelectGroup>
                        <SelectLabel className="text-[10px] text-slate-500 tracking-wider">IBC (&gt;= 1000)</SelectLabel>
                        <SelectItem value="GROUP:IBC" className="font-semibold text-blue-600 dark:text-blue-400 focus:bg-blue-50 dark:focus:bg-blue-900/30 focus:text-blue-700 dark:focus:text-blue-300">-- All IBC --</SelectItem>
                        {filterOptions.packageSizes.ibc.map(s => <SelectItem key={s} value={s} className="focus:bg-slate-100 dark:focus:bg-white/10">{s}</SelectItem>)}
                        <SelectSeparator />
                      </SelectGroup>
                    )}

                    {filterOptions.packageSizes.other.length > 0 && (
                      <SelectGroup>
                        <SelectLabel className="text-[10px] text-slate-500 tracking-wider">Other</SelectLabel>
                        <SelectItem value="GROUP:Other" className="font-semibold text-blue-600 dark:text-blue-400 focus:bg-blue-50 dark:focus:bg-blue-900/30 focus:text-blue-700 dark:focus:text-blue-300">-- All Other --</SelectItem>
                        {filterOptions.packageSizes.other.map(s => <SelectItem key={s} value={s} className="focus:bg-slate-100 dark:focus:bg-white/10">{s}</SelectItem>)}
                      </SelectGroup>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Oil Group Filter */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Oil Group</label>
                <MultiSelect 
                  options={filterOptions.oilGroups} 
                  value={oilGroupFilter} 
                  onChange={setOilGroupFilter} 
                  placeholder="All Groups" 
                />
              </div>

              {/* Revision Filter */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Revision</label>
                <MultiSelect 
                  options={filterOptions.revisions} 
                  value={revisionFilter} 
                  onChange={setRevisionFilter} 
                  placeholder="All Revisions" 
                />
              </div>

              {/* Pallet Type / Link Status Filter */}
              {activeTab === 'link' ? (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Link Status</label>
                  <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val as any)}>
                    <SelectTrigger className="w-full h-[34px] bg-white dark:bg-[#2c2c2e] border border-slate-200 dark:border-white/10 rounded-lg text-xs outline-none text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-blue-500 focus:ring-offset-0 px-3">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px] bg-white dark:bg-[#2c2c2e] border-slate-200 dark:border-white/10 shadow-lg z-[100]">
                      <SelectItem value="all" className="focus:bg-slate-100 dark:focus:bg-white/10">All Statuses</SelectItem>
                      <SelectItem value="complete" className="focus:bg-slate-100 dark:focus:bg-white/10">Link Complete</SelectItem>
                      <SelectItem value="missing_master" className="focus:bg-slate-100 dark:focus:bg-white/10">Missing Master</SelectItem>
                      <SelectItem value="missing_drawing" className="focus:bg-slate-100 dark:focus:bg-white/10">Missing Drawing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Pallet Type</label>
                  <MultiSelect 
                    options={filterOptions.palletTypes} 
                    value={palletTypeFilter} 
                    onChange={setPalletTypeFilter} 
                    placeholder="All Pallets" 
                  />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Filter Badges */}
      {activeFiltersCount > 0 && (
        <div className="px-6 py-2.5 bg-slate-50/30 dark:bg-white/5 border-b border-slate-200 dark:border-white/10 flex flex-wrap gap-2 items-center">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mr-1">Active Filters:</span>
          {customerFilter.length > 0 && (
            <span className="flex items-center gap-1 bg-white dark:bg-[#2c2c2e] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 px-2 py-0.5 rounded-full text-xs shadow-sm">
              <span>Customer: {customerFilter.length} selected</span>
              <button onClick={() => setCustomerFilter([])} className="text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold ml-0.5">×</button>
            </span>
          )}
          {packageSizeFilter !== 'all' && (
            <span className="flex items-center gap-1 bg-white dark:bg-[#2c2c2e] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 px-2 py-0.5 rounded-full text-xs shadow-sm">
              <span>Size: {packageSizeFilter.startsWith('GROUP:') ? `All ${packageSizeFilter.split(':')[1]}` : packageSizeFilter}</span>
              <button onClick={() => setPackageSizeFilter('all')} className="text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold ml-0.5">×</button>
            </span>
          )}
          {oilGroupFilter.length > 0 && (
            <span className="flex items-center gap-1 bg-white dark:bg-[#2c2c2e] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 px-2 py-0.5 rounded-full text-xs shadow-sm">
              <span>Oil Group: {oilGroupFilter.length} selected</span>
              <button onClick={() => setOilGroupFilter([])} className="text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold ml-0.5">×</button>
            </span>
          )}
          {palletTypeFilter.length > 0 && activeTab !== 'link' && (
            <span className="flex items-center gap-1 bg-white dark:bg-[#2c2c2e] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 px-2 py-0.5 rounded-full text-xs shadow-sm">
              <span>Pallet: {palletTypeFilter.length} selected</span>
              <button onClick={() => setPalletTypeFilter([])} className="text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold ml-0.5">×</button>
            </span>
          )}
          {revisionFilter.length > 0 && (
            <span className="flex items-center gap-1 bg-white dark:bg-[#2c2c2e] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 px-2 py-0.5 rounded-full text-xs shadow-sm">
              <span>Revision: {revisionFilter.length} selected</span>
              <button onClick={() => setRevisionFilter([])} className="text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold ml-0.5">×</button>
            </span>
          )}
          {activeTab === 'link' && statusFilter !== 'all' && (
            <span className="flex items-center gap-1 bg-white dark:bg-[#2c2c2e] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 px-2 py-0.5 rounded-full text-xs shadow-sm">
              <span>Status: {statusFilter}</span>
              <button onClick={() => setStatusFilter('all')} className="text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold ml-0.5">×</button>
            </span>
          )}
        </div>
      )}

      {/* Master-Detail Split Workspace Wrapper */}
      <div ref={containerRef} className={`flex flex-col xl:flex-row items-stretch flex-1 overflow-hidden border-t border-slate-200 dark:border-white/10 ${selectedInspectionDoc ? 'divide-x-0 xl:divide-x divide-slate-200 dark:divide-white/10' : ''}`}>
        <div 
          className={`transition-all duration-300 min-w-0 h-full flex flex-col ${!isDraggingSplitter ? 'ease-in-out' : ''}`}
          style={{ width: selectedInspectionDoc ? `${splitRatio}%` : '100%' }}
        >
          <div className="flex-1 overflow-y-auto overflow-x-auto">
            {/* Drawings Tab UI */}
            {activeTab === 'drawing' && (
              <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-black/20 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="px-6 py-4">Drawing No.</th>
                    <th className="px-6 py-4">Part Name</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Item Code</th>
                    <th className={`px-6 py-4 transition-all duration-300 ${selectedInspectionDoc ? 'hidden' : ''}`}>Issue Date</th>
                    <th className={`px-6 py-4 transition-all duration-300 ${selectedInspectionDoc ? 'hidden' : ''}`}>Package Size</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {loading ? (
                    <TableSkeleton cols={7} rows={pageSize > 20 ? 8 : pageSize} />
                  ) : filteredDrawings.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                        No drawings found.
                      </td>
                    </tr>
                  ) : (
                    filteredDrawings.map((doc) => (
                      <tr 
                        key={doc.id} 
                        onClick={() => handleDocumentSelect(selectedInspectionDoc?.id === doc.id ? null : doc, 'view')}
                        id={`doc-row-${doc.id}`}
                        className={`cursor-pointer transition-colors ${
                          selectedInspectionDoc?.id === doc.id 
                            ? 'bg-blue-50/80 dark:bg-blue-900/30 border-l-4 border-l-blue-500 font-medium' 
                            : 'hover:bg-slate-50/50 dark:hover:bg-white/5'
                        }`}
                      >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                            <span className="font-mono tracking-tight">{doc.drawing_number}</span>
                            <span className="inline-flex items-center rounded-md bg-slate-100 dark:bg-white/10 px-2 py-0.5 text-xs font-medium text-slate-600 dark:text-slate-300 font-mono">
                              Rev.{doc.revision}
                            </span>
                          </div>
                          
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{doc.part_name}</td>
                    <td className="px-6 py-4">{doc.customer_name}</td>
                    <td className="px-6 py-4">
                      {doc.item_code ? (
                        <span className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium font-mono">
                          <Tag className="h-3 w-3" />
                          {doc.item_code}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className={`px-6 py-4 transition-all duration-300 ${selectedInspectionDoc ? 'hidden' : ''}`}>
                      {formatIssueDate(doc.issue_date)}
                    </td>
                    <td className={`px-6 py-4 transition-all duration-300 ${selectedInspectionDoc ? 'hidden' : ''}`}>{renderPackageSize(doc)}</td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDocumentSelect(doc, 'edit'); }}
                          className="p-2 text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/30 rounded-lg transition-colors inline-flex"
                          title="Edit Details"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => handlePreview(doc)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/30 rounded-lg transition-colors inline-flex"
                          title="Preview PDF"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDownload(doc)}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg transition-colors inline-flex"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {/* Masters Tab UI */}
        {activeTab === 'master' && (
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-black/20 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4">Master Doc No.</th>
                <th className="px-6 py-4">Part Name</th>
                <th className="px-6 py-4">Identifiers</th>
                <th className={`px-6 py-4 transition-all duration-300 ${selectedInspectionDoc ? 'hidden' : ''}`}>Oil Group</th>
                <th className={`px-6 py-4 transition-all duration-300 ${selectedInspectionDoc ? 'hidden' : ''}`}>Packaging</th>
                <th className={`px-6 py-4 transition-all duration-300 ${selectedInspectionDoc ? 'hidden' : ''}`}>Shelf Life</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {loading ? (
                <TableSkeleton cols={7} rows={pageSize > 20 ? 8 : pageSize} />
              ) : filteredMasters.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    No masters found.
                  </td>
                </tr>
              ) : (
                filteredMasters.map((doc) => (
                  <tr 
                    key={doc.id} 
                    onClick={() => handleDocumentSelect(selectedInspectionDoc?.id === doc.id ? null : doc, 'view')}
                        id={`doc-row-${doc.id}`}
                    className={`cursor-pointer transition-colors ${
                      selectedInspectionDoc?.id === doc.id 
                        ? 'bg-blue-50/80 dark:bg-blue-900/30 border-l-4 border-l-blue-500 font-medium' 
                        : 'hover:bg-slate-50/50 dark:hover:bg-white/5'
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          <Layers className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                            <span className="font-mono tracking-tight">{doc.drawing_number}</span>
                            <span className="inline-flex items-center rounded-md bg-slate-100 dark:bg-white/10 px-2 py-0.5 text-xs font-medium text-slate-600 dark:text-slate-300 font-mono">
                              Rev.{doc.revision}
                            </span>
                          </div>
                          
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white max-w-[250px]">{doc.part_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        {doc.item_code && (
                          <div className="flex items-center gap-2" title="Customer Product Code">
                            <span className="text-[10px] font-semibold text-blue-500/70 dark:text-blue-400/70 uppercase w-6 shrink-0">CUS</span>
                            <span className="font-medium font-mono tabular-nums tracking-tight text-[13px] text-slate-800 dark:text-slate-200">{doc.item_code}</span>
                          </div>
                        )}
                        {doc.item_number && (
                          <div className="flex items-center gap-2" title="Internal Factory Code">
                            <span className="text-[10px] font-semibold text-emerald-500/70 dark:text-emerald-400/70 uppercase w-6 shrink-0">INT</span>
                            <span className="font-medium font-mono tabular-nums tracking-tight text-[13px] text-slate-500 dark:text-slate-400">{doc.item_number}</span>
                          </div>
                        )}
                        {!doc.item_code && !doc.item_number && (
                          <span className="text-slate-400 italic text-xs">No Identifiers</span>
                        )}
                      </div>
                    </td>
                    <td className={`px-6 py-4 transition-all duration-300 ${selectedInspectionDoc ? 'hidden' : ''}`}>{doc.oil_group || <span className="text-slate-400">-</span>}</td>
                    <td className={`px-6 py-4 whitespace-nowrap transition-all duration-300 ${selectedInspectionDoc ? 'hidden' : ''}`}>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-slate-700 dark:text-slate-300 font-medium">{doc.pallet_type || '-'}</span>
                        {doc.boxes_per_pallet && <span className="text-[11px] text-slate-500">{doc.boxes_per_pallet}</span>}
                      </div>
                    </td>
                    <td className={`px-6 py-4 transition-all duration-300 ${selectedInspectionDoc ? 'hidden' : ''}`}>{doc.shelf_life || <span className="text-slate-400">-</span>}</td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDocumentSelect(doc, 'edit'); }}
                          className="p-2 text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/30 rounded-lg transition-colors inline-flex"
                          title="Edit Master Details"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handlePreview(doc)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/30 rounded-lg transition-colors inline-flex"
                          title="Preview PDF"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDownload(doc)}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg transition-colors inline-flex"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {/* Link Overview Tab UI */}
        {activeTab === 'link' && (
          <>
            {/* Summary Progress Bar */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Link Coverage</span>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {linkStats.linked}/{linkStats.total} fully linked
                </span>
              </div>
              <div className="flex h-2 w-full rounded-full overflow-hidden bg-slate-100 dark:bg-white/5">
                {linkStats.total > 0 && (
                  <>
                    <div className="bg-emerald-500 transition-all duration-500" style={{ width: `${(linkStats.linked / linkStats.total) * 100}%` }} />
                    <div className="bg-amber-400 transition-all duration-500" style={{ width: `${(linkStats.missingMaster / linkStats.total) * 100}%` }} />
                    <div className="bg-red-400 transition-all duration-500" style={{ width: `${(linkStats.missingDrawing / linkStats.total) * 100}%` }} />
                  </>
                )}
              </div>
              <div className="flex items-center gap-4 mt-2.5 text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> {linkStats.linked} Linked</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400" /> {linkStats.missingMaster} Missing Master</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400" /> {linkStats.missingDrawing} Missing Drawing</span>
              </div>
            </div>

            {/* Filter Chips */}
            <div className="px-6 py-3 border-b border-slate-100 dark:border-white/5 flex items-center gap-2 flex-wrap">
              {[
                { key: 'all' as const, label: 'All', count: linkStats.total },
                { key: 'complete' as const, label: 'Linked', count: linkStats.linked },
                { key: 'missing_master' as const, label: 'Missing Master', count: linkStats.missingMaster },
                { key: 'missing_drawing' as const, label: 'Missing Drawing', count: linkStats.missingDrawing },
              ].map(chip => (
                <button
                  key={chip.key}
                  onClick={() => setStatusFilter(chip.key)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${statusFilter === chip.key
                      ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 dark:bg-white/5 dark:text-slate-400 dark:border-white/10 dark:hover:border-white/20'
                    }`}
                >
                  {chip.label}
                  <span className={`tabular-nums ${statusFilter === chip.key
                      ? 'text-white/70 dark:text-slate-900/60'
                      : 'text-slate-400 dark:text-slate-500'
                    }`}>{chip.count}</span>
                </button>
              ))}
            </div>

            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-black/20 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-4">Identifiers</th>
                  <th className="px-6 py-4">Part Name</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Linked Documents</th>
                  <th className="px-6 py-4">Link Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {loading ? (
                  <TableSkeleton cols={6} rows={8} />
                ) : filteredLinks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Link className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                        <p className="text-slate-500 dark:text-slate-400 font-medium">
                          {statusFilter !== 'all' ? 'No items match this filter.' : 'No linked items found.'}
                        </p>
                        {statusFilter !== 'all' && (
                          <button
                            onClick={() => setStatusFilter('all')}
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            Clear filter
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                filteredLinks.map((item) => (
                  <tr key={item.key} className={`hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors ${item.status === 'missing_master' ? 'bg-amber-50/30 dark:bg-amber-500/[0.03]' :
                      item.status === 'missing_drawing' ? 'bg-red-50/30 dark:bg-red-500/[0.03]' :
                      item.status === 'incomplete_code' ? 'bg-purple-50/30 dark:bg-purple-500/[0.03]' : ''
                    }`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        {item.item_code && (
                          <div className="flex items-center gap-2" title="Customer Product Code">
                            <span className="text-[10px] font-semibold text-blue-500/70 dark:text-blue-400/70 uppercase w-6 shrink-0">CUS</span>
                            <span className="font-medium tabular-nums tracking-tight text-[13px] text-slate-800 dark:text-slate-200">{item.item_code}</span>
                          </div>
                        )}
                        {item.master?.item_number && (
                          <div className="flex items-center gap-2" title="Internal Factory Code">
                            <span className="text-[10px] font-semibold text-emerald-500/70 dark:text-emerald-400/70 uppercase w-6 shrink-0">INT</span>
                            <span className="font-medium tabular-nums tracking-tight text-[13px] text-slate-500 dark:text-slate-400">{item.master.item_number}</span>
                          </div>
                        )}
                        {!item.item_code && !item.master?.item_number && (
                          <span className="text-slate-400 italic text-xs">No Identifiers</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white max-w-[200px] truncate" title={item.part_name}>{item.part_name}</td>
                    <td className="px-6 py-4">{item.customer_name}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-[150px] flex justify-end">
                          {item.drawing ? (
                            <div className="inline-flex items-center gap-1.5 bg-slate-50 dark:bg-white/5 px-2 py-1 rounded-md border border-slate-100 dark:border-white/10 max-w-full">
                              <FileText className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                              <span className="font-medium text-slate-800 dark:text-slate-200 truncate">{item.drawing.drawing_number}</span>
                              <span className="text-[10px] text-slate-500 shrink-0">Rev.{item.drawing.revision}</span>
                            </div>
                          ) : (
                            <div className="inline-flex items-center justify-center w-[40px] h-[28px] rounded-md border border-dashed border-slate-200 dark:border-white/10">
                              <span className="text-slate-300 dark:text-slate-600 font-medium">-</span>
                            </div>
                          )}
                        </div>

                        <span className="text-slate-300 dark:text-slate-600 text-xs font-bold shrink-0">➔</span>

                        <div className="w-[150px] flex justify-start">
                          {item.master ? (
                            <div className="inline-flex items-center gap-1.5 bg-slate-50 dark:bg-white/5 px-2 py-1 rounded-md border border-slate-100 dark:border-white/10 max-w-full">
                              <Layers className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                              <span className="font-medium text-slate-800 dark:text-slate-200 truncate">{item.master.drawing_number}</span>
                              <span className="text-[10px] text-slate-500 shrink-0">Rev.{item.master.revision}</span>
                            </div>
                          ) : (
                            <div className="inline-flex items-center justify-center w-[40px] h-[28px] rounded-md border border-dashed border-slate-200 dark:border-white/10">
                              <span className="text-slate-300 dark:text-slate-600 font-medium">-</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.status === 'complete' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-500/20">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Fully Linked
                        </span>
                      )}
                      {item.status === 'missing_master' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200/60 dark:border-amber-500/20">
                          <AlertTriangle className="w-3.5 h-3.5" /> Missing Master
                        </span>
                      )}
                      {item.status === 'missing_drawing' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400 border border-red-200/60 dark:border-red-500/20">
                          <AlertCircle className="w-3.5 h-3.5" /> Missing Drawing
                        </span>
                      )}
                      {item.status === 'incomplete_code' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400 border border-purple-200/60 dark:border-purple-500/20">
                          <AlertCircle className="w-3.5 h-3.5" /> Missing Item Code
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                        <Popover.Root>
                          <Popover.Trigger asChild>
                            <button className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </Popover.Trigger>
                          <Popover.Portal>
                            <Popover.Content className="z-50 min-w-[160px] bg-white dark:bg-[#2c2c2e] border border-slate-200 dark:border-white/10 rounded-xl p-1.5 shadow-xl animate-in fade-in-50 zoom-in-95">
                              <div className="flex flex-col gap-0.5">
                                {item.drawing && (
                                  <>
                                    <button onClick={() => handleDocumentSelect(item.drawing!, 'edit')} className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 rounded-md transition-colors">
                                      <Pencil className="w-3.5 h-3.5 text-amber-500" /> Edit Drawing
                                    </button>
                                    <button onClick={() => handlePreview(item.drawing!)} className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 rounded-md transition-colors">
                                      <Eye className="w-3.5 h-3.5 text-indigo-500" /> Preview Drawing
                                    </button>
                                    <button onClick={() => handleDownload(item.drawing!)} className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 rounded-md transition-colors">
                                      <Download className="w-3.5 h-3.5 text-blue-500" /> Download Drawing
                                    </button>
                                  </>
                                )}
                                {item.drawing && item.master && <div className="h-px bg-slate-100 dark:bg-white/5 my-1" />}
                                {item.master && (
                                  <>
                                    <button onClick={() => handleDocumentSelect(item.master!, 'edit')} className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 rounded-md transition-colors">
                                      <Pencil className="w-3.5 h-3.5 text-amber-500" /> Edit Master
                                    </button>
                                    <button onClick={() => handlePreview(item.master!)} className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 rounded-md transition-colors">
                                      <Eye className="w-3.5 h-3.5 text-emerald-500" /> Preview Master
                                    </button>
                                    <button onClick={() => handleDownload(item.master!)} className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 rounded-md transition-colors">
                                      <Download className="w-3.5 h-3.5 text-blue-500" /> Download Master
                                    </button>
                                  </>
                                )}
                              </div>
                            </Popover.Content>
                          </Popover.Portal>
                        </Popover.Root>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </>
        )}
      </div>


      {/* Pagination Controls */}
      {activeTab !== 'link' && totalDocs > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-slate-200 dark:border-white/10 bg-white dark:bg-[#1c1c1e] shrink-0">
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <span>Show</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="px-2 py-1 bg-slate-50 dark:bg-[#2c2c2e] border border-slate-200 dark:border-white/10 rounded-md outline-none text-slate-700 dark:text-slate-300 font-medium"
            >
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>entries</span>
            <span className="text-slate-300 dark:text-slate-700 mx-1">|</span>
            <span className="font-medium text-slate-700 dark:text-slate-300">
              Showing {Math.min((page - 1) * pageSize + 1, totalDocs)}–{Math.min(page * pageSize, totalDocs)} of {totalDocs}
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Prev</span>
            </button>

            {getPageNumbers(page, Math.ceil(totalDocs / pageSize)).map((p, idx) => (
              p === 'ellipsis' ? (
                <span key={`ellipsis-${idx}`} className="px-2 py-1 text-slate-400 dark:text-slate-600 text-xs">...</span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`min-w-[32px] h-8 px-2.5 rounded-lg text-xs font-semibold transition-all ${
                    page === p
                      ? 'bg-blue-600 text-white dark:bg-blue-500 shadow-sm'
                      : 'border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'
                  }`}
                >
                  {p}
                </button>
              )
            ))}

            <button
              onClick={() => setPage(page + 1)}
              disabled={page * pageSize >= totalDocs}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
        </div>

        {/* Resizable Divider Handle (Only visible when panel is open on desktop) */}
        {selectedInspectionDoc && (
          <div 
            className="hidden xl:flex w-1 hover:w-1.5 cursor-col-resize bg-transparent hover:bg-blue-500/50 active:bg-blue-500 z-40 transition-all items-center justify-center -ml-0.5 -mr-0.5"
            onMouseDown={(e) => { e.preventDefault(); setIsDraggingSplitter(true); }}
          >
            <div className="h-8 w-1 rounded-full bg-slate-300 dark:bg-slate-600" />
          </div>
        )}

        {/* Right Side Inspection Panel (Master-Detail Split Workspace) */}
        {selectedInspectionDoc && (
          <div 
            className={`h-[750px] xl:h-[calc(100vh-160px)] sticky top-0 shrink-0 animate-in slide-in-from-right-4 duration-300 z-30 flex flex-col min-w-0 ${!isDraggingSplitter ? 'ease-in-out transition-all' : ''}`}
            style={{ width: `${100 - splitRatio}%` }}
          >
            <DocumentInspectionPanel
              document={selectedInspectionDoc}
              allDocuments={documents}
              initialMode={inspectionMode}
              onClose={() => handleDocumentSelect(null)}
              onSaveDocument={handleSaveInspectionDocument}
              onSelectDocument={(d) => handleDocumentSelect(d as DocumentRecord, 'view')}
              onDirtyChange={setIsInspectionDirty}
              onCancelEdit={() => {
                if (isInspectionDirty) {
                  setPendingAction({ type: 'cancelEdit' });
                  setShowUnsavedDialog(true);
                } else {
                  setInspectionMode('view');
                }
              }}
              onModeChange={setInspectionMode}
            />
          </div>
        )}
      </div>

      <ViewMasterModal
        isOpen={!!selectedMasterDoc}
        onClose={() => setSelectedMasterDoc(null)}
        masterDoc={selectedMasterDoc}
        onSuccess={(updatedDoc) => {
          fetchDocuments();
          if (updatedDoc) {
            setSelectedMasterDoc(updatedDoc as unknown as DocumentRecord);
          }
        }}
      />

      <EditDocumentModal
        isOpen={!!editingDoc}
        onClose={() => setEditingDoc(null)}
        document={editingDoc}
        onSuccess={() => {
          fetchDocuments();
        }}
      />

      {/* Unsaved Changes Dialog */}
      {showUnsavedDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1c1c1e] w-[90%] max-w-[400px] rounded-2xl shadow-xl border border-slate-200 dark:border-white/10 p-6 animate-in zoom-in-95 fade-in duration-200">
            <div className="flex items-center gap-3 text-amber-600 dark:text-amber-500 mb-4">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-bold">Unsaved Changes</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
              You have unsaved changes in the inspection panel. If you leave now, your changes will be lost.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowUnsavedDialog(false);
                  setPendingAction(null);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setIsInspectionDirty(false); // Reset dirty flag
                  setShowUnsavedDialog(false);
                  if (pendingAction?.type === 'tab' && pendingAction.tab) {
                    setLoading(true);
                    if (pendingAction.tab === 'link') setLinkCount(null);
                    setPage(1);
                    setActiveTab(pendingAction.tab);
                    setSelectedInspectionDoc(null);
                  } else if (pendingAction?.type === 'switch' || pendingAction?.type === 'close') {
                    setSelectedInspectionDoc(pendingAction.doc || null);
                    setInspectionMode(pendingAction.mode || 'view');
                  } else if (pendingAction?.type === 'cancelEdit') {
                    setInspectionMode('view');
                  }
                  setPendingAction(null);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
              >
                Discard Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
