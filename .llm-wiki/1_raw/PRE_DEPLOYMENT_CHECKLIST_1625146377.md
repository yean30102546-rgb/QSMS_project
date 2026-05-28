# Pre-Deployment Checklist - QSMS Rework Management System
## สำหรับการใช้งานระดับองค์กรเล็ก (ประมาณ 20 คน)

---

## ✅ คุณสมบัติที่ดำเนินการแล้ว

### UI/UX Improvements
- ✅ Removed auto-fill "suggest" for responsible person
- ✅ Added placeholder text (gray) for dropdown selections
- ✅ Changed from modal-based selection to inline button selection for:
  - Leak subtypes (รั่วซึม, รั่วซีลฟอยล์, รั่วตามด)
  - Responsible subdivisions (PDF, WFG, WPK, etc.)
- ✅ Added pagination to Overall tab (max 10 items per page)
- ✅ Image upload with preview (up to 5 images per item)

---

## 🔴 จำเป็นต้องแก้ไข/เพิ่มเติมก่อน Deploy

### 1. **Authentication & Security** ⚠️ สำคัญ
- [ ] **ปัญหา:** ใช้ hardcoded credentials (`admin/admin123`)
- [ ] **วิธีแก้ไข:** 
  - เชื่อมต่อกับระบบ Active Directory หรือ LDAP
  - หรือใช้ Google Authentication (เนื่องจากใช้ Google Apps Script)
  - เก็บ credentials ในปลอดภัยใน .env
  - เพิ่ม Role-Based Access Control (RBAC)
  
**ลำดับความสำคัญ:** 🔴 สูง

---

### 2. **Data Validation & Error Handling** ⚠️ สำคัญ
- [ ] **เพิ่ม validation:**
  - ตรวจสอบ item number อยู่ในระบบ master หรือไม่
  - ตรวจสอบ reason กับ responsible matching logic
  - ตรวจสอบจำนวน (amount) ไม่เป็นลบและมีค่า

- [ ] **Error handling improvements:**
  - แสดง error message ให้ชัดเจน เมื่อการเชื่อมต่อ Google Sheets ล้มเหลว
  - เพิ่ม retry logic สำหรับ API calls
  - แสดง network status indicator

**ลำดับความสำคัญ:** 🔴 สูง

---

### 3. **Image Management** ⚠️ กลาง
- [ ] **ปัญหาปัจจุบัน:** 
  - อัปโหลดรูปที่ Google Drive ตรงนี้ต้องคืนค่า URL หรือ base64
  - ไม่มี image compression (อาจใช้พื้นที่เก็บเยอะ)

- [ ] **วิธีแก้ไข:**
  - เพิ่ม image compression ก่อนอัปโหลด
  - ใช้ thumbnail preview
  - เพิ่ม image deletion capability
  - แสดง upload progress indicator

**ลำดับความสำคัญ:** 🟡 กลาง

---

### 4. **Mobile Responsiveness** ⚠️ กลาง
- [ ] **ทดสอบบน:**
  - iPad / Tablet
  - Mobile phone (iOS & Android)
  - แนวตั้ง vs แนวนอน

- [ ] **ปรับปรุง:**
  - ส่วน form ควรใช้ stack layout บน mobile
  - ขยายขนาดปุ่ม dropdown/inline selection สำหรับแนบ mobile
  - ทำให้ modal/inline selection responsive

**ลำดับความสำคัญ:** 🟡 กลาง

---

### 5. **Data Export & Reporting** 📊
- [ ] **เพิ่ม features:**
  - Export to Excel/CSV (รายงานรายการทั้งหมด)
  - Export to PDF (สำหรับพิมพ์)
  - Filter by date range
  - Filter by status
  - Dashboard charts (รูปแบบสาเหตุ, ผู้รับผิดชอบ, สถานะ)

**ลำดับความสำคัญ:** 🟡 กลาง

---

### 6. **Performance & Optimization**
- [ ] **ประเมิน:**
  - Load time ต่าง ๆ (เมื่อมีข้อมูล 1000+ รายการ)
  - Memory usage ในแอปฯ
  - API response time

- [ ] **ปรับปรุง:**
  - Lazy load cases (infinite scroll หรือ pagination ดีกว่า)
  - Cache data ในระดับ client
  - ลดจำนวน Google Sheets API calls

**ลำดับความสำคัญ:** 🟡 กลาง

---

### 7. **Offline Support** 
- [ ] **เพิ่ม:**
  - Detect offline mode
  - Queue submissions เมื่อ offline
  - Sync เมื่อ online กลับมา
  - Show offline indicator

**ลำดับความสำคัญ:** 🟢 ต่ำ (เลื่อนได้สำหรับ Phase 2)

---

## 🟡 ควรปรับปรุง / Enhancement

### 1. **Notification System**
- [ ] เพิ่ม toast notifications (success/error)
- [ ] เพิ่ม browser notifications (optional)
- [ ] ส่วน error message ควรแสดงข้อมูลเพิ่มเติม

**ลำดับความสำคัญ:** 🟡 กลาง

---

### 2. **User Interface Refinements**
- [ ] ปรับให้ subtitle ของ reason/responsible ชัดเจน
- [ ] เพิ่ม tooltips สำหรับ fields ที่ซับซ้อน
- [ ] ปรับข้อความช่วยเหลือในหน้า Add Case

**ลำดับความสำคัญ:** 🟢 ต่ำ

---

### 3. **Audit Logging**
- [ ] เพิ่ม logging เมื่อ:
  - User ทำการ add/update case
  - User login/logout
  - Error events
- [ ] เก็บ audit logs ใน Google Sheets

**ลำดับความสำคัญ:** 🟡 กลาง (สำหรับ compliance)

---

### 4. **Bulk Operations**
- [ ] เพิ่ม checkbox เลือก multiple cases
- [ ] Bulk update status
- [ ] Bulk export selected cases

**ลำดับความสำคัญ:** 🟢 ต่ำ

---

## 📋 Testing Checklist

- [ ] **Functional Testing:**
  - [ ] Add new case (ทั้งหมด fields)
  - [ ] Update case status
  - [ ] Search/filter cases
  - [ ] Upload images (ทั้ง 5 รูป)
  - [ ] Pagination (next/previous/page numbers)
  - [ ] Form validation (ทดสอบการกรอก invalid data)

- [ ] **Cross-browser Testing:**
  - [ ] Chrome (latest)
  - [ ] Firefox (latest)
  - [ ] Safari (latest)
  - [ ] Edge (latest)

- [ ] **Performance Testing:**
  - [ ] Load time < 3 seconds (normal connection)
  - [ ] Images optimize & load quickly

- [ ] **Security Testing:**
  - [ ] Input sanitization (prevent XSS)
  - [ ] SQL injection prevention (ถ้าใช้ database)
  - [ ] CSRF protection (if applicable)

---

## 🚀 Deployment Steps

### Phase 1: Pre-Deployment (ก่อน Deploy)
1. [ ] ตรวจสอบให้ได้ **Authentication** ถูกต้อง
2. [ ] ตรวจสอบให้ได้ **Error Handling** พอเพียง
3. [ ] ทดสอบบน **staging environment**
4. [ ] รวบรวม user feedback จากการทดสอบ

### Phase 2: Soft Launch (Pilot)
- [ ] Deploy ให้ 2-3 คนทดสอบก่อน
- [ ] รวบรวม feedback
- [ ] แก้ไข critical issues

### Phase 3: Full Rollout
- [ ] Deploy ให้ทั้งองค์กร (20 คน)
- [ ] จัด training session
- [ ] ติดตั้ง documentation

---

## 📱 Browser Support
- Chrome/Chromium (v90+)
- Firefox (v88+)
- Safari (v14+)
- Edge (v90+)

---

## 🔗 Related Documentation
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)
- [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md)

---

## ✏️ Notes
- ระบบปัจจุบันใช้ Google Apps Script สำหรับ backend
- Frontend เป็น React + Vite
- ข้อมูลเก็บใน Google Sheets
- สำหรับองค์กรเล็ก ควรเน้น **ease of use** มากกว่า advanced features

---

**Last Updated:** April 28, 2026
**Status:** Ready for Phase 1 Pre-Deployment
