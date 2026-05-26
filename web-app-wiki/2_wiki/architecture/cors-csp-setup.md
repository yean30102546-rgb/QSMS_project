# Title: CORS & Content Security Policy (CSP) Configurations
[วันที่อัปเดต: 2026-05-26]

## 1. Summary & Current Implementation
เนื่องจากแอปพลิเคชัน React/Next.js มีการเชื่อมต่อกับ Google Apps Script (GAS) ข้ามโดเมน จึงจำเป็นต้องตั้งค่าระบบป้องกันความปลอดภัยของเบราว์เซอร์อย่างถูกต้องเพื่อป้องกันปัญหา "Failed to fetch" หรือ "Violates CSP":
1. **CSP Meta Tag ใน index.html:** กำหนดสิทธิ์ให้เว็บบราวเซอร์ยอมรับการเชื่อมต่อ API (`connect-src`), สคริปต์ (`script-src`), และรูปภาพ (`img-src`) จากสับโดเมนต่างๆ ของ Google
2. **CORS Mode ใน Fetch API:** ใช้ `mode: 'cors'` ร่วมกับ `headers: { 'Content-Type': 'text/plain;charset=utf-8' }` สำหรับการเรียก API ข้ามค่าย (GAS รับเฉพาะ `text/plain` ในการป้องกัน CORS Preflight Check)
3. **Centralized CORS ใน GAS:** บน Apps Script ต้องสร้างฟังก์ชัน Wrapper (`createCorsResponse`) เสมอสำหรับแนบ HTTP Response Headers ด้าน CORS ในทุกๆ Endpoint และทุกๆ Error Path

## 2. Technical Code Snippet (Best Practice)

### การตั้งค่า CSP Meta Tag ใน `<head>`
```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.google.com https://*.googleusercontent.com https://*.gstatic.com;
  connect-src 'self' https://*.google.com https://*.googleusercontent.com https://*.gstatic.com https://script.google.com https://script.googleusercontent.com https://*.googleapis.com;
  img-src 'self' data: blob: https://*.google.com https://*.googleusercontent.com https://*.gstatic.com;
  object-src 'none';
">
```

### ฟังก์ชันทำ CORS ใน Google Apps Script (`gas/Code.gs`)
```javascript
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "text/plain;charset=utf-8"
};

function createCorsResponse(responseObj) {
  return ContentService.createTextOutput(JSON.stringify(responseObj))
    .setMimeType(ContentService.MimeType.TEXT)
    .setHeaders(CORS_HEADERS);
}
```

## 3. Knowledge Relationships
Depends On (ต้องพึ่งพา): [[architecture/system-architecture.md]] (สถาปัตยกรรมและการเดินทางของข้อมูล)

Impacted By (ได้รับผลกระทบจาก): [[gas-backend/gas-api.md]] (รายละเอียด Next.js proxy route ไปยังหลังบ้าน)
