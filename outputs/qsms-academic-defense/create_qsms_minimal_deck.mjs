import pptxgen from "pptxgenjs";

const pptx = new pptxgen();

// Layout and Colors
pptx.layout = "LAYOUT_16x9";

const C = {
  primary: "659287",
  secondary: "88BDA4",
  accent: "B1D3B9",
  paper: "E6F2DD",
  white: "FFFFFF",
  ink: "2D3F3A",
  muted: "5B756E",
  placeholder: "F0F5EC"
};

const FONT_EN = "Inter";
const FONT_TH = "Sarabun";

// Slide 1: Title
const slide1 = pptx.addSlide();
slide1.background = { color: C.white };
slide1.addShape(pptx.ShapeType.ellipse, { x: 7, y: -2, w: 6, h: 6, fill: { color: C.paper } });
slide1.addShape(pptx.ShapeType.ellipse, { x: 9, y: 3, w: 3, h: 3, fill: { color: C.accent } });

slide1.addText("THESIS DEFENSE", { x: 1, y: 2.2, w: 6, h: 0.5, fontSize: 16, bold: true, fontFace: FONT_EN, color: C.secondary });
slide1.addText("QSMS Rework Management System", { x: 1, y: 2.6, w: 9, h: 1.2, fontSize: 48, bold: true, fontFace: FONT_EN, color: C.primary });
slide1.addText("ระบบบริหารจัดการงานคุณภาพ เอกสารวิศวกรรม\nและการค้นหาความรู้ด้วยปัญญาประดิษฐ์", { x: 1, y: 3.8, w: 8, h: 1.5, fontSize: 24, fontFace: FONT_TH, color: C.ink });
slide1.addShape(pptx.ShapeType.rect, { x: 1, y: 5.5, w: 1.5, h: 0.08, fill: { color: C.secondary } });

function addDivider(sectionNum, enTitle, thSubtitle) {
  const s = pptx.addSlide();
  s.background = { color: C.paper };
  s.addShape(pptx.ShapeType.ellipse, { x: -1, y: 5, w: 4, h: 4, fill: { color: C.white } });
  s.addText(String(sectionNum).padStart(2, '0'), { x: 1, y: 2, w: 2, h: 1, fontSize: 32, bold: true, fontFace: FONT_EN, color: C.secondary });
  s.addText(enTitle.toUpperCase(), { x: 1, y: 2.5, w: 10, h: 1.5, fontSize: 56, bold: true, fontFace: FONT_EN, color: C.primary });
  s.addText(thSubtitle, { x: 1, y: 3.8, w: 10, h: 1, fontSize: 28, fontFace: FONT_TH, color: C.ink });
  return s;
}

function addContentSlide(sectionTitle, title, items, diagramConfig = null) {
  const s = pptx.addSlide();
  s.background = { color: C.white };
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: "100%", h: 0.15, fill: { color: C.secondary } });
  s.addText(sectionTitle.toUpperCase(), { x: 0.6, y: 0.5, w: 5, h: 0.4, fontSize: 14, bold: true, fontFace: FONT_EN, color: C.accent });
  s.addText(title, { x: 0.6, y: 0.9, w: 6, h: 0.8, fontSize: 32, bold: true, fontFace: FONT_TH, color: C.primary });
  
  let currentY = 1.8;
  items.forEach(item => {
    const isSub = item.startsWith("-");
    const label = isSub ? item.substring(1).trim() : item;
    
    s.addShape(pptx.ShapeType.ellipse, { x: 0.6, y: currentY + (isSub ? 0.05 : 0.15), w: 0.08, h: 0.08, fill: { color: C.secondary } });
    
    s.addText(label, { 
      x: 0.8, 
      y: currentY, 
      w: 5.5, 
      h: isSub ? 0.4 : 0.6, 
      fontSize: isSub ? 16 : 20, 
      fontFace: FONT_TH, 
      color: isSub ? C.muted : C.ink,
      bold: !isSub && label.includes(":") 
    });
    
    currentY += isSub ? 0.45 : 0.7;
  });

  if (diagramConfig && diagramConfig.path) {
    // Background for diagram (white clean card style)
    s.addShape(pptx.ShapeType.rect, { x: 6.8, y: 1.5, w: 5.5, h: 5.0, fill: { color: C.white }, line: { color: C.accent, width: 1 } });
    
    // Add image with calculated positions to preserve aspect ratio
    s.addImage({ 
      path: diagramConfig.path, 
      x: diagramConfig.x, 
      y: diagramConfig.y, 
      w: diagramConfig.w, 
      h: diagramConfig.h 
    });
  } else {
    // Image Placeholder right side for screenshots
    s.addShape(pptx.ShapeType.roundRect, { x: 6.8, y: 1.5, w: 5.5, h: 5.0, fill: { color: C.placeholder }, line: { color: C.accent, width: 2 } });
    s.addText("IMAGE PLACEHOLDER\n(Web Application Screenshot)", { x: 6.8, y: 3.5, w: 5.5, h: 1, fontSize: 18, bold: true, fontFace: FONT_EN, color: C.secondary, align: "center" });
  }

  return s;
}

// ---------------------------------------------------------
// Section 1: Background & Significance
// ---------------------------------------------------------
addDivider(1, "Background", "ที่มาและความสำคัญของโครงงาน");

addContentSlide("1. Background & Significance", "ปัญหาของระบบเดิมและเป้าหมาย", [
  "ปัญหาของระบบเดิม:",
  "- การจัดการงาน Rework ใช้กระดาษ/Excel ข้อมูลสูญหายและติดตามยาก",
  "- ฝ่ายบัญชีประเมินต้นทุนผิดพลาด (Under-valuation)",
  "- เกิด Human Error และขาดศูนย์รวมคู่มือการซ่อมแซม",
  "เป้าหมายของโครงงาน:",
  "- พัฒนาระบบ QSMS สู่ความเป็นดิจิทัล (Digitization)",
  "- สร้างศูนย์กลางติดตามงานและประเมินราคาที่แม่นยำโปร่งใส",
  "- นำ AI เข้ามาช่วยลดภาระงานและเพิ่มความถูกต้อง"
]);

// ---------------------------------------------------------
// Section 2: Related Theories & Technologies
// ---------------------------------------------------------
addDivider(2, "Theories", "งานวิจัยและเทคโนโลยีที่เกี่ยวข้อง");

addContentSlide("2. Related Theories & Technologies", "เทคโนโลยีหลักที่ใช้ขับเคลื่อนระบบ", [
  "สถาปัตยกรรมเว็บแอปพลิเคชันสมัยใหม่:",
  "- โครงสร้างแบบ Single Page Application (SPA) ด้วย Next.js และ Supabase",
  "ปัญญาประดิษฐ์เชิงสร้างสรรค์ (Generative AI & RAG):",
  "- Retrieval-Augmented Generation สร้างแชทบอทค้นหาคู่มือซ่อมแซม",
  "- Google Gemini (Multimodal OCR) สกัดข้อมูลจากแบบแปลนอัตโนมัติ",
  "หลักการควบคุมข้อมูล (Data Integrity & Security):",
  "- Transaction Integrity ป้องกันข้อมูลขยะเมื่อเกิดข้อผิดพลาด",
  "- Role-Based Access Control (RBAC) จำกัดสิทธิ์การมองเห็นข้อมูลราคา"
], {
  path: "./outputs/qsms-academic-defense/diagrams/system_architecture.png",
  x: 6.9, y: 2.4, w: 5.3, h: 3.2 // Aspect ratio approx 1.66
});

addContentSlide("2. Related Theories & Technologies", "การออกแบบโครงสร้างฐานข้อมูล (Database ERD)", [
  "การแยกขอบเขตของข้อมูล (Bounded Context):",
  "- แยกฐานข้อมูล Rework DB และ RAG/Drawing DB ออกจากกันอย่างชัดเจน",
  "ความปลอดภัยและความสอดคล้อง:",
  "- REWORK_CASES เชื่อมต่อแบบ Cascade ไปยังรายการสินค้าย่อย",
  "- ฟิลด์ล็อตเก็บข้อมูลละเอียด เช่น mold, boxNumber, line และ gallonDate",
  "- เอกสารความรู้ RAG_DOCUMENTS สลายเป็น Chunks และคำนวณเวกเตอร์",
  "- ตาราง ENGINEERING_DRAWINGS ทำหน้าที่เป็น Master สำหรับแบบแปลน"
], {
  path: "./outputs/qsms-academic-defense/diagrams/database_erd.png",
  x: 7.22, y: 1.6, w: 4.65, h: 4.8 // Aspect ratio approx 0.97
});

// ---------------------------------------------------------
// Section 3: Methodology
// ---------------------------------------------------------
addDivider(3, "Methodology", "ขั้นตอนการดำเนินงาน");

addContentSlide("3. Methodology", "ลำดับขั้นตอนการพัฒนาระบบ", [
  "1. วิเคราะห์และรวบรวมความต้องการ:",
  "- ศึกษาปัญหาจากฝ่ายคลังสินค้า ฝ่ายผลิต และฝ่ายบัญชี",
  "2. ออกแบบระบบ (Design):",
  "- วางโครงสร้างสถาปัตยกรรม และออกแบบหน้าจอ (Soft Glassmorphism)",
  "3. พัฒนาระบบหลัก (Core Development):",
  "- ระบบจัดการใบงาน Rework และบังคับแนบหลักฐาน (Evidence Images)",
  "4. พัฒนาระบบปัญญาประดิษฐ์ (AI Integration):",
  "- ผสานแชทบอท QSMS DocAI และระบบแกะข้อมูล PDF อัตโนมัติ",
  "5. ทดสอบและปรับปรุง (Testing & Refinement):",
  "- ทดสอบ Data Integrity และความเข้ากันได้บนมือถือ (Responsive)"
]);

// ---------------------------------------------------------
// Section 4: Results & Progress
// ---------------------------------------------------------
addDivider(4, "Results", "ผลการทำงานและความคืบหน้า");

addContentSlide("4. Results & Progress", "ผลลัพธ์และความคืบหน้าของโครงการ", [
  "ระบบบริหารจัดการ Rework (เสร็จสมบูรณ์ 100%):",
  "- สร้างใบงาน ถ่ายรูปหลักฐาน ประเมินราคา และออกรายงาน Excel",
  "ฟีเจอร์ AI แกะแบบแปลนอัตโนมัติ (เสร็จสมบูรณ์):",
  "- ดึงสเปกจากไฟล์ PDF ลงฟอร์มได้อัตโนมัติ ลด Human Error",
  "ระบบแชทบอท QSMS DocAI (เปิดใช้งานแล้ว):",
  "- พิมพ์ถามวิธีซ่อมแซมและให้ AI สรุปจากคู่มือวิศวกรรมได้ทันที",
  "สถานะปัจจุบัน (Status):",
  "- ระบบมีความเสถียร (Stable) และพร้อมใช้งานจริง (Production-ready)"
]);

addContentSlide("4. Results & Progress", "ระบบสืบค้นคู่มืออัจฉริยะ (QSMS DocAI)", [
  "กระบวนการนำเข้าคู่มือ (RAG Ingestion Pipeline):",
  "- ผู้ดูแลอัปโหลดเอกสารคู่มือทางเทคนิค (PDF) ผ่านระบบหลังบ้าน",
  "- ระบบอ่านข้อมูลตัวอักษรและแผนภาพหน้าเอกสาร แปลงเป็น Markdown",
  "- แปลงเนื้อหาเป็นเวกเตอร์ 768 มิติด้วย Jina AI Embeddings",
  "- บันทึกข้อมูลและเวกเตอร์ลง Supabase pgvector",
  "- พร้อมสำหรับแชทบอทตอบคำถามโดยอ้างอิงข้อมูลสถิติจริง"
], {
  path: "./outputs/qsms-academic-defense/diagrams/rag_sequence.png",
  x: 6.9, y: 2.75, w: 5.3, h: 2.5 // Aspect ratio approx 2.11
});

addContentSlide("4. Results & Progress", "ระบบสกัดข้อมูลแบบแปลน (Drawing AI Parser)", [
  "การใช้ Gemini AI สกัดวิเคราะห์แบบแปลน:",
  "- อัปโหลดเอกสารแบบแปลน PDF (Engineering Drawings)",
  "- ส่งไฟล์ไปยัง Next.js Route Handlers ประมวลผลแบบ Base64",
  "- Gemini 3.5 Flash ทำหน้าที่ OCR และดึง Metadata แบบโครงสร้าง",
  "- ส่งข้อมูลกลับมากรอกฟอร์มอัปโหลดอัตโนมัติ (Autofill)",
  "- บล็อกการแก้ไขชั่วคราวระหว่างประมวลผล (isProcessing = true)",
  "- ผู้ใช้ตรวจสอบความถูกต้องและกดยืนยันบันทึกลงฐานข้อมูลหลัก"
], {
  path: "./outputs/qsms-academic-defense/diagrams/drawing_sequence.png",
  x: 6.9, y: 2.59, w: 5.3, h: 2.82 // Aspect ratio approx 1.88
});

addContentSlide("4. Results & Progress", "กระบวนการตรวจสอบข้อมูลสินค้า (Two-Way Autofill)", [
  "การทำงาน Two-Way Autofill & Verification:",
  "- ผู้ใช้กรอกรหัสสินค้า ระบบสืบค้นข้อมูลในระบบทันที",
  "- วงจรสถานะความสอดคล้อง (Verification Lifecycle):",
  "  - ข้อมูลถูกต้อง (Verified): อัปโหลดสเปกจาก Item Master อัตโนมัติ",
  "  - สินค้าใหม่ (New): อนุญาตให้บันทึกข้อมูลเพื่ออัปเกรดขึ้นฐานข้อมูล",
  "  - ข้อมูลขัดแย้ง (Conflict): แจ้งเตือนและบล็อกเพื่อป้องกันความผิดพลาด",
  "- บล็อกการบันทึกเมื่อจำนวนสินค้าหรือกล่องเป็น 0 (Zero-Value Restriction)"
], {
  path: "./outputs/qsms-academic-defense/diagrams/autofill_activity.png",
  x: 6.9, y: 1.6, w: 5.3, h: 4.8 // Aspect ratio approx 1.10
});

// ---------------------------------------------------------
// Section 5: Evaluation & Future Work
// ---------------------------------------------------------
addDivider(5, "Evaluation", "ประเมินการทำงานและข้อเสนอแนะ");

addContentSlide("5. Evaluation & Future Work", "จุดแข็งและข้อเสนอแนะเพื่อพัฒนาต่อ", [
  "จุดแข็งและผลสัมฤทธิ์:",
  "- ลดการใช้กระดาษและลดเวลาการทำงาน (Efficiency)",
  "- ระบบป้องกันข้อมูลขัดแย้ง ช่วยยกระดับความถูกต้องของสต็อก",
  "- ต้นทุน Rework ถูกคำนวณโปร่งใสและตรวจสอบย้อนหลังได้ (Traceability)",
  "ข้อเสนอแนะเพื่อพัฒนาต่อ (Future Work):",
  "- การปรับแต่ง (Fine-tune) โมเดล AI ให้เข้าใจศัพท์เฉพาะทางโรงงาน",
  "- การเชื่อมต่อระบบ (API Integration) เข้ากับ ERP หลัก เช่น SAP"
]);

// ---------------------------------------------------------
// Q&A
// ---------------------------------------------------------
const slideQnA = pptx.addSlide();
slideQnA.background = { color: C.primary };
slideQnA.addText("Q & A", { x: 0, y: 3, w: "100%", h: 1, fontSize: 84, bold: true, fontFace: FONT_EN, color: C.white, align: "center" });
slideQnA.addText("Thank you for your attention", { x: 0, y: 4.2, w: "100%", h: 0.5, fontSize: 24, fontFace: FONT_EN, color: C.accent, align: "center" });

const outPath = "./outputs/qsms-academic-defense/QSMS_Minimal_Presentation.pptx";
pptx.writeFile({ fileName: outPath }).then(fileName => {
    console.log(`Created presentation with diagrams: ${fileName}`);
});
