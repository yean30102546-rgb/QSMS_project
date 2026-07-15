# Title: Image Upload & Client-Side Compression System
[Updated: 2026-07-14]

## 1. Summary & Current Implementation
ระบบอัปโหลดรูปภาพของ QSMS Rework ประกอบด้วยกระบวนการบีบอัดภาพฝั่งผู้ใช้ (Client-side compression) และการส่งไฟล์รูปภาพหลักฐาน (Evidence Images) โดยการทำ Unsigned Upload ตรงจากเว็บเบราว์เซอร์ (Client-side) ไปยัง Cloudinary เพื่อลดภาระการรับส่งข้อมูล Base64 และลดโหลดบน Backend Server:

1. **Client-side Compression:** ใช้ไลบรารี `browser-image-compression` เพื่อย่อขนาดภาพ JPEG/PNG บน Web Worker เพื่อป้องกันหน้าจอค้าง บีบอัดรูปภาพลงโดยมีขนาดเป้าหมายเฉลี่ย ~300KB (ขนาดไฟล์สูงสุดไม่เกิน 500KB ความกว้าง/สูงไม่เกิน 1280px) ช่วยประหยัดพื้นที่คลังจัดเก็บและแบนด์วิดท์อย่างมีประสิทธิภาพ
2. **Real-time Status Feed:** มีการแสดงสถานะและ Progress Bar ของการทำ Compression (Processing -> Validating -> Compressing -> Complete/Error) พร้อมแสดงสถิติการย่อขนาดไฟล์ในรูปแบบสเปรดเปอร์เซ็นต์
3. **Cloudinary Direct Upload:** ฝั่ง Frontend (ผ่าน `@/src/services/imageUploadService.ts` -> `uploadImageToCloudinary`) จะส่งไฟล์ที่บีบอัดแล้วอัปโหลดผ่าน REST API ไปเก็บยัง Cloudinary Direct Upload (Unsigned Upload Preset) เพื่อความสะดวกรวดเร็ว และได้ CDN Image URLs กลับมาใช้งานทันที
4. **Transaction Integrity & Rollback:** ทุกรายการเคส Rework ต้องมีรูปภาพหลักฐานอย่างน้อย 1 ภาพ (Evidence Integrity) หากรูปภาพเกิดข้อผิดพลาดในการอัปโหลด หรือส่งเคสไม่สำเร็จ ระบบจะบล็อกและทำ Rollback ธุรกรรมทั้งหมดทันทีเพื่อป้องกันข้อมูลขยะสะสม

---

## 2. Technical Code Snippet (Best Practice)

### การบีบอัดภาพด้วย Web Worker
```typescript
import imageCompression from 'browser-image-compression';

const defaultOptions = {
  maxSizeMB: 0.5,             // ขนาดไฟล์สูงสุด 500KB
  maxWidthOrHeight: 1280,     // ด้านกว้างยาวสูงสุดไม่เกิน 1280px
  useWebWorker: true          // รันบน Background thread (Web Worker)
};

export async function compressImage(file: File) {
  try {
    const compressedFile = await imageCompression(file, defaultOptions);
    return { success: true, compressedFile, compressedSize: compressedFile.size };
  } catch (error) {
    return { success: false, error };
  }
}
```

### การทำ Unsigned Upload ตรงไปยัง Cloudinary
```typescript
export async function uploadImageToCloudinary(file: File) {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  const response = await fetch(url, {
    method: 'POST',
    body: formData
  });
  return await response.json();
}
```

---

## 3. Knowledge Relationships & Conflicts
- Depends On (ต้องอ่าน): [[architecture/cloudinary-storage.md]] (สิทธิ์และข้อจำกัดโควตา Rolling Free Tier)
- Impacted By (มีผลต่อ): `AddCaseTab.tsx`, `UpdateModalEdit.tsx` (การแนบรูปหลักฐานและเรียกใช้ service)
- **Contradicts (ข้อขัดแย้งเชิงประวัติ)**:
  - `[Conflict Note - 2026-07-14]`: เอกสารดิบใน `1_raw/` ได้แก่ `IMAGE_UPLOAD_INTEGRATION_GUIDE_1878018805.md`, `IMAGE_UPLOAD_DOCUMENTATION_57135884.md` และ `IMAGE_UPLOAD_BEFORE_AFTER_58881142.md` **ระบุวิธีการอัปโหลดรูปแบบเก่าผ่าน Base64 ไปยัง Google Drive (GAS Backend) ซึ่งล้าสมัยและถูกยกเลิกไปแล้ว** ระบบปัจจุบันใช้ Cloudinary 100% ตามข้อมูลด้านบน

---

## Ingested Raw Sources
- Ingested Raw Source: [[1_raw/IMAGE_UPLOAD_BEFORE_AFTER_58881142.md]] (ข้อมูลเชิงแนวคิดการ Compression และ UI Progress)
- Ingested Raw Source: [[1_raw/IMAGE_UPLOAD_DOCUMENTATION_57135884.md]]
- Ingested Raw Source: [[1_raw/IMAGE_UPLOAD_INTEGRATION_GUIDE_1878018805.md]]

