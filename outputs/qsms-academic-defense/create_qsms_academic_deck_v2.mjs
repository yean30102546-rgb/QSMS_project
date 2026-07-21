import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import {
  Presentation,
  PresentationFile,
} from "file:///C:/Users/sapho/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(ROOT, "QSMS_Academic_Defense_Modern.pptx");
const PREVIEW = path.join(ROOT, "preview-modern");
const CONTACT = path.join(PREVIEW, "contact-sheet.png");
const SKILL_SCRIPTS = "C:/Users/sapho/.codex/plugins/cache/openai-primary-runtime/presentations/26.521.10419/skills/presentations/scripts";

const W = 1280;
const H = 720;
const C = {
  ink: "#172033",
  ink2: "#263247",
  muted: "#647084",
  paper: "#F5F3EE",
  panel: "#FFFFFF",
  hair: "#DCE2EA",
  blue: "#2E5BFF",
  teal: "#00A7B5",
  green: "#18A058",
  amber: "#D99B1F",
  red: "#D44D5C",
  navy: "#101B2E",
  navy2: "#17243A",
};

function shape(slide, { x, y, w, h, fill = "#00000000", line = "#00000000", width = 0, geometry = "rect" }) {
  return slide.shapes.add({
    geometry,
    position: { left: x, top: y, width: w, height: h },
    fill,
    line: { style: "solid", fill: line, width },
  });
}

function text(slide, { value, x, y, w, h, size = 22, color = C.ink, bold = false, face = "Aptos", align = "left", valign = "top", fill = "#00000000", inset = 0 }) {
  const box = shape(slide, { x, y, w, h, fill });
  box.text = value;
  box.text.fontSize = size;
  box.text.color = color;
  box.text.bold = bold;
  box.text.typeface = face;
  box.text.alignment = align;
  box.text.verticalAlignment = valign;
  box.text.insets = { left: inset, right: inset, top: inset, bottom: inset };
  return box;
}

function deckBase(slide, section, title, page, options = {}) {
  const dark = options.dark ?? false;
  shape(slide, { x: 0, y: 0, w: W, h: H, fill: dark ? C.navy : C.paper });
  shape(slide, { x: 0, y: 0, w: W, h: 18, fill: options.accent ?? C.blue });
  text(slide, { value: section.toUpperCase(), x: 66, y: 43, w: 340, h: 22, size: 12, bold: true, color: dark ? "#A8B7D4" : options.accent ?? C.blue });
  text(slide, { value: title, x: 66, y: 76, w: 840, h: 82, size: 34, bold: true, face: "Aptos Display", color: dark ? "#FFFFFF" : C.ink });
  text(slide, { value: String(page).padStart(2, "0"), x: 1160, y: 645, w: 52, h: 24, size: 12, color: dark ? "#A8B7D4" : C.muted, align: "right" });
}

function pill(slide, label, x, y, w, color) {
  shape(slide, { x, y, w, h: 30, fill: color });
  text(slide, { value: label, x: x + 12, y: y + 6, w: w - 24, h: 18, size: 11, bold: true, color: "#FFFFFF", align: "center" });
}

function card(slide, { x, y, w, h, title, body, accent = C.blue, dark = false }) {
  shape(slide, { x, y, w, h, fill: dark ? C.navy2 : C.panel, line: dark ? "#2E3B53" : C.hair, width: 1 });
  shape(slide, { x, y, w: 7, h, fill: accent });
  text(slide, { value: title, x: x + 26, y: y + 22, w: w - 52, h: 34, size: 21, bold: true, color: dark ? "#FFFFFF" : C.ink });
  text(slide, { value: body, x: x + 26, y: y + 64, w: w - 52, h: h - 82, size: 15.5, color: dark ? "#C9D3E6" : C.muted });
}

function bullets(slide, items, x, y, w, color = C.blue, gap = 52, dark = false) {
  items.forEach((item, i) => {
    const top = y + i * gap;
    shape(slide, { x, y: top + 8, w: 10, h: 10, fill: color, geometry: "ellipse" });
    text(slide, { value: item, x: x + 26, y: top, w, h: 42, size: 19, color: dark ? "#E6ECF6" : C.ink });
  });
}

function stat(slide, value, label, x, y, color) {
  text(slide, { value, x, y, w: 200, h: 52, size: 39, bold: true, face: "Aptos Display", color });
  text(slide, { value: label, x, y: y + 54, w: 230, h: 36, size: 13.5, color: C.muted });
}

function flow(slide, steps, x, y, w, color) {
  const stepW = w / steps.length;
  steps.forEach((step, i) => {
    const left = x + i * stepW;
    shape(slide, { x: left + 6, y, w: stepW - 20, h: 94, fill: C.panel, line: C.hair, width: 1 });
    text(slide, { value: String(i + 1), x: left + 20, y: y + 18, w: 28, h: 26, size: 14, bold: true, color: "#FFFFFF", align: "center", valign: "middle", fill: color, inset: 3 });
    text(slide, { value: step, x: left + 58, y: y + 21, w: stepW - 84, h: 44, size: 14.5, bold: true });
    if (i < steps.length - 1) text(slide, { value: "→", x: left + stepW - 25, y: y + 31, w: 28, h: 30, size: 20, bold: true, color });
  });
}

function divider(p, section, title, subtitle, page, accent) {
  const s = p.slides.add();
  shape(s, { x: 0, y: 0, w: W, h: H, fill: C.navy });
  shape(s, { x: 0, y: 0, w: 18, h: H, fill: accent });
  text(s, { value: section.toUpperCase(), x: 92, y: 92, w: 320, h: 24, size: 13, bold: true, color: accent });
  text(s, { value: title, x: 92, y: 170, w: 810, h: 120, size: 55, bold: true, face: "Aptos Display", color: "#FFFFFF" });
  text(s, { value: subtitle, x: 96, y: 330, w: 760, h: 70, size: 23, color: "#C9D3E6" });
  text(s, { value: String(page).padStart(2, "0"), x: 1120, y: 612, w: 70, h: 34, size: 16, color: "#A8B7D4", align: "right" });
  return s;
}

const slides = [
  (p) => {
    const s = p.slides.add();
    shape(s, { x: 0, y: 0, w: W, h: H, fill: C.navy });
    shape(s, { x: 0, y: 0, w: W, h: 18, fill: C.teal });
    text(s, { value: "ACADEMIC PROJECT DEFENSE", x: 72, y: 70, w: 360, h: 22, size: 13, bold: true, color: "#9FDDE3" });
    text(s, { value: "QSMS Rework & Document Intelligence Portal", x: 72, y: 138, w: 845, h: 142, size: 54, bold: true, face: "Aptos Display", color: "#FFFFFF" });
    text(s, { value: "ระบบจัดการงานคุณภาพ เอกสารวิศวกรรม และการค้นหาความรู้ด้วย AI", x: 76, y: 310, w: 780, h: 64, size: 24, color: "#D8E1F0" });
    stat(s, "Next.js", "App Router + React", 80, 515, C.teal);
    stat(s, "Supabase", "database, storage, auth boundary", 340, 515, C.amber);
    stat(s, "Gemini", "document intelligence and RAG", 640, 515, C.green);
    shape(s, { x: 965, y: 120, w: 215, h: 380, fill: "#FFFFFF12", line: "#FFFFFF22", width: 1 });
    ["Rework", "Storage", "RAG", "Guide"].forEach((label, i) => {
      shape(s, { x: 995, y: 172 + i * 72, w: 155, h: 44, fill: i === 0 ? C.blue : i === 1 ? C.amber : i === 2 ? C.teal : "#50617F" });
      text(s, { value: label, x: 1012, y: 184 + i * 72, w: 120, h: 20, size: 15, bold: true, color: "#FFFFFF", align: "center" });
    });
    return s;
  },
  (p) => {
    const s = p.slides.add();
    deckBase(s, "executive summary", "ระบบนี้แก้ปัญหางานคุณภาพที่ข้อมูลกระจัดกระจาย ด้วย portal และฐานข้อมูลกลาง", 2, { accent: C.teal });
    card(s, { x: 78, y: 205, w: 330, h: 225, title: "Problem", body: "ข้อมูลเคส รูปหลักฐาน Drawing และ Master file อยู่คนละ flow ทำให้ค้นย้อนหลังและตรวจสอบยาก", accent: C.red });
    card(s, { x: 475, y: 205, w: 330, h: 225, title: "Solution", body: "รวม workflow ผ่าน Workspace Portal และบันทึกข้อมูลลง Supabase ผ่าน Next.js API boundary", accent: C.blue });
    card(s, { x: 872, y: 205, w: 330, h: 225, title: "Value", body: "เพิ่ม traceability, ลด manual lookup และเปิดทางให้ AI ช่วยค้นเอกสาร/ประวัติได้เร็วขึ้น", accent: C.green });
    text(s, { value: "Claim สำหรับพรี: QSMS ไม่ใช่แค่เว็บบันทึกข้อมูล แต่เป็น quality operations workspace ที่วาง architecture ให้ขยายต่อได้", x: 115, y: 535, w: 1030, h: 56, size: 24, bold: true, align: "center" });
    return s;
  },
  (p) => {
    const s = p.slides.add();
    deckBase(s, "problem framing", "ปัญหาหลักคือ traceability ต่ำ เพราะข้อมูลสำคัญไม่ได้เดินทางไปด้วยกัน", 3, { accent: C.red });
    bullets(s, [
      "Rework case ต้องมี item, batch, image evidence, status และ valuation แต่เดิมตามรอยข้ามแหล่งข้อมูลยาก",
      "Drawing และ Internal Master มีความเสี่ยงเรื่อง revision, naming และ missing master",
      "การค้นเอกสาร technical/spec ต้องพึ่งชื่อไฟล์หรือความจำของผู้ใช้",
      "แต่ละบทบาทควรเห็นและแก้ไขข้อมูลได้ต่างกัน แต่ระบบต้องบังคับสิทธิ์ที่ backend ด้วย",
    ], 95, 190, 920, C.red, 66);
    shape(s, { x: 980, y: 210, w: 168, h: 168, fill: "#FDECEE", line: "#F5C5CB", width: 1 });
    text(s, { value: "Case\nEvidence\nDocs\nRoles", x: 1005, y: 250, w: 118, h: 88, size: 24, bold: true, color: C.red, align: "center", valign: "middle" });
    return s;
  },
  (p) => {
    const s = p.slides.add();
    deckBase(s, "objectives", "เป้าหมายถูกตั้งจาก operation จริง: เร็วขึ้น ชัดขึ้น และตรวจสอบได้", 4, { accent: C.green });
    [
      ["1", "Centralize Rework workflow", "รวมการสร้าง ติดตาม และอัปเดตเคส"],
      ["2", "Standardize document control", "จัดการ Drawing/Master และ revision"],
      ["3", "Secure role-based access", "จำกัดสิทธิ์ตาม QSMS, OPERATOR, FINANCE"],
      ["4", "Enable AI-assisted search", "ใช้ RAG ค้นเอกสารและประวัติงาน"],
    ].forEach((row, i) => {
      const x = 94 + i * 285;
      shape(s, { x, y: 205, w: 238, h: 238, fill: C.panel, line: C.hair, width: 1 });
      text(s, { value: row[0], x: x + 26, y: 226, w: 45, h: 45, size: 26, bold: true, color: "#FFFFFF", align: "center", valign: "middle", fill: i === 0 ? C.blue : i === 1 ? C.amber : i === 2 ? C.green : C.teal, inset: 6 });
      text(s, { value: row[1], x: x + 28, y: 300, w: 185, h: 48, size: 21, bold: true });
      text(s, { value: row[2], x: x + 28, y: 367, w: 180, h: 46, size: 15.5, color: C.muted });
    });
    return s;
  },
  (p) => {
    const s = p.slides.add();
    deckBase(s, "requirements", "ผู้ใช้หลักมีงานและสิทธิ์ต่างกัน จึงต้องออกแบบตาม role ตั้งแต่แรก", 5, { accent: C.blue });
    card(s, { x: 80, y: 188, w: 305, h: 270, title: "QSMS", body: "ดู dashboard, จัดการเคส, แก้ไข/ลบ, export และควบคุม workflow คุณภาพ", accent: C.blue });
    card(s, { x: 485, y: 188, w: 305, h: 270, title: "OPERATOR", body: "สร้างเคสและอัปเดตสถานะการปฏิบัติงาน แต่ไม่เห็นงาน storage ที่ถูกจำกัด", accent: C.green });
    card(s, { x: 890, y: 188, w: 305, h: 270, title: "FINANCE", body: "ดู overall และกรอก valuation โดยไม่แก้ workflow operation อื่น", accent: C.amber });
    text(s, { value: "จุดที่เพิ่มจาก deck เดิม: slide นี้ทำให้ตอบคำถามอาจารย์เรื่อง requirement และผู้ใช้เป้าหมายได้ตรงขึ้น", x: 120, y: 540, w: 1000, h: 34, size: 21, bold: true, align: "center", color: C.blue });
    return s;
  },
  (p) => divider(p, "design approach", "From workflow pain to system boundary", "เล่าให้เห็นวิธีคิด ไม่ใช่แค่หน้าจอที่สร้างเสร็จ", 6, C.blue),
  (p) => {
    const s = p.slides.add();
    deckBase(s, "methodology", "แนวทางพัฒนาใช้ iterative delivery: อ่าน workflow, แยก module, ทดสอบ flow สำคัญ", 7, { accent: C.blue });
    flow(s, ["Discover pain points", "Define scope", "Design modules", "Implement APIs", "Validate flows"], 80, 205, 1110, C.blue);
    card(s, { x: 110, y: 400, w: 300, h: 130, title: "Evidence source", body: "LLM wiki, source code, route handlers และ module boundaries", accent: C.teal });
    card(s, { x: 490, y: 400, w: 300, h: 130, title: "Build style", body: "Next.js App Router + Supabase-first backend", accent: C.green });
    card(s, { x: 870, y: 400, w: 300, h: 130, title: "Validation", body: "TypeScript, Vitest, Playwright และ manual demo path", accent: C.amber });
    return s;
  },
  (p) => {
    const s = p.slides.add();
    deckBase(s, "scope", "Scope ปัจจุบันควรพูดตาม code จริง: Rework, Storage, DocAI RAG และ Guide", 8, { accent: C.teal });
    const apps = [
      ["Rework", "Quality case workflow", C.blue],
      ["Storage", "Drawing & Master files", C.amber],
      ["DocAI RAG", "Document spec search", C.teal],
      ["Guide", "Interactive user guide", "#50617F"],
    ];
    apps.forEach((app, i) => {
      const x = 100 + i * 275;
      shape(s, { x, y: 210, w: 220, h: 175, fill: C.panel, line: C.hair, width: 1 });
      pill(s, app[0], x + 26, 236, 136, app[2]);
      text(s, { value: app[1], x: x + 26, y: 302, w: 165, h: 48, size: 21, bold: true });
    });
    text(s, { value: "หมายเหตุจากการตรวจ: Roster เหลือ API route แต่ไม่ได้อยู่ใน portal registry ปัจจุบัน จึงไม่ควรขายเป็น module หลักในสไลด์", x: 120, y: 500, w: 1000, h: 54, size: 22, bold: true, color: C.red, align: "center" });
    return s;
  },
  (p) => {
    const s = p.slides.add();
    deckBase(s, "workflow", "Workflow ใหม่รวมเคส หลักฐาน เอกสาร และความรู้ไว้ในเส้นทางเดียว", 9, { accent: C.green });
    flow(s, ["Login", "Open portal", "Create case", "Attach evidence", "Update status", "Search docs"], 62, 214, 1150, C.green);
    bullets(s, [
      "ผู้ใช้เริ่มจาก portal เดียว ไม่ต้องจำ URL หรือ flow แยกหลายชุด",
      "หลักฐานและ item master ถูกผูกกับ case ทำให้ตามรอยย้อนหลังง่าย",
      "RAG sidebar เปิดด้วย Ctrl/Cmd+K เพื่อถามข้อมูลเอกสารระหว่างทำงานได้",
    ], 130, 430, 900, C.green, 52);
    return s;
  },
  (p) => divider(p, "system architecture", "Boundaries make the project defendable", "อาจารย์จะถามว่า frontend, backend, database และ AI เชื่อมกันอย่างไร", 10, C.teal),
  (p) => {
    const s = p.slides.add();
    deckBase(s, "architecture", "Client shell คุม navigation ส่วน API route คุม mutation และ permission", 11, { accent: C.teal });
    const nodes = [
      ["Browser / User", 80, 220, C.blue],
      ["App Shell", 300, 220, C.green],
      ["Next.js API", 520, 220, C.amber],
      ["Supabase", 760, 160, C.teal],
      ["Gemini / RAG", 760, 300, C.red],
      ["Storage Buckets", 1000, 220, C.green],
    ];
    nodes.forEach(([label, x, y, color]) => {
      shape(s, { x, y, w: 162, h: 82, fill: C.panel, line: color, width: 2 });
      text(s, { value: label, x: x + 14, y: y + 28, w: 132, h: 24, size: 16, bold: true, align: "center" });
    });
    ["→", "→", "↗", "↘", "→"].forEach((arrow, i) => {
      const pos = [[250, 245], [470, 245], [700, 210], [700, 300], [930, 245]][i];
      text(s, { value: arrow, x: pos[0], y: pos[1], w: 36, h: 28, size: 24, bold: true, color: C.muted, align: "center" });
    });
    text(s, { value: "Boundary rule: client renders workflow, route handlers enforce auth, database stores operational truth.", x: 120, y: 515, w: 1000, h: 42, size: 24, bold: true, align: "center" });
    return s;
  },
  (p) => {
    const s = p.slides.add();
    deckBase(s, "data model", "Data model แยก operational records, master data, evidence และ document chunks", 12, { accent: C.blue });
    [
      ["rework_cases", "case status, source, valuation"],
      ["rework_items", "item, batch, evidence URLs"],
      ["rework_master_items", "auto-fill and item verification"],
      ["rag_documents", "uploaded document metadata"],
      ["rag_document_chunks", "vector + keyword searchable content"],
      ["rag_feedback", "operator response feedback"],
    ].forEach((row, i) => {
      const x = i < 3 ? 110 : 680;
      const y = 180 + (i % 3) * 100;
      shape(s, { x, y, w: 420, h: 72, fill: C.panel, line: C.hair, width: 1 });
      text(s, { value: row[0], x: x + 24, y: y + 16, w: 180, h: 22, size: 18, bold: true, color: i < 3 ? C.blue : C.teal });
      text(s, { value: row[1], x: x + 215, y: y + 18, w: 175, h: 22, size: 13.5, color: C.muted });
    });
    return s;
  },
  (p) => {
    const s = p.slides.add();
    deckBase(s, "security", "RBAC ถูกตรวจทั้งหน้า UI และ backend permission ก่อน action สำคัญ", 13, { accent: C.red });
    const cols = ["Permission", "QSMS", "OPERATOR", "FINANCE"];
    const rows = [
      ["create_case", "yes", "yes", "no"],
      ["delete_case", "yes", "no", "no"],
      ["update_status", "yes", "yes", "no"],
      ["fill_valuation", "yes", "no", "yes"],
    ];
    cols.forEach((col, i) => {
      shape(s, { x: 115 + i * 240, y: 180, w: 210, h: 48, fill: i === 0 ? C.navy : C.red });
      text(s, { value: col, x: 130 + i * 240, y: 194, w: 180, h: 18, size: 14, bold: true, color: "#FFFFFF", align: "center" });
    });
    rows.forEach((row, r) => row.forEach((cell, i) => {
      shape(s, { x: 115 + i * 240, y: 236 + r * 58, w: 210, h: 46, fill: C.panel, line: C.hair, width: 1 });
      text(s, { value: cell, x: 130 + i * 240, y: 250 + r * 58, w: 180, h: 18, size: 14, bold: i === 0, color: cell === "no" ? C.red : C.ink, align: "center" });
    }));
    text(s, { value: "Security note: ผู้สมัครใหม่ถูกบังคับเป็น OPERATOR และ session ใช้ HTTP-only cookie แทน sessionStorage เป็นแหล่งหลัก", x: 112, y: 525, w: 1000, h: 42, size: 21, bold: true, align: "center", color: C.red });
    return s;
  },
  (p) => divider(p, "module proof", "Show the system through the strongest features", "ไม่ต้องโชว์ทุกหน้าจอ แต่ต้องโชว์ว่าระบบแก้โจทย์จริง", 14, C.green),
  (p) => {
    const s = p.slides.add();
    deckBase(s, "rework module", "Rework module เป็นแกน operation: case, item, evidence, status และ valuation", 15, { accent: C.green });
    card(s, { x: 90, y: 190, w: 300, h: 235, title: "Case creation", body: "รับข้อมูล source, customer, batch, item, reason และรูปหลักฐาน", accent: C.blue });
    card(s, { x: 425, y: 190, w: 300, h: 235, title: "Status workflow", body: "ติดตาม Pending, In-Progress และ Completed", accent: C.green });
    card(s, { x: 760, y: 190, w: 300, h: 235, title: "Controlled updates", body: "partial update, item upsert/delete, valuation permission และ rework_logs", accent: C.amber });
    text(s, { value: "Demo proof: สร้างเคสหนึ่งรายการ แล้วอัปเดตสถานะและดูว่า evidence ยังตามกลับได้", x: 120, y: 520, w: 1000, h: 38, size: 23, bold: true, align: "center", color: C.green });
    return s;
  },
  (p) => {
    const s = p.slides.add();
    deckBase(s, "storage module", "Storage module ป้องกันปัญหา drawing/master ผิด revision และ naming ไม่มาตรฐาน", 16, { accent: C.amber });
    flow(s, ["Upload PDF", "AI extract metadata", "Normalize filename", "Gap analysis", "Revision control"], 80, 200, 1110, C.amber);
    card(s, { x: 160, y: 395, w: 270, h: 130, title: "Metadata", body: "Item Code, Drawing No, Revision, Part Name, Customer", accent: C.amber });
    card(s, { x: 505, y: 395, w: 270, h: 130, title: "Gap signal", body: "แจ้งเอกสาร drawing ที่ยังไม่มี internal master", accent: C.red });
    card(s, { x: 850, y: 395, w: 270, h: 130, title: "Traceability", body: "ไฟล์เก่าเก็บเป็นประวัติ ไม่ลบทิ้งเงียบ ๆ", accent: C.green });
    return s;
  },
  (p) => {
    const s = p.slides.add();
    deckBase(s, "docai rag", "DocAI RAG เพิ่มความสามารถค้นเอกสารแบบ semantic และตอบแบบ streaming", 17, { accent: C.teal });
    flow(s, ["Upload document", "Split chunks", "Create embedding", "Hybrid search", "SSE answer"], 80, 190, 1110, C.teal);
    bullets(s, [
      "Hybrid search รวม vector similarity กับ full-text keyword search",
      "ส่ง chat history เฉพาะช่วงล่าสุดเพื่อลด token cost",
      "มี feedback loop และ source metadata สำหรับปรับคุณภาพคำตอบ",
      "Function calling ยังดึงข้อมูล operational rework บางส่วนจาก main Supabase ได้",
    ], 135, 390, 910, C.teal, 48);
    return s;
  },
  (p) => {
    const s = p.slides.add();
    deckBase(s, "demo plan", "Demo ที่ดีควรเล่าเป็นเส้นทางของเคส ไม่ใช่ทัวร์ทุกเมนู", 18, { accent: C.blue });
    flow(s, ["Login", "Create Rework case", "Attach evidence", "Update status", "Open RAG"], 80, 200, 1110, C.blue);
    flow(s, ["Upload drawing", "Extract metadata", "Check gap", "Review storage", "Summarize benefit"], 80, 365, 1110, C.green);
    text(s, { value: "เวลาแนะนำ: 5-7 นาที เน้นจุดพิสูจน์ 3 อย่าง: traceability, permission, search speed", x: 120, y: 560, w: 1000, h: 36, size: 23, bold: true, align: "center" });
    return s;
  },
  (p) => divider(p, "validation & close", "Defend the quality, then close with trade-offs", "สไลด์ท้ายควรตอบว่าเราพิสูจน์อะไรแล้ว และยังเหลืออะไร", 19, C.amber),
  (p) => {
    const s = p.slides.add();
    deckBase(s, "testing", "Validation ครอบคลุม type safety, component behavior และ user journeys สำคัญ", 20, { accent: C.amber });
    card(s, { x: 90, y: 190, w: 300, h: 220, title: "Type check", body: "npm run lint ใช้ tsc --noEmit เพื่อตรวจ contract และ type safety", accent: C.blue });
    card(s, { x: 425, y: 190, w: 300, h: 220, title: "Unit test", body: "Vitest สำหรับ component/service logic เช่น modal, table, auth service", accent: C.green });
    card(s, { x: 760, y: 190, w: 300, h: 220, title: "E2E test", body: "Playwright สำหรับ login, role access และ workflow ที่ผู้ใช้ต้องทำจริง", accent: C.amber });
    text(s, { value: "ข้อควรพูดตรง ๆ: ถ้ายังไม่ได้รันชุด test ล่าสุด ให้บอกว่าเป็น validation plan และโชว์ manual demo แทน", x: 115, y: 515, w: 1000, h: 40, size: 22, bold: true, color: C.red, align: "center" });
    return s;
  },
  (p) => {
    const s = p.slides.add();
    deckBase(s, "deployment", "Deployment ต้องระวัง environment variables, API quota และข้อมูลลับ", 21, { accent: C.red });
    card(s, { x: 105, y: 190, w: 300, h: 240, title: "Environment", body: "Supabase URL/keys, auth token secret, Gemini key และ RAG Supabase แยก project", accent: C.red });
    card(s, { x: 490, y: 190, w: 300, h: 240, title: "Quota", body: "Gemini, Supabase storage/database และ import/export งานเอกสารมีข้อจำกัดการใช้งาน", accent: C.amber });
    card(s, { x: 875, y: 190, w: 300, h: 240, title: "Production risk", body: ".env.example ต้องไม่หลุดค่าจริง และควรเพิ่ม audit/security policy ก่อนใช้งานจริง", accent: C.blue });
    return s;
  },
  (p) => {
    const s = p.slides.add();
    deckBase(s, "results", "ผลลัพธ์หลักคือ operational traceability ที่ต่อยอดเป็น report และ automation ได้", 22, { accent: C.green });
    stat(s, "Unified", "portal for quality workflows", 110, 205, C.blue);
    stat(s, "Safer", "role-aware backend mutations", 380, 205, C.green);
    stat(s, "Faster", "document search with RAG", 650, 205, C.teal);
    stat(s, "Ready", "for presentation/report export", 920, 205, C.amber);
    text(s, { value: "Future work: notification center, approval workflow, Canva import, analytics dashboard, stronger production audit trail", x: 120, y: 480, w: 1000, h: 58, size: 25, bold: true, align: "center" });
    return s;
  },
  (p) => {
    const s = p.slides.add();
    deckBase(s, "conclusion", "QSMS เปลี่ยนงานคุณภาพจากเอกสารแยกส่วน เป็นระบบที่ตรวจสอบและขยายต่อได้", 23, { dark: true, accent: C.teal });
    text(s, { value: "Final claim", x: 110, y: 205, w: 200, h: 28, size: 20, bold: true, color: "#9FDDE3" });
    text(s, { value: "โปรเจคนี้มีคุณค่าทั้งด้าน operation และ software architecture เพราะแก้ปัญหาจริงด้วย boundary ที่ชัด: portal, API, Supabase, storage และ AI search", x: 110, y: 265, w: 930, h: 120, size: 34, bold: true, face: "Aptos Display", color: "#FFFFFF" });
    text(s, { value: "Q&A", x: 110, y: 520, w: 260, h: 66, size: 54, bold: true, face: "Aptos Display", color: C.teal });
    return s;
  },
];

async function main() {
  await fs.mkdir(PREVIEW, { recursive: true });
  const presentation = Presentation.create({ slideSize: { width: W, height: H } });
  slides.forEach((build) => build(presentation));

  const previewPaths = [];
  for (let index = 0; index < presentation.slides.count; index += 1) {
    const slide = presentation.slides.getItem(index);
    const png = await presentation.export({ slide, format: "png", scale: 1 });
    const previewPath = path.join(PREVIEW, `slide-${String(index + 1).padStart(2, "0")}.png`);
    await fs.writeFile(previewPath, Buffer.from(await png.arrayBuffer()));
    previewPaths.push(previewPath);
  }

  const pptx = await PresentationFile.exportPptx(presentation);
  await pptx.save(OUT);

  const python = "C:/Users/sapho/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe";
  spawnSync(python, [path.join(SKILL_SCRIPTS, "make_contact_sheet.py"), "--output", CONTACT, ...previewPaths], { stdio: "inherit" });

  const stat = await fs.stat(OUT);
  console.log(JSON.stringify({ output: OUT, bytes: stat.size, slides: presentation.slides.count, contactSheet: CONTACT }, null, 2));
}

main().catch((error) => {
  console.error(error.stack || error.message || String(error));
  process.exit(1);
});
