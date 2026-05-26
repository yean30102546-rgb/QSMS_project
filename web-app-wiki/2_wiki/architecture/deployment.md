# Title: QSMS Deployment Architecture & Guide
[วันที่อัปเดต: 2026-05-26]

## 1. Summary & Current Implementation
คู่มือนี้รวบรวมขั้นตอนการ Deploy ระบบ QSMS Rework & Roster Management แบบครบวงจร:
1. **Google Apps Script (GAS) Deployment:** ทำหน้าที่เป็น API Gateway เข้าถึง Google Sheets และ Drive โดยรันภายใต้สิทธิ์ของเจ้าของชีต (Execute as Me) และเปิดการเข้าถึงเป็นสาธารณะ (Who has access: Anyone) เพื่อรองรับการทำงานของ CORS โดยอัตโนมัติ
2. **Next.js Proxy API Router:** จัดการเชื่อมโยง Request จาก Browser ไปยัง GAS URL ที่บันทึกไว้ใน Environment Variables (`GAS_WEB_APP_URL` และ `GAS_CALENDAR_WEB_APP_URL`) เพื่อความปลอดภัยและหลีกเลี่ยง CORS ในฝั่ง Client
3. **Google Sheets Initialization:** การตั้งค่าโครงสร้างชีต `Rework Cases`, `ItemMaster`, `Backup` และคอลัมน์มาตรฐาน

## 2. Technical Code Snippet (Best Practice)

### การตั้งค่า Google Apps Script Web App (สำหรับ CORS)
เมื่อ Deploy ใหม่ใน Google Apps Script ให้เลือกคุณสมบัติดังนี้:
* **Deployment type:** Web app
* **Execute as:** Me (อีเมลเจ้าของชีต)
* **Who has access:** Anyone (เพื่อหลีกเลี่ยงปัญหา CORS block และรับประกันการคุยข้ามโดเมน)

### การตั้งค่า GAS Script Properties (หลีกเลี่ยงการ Hardcode ข้อมูลลับ)
ตั้งค่าข้อมูลลับในแถบ Project Settings -> Script Properties ใน Google Apps Script Editor:
```text
AUTH_TOKEN_SECRET = [คีย์เข้ารหัส JWT สำหรับสร้าง Token]
QSMS_PIN          = 123456 (หรือ PIN สำหรับ Operator)
QSMS_EMAIL        = qsms@company.com
QSMS_ROLE         = OPERATOR
WFG_PIN           = 654321
WFG_ROLE          = OPERATOR
```

## 3. Knowledge Relationships
Depends On (ต้องพึ่งพา): [[architecture/system-architecture.md]] (สถาปัตยกรรมระบบองค์รวม), [[gas-backend/gas-api.md]] (รายละเอียด API Actions ที่เรียกใช้งาน)

Impacted By (ได้รับผลกระทบจาก): [[google-sheets/schema.md]] (โครงสร้างคอลัมน์และตารางใน Google Sheets)
