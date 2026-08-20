import os
import re

modal_path = r"c:\Workplace\Mytask\Projects\QSMS_project\src\modules\rework\components\UpdateModal.tsx"
out_dir = r"c:\Workplace\Mytask\Projects\QSMS_project\scratch"

with open(modal_path, "r", encoding="utf-8") as f:
    content = f.read()

# Edit Mode JSX
edit_start = content.find("isEditMode ? (")
edit_start = content.find("<div className=\"relative", edit_start)
view_start_marker = content.find(") : (", edit_start)
edit_jsx = content[edit_start:view_start_marker].strip()

# View Mode JSX
view_start = content.find("<div className=\"relative", view_start_marker)
view_end_marker = content.rfind("</AnimatePresence>")

view_jsx_raw = content[view_start:view_end_marker].strip()
last_div = view_jsx_raw.rfind("</div>")
view_jsx = view_jsx_raw[:last_div+6]

with open(os.path.join(out_dir, "edit_jsx.txt"), "w", encoding="utf-8") as f:
    f.write(edit_jsx)

with open(os.path.join(out_dir, "view_jsx.txt"), "w", encoding="utf-8") as f:
    f.write(view_jsx)
