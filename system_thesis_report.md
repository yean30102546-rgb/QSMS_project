# รายงานโครงการ: ระบบจัดการงานแก้ไขสินค้าค้างคลัง (QSMS Rework Management System)

เอกสารรายงานฉบับนี้เป็นคู่มือเชิงวิชาการและวิศวกรรมซอฟต์แวร์โดยละเอียดของระบบ QSMS Rework Management System เพื่อใช้ประกอบวิทยานิพนธ์และการนำเสนอผลงานระดับทางการ โดยอิงตามหลักการออกแบบและมาตรฐานทางวิศวกรรมซอฟต์แวร์

---

## บทที่ 1: บทนำ (Introduction)

### 1.1 ความเป็นมาและความสำคัญของปัญหา
ในห่วงโซ่อุปทานอุตสาหกรรมปิโตรเคมีและการบรรจุผลิตภัณฑ์น้ำมันหล่อลื่น ความเร็วและความแม่นยำในการจัดการสินค้าที่พบข้อบกพร่อง (Non-Conformance) เป็นปัจจัยสำคัญต่อต้นทุนการผลิต สินค้าที่ไม่ได้คุณภาพตามเกณฑ์ เช่น ถังรั่วซึม บรรจุภัณฑ์เปื้อนคราบน้ำมัน หรือฝาเกลียวปิดไม่สนิท จำเป็นต้องได้รับการนำเข้ากระบวนการซ่อมแซมและแก้ไขใหม่ (Rework) 

แต่เดิม โรงงานอุตสาหกรรมอาศัยการจดบันทึกกระบวนการ Rework บนกระดาษและการกรอกข้อมูลด้วยตนเอง (Manual Data Entry) ส่งผลให้เกิดปัญหาวิกฤต 3 ประการ:
1. **Human Error ในการป้อนข้อมูล:** พนักงานคีย์รหัสสินค้า รหัสแบบแปลน และเลขล็อตผิดพลาด ทำให้ข้อมูลสต็อกขัดแย้งกับความเป็นจริง
2. **การสูญหายของหลักฐาน (Evidence Leakage):** ภาพถ่ายความเสียหายของแกลลอนหรือกล่องไม่ถูกจัดเก็บร่วมกับข้อมูลธุรกรรมหลักฐานในฐานข้อมูล หรือสูญหายไประหว่างกระบวนการส่งต่อ
3. **การประเมินต้นทุนการเงินผิดพลาด (Financial Inaccuracy):** ฝ่ายบัญชีไม่สามารถเข้าถึงข้อมูลค่าวัสดุที่ใช้จริง (เช่น ฝาสำรอง, กล่องแพ็คใหม่) และชั่วโมงการทำงานจริงของพนักงานฝ่ายผลิตได้แบบเรียลไทม์ ทำให้ประเมินราคา Rework ต่ำกว่าความเป็นจริง (Under-valuation)

ระบบ QSMS Rework Management System จึงถูกพัฒนาขึ้นเพื่อเปลี่ยนผ่านสู่การทำงานแบบดิจิทัล (Digitization) โดยผสานปัญญาประดิษฐ์ (AI Document Parsing) เพื่อคัดแยกแบบแปลนและลดการป้อนข้อมูล พร้อมรักษาระดับความถูกต้องของสต็อกและประเมินราคางานซ่อมแซมอย่างเป็นระบบ

### 1.2 วัตถุประสงค์ของโครงการ
1. **Centralized Tracking:** พัฒนาระบบรวมศูนย์จัดการใบงาน Rework (Rework Cases) และรายการย่อย (Rework Items) ที่เป็นเรียลไทม์ผ่านเว็บแอปพลิเคชัน
2. **AI-Driven Data Extraction:** นำเทคโนโลยี OCR Multimodal ผ่านโมเดลภาษาขนาดใหญ่ (Google Gemini API) มาใช้แกะโครงสร้าง Metadata จากภาพและไฟล์เอกสารแบบแปลนโดยอัตโนมัติ
3. **Data & Image Integrity:** รับประกันความสอดคล้องของรูปภาพหลักฐานและข้อมูลธุรกรรม (Transaction Integrity) โดยป้องกันการอัปโหลดไฟล์ขยะเมื่อบันทึกข้อมูลไม่สำเร็จ
4. **Role-Based Access Control (RBAC):** จำกัดสิทธิ์และขอบเขตการทำงานของพนักงานแต่ละฝ่าย (Admin, Operator, Finance, PDB) เพื่อป้องกันการเข้าถึงและการแก้ไขข้อมูลทางการเงินโดยไม่มีอำนาจหน้าที่

### 1.3 ขอบเขตของระบบ (System Scope)
* **Frontend Application:** เว็บแอปพลิเคชันแบบ Single Page Application (SPA) ที่ตอบสนองได้รวดเร็ว พัฒนาด้วย React และ Tailwind CSS รองรับการปรับขนาดหน้าจอบนอุปกรณ์แท็บเล็ตและสมาร์ทโฟนของเจ้าหน้าที่หน้างาน (Responsive Design)
* **Backend API Gateway:** พัฒนาด้วย Next.js Route Handlers ทำหน้าที่เป็นด่านความปลอดภัยหน้าด่าน (API Security Boundary) เพื่อซ่อนข้อมูล API Key, เชื่อมต่อ Supabase DB และ Proxy คำสั่งไปยังระบบ Google Apps Script (GAS)
* **Database & Attachment Storage:** ใช้ฐานข้อมูล PostgreSQL บน Supabase เพื่อการคัดกรองข้อมูลความเร็วสูง และใช้ Cloudinary สำหรับการทำ Image Hosting รูปภาพหลักฐานงานซ่อมแซม

---

## บทที่ 2: ทฤษฎีและเทคโนโลยีที่เกี่ยวข้อง (Literature Review & Technologies)

### 2.1 Feature-Sliced Design (FSD) และสถาปัตยกรรมระดับโมดูล
การสลายส่วนประกอบขนาดยักษ์ (Monolithic Components) เพื่อเอื้อต่อการบำรุงรักษาระยะยาวในโครงการนี้ ใช้แนวคิดการออกแบบซอฟต์แวร์ตามหลักการ **Separation of Concerns (SoC)** (Dijkstra, 1974) และแนวทาง **High Cohesion, Low Coupling** (Stevens et al., 1974) ด้วยโครงสร้าง **Feature-Sliced Design (FSD)** 

FSD จะแบ่งแยกไฟล์และโค้ดของระบบหน้าบ้านออกเป็น 3 เลเยอร์หลักตามหน้าที่:
* **Features:** ฟังก์ชันการทำงานย่อยที่ส่งมอบคุณค่าทางธุรกิจ (เช่น ระบบอัปโหลดและส่งตรวจทานแบบแปลน)
* **Entities:** โมเดลข้อมูลธุรกิจและหน่วยแนวคิดของระบบ (เช่น โครงสร้างข้อมูล Drawing, ข้อมูล Rework Case)
* **Shared:** โมดูลเครื่องมือที่ใช้ร่วมกันในระบบ (เช่น สไตล์ UI, Client ซิงค์ข้อมูลกับ Supabase)
การใช้ SoC ในลักษณะนี้ทำให้นักพัฒนาสามารถปรับแต่ง logic หรือทดสอบส่วนประกอบย่อยทีละส่วนโดยไม่รบกวนการทำงานอื่น

### 2.2 Next.js API Gateway & API Security Boundary
เพื่อความปลอดภัยในระดับอุตสาหกรรม ระบบเลือกใช้โครงสร้าง **API Gateway Pattern** (Richardson, 2018) ผ่านระบบ Next.js API Route Handlers หน้าด่าน ตัวเซิร์ฟเวอร์จะคัดกรองสิทธิ์และคีย์สิทธิ์ของผู้ใช้เพื่อแปลงสัญญาณ Proxy ไปยัง Google Apps Script (GAS) ด้านหลัง ป้องกันการโจมตีประเภท Server-Side Request Forgery (SSRF) และซ่อนข้อมูล Credentials ทั้งหมดไม่ให้รั่วไหลไปสู่ฝั่งไคลเอนต์

### 2.3 Supabase (PostgreSQL) และสถาปัตยกรรม ACID Transactions
การรักษาความสอดคล้องและความสมบูรณ์ของสต็อกสินค้าและรายงานการเงินของใบงาน Rework ต้องเป็นไปตามหลักการ **ACID (Atomicity, Consistency, Isolation, Durability)** (Haerder & Reuter, 1983) บนฐานข้อมูลเชิงสัมพันธ์เชิงวัตถุ PostgreSQL (Codd, 1970) บนคลาวด์ Supabase 
ข้อมูลความสัมพันธ์ของโมดูล Drawing และ Master จะยึดหลักเกณฑ์ความสัมพันธ์แบบ Referential Integrity เพื่อให้มั่นใจได้ว่าข้อมูลคู่มาสเตอร์จะไม่เกิดลักษณะข้อมูลกำพร้า (Orphan Records) และมีระบบ Database Triggers ช่วยปรับเวอร์ชันแบบอัปเดตของแบบแปลนโดยอัตโนมัติ

### 2.4 Cloudinary และสถาปัตยกรรม Distributed Image Compression
การอัปโหลดไฟล์หลักฐานรูปภาพ Rework ขนาดใหญ่ผ่านเครือข่ายอินเทอร์เน็ตของคลังสินค้าใช้หลักการประหยัดทรัพยากรการประมวลผลและการถ่ายโอนผ่าน **Unsigned Client-Side upload** ร่วมกับ **Lossy Image Compression** บนเบราว์เซอร์เป้าหมายไม่เกิน 300KB เพื่อควบคุมประสิทธิภาพการส่งถ่ายข้อมูลผ่านสเปกการบีบอัดรูปภาพมาตรฐาน

### 2.5 Retrieval-Augmented Generation (RAG) และ Jina AI Embeddings
สถาปัตยกรรม **Retrieval-Augmented Generation (RAG)** (Lewis et al., 2020) ช่วยให้ AI ตอบคำถามจากเล่มคู่มือโรงงานได้อย่างแม่นยำ ปราศจากปัญหาการคิดขึ้นเองหรือข้อมูลบิดเบือน (Hallucination) โดยการประมวลผลใช้แนวคิด **Vector Space Model** (Salton et al., 1975) แปลงข้อความที่ตัดแบ่งเป็นท่อน (Semantic Chunking) ให้กลายเป็นเวกเตอร์พิกัด 768 มิติด้วยโมเดล `jina-embeddings-v5-text-small` และเปรียบเทียบระยะห่างทางคณิตศาสตร์ด้วยฟังก์ชัน Cosine Similarity บน Supabase pgvector เพื่อดึงท่อนข้อมูลที่มีความคล้ายคลึงของเนื้อหาสูงสุดขึ้นมาประกอบเป็นบริบทส่งต่อให้ Gemini AI สตรีมมิ่งคำตอบกลับไปยังเจ้าหน้าที่หน้างาน

---

## บทที่ 3: การออกแบบระบบ (System Design)

### 3.1 โครงสร้างฐานข้อมูล (Database Schema)

ตารางหลักสำหรับการจัดเก็บข้อมูลวิศวกรรมและการซ่อมแซมประกอบด้วยฟิลด์ดังนี้:

#### 1) ตาราง `engineering_drawings` (สำหรับจัดเก็บเอกสาร Drawing และ Master Spec)
| ชื่อฟิลด์ | ประเภทข้อมูล | คำอธิบาย |
| :--- | :--- | :--- |
| `id` | UUID (PK) | ไอดีอ้างอิงเอกสารหลัก |
| `drawing_number` | VARCHAR | เลขที่แบบแปลนเอกสาร (เช่น D-0410, SM-ENTH-0014) |
| `revision` | VARCHAR | เลขเวอร์ชันการแก้ไขแบบ (เช่น 00, 01) |
| `part_name` | VARCHAR | ชื่อผลิตภัณฑ์ของทางคู่ค้าหรือโรงงาน |
| `customer_name` | VARCHAR | ชื่อลูกค้าคู่ค้า (เช่น ENEOS, HONDA) |
| `item_code` | VARCHAR (Null) | รหัสสินค้าฝั่งลูกค้า (เช่น 40001937) |
| `item_number` | VARCHAR (Null) | รหัสสินค้าภายในของฝ่ายผลิตเอง (เช่น 6023670E800A) |
| `issue_date` | DATE | วันที่ออกเอกสารอย่างเป็นทางการ |
| `package_size` | VARCHAR | ขนาดความจุบรรจุภัณฑ์ (เช่น 1L x 12, 200 L.) |
| `oil_group` | VARCHAR | กลุ่มน้ำมัน (บังคับค่า: ENGINE OIL หรือ GEAR OIL เท่านั้น) |
| `pallet_type` | VARCHAR | ประเภทพาเลทจัดเรียง (เช่น ไม้สีฟ้า, พลาสติก) |
| `boxes_per_pallet` | INTEGER | จำนวนกล่องสูงสุดต่อพาเลท |
| `shelf_life` | VARCHAR | อายุการใช้งานของผลิตภัณฑ์ |
| `type` | VARCHAR | แยกประเภทเอกสาร (`drawing` = ลูกค้า, `master` = มาสเตอร์ผลิต) |
| `is_active` | BOOLEAN | สถานะการใช้งานจริง (สลับเป็น False เมื่อมีการอัปโหลดเวอร์ชันใหม่ซ้ำเข้ามา) |
| `r2_key` | VARCHAR | คีย์อ้างอิงที่อยู่ไฟล์ใน Object Storage |

#### 2) ตาราง `rework_cases` (ข้อมูลใบงาน Rework Case)
| ชื่อฟิลด์ | ประเภทข้อมูล | คำอธิบาย |
| :--- | :--- | :--- |
| `id` | VARCHAR (PK) | รหัสใบงานซ่อมแซมคีย์หลัก (เช่น RW012-2026) |
| `case_name` | VARCHAR | ชื่อใบงานอ้างอิง |
| `status` | VARCHAR | สถานะเคส (`Pending`, `In-Progress`, `Awaiting Valuation`, `Completed`) |
| `total_rework_cost` | NUMERIC | ยอดคำนวณรวมมูลค่าความเสียหาย (ค่าแรง + ค่าวัสดุ) |
| `customer_name` | VARCHAR | ลูกค้าปลายทางของผลิตภัณฑ์นี้ |

### 3.2 ตารางเปรียบเทียบสิทธิ์ผู้ใช้งาน (Role & Permission Matrix)

| สิทธิ์ / บทบาท | จัดการผู้ใช้งาน | สร้าง/แก้ไข Rework Case | บันทึกค่าแรง/วัสดุซ่อม | ประเมินและอนุมัติราคาจริง | จัดการ Drawing & Master |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Admin** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Operator** | ❌ | ✅ | ✅ | ❌ | ❌ |
| **Finance** | ❌ | ❌ | ❌ | ✅ | ❌ |
| **PDB** | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## บทที่ 4: กระแสการทำงานหลักและโครงสร้างซอร์สโค้ด (Key Workflows & Implementation)

### 4.1 กระบวนการวิเคราะห์ภาพวาดวิศวกรรมแบบมัลติโหมดด้วย AI (Multimodal AI Drawing Parsing)
เมื่ออัปโหลดภาพแผนงานเข้ามา ระบบประมวลผลโดยส่งคำร้องพร้อมไฟล์ Base64 ไปยัง Gemini Multimodal API (Gemini Team, Google, 2023) เพื่อแกะข้อความด้วยวิธีกำหนด Boundary ตามข้อตกลง

* **การแยกข้อมูลแบบแปลนลูกค้า (Customer Drawing Layout):** ตามสถาปัตยกรรมข้อมูลที่กำหนด จะมุ่งเน้นการดึงข้อมูล `item_code` ของลูกค้า และงดการเก็บค่ารหัส `item_number` ภายใน เพื่อรักษาขอบเขตข้อมูลลูกค้า
* **การคัดกรองข้อมูลเพื่อจัดเก็บแบบมีมาตรฐาน:**
```typescript
const normalizeCustomerName = (name: string | null | undefined): string | null | undefined => {
  if (!name) return name;
  const lower = name.toLowerCase();
  
  if (lower.includes('eneos')) {
    return 'ENEOS';
  }
  if (lower.includes('honda')) {
    return 'HONDA';
  }
  return name;
};
```

* **การคัดกรองกลุ่มประเภทน้ำมันเพื่อจัดหมวดหมู่ฐานข้อมูล:**
```typescript
const normalizeOilGroup = (group: string | null | undefined): string | null => {
  if (!group) return null;
  const clean = group.trim().toUpperCase();
  if (clean === 'ENGINE OIL' || clean.includes('ENGINE') || clean.includes('MOTOR') || clean.includes('เครื่องยนต์') || clean.includes('ดีเซล') || clean.includes('เบนซิน')) {
    return 'ENGINE OIL';
  }
  if (clean === 'GEAR OIL' || clean.includes('GEAR') || clean.includes('เกียร์')) {
    return 'GEAR OIL';
  }
  return null; // ค่าอื่นๆ นอกเหนือจากนี้จะถูกปัดเป็น null
};
```

### 4.2 ตรรกะเครื่องสถานะระบบตรวจสอบแบบสองทาง (Two-Way Verification Finite State Machine)
กระบวนการตรวจสอบข้อมูลระหว่าง Rework Items และฐานข้อมูลหลักดำเนินการตามแบบแผน **Finite State Machine (FSM)** ในการระบุและเปลี่ยนผ่านสถานะข้อมูลดังนี้:

```text
       [ Idle ] 
          │
          ▼  (ผู้ใช้ป้อนรหัสตรวจสอบสินค้า)
      [ Checking ]
          │
          ├───────────────┼───────────────┐
          ▼ (มีในคลัง)      ▼ (ไม่พบคีย์)     ▼ (ข้อมูลขัดแย้ง)
     [ Verified ]       [ New ]      [ Conflict ]
```
* **Verified:** ดึงข้อมูลขนาดบรรจุภัณฑ์และกลุ่มน้ำมันจากฐานข้อมูล Item Master มติอัตโนมัติช่วยลดโอกาสพนักงานคีย์ข้อมูลผิดพลาด
* **New:** บังคับผู้ใช้คีย์ข้อมูลแมนนวล และระบบจะสั่งธุรกรรม Smart Master Upsert ไปเพิ่มสินค้าใหม่นี้เข้าสู่คลัง Item Master ทันทีในพื้นหลัง

---

## บทที่ 5: การทดสอบและบทสรุป (Verification & Conclusion)

### 5.1 การทดสอบระดับหน่วยด้วย Vitest (Unit Testing)
ในการประเมินประสิทธิภาพและควบคุมคุณภาพข้อมูล ระบบใช้ Vitest สำหรับตรวจสอบสเปกของการจัดกลุ่มประเภทบรรจุภัณฑ์ตามปริมาตรความจุผลิตภัณฑ์ (`getPackageSizeGroup`) เพื่อแบ่งแยกขนาดสินค้าส่งต่อไปยังขั้นตอนจัดสถิติรายงาน

โค้ดชุดการทดสอบ unit test บนระบบทดสอบจริง:
```typescript
import { describe, it, expect } from 'vitest';

function getPackageSizeGroup(size: string): 'Small' | 'Pail' | 'IBC' | 'Other' | null {
  if (!size) return null;
  const num = parseFloat(size);
  if (isNaN(num)) return 'Other';
  if (num < 20) return 'Small';
  if (num < 1000) return 'Pail';
  return 'IBC';
}

describe('Package Size Grouping Test Suite', () => {
  it('ควรจัดผลิตภัณฑ์ความจุน้อยกว่า 20 ลิตร เป็นกลุ่ม Small', () => {
    expect(getPackageSizeGroup('1L x 12')).toBe('Small');
    expect(getPackageSizeGroup('4L')).toBe('Small');
    expect(getPackageSizeGroup('18 L.')).toBe('Small');
  });

  it('ควรจัดผลิตภัณฑ์ความจุ 20 ถึง 999 ลิตร เป็นกลุ่ม Pail', () => {
    expect(getPackageSizeGroup('20 L.')).toBe('Pail');
    expect(getPackageSizeGroup('200L')).toBe('Pail');
  });

  it('ควรจัดผลิตภัณฑ์ความจุ 1000 ลิตรขึ้นไป เป็นกลุ่ม IBC', () => {
    expect(getPackageSizeGroup('1000 L.')).toBe('IBC');
    expect(getPackageSizeGroup('1200L')).toBe('IBC');
  });
});
```

### 5.2 การทดสอบกระบวนการดำเนินงานแบบรวมศูนย์ E2E (Playwright)
ระบบผ่านการประเมินคุณภาพด้วยชุดทดสอบอัตโนมัติ Playwright โดยครอบคลุม:
1. **Zero-Value Restriction:** ทดสอบความสมบูรณ์ของระบบควบคุม โดยเมื่อพนักงานใส่จำนวนสินค้าเป็น `0` ปุ่มบันทึกจะอยู่ในสถานะ `disabled` และระบบจะบล็อกการส่ง API โดยตรง เพื่อรับประกันความสอดคล้องทางบัญชี (Accounting Consistency)
2. **Document Sorting:** ทดสอบปุ่มการจัดตารางในหน้า Drawings ว่าสามารถจัดเรียงลำดับแถวตามดัชนี **Customer Item Code** ได้ถูกต้องตามลำดับตัวอักษร

### 5.3 บทสรุปโครงการ (Conclusion)
ระบบ QSMS Rework Management System ช่วยลดการป้อนข้อมูลผิดพลาดโดยเจ้าหน้าที่ลงได้อย่างมีนัยสำคัญ ผ่านการทำงานร่วมกับ AI OCR ดึงข้อมูลแม่นยำ พร้อมทั้งช่วยจัดประเภทกลุ่มสินค้าและคำนวณค่าใช้จ่ายในการ Rework ได้อย่างมีระเบียบและโปร่งใส

---

## บรรณานุกรม (References)

1. Codd, E. F. (1970). *A relational model of data for large shared data banks*. Communications of the ACM, 13(6), 377-387.
2. Dijkstra, E. W. (1974). *On the role of scientific thought*. Selected Writings on Computing: A Personal Perspective, 60-66.
3. Gemini Team, Google. (2023). *Gemini: A family of highly capable multimodal models*. arXiv preprint arXiv:2312.11805.
4. Haerder, T., & Reuter, A. (1983). *Principles of transaction-oriented database recovery*. ACM Computing Surveys (CSUR), 15(4), 287-317.
5. Lewis, P., Perez, E., Piktus, A., Petroni, F., Lewis, V., Riedel, S., & Kiela, D. (2020). *Retrieval-augmented generation for knowledge-intensive nlp tasks*. Advances in Neural Information Processing Systems, 33, 9459-9474.
6. Richardson, C. (2018). *Microservice patterns: with examples in Java*. Manning Publications.
7. Salton, G., Wong, A., & Yang, C. S. (1975). *A vector space model for automatic indexing*. Communications of the ACM, 18(11), 613-620.
8. Stevens, W. P., Myers, G. J., & Constantine, L. L. (1974). *Structured design*. IBM Systems Journal, 13(2), 115-139.
