# Title: Serverless Multimodal RAG (PDF & Excel Integration)
[วันที่อัปเดต: 2026-05-26]

## 1. Summary & Current Implementation
การออกแบบสถาปัตยกรรมสำหรับฟีเจอร์ RAG ใน QSMS Portal เพื่อรองรับการอ่านและเรียนรู้จากเอกสาร 2 รูปแบบหลัก:
1. **ไฟล์ Excel (แบบที่ 1):** เป็นข้อมูลตารางฐานข้อมูลทั่วไป ขนาด < 5MB จะถูกประมวลผลด้วยฝั่งหน้าเว็บแยกทีละแถว/กลุ่มแถว เพื่อสกัดเนื้อหาออกมาทำ Embeddings
2. **ไฟล์ PDF (แบบที่ 2 - สเปกชีต):** เป็นเอกสารหน้าเดียวที่มีตารางซับซ้อนและมีภาพประกอบ ขนาด < 2MB จะถูกย่อยรูปภาพอัปโหลดเข้าสู่ Supabase Storage และส่งหน้าเอกสารทั้งหมดให้ Gemini Vision API แปลงเป็น JSON เพื่อบันทึกเป็นคู่ข้อความและลิ้งก์รูปภาพลง Supabase Database ผ่าน `pgvector`

โครงสร้างนี้ทำงานแบบ Serverless 100% ทำให้ไม่จำเป็นต้องรันเครื่องประมวลผลโลคัลทิ้งไว้ และรองรับการเข้าใช้ของแอดมินคนอื่นๆ ได้พร้อมกันตลอด 24 ชั่วโมง

## 2. Technical Code Snippet (Best Practice)
ตัวอย่างตรรกะเบื้องหลังการส่งข้อมูล PDF หน้ากระดาษและรูปภาพไปยัง Gemini Multimodal API และบันทึกข้อมูลเวกเตอร์ใน Next.js API Routes:

```typescript
// /app/api/rag/ingest-pdf/route.ts
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(req: Request) {
  const { fileUrl, docId } = await req.json(); // ลิ๊งก์ไฟล์ PDF จาก Supabase Storage
  
  // 1. ส่งไฟล์ PDF ให้ Gemini Vision ประมวลผลและแยกโครงสร้างข้อมูล
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: [
      { inlineData: { mimeType: "application/pdf", data: await fetch(fileUrl).then(res => res.arrayBuffer().then(buf => Buffer.from(buf).toString("base64"))) } },
      "จงสกัดข้อมูลทั้งหมดในเอกสารนี้ออกมาเป็น JSON โดยละเอียด และระบุคำอธิบายรูปภาพขวด/ฝา/พาเลทที่มีในหน้า"
    ]
  });

  const structuredContent = response.text;

  // 2. สร้าง Embeddings ของข้อความสกัด
  const embedResponse = await ai.models.embedContent({
    model: "text-embedding-004",
    contents: structuredContent
  });

  const embedding = embedResponse.embedding.values;

  // 3. บันทึกข้อมูลข้อความและเวกเตอร์ลง Supabase (pgvector)
  await supabase.from("document_embeddings").insert({
    document_id: docId,
    content: structuredContent,
    embedding: embedding,
    metadata: {
      source_url: fileUrl,
      images: [
        { name: "bottle_img", url: `https://.../public/rag-images/${docId}/bottle.png` }
      ]
    }
  });

  return Response.json({ success: true });
}
```

## 3. Knowledge Relationships (การเชื่อมโยงข้อมูล)
Depends On (ต้องพึ่งพา): [[architecture/system-architecture.md]] (รันภายใต้สถาปัตยกรรม Next.js API Routes + Supabase Database)

Impacted By (ได้รับผลกระทบจาก): [[ai-ml-utilities/vector-search-chroma.md]] (สลับเปลี่ยนจากการเก็บเวกเตอร์แบบ Local ด้วย Chroma DB มาใช้ Supabase `pgvector` บนคลาวด์)

Contradicts (ข้อขัดแย้งที่เคยพบ): ในอดีตเคยพิจารณาใช้ Python Backend ท้องถิ่น แต่เปลี่ยนเป็น Next.js Native + Gemini Cloud API เนื่องจากความสามารถในด้านมัลติโมเดล (อ่านภาพและ PDF) และการลดค่าใช้จ่ายการดูแลรักษาเซิร์ฟเวอร์ GPU ท้องถิ่น
