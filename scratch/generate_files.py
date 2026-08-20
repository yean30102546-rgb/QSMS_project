import os

base_dir = r"c:\Workplace\Mytask\Projects\QSMS_project\src\modules\rework\components\UpdateModal"
scratch_dir = r"c:\Workplace\Mytask\Projects\QSMS_project\scratch"

with open(os.path.join(scratch_dir, "edit_jsx.txt"), "r", encoding="utf-8") as f:
    edit_jsx = f.read()

with open(os.path.join(scratch_dir, "view_jsx.txt"), "r", encoding="utf-8") as f:
    view_jsx = f.read()

edit_content = """import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle2, Clock, AlertCircle, ImageOff, ExternalLink, FileText, Download, FileImage, HelpCircle, Landmark, PenTool, Calculator, Trash2, Package, Plus, FileSpreadsheet, ChevronDown } from 'lucide-react';
import { useUpdateModal, STANDARD_MATERIALS } from './UpdateModalContext';
import { CUSTOMER_OPTIONS } from '@/src/services/api';
import { convertDMYToYMD, convertYMDToDMY, enforceNumeric } from '@/src/utils/helpers';
import { AppleProgressBar } from '@/src/components/shared/AppleProgressBar';

export function UpdateModalEdit() {
  const {
    caseData, isLoading, caseStatus, setCaseStatus, resolutionMethod, setResolutionMethod, reworkCost, setReworkCost,
    lightboxUrl, setLightboxUrl, isEditMode, setIsEditMode, editedSource, setEditedSource,
    editedItems, setEditedItems, deletedItemIds, setDeletedItemIds, expandedItemId, setExpandedItemId,
    isDeleteConfirmOpen, setIsDeleteConfirmOpen, isActionLoading, newOrFiles, setNewOrFiles,
    newImages, setNewImages, materials, setMaterials, editExitIntent, editedCaseNumber, setEditedCaseNumber,
    SOURCE_OPTIONS, caseNamePrefix, caseNameYear, previewCaseName, getCaseNumber,
    handleToggleEditMode, handleSaveEdit, handleRequestClose, handleDownloadImages,
    laborCount, setLaborCount, laborHours, setLaborHours, laborRate, setLaborRate,
    userRole, isAdmin, isFinance, isOperator, isPDB, canManageRows, canEditMaterialNameQty, canEditUnitPrice, canViewFinancialData,
    handleAddMaterial, handleMaterialChange, handleRemoveMaterial, handleUpdate, handleDelete, confirmDelete, handleRemoveItem, getStatusLabel,
    isSaving, progress, statusText, isComplete
  } = useUpdateModal();

  return (
    """ + edit_jsx + """
  );
}
"""

view_content = """import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle2, Clock, AlertCircle, ImageOff, ExternalLink, FileText, Download, FileImage, HelpCircle, Landmark, PenTool, Calculator, Trash2, Package, Plus, FileSpreadsheet, ChevronDown } from 'lucide-react';
import { useUpdateModal, STANDARD_MATERIALS } from './UpdateModalContext';
import { CUSTOMER_OPTIONS } from '@/src/services/api';
import { formatThaiDate, convertDMYToYMD, convertYMDToDMY, enforceNumeric } from '@/src/utils/helpers';
import { DriveImage } from '../ui/DriveImage';

function StatusBadge({ status }: { status: string }) {
  let bgColor = 'bg-surface-secondary';
  let textColor = 'text-on-surface-variant';
  let icon = <AlertCircle size={14} />;
  let label = status;

  switch (status) {
    case 'Pending':
      bgColor = 'bg-[#ff9500]/10'; textColor = 'text-[#ff9500]'; icon = <AlertCircle size={14} />; label = 'รอดำเนินการ'; break;
    case 'In-Progress':
      bgColor = 'bg-[#0066cc]/10'; textColor = 'text-[#0066cc]'; icon = <Clock size={14} />; label = 'กำลังดำเนินการ'; break;
    case 'Awaiting Valuation':
      bgColor = 'bg-[#ff3b30]/10'; textColor = 'text-[#ff3b30]'; icon = <Landmark size={14} />; label = 'รอประเมินราคา'; break;
    case 'Completed':
      bgColor = 'bg-[#34c759]/10'; textColor = 'text-[#34c759]'; icon = <CheckCircle2 size={14} />; label = 'เสร็จสิ้น'; break;
  }
  return <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${bgColor} ${textColor}`}>{icon}{label}</div>;
}

export function UpdateModalView() {
  const {
    caseData, isLoading, caseStatus, setCaseStatus, resolutionMethod, setResolutionMethod, reworkCost, setReworkCost,
    lightboxUrl, setLightboxUrl, isEditMode, setIsEditMode, editedSource, setEditedSource,
    editedItems, setEditedItems, deletedItemIds, setDeletedItemIds, expandedItemId, setExpandedItemId,
    isDeleteConfirmOpen, setIsDeleteConfirmOpen, isActionLoading, newOrFiles, setNewOrFiles,
    newImages, setNewImages, materials, setMaterials, editExitIntent, editedCaseNumber, setEditedCaseNumber,
    SOURCE_OPTIONS, caseNamePrefix, caseNameYear, previewCaseName, getCaseNumber,
    handleToggleEditMode, handleSaveEdit, handleRequestClose, handleDownloadImages,
    laborCount, setLaborCount, laborHours, setLaborHours, laborRate, setLaborRate,
    userRole, isAdmin, isFinance, isOperator, isPDB, canManageRows, canEditMaterialNameQty, canEditUnitPrice, canViewFinancialData,
    exportRef, isExporting, exportProgress, exportPNG, exportPDF, exportExcel,
    handleAddMaterial, handleMaterialChange, handleRemoveMaterial, handleUpdate, handleDelete, confirmDelete, handleRemoveItem, getStatusLabel
  } = useUpdateModal();

  return (
    <>
      """ + view_jsx + """
      <AnimatePresence>
        {isDeleteConfirmOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-system-background rounded-2xl p-6 max-w-sm w-full shadow-2xl">
              <h3 className="text-lg font-bold text-on-surface mb-2 text-center">ยืนยันการลบ</h3>
              <p className="text-on-surface-variant text-sm mb-6 text-center">คุณแน่ใจหรือไม่ว่าต้องการลบเคสนี้? การกระทำนี้ไม่สามารถย้อนกลับได้</p>
              <div className="flex gap-3">
                <button onClick={() => setIsDeleteConfirmOpen(false)} disabled={isActionLoading} className="flex-1 px-4 py-2 bg-surface-secondary text-on-surface font-semibold rounded-full hover:bg-surface-variant">ยกเลิก</button>
                <button onClick={confirmDelete} disabled={isActionLoading} className="flex-1 px-4 py-2 bg-[#ff3b30] text-white font-semibold rounded-full hover:bg-[#ff3b30]/90">
                  {isActionLoading ? 'กำลังลบ...' : 'ลบข้อมูล'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {lightboxUrl && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setLightboxUrl(null)} className="fixed inset-0 z-[70] bg-black/90 flex flex-col p-4 sm:p-8 cursor-zoom-out">
            <div className="flex justify-end mb-4">
              <button onClick={() => setLightboxUrl(null)} className="p-2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors"><X size={24} /></button>
            </div>
            <div className="flex-1 relative flex items-center justify-center overflow-hidden">
              <img src={lightboxUrl} alt="Enlarged view" className="max-w-full max-h-full object-contain select-none" draggable={false} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
"""

index_content = """import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UpdateModalProvider, useUpdateModal } from './UpdateModalContext';
import { UpdateModalEdit } from './UpdateModalEdit';
import { UpdateModalView } from './UpdateModalView';
import { ReworkCase } from '@/src/services/api';
import { UserRole } from '@/src/config/auth.config';

interface UpdateModalProps {
  isOpen: boolean;
  caseData: ReworkCase | null;
  isLoading: boolean;
  onClose: () => void;
  onUpdate: (caseId: string, updates: Partial<ReworkCase>) => Promise<void>;
  onDelete?: (caseId: string) => Promise<void>;
  inline?: boolean;
  userRoleOverride?: UserRole;
}

export function UpdateModal(props: UpdateModalProps) {
  return (
    <UpdateModalProvider {...props}>
      <UpdateModalContent />
    </UpdateModalProvider>
  );
}

function UpdateModalContent() {
  const { isEditMode, isOpen, handleRequestClose, editExitIntent, inline } = useUpdateModal();
  
  if (typeof document === 'undefined') return null;

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleRequestClose}
            className={`${inline ? 'absolute' : 'fixed'} inset-0 bg-black/35 z-40 will-change-opacity`}
          />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={`${inline ? 'absolute' : 'fixed'} top-0 left-0 w-full ${inline ? 'h-full' : 'h-[100dvh]'} z-50 flex items-center justify-center p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:p-6 pointer-events-none will-change-transform`}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: editExitIntent ? 0.6 : 1, y: 0, scale: editExitIntent ? 0.98 : 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              aria-hidden={!!editExitIntent}
              className="pointer-events-auto w-full max-w-6xl flex flex-col max-h-[calc(100dvh-2rem)] sm:max-h-[90vh] will-change-transform rounded-[24px] sm:rounded-[16px] overflow-hidden shadow-2xl"
            >
              {isEditMode ? <UpdateModalEdit /> : <UpdateModalView />}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
"""

with open(os.path.join(base_dir, "UpdateModalEdit.tsx"), "w", encoding="utf-8") as f:
    f.write(edit_content)

with open(os.path.join(base_dir, "UpdateModalView.tsx"), "w", encoding="utf-8") as f:
    f.write(view_content)

with open(os.path.join(base_dir, "index.tsx"), "w", encoding="utf-8") as f:
    f.write(index_content)
