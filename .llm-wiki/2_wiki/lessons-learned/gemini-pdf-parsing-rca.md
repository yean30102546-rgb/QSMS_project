# Root Cause Analysis: Gemini PDF Parsing ช้า/ใช้ไม่ได้

> **Created:** 2026-07-09  
> **Module:** Master Drawing (Storage)  
> **File:** `src/app/api/drawings/route.ts`  
> **Status:** วิเคราะห์เสร็จ — รอผู้ใช้ตัดสินใจเลือกแนวทาง

---

## 1. สรุปปัญหา (Problem Statement)

ก่อนหน้านี้ระบบอัปโหลด PDF Drawing/Master แล้วให้ Gemini แยกข้อมูล (parse) ใช้เวลา **~2-3 วินาที** ได้ปกติ  
หลังจากแก้ไขโค้ดหลายรอบ ระบบกลับ **ค้างไม่ตอบกลับ** หรือ **Error ต่อเนื่อง** จนใช้งานไม่ได้

---

## 2. Root Cause ที่ค้นพบ (3 สาเหตุหลัก)

### 2.1 ❌ Quota หมด: `gemini-2.0-flash` ถูก Rate Limit (429)

**หลักฐาน:**  
```
Quota exceeded for metric: generate_content_free_tier_requests
limit: 0, model: gemini-2.0-flash
```

- Free Tier ของ `gemini-2.0-flash` ถูกใช้จนหมดโควต้า (ทั้ง RPD และ RPM)
- เมื่อ Primary Model (`gemini-3.1-flash-lite`) ล้มเหลว → Fallback ไป `gemini-2.0-flash` → **ล้มเหลวซ้ำเพราะ 429** → ทำให้ดูเหมือน "ค้าง" เพราะรอ Retry
- **นี่คือ Root Cause หลักที่ทำให้ "ก่อนหน้าทำได้ ตอนนี้ทำไม่ได้"** — ไม่ใช่โค้ดพัง แต่ Quota หมด

### 2.2 ⚠️ `inlineData` (Base64 PDF) ไม่เหมาะกับ Production

**ปัญหาเชิงสถาปัตยกรรม:**  
- ส่ง PDF ทั้งไฟล์เป็น Base64 ใน JSON Body → เพิ่มขนาด ~33% จากต้นฉบับ
- PDF 2MB → JSON Body ≈ 2.7MB → แบกทั้ง Next.js API + Network + Gemini API
- ไฟล์ใหญ่หรือซับซ้อน (vector drawings) → Gemini ใช้เวลาประมวลผลนานขึ้นมาก
- **Google แนะนำให้ใช้ Files API** สำหรับ Production แทน `inlineData`

### 2.3 🐛 `pdf-parse` v2 API Breaking Change

- `npm install pdf-parse` ให้ v2.4.5 ซึ่ง API เปลี่ยนทั้งหมด (จาก function เป็น Class)
- Turbopack ของ Next.js 16 ไม่สามารถ handle CJS module ของ pdf-parse ได้ (ทั้ง import, require)
- **ปัญหานี้ถูกแก้แล้ว** โดยเอา pdf-parse ออกทั้งหมด

---

## 3. ข้อมูลจากการทดสอบ API ตรง

| Model | ผลลัพธ์ | Response Time |
|-------|---------|---------------|
| `gemini-3.1-flash-lite` | ✅ ทำงานได้ (text-only) | ~1.2s |
| `gemini-2.0-flash` | ❌ **429 Rate Limit** (Quota หมด) | N/A |

> **สำคัญ:** `gemini-3.1-flash-lite` **ยังทำงานได้ปกติ** สำหรับ text input  
> แต่ยังไม่ได้ทดสอบกับ PDF inlineData จริง (อาจช้ากว่า text มาก)

---

## 4. แนวทางแก้ไข (3 ตัวเลือก)

### Option A: ใช้ Gemini Files API (แนะนำ ⭐)

**แนวคิด:** อัปโหลด PDF ไป Google ก่อน แล้วส่ง File Reference ให้ Gemini แทน Base64

```typescript
// 1. Upload file
const uploadResult = await ai.files.upload({
  file: new File([buffer], 'drawing.pdf', { type: 'application/pdf' }),
});

// 2. Wait for processing
let fileInfo = await ai.files.get({ name: uploadResult.name });
while (fileInfo.state === 'PROCESSING') {
  await new Promise(r => setTimeout(r, 1000));
  fileInfo = await ai.files.get({ name: uploadResult.name });
}

// 3. Generate content with file reference
const response = await ai.models.generateContent({
  model: 'gemini-3.1-flash-lite',
  contents: [
    { fileData: { fileUri: uploadResult.uri, mimeType: 'application/pdf' } },
    { text: parsePrompt },
  ],
});

// 4. Cleanup
await ai.files.delete({ name: uploadResult.name });
```

**ข้อดี:**
- ✅ เร็วกว่า inlineData มาก (file ถูก pre-process ที่ฝั่ง Google)
- ✅ รองรับไฟล์ใหญ่ถึง 2GB
- ✅ ไม่ต้องส่ง Base64 ผ่าน JSON Body (ลดโหลด Network)
- ✅ ไม่ต้องติดตั้ง library เพิ่ม

**ข้อเสีย:**
- ⚠️ เพิ่ม latency ~1-3s สำหรับ upload + processing
- ⚠️ ไฟล์จะถูกเก็บที่ Google 48 ชม. (ต้อง cleanup)
- ⚠️ ต้องรอ state เปลี่ยนจาก PROCESSING → ACTIVE

**ประมาณเวลา:** Total ~3-6s (upload 1-2s + process 1-2s + generate 1-2s)

---

### Option B: แปลง PDF → JPEG แล้วส่งเป็นรูปภาพ (ทางเลือกเร็ว)

**แนวคิด:** ใช้ `pdfjs-dist` (มีอยู่แล้วในโปรเจกต์) แปลงหน้า PDF เป็น JPEG ที่ Client แล้วส่ง JPEG ให้ Gemini Vision

```typescript
// Client-side: Convert PDF page to JPEG
const page = await pdfDoc.getPage(1);
const canvas = document.createElement('canvas');
// ... render to canvas
const jpegBase64 = canvas.toDataURL('image/jpeg', 0.85);

// Server-side: Send as image
const response = await ai.models.generateContent({
  model: 'gemini-3.1-flash-lite',
  contents: [
    { inlineData: { mimeType: 'image/jpeg', data: jpegBase64 } },
    { text: parsePrompt },
  ],
});
```

**ข้อดี:**
- ✅ เร็วมาก (~1-3s) — Gemini ถนัด Vision มากกว่า PDF parsing
- ✅ ไม่ต้องรอ file processing
- ✅ ใช้ `pdfjs-dist` ที่มีอยู่แล้ว
- ✅ ลดขนาด payload (JPEG < PDF)

**ข้อเสีย:**
- ⚠️ สูญเสียข้อมูล text layer ของ PDF (OCR จากรูปภาพแทน)
- ⚠️ ถ้า PDF หลายหน้า ต้อง handle ทีละหน้า
- ⚠️ ความละเอียดรูปอาจไม่พอสำหรับตัวอักษรเล็ก

**ประมาณเวลา:** Total ~1-3s (convert <1s + generate 1-2s)

---

### Option C: ปรับปรุง inlineData เดิม + แก้ Fallback (แก้ไขน้อยสุด)

**แนวคิด:** ใช้โค้ดปัจจุบัน (inlineData) เหมือนเดิม แต่แก้ Fallback logic

**แก้ไข:**
1. เอา `gemini-2.0-flash` ออกจาก Fallback (เพราะ Quota หมด)
2. ใส่ Fallback เป็น `gemini-2.5-flash` หรือ model อื่นที่ยังมี Quota
3. เพิ่ม timeout 30s + AbortController
4. เพิ่ม retry with exponential backoff

**ข้อดี:**
- ✅ แก้ไขน้อยที่สุด
- ✅ ทำงานได้ทันทีถ้า model ยังมี Quota

**ข้อเสีย:**
- ❌ ยังส่ง Base64 ผ่าน JSON Body (ช้า + ใหญ่)
- ❌ พึ่งพา Free Tier Quota ที่อาจหมดอีก
- ❌ ไม่ได้แก้ปัญหาเชิงสถาปัตยกรรม

---

## 5. สรุปเปรียบเทียบ

| เกณฑ์ | Option A (Files API) | Option B (PDF→JPEG) | Option C (ปรับ inlineData) |
|-------|---------------------|---------------------|--------------------------|
| **ความเร็ว** | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ |
| **ความเสถียร** | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| **ความซับซ้อนในการแก้** | ปานกลาง | ปานกลาง | ต่ำ |
| **ต้องติดตั้ง lib ใหม่** | ไม่ | ไม่ (มี pdfjs-dist แล้ว) | ไม่ |
| **รองรับ PDF ซับซ้อน** | ดีมาก | ปานกลาง | ดี (ถ้า Quota ไม่หมด) |
| **ขึ้นกับ Quota** | ใช่ (แต่ลดโหลด) | ใช่ | ใช่มาก |

---

## 6. คำแนะนำ

**แนะนำ Option A (Files API)** เป็นแนวทางหลัก เพราะ:
1. เป็นวิธีที่ Google แนะนำอย่างเป็นทางการสำหรับ Production
2. ลด bandwidth และ payload ลงมาก
3. ไม่ต้องติดตั้ง library เพิ่ม (ใช้ `@google/genai` เดิม)
4. รองรับไฟล์ใหญ่และซับซ้อนได้ดี

**ข้อพิจารณาเพิ่มเติม:**
- ถ้าต้องการประหยัด Quota → ลองใช้ `gemini-2.5-flash` หรือ `gemini-3.1-flash-lite` เท่านั้น
- ถ้าต้องการใช้งานหนัก → พิจารณา Upgrade จาก Free Tier เป็น Pay-as-you-go

---

## 7. อ้างอิง

- [Gemini API PDF Best Practices](https://ai.google.dev/gemini-api/docs/document-processing)
- [Gemini Files API](https://ai.google.dev/gemini-api/docs/files)
- [Rate Limits](https://ai.google.dev/gemini-api/docs/rate-limits)
- `gemini-3.1-flash-lite`: 1M context, รองรับ PDF ≤50MB, 65,536 token limit สำหรับ document input
- `gemini-2.0-flash`: **Free Tier Quota หมดแล้ว** (ณ 2026-07-09)
