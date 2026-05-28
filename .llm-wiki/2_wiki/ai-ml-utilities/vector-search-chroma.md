# Title: Chroma Vector Database (AI Search Infrastructure)
[วันที่อัปเดต: 2026-05-26]

## 1. Summary & Current Implementation
**Chroma** เป็นระบบโครงสร้างพื้นฐานฐานข้อมูลเวกเตอร์แบบ Open-source (Vector Database) ที่ออกแบบมาสำหรับอำนวยความสะดวกในงานประมวลผลโมเดลภาษา (LLM) และการค้นหาเชิงความหมาย (Semantic Search):
1. **Developer-Friendly API:** มีเมธอดหลักเพียงไม่กี่คำสั่งในการจัดการ Collection, การกรอง Metadata, และการ Query ข้อมูลคล้ายคลึงกัน (Similarity Search)
2. **Auto Embedding & Indexing:** Chroma สามารถจัดการแปลงข้อมูลข้อความเป็นเวกเตอร์ (Tokenization & Embeddings) และทำ Index ให้โดยอัตโนมัติ หรือจะเลือกเชื่อมต่อกับ Custom Embeddings ภายนอกเองก็ได้
3. **Javascript & Python Clients:** รองรับทั้ง Python client (`chromadb`) และ JavaScript client (`chromadb` npm package) เพื่อใช้งานในระบบ Web Apps

## 2. Technical Code Snippet (Best Practice)

### การทำงานกับ Chroma DB ด้วย Python (In-Memory & Query)
```python
import chromadb

# เริ่มต้นไคลเอนต์จำลองในหน่วยความจำ (In-memory) หรือระบุพาร์ทบันทึก
client = chromadb.Client()

# สร้างหรือดึงคอลเลกชันเอกสาร
collection = client.get_or_create_collection("rework-knowledge")

# เพิ่มข้อมูลพร้อมระบุเมทาดาต้าและ ID
collection.add(
    documents=["Rework action complete refers to final approval.", "CORS is fixed using proxy."],
    metadatas=[{"category": "policy"}, {"category": "architecture"}],
    ids=["doc_001", "doc_002"]
)

# ค้นหาข้อความที่มีความหมายคล้ายคลึงกัน
results = collection.query(
    query_texts=["How to solve CORS issue?"],
    n_results=1
)
print(results["documents"])
```

## 3. Knowledge Relationships
Depends On (ต้องพึ่งพา): [[architecture/tech-stack-2026.md]] (ความสำคัญของ Vector DB ในแอปพลิเคชันยุค AI)

Impacted By (ได้รับผลกระทบจาก): [[architecture/llm-wiki-pattern.md]] (การดึงข้อมูล Semantic Context ไปยัง Agent)
