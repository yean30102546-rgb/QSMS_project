import os

modal_path = r"c:\Workplace\Mytask\Projects\QSMS_project\src\components\modals\UpdateModal.tsx"

with open(modal_path, "r", encoding="utf-8") as f:
    content = f.read()

# Edit Mode JSX
edit_marker_start = "/* =========================================\n                     EDIT MODE SCREEN"
edit_start = content.find(edit_marker_start)
view_marker_start = "/* =========================================\n                     VIEW MODE SCREEN"
view_start = content.find(view_marker_start)

# Edit JSX ends where `) : (` happens
edit_end = content.rfind(") : (", edit_start, view_start)
edit_jsx = content[edit_start:edit_end].strip()

# Remove the trailing `</div>` that belongs to the ternary wrapper (Wait, if `) : (` is right after `</div>`, the JSX for edit mode must end with `</div>`. Let's just use what we extracted)

# View JSX starts at view_start
# And ends before the closing `</motion.div>` of the ternary.
# Let's find `</motion.div>\n          </motion.div>\n        </>\n      )}\n    </AnimatePresence>`
view_end = content.find("</motion.div>", view_start)
# Actually, there are many </motion.div>s inside view mode!
# The outermost one closes the ternary wrapper. So the one we want to exclude is the one right before `</motion.div>\n        </>\n      )}`
view_end_marker = "                )}"\n# Wait, let's look at the end of the file.
