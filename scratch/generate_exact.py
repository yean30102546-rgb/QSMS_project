import os

modal_path = r"c:\Workplace\Mytask\Projects\QSMS_project\src\components\modals\UpdateModal.tsx"
base_dir = r"c:\Workplace\Mytask\Projects\QSMS_project\src\modules\rework\components\UpdateModal"

with open(modal_path, "r", encoding="utf-8") as f:
    content = f.read()

lines = content.split('\n')
edit_jsx_lines = lines[437:1006] # from line 438 (idx 437) to line 1006 (idx 1005)
view_jsx_lines = lines[1010:1627] # from line 1011 (idx 1010) to line 1627 (idx 1626)

# also extract StatusBadge from lines 1637+
status_badge_lines = lines[1637:]

edit_jsx = '\n'.join(edit_jsx_lines)
view_jsx = '\n'.join(view_jsx_lines)
status_badge = '\n'.join(status_badge_lines)

edit_content = f"""import React from 'react';
import {{ motion, AnimatePresence }} from 'motion/react';
import {{ X, CheckCircle2, Clock, AlertCircle, ImageOff, ExternalLink, FileText, Download, FileImage, HelpCircle, Landmark, PenTool, Calculator, Trash2, Package, Plus, FileSpreadsheet }} from 'lucide-react';
import {{ useUpdateModal, STANDARD_MATERIALS }} from './UpdateModalContext';
import {{ CUSTOMER_OPTIONS }} from '@/src/services/api';
import {{ convertDMYToYMD, convertYMDToDMY, enforceNumeric }} from '@/src/utils/helpers';
import {{ AppleProgressBar }} from '@/src/components/shared/AppleProgressBar';

export function UpdateModalEdit() {{
  const {{
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
  }} = useUpdateModal();

  return (
{edit_jsx}
  );
}}
"""

view_content = f"""import React from 'react';
import {{ motion, AnimatePresence }} from 'motion/react';
import {{ X, CheckCircle2, Clock, AlertCircle, ImageOff, ExternalLink, FileText, Download, FileImage, HelpCircle, Landmark, PenTool, Calculator, Trash2, Package, Plus, FileSpreadsheet }} from 'lucide-react';
import {{ useUpdateModal, STANDARD_MATERIALS }} from './UpdateModalContext';
import {{ CUSTOMER_OPTIONS, ReworkCase }} from '@/src/services/api';
import {{ formatThaiDate, formatThaiDateShort, convertDMYToYMD, convertYMDToDMY, enforceNumeric }} from '@/src/utils/helpers';
import {{ DriveImage }} from '@/src/components/ui/DriveImage';

{status_badge}

export function UpdateModalView() {{
  const {{
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
  }} = useUpdateModal();

  return (
    <>
{view_jsx}
    </>
  );
}}
"""

with open(os.path.join(base_dir, "UpdateModalEdit.tsx"), "w", encoding="utf-8") as f:
    f.write(edit_content)

with open(os.path.join(base_dir, "UpdateModalView.tsx"), "w", encoding="utf-8") as f:
    f.write(view_content)

print("Files created successfully.")
