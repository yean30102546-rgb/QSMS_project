# Title: Image Processing & Multi-Modal Models (CLIP & Pillow)
[วันที่อัปเดต: 2026-05-26]

## 1. Summary & Current Implementation
**Pillow** (PIL Fork) และ **OpenAI CLIP** (Contrastive Language-Image Pretraining) เป็นคู่ไลบรารีที่จำเป็นในงานประมวลผลรูปภาพและการจับคู่ข้อความกับรูปภาพด้วย AI:
1. **Pillow for Image Operations:** ใช้สำหรับเปิด ปรับแต่งขนาด ครอป และบีบอัดรูปภาพฝั่งเซิร์ฟเวอร์หรือประมวลผลเบื้องต้น (Preprocessing)
2. **CLIP for Zero-Shot Classification:** สามารถจัดหมวดหมู่ภาพหรือตรวจสอบความถูกต้องของภาพโดยอ้างอิงจากคีย์เวิร์ดภาษาธรรมชาติ (Natural Language) แทนการเทรน Classifier ตั้งแต่ต้น
3. **Embeddings & Vector Matching:** เหมาะสำหรับการแปลงรูปภาพเป็น Vector Embeddings เพื่อบันทึกลงฐานข้อมูลเวกเตอร์ (เช่น Chroma) และทำ Image Similarity Search

## 2. Technical Code Snippet (Best Practice)

### การทำงานกับ Pillow ในการแปลงไฟล์และปรับขนาดภาพ
```python
from PIL import Image

def resize_and_convert_image(input_path, output_path, max_size=(800, 800)):
    # เปิดภาพด้วย Pillow
    with Image.open(input_path) as img:
        # ย่อขนาดภาพโดยรักษาสัดส่วน (Aspect Ratio)
        img.thumbnail(max_size)
        # แปลงเป็น RGB (หากไฟล์ต้นฉบับมีช่อง Alpha เช่น PNG เพื่อเซฟเป็น JPEG)
        if img.mode in ("RGBA", "P"):
            img = img.convert("RGB")
        # บันทึกแบบระบุคุณภาพบีบอัดเพื่อประหยัดขนาดไฟล์
        img.save(output_path, "JPEG", quality=85, optimize=True)
```

### การทำ Zero-Shot Image Classification ด้วย CLIP
```python
import torch
import clip
from PIL import Image

# ตรวจสอบการใช้งานการ์ดจอ (CUDA) หรือซีพียู
device = "cuda" if torch.cuda.is_available() else "cpu"
model, preprocess = clip.load("ViT-B/32", device=device)

# เตรียมรูปภาพและแปลงให้เข้ากับฟอร์แมตของโมเดล
image = preprocess(Image.open("rework_part_issue.jpg")).unsqueeze(0).to(device)

# นิยามป้ายกำกับ (Labels) ที่ต้องการตรวจสอบ
text_labels = ["a photo of a packaging defect", "a photo of a normal product", "a scratch on metal"]
text_tokens = clip.tokenize(text_labels).to(device)

with torch.no_grad():
    # คำนวณหาความคล้ายคลึงกัน (Similarity Score)
    logits_per_image, _ = model(image, text_tokens)
    probs = logits_per_image.softmax(dim=-1).cpu().numpy()

# แสดงเปอร์เซ็นต์ความน่าจะเป็นสำหรับแต่ละป้ายกำกับ
for label, prob in zip(text_labels, probs[0]):
    print(f"{label}: {prob * 100:.2f}%")
```

## 3. Knowledge Relationships
Depends On (ต้องพึ่งพา): [[architecture/tech-stack-2026.md]] (ความเข้าใจด้านมัลติโมดอลในสแต็กปี 2026)

Impacted By: [[ai-ml-utilities/vector-search-chroma.md]] (การนำ Image Embeddings ที่ได้จาก CLIP ไปค้นหาใน Chroma)
