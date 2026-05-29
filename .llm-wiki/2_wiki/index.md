# Project Knowledge Index

## Lessons Learned & Fixes
- [RBAC Enum Casing & Playwright Locators](lessons-learned/rbac-casing-and-e2e.md) - บันทึกการแก้ไขปัญหา UserRole (Uppercase) ที่ทำให้เกิด Type Error ตอน Build และการแก้ไขปัญหา Playwright Script พังจากการใช้ XPath ใน Apple-style UI
- [Item Master Upsert & Auto Fill Sync Flow](lessons-learned/item-master-upsert-flow.md) - บันทึกสาเหตุและการแก้ไขปัญหา Auto Fill ของ Item Master ไม่ทำงานเนื่องจากการข้ามเก็บ Item Code และการจัดการ Error แบบเงียบ
- [RAG Streaming UI & Hybrid Search Lessons Learned](lessons-learned/rag-ui-and-hybrid-search.md) - บันทึกข้อมูลและบทเรียนในการพัฒนาการ Stream คำตอบ (SSE) ใน Next.js, การใช้ Supabase RPC ทำ Hybrid Search ค้นหาเอกสารแบบไม่มีซ้ำ และการจัดการ Suggestion Chips ด้วย Regex


## Architecture & System Design
- [Next.js RAG Module Architecture](architecture/rag-module-nextjs.md) - สรุปสถาปัตยกรรมโมดูล RAG ของระบบ Next.js Portal ที่ใช้ Gemini API ร่วมกับ Supabase pgvector สำหรับเก็บและสืบค้นเอกสาร


