# Title: Image Upload & Client-Side Compression System
[วันที่อัปเดต: 2026-05-26]

## 1. Summary & Current Implementation
ระบบอัปโหลดรูปภาพของ QSMS Rework ประกอบด้วยกระบวนการบีบอัดภาพฝั่งผู้ใช้ (Client-side compression) และการแปลงเป็น Base64 เพื่ออัปโหลดไปยัง Google Drive ผ่าน Next.js API Routes:
1. **Client-side Compression:** ใช้ไลบรารี `browser-image-compression` เพื่อย่อขนาดภาพ JPEG/PNG บน Web Worker (เพื่อป้องกันหน้าจอค้าง) บีบอัดลงเหลือสูงสุดไม่เกิน 500KB และความกว้าง/สูงไม่เกิน 1280px ช่วยลดแบนด์วิดท์ลงได้ 80-90%
2. **Real-time Status Feed:** มีสถานะบอกความคืบหน้าการทำงาน (Processing -> Uploading -> Complete/Error) พร้อมแสดงสถิติการย่อขนาดไฟล์
3. **GAS Integration:** ฝั่ง Google Apps Script ใน `gas/Code.gs` จะรับ Base64 จาก Next.js Proxy, ถอดรหัส, สร้างโฟลเดอร์สำหรับเคสนั้นๆ บน Google Drive และเซฟเป็นไฟล์รูปภาพส่งลิงก์ URL กลับมาบันทึกในฐานข้อมูล

## 2. Technical Code Snippet (Best Practice)

### การบีบอัดภาพด้วย Web Worker
```typescript
import imageCompression from 'browser-image-compression';

const defaultOptions = {
  maxSizeMB: 0.5,             // ขนาดไฟล์สูงสุด 500KB
  maxWidthOrHeight: 1280,     // ด้านกว้างยาวสูงสุดไม่เกิน 1280px
  useWebWorker: true          // รันบน Background thread
};

export async function compressImage(file: File) {
  try {
    const compressedFile = await imageCompression(file, defaultOptions);
    return { success: true, compressedFile };
  } catch (error) {
    return { success: false, error };
  }
}
```

### การอัปโหลด Base64 ไปยัง GAS
```typescript
export async function uploadImageToGAS(file: File, gasUrl: string) {
  const base64Data = await fileToBase64(file);
  const response = await fetch(gasUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({
      action: 'uploadImage',
      imageData: base64Data,
      fileName: file.name,
      fileType: file.type
    })
  });
  return await response.json();
}
```

## 3. Knowledge Relationships
Depends On (ต้องพึ่งพา): [[nextjs-frontend/rework-module.md]] (คอมโพเนนต์สำหรับบันทึกรายการ Rework)

Impacted By (ได้รับผลกระทบจาก): [[gas-backend/gas-api.md]] (การจัดการ Action `uploadImage` และถอดรหัส Base64 ฝั่งหลังบ้าน)
