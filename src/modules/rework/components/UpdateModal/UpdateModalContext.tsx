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
  handleCancelEdit: () => void;
  handleRequestClose: () => void;
  handleDownloadImages: (urls: string[], name: string) => Promise<void>;
  userRole: UserRole;
  isAdmin: boolean;
  isOperator: boolean;
  isPDB: boolean;
  canManageRows: boolean;
  exportRef: React.RefObject<any>;
  isExporting: boolean;
  exportProgress: string;
  exportExcel: (data: any) => void;
  handleUpdate: () => Promise<void>;
  missingBoxes: number;
  setMissingBoxes: (val: number) => void;
  missingGallons: number;
  setMissingGallons: (val: number) => void;
  missingOil: number;
  setMissingOil: (val: number) => void;
  handleGlobalProgressChange: (globalCompleted: number) => void;
  handleItemProgressChange: (index: number, completedBoxes: number) => void;
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
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedSource, setEditedSource] = useState('');
  const [editedItems, setEditedItems] = useState<ReworkCase['items']>([]);
  const [missingBoxes, setMissingBoxes] = useState<number>(caseData?.missingBoxes || 0);
  const [missingGallons, setMissingGallons] = useState<number>(caseData?.missingGallons || 0);
  const [missingOil, setMissingOil] = useState<number>(caseData?.missingOil || 0);
  const [deletedItemIds, setDeletedItemIds] = useState<string[]>([]);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [newOrFiles, setNewOrFiles] = useState<File[]>([]);
  const [newImages, setNewImages] = useState<Record<string, File[]>>({});
  const [editExitIntent, setEditExitIntent] = useState(false);
  const [editedCaseNumber, setEditedCaseNumber] = useState('');

  const SOURCE_OPTIONS = ['SFC', 'Customer'];
  const caseNamePrefix = String(editedSource).toLowerCase() === 'customer' ? 'RT' : 'RW';
  const caseNameYear = new Date().getFullYear().toString().slice(2);
  const previewCaseName = caseData?.caseName || caseData?.id || '';
  const getCaseNumber = (caseName?: string, id?: string) => caseName || id || 'Unknown';
  const handleToggleEditMode = () => setIsEditMode(!isEditMode);
  const handleSaveEdit = () => handleUpdate();
  const handleCancelEdit = () => {
    const hasChanges = JSON.stringify(editedItems) !== JSON.stringify(caseData?.items) ||
      editedSource !== caseData?.source ||
      editedCaseNumber !== (caseData?.caseName?.match(/^(?:RT|RW)(\d+)/)?.[1] || '');

    if (hasChanges) {
      showConfirm('ต้องการยกเลิกการแก้ไขใช่หรือไม่? (การเปลี่ยนแปลงจะไม่ได้รับการบันทึก)', () => {
        if (caseData) {
          setEditedSource(caseData.source);
          setEditedItems([...caseData.items]);
          setDeletedItemIds([]);
          setNewOrFiles([]);
          const idStr = caseData.caseName || caseData.id || '';
          const match = idStr.match(/^(?:RT|RW)(\d+)/);
          setEditedCaseNumber(match ? match[1] : '');
        }
        setIsEditMode(false);
      });
    } else {
      setIsEditMode(false);
    }
  };

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
  const isOperator = userRole === UserRole.OPERATOR || isAdmin;
  const isPDB = isOperator;
  const canManageRows = isOperator || isAdmin;

  const { exportRef, isExporting, exportProgress, exportExcel } = useExportReport();

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
      setEditedSource(caseData.source);
      setEditedItems([...caseData.items]);
      setDeletedItemIds([]);
      setNewOrFiles([]);

      const idStr = caseData.caseName || caseData.id || '';
      const match = idStr.match(/^(?:RT|RW)(\d+)/);
      setEditedCaseNumber(match ? match[1] : '');
      setMissingBoxes(caseData.missingBoxes || 0);
      setMissingGallons(caseData.missingGallons || 0);
      setMissingOil(caseData.missingOil || 0);
    }
  }, [caseData]);

  // Auto-status updates are derived directly from editedItems
  const totalBoxes = editedItems.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);
  const globalCompleted = editedItems.reduce((acc, item) => acc + (Number(item.completedBoxes) || 0), 0);

  let caseStatus: ReworkCase['status'] = 'Pending';
  if (globalCompleted >= totalBoxes && totalBoxes > 0) {
    caseStatus = 'Completed';
  } else if (globalCompleted > 0) {
    caseStatus = 'In-Progress';
  } else if (caseData?.status === 'Completed' && totalBoxes === 0) {
    // Edge case: if it was completed but has no boxes
    caseStatus = 'Completed';
  }

  // Effect to reset missing fields when status becomes completed
  useEffect(() => {
    if (caseStatus === 'Completed') {
      setMissingBoxes(0);
      setMissingGallons(0);
      setMissingOil(0);
    }
  }, [caseStatus]);

  const handleGlobalProgressChange = (globalCompleted: number) => {
    let remaining = globalCompleted;
    setEditedItems(prev => {
      const newItems = prev.map(item => {
        const amount = Number(item.amount) || 0;
        let completedForThisItem = 0;
        if (remaining > 0) {
          if (remaining >= amount) {
            completedForThisItem = amount;
            remaining -= amount;
          } else {
            completedForThisItem = remaining;
            remaining = 0;
          }
        }
        return { ...item, completedBoxes: completedForThisItem };
      });

      return newItems;
    });
  };

  const handleItemProgressChange = (index: number, completedBoxes: number) => {
    setEditedItems(prev => {
      const newItems = [...prev];
      newItems[index] = { ...newItems[index], completedBoxes };
      return newItems;
    });
  };

  const handleUpdate = async () => {
    if (!caseData) return;
    if (isPDB || isAdmin) {
      if (editedItems.some(item => (Number(item.amount) || 0) <= 0)) {
        showAlert('จำนวนกล่องต้องมากกว่า 0', 'error');
        return;
      }
    }

    startSaving();
    try {
      const updates: any = {};
      let targetStatus = (isAdmin || isOperator) ? caseStatus : caseData.status;
      let finalItems = [...editedItems];

      if (targetStatus === 'Completed') {
        finalItems = finalItems.map(item => ({
          ...item,
          completedBoxes: Number(item.amount) || 0
        }));
      }

      const allItemsCompleted = finalItems.every(item => {
        const amount = Number(item.amount) || 0;
        const completedBoxes = Number(item.completedBoxes) || 0;
        return amount > 0 && completedBoxes >= amount;
      });

      if (allItemsCompleted && targetStatus !== 'Completed') {
        targetStatus = 'Completed';
      }

      updates.status = targetStatus;
      if (isAdmin) {
        updates.source = editedSource;
        if (isEditMode) {
          updates.caseName = `${caseNamePrefix}${editedCaseNumber}-${new Date().getFullYear()}`;
        }
      }
      // Only send items that have been modified or are new
      const modifiedItems = finalItems.filter(item => {
        const original = caseData.items.find(i => i.id === item.id);
        if (!original) return true; // new item
        
        // Deep compare relevant fields (converting to strings for safe comparison)
        return (
          String(item.amount || '') !== String(original.amount || '') ||
          String(item.completedBoxes || '') !== String(original.completedBoxes || '') ||
          String(item.reason || '') !== String(original.reason || '') ||
          String(item.reasonSubtype || '') !== String(original.reasonSubtype || '') ||
          String(item.responsible || '') !== String(original.responsible || '') ||
          String(item.responsibleSubtype || '') !== String(original.responsibleSubtype || '') ||
          String(item.details || '') !== String(original.details || '') ||
          String(item.batchNo || '') !== String(original.batchNo || '') ||
          String(item.packagingDate || '') !== String(original.packagingDate || '') ||
          String(item.mold || '') !== String(original.mold || '') ||
          String(item.line || '') !== String(original.line || '') ||
          String(item.linkedSourceId || '') !== String(original.linkedSourceId || '') ||
          String(item.itemCode || '') !== String(original.itemCode || '') ||
          String(item.customerName || '') !== String(original.customerName || '') ||
          // Also check if any images were added
          (item.imageUrls && original.imageUrls && item.imageUrls.length !== original.imageUrls.length)
        );
      });

      updates.items = modifiedItems;
      updates.status = caseStatus; // Send computed status

      if (isOperator || isAdmin) {
        updates.missingBoxes = targetStatus === 'Completed' ? 0 : missingBoxes;
        updates.missingGallons = targetStatus === 'Completed' ? 0 : missingGallons;
        updates.missingOil = targetStatus === 'Completed' ? 0 : missingOil;
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
      case 'Completed': return 'เสร็จสิ้น';
      default: return status;
    }
  };

  const value: UpdateModalContextValue = {
    caseData, isLoading, isOpen, inline, onClose,
    caseStatus,
    lightboxUrl, setLightboxUrl, isEditMode, setIsEditMode, editedSource, setEditedSource,
    editedItems, setEditedItems, deletedItemIds, setDeletedItemIds, expandedItemId, setExpandedItemId,
    isDeleteConfirmOpen, setIsDeleteConfirmOpen, isActionLoading, newOrFiles, setNewOrFiles,
    newImages, setNewImages, editExitIntent, editedCaseNumber, setEditedCaseNumber,
    SOURCE_OPTIONS, caseNamePrefix, caseNameYear, previewCaseName, getCaseNumber,
    handleToggleEditMode, handleSaveEdit, handleCancelEdit, handleRequestClose, handleDownloadImages,
    userRole, isAdmin, isOperator, isPDB, canManageRows,
    exportRef, isExporting, exportProgress, exportExcel,
    handleUpdate, handleDelete, confirmDelete, handleRemoveItem, getStatusLabel,
    isSaving, progress, statusText, isComplete,
    missingBoxes, setMissingBoxes, missingGallons, setMissingGallons,
    missingOil, setMissingOil, handleGlobalProgressChange, handleItemProgressChange
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
