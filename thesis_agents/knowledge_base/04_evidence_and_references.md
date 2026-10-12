# Thesis Knowledge Base 04: Evidence and References

## 1. ตารางตัวเลขหลักและผลการทดสอบชุดเดียว (Single Source of Truth Metrics)

| ตัวชี้วัดเชิงปริมาณ | ค่าฐานเดิมก่อนปรับปรุง (Baseline) | วิธีการวัดและจำนวนตัวอย่าง (Methodology & Sample) | ผลลัพธ์ที่ได้จากการทดสอบ (Observed Result) | การเปลี่ยนแปลงเชิงสถิติ |
|---|---|---|---|---|
| **ระยะเวลาเปิดบันทึกเคสใหม่** | 8.0 นาที / เคส | จับเวลาการกรอกข้อมูล 3 รายการสินค้า (ทดสอบ 20 ครั้ง) | 2.5 นาที / เคส | ลดลง 68.75% |
| **ความผิดพลาดข้อมูลสินค้าใน Master** | 14.2% (17 จาก 120 รายการ) | ตรวจสอบความถูกต้องของรหัสสินค้า สเปก และราคา | 0.0% (0 จาก 120 รายการ) *เฉพาะสินค้าที่มีใน Master* | ลดลงเป็นศูนย์ (เฉพาะ Master Item) |
| **เวลารอคอยวัสดุ (Kitting Lead Time)** | 45.0 นาที / เคส | จับเวลาตั้งแต่ระบุสเปกจนกระทั่งส่งมอบวัสดุถึงช่างซ่อม (15 เคส) | 15.7 นาที / เคส | ลดลง 65.11% |
| **ความสูญเปล่าการขนย้ายซ้ำซ้อน** | 100% ของเคส (ขนย้าย 2 รอบ) | สังเกตการณ์การเบิกจ่ายกล่องก่อนทราบผลวิเคราะห์ (15 เคส) | 0% ของเคส (เบิกจ่ายรอบเดียวครบชุด) | ขจัดความสูญเปล่า 100% |
| **เวลาตรวจสอบสเปกจากแบบแปลน** | 12.5 นาที / ฉบับ | ค้นหาจากแฟ้มเอกสารกระดาษและตรวจทาน 11 ฟิลด์ (30 ฉบับ) | 4.2 วินาที / ฉบับ | ลดลง 99.44% |
| **ความแม่นยำ AI OCR บนแบบแปลน** | [ไม่มีระบบเดิม] | ตรวจสอบความถูกต้องของ 11 ฟิลด์ Metadata บน PDF 50 ฉบับ | 96.36% (530 จาก 550 ฟิลด์) | ความแม่นยำเฉลี่ย 96.36% |
| **เวลาเริ่มสตรีมคำตอบคู่มือ (TTFT)** | 14.0 นาที / ครั้ง | ค้นหาจากคู่มือ SOP เอกสารรูปเล่มความหนา 450 หน้า | 2.1 วินาที / ครั้ง | ลดลง 99.75% |
| **ความถูกต้องในการตอบคำถามคู่มือ** | [ไม่มีระบบเดิม] | ประเมินความถูกต้องของเนื้อหาและการอ้างอิงแหล่งที่มา (40 คำถาม) | 97.50% (39 จาก 40 คำถาม) | ความถูกต้อง 97.50% |
| **ขนาดไฟล์ภาพถ่ายเฉลี่ย** | 2.0 MB / ภาพ | บันทึกขนาดไฟล์ก่อนและหลังการบีบอัดผ่าน Canvas (100 ภาพ) | 350 KB / ภาพ | ลดขนาดลง 82.50% |
| **เวลาจัดทำรายงาน Rework ประจำงวด** | 16.0 ชั่วโมง (2 วันทำการ) | คัดลอกข้อมูลและแทรกภาพลงในสเปรดชีตรายเดือน (12 งวด) | 4.8 วินาที (1 คลิก ผ่าน ExcelJS) | ลดลง 99.99% |
| **ความถูกต้องของการควบคุมสิทธิ์** | [ไม่มีระบบเดิม] | รันชุดทดสอบอัตโนมัติ (Automated Unit Tests) สิทธิ์ 6 บทบาท | ผ่าน 203 จาก 203 การทดสอบ (100%) | ความครอบคลุมการทดสอบ 100% |

---

## 2. รายการวรรณกรรมอ้างอิงจริงที่ตรวจสอบได้ (Verified Academic References)

[1] J. P. Womack and D. T. Jones, *Lean Thinking: Banish Waste and Create Wealth in Your Corporation*, New York: Free Press, 2003.  
[2] E. M. Goldratt, *What is This Thing Called Theory of Constraints and How Should it be Implemented?*, Great Barrington, MA: North River Press, 1990.  
[3] R. S. Sandhu, E. J. Coyne, H. L. Feinstein, and C. E. Youman, "Role-based access control models," *IEEE Computer*, vol. 29, no. 2, pp. 38–47, Feb. 1996.  
[4] Open Web Application Security Project (OWASP), "Cross-Site Scripting (XSS) Prevention Cheat Sheet," OWASP Foundation, 2024. [Online]. Available: https://cheatsheetseries.owasp.org/  
[5] DAMA International, *DAMA-DMBOK: Data Management Body of Knowledge*, 2nd ed., Basking Ridge, NJ: Technics Publications, 2017.  
[6] Google DeepMind, "Gemini: A Family of Highly Capable Multimodal Models," *arXiv preprint arXiv:2312.11805*, 2023.  
[7] V. Karpukhin, B. Oğuz, S. Min, P. Lewis, L. Wu, S. Edunov, D. Chen, and W.-t. Yih, "Dense Passage Retrieval for Open-Domain Question Answering," in *Proc. EMNLP*, 2020, pp. 6769–6781.  
[8] G. V. Cormack, C. L. Clarke, and S. Büttcher, "Reciprocal rank fusion outperforms condorcet and individual rank learning methods," in *Proc. ACM SIGIR*, 2009, pp. 758–759.  
[9] Feature-Sliced Design Community, "Feature-Sliced Design: Architectural methodology for frontend projects," 2024. [Online]. Available: https://feature-sliced.design/
