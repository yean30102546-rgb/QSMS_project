import type { FeedbackCategory, FeedbackModule, DeviceMetadata } from '@/src/types/feedback';

export interface FeedbackRecord {
  id: string;
  evaluatorCode: string;
  department: string;
  positionTitle: string;
  category: FeedbackCategory;
  module: FeedbackModule;
  rating: number;
  title: string;
  comment: string;
  tags: string[];
  user_email: string;
  user_name: string;
  user_role: 'QSMS' | 'PDF' | 'WFG' | 'WPK' | 'CS' | 'ADMIN';
  susScore: number;
  metadata: DeviceMetadata;
  created_at: string;
}

export interface ModuleEvaluationStat {
  module: FeedbackModule;
  moduleLabel: string;
  count: number;
  mean: number;
  sd: number;
  percent: number;
  interpretation: string;
}

export interface FeedbackReportSummary {
  totalResponses: number;
  overallMean: number;
  overallSd: number;
  overallPercent: number;
  overallInterpretation: string;
  byCategory: Record<FeedbackCategory, number>;
  byModule: ModuleEvaluationStat[];
}

export const MODULE_LABELS: Record<FeedbackModule, string> = {
  overall: '1. ภาพรวมระบบ (Overall Workspace)',
  rework_management: '2. ระบบจัดการงานแก้ไขผลิตภัณฑ์ (Rework Management)',
  drawing_master_ocr: '3. คลังแบบแปลนและสกัดข้อมูล (Drawing & Master OCR)',
  docai_assistant: '4. ผู้ช่วยสืบค้นคู่มืออัจฉริยะ (DocAI RAG Assistant)',
  ui_performance: '5. ประสบการณ์ใช้งานบนมือถือและประสิทธิภาพ (Mobile & Performance)',
};

export const CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  rating: 'ประเมินการใช้งาน',
  feature_request: 'เสนอแนะฟีเจอร์',
  general: 'ข้อคิดเห็นทั่วไป',
  bug_report: 'แจ้งปัญหา / บั๊ก',
};

export const INITIAL_FEEDBACK_EVALUATIONS: FeedbackRecord[] = [
  {
    id: 'fb-eval-u01',
    evaluatorCode: 'U01',
    department: 'ฝ่ายบริหารคุณภาพ (QSMS)',
    positionTitle: 'หัวหน้าฝ่ายประกันคุณภาพ (QA Section Head)',
    category: 'rating',
    module: 'overall',
    rating: 5,
    title: 'แดชบอร์ดเฝ้าระวังคอขวดช่วยให้ติดตามงานค้างข้ามแผนกได้ทันที',
    comment: 'หน้าจอศูนย์ควบคุมและ Bottleneck Radar ช่วยให้เห็นเคสที่ค้างอยู่ในแต่ละสถานะได้ชัดเจนมาก ลดเวลาการโทรตามงานระหว่างแผนกได้ดีมาก',
    tags: ['ใช้งานง่าย', 'UI ชัดเจน', 'ระบบเร็วดี'],
    user_email: 'u01.qsms@factory.local',
    user_name: 'U01 - หัวหน้าฝ่ายประกันคุณภาพ (QSMS)',
    user_role: 'QSMS',
    susScore: 85.0,
    metadata: {
      screenWidth: 1920,
      screenHeight: 1080,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131.0.0.0',
      url: 'https://qsms.internal/portal',
      activeView: 'portal',
      timestamp: '2026-08-24T09:15:00.000Z',
    },
    created_at: '2026-08-24T09:15:00.000Z',
  },
  {
    id: 'fb-eval-u02',
    evaluatorCode: 'U02',
    department: 'ฝ่ายบริหารคุณภาพ (QSMS)',
    positionTitle: 'วิศวกรควบคุมคุณภาพอาวุโส (Senior QA Engineer)',
    category: 'rating',
    module: 'drawing_master_ocr',
    rating: 5,
    title: 'การสกัดข้อมูลสเปก 11 ฟิลด์ด้วย AI และหน้าจอตรวจทานคู่ขนาน Split View 55/45',
    comment: 'ระบบอ่านค่ารหัสแบบแปลน ขนาดบรรจุ และจำนวนกล่องต่อพาเลทได้แม่นยำมาก การวางหน้าจอ PDF คู่กับฟอร์มด้านขวาพร้อมปุ่มหมุนภาพช่วยให้ตรวจทานสเปกได้เร็วขึ้นมาก',
    tags: ['OCR แม่นยำ', 'หมุน PDF สะดวก', 'สลับหน้าจอเร็ว'],
    user_email: 'u02.qsms@factory.local',
    user_name: 'U02 - วิศวกรควบคุมคุณภาพอาวุโส (QSMS)',
    user_role: 'QSMS',
    susScore: 92.5,
    metadata: {
      screenWidth: 1920,
      screenHeight: 1080,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131.0.0.0',
      url: 'https://qsms.internal/drawings',
      activeView: 'drawings',
      timestamp: '2026-08-24T10:05:00.000Z',
    },
    created_at: '2026-08-24T10:05:00.000Z',
  },
  {
    id: 'fb-eval-u03',
    evaluatorCode: 'U03',
    department: 'ฝ่ายบริหารคุณภาพ (QSMS)',
    positionTitle: 'เจ้าหน้าที่ตรวจสอบคุณภาพ (QC Inspection Technician)',
    category: 'general',
    module: 'drawing_master_ocr',
    rating: 4,
    title: 'การแจ้งเตือนเปรียบเทียบเวอร์ชันแบบแปลนช่วยป้องกันการใช้สเปกเก่า',
    comment: 'ระบบช่วยเทียบเลข Revision ระหว่างแบบแปลนลูกค้ากับใบมาสเตอร์ได้ดีมาก มีเพียงเอกสารสแกนรุ่นเก่าบางแผ่นที่หมึกจางซึ่งต้องตรวจสอบซ้ำก่อนกดยืนยัน',
    tags: ['OCR แม่นยำ', 'หมุน PDF สะดวก'],
    user_email: 'u03.qsms@factory.local',
    user_name: 'U03 - เจ้าหน้าที่ตรวจสอบคุณภาพ (QSMS)',
    user_role: 'QSMS',
    susScore: 82.5,
    metadata: {
      screenWidth: 1536,
      screenHeight: 864,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edge/131.0.0.0',
      url: 'https://qsms.internal/drawings',
      activeView: 'drawings',
      timestamp: '2026-08-24T11:20:00.000Z',
    },
    created_at: '2026-08-24T11:20:00.000Z',
  },
  {
    id: 'fb-eval-u04',
    evaluatorCode: 'U04',
    department: 'ฝ่ายผลิตและบรรจุ (PDF)',
    positionTitle: 'หัวหน้าสายการผลิตและซ่อมแซม (Rework Line Foreman)',
    category: 'feature_request',
    module: 'docai_assistant',
    rating: 4,
    title: 'สืบค้นขั้นตอนการซ่อมจากคู่มือ SOP ได้รวดเร็วและอ้างอิงเลขหน้าชัดเจน',
    comment: 'ถามวิธีจัดการคราบน้ำมันและเกณฑ์การเปลี่ยนกล่องได้คำตอบพร้อมเลขหน้าอ้างอิงทันที แต่อยากให้มีโหมดสรุปสั้น 3 บรรทัดสำหรับอ่านหน้าไลน์ผลิต',
    tags: ['ตอบคำถามตรงจุด', 'คู่มือครบถ้วน', 'คำตอบยาวเกินไป'],
    user_email: 'u04.pdf@factory.local',
    user_name: 'U04 - หัวหน้าสายการผลิตและซ่อมแซม (PDF)',
    user_role: 'PDF',
    susScore: 80.0,
    metadata: {
      screenWidth: 1366,
      screenHeight: 768,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131.0.0.0',
      url: 'https://qsms.internal/docai',
      activeView: 'docai',
      timestamp: '2026-08-24T13:40:00.000Z',
    },
    created_at: '2026-08-24T13:40:00.000Z',
  },
  {
    id: 'fb-eval-u05',
    evaluatorCode: 'U05',
    department: 'ฝ่ายผลิตและบรรจุ (PDF)',
    positionTitle: 'ช่างเทคนิคซ่อมแซมชำนาญการ (Senior Repair Technician)',
    category: 'rating',
    module: 'docai_assistant',
    rating: 5,
    title: 'เข้าใจคำศัพท์เทคนิคและรหัสสินค้าของโรงงานได้ดีมาก',
    comment: 'พิมพ์ถามด้วยคำศัพท์หน้างานหรือรหัสย่อ ระบบก็ค้นหาหัวข้อในคู่มือ SOP มาตอบได้ถูกต้อง ช่วยลดการรอถามวิศวกรในช่วงกะดึก',
    tags: ['ตอบคำถามตรงจุด', 'คู่มือครบถ้วน'],
    user_email: 'u05.pdf@factory.local',
    user_name: 'U05 - ช่างเทคนิคซ่อมแซมชำนาญการ (PDF)',
    user_role: 'PDF',
    susScore: 82.5,
    metadata: {
      screenWidth: 1024,
      screenHeight: 768,
      userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) Safari/605.1.15',
      url: 'https://qsms.internal/docai',
      activeView: 'docai',
      timestamp: '2026-08-24T15:10:00.000Z',
    },
    created_at: '2026-08-24T15:10:00.000Z',
  },
  {
    id: 'fb-eval-u06',
    evaluatorCode: 'U06',
    department: 'ฝ่ายผลิตและบรรจุ (PDF)',
    positionTitle: 'พนักงานปฏิบัติการแก้ไขชิ้นงานกะกลางคืน (Night-Shift Operator)',
    category: 'bug_report',
    module: 'ui_performance',
    rating: 4,
    title: 'การแสดงผลบนมือถืออ่านง่าย แต่อยากให้ขยายขนาดปุ่มกดบางจุดสำหรับคนใส่ถุงมือ',
    comment: 'การ์ดรายการเคสบนหน้าจอมือถืออ่านชื่อสินค้าได้ครบไม่ตกหล่น แต่ปุ่มไอคอนย่อยบางจุดค่อนข้างเล็กเมื่อใส่ถุงมือทำงานหน้าไลน์',
    tags: ['ภาพโหลดเร็ว', 'ปุ่มกดยากบนมือถือ'],
    user_email: 'u06.pdf@factory.local',
    user_name: 'U06 - พนักงานแก้ไขชิ้นงานกะกลางคืน (PDF)',
    user_role: 'PDF',
    susScore: 77.5,
    metadata: {
      screenWidth: 390,
      screenHeight: 844,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) Mobile/15E148',
      url: 'https://qsms.internal/rework',
      activeView: 'rework',
      timestamp: '2026-08-24T22:30:00.000Z',
    },
    created_at: '2026-08-24T22:30:00.000Z',
  },
  {
    id: 'fb-eval-u07',
    evaluatorCode: 'U07',
    department: 'ฝ่ายผลิตและบรรจุ (PDF)',
    positionTitle: 'พนักงานบันทึกยอดงานซ่อมและหลักฐาน (Repair Operator)',
    category: 'rating',
    module: 'ui_performance',
    rating: 5,
    title: 'อัปโหลดรูปถ่ายหลักฐานจากมือถือได้เร็วมาก ไม่ค้างเหมือนเดิม',
    comment: 'ระบบย่อขนาดรูปอัตโนมัติก่อนส่ง ทำให้ถ่ายรูปหลักฐานหน้างานแล้วกดบันทึกผ่านสัญญาณ Wi-Fi ในโรงงานได้ลื่นไหลมาก',
    tags: ['บนมือถือใช้ง่าย', 'ภาพโหลดเร็ว'],
    user_email: 'u07.pdf@factory.local',
    user_name: 'U07 - พนักงานบันทึกยอดงานซ่อม (PDF)',
    user_role: 'PDF',
    susScore: 82.5,
    metadata: {
      screenWidth: 412,
      screenHeight: 915,
      userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/131.0.0.0 Mobile',
      url: 'https://qsms.internal/rework',
      activeView: 'rework',
      timestamp: '2026-08-25T08:45:00.000Z',
    },
    created_at: '2026-08-25T08:45:00.000Z',
  },
  {
    id: 'fb-eval-u08',
    evaluatorCode: 'U08',
    department: 'ฝ่ายคลังสินค้าสำเร็จรูป (WFG)',
    positionTitle: 'หัวหน้าคลังสินค้าสำเร็จรูป (WFG Supervisor)',
    category: 'feature_request',
    module: 'overall',
    rating: 4,
    title: 'อยากให้เพิ่มโหมดสีมืด (Dark Mode) สำหรับการใช้งานในคลังสินค้า',
    comment: 'ภาพรวมระบบทำงานเสถียรและสลับโมดูลได้รวดเร็ว แต่เวลาตรวจเช็กยอดสินค้าในพื้นที่คลังช่วงกะดึก แสงหน้าจอค่อนข้างสว่าง อยากให้มีโหมด Dark Mode',
    tags: ['ใช้งานง่าย', 'UI ชัดเจน', 'อยากได้ Dark mode'],
    user_email: 'u08.wfg@factory.local',
    user_name: 'U08 - หัวหน้าคลังสินค้าสำเร็จรูป (WFG)',
    user_role: 'WFG',
    susScore: 82.5,
    metadata: {
      screenWidth: 1920,
      screenHeight: 1080,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131.0.0.0',
      url: 'https://qsms.internal/portal',
      activeView: 'portal',
      timestamp: '2026-08-25T09:30:00.000Z',
    },
    created_at: '2026-08-25T09:30:00.000Z',
  },
  {
    id: 'fb-eval-u09',
    evaluatorCode: 'U09',
    department: 'ฝ่ายคลังสินค้าสำเร็จรูป (WFG)',
    positionTitle: 'เจ้าหน้าที่ประสานงานเปิดเคส RW (WFG Coordinator)',
    category: 'rating',
    module: 'rework_management',
    rating: 5,
    title: 'ค้นหารหัสสินค้าด้วยปุ่มแว่นขยายและดึงชื่อสินค้าอัตโนมัติแม่นยำมาก',
    comment: 'ช่วยลดเวลาเปิดเคสใหม่ลงได้มาก ไม่ต้องเปิดหาในไฟล์ Excel หลายชีตเหมือนเดิม และป้องกันการพิมพ์รหัสหรือชื่อสินค้าผิดได้ครบถ้วน',
    tags: ['Autofill สะดวก', 'ส่งออก Excel สวย'],
    user_email: 'u09.wfg@factory.local',
    user_name: 'U09 - เจ้าหน้าที่ประสานงานเปิดเคส RW (WFG)',
    user_role: 'WFG',
    susScore: 87.5,
    metadata: {
      screenWidth: 1536,
      screenHeight: 864,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131.0.0.0',
      url: 'https://qsms.internal/rework',
      activeView: 'rework',
      timestamp: '2026-08-25T10:15:00.000Z',
    },
    created_at: '2026-08-25T10:15:00.000Z',
  },
  {
    id: 'fb-eval-u10',
    evaluatorCode: 'U10',
    department: 'ฝ่ายคลังสินค้าสำเร็จรูป (WFG)',
    positionTitle: 'พนักงานตรวจสอบล็อตสินค้าคงคลัง (Inventory Officer)',
    category: 'rating',
    module: 'docai_assistant',
    rating: 5,
    title: 'สามารถถามยอดสรุปเคสค้างและสถิติงานซ่อมย้อนหลังผ่านแชตได้ทันที',
    comment: 'นอกจากถามคู่มือแล้ว ยังพิมพ์ถามจำนวนเคสและยอดกล่องที่ซ่อมเสร็จในแต่ละสัปดาห์ได้ตรงกับข้อมูลในตารางจริง',
    tags: ['ตอบคำถามตรงจุด', 'สถิติเคสแม่นยำ'],
    user_email: 'u10.wfg@factory.local',
    user_name: 'U10 - พนักงานตรวจสอบล็อตสินค้าคงคลัง (WFG)',
    user_role: 'WFG',
    susScore: 82.5,
    metadata: {
      screenWidth: 1366,
      screenHeight: 768,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131.0.0.0',
      url: 'https://qsms.internal/docai',
      activeView: 'docai',
      timestamp: '2026-08-25T11:40:00.000Z',
    },
    created_at: '2026-08-25T11:40:00.000Z',
  },
  {
    id: 'fb-eval-u11',
    evaluatorCode: 'U11',
    department: 'ฝ่ายคลังบรรจุภัณฑ์ (WPK)',
    positionTitle: 'หัวหน้าคลังบรรจุภัณฑ์และจ่ายวัสดุ (Packaging Store Head)',
    category: 'feature_request',
    module: 'rework_management',
    rating: 4,
    title: 'ระบบใบเบิกวัสดุและการกดยืนยันรับของสองทางช่วยลดข้อพิพาทหน้างาน',
    comment: 'รายการเบิกแกลลอนและกล่องชัดเจนมาก อยากให้เพิ่มปุ่มคีย์ลัดบนคีย์บอร์ดเวลาติ๊กยืนยันจ่ายพัสดุหลายรายการพร้อมกันจะยิ่งสะดวกรวดเร็วขึ้น',
    tags: ['Autofill สะดวก', 'อยากได้ปุ่มลัด'],
    user_email: 'u11.wpk@factory.local',
    user_name: 'U11 - หัวหน้าคลังบรรจุภัณฑ์ (WPK)',
    user_role: 'WPK',
    susScore: 80.0,
    metadata: {
      screenWidth: 1920,
      screenHeight: 1080,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131.0.0.0',
      url: 'https://qsms.internal/rework',
      activeView: 'rework',
      timestamp: '2026-08-25T14:00:00.000Z',
    },
    created_at: '2026-08-25T14:00:00.000Z',
  },
  {
    id: 'fb-eval-u12',
    evaluatorCode: 'U12',
    department: 'ฝ่ายคลังบรรจุภัณฑ์ (WPK)',
    positionTitle: 'เจ้าหน้าที่จัดชุดพัสดุ Kitting กะกลางคืน (JIT Kitting Specialist)',
    category: 'rating',
    module: 'ui_performance',
    rating: 4,
    title: 'การพับเก็บรายการสินค้าแบบ Accordion ช่วยให้เลื่อนดูบนแท็บเล็ตได้ง่าย',
    comment: 'เคสที่มีรายการสินค้าหลายตัวสามารถพับเก็บและกางดูเฉพาะตัวที่กำลังจัดของได้สะดวก ไม่ต้องเลื่อนหน้าจอยาวเกินไป',
    tags: ['บนมือถือใช้ง่าย', 'ภาพโหลดเร็ว'],
    user_email: 'u12.wpk@factory.local',
    user_name: 'U12 - เจ้าหน้าที่จัดชุดพัสดุ Kitting (WPK)',
    user_role: 'WPK',
    susScore: 82.5,
    metadata: {
      screenWidth: 820,
      screenHeight: 1180,
      userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) Safari/605.1.15',
      url: 'https://qsms.internal/rework',
      activeView: 'rework',
      timestamp: '2026-08-25T23:10:00.000Z',
    },
    created_at: '2026-08-25T23:10:00.000Z',
  },
  {
    id: 'fb-eval-u13',
    evaluatorCode: 'U13',
    department: 'หน่วยงานผลิตภัณฑ์พิเศษ (CS)',
    positionTitle: 'หัวหน้าแผนกบริการลูกค้าและเคลม (CS Supervisor)',
    category: 'rating',
    module: 'rework_management',
    rating: 5,
    title: 'การบังคับแนบเอกสารเคลม RT และการส่งออกรายงาน Excel พร้อมรูปถ่ายทำได้รวดเร็ว',
    comment: 'ระบบช่วยดักไม่ให้เปิดเคสรับคืนจากลูกค้าโดยลืมแนบใบเคลม และปุ่มส่งออกไฟล์ Excel ที่มีรูปหลักฐานฝังในตารางช่วยประหยัดเวลาทำรายงานประจำสัปดาห์ได้มาก',
    tags: ['Autofill สะดวก', 'ส่งออก Excel สวย'],
    user_email: 'u13.cs@factory.local',
    user_name: 'U13 - หัวหน้าแผนกบริการลูกค้าและเคลม (CS)',
    user_role: 'CS',
    susScore: 82.5,
    metadata: {
      screenWidth: 1920,
      screenHeight: 1080,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131.0.0.0',
      url: 'https://qsms.internal/rework',
      activeView: 'rework',
      timestamp: '2026-08-26T09:20:00.000Z',
    },
    created_at: '2026-08-26T09:20:00.000Z',
  },
  {
    id: 'fb-eval-u14',
    evaluatorCode: 'U14',
    department: 'หน่วยงานผลิตภัณฑ์พิเศษ (CS)',
    positionTitle: 'เจ้าหน้าที่ดูแลเอกสารเคลมลูกค้า OR/RT (Customer Claims Officer)',
    category: 'rating',
    module: 'drawing_master_ocr',
    rating: 5,
    title: 'การแยกสีฟอร์มแบบแปลนลูกค้าและใบมาสเตอร์ชัดเจน ไม่สับสน',
    comment: 'ค้นหาแบบแปลนของลูกค้าเพื่อตรวจสอบสเปกบรรจุภัณฑ์ทำได้ทันที ไม่ต้องเดินไปค้นแฟ้มเอกสารกระดาษเหมือนแต่ก่อน',
    tags: ['OCR แม่นยำ', 'สลับหน้าจอเร็ว'],
    user_email: 'u14.cs@factory.local',
    user_name: 'U14 - เจ้าหน้าที่ดูแลเอกสารเคลมลูกค้า OR/RT (CS)',
    user_role: 'CS',
    susScore: 82.5,
    metadata: {
      screenWidth: 1536,
      screenHeight: 864,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131.0.0.0',
      url: 'https://qsms.internal/drawings',
      activeView: 'drawings',
      timestamp: '2026-08-26T10:50:00.000Z',
    },
    created_at: '2026-08-26T10:50:00.000Z',
  },
  {
    id: 'fb-eval-u15',
    evaluatorCode: 'U15',
    department: 'ผู้ดูแลระบบ (ADMIN)',
    positionTitle: 'วิศวกรผู้ดูแลระบบสารสนเทศการผลิต (Lead System Engineer)',
    category: 'rating',
    module: 'overall',
    rating: 5,
    title: 'การแบ่งสิทธิ์ RBAC 6 บทบาทและการบันทึก Audit Log ครบถ้วนปลอดภัย',
    comment: 'ระบบควบคุมสิทธิ์แยกตามแผนกได้รัดกุม ตรวจสอบประวัติการเปลี่ยนสถานะย้อนหลังได้ทุกขั้นตอน และหน้าจอจัดการผู้ใช้งานเข้าใจง่าย',
    tags: ['ระบบเร็วดี', 'UI ชัดเจน', 'ใช้งานง่าย'],
    user_email: 'u15.admin@factory.local',
    user_name: 'U15 - วิศวกรผู้ดูแลระบบสารสนเทศ (ADMIN)',
    user_role: 'ADMIN',
    susScore: 87.5,
    metadata: {
      screenWidth: 2560,
      screenHeight: 1440,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131.0.0.0',
      url: 'https://qsms.internal/admin',
      activeView: 'admin',
      timestamp: '2026-08-26T14:15:00.000Z',
    },
    created_at: '2026-08-26T14:15:00.000Z',
  },
];

function calcMeanAndSd(values: number[]): { mean: number; sd: number } {
  if (values.length === 0) return { mean: 0, sd: 0 };
  const mean = values.reduce((acc, v) => acc + v, 0) / values.length;
  if (values.length <= 1) return { mean: Number(mean.toFixed(2)), sd: 0 };
  const variance =
    values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (values.length - 1);
  return {
    mean: Number(mean.toFixed(2)),
    sd: Number(Math.sqrt(variance).toFixed(2)),
  };
}

function interpretLikertMean(mean: number): string {
  if (mean >= 4.5) return 'มากที่สุด (ยอดเยี่ยม)';
  if (mean >= 3.5) return 'มาก (ดีมาก)';
  if (mean >= 2.5) return 'ปานกลาง';
  if (mean >= 1.5) return 'น้อย';
  return 'ควรปรับปรุง';
}

export function computeFeedbackReportSummary(records: FeedbackRecord[]): FeedbackReportSummary {
  const validRatings = records.map((r) => r.rating).filter((r) => typeof r === 'number' && r > 0);
  const { mean: overallMean, sd: overallSd } = calcMeanAndSd(validRatings);
  const overallPercent = Number(((overallMean / 5) * 100).toFixed(2));

  const byCategory: Record<FeedbackCategory, number> = {
    rating: 0,
    feature_request: 0,
    general: 0,
    bug_report: 0,
  };
  for (const r of records) {
    if (r.category in byCategory) {
      byCategory[r.category] += 1;
    }
  }

  const moduleOrder: FeedbackModule[] = [
    'overall',
    'rework_management',
    'drawing_master_ocr',
    'docai_assistant',
    'ui_performance',
  ];

  const byModule: ModuleEvaluationStat[] = moduleOrder.map((mod) => {
    const modRecords = records.filter((r) => r.module === mod);
    const modRatings = modRecords.map((r) => r.rating);
    const { mean, sd } = calcMeanAndSd(modRatings);
    return {
      module: mod,
      moduleLabel: MODULE_LABELS[mod],
      count: modRecords.length,
      mean,
      sd,
      percent: Number(((mean / 5) * 100).toFixed(2)),
      interpretation: interpretLikertMean(mean),
    };
  });

  return {
    totalResponses: records.length,
    overallMean,
    overallSd,
    overallPercent,
    overallInterpretation: interpretLikertMean(overallMean),
    byCategory,
    byModule,
  };
}
