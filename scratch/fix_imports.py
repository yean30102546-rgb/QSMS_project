import os
import re

# Dictionary of replacements to apply across all .ts and .tsx files
# We replace old relative paths with absolute @/src paths or updated relative paths.
# Format: (regex pattern, replacement string)
replacements = [
    # In src/modules/rework/views/AddCaseTab.tsx
    (r"'../../contexts/ReworkDataContext'", r"'@/src/contexts/ReworkDataContext'"),
    (r"'../../contexts/NotificationContext'", r"'@/src/contexts/NotificationContext'"),
    (r"'../../hooks/useItemVerification'", r"'@/src/hooks/useItemVerification'"),
    (r"'../../services/api'", r"'@/src/services/api'"),
    (r"'../ui/ImageUpload'", r"'@/src/modules/storage/components/ImageUpload_ui'"),
    (r"'../ui/AppleProgressBar'", r"'@/src/components/shared/AppleProgressBar'"),
    (r"'../../utils/helpers'", r"'@/src/utils/helpers'"),
    (r"'../modals/ConflictModal'", r"'@/src/components/modals/ConflictModal'"),
    (r"'../apps/rework/MobileFastTrackApp'", r"'@/src/modules/rework/views/MobileFastTrackApp'"),
    (r"'../ui/Combobox'", r"'@/src/components/ui/Combobox'"),
    (r"'../ui/RecentDatePicker'", r"'@/src/components/shared/RecentDatePicker'"),
    
    # In src/modules/rework/views/Dashboard.tsx
    (r"'../../services/api'", r"'@/src/services/api'"),
    
    # In src/modules/rework/views/DashboardTab.tsx
    (r"'../../services/api'", r"'@/src/services/api'"),
    (r"'../../contexts/ReworkDataContext'", r"'@/src/contexts/ReworkDataContext'"),
    
    # In src/modules/rework/views/MobileFastTrackApp.tsx
    (r"'../../ui/ImageUpload'", r"'@/src/modules/storage/components/ImageUpload_ui'"),
    (r"'../../ui/Combobox'", r"'@/src/components/ui/Combobox'"),
    
    # In src/modules/rework/views/OverallTab.tsx
    (r"'../../hooks/useOverallFilters'", r"'@/src/hooks/useOverallFilters'"),
    (r"'../../contexts/ReworkDataContext'", r"'@/src/contexts/ReworkDataContext'"),
    (r"'../../contexts/NotificationContext'", r"'@/src/contexts/NotificationContext'"),
    (r"'../../services/api'", r"'@/src/services/api'"),
    (r"'../ui/CaseListTable'", r"'@/src/modules/rework/components/CaseListTable'"),
    (r"'../ui/Pagination'", r"'@/src/components/shared/Pagination'"),
    (r"'../ui/Tooltip'", r"'@/src/components/ui/Tooltip'"),
    (r"'../modals/UpdateModal'", r"'@/src/modules/rework/components/UpdateModal'"),
    
    # In src/modules/storage/components/DriveImage.tsx
    (r"'../../hooks/useImageDataUrl'", r"'@/src/hooks/useImageDataUrl'"),
    (r"'../../utils/imageUrls'", r"'@/src/utils/imageUrls'"),
    
    # In src/modules/storage/components/ImageUpload.tsx
    (r"'../utils/imageCompressionUtils'", r"'@/src/utils/imageCompressionUtils'"),
    
    # In src/modules/storage/components/ImageUpload_ui.tsx
    (r"'../../utils/imageCompressionUtils'", r"'@/src/utils/imageCompressionUtils'"),
    
    # In src/utils/proxy.ts
    (r"'./lib/serverAuth'", r"'@/src/lib/serverAuth'"),
    
    # General missing relative paths from files that were moved to modules
    (r"'../../components/tabs/DashboardTab'", r"'@/src/modules/rework/views/DashboardTab'"),
    (r"'../../../components/tabs/DashboardTab'", r"'@/src/modules/rework/views/DashboardTab'"),
]

project_root = r"c:\Workplace\Mytask\Projects\QSMS_project\src"

for dirpath, dirnames, filenames in os.walk(project_root):
    for filename in filenames:
        if filename.endswith(".ts") or filename.endswith(".tsx"):
            filepath = os.path.join(dirpath, filename)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            original_content = content
            for pattern, repl in replacements:
                content = re.sub(pattern, repl, content)
                
            if content != original_content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"Updated imports in {filepath}")
