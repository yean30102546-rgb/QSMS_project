"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence, type Variants } from "motion/react";
import {
  ChevronRight, ChevronLeft, ArrowLeft,
  AlertTriangle, FileText, LayoutGrid, CheckCircle2, TrendingDown,
  Clock, CheckCircle, Database, Layers, Cpu, ShieldCheck,
  Bot, Search, Maximize2, Minimize2, ZoomIn, ZoomOut, Move, RotateCcw,
  Users, HelpCircle, Award, Zap, MessageSquare, X,
  Globe, Server, Table, Key, Workflow, Activity, ArrowUpRight,
  ShieldAlert, Package, BookOpen, ExternalLink
} from "lucide-react";
import { Button } from "@/src/components/ui/button";

export type SlideCategory = "all" | "sec1_problem" | "sec2_solution" | "sec3_architecture" | "sec4_demo" | "sec5_impact";

type Slide = {
  id: number;
  category: SlideCategory;
  type: "title" | "split" | "visual-showcase" | "architecture-flow" | "conclusion" | "asymmetric-hero" | "parallel-pipelines" | "comparison-table" | "defense-qa" | "split-protocol-radar";
  chapter: string;
  title: string;
  subtitle?: string;
  description?: string;
  speakerNotes?: string;
  bullets?: { title: string; desc: string; icon: React.ReactNode; badge?: string; metric?: string }[];
  showcase?: {
    imageSrc: string;
    windowTitle: string;
    caption: string;
    statusBadge?: string;
    pointsTitle: string;
    points: { tag: string; title: string; desc: string }[];
  };
  flowSteps?: {
    step: number;
    title: string;
    subtitle: string;
    desc: string;
    tag: string;
    icon: React.ReactNode;
    subitems: string[];
    color: string;
  }[];
  asymmetricHero?: {
    heroMetric: string;
    heroTitle: string;
    heroSubtitle: string;
    checklist: string[];
    badge: string;
    color: string;
  };
  parallelPipelines?: {
    leftPipeline: { title: string; tag: string; color: string; steps: { title: string; desc: string; tag: string }[] };
    rightPipeline: { title: string; tag: string; color: string; steps: { title: string; desc: string; tag: string }[] };
  };
  comparisonTable?: {
    headers: string[];
    rows: { metric: string; legacy: string; qsms: string; impact: string; isPositive: boolean }[];
  };
  defenseQAs?: {
    qNum: string;
    tag: string;
    question: string;
    defense: string;
    badge: string;
    color: string;
  }[];
  splitProtocolRadar?: {
    protocolGates: { gate: string; title: string; desc: string; color: string }[];
    radarStages: { stage: string; role: string; sla: string; isAlert: boolean }[];
  };
  futureRoadmap?: {
    title: string;
    horizon: string;
    desc: string;
    icon: React.ReactNode;
    tags: string[];
  }[];
  roadmapPhases?: { phase: string; title: string; time: string; points: string[]; color: string; icon: React.ReactNode }[];
};

export function GuideApp({ onBackToPortal }: { onBackToPortal?: () => void }) {
  const [selectedCategory, setSelectedCategory] = useState<SlideCategory>("all");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [direction, setDirection] = useState(0);

  // Allow deep linking via ?slide=<index>
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const slideParam = params.get('slide');
      if (slideParam !== null) {
        const target = parseInt(slideParam, 10);
        if (!isNaN(target) && target >= 0) {
          setCurrentIdx(target);
        }
      }
    }
  }, []);

  const [scale, setScale] = useState(1);
  const [userZoom, setUserZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; panX: number; panY: number } | null>(null);

  const [isQaOpen, setIsQaOpen] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [isNavVisible, setIsNavVisible] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleZoomIn = useCallback(() => {
    setUserZoom(prev => Math.min(Number((prev + 0.15).toFixed(2)), 2.0));
  }, []);

  const handleZoomOut = useCallback(() => {
    setUserZoom(prev => {
      const next = Math.max(Number((prev - 0.15).toFixed(2)), 0.75);
      if (next <= 1) setPanOffset({ x: 0, y: 0 });
      return next;
    });
  }, []);

  const handleResetZoom = useCallback(() => {
    setUserZoom(1);
    setPanOffset({ x: 0, y: 0 });
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error("Error attempting to enable full-screen mode:", err);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(err => {
          console.error("Error attempting to disable full-screen mode:", err);
        });
      }
    }
  }, []);

  useEffect(() => {
    setPanOffset({ x: 0, y: 0 });
  }, [currentIdx, selectedCategory]);

  const handleResize = useCallback(() => {
    const f = Math.min(window.innerWidth / 2560, window.innerHeight / 1440);
    setScale(f);
  }, []);

  useEffect(() => {
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [handleResize]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      setTimeout(() => {
        handleResize();
      }, 100);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [handleResize]);

  // Ctrl + Wheel Zoom
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        if (e.deltaY < 0) {
          setUserZoom(prev => Math.min(Number((prev + 0.1).toFixed(2)), 2.0));
        } else {
          setUserZoom(prev => {
            const next = Math.max(Number((prev - 0.1).toFixed(2)), 0.75);
            if (next <= 1) setPanOffset({ x: 0, y: 0 });
            return next;
          });
        }
      }
    };
    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (userZoom <= 1) return;
    const target = e.target as HTMLElement;
    if (target.closest('button, input, textarea, select, a, [role="button"], .interactive-control')) return;

    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      panX: panOffset.x,
      panY: panOffset.y,
    };
  }, [userZoom, panOffset]);

  useEffect(() => {
    if (!isDragging) return;

    const handleWindowMouseMove = (e: MouseEvent) => {
      if (!dragStartRef.current) return;
      const dx = e.clientX - dragStartRef.current.mouseX;
      const dy = e.clientY - dragStartRef.current.mouseY;

      const maxPanX = Math.max(400, (2560 * scale * (userZoom - 0.85)) / 1.5);
      const maxPanY = Math.max(300, (1440 * scale * (userZoom - 0.85)) / 1.5);

      const targetX = dragStartRef.current.panX + dx;
      const targetY = dragStartRef.current.panY + dy;

      const clampedX = Math.max(-maxPanX, Math.min(maxPanX, targetX));
      const clampedY = Math.max(-maxPanY, Math.min(maxPanY, targetY));

      setPanOffset({ x: clampedX, y: clampedY });
    };

    const handleWindowMouseUp = () => {
      setIsDragging(false);
      dragStartRef.current = null;
    };

    window.addEventListener("mousemove", handleWindowMouseMove);
    window.addEventListener("mouseup", handleWindowMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleWindowMouseMove);
      window.removeEventListener("mouseup", handleWindowMouseUp);
    };
  }, [isDragging, scale, userZoom]);

  // 12 Distinct, Content-Driven Architecture Slides (Zero 2x2 Repetition, Low-Text, Image-First)
  const allSlides: Slide[] = useMemo(() => [
    // ==========================================
    // SECTION 1: PROBLEM STATEMENT & CONTEXT (3 Slides)
    // ==========================================
    {
      id: 1,
      category: "sec1_problem",
      type: "title",
      chapter: "SECTION 01 / INDUSTRIAL CONTEXT & PROBLEM",
      title: "QSMS Rework Management Platform",
      subtitle: "Closed-Loop MES & Multimodal AI Operations Architecture",
      description: "ระบบบริหารจัดการกระบวนการแก้ไขผลิตภัณฑ์ (Rework) และคลังเอกสารมาตรฐานการผลิตอัจฉริยะสำหรับอุตสาหกรรมบรรจุภัณฑ์ปิโตรเคมี",
      speakerNotes: "กล่าวทักทายคณะกรรมการ: แนะนำตัวและนำเสนอระบบ QSMS เพื่อแก้ปัญหาความสูญเสียในกระบวนการ Rework ของโรงงานบรรจุภัณฑ์น้ำมันและเคมีภัณฑ์ ด้วยสถาปัตยกรรม Closed-Loop และ AI เพื่อแก้ปัญหาความสูญเปล่าและการขาดการตรวจสอบย้อนกลับ",
    },
    {
      id: 2,
      category: "sec1_problem",
      type: "architecture-flow",
      chapter: "01.2 / OPERATIONAL PAIN POINTS",
      title: "Legacy Operational Waste Chain",
      subtitle: "ลูกโซ่ความสูญเปล่าเรื้อรังจากกระบวนการเดิมที่จัดการผ่านกระดาษและ Google Sheets",
      speakerNotes: "อธิบายลูกโซ่ความสูญเปล่าในกระบวนการเดิม 4 ขั้นตอน: จากการจดกระดาษล่าช้า 12.5 นาที ส่งผลให้คลังเบิกของมากองรอโดยไม่มีออเดอร์ (ยกซ้ำ 2 รอบ) เกิดข้อผิดพลาดพิมพ์รหัสผิด 8.3% และระบบ Google Sheets ล็อกเมื่อบันทึกข้อมูลพร้อมกัน",
      flowSteps: [
        {
          step: 1,
          title: "Paper & Excel Silos",
          subtitle: "12.5 นาที / เคส",
          desc: "จดข้อมูลใส่กระดาษหน้าไลน์แล้วพิมพ์ซ้ำลงสเปรดชีต ข้อมูลกระจัดกระจาย ไม่เห็นยอดงานซ่อมแบบเรียลไทม์",
          tag: "HIGH LATENCY",
          icon: <AlertTriangle className="w-6 h-6 text-rose-500" />,
          color: "rose",
          subitems: ["บันทึกซ้ำซ้อน 2 ต่อ", "ดีเลย์ข้ามวันกว่าจะรู้ยอด", "ผู้บริหารขาด Visibility"]
        },
        {
          step: 2,
          title: "Premature Requisition",
          subtitle: "2x ขนย้ายซ้ำซ้อน",
          desc: "คลัง (WPK) ดึงบรรจุภัณฑ์มากองรอก่อนรู้ BOM สเปกจริง ก่อให้เกิด Double Handling ยกซ้ำ",
          tag: "WASTE REQUISITION",
          icon: <TrendingDown className="w-6 h-6 text-amber-500" />,
          color: "amber",
          subitems: ["เบิกกล่องมากองรอไร้ออเดอร์", "เสี่ยงชำรุด สูญหาย ปนเปื้อน", "เสียแรงงานยกของไป-กลับ"]
        },
        {
          step: 3,
          title: "Human Error in Codes",
          subtitle: "8.3% รหัสผิดพลาด",
          desc: "พิมพ์รหัสสินค้า 13 หลักผิดพลาดบ่อยครั้ง และมีรูปหลักฐานแนบเพียง 35% ขาด Traceability",
          tag: "ZERO PROOF",
          icon: <ShieldAlert className="w-6 h-6 text-purple-500" />,
          color: "purple",
          subitems: ["สับสนรหัสสูตรน้ำมันใกล้เคียง", "ไร้รูปหลักฐานตรวจสอบย้อนกลับ", "กระทบต่อใบเคลมลูกค้า OR"]
        },
        {
          step: 4,
          title: "GAS Concurrency Lock",
          subtitle: "100 req/m Limit",
          desc: "ติด Rate Limit ของ Google Apps Script ข้อมูลเขียนทับกันและไม่รองรับ ACID Transactions",
          tag: "SYSTEM LOCK",
          icon: <Clock className="w-6 h-6 text-blue-500" />,
          color: "blue",
          subitems: ["เกิด Race Condition ข้อมูลหาย", "สคริปต์หยุดทำงานเมื่อชนกัน", "ไม่รองรับระบบจัดเก็บเวกเตอร์"]
        }
      ]
    },
    {
      id: 3,
      category: "sec1_problem",
      type: "asymmetric-hero",
      chapter: "01.3 / PROJECT OBJECTIVES",
      title: "4 Measurable Engineering Targets",
      subtitle: "เป้าหมายเชิงวิศวกรรมที่กำหนดไว้อย่างชัดเจนเพื่อเปลี่ยนผ่านกระบวนการผลิตสู่ระบบดิจิทัล (Digitization)",
      speakerNotes: "อธิบาย 4 วัตถุประสงค์หลัก: จุดหลักคือ Closed-Loop MES 100% สนับสนุนด้วย 3 เสาหลัก ได้แก่ ข้อผิดพลาดเป็น 0%, AI OCR แม่นยำเกิน 95% และค้นหาคู่มือ SOP ด้วย DocAI ภายใน 1 นาที",
      asymmetricHero: {
        badge: "MASTER PROCESS TARGET",
        heroMetric: "100%",
        heroTitle: "Closed-Loop MES JIT Kitting",
        heroSubtitle: "เปลี่ยนผ่านสู่กระบวนการดิจิทัลไร้กระดาษรอบเดียวจบ:",
        checklist: [
          "ควบคุมการส่งมอบงาน 5 ขั้นตอน (QSMS ➔ WPK ➔ PDF ➔ QC)",
          "ออก BOM เบิกวัสดุรอบเดียวจบ ขจัดปัญหาการเบิกของคั่งค้าง",
          "Operations Bottleneck Radar คำนวณคอขวดแบบเรียลไทม์",
          "ตรวจสอบย้อนกลับ (Traceability) ได้ทุกขั้นตอน 100%"
        ],
        color: "blue"
      },
      bullets: [
        {
          metric: "0.0%",
          title: "Zero Human Error & Enforced Evidence",
          desc: "ตรวจสอบรหัสสินค้ากับ Master อัตโนมัติ บังคับแนบรูปถ่ายหลักฐานทุกรายการ หากอัปโหลดไม่ผ่านจะ Rollback ธุรกรรมทันที",
          badge: "DATA INTEGRITY",
          icon: <ShieldCheck className="w-6 h-6 text-blue-500" />
        },
        {
          metric: ">95%",
          title: "Multimodal AI Drawing Extraction",
          desc: "สกัดข้อมูลแบบแปลนวิศวกรรม PDF 7-8 ฟิลด์เข้าสู่ระบบด้วย Gemini Multimodal โดยไม่ต้องกรอกมือ พร้อมระบบ 3-Tier Fallback",
          badge: "AI BENCHMARK",
          icon: <Cpu className="w-6 h-6 text-indigo-500" />
        },
        {
          metric: "<1 min",
          title: "DocAI RAG Intelligent Assistant",
          desc: "ค้นหาแนวทางแก้ไขปัญหา Rework จากคู่มือมาตรฐาน (SOP) ผ่าน Semantic Vector Search 768 มิติ ภายใน 1 นาที",
          badge: "KNOWLEDGE AGILITY",
          icon: <Bot className="w-6 h-6 text-teal-500" />
        }
      ]
    },

    // ==========================================
    // SECTION 2: SOLUTION ARCHITECTURE & MES WORKFLOW (2 Slides)
    // ==========================================
    {
      id: 4,
      category: "sec2_solution",
      type: "architecture-flow",
      chapter: "SECTION 02 / MES WORKFLOW & LOGISTICS",
      title: "Closed-Loop JIT Single-Batch Kitting",
      subtitle: "การออกแบบกระบวนการผลิต (Process Design) เพื่อขจัดปัญหาสินค้าคั่งค้างและการเบิกเกิน",
      speakerNotes: "อธิบายกระบวนการ Closed-Loop JIT: ไม่ให้ WPK เบิกของก่อน แต่ให้ QSMS วิเคราะห์ออก BOM รอบเดียว จากนั้น WPK จ่ายชิ้นส่วน แล้ว PDF ตรวจรับ (Handshake) ก่อนลงมือซ่อม",
      flowSteps: [
        {
          step: 1,
          title: "QSMS Analysis & BOM Freeze",
          subtitle: "วิเคราะห์และล็อกสูตรชิ้นส่วน",
          desc: "เจ้าหน้าที่ QSMS ตรวจสอบสาเหตุ กำหนดสูตรการแก้ไข และล็อกรายการวัสดุ (BOM) ที่จำเป็นต้องใช้",
          tag: "ANALYSIS GATE",
          icon: <Search className="w-6 h-6 text-blue-600" />,
          color: "blue",
          subitems: ["วิเคราะห์สาเหตุ (Defect Analysis)", "กำหนดสูตรชิ้นส่วนและปริมาณ", "สร้างใบเบิกวัสดุ (Material BOM)"]
        },
        {
          step: 2,
          title: "WPK Single-Batch Issuance",
          subtitle: "จัดของรอบเดียวครบชุด (JIT)",
          desc: "ฝ่ายคลังบรรจุภัณฑ์ (WPK) เตรียมและจ่ายชิ้นส่วนครบชุดรอบเดียวตาม BOM ที่อนุมัติ ป้องกันการกักตุน",
          tag: "JIT DISPATCH",
          icon: <Package className="w-6 h-6 text-amber-600" />,
          color: "amber",
          subitems: ["เบิกกล่อง/แกลลอนตามยอดจริง", "จัดชุดอุปกรณ์ครบเซ็ต Single-batch", "ส่งมอบไปยังจุดปฏิบัติงานซ่อม"]
        },
        {
          step: 3,
          title: "PDF Handshake & Repair Execution",
          subtitle: "ตรวจรับและลงมือซ่อมแซม",
          desc: "ฝ่ายผลิต (PDF) ตรวจรับชิ้นส่วนหน้างาน ยืนยันความครบถ้วนแล้วจึงเริ่มซ่อมและบันทึกยอดกล่อง",
          tag: "CONFIRMED RECEIPT",
          icon: <CheckCircle2 className="w-6 h-6 text-emerald-600" />,
          color: "emerald",
          subitems: ["ตรวจนับชิ้นส่วนครบตามสเปก", "กดยืนยันรับมอบงาน (Handshake)", "ลงมือซ่อมและบันทึกยอดความคืบหน้า"]
        }
      ]
    },
    {
      id: 5,
      category: "sec2_solution",
      type: "split-protocol-radar",
      chapter: "02.2 / OPERATIONAL CONTROL",
      title: "Two-Way Handshake & 5-Stage Bottleneck Radar",
      subtitle: "กลไกการถ่ายโอนความรับผิดชอบข้ามแผนก และการตรวจจับจุดคอขวดแบบเรียลไทม์",
      speakerNotes: "จุดเด่นคือ Two-Way Handshake: ฝั่งซ้ายคือ 3 ประตูส่งมอบงาน ถ้าของไม่ครบจะติด Defend Mode ทันที ส่วนฝั่งขวาคือ Bottleneck Radar คำนวณเวลางานค้าง 5 สถานะ ชี้เป้าแผนกที่ติดคอขวดแบบเรียลไทม์",
      splitProtocolRadar: {
        protocolGates: [
          {
            gate: "Gate 1",
            title: "QSMS Analysis & Material Request",
            desc: "วิเคราะห์ตำหนิและสร้างรายการเบิก ส่งต่องานไปยังสถานะ Awaiting Materials",
            color: "blue"
          },
          {
            gate: "Gate 2",
            title: "WPK Single-Batch Handover & Defend Mode",
            desc: "คลังจ่ายของครบส่งต่อ หากของขาดหรือสูญหาย ระบบเข้าสู่ Blocked (Defend Mode) ทันที",
            color: "rose"
          },
          {
            gate: "Gate 3",
            title: "PDF Receipt & Accountability Protection",
            desc: "ช่างตรวจนับก่อนยืนยันรับงาน ความรับผิดชอบของล่าช้าจะไม่ตกอยู่ที่ฝ่ายผลิต",
            color: "emerald"
          }
        ],
        radarStages: [
          { stage: "1. Pending Analysis", role: "QSMS วิเคราะห์หาสาเหตุ", sla: "SLA: < 2 ชม.", isAlert: false },
          { stage: "2. Awaiting Materials", role: "WPK เตรียมชิ้นส่วนและกล่อง", sla: "SLA: < 4 ชม.", isAlert: false },
          { stage: "3. In-Progress", role: "PDF รับของและลงมือซ่อมแซม", sla: "SLA: < 24 ชม.", isAlert: false },
          { stage: "4. Blocked (Defend Mode)", role: "ติดปัญหาของขาด / รอน้ำมัน", sla: "ALERT ⚠️", isAlert: true },
          { stage: "5. Completed", role: "QC ตรวจรับมาตรฐานปิดเคส", sla: "FINAL SIGN-OFF", isAlert: false }
        ]
      }
    },

    // ==========================================
    // SECTION 3: TECHNICAL DEEP-DIVE & ARCHITECTURE (3 Slides)
    // ==========================================
    {
      id: 6,
      category: "sec3_architecture",
      type: "visual-showcase",
      chapter: "SECTION 03 / SYSTEM ARCHITECTURE",
      title: "4-Layer Enterprise System Topology",
      subtitle: "สถาปัตยกรรมระบบแบบ Hybrid Serverless Decoupled Architecture ปลอดภัยและไร้ต้นทุนส่วนเกิน",
      speakerNotes: "อธิบาย System Architecture 4 เลเยอร์: ซ่อน Secrets ทั้งหมดหลัง Next.js API Routes, ข้อมูลเก็บใน PostgreSQL รองรับ ACID และ pgvector 768 มิติ",
      showcase: {
        imageSrc: "/assets/architecture_diagram.png",
        windowTitle: "System Architecture Topology (4-Tier Decoupled Infrastructure)",
        caption: "Client SPA Shell ➔ Next.js API Boundary ➔ Supabase pgvector & ACID Storage ➔ Gemini & Jina AI Engines",
        statusBadge: "PRODUCTION TOPOLOGY",
        pointsTitle: "Key Architectural Highlights",
        points: [
          {
            tag: "SECURITY",
            title: "Next.js API Boundary",
            desc: "แยก Client ออกจาก Data Layer โดยเด็ดขาด จัดการ Session และซ่อน API Keys ฝั่งเซิร์ฟเวอร์"
          },
          {
            tag: "ACID STORAGE",
            title: "Supabase PostgreSQL",
            desc: "ฐานข้อมูลหลักรองรับ Row-Level Security (RLS), ACID Transactions และ pgvector 768 มิติ"
          },
          {
            tag: "AI ENGINES",
            title: "Gemini 3.1 & Jina AI",
            desc: "ผสาน Jina Embeddings v5 สำหรับสืบค้นความหมาย และ Gemini Flash-Lite สำหรับ Streaming Chat"
          }
        ]
      }
    },
    {
      id: 7,
      category: "sec3_architecture",
      type: "visual-showcase",
      chapter: "03.2 / DATABASE ARCHITECTURE",
      title: "Supabase Relational Database Schema (ERD)",
      subtitle: "แบบจำลองฐานข้อมูลเชิงสัมพันธ์ 8 ตารางหลัก พร้อมข้อกำหนด Foreign Keys, RLS และ Indexes",
      speakerNotes: "อธิบายผัง ERD 8 ตารางหลัก: เชื่อมโยง 1:N และ N:M ด้วย Foreign Key พร้อม Cascade Delete และ HNSW Vector Index ขนาด 768 มิติ",
      showcase: {
        imageSrc: "/assets/erd_diagram.png",
        windowTitle: "Entity Relationship Diagram (8 Core Relational Tables)",
        caption: "Supabase PostgreSQL Relational Schema with Strict Foreign Keys, RLS, and pgvector HNSW Index",
        statusBadge: "ACID COMPLIANT",
        pointsTitle: "Core Schema Highlights",
        points: [
          {
            tag: "REWORK CORE",
            title: "rework_cases & items",
            desc: "ความสัมพันธ์ 1:N และ 1:N สู่ material_requests ตรวจสอบย้อนกลับได้ทุกประวัติการซ่อม"
          },
          {
            tag: "CATALOGS",
            title: "item_master & drawings",
            desc: "คลังข้อมูลสินค้าและแบบแปลนวิศวกรรมพร้อมฟิลด์ Metadata แยกตามสเปกจริง"
          },
          {
            tag: "PGVECTOR",
            title: "document_chunks & vectors",
            desc: "เก็บ Chunks และเวกเตอร์ 768 มิติ พร้อม HNSW Index สำหรับฟังก์ชัน hybrid_search_chunks"
          }
        ]
      }
    },
    {
      id: 8,
      category: "sec3_architecture",
      type: "parallel-pipelines",
      chapter: "03.3 / AI ENGINEERING PIPELINES",
      title: "Multimodal Drawing OCR & DocAI RAG",
      subtitle: "วิศวกรรมปัญญาประดิษฐ์เพื่อการสกัดข้อมูลแม่นยำสูง และการสืบค้นองค์ความรู้ทางเทคนิคแบบเรียลไทม์",
      speakerNotes: "วิศวกรรม AI แบ่งออกเป็น 2 ท่อส่งข้อมูลที่ชัดเจน: ฝั่งซ้ายคือ Multimodal Drawing OCR สำหรับสกัดแบบแปลน PDF พร้อม 3-Tier Fallback ส่วนฝั่งขวาคือ DocAI Semantic RAG Engine ใช้ Jina 768 มิติ และ Supabase pgvector ร่วมกับ Streaming SSE Chat",
      parallelPipelines: {
        leftPipeline: {
          title: "Gemini Multimodal Drawing OCR",
          tag: "PIPELINE A • VISION OCR",
          color: "blue",
          steps: [
            { title: "PDF Multi-page Conversion", desc: "แปลงหน้าเอกสาร PDF สแกนเป็น JPEG ความละเอียดสูง (300 DPI)", tag: "300 DPI" },
            { title: "3-Tier Fault-Tolerant Cascade", desc: "สลับโมเดลอัตโนมัติเมื่อเจอ 503: 3.1 Flash ➔ Flash-Lite ➔ 3.8 Flash สำเร็จ 100%", tag: "FAILOVER" },
            { title: "Structured Schema Extraction", desc: "สกัดฟิลด์ Drawing 7 ฟิลด์ / Master Sheet 8 ฟิลด์ เป็น JSON Structured Output", tag: "JSON SCHEMA" },
            { title: "55/45 Split-View Verification", desc: "แผงตรวจทานคู่ขนาน Human-in-the-Loop ให้วิศวกรตรวจเทียบก่อนยืนยัน", tag: "HUMAN AUDIT" }
          ]
        },
        rightPipeline: {
          title: "DocAI Semantic Knowledge Engine",
          tag: "PIPELINE B • HYBRID RAG",
          color: "emerald",
          steps: [
            { title: "Document Chunking & Parsing", desc: "ตัดแบ่งคู่มือมาตรฐาน SOP และ Rework Manual ออกเป็นส่วนย่อยแบบ Semantic Chunks", tag: "CHUNKING" },
            { title: "Jina Embeddings v5 Vectorization", desc: "แปลงข้อความเป็น Dense Vectors ขนาด 768 มิติ แม่นยำสูงต่อศัพท์เทคนิค", tag: "768-DIM" },
            { title: "Supabase pgvector HNSW Index", desc: "สืบค้นความหมายผ่าน hybrid_search_chunks ร่วมกับ Full-Text Keyword Search", tag: "HNSW INDEX" },
            { title: "Streaming SSE Chat & Function Call", desc: "ตอบคำถามแบบสตรีมมิ่งสด พร้อมเรียก Tool get_rework_statistics แสดงสถิติจริง", tag: "REAL-TIME SSE" }
          ]
        }
      }
    },

    // ==========================================
    // SECTION 4: LIVE DEMONSTRATION (1 Slide Roadmap)
    // ==========================================
    {
      id: 9,
      category: "sec4_demo",
      type: "architecture-flow",
      chapter: "SECTION 04 / LIVE SYSTEM DEMONSTRATION",
      title: "Production Live Demonstration Roadmap",
      subtitle: "การสาธิตระบบจริงบน Production Environment ตามเส้นทางประสบการณ์ผู้ใช้งาน (User Journey)",
      speakerNotes: "สไลด์นี้เป็น Roadmap แนะนำ 4 ขั้นตอนที่กำลังจะเปิดระบบจริงให้ดู: 1. สร้างเคส 2. Handover และดูคอขวด 3. ทดสอบ AI Drawing 4. ทดสอบ DocAI Chat -> สลับหน้าจอ (Alt+Tab) เข้าสู่ระบบจริงทันที",
      flowSteps: [
        {
          step: 1,
          title: "Case Initiation & Autofill",
          subtitle: "เปิดเคสและสืบค้น Master",
          desc: "เปิดเคส RT/RW ค้นหาสินค้าด้วยปุ่มแว่นขยาย ดึงข้อมูลจาก Master เติมอัตโนมัติ พร้อมบังคับรูปหลักฐาน",
          tag: "LIVE CREATION",
          icon: <FileText className="w-6 h-6 text-blue-600" />,
          color: "blue",
          subitems: ["เคส RT บังคับแนบไฟล์อ้างอิง", "ค้นหาอัตโนมัติด้วยแว่นขยาย", "ระบบ Transaction Rollback รูปภาพ"]
        },
        {
          step: 2,
          title: "Handover & Bottleneck Detection",
          subtitle: "ส่งมอบงานและคำนวณคอขวด",
          desc: "จำลองการส่งมอบงานข้ามแผนก QSMS ➔ WPK ➔ PDF ตรวจสอบ Defend Mode และ Bottleneck Radar",
          tag: "MES WORKFLOW",
          icon: <Workflow className="w-6 h-6 text-purple-600" />,
          color: "purple",
          subitems: ["เปลี่ยนสถานะตามสิทธิ์ RBAC", "ทดสอบ Defend Mode เมื่อของขาด", "Bottleneck Radar แสดงผลเรียลไทม์"]
        },
        {
          step: 3,
          title: "AI Drawing Split-View Workspace",
          subtitle: "วิเคราะห์แบบแปลนและตรวจทาน",
          desc: "อัปโหลด PDF แบบแปลน, AI OCR สกัดฟิลด์อัตโนมัติ, ตรวจเทียบข้อมูลในแผง 55/45 Split-view",
          tag: "AI OCR INSPECT",
          icon: <Cpu className="w-6 h-6 text-indigo-600" />,
          color: "indigo",
          subitems: ["OCR สกัดฟิลด์ Drawing/Master", "แผง Split-view ตรวจทาน 55/45", "ระบบหมุนภาพ PDF อัตโนมัติ"]
        },
        {
          step: 4,
          title: "DocAI Technical Chat Assistant",
          subtitle: "ถามตอบคู่มือเทคนิคและสถิติ",
          desc: "ทดสอบพิมพ์ถามคำถามเทคนิค Rework หน้างาน, แสดงคำตอบแบบสตรีมมิ่งพร้อมเอกสารอ้างอิง",
          tag: "DOCAI RAG",
          icon: <Bot className="w-6 h-6 text-teal-600" />,
          color: "teal",
          subitems: ["Streaming SSE Chat ลื่นไหล", "อ้างอิงคู่มือ SOP และหน้าเอกสาร", "Function Calling ดึงสถิติสดย้อนหลัง"]
        }
      ]
    },

    // ==========================================
    // SECTION 5: EVALUATION, IMPACT & CONCLUSION (3 Slides)
    // ==========================================
    {
      id: 10,
      category: "sec5_impact",
      type: "asymmetric-hero",
      chapter: "SECTION 05 / TESTING & EVALUATION",
      title: "Empirical AI Benchmarks & System Verification",
      subtitle: "ผลการประเมินความแม่นยำของโมเดล AI และความสมบูรณ์ของระบบด้วยชุดทดสอบอัตโนมัติ",
      speakerNotes: "สรุปผลการประเมิน: AI OCR มีความแม่นยำ 96.36% อิง Ground Truth 100 รายการทดสอบ ผ่านการคำนวณ Wilson 95% Confidence Interval พร้อมชุดทดสอบ Vitest 131 เคส ผ่าน 100% และมี Atomic Rollback ป้องกันข้อมูลรูปภาพสูญหาย",
      asymmetricHero: {
        badge: "EMPIRICAL GROUND TRUTH",
        heroMetric: "96.36%",
        heroTitle: "Overall AI OCR F1-Score",
        heroSubtitle: "ประเมินเทียบกับเอกสารสแกนจริง 55 ชุด (100 รายการทดสอบ):",
        checklist: [
          "Engineering Drawings: 99.20% Precision",
          "Internal Master Sheets: 99.60% Precision",
          "Wilson 95% Confidence Interval: [0.93 - 0.98]",
          "การันตีความเสถียร ไม่เกิด Hallucination ในฟิลด์สำคัญ"
        ],
        color: "blue"
      },
      bullets: [
        {
          metric: "131 Tests",
          title: "Vitest Automated Test Suite (100% Pass)",
          desc: "ครอบคลุม Unit Tests สำหรับ Data Contracts, Master Verification, และ Business Calculations ผ่านทั้งหมด",
          badge: "AUTOMATED QA",
          icon: <CheckCircle2 className="w-6 h-6 text-emerald-500" />
        },
        {
          metric: "Zero-Drop",
          title: "Atomic Transaction & Evidence Rollback",
          desc: "อัปโหลดภาพหลักฐานไม่ผ่านจะ Rollback ธุรกรรมทันที ขจัดปัญหาขยะข้อมูลค้างในระบบเป็น 0",
          badge: "DATA INTEGRITY",
          icon: <Database className="w-6 h-6 text-rose-500" />
        },
        {
          metric: "100% Up",
          title: "3-Tier Fault-Tolerant Cascade Resilience",
          desc: "ผ่านการทดสอบจำลอง Error 503 สลับโมเดลอัตโนมัติ (Flash ➔ Flash-Lite ➔ 3.8 Flash) ไร้ Downtime",
          badge: "HIGH AVAILABILITY",
          icon: <Layers className="w-6 h-6 text-indigo-500" />
        }
      ]
    },
    {
      id: 11,
      category: "sec5_impact",
      type: "comparison-table",
      chapter: "05.2 / OPERATIONAL IMPACT",
      title: "Measured Operational KPIs: Before vs After",
      subtitle: "เปรียบเทียบผลลัพธ์เชิงปฏิบัติการระหว่างกระบวนการเดิมกับระบบ QSMS จากการใช้งานจริง",
      speakerNotes: "ตารางเปรียบเทียบ Before vs After: เวลาเปิดเคสลดลง 66.4%, ข้อผิดพลาดรหัสกลายเป็น 0%, ขจัดปัญหาเบิกกล่องมากองรอ (Double Handling) เป็น 0 ครั้ง ค้นหาเอกสารเร็วขึ้น 95.8% และประหยัดต้นทุนคลาวด์ 100% ด้วยสถาปัตยกรรม Zero-Cost Capacity",
      comparisonTable: {
        headers: ["OPERATIONAL METRIC (มิติการวัดผล)", "LEGACY PROCESS (ระบบเดิม)", "QSMS DIGITAL MES (ระบบใหม่)", "IMPACT (ผลลัพธ์)"],
        rows: [
          {
            metric: "Case Initiation Cycle Time (เวลาเปิดเคส)",
            legacy: "12.5 นาที / เคส",
            qsms: "4.2 นาที / เคส",
            impact: "🟢 ลดลง 66.4% (-8.3 นาที)",
            isPositive: true
          },
          {
            metric: "Human Error in Master Code (ข้อผิดพลาดรหัส)",
            legacy: "8.3% (พิมพ์รหัสผิดประจำ)",
            qsms: "0.0% (Verified 100%)",
            impact: "🟢 ขจัดข้อผิดพลาดหมด 100%",
            isPositive: true
          },
          {
            metric: "Double Handling (การเบิกของมารอซ้ำซ้อน)",
            legacy: "2x รอบ (เบิกก่อนสเปกจริง)",
            qsms: "0 ครั้ง (Single-Batch Kit)",
            impact: "🟢 ปัญหาของคั่งค้างเป็น 0",
            isPositive: true
          },
          {
            metric: "Drawing & SOP Discovery (เวลาค้นหาเอกสาร)",
            legacy: "18 นาที (เดินหาแฟ้มกระดาษ)",
            qsms: "45 วินาที (DocAI Search)",
            impact: "🟢 เร็วขึ้น 95.8%",
            isPositive: true
          },
          {
            metric: "Monthly Cloud Infrastructure Cost (ต้นทุนคลาวด์)",
            legacy: "N/A (Google Sheets ล็อก)",
            qsms: "0 บาท (Free Tier Capacity)",
            impact: "🟢 ใช้งานฟรีได้นานกว่า 5 ปี",
            isPositive: true
          }
        ]
      }
    },
    {
      id: 12,
      category: "sec5_impact",
      type: "defense-qa",
      chapter: "05.3 / CONCLUSION & DEFENSE",
      title: "Engineering Defense Q&A & Key Takeaways",
      subtitle: "สรุปคุณค่าทางวิศวกรรม ข้อจำกัดที่พบจริง และการเตรียมความพร้อมตอบข้อซักถามในการสอบป้องกัน",
      speakerNotes: "สรุปภาพรวมและเปิดรับคำถามจากคณะกรรมการ โดยพร้อมชี้แจงประเด็น RBAC, AI Safety, Concurrency, และ Roadmap ในอนาคต",
      defenseQAs: [
        {
          qNum: "Q1 • SECURITY",
          tag: "SECURITY BOUNDARY",
          question: "การจัดการสิทธิ์และความปลอดภัย (RBAC)?",
          defense: "แยกสิทธิ์ QSMS/Admin และ Operator ผ่าน Server-Side JWT Verification และ HTTP-only Cookies ป้องกัน Client Spoofing 100%",
          badge: "DEFENSE READY",
          color: "blue"
        },
        {
          qNum: "Q2 • AI SAFETY",
          tag: "AI SAFETY & GUARDRAILS",
          question: "ถ้า AI OCR อ่านเอกสารผิดพลาดมีมาตรการอย่างไร?",
          defense: "Human-in-the-Loop บังคับแผง 55/45 Split-view ให้เจ้าหน้าที่ตรวจเทียบ PDF ต้นฉบับและกดยืนยันก่อนบันทึกเข้าสู่ Master",
          badge: "DEFENSE READY",
          color: "emerald"
        },
        {
          qNum: "Q3 • CONCURRENCY",
          tag: "SYSTEM FAULT RESILIENCE",
          question: "แก้ปัญหา Concurrency และ Rate Limit อย่างไร?",
          defense: "ใช้ PostgreSQL Transaction Locks ป้องกัน Race Condition และมี Cascade Fallback 3 ระดับรองรับ 503 High Demand",
          badge: "DEFENSE READY",
          color: "indigo"
        },
        {
          qNum: "Q4 • ROADMAP",
          tag: "FUTURE SCALABILITY",
          question: "ข้อจำกัดของระบบและทิศทางการพัฒนาในอนาคต?",
          defense: "ระบบยังพึ่งพาการเชื่อมต่ออินเทอร์เน็ตในการโหลด PDF โดยมีแผนเชื่อมต่อ Webhook เข้ากับระบบ ERP กลางของโรงงานในเฟสถัดไป",
          badge: "DEFENSE READY",
          color: "teal"
        }
      ]
    }
  ], []);

  // Active filtered slides based on category
  const activeSlides = useMemo(() => {
    if (selectedCategory === "all") return allSlides;
    return allSlides.filter(s => s.category === selectedCategory);
  }, [allSlides, selectedCategory]);

  const handlePrev = useCallback(() => {
    setDirection(-1);
    setCurrentIdx(prev => Math.max(prev - 1, 0));
  }, []);

  const handleNext = useCallback(() => {
    setDirection(1);
    setCurrentIdx(prev => Math.min(prev + 1, activeSlides.length - 1));
  }, [activeSlides.length]);

  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const target = e.target as HTMLElement;
      if (target.closest('button, input, textarea, select, a, [role="button"], .interactive-control, .deck-ignore-touch')) return;
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: Date.now(),
      };
    }
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current || e.changedTouches.length === 0) return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const dx = touchEndX - touchStartRef.current.x;
    const dy = touchEndY - touchStartRef.current.y;
    const dt = Date.now() - touchStartRef.current.time;
    touchStartRef.current = null;

    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.1 && dt < 600) {
      if (dx < 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
  }, [handleNext, handlePrev]);

  const handleSelectCategory = useCallback((catId: SlideCategory) => {
    setDirection(0);
    setSelectedCategory(catId);
    setCurrentIdx(0);
  }, []);

  // Hardware accelerated slide transitions
  const slideVariants: Variants = useMemo(() => ({
    enter: (dir: number) => ({
      x: dir > 0 ? 50 : dir < 0 ? -50 : 0,
      opacity: 0,
      scale: 0.99,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        x: { type: 'spring' as const, stiffness: 320, damping: 30 },
        opacity: { duration: 0.25, ease: [0.16, 1, 0.3, 1] as const },
        scale: { duration: 0.28, ease: [0.16, 1, 0.3, 1] as const },
      },
    },
    exit: (dir: number) => ({
      zIndex: 0,
      x: dir > 0 ? -50 : dir < 0 ? 50 : 0,
      opacity: 0,
      scale: 0.99,
      transition: {
        x: { type: 'spring' as const, stiffness: 320, damping: 30 },
        opacity: { duration: 0.2, ease: [0.16, 1, 0.3, 1] as const },
        scale: { duration: 0.22, ease: [0.16, 1, 0.3, 1] as const },
      },
    }),
  }), []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowRight" || e.key === " " || e.code === "ArrowRight" || e.code === "Space") {
        handleNext();
      } else if (e.key === "ArrowLeft" || e.code === "ArrowLeft") {
        handlePrev();
      } else if (e.key === "f" || e.key === "F") {
        toggleFullscreen();
      } else if (e.key === "n" || e.key === "N") {
        setIsNotesOpen(prev => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNext, handlePrev, toggleFullscreen]);

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] overflow-hidden font-sans">
      {/* Floating Exit Button */}
      {onBackToPortal && (
        <div className="fixed top-3 left-3 sm:top-4 sm:left-4 z-[99999]">
          <button
            type="button"
            onClick={onBackToPortal}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full bg-white/90 backdrop-blur-xl border border-slate-200/80 shadow-lg hover:bg-white text-slate-800 font-bold text-xs active:scale-95 transition cursor-pointer select-none"
            title="ออกจากหน้าสไลด์ (กลับสู่พอร์ทัล)"
          >
            <ArrowLeft size={15} className="text-[#0066cc] shrink-0" />
            <span className="font-sans">ออก / Back</span>
          </button>
        </div>
      )}

      {/* Navbar Wrapper (Desktop Hover) */}
      <div 
        className={`fixed top-0 left-0 right-0 z-[9999] transition-all hidden md:block ${isNavVisible ? 'h-24' : 'h-6'}`}
        onMouseEnter={() => setIsNavVisible(true)}
        onMouseLeave={() => setIsNavVisible(false)}
      >
        <motion.nav
          initial={{ y: "-100%" }}
          animate={{ y: isNavVisible ? 0 : "-100%" }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="absolute top-0 left-0 right-0 px-8 py-4 flex justify-between items-center bg-white/80 backdrop-blur-3xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] border-b border-slate-200/80 text-slate-900 pointer-events-auto"
        >
          <div className="flex items-center gap-4">
            {onBackToPortal && (
              <Button variant="ghost" className="rounded-full p-2 h-9 w-9 bg-slate-100 hover:bg-slate-200 text-slate-700 shadow-sm border border-slate-200" onClick={onBackToPortal}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <div className="flex items-center gap-2">
              <span className="text-xs font-black tracking-[0.2em] uppercase text-[#0066cc] bg-[#0066cc]/10 px-3 py-1 rounded-full border border-[#0066cc]/20">
                QSMS Defense Deck
              </span>
              <span className="text-xs text-slate-500 font-mono hidden md:inline">
                Slide {currentIdx + 1} of {activeSlides.length}
              </span>
            </div>
          </div>

          {/* 5-Section Category Filter Pills */}
          <div className="flex items-center gap-1 bg-black/5 p-1 rounded-full shadow-[inset_0_1px_2px_rgba(0,0,0,0.08)] border border-slate-200/60 backdrop-blur-md">
            {(
              [
                { id: 'all', label: `ทั้งหมด (${allSlides.length})` },
                { id: 'sec1_problem', label: '1. ปัญหาและบริบท' },
                { id: 'sec2_solution', label: '2. โฟลว์ทางแก้ & MES' },
                { id: 'sec3_architecture', label: '3. สถาปัตยกรรมเชิงลึก' },
                { id: 'sec4_demo', label: '4. สาธิตระบบจริง' },
                { id: 'sec5_impact', label: '5. ผลประเมิน & สรุป' },
              ] as const
            ).map(cat => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleSelectCategory(cat.id)}
                  className={`relative px-3.5 py-1.5 text-xs font-semibold rounded-full transition-colors duration-200 outline-none cursor-pointer ${
                    isActive ? 'text-slate-900' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="active-category-pill"
                      className="absolute inset-0 bg-white rounded-full shadow-sm border border-slate-200/80"
                      initial={false}
                      transition={{ type: "spring", stiffness: 500, damping: 35 }}
                    />
                  )}
                  <span className="relative z-10">{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Nav Controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsNotesOpen(prev => !prev)}
              className={`p-1.5 px-3 rounded-lg border transition-all flex items-center gap-1.5 shadow-xs text-xs font-bold cursor-pointer ${
                isNotesOpen
                  ? 'bg-amber-50 text-amber-900 border-amber-300'
                  : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
              title="เปิด/ปิด โพยผู้พูด Speaker Notes (กด N)"
            >
              <BookOpen size={15} />
              <span className="hidden lg:inline">Notes (N)</span>
            </button>

            <button
              onClick={handlePrev}
              disabled={currentIdx === 0}
              className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 shadow-xs disabled:opacity-40 text-slate-700 transition cursor-pointer"
              title="สไลด์ก่อนหน้า (Arrow Left)"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={handleNext}
              disabled={currentIdx === activeSlides.length - 1}
              className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 shadow-xs disabled:opacity-40 text-slate-700 transition cursor-pointer"
              title="สไลด์ถัดไป (Arrow Right / Space)"
            >
              <ChevronRight size={18} />
            </button>

            <button
              type="button"
              onClick={toggleFullscreen}
              className={`p-1.5 px-3 rounded-lg border transition-all flex items-center gap-1.5 shadow-xs text-xs font-bold cursor-pointer ${
                isFullscreen
                  ? 'bg-[#0066cc] text-white border-blue-600 shadow-blue-500/20'
                  : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
              title={isFullscreen ? "ออกจากโหมดเต็มจอ (F / Esc)" : "โหมดนำเสนอเต็มจอ Full Screen (กด F)"}
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              <span className="hidden md:inline">{isFullscreen ? 'Exit' : 'Present (F)'}</span>
            </button>
          </div>
        </motion.nav>
      </div>

      {/* Stage Viewport */}
      <div 
        className={`deck-viewport relative flex items-center justify-center w-full h-screen bg-[#f5f5f7] overflow-hidden select-none ${
          userZoom > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : ''
        }`}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <main
          className={`deck-stage relative shrink-0 bg-[#f5f5f7] shadow-[0_20px_50px_rgba(0,0,0,0.06)] rounded-[40px] border border-slate-200/90 overflow-hidden will-change-transform transform-gpu ${
            isDragging ? 'transition-none pointer-events-none select-none' : 'transition-transform duration-200 ease-out'
          }`}
          style={{ 
            width: '2560px', 
            height: '1440px', 
            transform: `translate3d(${panOffset.x}px, ${panOffset.y}px, 0px) scale(${scale * userZoom})`,
            transformOrigin: 'center center'
          }}
        >
          {/* Subtle Studio Architectural Lighting */}
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none transform-gpu">
            <div className="absolute top-[-15%] left-[20%] w-[1200px] h-[800px] bg-gradient-to-b from-blue-100/30 to-transparent rounded-full blur-[120px]" />
            <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:32px_32px] opacity-40" />
          </div>

          <AnimatePresence mode="wait" custom={direction}>
            {activeSlides[currentIdx] && (
              <motion.div
                key={`${selectedCategory}-${currentIdx}`}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="absolute inset-0 will-change-transform transform-gpu"
              >

                {/* Type: TITLE */}
                {activeSlides[currentIdx].type === "title" && (
                  <div className="w-full h-full flex flex-col items-center justify-center text-center p-20 bg-transparent relative z-10 overflow-hidden">
                    <div className="inline-flex items-center px-6 py-2 mb-8 rounded-full bg-white shadow-xs border border-slate-200 text-[#0066cc] font-black tracking-[0.2em] uppercase text-sm">
                      {activeSlides[currentIdx].chapter}
                    </div>
                    <h1 className="text-8xl font-black tracking-tight leading-none mb-6 text-[#1d1d1f]">
                      {activeSlides[currentIdx].title}
                    </h1>
                    <h2 className="text-4xl font-bold text-[#6e6e73] mb-12">
                      {activeSlides[currentIdx].subtitle}
                    </h2>
                    <p className="text-2xl text-slate-600 font-thai max-w-4xl leading-relaxed">
                      {activeSlides[currentIdx].description}
                    </p>

                    <div className="mt-14 flex items-center gap-4 text-xs font-mono font-bold tracking-wider text-slate-500 uppercase bg-white/80 px-6 py-3 rounded-full border border-slate-200">
                      <span>NEXT.JS 16 APP ROUTER</span>
                      <span>•</span>
                      <span>SUPABASE PGVECTOR</span>
                      <span>•</span>
                      <span>GEMINI MULTIMODAL AI</span>
                    </div>
                  </div>
                )}

                {/* Type: SPLIT (Bento Stat Metric Cards) */}
                {activeSlides[currentIdx].type === "split" && (
                  <div className="w-full h-full flex items-stretch bg-transparent text-[#1d1d1f] relative z-10 overflow-hidden p-20 gap-16">
                    <div className="flex-1 flex flex-col justify-center relative">
                      <div className="inline-flex items-center self-start px-5 py-2 mb-8 rounded-full bg-white shadow-xs border border-slate-200 text-[#0066cc] font-black tracking-[0.2em] uppercase text-sm">
                        {activeSlides[currentIdx].chapter}
                      </div>
                      <h2 className="text-7xl font-black tracking-tight leading-[1.1] mb-8 text-[#1d1d1f]">
                        {activeSlides[currentIdx].title}
                      </h2>
                      <p className="text-2xl text-[#6e6e73] font-thai leading-relaxed">
                        {activeSlides[currentIdx].description}
                      </p>
                    </div>

                    <div className="flex-1 flex flex-col justify-center gap-5 relative">
                      {activeSlides[currentIdx].bullets?.map((b, i) => (
                        <motion.div
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 + 0.15 }}
                          key={i}
                          className="flex gap-6 items-start p-6 rounded-[24px] bg-white border border-slate-200/90 shadow-[0_8px_24px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.06)] hover:border-blue-300 transition-all duration-300 group"
                        >
                          {b.metric ? (
                            <div className="w-28 text-center shrink-0">
                              <span className="text-3xl font-black font-mono text-[#0066cc] tracking-tight block">
                                {b.metric}
                              </span>
                            </div>
                          ) : (
                            <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 text-slate-700 group-hover:scale-110 group-hover:text-[#0066cc] transition-all">
                              {b.icon}
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-3 mb-1.5">
                              <h3 className="text-2xl font-bold text-[#1d1d1f] tracking-tight">
                                {b.title}
                              </h3>
                              {b.badge && (
                                <span className="px-3 py-1 rounded-full text-xs font-black tracking-wider bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                                  {b.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-base text-slate-600 font-thai leading-relaxed">
                              {b.desc}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Type: VISUAL-SHOWCASE (35/65 Split with High-Res Image & Mac OS Window) */}
                {activeSlides[currentIdx].type === "visual-showcase" && activeSlides[currentIdx].showcase && (
                  <div className="w-full h-full flex items-center bg-transparent px-16 pt-24 pb-12 gap-12 relative z-10 overflow-hidden">
                    {/* Left Bento Rail (Compact Takeaways) */}
                    <motion.div
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ type: "spring", stiffness: 260, damping: 26, delay: 0.05 }}
                      className="w-[420px] shrink-0 p-8 rounded-[32px] bg-white border border-slate-200/90 shadow-[0_15px_40px_rgba(0,0,0,0.06)] flex flex-col justify-between self-center"
                    >
                      <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 rounded-full bg-blue-50 text-[#0066cc] border border-blue-200/60 font-black tracking-[0.18em] uppercase text-xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#0066cc] animate-pulse"></span>
                          {activeSlides[currentIdx].chapter}
                        </div>
                        <h2 className="text-3xl font-black tracking-tight leading-snug mb-3 text-slate-900">
                          {activeSlides[currentIdx].title}
                        </h2>
                        <div className="text-sm text-slate-500 font-thai leading-relaxed mb-6">
                          {activeSlides[currentIdx].subtitle}
                        </div>

                        {/* Point Highlights */}
                        <div className="space-y-3 pt-4 border-t border-slate-100">
                          <div className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                            {activeSlides[currentIdx].showcase.pointsTitle}
                          </div>
                          {activeSlides[currentIdx].showcase.points.map((pt, pIdx) => (
                            <div key={pIdx} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-900 tracking-tight">
                                  {pt.title}
                                </span>
                                <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded bg-white text-blue-600 border border-slate-200">
                                  {pt.tag}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 font-thai leading-snug">
                                {pt.desc}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Ready Badge */}
                      <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-slate-400">STATUS</span>
                        <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {activeSlides[currentIdx].showcase.statusBadge || "PRODUCTION READY"}
                        </span>
                      </div>
                    </motion.div>

                    {/* Right Mac OS Frame (High-Res Real Image / Diagram) */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ type: "spring", stiffness: 240, damping: 26, delay: 0.1 }}
                      className="flex-1 h-full max-h-[1100px] rounded-[36px] bg-white border border-slate-200/90 shadow-[0_20px_50px_rgba(0,0,0,0.06)] p-3 flex flex-col relative overflow-hidden"
                    >
                      <div className="w-full h-full bg-slate-50 rounded-[24px] border border-slate-200/80 flex flex-col overflow-hidden relative">
                        {/* Mac OS Window Header */}
                        <div className="h-10 bg-white border-b border-slate-200/80 flex items-center justify-between px-5 shrink-0 select-none">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-[#FF5F56] border border-black/10"></div>
                            <div className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-black/10"></div>
                            <div className="w-3 h-3 rounded-full bg-[#27C93F] border border-black/10"></div>
                            <span className="text-xs font-semibold text-slate-500 font-sans ml-3">
                              {activeSlides[currentIdx].showcase.windowTitle}
                            </span>
                          </div>
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0066cc] text-[11px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#0066cc]"></span>
                            High-Resolution Visual
                          </div>
                        </div>

                        {/* Image Canvas */}
                        <div className="flex-1 w-full h-full relative overflow-hidden flex items-center justify-center p-4 bg-slate-100/50">
                          <img
                            src={activeSlides[currentIdx].showcase.imageSrc}
                            alt={activeSlides[currentIdx].title}
                            className="max-w-full max-h-full object-contain rounded-xl shadow-xs"
                          />
                        </div>

                        {/* Caption Bar */}
                        <div className="h-8 bg-white/90 border-t border-slate-200/70 px-5 flex items-center justify-between text-xs text-slate-500 font-thai">
                          <span>{activeSlides[currentIdx].showcase.caption}</span>
                          <span className="font-mono text-slate-400">QSMS PLATFORM</span>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                )}

                {/* Type: ARCHITECTURE FLOW */}
                {activeSlides[currentIdx].type === "architecture-flow" && (
                  <div className="w-full h-full flex flex-col justify-between bg-transparent px-20 py-14 text-[#1d1d1f] relative z-10 overflow-hidden">
                    <div className="text-center max-w-5xl mx-auto mb-4">
                      <div className="inline-flex items-center px-6 py-2 mb-4 rounded-full bg-white shadow-xs border border-slate-200 text-[#0066cc] font-black tracking-[0.2em] uppercase text-sm">
                        {activeSlides[currentIdx].chapter}
                      </div>
                      <h1 className="text-6xl font-black tracking-tight text-[#1d1d1f] mb-3">
                        {activeSlides[currentIdx].title}
                      </h1>
                      <p className="text-xl text-slate-500 font-thai font-medium">
                        {activeSlides[currentIdx].subtitle}
                      </p>
                    </div>

                    {/* 3 or 4 Flow Columns */}
                    <div className={`grid ${activeSlides[currentIdx].flowSteps?.length === 3 ? 'grid-cols-3' : 'grid-cols-4'} gap-8 max-w-[2400px] mx-auto w-full my-auto px-4`}>
                      {activeSlides[currentIdx].flowSteps?.map((step, sIdx) => (
                        <motion.div
                          key={sIdx}
                          initial={{ opacity: 0, scale: 0.95, y: 20 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          transition={{ delay: sIdx * 0.1 + 0.15 }}
                          className="relative p-8 rounded-[32px] bg-white border border-slate-200/90 shadow-[0_10px_30px_rgba(0,0,0,0.04)] flex flex-col justify-between group hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-all duration-300 min-h-[560px]"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-5">
                              <span className="w-9 h-9 rounded-full bg-slate-900 text-white font-mono font-bold text-sm flex items-center justify-center shadow-xs">
                                0{step.step}
                              </span>
                              <span className="text-xs font-black tracking-wider uppercase px-3.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60">
                                {step.tag}
                              </span>
                            </div>

                            <div className="flex items-center gap-3.5 mb-3">
                              <div className="w-13 h-13 rounded-2xl bg-slate-50 shadow-xs flex items-center justify-center shrink-0 border border-slate-200 group-hover:scale-110 transition-transform">
                                {step.icon}
                              </div>
                              <div>
                                <h3 className="text-2xl font-bold text-slate-900 tracking-tight leading-tight">
                                  {step.title}
                                </h3>
                                <div className="text-sm text-slate-400 font-mono font-semibold">
                                  {step.subtitle}
                                </div>
                              </div>
                            </div>

                            <p className="text-sm text-slate-600 font-thai mt-4 mb-6 leading-relaxed">
                              {step.desc}
                            </p>

                            <div className="space-y-3 pt-4 border-t border-slate-100">
                              {step.subitems.map((sub, subIdx) => (
                                <div key={subIdx} className="flex items-start gap-2.5 text-sm text-slate-700 font-thai leading-snug">
                                  <span className="w-2 h-2 rounded-full bg-[#0066cc] mt-1.5 shrink-0" />
                                  <span>{sub}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {sIdx < (activeSlides[currentIdx].flowSteps?.length || 4) - 1 && (
                            <div className="hidden xl:block absolute -right-5 top-1/2 -translate-y-1/2 z-20 text-slate-300 pointer-events-none">
                              <ChevronRight size={28} />
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>

                    <div className="max-w-[2400px] mx-auto w-full flex items-center justify-between pt-5 border-t border-slate-200/80">
                      <div className="text-sm text-slate-600 font-thai flex items-center gap-2.5">
                        <ShieldCheck className="w-5 h-5 text-blue-600" />
                        <span>กระบวนการปิดลูป (Closed-Loop) พร้อมระบบตรวจสอบย้อนกลับ 100% ขจัดปัญหาการโยนความรับผิดชอบ</span>
                      </div>
                      <div className="text-sm font-mono font-bold text-slate-400">
                        ENTERPRISE GRADE OPERATIONS
                      </div>
                    </div>
                  </div>
                )}

                {/* Type: CONCLUSION & ROADMAP */}
                {activeSlides[currentIdx].type === "conclusion" && (
                  <div className="w-full h-full flex flex-col justify-between bg-transparent px-20 py-12 text-[#1d1d1f] relative z-10 overflow-hidden">
                    <div className="text-center max-w-5xl mx-auto mb-3">
                      <div className="inline-flex items-center px-6 py-2 mb-3 rounded-full bg-white shadow-xs border border-slate-200 text-[#0066cc] font-black tracking-[0.2em] uppercase text-xs">
                        {activeSlides[currentIdx].chapter}
                      </div>
                      <h1 className="text-5xl font-black tracking-tight text-[#1d1d1f] mb-2">
                        {activeSlides[currentIdx].title}
                      </h1>
                      <p className="text-lg text-slate-500 font-thai font-medium">
                        {activeSlides[currentIdx].subtitle}
                      </p>
                    </div>

                    <div className="max-w-[2400px] mx-auto w-full flex-1 flex flex-col justify-center gap-6 my-auto px-4">
                      {/* 3 Horizontal Roadmap Phase Cards */}
                      <div className="grid grid-cols-3 gap-8 w-full">
                        {activeSlides[currentIdx].roadmapPhases?.map((p, pIdx) => (
                          <motion.div
                            key={pIdx}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: pIdx * 0.1 + 0.15 }}
                            className="relative p-8 rounded-[32px] bg-white border border-slate-200/90 shadow-[0_10px_30px_rgba(0,0,0,0.04)] flex flex-col justify-between group hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-all min-h-[340px]"
                          >
                            <div>
                              <div className="flex items-center justify-between mb-4">
                                <span className="px-3.5 py-1 rounded-full text-xs font-black tracking-wider bg-slate-900 text-white shadow-xs">
                                  {p.phase}
                                </span>
                                <span className="text-sm font-bold text-slate-500 font-mono">
                                  {p.time}
                                </span>
                              </div>

                              <div className="flex items-center gap-3.5 mb-3">
                                <div className="w-12 h-12 rounded-2xl bg-slate-50 shadow-xs flex items-center justify-center shrink-0 border border-slate-100">
                                  {p.icon}
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900 tracking-tight leading-snug">
                                  {p.title}
                                </h3>
                              </div>

                              <ul className="space-y-2.5 mt-3">
                                {p.points.map((pt, ptIdx) => (
                                  <li key={ptIdx} className="flex items-start gap-2.5 text-sm text-slate-600 font-thai leading-relaxed">
                                    <span className="w-2 h-2 rounded-full bg-[#0066cc] mt-2 shrink-0" />
                                    <span>{pt}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {pIdx < 2 && (
                              <div className="hidden lg:block absolute -right-5 top-1/2 -translate-y-1/2 z-20 text-slate-300 pointer-events-none">
                                <ChevronRight size={26} />
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </div>

                      {/* Future Scope Section */}
                      {activeSlides[currentIdx].futureRoadmap && (
                        <div className="w-full">
                          <div className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Cpu className="w-4 h-4 text-purple-600" />
                            <span>Future Scope & Next Level Horizons</span>
                          </div>
                          <div className="grid grid-cols-2 gap-8">
                            {activeSlides[currentIdx].futureRoadmap.map((item, fIdx) => (
                              <motion.div
                                key={fIdx}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.35 + fIdx * 0.1 }}
                                className="p-6 rounded-[28px] bg-white border border-slate-200/90 shadow-xs flex items-start gap-5 hover:shadow-md transition-all"
                              >
                                <div className="w-12 h-12 rounded-2xl bg-slate-50 shadow-xs flex items-center justify-center shrink-0 border border-slate-100">
                                  {item.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-xl font-bold text-slate-900 tracking-tight">
                                      {item.title}
                                    </h4>
                                    <span className="text-xs font-black uppercase text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
                                      {item.horizon}
                                    </span>
                                  </div>
                                  <p className="text-sm text-slate-600 font-thai leading-relaxed mb-3">
                                    {item.desc}
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    {item.tags.map((tg, tgIdx) => (
                                      <span key={tgIdx} className="text-xs font-mono font-semibold bg-slate-50 text-slate-600 px-3 py-1 rounded-lg border border-slate-200">
                                        {tg}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bottom Status & Q&A Action Bar */}
                    <div className="max-w-[2400px] mx-auto w-full flex items-center justify-between pt-4 border-t border-slate-200/80">
                      <div className="flex items-center gap-3.5">
                        <span className="relative flex h-3.5 w-3.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
                        </span>
                        <div>
                          <div className="text-xs font-black uppercase tracking-widest text-slate-900">
                            SYSTEM STATUS: PRODUCTION READY
                          </div>
                          <div className="text-xs text-slate-500 font-thai">
                            131 Automated Tests Passed (100%) • Benchmark Ground Truth 96.36%
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <button
                          type="button"
                          onClick={() => setIsQaOpen(true)}
                          className="px-6 py-3 rounded-2xl bg-slate-900 hover:bg-black text-white font-bold text-sm shadow-lg flex items-center gap-2.5 cursor-pointer transition-all hover:scale-105 active:scale-95 select-none"
                        >
                          <HelpCircle size={17} />
                          <span>เปิดช่วงถาม-ตอบ (Q&A Defense Session)</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Type: ASYMMETRIC-HERO (1 Hero Anchor Card + 3 Stacked Pillars) */}
                {activeSlides[currentIdx].type === "asymmetric-hero" && activeSlides[currentIdx].asymmetricHero && (
                  <div className="w-full h-full flex flex-col justify-between bg-transparent px-20 py-12 text-[#1d1d1f] relative z-10 overflow-hidden">
                    <div className="text-center max-w-5xl mx-auto mb-2">
                      <div className="inline-flex items-center px-6 py-2 mb-3 rounded-full bg-white shadow-xs border border-slate-200 text-[#0066cc] font-black tracking-[0.2em] uppercase text-xs">
                        {activeSlides[currentIdx].chapter}
                      </div>
                      <h1 className="text-5xl font-black tracking-tight text-[#1d1d1f] mb-2">
                        {activeSlides[currentIdx].title}
                      </h1>
                      <p className="text-lg text-slate-500 font-thai font-medium">
                        {activeSlides[currentIdx].subtitle}
                      </p>
                    </div>

                    <div className="flex gap-8 max-w-[2400px] mx-auto w-full flex-1 my-auto items-stretch px-4">
                      {/* Left Anchor Hero Card */}
                      <div className="w-[720px] shrink-0 p-10 rounded-[36px] bg-white border border-slate-200/90 shadow-[0_15px_40px_rgba(0,0,0,0.05)] flex flex-col justify-between relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-2 bg-blue-600" />
                        <div>
                          <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-black tracking-wider bg-blue-50 text-blue-700 border border-blue-200/60 mb-6">
                            {activeSlides[currentIdx].asymmetricHero.badge}
                          </span>
                          <div className="text-8xl font-black font-mono tracking-tight text-blue-600 mb-4">
                            {activeSlides[currentIdx].asymmetricHero.heroMetric}
                          </div>
                          <h2 className="text-3xl font-bold text-slate-900 mb-3">
                            {activeSlides[currentIdx].asymmetricHero.heroTitle}
                          </h2>
                          <p className="text-base text-slate-600 font-thai leading-relaxed mb-8">
                            {activeSlides[currentIdx].asymmetricHero.heroSubtitle}
                          </p>
                          <div className="space-y-3 pt-6 border-t border-slate-100">
                            {activeSlides[currentIdx].asymmetricHero.checklist.map((item, cIdx) => (
                              <div key={cIdx} className="flex items-start gap-3 text-sm text-slate-700 font-thai">
                                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                                <span>{item}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Right Stacked Pillars */}
                      <div className="flex-1 flex flex-col justify-between gap-5">
                        {activeSlides[currentIdx].bullets?.map((b, i) => (
                          <div key={i} className="flex items-center gap-8 p-7 rounded-[28px] bg-white border border-slate-200/90 shadow-[0_10px_30px_rgba(0,0,0,0.03)] flex-1">
                            <div className="w-36 text-center shrink-0">
                              <span className="text-4xl font-black font-mono text-blue-600 block">
                                {b.metric}
                              </span>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{b.title}</h3>
                                {b.badge && (
                                  <span className="px-3.5 py-1 rounded-full text-xs font-black bg-slate-100 text-slate-700 border border-slate-200">
                                    {b.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-base text-slate-600 font-thai leading-relaxed">{b.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Type: SPLIT-PROTOCOL-RADAR */}
                {activeSlides[currentIdx].type === "split-protocol-radar" && activeSlides[currentIdx].splitProtocolRadar && (
                  <div className="w-full h-full flex flex-col justify-between bg-transparent px-20 py-12 text-[#1d1d1f] relative z-10 overflow-hidden">
                    <div className="text-center max-w-5xl mx-auto mb-2">
                      <div className="inline-flex items-center px-6 py-2 mb-3 rounded-full bg-white shadow-xs border border-slate-200 text-[#0066cc] font-black tracking-[0.2em] uppercase text-xs">
                        {activeSlides[currentIdx].chapter}
                      </div>
                      <h1 className="text-5xl font-black tracking-tight text-[#1d1d1f] mb-2">
                        {activeSlides[currentIdx].title}
                      </h1>
                      <p className="text-lg text-slate-500 font-thai font-medium">
                        {activeSlides[currentIdx].subtitle}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-8 max-w-[2400px] mx-auto w-full flex-1 my-auto px-4">
                      {/* Left: Handshake Protocol */}
                      <div className="p-8 rounded-[36px] bg-white border border-slate-200/90 shadow-[0_15px_40px_rgba(0,0,0,0.05)] flex flex-col justify-between">
                        <div>
                          <span className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-black tracking-wider bg-blue-50 text-blue-700 border border-blue-200/60 mb-4">
                            HANDSHAKE PROTOCOL GATES
                          </span>
                          <h2 className="text-3xl font-bold text-slate-900 mb-6">Two-Way Handshake Sequence</h2>
                          <div className="space-y-4">
                            {activeSlides[currentIdx].splitProtocolRadar.protocolGates.map((g, gIdx) => (
                              <div key={gIdx} className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                                <span className="text-xs font-mono font-bold text-blue-600 block">{g.gate}</span>
                                <h4 className="text-base font-bold text-slate-900">{g.title}</h4>
                                <p className="text-xs text-slate-600 font-thai">{g.desc}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Right: Bottleneck Radar */}
                      <div className="p-8 rounded-[36px] bg-white border border-slate-200/90 shadow-[0_15px_40px_rgba(0,0,0,0.05)] flex flex-col justify-between">
                        <div>
                          <span className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-black tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200/60 mb-4">
                            REAL-TIME MONITORING
                          </span>
                          <h2 className="text-3xl font-bold text-slate-900 mb-6">5-Stage Bottleneck Radar</h2>
                          <div className="space-y-3">
                            {activeSlides[currentIdx].splitProtocolRadar.radarStages.map((st, rIdx) => (
                              <div key={rIdx} className={`p-4 rounded-2xl border flex items-center justify-between ${st.isAlert ? 'bg-rose-50 border-rose-200 text-rose-900' : 'bg-slate-50 border-slate-100'}`}>
                                <div>
                                  <h4 className="text-sm font-bold text-slate-900">{st.stage}</h4>
                                  <p className="text-xs text-slate-500 font-thai">{st.role}</p>
                                </div>
                                <span className={`text-xs font-mono font-black px-3 py-1 rounded-full ${st.isAlert ? 'bg-rose-600 text-white' : 'bg-white text-slate-700 border border-slate-200'}`}>
                                  {st.sla}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Type: PARALLEL-PIPELINES */}
                {activeSlides[currentIdx].type === "parallel-pipelines" && activeSlides[currentIdx].parallelPipelines && (
                  <div className="w-full h-full flex flex-col justify-between bg-transparent px-20 py-12 text-[#1d1d1f] relative z-10 overflow-hidden">
                    <div className="text-center max-w-5xl mx-auto mb-2">
                      <div className="inline-flex items-center px-6 py-2 mb-3 rounded-full bg-white shadow-xs border border-slate-200 text-[#0066cc] font-black tracking-[0.2em] uppercase text-xs">
                        {activeSlides[currentIdx].chapter}
                      </div>
                      <h1 className="text-5xl font-black tracking-tight text-[#1d1d1f] mb-2">
                        {activeSlides[currentIdx].title}
                      </h1>
                      <p className="text-lg text-slate-500 font-thai font-medium">
                        {activeSlides[currentIdx].subtitle}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-8 max-w-[2400px] mx-auto w-full flex-1 my-auto px-4">
                      {/* Left Pipeline: Vision OCR */}
                      <div className="p-8 rounded-[36px] bg-white border border-slate-200/90 shadow-[0_15px_40px_rgba(0,0,0,0.05)] flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-6">
                            <span className="px-3.5 py-1 rounded-full text-xs font-black tracking-wider bg-blue-50 text-blue-700 border border-blue-200/60">
                              {activeSlides[currentIdx].parallelPipelines.leftPipeline.tag}
                            </span>
                            <span className="text-xs font-mono font-bold text-slate-400">PIPELINE A</span>
                          </div>
                          <h2 className="text-3xl font-bold text-slate-900 mb-6">
                            {activeSlides[currentIdx].parallelPipelines.leftPipeline.title}
                          </h2>
                          <div className="space-y-4">
                            {activeSlides[currentIdx].parallelPipelines.leftPipeline.steps.map((st, sIdx) => (
                              <div key={sIdx} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-4">
                                <span className="w-7 h-7 rounded-full bg-blue-600 text-white font-mono text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                                  0{sIdx + 1}
                                </span>
                                <div>
                                  <h4 className="text-base font-bold text-slate-900">{st.title}</h4>
                                  <p className="text-xs text-slate-600 font-thai mt-0.5">{st.desc}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Right Pipeline: DocAI RAG */}
                      <div className="p-8 rounded-[36px] bg-white border border-slate-200/90 shadow-[0_15px_40px_rgba(0,0,0,0.05)] flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-6">
                            <span className="px-3.5 py-1 rounded-full text-xs font-black tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                              {activeSlides[currentIdx].parallelPipelines.rightPipeline.tag}
                            </span>
                            <span className="text-xs font-mono font-bold text-slate-400">PIPELINE B</span>
                          </div>
                          <h2 className="text-3xl font-bold text-slate-900 mb-6">
                            {activeSlides[currentIdx].parallelPipelines.rightPipeline.title}
                          </h2>
                          <div className="space-y-4">
                            {activeSlides[currentIdx].parallelPipelines.rightPipeline.steps.map((st, sIdx) => (
                              <div key={sIdx} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-4">
                                <span className="w-7 h-7 rounded-full bg-emerald-600 text-white font-mono text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                                  0{sIdx + 1}
                                </span>
                                <div>
                                  <h4 className="text-base font-bold text-slate-900">{st.title}</h4>
                                  <p className="text-xs text-slate-600 font-thai mt-0.5">{st.desc}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Type: COMPARISON-TABLE */}
                {activeSlides[currentIdx].type === "comparison-table" && activeSlides[currentIdx].comparisonTable && (
                  <div className="w-full h-full flex flex-col justify-between bg-transparent px-20 py-12 text-[#1d1d1f] relative z-10 overflow-hidden">
                    <div className="text-center max-w-5xl mx-auto mb-2">
                      <div className="inline-flex items-center px-6 py-2 mb-3 rounded-full bg-white shadow-xs border border-slate-200 text-[#0066cc] font-black tracking-[0.2em] uppercase text-xs">
                        {activeSlides[currentIdx].chapter}
                      </div>
                      <h1 className="text-5xl font-black tracking-tight text-[#1d1d1f] mb-2">
                        {activeSlides[currentIdx].title}
                      </h1>
                      <p className="text-lg text-slate-500 font-thai font-medium">
                        {activeSlides[currentIdx].subtitle}
                      </p>
                    </div>

                    <div className="max-w-[2400px] mx-auto w-full flex-1 my-auto p-8 rounded-[36px] bg-white border border-slate-200/90 shadow-[0_15px_40px_rgba(0,0,0,0.05)] flex flex-col justify-between">
                      {/* Table Header */}
                      <div className="grid grid-cols-12 gap-4 px-6 py-3.5 rounded-2xl bg-slate-900 text-white text-xs font-black tracking-wider uppercase">
                        <div className="col-span-4">{activeSlides[currentIdx].comparisonTable.headers[0]}</div>
                        <div className="col-span-3">{activeSlides[currentIdx].comparisonTable.headers[1]}</div>
                        <div className="col-span-3">{activeSlides[currentIdx].comparisonTable.headers[2]}</div>
                        <div className="col-span-2 text-right">{activeSlides[currentIdx].comparisonTable.headers[3]}</div>
                      </div>

                      {/* Table Rows */}
                      <div className="space-y-3 mt-3">
                        {activeSlides[currentIdx].comparisonTable.rows.map((r, rIdx) => (
                          <div key={rIdx} className="grid grid-cols-12 gap-4 px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 items-center">
                            <div className="col-span-4 text-base font-bold text-slate-900">{r.metric}</div>
                            <div className="col-span-3 text-sm text-rose-600 font-medium">{r.legacy}</div>
                            <div className="col-span-3 text-sm font-bold text-slate-900">{r.qsms}</div>
                            <div className="col-span-2 text-right">
                              <span className="inline-block px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {r.impact}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Type: DEFENSE-QA */}
                {activeSlides[currentIdx].type === "defense-qa" && activeSlides[currentIdx].defenseQAs && (
                  <div className="w-full h-full flex flex-col justify-between bg-transparent px-20 py-12 text-[#1d1d1f] relative z-10 overflow-hidden">
                    <div className="text-center max-w-5xl mx-auto mb-2">
                      <div className="inline-flex items-center px-6 py-2 mb-3 rounded-full bg-white shadow-xs border border-slate-200 text-[#0066cc] font-black tracking-[0.2em] uppercase text-xs">
                        {activeSlides[currentIdx].chapter}
                      </div>
                      <h1 className="text-5xl font-black tracking-tight text-[#1d1d1f] mb-2">
                        {activeSlides[currentIdx].title}
                      </h1>
                      <p className="text-lg text-slate-500 font-thai font-medium">
                        {activeSlides[currentIdx].subtitle}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-6 max-w-[2400px] mx-auto w-full flex-1 my-auto px-4">
                      {activeSlides[currentIdx].defenseQAs.map((qa, qIdx) => (
                        <div key={qIdx} className="p-6 rounded-[28px] bg-white border border-slate-200/90 shadow-[0_10px_30px_rgba(0,0,0,0.03)] flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <span className="px-3 py-1 rounded-full text-[11px] font-mono font-black bg-slate-900 text-white">
                                {qa.qNum}
                              </span>
                              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                DEFENSE READY
                              </span>
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">{qa.question}</h3>
                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-sm text-slate-700 font-thai leading-relaxed">
                              <span className="font-bold text-blue-600 mr-2">DEFENSE:</span>
                              {qa.defense}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Floating Mobile Touch Controls */}
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[9995] md:hidden flex items-center gap-1.5 p-1.5 rounded-full bg-white/95 backdrop-blur-2xl border border-white/80 shadow-lg text-slate-800 select-none">
        <button
          type="button"
          onClick={handlePrev}
          disabled={currentIdx === 0}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 hover:bg-slate-200 active:scale-90 disabled:opacity-30 disabled:pointer-events-none text-slate-800 transition cursor-pointer"
          title="สไลด์ก่อนหน้า"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="px-3 py-1 text-xs font-bold font-mono text-slate-800 min-w-[70px] text-center">
          {currentIdx + 1} / {activeSlides.length}
        </div>
        <button
          type="button"
          onClick={handleNext}
          disabled={currentIdx === activeSlides.length - 1}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-[#0066cc] hover:bg-blue-700 active:scale-90 disabled:opacity-30 disabled:pointer-events-none text-white shadow-sm transition cursor-pointer"
          title="สไลด์ถัดไป"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Floating Zoom Controls (Desktop) */}
      <div className="fixed bottom-6 left-6 z-[9990] hidden md:flex items-center gap-1.5 p-1.5 rounded-full bg-white/90 backdrop-blur-xl border border-slate-200/80 shadow-md text-slate-800 select-none">
        <button
          type="button"
          onClick={handleZoomOut}
          disabled={userZoom <= 0.75}
          title="Zoom Out (ย่อขนาด)"
          className="p-2 rounded-full hover:bg-slate-100 active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer text-slate-700"
        >
          <ZoomOut size={16} />
        </button>

        <button
          type="button"
          onClick={handleResetZoom}
          title="คลิกเพื่อรีเซ็ตขนาด 100% (Fit Screen)"
          className="px-2.5 py-1 text-xs font-mono font-bold tracking-tight rounded-full hover:bg-slate-100 active:scale-95 transition-all cursor-pointer text-slate-800"
        >
          {Math.round(userZoom * 100)}%
        </button>

        <button
          type="button"
          onClick={handleZoomIn}
          disabled={userZoom >= 2.0}
          title="Zoom In (ขยายภาพ)"
          className="p-2 rounded-full hover:bg-slate-100 active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer text-slate-700"
        >
          <ZoomIn size={16} />
        </button>

        <div className="w-[1px] h-4 bg-slate-200 mx-0.5" />

        <button
          type="button"
          onClick={handleResetZoom}
          title="Fit to Screen (ปรับขนาดพอดีจอ)"
          className="p-2 rounded-full hover:bg-slate-100 active:scale-95 text-slate-600 hover:text-blue-600 transition-all cursor-pointer"
        >
          <RotateCcw size={14} />
        </button>

        {userZoom > 1 && (
          <div className="flex items-center gap-1 pl-1 pr-2 text-[11px] font-thai text-blue-600 font-semibold border-l border-slate-200">
            <Move size={12} />
            <span>คลิกลากเพื่อเลื่อน</span>
          </div>
        )}
      </div>

      {/* Floating Speaker Notes Drawer */}
      <AnimatePresence>
        {isNotesOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-20 left-6 z-[9995] w-[460px] max-w-[90vw] p-5 rounded-2xl bg-white/95 backdrop-blur-2xl border border-slate-300 shadow-2xl text-slate-900 select-text"
          >
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <BookOpen size={16} className="text-[#0066cc]" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Speaker Notes (โพยผู้พูด)
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-slate-400">
                Slide {currentIdx + 1}
              </span>
            </div>
            <p className="text-xs font-thai text-slate-700 leading-relaxed font-medium">
              {activeSlides[currentIdx]?.speakerNotes || "ไม่มีบันทึกสำหรับสไลด์นี้"}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Present / Fullscreen Quick Trigger (Desktop) */}
      <div className="fixed bottom-6 right-6 z-[9990] hidden md:flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsNotesOpen(prev => !prev)}
          className={`px-3.5 py-2.5 rounded-full border transition-all flex items-center gap-2 shadow-sm text-xs font-bold cursor-pointer select-none ${
            isNotesOpen ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
          }`}
          title="เปิด/ปิด โพยผู้พูด (กด N)"
        >
          <BookOpen size={15} />
          <span>{isNotesOpen ? 'Hide Notes' : 'Notes (N)'}</span>
        </button>

        <button
          type="button"
          onClick={toggleFullscreen}
          className={`px-4 py-2.5 rounded-full border transition-all flex items-center gap-2 shadow-sm text-xs font-bold cursor-pointer select-none ${
            isFullscreen
              ? 'bg-slate-900 text-white border-black hover:bg-black'
              : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
          }`}
          title={isFullscreen ? "ออกจากโหมดเต็มจอ (F / Esc)" : "โหมดนำเสนอเต็มจอ Full Screen (กด F)"}
        >
          {isFullscreen ? <Minimize2 size={15} className="text-blue-400" /> : <Maximize2 size={15} className="text-blue-600" />}
          <span>{isFullscreen ? 'Exit Fullscreen' : 'Full Screen (F)'}</span>
        </button>
      </div>

      {/* Q&A Modal for Defense Questions */}
      <AnimatePresence>
        {isQaOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-4xl bg-white rounded-3xl p-8 shadow-2xl border border-slate-200 flex flex-col space-y-6 max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0066cc] flex items-center justify-center shadow-xs">
                    <MessageSquare size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">5 Expected Defense Questions & Answers</h3>
                    <p className="text-xs text-slate-500 font-thai">คำถามสำคัญที่อาจารย์มักจะถาม พร้อมธงคำตอบเชิงวิศวกรรม</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsQaOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* FAQs with Hard Defense Flags */}
              <div className="space-y-4 font-thai text-left">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span className="text-[#0066cc] font-black">Q1:</span>
                    <span>ทำไมไม่ใช้ระบบ ERP เดิม (เช่น SAP) หรือทำไมไม่ใช้แค่ Google Sheets ต่อไป?</span>
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed pl-6">
                    <b>เทียบกับ Sheets:</b> Google Sheets ขาด ACID Transactions, เกิดปัญหา Data Race Overwrite เมื่อมีคนแก้พร้อมกัน, ไม่มี Audit Trail ป้องกันการแก้ไข และไม่มี Row-Level Security<br />
                    <b>เทียบกับ ERP (SAP):</b> ERP ปรับแต่งหน้าจอได้ช้า มีค่าใช้จ่ายสูง และไม่คล่องตัวพอสำหรับ Shop-floor เช่น การเปิดเคสจากมือถือ, การถ่ายภาพหลักฐานบีบอัด Client-side, หรือการ OCR แบบแปลน PDF ด้วย AI
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span className="text-[#0066cc] font-black">Q2:</span>
                    <span>ถ้า AI (OCR หรือ RAG) เกิด Hallucination หรืออ่านค่าตัวเลขบน Drawing ผิด ระบบป้องกันความเสียหายอย่างไร?</span>
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed pl-6">
                    สถาปัตยกรรมออกแบบเป็น <b>Human-in-the-Loop</b>: AI ทำหน้าที่เพียง Pre-fill ร่างข้อมูลให้ โดยมีแผงตรวจทาน 55/45 Split View บังคับแสดงหน้าแปลน PDF ต้นฉบับคู่กับฟอร์มเสมอ ผู้ตรวจการต้อง Verify และกดยืนยันด้วยตนเอง ส่วน DocAI RAG ใช้ Strict Prompt Grounding ห้ามคาดเดา หากไม่มีในคู่มือให้ตอบทันทีว่าไม่พบข้อมูล
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span className="text-[#0066cc] font-black">Q3:</span>
                    <span>ระบบจัดการ Concurrency และ Data Consistency อย่างไร หากพนักงาน 2 ฝ่ายกดอัปเดตพร้อมกัน?</span>
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed pl-6">
                    ในระดับ Database ใช้ Primary/Foreign Key Constraints และ PostgreSQL Transaction Isolation ส่วนในระดับ Application Logic การเปลี่ยนสถานะถูกล็อกด้วย Finite State Machine (Two-Way Handshake) ฝ่ายผลิตจะเปลี่ยนสถานะเป็น In-Progress ไม่ได้ถ้าคลังยังไม่ได้กดยืนยันจ่ายของ ทำให้ไม่มีการก้าวกระโดดทับซ้อนกัน
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span className="text-[#0066cc] font-black">Q4:</span>
                    <span>ทำไมต้องมีทั้งโมดูล Drawing OCR และ DocAI RAG ในโปรเจกต์เดียวกัน ไม่หลงประเด็นไปจากระบบ Rework หรือ?</span>
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed pl-6">
                    ไม่หลงประเด็น เพราะเป็น <b>Data Dependency</b> โดยตรงของงานซ่อม: 1) การวิเคราะห์ Rework ต้องรู้สเปกภาชนะและสูตรน้ำมัน ซึ่งเดิมช่างต้องไปรื้อค้น Drawing สแกน (OCR ช่วยลดเวลาจาก 15 นาทีเหลือไม่กี่วินาที) 2) การตัดสินใจแก้ปัญหางานเสีย ช่างต้องเปิดคู่มือเทคนิค (RAG ช่วยสืบค้นมาตรฐานความปลอดภัยและค่าแรงขัน Torque ได้ทันที)
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span className="text-[#0066cc] font-black">Q5:</span>
                    <span>วัดความสำเร็จเชิงวิศวกรรม (Metrics / KPI) อย่างไรหลังนำระบบไปใช้จริง?</span>
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed pl-6">
                    1) <b>Cycle Time Reduction:</b> ลดเวลาค้นหาเอกสารและเปิดเคสลง ~70% (จาก 15 นาที เหลือ 2 นาที)<br />
                    2) <b>Premature Waste:</b> ปัญหากล่องและภาชนะชำรุดเสียหายจากการเบิกมากองรอล่วงหน้าลดลงเหลือ 0%<br />
                    3) <b>Traceability 100%:</b> ทุกเคสมีรูปถ่ายหลักฐาน ล็อตผลิต และประวัติการ Handshake ตรวจสอบย้อนกลับได้สมบูรณ์
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <span className="text-xs text-slate-400 font-mono">QSMS Platform • Ready for Engineering Defense</span>
                <button
                  type="button"
                  onClick={() => setIsQaOpen(false)}
                  className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs shadow-xs cursor-pointer"
                >
                  ปิดหน้าต่าง
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
