# Project Knowledge Index
ดัชนีคลังความรู้ถาวร (Second Brain) ประจำโปรเจกต์ QSMS Rework & ShiftHub Roster

---

## 📂 1. Index & Logging (ดัชนีและบันทึกประวัติ)
- [[index.md]] - สารบัญหลักแบบ Flat Index นำทางความรู้ทั้งหมดในระบบ
- [[log.md]] - บันทึกประวัติและไทม์ไลน์การนำเข้าข้อมูลดิบ (Ingestion Log) จากอดีตถึงปัจจุบัน
- [[SESSION_KNOWLEDGE_2026_05_25.md]] - ข้อมูลประมวลความรู้สำคัญระหว่างเซสชันในเดือนพฤษภาคม 2026

## 📂 2. Next.js Frontend (โมดูลฝั่งหน้าบ้าน)
- [[architecture/fsd-update-modal-refactoring.md]] - สถาปัตยกรรม FSD (Feature-Sliced Design) สำหรับการแยกองค์ประกอบซับซ้อน เช่น UpdateModal ออกจากกันเพื่อลด Bugs
- [[nextjs-frontend/ui-ux-principles.md]] - กฎการออกแบบ UI/UX ขนาดปุ่มสัมผัส 44x44px สัดส่วนสว่าง/มืด และระบบช่องไฟ 4/8dp
- [[nextjs-frontend/ui-glossary.md]] - แคตตาล็อกคำศัพท์ภาษาอังกฤษและส่วนประกอบพื้นฐานสำหรับการออกแบบองค์ประกอบ UI
- [[nextjs-frontend/design-system.md]] - ระบบการออกแบบหน้าจอ Minimal Grayscale Gradient และ Premium Apple Glassmorphism
- [[nextjs-frontend/auth-flow.md]] - ระบบ Login ด้วย PIN/OAuth และแอนิเมชันตอนออกจากระบบสไตล์ Apple
- [[nextjs-frontend/roles.md]] - สกีมาจำแนกสิทธิ์ผู้ใช้งาน (RBAC) 6 บทบาท และการตรวจสอบสิทธิ์ความปลอดภัย
- [[nextjs-frontend/portal-shell.md]] - หน้าจอศูนย์กลาง Workspace Portal, Guest Mode และระบบ Auto-redirect
- [[nextjs-frontend/rework-module.md]] - โครงสร้างหน้าต่างและตารางจัดการใบงานแก้ไขสินค้า (Rework) แบบ Multi-item
- [[nextjs-frontend/roster-module.md]] - หน้าจอจัดการเวรพนักงานและการสลับวันเสาร์ทำงาน (ShiftHub Roster)
- [[nextjs-frontend/image-upload-system.md]] - ระบบอัปโหลดและพรีวิวภาพหลักฐานผ่าน Supabase Storage
- [[nextjs-frontend/nextjs.md]] - พื้นฐานการทำ routing และคอมโพเนนต์ React ในสภาพแวดล้อม Next.js
- [[nextjs-frontend/shadcn-ui.md]] - คู่มือการใช้งานคอมโพเนนต์ตามมาตรฐานของไลบรารี shadcn/ui
- [[nextjs-frontend/testing-pipeline.md]] - ทูลสืบค้นการตั้งค่าการทดสอบ Unit และ E2E Playwright ทั้งระบบ
- [[nextjs-frontend/testsprite-testing.md]] - สเปกและแผนการทดสอบอัตโนมัติความปลอดภัยผ่านเครื่องมือ Testsprite
- [[nextjs-frontend/refactoring-history.md]] - บันทึกประวัติการปรับโครงสร้างโฟลเดอร์และจัดระเบียบคอมโพเนนต์
- [[nextjs-frontend/qol_recommendations.md]] - แนวทางปรับปรุง Quality of Life ระบบจัดเก็บเอกสารและลิงก์ Drawing & Master


## 📂 3. Architecture & System Design (ระบบสถาปัตยกรรม)
- [[architecture/system-architecture.md]] - ภาพรวมการส่งต่อข้อมูลระหว่าง Next.js Frontend กับ GAS Backend
- [[architecture/cors-csp-setup.md]] - การตั้งค่า CORS Headers บน Apps Script และ CSP Meta Tag บนเบราว์เซอร์
- [[architecture/nextjs-supabase-auth-storage.md]] - การย้ายระบบ Auth (HTTP-only) และ Storage ไปทำงานบน Supabase 100%
- [[architecture/supabase-hybrid-migration.md]] - รูปแบบโครงสร้างการย้ายและประสานข้อมูลซิงค์ Supabase ร่วมกับ Google Sheets
- [[architecture/cloudinary-storage.md]] - สรุปข้อจำกัด แบนด์วิดท์ และการคำนวณเครดิตของ Cloudinary (Free Tier)
- [[architecture/prisma-orm.md]] - โครงสร้างและการทำ Migration ตารางฐานข้อมูลด้วย Prisma ORM
- [[architecture/drawing-master-storage.md]] - ระบบจัดการไฟล์ Drawing ลูกค้าและ Master ภายใน รวมถึงการสกัดข้อมูลด้วย AI
- [[architecture/rag-module-nextjs.md]] - สถาปัตยกรรม RAG สำหรับเก็บและค้นหาเอกสารความรู้ผ่าน Supabase pgvector และ Gemini
- [[architecture/multimodal-rag.md]] - การออกแบบสถาปัตยกรรมประมวลผลข้อความและภาพหลายรูปแบบของโมดูล RAG
- [[architecture/tech-stack-2026.md]] - สรุปรายการเทคโนโลยี ไลบรารี และไดอะแกรมความเชื่อมโยงของ Stack ปี 2026
- [[architecture/fsd-migration.md]] - การจัดระเบียบโครงสร้างโฟลเดอร์แบบ Feature-Sliced Design (FSD)
- [[architecture/modular-breakdown.md]] - รายละเอียดโครงสร้างและการทำงานเชิงลึกของทั้ง 7 โมดูลหลักในระบบ
- [[architecture/project-overview.md]] - ภาพรวมของแอปพลิเคชัน ขอบเขตการทำงาน และบันทึกการรันงาน
- [[architecture/project-history.md]] - บันทึกเหตุการณ์ ลำดับพัฒนาการ และไทม์ไลน์ของระบบ QSMS
- [[architecture/deployment.md]] - แผนขั้นตอนการนำแอปพลิเคชันและ Google Apps Script ขึ้นระบบจำหน่ายจริง (Production)
- [[architecture/knowledge-synthesis.md]] - รูปแบบและสเตตการจัดเก็บสะสมคลังความรู้ของปัญญาประดิษฐ์
- [[architecture/llm-wiki-pattern.md]] - กฎการรักษาระบบ Second Brain เพื่อลด Token ในเซสชันถัดไป

## 📂 4. Lessons Learned & Bug Fixes (บทเรียนแก้บั๊กและการพัฒนา)
- [[lessons-learned/development-learnings.md]] - สรุปบทเรียนพัฒนาการ 36 รายการในอดีต (React, Next.js, Google Apps Script)
- [[lessons-learned/bugs-and-fixes.md]] - ประวัติบั๊กสำคัญ BUG-001 ถึง BUG-018 และตัวอย่างโค้ดก่อน/หลังปรับปรุง
- [[lessons-learned/bug-review-2026-05-28.md]] - รีวิวข้อบกพร่องและปัญหารายสัปดาห์ ณ สิ้นเดือนพฤษภาคม 2026
- [[lessons-learned/debugging-practices.md]] - กฎและแนวปฏิบัติการสืบสวนหาสาเหตุบั๊กอย่างปลอดภัย (Systematic Debugging)
- [[lessons-learned/mobile-fast-track-ui.md]] - การสร้างหน้าจอ Fast-Track มือถือ การทำ Watermark และ react-hook-form Bridge
- [[lessons-learned/rework-form-refactoring-and-pdf.md]] - ปรับแต่งฟอร์มด้วย react-hook-form และตัวอักษรไทยหายใน PDF ด้วยตัวคั่น
- [[lessons-learned/item-master-upsert-flow.md]] - การบันทึกและซิงค์ฟิลด์ Auto Fill ของคลังสินค้ามาสเตอร์ (Item Master)
- [[lessons-learned/rag-ui-and-hybrid-search.md]] - บันทึกความรู้การสตรีมมิ่ง SSE, RPC Hybrid Search และ Chat Sidebar Overlay
- [[lessons-learned/rbac-casing-and-e2e.md]] - วิธีแก้บั๊ก Casing ของ Role enum และการสืบค้นปุ่มด้วย Playwright
- [[lessons-learned/box-number-binding-and-jwt-e2e.md]] - สรุปแก้บั๊ก E2E JWT validation และการผูกค่าเลขกล่อง (Box Number)
- [[lessons-learned/duplicate-items-validation.md]] - รายละเอียดการตรวจจับรายการสินค้าซ้ำซ้อนกันในใบงานเดียว
- [[lessons-learned/validation-mismatch-fix.md]] - การแก้ไขและลดเงื่อนไขบังคับกรอก (Required) ในฟอร์มสร้างใบงาน
- [[lessons-learned/gas-case-id-override.md]] - การซิงค์และบันทึกรหัส Case ID ระหว่าง Supabase กับชีตผ่านระบบ GAS
- [[lessons-learned/image-annotation-and-profile.md]] - บทเรียนการติดแท็กความเห็นบนรูปภาพและการดึงข้อมูลรายละเอียดโปรไฟล์ผู้ใช้
- [[lessons-learned/edit-mode-layout.md]] - ปัญหาเลย์เอาต์หน้าต่างเด้งทับและปุ่มกระเด็นขณะเปิดใช้โหมด Edit Case
- [[lessons-learned/case-name-updates.md]] - การป้องกันปัญหาสตรีทการอัปเดตชื่อเคสทับซ้อนกันบน Google Sheets
- [[lessons-learned/presentation-scaling-and-portal-rendering.md]] - สเกลหน้าจอพรีเซนต์พัง และวิธีข้าม Portal เพื่อฝัง modal แบบ inline
- [[lessons-learned/project-status-and-lessons.md]] - รายงานสถานะการส่งงานและบทเรียนภาพรวมตอนจบโปรเจกต์
- [[lessons-learned/rag-gemini-quota.md]] - เทคนิคการประหยัดโควตาและลด API limits ของโมเดล Google Gemini
- [[lessons-learned/server-auth-and-partial-updates.md]] - การทำเซสชันคุกกี้ที่ปลอดภัยและการส่งอัปเดตข้อมูลแบบแบ่งบางส่วน (Partial)
- [[lessons-learned/type-safety-and-e2e-bootstrap.md]] - บทเรียนการควบคุมไทป์และติดตั้งชุดเครื่องมือเริ่มต้น E2E Ecosytem
- [[lessons-learned/windows-cli-environment.md]] - ทางเลี่ยงการใช้ unzip.exe บน Windows ในสภาพแวดล้อมที่ไร้คำสั่ง unzip
- [[lessons-learned/text-clipping-ui.md]] - การแก้ปัญหาเลย์เอาต์ตัวอักษรล้นจอหรือแหว่งหน้าต่างของเบราว์เซอร์
- [[lessons-learned/ui-libraries-resource.md]] - ข้อมูลระบบ Mantine UI Components, Hooks, Dates และ Combobox
- [[lessons-learned/update-modal-layout-rework.md]] - การแก้ปัญหาเลื่อนจอพัง, ล็อกแถบเลื่อนฝั่งขวา และการถอนคลาส uppercase บน Tailwind
- [[lessons-learned/js-projects-resource.md]] - แคตตาล็อกไลบรารีและคู่มือพัฒนาของโปรเจกต์ JavaScript/TypeScript

## 📂 5. Backend Services (บริการหลังบ้าน)
- [[gas-backend/gas-api.md]] - สถาปัตยกรรมและรายละเอียดการเชื่อมต่อ API บน Apps Script
- [[google-sheets/schema.md]] - รายละเอียดตาราง คอลัมน์ และสกีมาที่ใช้เก็บข้อมูลบน Google Sheets

## 📂 6. Agent Frameworks (มาตรฐานความรู้การสั่งงานเอเจนต์)
- [[agent-frameworks/agent-dev-thai.md]] - กฎควบคุม AI ป้องกันเดาหรือทำเกิน (Guardrails) และระบบจำบทเรียน (Memory)
- [[agent-frameworks/ponytail-lazy-dev.md]] - บันได 7 ขั้นของ Ponytail ในการเขียนโค้ดอย่างกระชับและเลี่ยง Over-engineering
- [[agent-frameworks/harness-skills.md]] - ชุดจำลองทักษะ (Harness Skills) ที่เอเจนต์นำมาเพิ่มศักยภาพการทำงาน
- [[agent-frameworks/deepagents.md]] - สรุปการพัฒนาระบบ Deep Agents ประจำการแก้ไขปัญหาขั้นสูง

## 📂 7. AI & Machine Learning Utilities (เครื่องมือเสริมสมองเอเจนต์)
- [[ai-ml-utilities/deep-learning-transformers.md]] - การประยุกต์ใช้ไลบรารี Transformers.js ในสภาพแวดล้อมเบราว์เซอร์
- [[ai-ml-utilities/thai-nlp-pythainlp.md]] - การดึงความสามารถของ PyThaiNLP ในการตัดคำและตรวจสอบข้อความภาษาไทย
- [[ai-ml-utilities/document-processing-pymupdf.md]] - การดึงและสแกนข้อมูลจากไฟล์ PDF โดยใช้ PyMuPDF (fitz)
- [[ai-ml-utilities/image-processing-clip-pillow.md]] - การตรวจวิเคราะห์ข้อมูลภาพและแปลงสัดส่วนภาพด้วย CLIP และ Pillow
- [[ai-ml-utilities/vector-search-chroma.md]] - การฝังข้อมูลเวกเตอร์และการตั้งคลังจัดเก็บด้วยระบบ Chroma DB
- [[ai-ml-utilities/gradio-ui.md]] - แนวปฏิบัติการสร้างเว็บบราวเซอร์ต้นแบบแอปพลิเคชัน AI ด้วย Gradio
