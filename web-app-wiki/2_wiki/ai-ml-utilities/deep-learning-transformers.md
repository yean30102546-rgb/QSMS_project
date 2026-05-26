# Title: Hugging Face Transformers (Deep Learning Inference & Serving)
[วันที่อัปเดต: 2026-05-26]

## 1. Summary & Current Implementation
**🤗 Transformers** เป็นเฟรมเวิร์กจัดการและทำงานร่วมกับโมเดล Machine Learning/Deep Learning ระดับ State-of-the-art ทั้งในส่วนประมวลผลข้อความ (NLP), ภาพ (Vision), เสียง (Audio), และมัลติโมดอล (Multimodal):
1. **Pipeline API:** คลาสระดับสูง (High-level Wrapper) ที่ทำหน้าที่ Preprocessing, Inference, และ Postprocessing ข้อมูลเสร็จสรรพในคำสั่งเดียว
2. **Framework Interoperability:** สลับโมเดลระหว่าง PyTorch, TensorFlow 2.0, และ JAX ได้อย่างอิสระ
3. **Unified Chat History Template:** รองรับการจัดเตรียมโครงสร้างแชตและประวัติบทสนทนา (System, User, Assistant Roles) เพื่อสั่งงานโมเดลประเภท Instruct/Chat ได้อย่างแม่นยำ

## 2. Technical Code Snippet (Best Practice)

### การทำงานกับ Text-Generation & Chat History (Python)
```python
import torch
from transformers import pipeline

# ตั้งค่า Pipeline สำหรับสร้างคำตอบแบบ Chat
chat_pipeline = pipeline(
    task="text-generation",
    model="Qwen/Qwen2.5-1.5B-Instruct",
    device_map="auto",
    torch_dtype=torch.bfloat16
)

# โครงสร้างประวัติแชตตามมาตรฐาน
chat_messages = [
    {"role": "system", "content": "You are a professional assistant."},
    {"role": "user", "content": "Explain the benefit of Next.js server actions."}
]

# สั่งประมวลผลโมเดล
response = chat_pipeline(chat_messages, max_new_tokens=256)
print(response[0]["generated_text"][-1]["content"])
```

### การทำ Image-Classification
```python
from transformers import pipeline

classifier = pipeline(task="image-classification", model="facebook/dinov2-small-imagenet1k-1-layer")
results = classifier("https://huggingface.co/datasets/Narsil/image_dummy/raw/main/parrots.png")
# คืนค่าสถิติและความน่าจะเป็นของผลลัพธ์การจำแนกภาพ
```

## 3. Knowledge Relationships
Depends On (ต้องพึ่งพา): [[architecture/tech-stack-2026.md]] (แนวโน้ม AI Integration ในแอปพลิเคชันยุคใหม่)
