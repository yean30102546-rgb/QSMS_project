import os
import shutil

# Map of old paths to new paths (relative to project root)
moves = {
    "src/components/Login.tsx": "src/modules/auth/views/Login.tsx",
    "src/components/Register.tsx": "src/modules/auth/views/Register.tsx",
    
    "src/components/tabs/AddCaseTab.tsx": "src/modules/rework/views/AddCaseTab.tsx",
    "src/components/tabs/Dashboard.tsx": "src/modules/rework/views/Dashboard.tsx",
    "src/components/tabs/DashboardTab.tsx": "src/modules/rework/views/DashboardTab.tsx",
    "src/components/tabs/OverallTab.tsx": "src/modules/rework/views/OverallTab.tsx",
    
    "src/components/modals/UpdateModal.tsx": "src/modules/rework/components/UpdateModal.tsx",
    "src/components/modals/UpdateModal.test.tsx": "src/modules/rework/components/UpdateModal.test.tsx",
    "src/components/ui/CaseListTable.tsx": "src/modules/rework/components/CaseListTable.tsx",
    "src/components/ui/CaseListTable.test.tsx": "src/modules/rework/components/CaseListTable.test.tsx",
    
    "src/components/apps/rework/MobileFastTrackApp.tsx": "src/modules/rework/views/MobileFastTrackApp.tsx",
    "src/components/apps/rework/ReworkApp.tsx": "src/modules/rework/views/ReworkApp.tsx",
    
    "src/components/ImageUpload.tsx": "src/modules/storage/components/ImageUpload.tsx",
    "src/components/ui/ImageUpload.tsx": "src/modules/storage/components/ImageUpload_ui.tsx", # Renamed to avoid collision
    "src/components/ui/ImageEditor.tsx": "src/modules/storage/components/ImageEditor.tsx",
    "src/components/ui/UploadProgress.tsx": "src/modules/storage/components/UploadProgress.tsx",
    "src/components/ui/DriveImage.tsx": "src/modules/storage/components/DriveImage.tsx",
    
    "src/components/ui/ExportTemplate.tsx": "src/modules/drawings/components/ExportTemplate.tsx",
    "src/components/ui/ExportPDFTemplate.tsx": "src/modules/drawings/components/ExportPDFTemplate.tsx",
    
    "src/components/ui/Toast.tsx": "src/components/shared/Toast.tsx",
    "src/components/ui/ToastContainer.tsx": "src/components/shared/ToastContainer.tsx",
    "src/components/ui/LoadingOverlay.tsx": "src/components/shared/LoadingOverlay.tsx",
    "src/components/ui/Pagination.tsx": "src/components/shared/Pagination.tsx",
    "src/components/ui/AppleProgressBar.tsx": "src/components/shared/AppleProgressBar.tsx",
    "src/components/ui/RecentDatePicker.tsx": "src/components/shared/RecentDatePicker.tsx",
    "src/components/ui/AlertModal.tsx": "src/components/shared/AlertModal.tsx",
    
    "src/proxy.ts": "src/utils/proxy.ts"
}

project_root = r"c:\Workplace\Mytask\Projects\QSMS_project"

for old_rel, new_rel in moves.items():
    old_path = os.path.join(project_root, old_rel.replace("/", "\\"))
    new_path = os.path.join(project_root, new_rel.replace("/", "\\"))
    
    if os.path.exists(old_path):
        os.makedirs(os.path.dirname(new_path), exist_ok=True)
        shutil.move(old_path, new_path)
        print(f"Moved: {old_rel} -> {new_rel}")
    else:
        print(f"File not found: {old_rel}")
