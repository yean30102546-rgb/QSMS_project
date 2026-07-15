import React, { useEffect, useMemo, useState } from 'react';
import { Download, FileText, Tag, Clock, Eye, Layers, Link, CheckCircle2, AlertTriangle, AlertCircle, Pencil, MoreHorizontal, SlidersHorizontal, RotateCcw } from 'lucide-react';
import * as Popover from '@radix-ui/react-popover';
import { motion, AnimatePresence } from 'motion/react';
import { useNotification } from '../../../contexts/NotificationContext';
import { ViewMasterModal } from './ViewMasterModal';
import { EditDocumentModal, EditableDocument } from './EditDocumentModal';
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
  status: 'complete' | 'missing_master' | 'missing_drawing';
}

function normalizePackageSize(raw: string | null | undefined): string {
  if (!raw) return '';
  let clean = raw.trim().toUpperCase().replace(/\s+/g, ' ');

  // 1. Check Pail / Drum (200L to 999L) e.g., "200L", "200 L", "200 L."
  const pailMatch = clean.match(/^(\d+)\s*L(?:\.|\s|$)/);
  if (pailMatch) {
    const vol = parseInt(pailMatch[1]);
    if (vol >= 200 && vol <= 999) {
      return `${vol} L.`;
    }
  }

  // 2. Check IBC (>= 1000L) e.g., "1000L", "1000 L", "1000 L."
  if (pailMatch) {
    const vol = parseInt(pailMatch[1]);
    if (vol >= 1000) {
      return `${vol} L.`;
    }
  }

  // 3. Check Small Pack with Gift e.g., "4 x 6 + 1 L.", "4L x 6 + 1L", "4*6+1 L"
  const giftMatch = clean.replace(/[*X]/g, 'x').match(/^(\d+(?:\.\d+)?)\s*L?\s*x\s*(\d+)\s*\+\s*(\d+(?:\.\d+)?)\s*L?(\.|\s|$)/i);
  if (giftMatch) {
    return `${giftMatch[1]} x ${giftMatch[2]} + ${giftMatch[3]} L.`;
  }

  // 4. Check Small Pack normal e.g., "1L x 24", "1 x 24 L.", "1*24 L", "1Lx24"
  const smallMatch = clean.replace(/[*X]/g, 'x').match(/^(\d+(?:\.\d+)?)\s*L?\s*x\s*(\d+)\s*L?(\.|\s|$)/i);
  if (smallMatch) {
    return `${smallMatch[1]} x ${smallMatch[2]} L.`;
  }

  // 5. Fallback for single volumes without quantity (e.g. "1L", "4L", "18L", "20L")
  const singleMatch = clean.match(/^(\d+(?:\.\d+)?)\s*L(?:\.|\s|$)/);
  if (singleMatch) {
    const vol = parseFloat(singleMatch[1]);
    if (vol < 200) {
      return `${singleMatch[1]} x 1 L.`;
    } else {
      return `${singleMatch[1]} L.`;
    }
  }

  return raw.trim();
}

function getPackageSizeGroup(size: string): 'Small' | 'Pail' | 'IBC' | 'Other' | null {
  if (!size) return null;
  const num = parseFloat(size);
  if (isNaN(num)) return 'Other';
  if (num < 20) return 'Small';
  if (num < 1000) return 'Pail';
  return 'IBC';
}

export function DocumentList({ searchQuery, refreshKey }: { searchQuery: string, refreshKey: number }) {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'drawing' | 'master' | 'link'>('drawing');
  const [selectedMasterDoc, setSelectedMasterDoc] = useState<DocumentRecord | null>(null);
  const [editingDoc, setEditingDoc] = useState<EditableDocument | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'complete' | 'missing_master' | 'missing_drawing'>('all');
  const { showToast } = useNotification();

  const [showFilters, setShowFilters] = useState(false);
  const [packageSizeFilter, setPackageSizeFilter] = useState('all');
  const [oilGroupFilter, setOilGroupFilter] = useState('all');
  const [customerFilter, setCustomerFilter] = useState('all');
  const [palletTypeFilter, setPalletTypeFilter] = useState('all');

  const filterOptions = useMemo(() => {
    const sizes = new Set<string>();
    const groups = new Set<string>();
    const customers = new Set<string>();
    const pallets = new Set<string>();

    documents.forEach(doc => {
      if (doc.package_size) {
        const norm = normalizePackageSize(doc.package_size);
        if (norm) sizes.add(norm);
      }
      if (doc.oil_group) groups.add(doc.oil_group.trim());
      if (doc.customer_name) customers.add(doc.customer_name.trim());
      if (doc.pallet_type) pallets.add(doc.pallet_type.trim());
    });

    const small: string[] = [];
    const pail: string[] = [];
    const ibc: string[] = [];
    const other: string[] = [];

    Array.from(sizes).forEach(size => {
      const group = getPackageSizeGroup(size);
      if (group === 'Small') small.push(size);
      else if (group === 'Pail') pail.push(size);
      else if (group === 'IBC') ibc.push(size);
      else other.push(size);
    });

    const sortFn = (a: string, b: string) => (parseFloat(a) || 0) - (parseFloat(b) || 0);
    small.sort(sortFn);
    pail.sort(sortFn);
    ibc.sort(sortFn);
    other.sort();

    return {
      packageSizes: { small, pail, ibc, other },
      oilGroups: Array.from(groups).sort(),
      customers: Array.from(customers).sort(),
      palletTypes: Array.from(pallets).sort(),
    };
  }, [documents]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (packageSizeFilter !== 'all') count++;
    if (oilGroupFilter !== 'all') count++;
    if (customerFilter !== 'all') count++;
    if (palletTypeFilter !== 'all') count++;
    if (activeTab === 'link' && statusFilter !== 'all') count++;
    return count;
  }, [packageSizeFilter, oilGroupFilter, customerFilter, palletTypeFilter, statusFilter, activeTab]);

  const resetFilters = () => {
    setPackageSizeFilter('all');
    setOilGroupFilter('all');
    setCustomerFilter('all');
    setPalletTypeFilter('all');
    setStatusFilter('all');
  };

  useEffect(() => {
    fetchDocuments();
  }, [refreshKey]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/drawings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'list_drawings' }),
      });
      const data = await res.json();
      if (data.success) {
        setDocuments(data.data);
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

  // 1. Filter Drawings
  const filteredDrawings = documents
    .filter(doc => doc.type === 'drawing')
    .filter(doc => {
      const matchesSearch =
        doc.drawing_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.part_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (doc.item_code && doc.item_code.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesPackageSize = (() => {
        if (packageSizeFilter === 'all') return true;
        const normSize = normalizePackageSize(doc.package_size);
        if (packageSizeFilter.startsWith('GROUP:')) {
          const groupName = packageSizeFilter.split(':')[1];
          return getPackageSizeGroup(normSize) === groupName;
        }
        return normSize === packageSizeFilter;
      })();
      const matchesCustomer = customerFilter === 'all' || doc.customer_name === customerFilter;
      const matchesOilGroup = oilGroupFilter === 'all' || doc.oil_group === oilGroupFilter;
      const matchesPalletType = palletTypeFilter === 'all' || doc.pallet_type === palletTypeFilter;

      return matchesSearch && matchesPackageSize && matchesCustomer && matchesOilGroup && matchesPalletType;
    })
    .sort((a, b) => {
      const codeA = a.item_code || a.drawing_number;
      const codeB = b.item_code || b.drawing_number;
      return codeA.localeCompare(codeB);
    });

  // 2. Filter Masters
  const filteredMasters = documents
    .filter(doc => doc.type === 'master')
    .filter(doc => {
      const matchesSearch =
        doc.drawing_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.part_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (doc.oil_group && doc.oil_group.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (doc.item_code && doc.item_code.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesPackageSize = (() => {
        if (packageSizeFilter === 'all') return true;
        const normSize = normalizePackageSize(doc.package_size);
        if (packageSizeFilter.startsWith('GROUP:')) {
          const groupName = packageSizeFilter.split(':')[1];
          return getPackageSizeGroup(normSize) === groupName;
        }
        return normSize === packageSizeFilter;
      })();
      const matchesCustomer = customerFilter === 'all' || doc.customer_name === customerFilter;
      const matchesOilGroup = oilGroupFilter === 'all' || doc.oil_group === oilGroupFilter;
      const matchesPalletType = palletTypeFilter === 'all' || doc.pallet_type === palletTypeFilter;

      return matchesSearch && matchesPackageSize && matchesCustomer && matchesOilGroup && matchesPalletType;
    });

  // 3. Compute Link Overview map
  const linkMapItems: LinkMapItem[] = [];
  const linkKeys = Array.from(new Set(
    documents
      .map(d => d.item_code || d.item_number)
      .filter((code): code is string => !!code)
  ));

  for (const key of linkKeys) {
    const drawing = documents.find(d => d.type === 'drawing' && d.item_code === key) || null;
    const master = documents.find(d => d.type === 'master' && (d.item_code === key || (!d.item_code && d.item_number === key))) || null;

    if (!drawing && !master) continue;

    const itemCode = master?.item_code || drawing?.item_code || (drawing ? key : null);
    const itemNumber = master?.item_number || drawing?.item_number || (!drawing && !master?.item_code ? key : null);

    const partName = drawing?.part_name || master?.part_name || '';
    const customerName = drawing?.customer_name || master?.customer_name || 'ENEOS';

    let status: 'complete' | 'missing_master' | 'missing_drawing' = 'complete';
    if (drawing && !master) status = 'missing_master';
    else if (!drawing && master) status = 'missing_drawing';

    linkMapItems.push({
      key,
      item_code: itemCode,
      item_number: itemNumber,
      part_name: partName,
      customer_name: customerName,
      drawing,
      master,
      status
    });
  }

  // Filter Link Map Items
  const filteredLinks = linkMapItems
    .filter(item => statusFilter === 'all' || item.status === statusFilter)
    .filter(item => {
      const matchesSearch =
        (item.item_code && item.item_code.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.item_number && item.item_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
        item.part_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.drawing?.drawing_number && item.drawing.drawing_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.master?.drawing_number && item.master.drawing_number.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesPackageSize = (() => {
        if (packageSizeFilter === 'all') return true;
        const normMaster = normalizePackageSize(item.master?.package_size);
        const normDrawing = normalizePackageSize(item.drawing?.package_size);
        if (packageSizeFilter.startsWith('GROUP:')) {
          const groupName = packageSizeFilter.split(':')[1];
          return getPackageSizeGroup(normMaster) === groupName || getPackageSizeGroup(normDrawing) === groupName;
        }
        return normMaster === packageSizeFilter || normDrawing === packageSizeFilter;
      })();
      const matchesCustomer = customerFilter === 'all' ||
        item.customer_name === customerFilter;
      const matchesOilGroup = oilGroupFilter === 'all' ||
        item.master?.oil_group === oilGroupFilter ||
        item.drawing?.oil_group === oilGroupFilter;
      const matchesPalletType = palletTypeFilter === 'all' ||
        item.master?.pallet_type === palletTypeFilter ||
        item.drawing?.pallet_type === palletTypeFilter;

      return matchesSearch && matchesPackageSize && matchesCustomer && matchesOilGroup && matchesPalletType;
    });

  // Link Summary Stats
  const linkStats = useMemo(() => {
    const linked = linkMapItems.filter(i => i.status === 'complete').length;
    const missingMaster = linkMapItems.filter(i => i.status === 'missing_master').length;
    const missingDrawing = linkMapItems.filter(i => i.status === 'missing_drawing').length;
    const total = linkMapItems.length;
    return { linked, missingMaster, missingDrawing, total };
  }, [linkMapItems]);

  if (loading) {
    return <div className="flex justify-center py-20 text-slate-500">Loading documents...</div>;
  }

  return (
    <div className="w-full bg-white dark:bg-[#1c1c1e] rounded-xl shadow-sm border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col">
      {/* Tab Selectors & Filter Trigger */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-200 dark:border-white/10 px-6 bg-slate-50/50 dark:bg-white/5 shrink-0">
        <div className="flex flex-wrap -mb-px">
          <button
            onClick={() => setActiveTab('drawing')}
            className={`flex items-center gap-2 py-4 px-4 text-sm font-semibold border-b-2 transition-all -mb-px whitespace-nowrap ${activeTab === 'drawing'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400'
              }`}
          >
            <FileText className="w-4 h-4" />
            Customer Drawings ({documents.filter(d => d.type === 'drawing').length})
          </button>
          <button
            onClick={() => setActiveTab('master')}
            className={`flex items-center gap-2 py-4 px-4 text-sm font-semibold border-b-2 transition-all -mb-px whitespace-nowrap ${activeTab === 'master'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400'
              }`}
          >
            <Layers className="w-4 h-4" />
            Master Specifications ({documents.filter(d => d.type === 'master').length})
          </button>
          <button
            onClick={() => setActiveTab('link')}
            className={`flex items-center gap-2 py-4 px-4 text-sm font-semibold border-b-2 transition-all -mb-px whitespace-nowrap ${activeTab === 'link'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400'
              }`}
          >
            <Link className="w-4 h-4" />
            Link Overview ({linkMapItems.length})
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
                <select
                  value={customerFilter}
                  onChange={(e) => setCustomerFilter(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white dark:bg-[#2c2c2e] border border-slate-200 dark:border-white/10 rounded-lg text-xs outline-none text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">All Customers</option>
                  {filterOptions.customers.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
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
                <select
                  value={oilGroupFilter}
                  onChange={(e) => setOilGroupFilter(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white dark:bg-[#2c2c2e] border border-slate-200 dark:border-white/10 rounded-lg text-xs outline-none text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">All Groups</option>
                  {filterOptions.oilGroups.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              {/* Pallet Type / Link Status Filter */}
              {activeTab === 'link' ? (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Link Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="w-full px-3 py-1.5 bg-white dark:bg-[#2c2c2e] border border-slate-200 dark:border-white/10 rounded-lg text-xs outline-none text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="all">All Statuses</option>
                    <option value="complete">Link Complete</option>
                    <option value="missing_master">Missing Master</option>
                    <option value="missing_drawing">Missing Drawing</option>
                  </select>
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Pallet Type</label>
                  <select
                    value={palletTypeFilter}
                    onChange={(e) => setPalletTypeFilter(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white dark:bg-[#2c2c2e] border border-slate-200 dark:border-white/10 rounded-lg text-xs outline-none text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="all">All Pallets</option>
                    {filterOptions.palletTypes.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
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
          {customerFilter !== 'all' && (
            <span className="flex items-center gap-1 bg-white dark:bg-[#2c2c2e] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 px-2 py-0.5 rounded-full text-xs shadow-sm">
              <span>Customer: {customerFilter}</span>
              <button onClick={() => setCustomerFilter('all')} className="text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold ml-0.5">×</button>
            </span>
          )}
          {packageSizeFilter !== 'all' && (
            <span className="flex items-center gap-1 bg-white dark:bg-[#2c2c2e] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 px-2 py-0.5 rounded-full text-xs shadow-sm">
              <span>Size: {packageSizeFilter.startsWith('GROUP:') ? `All ${packageSizeFilter.split(':')[1]}` : packageSizeFilter}</span>
              <button onClick={() => setPackageSizeFilter('all')} className="text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold ml-0.5">×</button>
            </span>
          )}
          {oilGroupFilter !== 'all' && (
            <span className="flex items-center gap-1 bg-white dark:bg-[#2c2c2e] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 px-2 py-0.5 rounded-full text-xs shadow-sm">
              <span>Oil Group: {oilGroupFilter}</span>
              <button onClick={() => setOilGroupFilter('all')} className="text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold ml-0.5">×</button>
            </span>
          )}
          {palletTypeFilter !== 'all' && activeTab !== 'link' && (
            <span className="flex items-center gap-1 bg-white dark:bg-[#2c2c2e] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 px-2 py-0.5 rounded-full text-xs shadow-sm">
              <span>Pallet: {palletTypeFilter}</span>
              <button onClick={() => setPalletTypeFilter('all')} className="text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold ml-0.5">×</button>
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

      <div className="overflow-x-auto">
        {/* Drawings Tab UI */}
        {activeTab === 'drawing' && (
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-black/20 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4">Drawing No.</th>
                <th className="px-6 py-4">Part Name</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Item Code</th>
                <th className="px-6 py-4">Issue Date</th>
                <th className="px-6 py-4">Package Size</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {filteredDrawings.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                          {doc.drawing_number}
                          <span className="inline-flex items-center rounded-md bg-slate-100 dark:bg-white/10 px-2 py-0.5 text-xs font-medium text-slate-600 dark:text-slate-300">
                            Rev.{doc.revision}
                          </span>
                        </div>
                        <div className="text-xs mt-1 truncate max-w-[200px] text-slate-400">{doc.file_name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{doc.part_name}</td>
                  <td className="px-6 py-4">{doc.customer_name}</td>
                  <td className="px-6 py-4">
                    {doc.item_code ? (
                      <span className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium">
                        <Tag className="h-3 w-3" />
                        {doc.item_code}
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {doc.issue_date ? new Date(doc.issue_date).toLocaleDateString('th-TH') : <span className="text-slate-400">-</span>}
                  </td>
                  <td className="px-6 py-4">{doc.package_size || <span className="text-slate-400">-</span>}</td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => setEditingDoc(doc)}
                        className="p-2 text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/30 rounded-lg transition-colors inline-flex"
                        title="Edit Details"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setSelectedMasterDoc(doc)}
                        className="p-2 text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/30 rounded-lg transition-colors inline-flex"
                        title="View Details"
                      >
                        <FileText className="w-4 h-4" />
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
              ))}
              {filteredDrawings.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    No drawings found.
                  </td>
                </tr>
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
                <th className="px-6 py-4">Oil Group</th>
                <th className="px-6 py-4">Packaging</th>
                <th className="px-6 py-4">Shelf Life</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {filteredMasters.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        <Layers className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                          {doc.drawing_number}
                          <span className="inline-flex items-center rounded-md bg-slate-100 dark:bg-white/10 px-2 py-0.5 text-xs font-medium text-slate-600 dark:text-slate-300">
                            Rev.{doc.revision}
                          </span>
                        </div>
                        <div className="text-xs mt-1 truncate max-w-[200px] text-slate-400">{doc.file_name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-white max-w-[250px]">{doc.part_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      {doc.item_code && (
                        <div className="flex items-center gap-2" title="Customer Product Code">
                          <span className="text-[10px] font-semibold text-blue-500/70 dark:text-blue-400/70 uppercase w-6 shrink-0">CUS</span>
                          <span className="font-medium tabular-nums tracking-tight text-[13px] text-slate-800 dark:text-slate-200">{doc.item_code}</span>
                        </div>
                      )}
                      {doc.item_number && (
                        <div className="flex items-center gap-2" title="Internal Factory Code">
                          <span className="text-[10px] font-semibold text-emerald-500/70 dark:text-emerald-400/70 uppercase w-6 shrink-0">INT</span>
                          <span className="font-medium tabular-nums tracking-tight text-[13px] text-slate-500 dark:text-slate-400">{doc.item_number}</span>
                        </div>
                      )}
                      {!doc.item_code && !doc.item_number && (
                        <span className="text-slate-400 italic text-xs">No Identifiers</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">{doc.oil_group || <span className="text-slate-400">-</span>}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-slate-700 dark:text-slate-300 font-medium">{doc.pallet_type || '-'}</span>
                      {doc.boxes_per_pallet && <span className="text-[11px] text-slate-500">{doc.boxes_per_pallet} boxes/pallet</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4">{doc.shelf_life || <span className="text-slate-400">-</span>}</td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => setEditingDoc(doc)}
                        className="p-2 text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/30 rounded-lg transition-colors inline-flex"
                        title="Edit Master Details"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedMasterDoc(doc);
                        }}
                        className="p-2 text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/30 rounded-lg transition-colors inline-flex"
                        title="View Details"
                      >
                        <FileText className="w-4 h-4" />
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
              ))}
              {filteredMasters.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    No masters found.
                  </td>
                </tr>
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
                {filteredLinks.map((item) => (
                  <tr key={item.key} className={`hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors ${item.status === 'missing_master' ? 'bg-amber-50/30 dark:bg-amber-500/[0.03]' :
                      item.status === 'missing_drawing' ? 'bg-red-50/30 dark:bg-red-500/[0.03]' : ''
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
                    <td className="px-6 py-4">
                      {item.status === 'complete' && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-500/10 dark:to-emerald-500/10 border border-green-200/50 dark:border-green-500/20 px-2.5 py-1 text-xs font-semibold text-green-700 dark:text-green-400 shadow-sm">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Linked
                        </span>
                      )}
                      {item.status === 'missing_master' && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-500/10 dark:to-amber-500/10 border border-yellow-200/50 dark:border-yellow-500/20 px-2.5 py-1 text-xs font-semibold text-yellow-700 dark:text-yellow-400 shadow-sm">
                          <AlertTriangle className="h-3.5 w-3.5 text-yellow-600 dark:text-yellow-400" /> Missing Master
                        </span>
                      )}
                      {item.status === 'missing_drawing' && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-500/10 dark:to-rose-500/10 border border-red-200/50 dark:border-red-500/20 px-2.5 py-1 text-xs font-semibold text-red-700 dark:text-red-400 shadow-sm">
                          <AlertCircle className="h-3.5 w-3.5 text-red-600 dark:text-red-400" /> Missing Drawing
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex justify-end gap-1">
                        <Popover.Root>
                          <Popover.Trigger asChild>
                            <button className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-md hover:bg-slate-100 dark:hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400/20" title="Actions">
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </Popover.Trigger>
                          <Popover.Portal>
                            <Popover.Content align="end" sideOffset={4} className="z-[100] min-w-[180px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                              <div className="flex flex-col p-1">
                                {item.drawing && (
                                  <>
                                    <button onClick={() => setEditingDoc(item.drawing!)} className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 rounded-md transition-colors">
                                      <Pencil className="w-3.5 h-3.5 text-amber-500" /> Edit Drawing
                                    </button>
                                    <button onClick={() => setSelectedMasterDoc(item.drawing!)} className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 rounded-md transition-colors">
                                      <FileText className="w-3.5 h-3.5 text-indigo-500" /> Details (Drawing)
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
                                    <button onClick={() => setEditingDoc(item.master!)} className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 rounded-md transition-colors">
                                      <Pencil className="w-3.5 h-3.5 text-amber-500" /> Edit Master
                                    </button>
                                    <button onClick={() => setSelectedMasterDoc(item.master!)} className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 rounded-md transition-colors">
                                      <FileText className="w-3.5 h-3.5 text-emerald-500" /> Details (Master)
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
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredLinks.length === 0 && (
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
                )}
              </tbody>
            </table>
          </>
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
    </div>
  );
}
