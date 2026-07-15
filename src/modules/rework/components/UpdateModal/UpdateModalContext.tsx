'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ReworkCase, MaterialUsage, CUSTOMER_OPTIONS } from '@/src/services/api';
import { useNotification } from '@/src/contexts/NotificationContext';
import { useSaveProgress } from '@/src/hooks/useSaveProgress';
import { useExportReport } from '@/src/hooks/useExportReport';
import { getCurrentUserRole } from '@/src/services/auth';
import { UserRole } from '@/src/config/auth.config';

interface UpdateModalContextValue {
  caseData: ReworkCase | null;
  isLoading: boolean;
  isOpen: boolean;
  inline: boolean;
  onClose: () => void;
  caseStatus: ReworkCase['status'];
  setCaseStatus: (status: ReworkCase['status']) => void;
  resolutionMethod: string;
  setResolutionMethod: (method: string) => void;
  reworkCost: number | string;
  setReworkCost: (cost: number | string) => void;
  lightboxUrl: string | null;
  setLightboxUrl: (url: string | null) => void;
  isEditMode: boolean;
  setIsEditMode: (mode: boolean) => void;
  editedSource: string;
  setEditedSource: (source: string) => void;
  editedItems: ReworkCase['items'];
  setEditedItems: (items: ReworkCase['items']) => void;
  deletedItemIds: string[];
  setDeletedItemIds: (ids: string[] | ((prev: string[]) => string[])) => void;
  expandedItemId: string | null;
  setExpandedItemId: (id: string | null) => void;
  isDeleteConfirmOpen: boolean;
  setIsDeleteConfirmOpen: (isOpen: boolean) => void;
  isActionLoading: boolean;
  newOrFiles: File[];
  setNewOrFiles: (files: File[]) => void;
  newImages: Record<string, File[]>;
  setNewImages: (images: Record<string, File[]> | ((prev: Record<string, File[]>) => Record<string, File[]>)) => void;
  materials: MaterialUsage[];
  setMaterials: (materials: MaterialUsage[] | ((prev: MaterialUsage[]) => MaterialUsage[])) => void;
  editExitIntent: boolean;
  editedCaseNumber: string;
  setEditedCaseNumber: (num: string) => void;
  SOURCE_OPTIONS: string[];
  caseNamePrefix: string;
  caseNameYear: string;
  previewCaseName: string;
  getCaseNumber: (name?: string, id?: string) => string;
  handleToggleEditMode: () => void;
  handleSaveEdit: () => void;
  handleRequestClose: () => void;
  handleDownloadImages: (urls: string[], name: string) => Promise<void>;
  laborCount: number | string;
  setLaborCount: (count: number | string) => void;
  laborHours: number | string;
  setLaborHours: (hours: number | string) => void;
  laborRate: number | string;
  setLaborRate: (rate: number | string) => void;
  userRole: UserRole;
  isAdmin: boolean;
  isFinance: boolean;
  isOperator: boolean;
  isPDB: boolean;
  canManageRows: boolean;
  canEditMaterialNameQty: boolean;
  canEditUnitPrice: boolean;
  canViewFinancialData: boolean;
  exportRef: React.RefObject<any>;
  isExporting: boolean;
  exportProgress: string;
  exportPNG: (id: string) => void;
  exportPDF: (data: any) => void;
  exportExcel: (data: any) => void;
  handleAddMaterial: () => void;
  handleMaterialChange: (id: string, field: keyof MaterialUsage, value: string | number) => void;
  handleRemoveMaterial: (id: string) => void;
  handleUpdate: () => Promise<void>;
  handleDelete: () => void;
  confirmDelete: () => Promise<void>;
  handleRemoveItem: (index: number) => void;
  getStatusLabel: (status: ReworkCase['status']) => string;
  isSaving: boolean;
  progress: number;
  statusText: string;
  isComplete: boolean;
}

const UpdateModalContext = createContext<UpdateModalContextValue | undefined>(undefined);

export const STANDARD_MATERIALS = ['บรรจุภัณฑ์', 'แกลลอน', 'ฝา', 'สติ๊กเกอร์', 'ชริ้งค์ ลาเบล', 'ของแถม'];

export function UpdateModalProvider({
  children,
  isOpen,
  caseData,
  isLoading,
  onClose,
  onUpdate,
  onDelete,
  inline = false,
  userRoleOverride,
}: {
  children: ReactNode;
  isOpen: boolean;
  caseData: ReworkCase | null;
  isLoading: boolean;
  onClose: () => void;
  onUpdate: (caseId: string, updates: Partial<ReworkCase>) => Promise<void>;
  onDelete?: (caseId: string) => Promise<void>;
  inline?: boolean;
  userRoleOverride?: UserRole;
}) {
  const { showToast, showAlert, showConfirm } = useNotification();
  const { progress, isSaving, statusText, isComplete, startSaving, finishSaving, failSaving } = useSaveProgress();
  const [caseStatus, setCaseStatus] = useState<ReworkCase['status']>(caseData?.status || 'Pending');
  const [resolutionMethod, setResolutionMethod] = useState('');
  const [reworkCost, setReworkCost] = useState<number | string>('');
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedSource, setEditedSource] = useState('');
  const [editedItems, setEditedItems] = useState<ReworkCase['items']>([]);
  const [deletedItemIds, setDeletedItemIds] = useState<string[]>([]);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [newOrFiles, setNewOrFiles] = useState<File[]>([]);
  const [newImages, setNewImages] = useState<Record<string, File[]>>({});
  const [materials, setMaterials] = useState<MaterialUsage[]>([]);
  const [editExitIntent, setEditExitIntent] = useState(false);
  const [editedCaseNumber, setEditedCaseNumber] = useState('');
  const [laborCount, setLaborCount] = useState<number | string>('');
  const [laborHours, setLaborHours] = useState<number | string>('');
  const [laborRate, setLaborRate] = useState<number | string>('');

  const SOURCE_OPTIONS = ['SFC', 'Customer'];
  const caseNamePrefix = String(editedSource).toLowerCase() === 'customer' ? 'RT' : 'RW';
  const caseNameYear = new Date().getFullYear().toString().slice(2);
  const previewCaseName = caseData?.caseName || caseData?.id || '';
  const getCaseNumber = (caseName?: string, id?: string) => caseName || id || 'Unknown';
  const handleToggleEditMode = () => setIsEditMode(!isEditMode);
  const handleSaveEdit = () => handleUpdate();

  const handleRequestClose = () => {
    if (isEditMode) {
      showConfirm('คุณมีข้อมูลที่ยังไม่ได้บันทึก ต้องการปิดใช่หรือไม่?', () => {
        setIsEditMode(false);
        onClose();
      });
    } else {
      onClose();
    }
  };

  const handleDownloadImages = async (imageUrls: string[], itemName: string) => {
    if (!imageUrls || imageUrls.length === 0) return;
    for (let i = 0; i < imageUrls.length; i++) {
      const url = imageUrls[i];
      if (url.includes('drive.google.com')) {
        window.open(url, '_blank');
        continue;
      }
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Network response was not ok');
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        const ext = url.split('.').pop()?.split('?')[0] || 'jpg';
        a.download = `${itemName.replace(/\s+/g, '_')}_image_${i + 1}.${ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(blobUrl);
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (err) {
        window.open(url, '_blank');
      }
    }
  };

  const userRole = userRoleOverride || getCurrentUserRole();
  const isAdmin = userRole === UserRole.QSMS;
  const isFinance = userRole === UserRole.FINANCE || isAdmin;
  const isOperator = userRole === UserRole.OPERATOR || isAdmin;
  const isPDB = isOperator;
  const isStrictOperator = userRole === UserRole.OPERATOR && !isAdmin;
  const canManageRows = isOperator || isAdmin;
  const canEditMaterialNameQty = isOperator || isAdmin;
  const canEditUnitPrice = isFinance || isAdmin;
  const canViewFinancialData = !isStrictOperator;

  const { exportRef, isExporting, exportProgress, exportPNG, exportPDF, exportExcel } = useExportReport();

  useEffect(() => {
    if (isOpen && !inline) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;
      return () => {
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
      };
    }
  }, [isOpen, inline]);

  useEffect(() => {
    if (caseData) {
      setCaseStatus(caseData.status);
      setResolutionMethod(caseData.resolutionMethod || '');
      setReworkCost(caseData.reworkCost || '');
      setEditedSource(caseData.source);
      setEditedItems([...caseData.items]);
      setDeletedItemIds([]);
      setNewOrFiles([]);
      setMaterials(caseData.materials ? [...caseData.materials] : []);
      setLaborCount(caseData.laborCount ?? '');
      setLaborHours(caseData.laborHours ?? '');
      setLaborRate(caseData.laborRate ?? '');
      
      const idStr = caseData.caseName || caseData.id || '';
      const match = idStr.match(/^(?:RT|RW)(\d+)/);
      setEditedCaseNumber(match ? match[1] : '');
    }
  }, [caseData]);

  useEffect(() => {
    const matTotal = materials.reduce((sum, mat) => {
      const qty = Number(mat.quantity) || 0;
      const price = Number(mat.unitPrice) || 0;
      return sum + (qty * price);
    }, 0);
    const lCount = Number(laborCount) || 0;
    const lHours = Number(laborHours) || 0;
    const lRate = Number(laborRate) || 0;
    const laborTotal = lCount * lHours * lRate;
    const grandTotal = matTotal + laborTotal;
    if (materials.length > 0 || laborTotal > 0) {
      setReworkCost(Number(grandTotal.toFixed(2)));
    }
  }, [materials, laborCount, laborHours, laborRate]);

  const handleAddMaterial = () => {
    const newMat: MaterialUsage = {
      id: `mat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: STANDARD_MATERIALS[0],
      quantity: 1,
      unit: 'ชิ้น',
      unitPrice: 0,
      totalPrice: 0
    };
    setMaterials(prev => [...prev, newMat]);
  };

  const handleMaterialChange = (id: string, field: keyof MaterialUsage, value: string | number) => {
    setMaterials(prev => prev.map(mat => {
      if (mat.id !== id) return mat;
      const updated = { ...mat, [field]: value };
      if (field === 'quantity' || field === 'unitPrice') {
        updated.totalPrice = (Number(updated.quantity) || 0) * (Number(updated.unitPrice) || 0);
      }
      return updated;
    }));
  };

  const handleRemoveMaterial = (id: string) => setMaterials(prev => prev.filter(mat => mat.id !== id));

  const handleUpdate = async () => {
    if (!caseData) return;
    if (isPDB || isAdmin) {
      if (editedItems.some(item => (Number(item.amount) || 0) <= 0)) {
        showAlert('จำนวนสินค้าต้องมากกว่า 0', 'error');
        return;
      }
      if (editedItems.some(item => item.boxNumber === '0')) {
        showAlert('จำนวนกล่อง (Box Number) ห้ามเป็น 0', 'error');
        return;
      }
    }

    startSaving();
    try {
      const updates: any = {};
      let targetStatus = (isAdmin || isOperator) ? caseStatus : caseData.status;
      const isExplicitOverride = (isAdmin || isOperator) && caseStatus !== caseData.status;

      if (!isExplicitOverride) {
        if (caseData.status === 'Pending') {
          const hasMaterials = materials.length > 0;
          const hasLabor = (Number(laborHours) || 0) > 0 && (Number(laborCount) || 0) > 0;
          if (resolutionMethod.trim() !== '' || hasMaterials || hasLabor) {
            targetStatus = 'Awaiting Valuation';
          } else if (!isAdmin) {
            targetStatus = 'In-Progress';
          }
        } else if (caseData.status === 'In-Progress') {
          const hasMaterials = materials.length > 0;
          const hasLabor = (Number(laborHours) || 0) > 0 && (Number(laborCount) || 0) > 0;
          if (resolutionMethod.trim() !== '' || hasMaterials || hasLabor) targetStatus = 'Awaiting Valuation';
        } else if (caseData.status === 'Awaiting Valuation') {
          targetStatus = 'Completed';
        }
      }

      updates.status = targetStatus;
      if (isOperator || isAdmin) updates.resolutionMethod = resolutionMethod;
      if (isAdmin) {
        updates.source = editedSource;
        if (isEditMode) {
          updates.caseName = `${caseNamePrefix}${editedCaseNumber}-${new Date().getFullYear()}`;
        }
      }
      if (reworkCost !== '' && (isFinance || isAdmin)) updates.reworkCost = Number(reworkCost);
      if (isPDB || isAdmin) updates.items = editedItems;
      if (canManageRows || canEditUnitPrice || isAdmin) updates.materials = materials;
      
      if (isOperator || isAdmin) {
        updates.laborCount = laborCount !== '' ? Number(laborCount) : 0;
        updates.laborHours = laborHours !== '' ? Number(laborHours) : 0;
      }
      if (isFinance || isAdmin) {
        updates.laborRate = laborRate !== '' ? Number(laborRate) : 0;
      }

      if (newOrFiles.length > 0) updates.newOrFiles = newOrFiles;
      if (deletedItemIds.length > 0) updates.deleteItemIds = deletedItemIds;

      await onUpdate(caseData.id, updates);
      finishSaving();
      setIsEditMode(false);
    } catch (error) {
      console.error('Update failed:', error);
      failSaving();
    }
  };

  const handleDelete = () => setIsDeleteConfirmOpen(true);

  const confirmDelete = async () => {
    if (!caseData || !onDelete) return;
    setIsActionLoading(true);
    try {
      await onDelete(caseData.id);
      setIsDeleteConfirmOpen(false);
      onClose();
    } catch (error) {
      showAlert('ไม่สามารถลบรายการได้ กรุณาลองใหม่อีกครั้ง', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRemoveItem = (index: number) => {
    if (editedItems.length <= 1) {
      showAlert('ต้องมีอย่างน้อย 1 รายการในงานนี้', 'warning');
      return;
    }
    showConfirm('คุณต้องการลบรายการย่อยนี้ใช่หรือไม่?', () => {
      const itemToDelete = editedItems[index];
      const idToDelete = itemToDelete.uid || itemToDelete.id;
      if (idToDelete) setDeletedItemIds(prev => [...prev, idToDelete]);
      setEditedItems(editedItems.filter((_, i) => i !== index));
    });
  };

  const getStatusLabel = (status: ReworkCase['status']) => {
    switch (status) {
      case 'Pending': return 'รอดำเนินการ';
      case 'In-Progress': return 'กำลังดำเนินการ';
      case 'Awaiting Valuation': return 'รอประเมินราคา';
      case 'Completed': return 'เสร็จสิ้น';
      default: return status;
    }
  };

  const value: UpdateModalContextValue = {
    caseData, isLoading, isOpen, inline, onClose,
    caseStatus, setCaseStatus, resolutionMethod, setResolutionMethod, reworkCost, setReworkCost,
    lightboxUrl, setLightboxUrl, isEditMode, setIsEditMode, editedSource, setEditedSource,
    editedItems, setEditedItems, deletedItemIds, setDeletedItemIds, expandedItemId, setExpandedItemId,
    isDeleteConfirmOpen, setIsDeleteConfirmOpen, isActionLoading, newOrFiles, setNewOrFiles,
    newImages, setNewImages, materials, setMaterials, editExitIntent, editedCaseNumber, setEditedCaseNumber,
    SOURCE_OPTIONS, caseNamePrefix, caseNameYear, previewCaseName, getCaseNumber,
    handleToggleEditMode, handleSaveEdit, handleRequestClose, handleDownloadImages,
    laborCount, setLaborCount, laborHours, setLaborHours, laborRate, setLaborRate,
    userRole, isAdmin, isFinance, isOperator, isPDB, canManageRows, canEditMaterialNameQty, canEditUnitPrice, canViewFinancialData,
    exportRef, isExporting, exportProgress, exportPNG, exportPDF, exportExcel,
    handleAddMaterial, handleMaterialChange, handleRemoveMaterial, handleUpdate, handleDelete, confirmDelete, handleRemoveItem, getStatusLabel,
    isSaving, progress, statusText, isComplete
  };

  return <UpdateModalContext.Provider value={value}>{children}</UpdateModalContext.Provider>;
}

export function useUpdateModal() {
  const context = useContext(UpdateModalContext);
  if (context === undefined) {
    throw new Error('useUpdateModal must be used within an UpdateModalProvider');
  }
  return context;
}
