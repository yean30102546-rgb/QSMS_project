# Title: PyMuPDF & PyMuPDF4LLM (PDF & Office Data Extraction)
[วันที่อัปเดต: 2026-05-26]

## 1. Summary & Current Implementation
**PyMuPDF** (เดิมเรียกว่า `fitz`) เป็นไลบรารีภาษา Python ประสิทธิภาพสูงสำหรับการอ่าน เขียน แปลงไฟล์ และจัดการข้อมูลในเอกสาร PDF, XPS, EPUB และรูปภาพ โดยทำงานบนฐานของ MuPDF Engine (ภาษา C):
1. **High-Performance Rendering:** ประมวลผลและดึงข้อมูลเร็วกว่า Pure Python libraries ทั่วไปถึง 10–50 เท่า
2. **LLM-Ready Extraction (PyMuPDF4LLM):** รองรับการดึงข้อมูลออกมาเป็น Markdown และ JSON แบบแยกคอลัมน์ ตรวจจับตารางอัตโนมัติ เพื่อส่งต่อให้ LLM หรือ Vector database (RAG pipelines) โดยไม่ต้องพึ่ง GPU
3. **Local & Air-Gapped:** การประมวลผลทั้งหมดรันอยู่ภายในเครื่อง Local โดยไม่มีการเรียก API ข้ามเครือข่าย เหมาะสำหรับข้อมูลที่ต้องการความเป็นส่วนตัวและความปลอดภัยสูง

## 2. Technical Code Snippet (Best Practice)

### การแปลง PDF เป็น Markdown สำหรับ LLMs/RAG (`pymupdf4llm`)
```python
import pymupdf4llm

# แปลงเอกสารทั้งไฟล์เป็นโครงสร้าง Markdown (รวมถึงแปลงตารางเป็น Markdown table อัตโนมัติ)
markdown_content = pymupdf4llm.to_markdown("report.pdf")

print(markdown_content)
# ข้อมูลตารางจะปรากฏเป็นโครงสร้าง | col1 | col2 | แทรกสลับอยู่ในเนื้อหา
```

### การดึงรูปภาพออกจาก PDF ทีละหน้า
```python
from pathlib import Path
import pymupdf

doc = pymupdf.open("document.pdf")
output_dir = Path("extracted_images")
output_dir.mkdir(exist_ok=True)

for page_index, page in enumerate(doc):
    for img_index, img in enumerate(page.get_images()):
        xref = img[0]
        pix = pymupdf.Pixmap(doc, xref)
        # จัดการกรณีเป็น CMYK color space ให้แปลงเป็น RGB
        if pix.n > 4:
            pix = pymupdf.Pixmap(pymupdf.csRGB, pix)
        pix.save(output_dir / f"page_{page_index}_img_{img_index}.png")
```

### การทำ OCR บนหน้าสแกนโดยใช้ Tesseract
```python
import pymupdf

doc = pymupdf.open("scanned_document.pdf")
page = doc[0]

# สั่งอ่านตัวอักษรด้วย OCR (ต้องมีการติดตั้ง Tesseract-OCR บน OS และตั้ง PATH เสมอ)
text_page = page.get_textpage_ocr(language="eng")
text = page.get_text(textpage=text_page)
print(text)
```

## 3. Knowledge Relationships
Depends On (ต้องพึ่งพา): [[architecture/tech-stack-2026.md]] (แนวคิดการประมวลผลข้อมูล RAG & AI Pipelines)
