import os

modal_path = r"c:\Workplace\Mytask\Projects\QSMS_project\src\components\modals\UpdateModal.tsx"
out_dir = r"c:\Workplace\Mytask\Projects\QSMS_project\scratch"

with open(modal_path, "r", encoding="utf-8") as f:
    content = f.read()

def extract_jsx(content, start_index):
    # Find the first '<div' after start_index
    div_start = content.find("<div", start_index)
    if div_start == -1:
        return ""
    
    open_tags = 0
    i = div_start
    length = len(content)
    
    # Very basic tag matcher.
    # Actually, it's easier to just match { and }? No, HTML tags.
    # Let's count <div and </div
    # This is fragile if there are other tags.
    # What if we just use the original content, but split manually via a text editor? I can just print lines!
    pass

# A better way is to rely on the fact that I know the line numbers. Let's find the line numbers.
lines = content.split('\n')
edit_start_line = 0
view_start_line = 0
view_end_line = 0

for idx, line in enumerate(lines):
    if "EDIT MODE SCREEN" in line:
        edit_start_line = idx
    if "VIEW MODE SCREEN" in line:
        view_start_line = idx

# We know the View Mode Screen ends where `export function StatusBadge` or `function StatusBadge` begins, or where `return content;` happens.
# Wait, let's find the exact end of View Mode.
for idx in range(view_start_line, len(lines)):
    if "        </>" in lines[idx] or "      )} <!-- end of AnimatePresence inner -->" in lines[idx] or "</AnimatePresence>" in lines[idx]:
        # let's look for `</motion.div>` that matches the wrapper.
        pass

# Since I just need to extract the JSX, let me just print the lines around the boundaries and I can hardcode the line numbers!
print(f"Edit Mode starts near line {edit_start_line}")
print(f"View Mode starts near line {view_start_line}")

for i in range(edit_start_line-2, edit_start_line+5):
    print(f"{i}: {lines[i]}")

print("---")
for i in range(view_start_line-5, view_start_line+5):
    print(f"{i}: {lines[i]}")

print("---")
# find end of view mode
for idx in range(view_start_line, len(lines)):
    if "function StatusBadge" in lines[idx]:
        print(f"StatusBadge found at line {idx}")
        for i in range(idx-10, idx+2):
            print(f"{i}: {lines[i]}")
        break
