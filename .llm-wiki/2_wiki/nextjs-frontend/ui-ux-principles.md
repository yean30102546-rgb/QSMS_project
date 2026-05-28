# UI/UX Design Principles & Portfolio Inspirations
[วันที่อัปเดต: 2026-05-22]

## 1. Summary & Current Implementation
QSMS ใช้แนวทางการออกแบบ **Minimal Monochrome (Apple Pro Style)** ร่วมกับหลักการ UI/UX สากลและ Figma UI Principles เพื่อให้หน้าเว็บเรียบหรู ใช้งานง่าย และไม่สร้างภาระทางสมอง (Cognitive Load) ให้กับผู้ใช้งานโรงงาน (Premium Factory Tools) โดยมุ่งเน้นการจัดลำดับความสำคัญของข้อมูลผ่าน Hierarchy และการแสดงข้อมูลทีละขั้นตามขั้นตอนใช้งาน (Progressive Disclosure)

## 2. Technical Code Snippet (Best Practice)
ตัวอย่างของ Component ที่สอดคล้องกับหลัก UI/UX: ใช้ **Hierarchy** (ขนาดและน้ำหนักตัวอักษรชัดเจน), **Contrast** (ปุ่มบันทึกโดดเด่น ปุ่มลบสีแดงเตือนความปลอดภัย ปุ่มยกเลิกสีเทา), **Feedback** (แสดงความคืบหน้าและสถานะ), และ **Tactile Interactions** ด้วย Framer Motion
```tsx
import { motion } from 'framer-motion';
import { useState } from 'react';
import AppleProgressBar from '../ui/AppleProgressBar';

interface ActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  description: string;
  isDestructive?: boolean;
}

export default function ActionModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  isDestructive = false
}: ActionModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [progress, setProgress] = useState(0);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsSaving(true);
    setProgress(30);
    // จำลองสถานะความคืบหน้า (Feedback)
    const interval = setInterval(() => {
      setProgress((prev) => (prev < 90 ? prev + 15 : prev));
    }, 150);
    
    try {
      await onConfirm();
      setProgress(100);
    } finally {
      clearInterval(interval);
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-[24px] bg-white p-6 shadow-2xl dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50"
      >
        {/* Hierarchy: Title (Bold/Large) vs Description (Medium/Gray) */}
        <h3 className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          {title}
        </h3>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          {description}
        </p>

        {/* Progressive Disclosure & Feedback Area */}
        <div className="mt-6">
          {isSaving ? (
            <div className="w-full py-2">
              <AppleProgressBar value={progress} statusText="กำลังบันทึกข้อมูล..." />
            </div>
          ) : (
            <div className="flex justify-end gap-3">
              {/* Proximity: ปุ่มควบคุมหลักและรองอยู่ใกล้กัน */}
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-300 transition-colors"
              >
                ยกเลิก
              </button>
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleConfirm}
                className={`px-4 py-2 text-sm font-semibold rounded-full text-white shadow-sm transition-colors ${
                  isDestructive 
                    ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200/50 dark:shadow-none' 
                    : 'bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200'
                }`}
              >
                {isDestructive ? 'ลบรายการ' : 'ยืนยัน'}
              </motion.button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
```

## 3. Key UI Design Principles (Figma)
หลักการออกแบบ 7 ข้อหลักจาก Figma และการนำมาปรับใช้ใน QSMS:
1. **Hierarchy (การจัดลำดับภาพ)**:
   - ใช้ขนาดและน้ำหนักของฟอนต์ (Sarabun/SF Pro) เพื่อแยกความสำคัญ (เช่น รหัสเคสหนาเข้ม ข้อมูลรายละเอียดใช้ฟอนต์ปกติสีจาง)
   - วางของที่ผู้ใช้ต้องการมากที่สุดไว้ด้านบนสุด หรือจัดในตำแหน่งที่เข้าถึงง่ายที่สุด
2. **Progressive Disclosure (การแสดงผลตามลำดับ)**:
   - แบ่งขั้นตอนที่ซับซ้อน เช่น การเพิ่มเคส Rework หรือการจองคิว โดยไม่แสดงฟอร์มยาวๆ ทั้งหมดพร้อมกัน
   - ให้ข้อมูลตัวชี้วัดหรือปุ่มบันทึกแสดงเฉพาะช่วงเวลาที่เหมาะสมเพื่อลดภาระทางใจ (Cognitive Load)
3. **Consistency (ความสม่ำเสมอ)**:
   - ออกแบบปุ่ม ขนาดความโค้งมน (`rounded-[20px]` ถึง `rounded-[36px]`) และไอคอนให้ใช้งานและตอบสนองแบบเดียวกันทั้งแอปพลิเคชัน
   - การรักษารูปแบบที่สอดคล้องช่วยให้ผู้ใช้ทำงานได้โดยไม่ต้องหยุดคิดหาปุ่มใหม่
4. **Contrast (ความต่างของสีและขนาด)**:
   - ใช้เฉดสีสูงในการดึงความสนใจไปยังส่วนงานวิกฤต เช่น การใช้ปุ่มบันทึก/ยืนยันสีเข้มตัดกับพื้นหลังสีขาวนวล
   - การทำลายการสอดคล้องอย่างจงใจเพื่อแจ้งเตือน เช่น ปุ่มลบเป็นสีแดง Rose/Red และปุ่มยกเลิกเป็นสีเทา Grayscale
5. **Accessibility (การเข้าถึงสำหรับทุกคน)**:
   - ออกแบบให้ตัวอักษรมี Contrast และขนาดที่เหมาะสมกับผู้ใช้ที่มีปัญหาทางสายตา
   - เพิ่มระยะขอบปุ่มและการเว้นวรรค (Padding) ป้องกันการกดผิดบนมือถือ (Touch Target ขนาดอย่างน้อย 44x44px)
6. **Proximity (ความใกล้ชิดเชิงพื้นที่)**:
   - จัดกลุ่มปุ่มที่ทำหน้าที่คล้ายกันไว้ด้วยกัน (เช่น ปุ่มควบคุมการเล่น หรือปุ่มเซฟ/ยกเลิก)
   - แยกปุ่มที่อาจเกิดผลเสียรุนแรง (เช่น ปุ่มลบเคส) ออกไปอยู่ในตำแหน่งห่างออกไปเพื่อกันการคลิกผิดพลาด
7. **Alignment (การจัดแนวให้ตรง)**:
   - ใช้ระบบ Grid Layout ในการจัดแนวเส้นสายให้สวยงาม เพื่อความเป็นระเบียบ สบายตา และอ่านง่ายขึ้น

## 4. Effective UX/UI Guidelines (BIZIDEA)
หลักปฏิบัติเพิ่มเติมเพื่อเพิ่มประสิทธิภาพของเว็บแอปพลิเคชัน:
- **Usability (การใช้งานที่สะดวก)**: ทุกหน้าต้องมีคำแนะนำหรือสถานะที่ระบุชัดเจน (เช่น Placeholder ในช่องกรอก และ Tooltips ช่วยสอนงาน)
- **User-Centered Design**: หน้าสรุปสถิติต้องตอบคำถามสำคัญของผู้ใช้ได้ทันที เช่น "เคสวันนี้เสร็จกี่เคส?" หรือ "มีงาน Rework ค้างกี่รายการ?" โดยแสดงผลเป็น KPI Metric เด่นชัด
- **Feedback (การตอบสนองที่ชัดเจน)**: ระบบต้องมีการแสดงสถานะการตอบกลับทันทีเมื่อมีการทำรายการ เช่น เมื่อกดบันทึก จะเปลี่ยนรูปเป็นแถบดาวน์โหลด หรือแสดง Apple Toast สำเร็จ

## 5. Inspiring Portfolio UX/UI Patterns (Update 2026)
จากการศึกษาแฟ้มสะสมผลงานของนักออกแบบที่ได้งานทำในบริษัทชั้นนำ มีแนวปฏิบัติที่เป็นเลิศ (Best Practices) ดังนี้:
- **Dynamic Interaction without Distraction**: ใช้แอนิเมชันขนาดเล็ก (Micro-interactions) ที่นุ่มนวล (เช่น Hover ปัด, ปุ่มหดเมื่อคลิก) เพื่อสร้างชีวิตชีวาให้กับ UI โดยไม่ทำให้ผู้ใช้เสียสมาธิ
- **Clean Responsive Structure**: โครงสร้างหน้าเว็บเรียบง่าย สแกนสายตาง่าย มีการออกแบบที่รองรับทุกหน้าจอตั้งแต่มือถือไปจนถึงคอมพิวเตอร์อย่างราบรื่น
- **Competitor Research & User Insights**: การออกแบบไม่ได้ทำตามใจตัวเอง แต่มีข้อมูลการวิจัย ความต้องการ และการแก้ปัญหาของผู้ใช้จริงมาเป็นแกนหลัก
- **Visual Storytelling & Clarity**: นำเสนอรายละเอียดผลลัพธ์ผ่านรูปจำลอง (Mockups) ที่ประณีต สะท้อนถึงทักษะและความใส่ใจในระดับพิกเซล (Pixel-perfect)

## 6. Knowledge Relationships (การเชื่อมโยงข้อมูล)
- **Depends On**: [[nextjs-frontend/design-system.md]] — การใช้ธีมสไตล์ Apple Minimal และ Custom Components
- **Impacted By**: 
  - [[nextjs-frontend/rework-module.md]] — หน้าจองาน Rework ต้องนำหลัก Hierarchy และ Proximity ไปจัดวาง
  - [[nextjs-frontend/portal-shell.md]] — ใช้ Progressive Disclosure และ Feedback ในการสลับหน้าและแสดงตัวอย่างงาน
  - [[nextjs-frontend/roster-module.md]] — ใช้การจัดแนว (Alignment) ของตารางเวรให้อ่านง่ายบนมือถือ
- **Contradicts**: ในอดีต QSMS เคยใช้ UI โทนสีเทาอับทึบบนปุ่มที่โดน Disabled ทำให้ผู้ใช้แยกแยะไม่ได้ ปัจจุบันเปลี่ยนมาใช้ Dedicated Progress Card เมื่อมีการทำธุรกรรมตามหลัก Contrast & Feedback


## Ingested Raw Sources
- Ingested Raw Source: [[1_raw/10 UXUI Design Portfolio Examples to Inspire You (Updated for 2026).md]]
- Ingested Raw Source: [[1_raw/7 Key UI Design Principles + How To Use Them.md]]
- Ingested Raw Source: [[1_raw/LAYOUT_AND_ANIMATION_IMPROVEMENTS_320751320.md]]
- Ingested Raw Source: [[1_raw/LAYOUT_STABILITY_GUIDE_1204891362.md]]
- Ingested Raw Source: [[1_raw/UI_UX_IMPROVEMENTS_CHECKLIST_1247082575.md]]
- Ingested Raw Source: [[1_raw/UI_UX_QUICK_REFERENCE_1041119776.md]]
- Ingested Raw Source: [[1_raw/การออกแบบ UXUI ที่ดี และมีประสิทธิภาพ.md]]
