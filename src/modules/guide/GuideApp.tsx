"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence, type Variants } from "motion/react";
import {
  ChevronRight, ChevronLeft, ArrowLeft,
  AlertTriangle, FileText, LayoutGrid, CheckCircle2, TrendingDown,
  Clock, CheckCircle, Database, Layers, Cpu, ShieldCheck,
  Bot, Search, Play, RotateCcw, Maximize2, Minimize2, ZoomIn, ZoomOut, Move,
  Users, HelpCircle, Award, Zap, MessageSquare, X,
  Globe, Server, Table, Key, Workflow, Activity, GitBranch, ArrowUpRight
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";

// Import Mock Components
import {
  MockLogin, MockPortal, MockOverall, MockUpdateModal, MockAddCase, MockDashboard, MockMobileFastTrack,
  MockDrawingMaster, MockDocAIRAG
} from "./mocks/MockScreens";

export type SlideCategory = "all" | "overview" | "rework" | "storage" | "rag" | "architecture";

type Slide = {
  id: number;
  category: SlideCategory;
  type: "title" | "split" | "tour" | "timeline" | "architecture-flow" | "erd-schema" | "conclusion";
  chapter: string;
  title: string;
  subtitle?: string;
  description?: string;
  bullets?: { title: string; desc: string; icon: React.ReactNode; badge?: string }[];
  mockComponent?: React.ReactNode;
  hasSimulation?: boolean;
  simulationLabel?: { play: string; playing: string; replay: string };
  tourCard?: {
    title: string;
    description: React.ReactNode;
    position: string;
  };
  timelineEvents?: {
    phase: string;
    period: string;
    title: string;
    desc: string;
    deliverables: string[];
    icon: React.ReactNode;
    status: string;
    color: string;
  }[];
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
  erdTables?: {
    tableName: string;
    badge: string;
    color: string;
    icon: React.ReactNode;
    columns: { name: string; type: string; isKey?: boolean; isFk?: boolean; desc: string }[];
  }[];
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
  const [scale, setScale] = useState(1);
  const [userZoom, setUserZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; panX: number; panY: number } | null>(null);

  const [isQaOpen, setIsQaOpen] = useState(false);
  const [isNavVisible, setIsNavVisible] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [simTrigger, setSimTrigger] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [hasSimulated, setHasSimulated] = useState(false);

  const handleRunSimulation = () => {
    setIsSimulating(true);
    setHasSimulated(true);
    setSimTrigger(Date.now());
  };

  const handleSimulationComplete = useCallback(() => {
    setIsSimulating(false);
  }, []);

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
    setIsSimulating(false);
    setHasSimulated(false);
    setSimTrigger(0);
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

      // Allow panning smoothly within visual bounds
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

  const allSlides: Slide[] = useMemo(() => [
    // 1. Introduction (Overview)
    {
      id: 1,
      category: "overview",
      type: "title",
      chapter: "01 / INTRODUCTION",
      title: "QSMS Platform Ecosystem",
      subtitle: "Operations & Technical Intelligence Suite",
      description: "เปลี่ยนระบบการจัดการ Rework, แบบแปลนวิศวกรรม (Drawing & Master) และการค้นหาคู่มือเทคนิคให้เป็นดิจิทัล 100% รวมศูนย์ไว้ในพอร์ทัลเดียว",
    },
    // 2. Objectives (Overview)
    {
      id: 2,
      category: "overview",
      type: "split",
      chapter: "02 / OBJECTIVES",
      title: "Ecosystem Goals",
      description: "เป้าหมายหลักในการพัฒนาระบบ QSMS Unified Platform สู่ระบบดิจิทัล (Digitization)",
      bullets: [
        {
          title: "Paperless & Centralized Tracking",
          desc: "ตัดระบบกระดาษและไฟล์ Excel กระจัดกระจาย ใช้ฐานข้อมูล Supabase กลางเพื่อความโปร่งใส",
          icon: <FileText className="w-6 h-6 text-emerald-500" />
        },
        {
          title: "AI-Powered Drawing Inspection",
          desc: "ใช้ Gemini AI OCR สกัดสเปกแบบแปลน 7/8 ฟิลด์ พร้อม 55/45 Split View Workspace",
          icon: <Layers className="w-6 h-6 text-amber-500" />
        },
        {
          title: "DocAI RAG Spec Search",
          desc: "ค้นหาคู่มือซ่อมและมาตรฐานวิศวกรรมผ่าน Vector Embeddings 768 มิติ และ Gemini SSE Stream",
          icon: <Bot className="w-6 h-6 text-purple-500" />
        },
        {
          title: "Real-time Operations & Traceability",
          desc: "คำนวณสถานะอัตโนมัติ ติดตามยอดกล่อง และบันทึกอุปสรรคหน้างานเพื่อการประเมินที่แม่นยำ",
          icon: <TrendingDown className="w-6 h-6 text-blue-500" />
        }
      ]
    },
    // 3. Problem Statement & Legacy Limitations (Overview)
    {
      id: 3,
      category: "overview",
      type: "split",
      chapter: "03 / PROBLEM STATEMENT",
      title: "Problems in Legacy Workflow",
      description: "ปัญหาและข้อจำกัดของกระบวนการเดิมก่อนการพัฒนาระบบ QSMS",
      bullets: [
        {
          title: "ข้อมูลกระจัดกระจาย (Data Fragmentation)",
          desc: "การจัดการงานแก้ไขสินค้า (Rework) เดิมใช้กระดาษและ Excel ข้อมูลเคส รูปหลักฐาน และ Master อยู่แยกส่วน ส่งผลให้การตามรอยย้อนกลับ (Traceability) ทำได้ยากและล่าช้า",
          icon: <AlertTriangle className="w-6 h-6 text-rose-500" />
        },
        {
          title: "การประเมินต้นทุนคลาดเคลื่อน (Cost Under-valuation)",
          desc: "ฝ่ายบัญชีและฝ่ายการเงินประเมินต้นทุนผิดพลาดและต่ำกว่าความเป็นจริง เนื่องจากไม่เห็นข้อมูลค่าวัสดุและชั่วโมงแรงงานจริงที่ถูกใช้ไปในหน้างานการผลิต",
          icon: <TrendingDown className="w-6 h-6 text-amber-500" />
        },
        {
          title: "Human Error & ขาดคลังคู่มือกลาง",
          desc: "เกิดข้อผิดพลาดจากมนุษย์ในการคีย์รหัสสินค้าหน้างาน และโรงงานยังขาดแหล่งรวบรวมคู่มือการซ่อมแซมเชิงเทคนิค ทำให้การสืบค้นข้อมูลเป็นอุปสรรคสำคัญ",
          icon: <ShieldCheck className="w-6 h-6 text-purple-500" />
        }
      ]
    },
    // 4. Methodology & 4-Month Development Timeline (Overview)
    {
      id: 4,
      category: "overview",
      type: "timeline",
      chapter: "04 / DEVELOPMENT TIMELINE",
      title: "Methodology & 4-Month Timeline",
      subtitle: "ขั้นตอนการดำเนินงาน (SDLC) และประวัติการพัฒนาโครงการ พฤษภาคม - สิงหาคม 2026",
      timelineEvents: [
        {
          phase: "PHASE 01-02",
          period: "พฤษภาคม 2026",
          title: "Requirement & Initial Arch",
          desc: "สำรวจปัญหา Legacy GAS/Sheets, วางโครงสร้าง Supabase, Next.js SPA Shell, Two-way Smart Verification",
          deliverables: [
            "ศึกษาปัญหาคลังสินค้า ฝ่ายบัญชี และหน้างาน",
            "ย้ายฐานข้อมูลจาก Sheets มายัง Supabase PostgreSQL",
            "ออกแบบระบบยืนยันสินค้า Two-Way Auto-fill"
          ],
          icon: <Workflow className="w-5 h-5 text-blue-600" />,
          status: "COMPLETED",
          color: "blue"
        },
        {
          phase: "PHASE 02-03",
          period: "มิถุนายน 2026",
          title: "Backend & Data Integrity",
          desc: "ถอดถอน proxyToGAS สู่ Next.js API Routes, HTTP-Only Auth Cookies, Strict Data Integrity (Case ID RT/RW, Conflict Modal)",
          deliverables: [
            "ตัดโค้ด proxyToGAS 100% สู่ Next.js API Routes",
            "ยกระดับความปลอดภัยด้วย HTTP-Only JWT Cookies",
            "สร้างระบบ Case ID ใหม่ RT/RW ป้องกันเลขชน"
          ],
          icon: <Database className="w-5 h-5 text-indigo-600" />,
          status: "COMPLETED",
          color: "indigo"
        },
        {
          phase: "PHASE 03-04",
          period: "กรกฎาคม 2026",
          title: "Lifecycle & Multimodal AI",
          desc: "Dynamic Auto-Status Lifecycle (Pending ➔ In-Progress ➔ Completed), Material Shortage Blockers, Drawing OCR, DocAI Vector Search",
          deliverables: [
            "คำนวณสถานะอัตโนมัติจากยอดกล่องจริง",
            "ระบบบันทึกอุปสรรค ขาดกล่อง/แกลลอน/น้ำมัน",
            "ระบบสกัด Drawing/Master ด้วย Gemini OCR + pgvector"
          ],
          icon: <Cpu className="w-5 h-5 text-purple-600" />,
          status: "COMPLETED",
          color: "purple"
        },
        {
          phase: "PHASE 05-06",
          period: "สิงหาคม 2026",
          title: "UI Overhaul & V&V Ready",
          desc: "Apple Liquid Glass Design System, Interactive Presentation Deck 22 สไลด์, Keynote Spring Physics, 129 Unit Tests Passed 100%",
          deliverables: [
            "ขจัด AI Slop สู่ Modern Industrial Minimal UI",
            "Interactive Presentation Deck พร้อม Live Sandbox",
            "ผ่านการทดสอบ Automated Tests 129 รายการ 100%"
          ],
          icon: <Award className="w-5 h-5 text-emerald-600" />,
          status: "PRODUCTION READY",
          color: "emerald"
        }
      ]
    },
    // 5. System Architecture & Boundaries (Architecture)
    {
      id: 5,
      category: "architecture",
      type: "split",
      chapter: "05 / SYSTEM ARCHITECTURE",
      title: "Hybrid Next.js & Serverless Boundary",
      description: "สถาปัตยกรรมระบบที่ปลอดภัย รวดเร็ว และรองรับโหลดระดับอุตสาหกรรม",
      bullets: [
        {
          title: "Next.js API Boundary & Supabase RLS",
          desc: "ซ่อน Credentials และควบคุมสิทธิ์การเข้าถึงข้อมูลผ่าน Row Level Security (RLS)",
          icon: <ShieldCheck className="w-6 h-6 text-blue-500" />
        },
        {
          title: "Cloudinary Evidence Storage",
          desc: "บีบอัดรูปฝั่ง Client (300KB) และอัปโหลดภาพหลักฐาน Rework Direct Unsigned ช่วยลดโหลดเซิร์ฟเวอร์",
          icon: <Database className="w-6 h-6 text-emerald-500" />
        },
        {
          title: "Jina AI Embeddings + pgvector",
          desc: "แปลงเอกสารคู่มือเป็น 768-dim Vectors สำหรับสืบค้นความหมายที่แม่นยำด้วย Semantic Search",
          icon: <Cpu className="w-6 h-6 text-purple-500" />
        }
      ]
    },
    // 6. Overall System Architecture & Data Flow (Architecture)
    {
      id: 6,
      category: "architecture",
      type: "architecture-flow",
      chapter: "06 / DATA FLOW ARCHITECTURE",
      title: "Overall System Architecture Flow",
      subtitle: "การสัญจรของข้อมูลระหว่าง Client, Server Boundary, AI Engine และ Cloud Database",
      flowSteps: [
        {
          step: 1,
          title: "ฝั่งผู้ใช้งาน (Client Shell)",
          subtitle: "React SPA / Next.js",
          tag: "Frontend",
          desc: "ดูแลเรื่อง View, Session Restore, Role-based Routing และจัดการ State ภายใน UI อย่างลื่นไหล",
          icon: <Globe className="w-6 h-6 text-blue-600" />,
          color: "blue",
          subitems: [
            "React 19 Shell & Motion Animation",
            "Client-side Image Compression (300KB)",
            "Role Separation (QSMS Admin / Operator)"
          ]
        },
        {
          step: 2,
          title: "เซิร์ฟเวอร์หลัก (API Boundary)",
          subtitle: "Next.js API Routes",
          tag: "Server Boundary",
          desc: "ควบคุมความปลอดภัย ซ่อน Secrets จัดการ Auth ด้วย HTTP-Only Cookies และควบคุม Database Transactions",
          icon: <Server className="w-6 h-6 text-indigo-600" />,
          color: "indigo",
          subitems: [
            "HTTP-Only JWT Cookie Authentication",
            "Transaction Rollback เมื่ออัปโหลดรูปล้มเหลว",
            "REST API Boundary (/api/rework, /api/drawings)"
          ]
        },
        {
          step: 3,
          title: "ปัญญาประดิษฐ์ (AI Core)",
          subtitle: "Gemini Vision + Jina",
          tag: "Multimodal AI",
          desc: "โมเดล OCR และ Vector Embeddings ประมวลผลเอกสาร PDF สกัด Structured JSON และตอบคำถาม SSE",
          icon: <Cpu className="w-6 h-6 text-purple-600" />,
          color: "purple",
          subitems: [
            "Gemini OCR Multi-tier Fallback (3.1 ➔ 2.0)",
            "Jina AI Embeddings (768 Dimensions)",
            "SSE Real-time Streaming & Function Calling"
          ]
        },
        {
          step: 4,
          title: "ฐานข้อมูล & สื่อ (Storage Core)",
          subtitle: "Supabase + Cloudinary",
          tag: "Cloud Storage",
          desc: "Supabase PostgreSQL เก็บข้อมูล Operational แบบเรียลไทม์ และ Cloudinary จัดเก็บภาพหลักฐาน",
          icon: <Database className="w-6 h-6 text-emerald-600" />,
          color: "emerald",
          subitems: [
            "Supabase PostgreSQL + pgvector Extension",
            "Cloudinary Unsigned Direct Upload",
            "Row Level Security (RLS) Data Protection"
          ]
        }
      ]
    },
    // 7. Database Relationship Schema - ERD (Architecture)
    {
      id: 7,
      category: "architecture",
      type: "erd-schema",
      chapter: "07 / DATABASE SCHEMA",
      title: "Database Relationship Schema (ERD)",
      subtitle: "ผังความสัมพันธ์โครงสร้างตารางข้อมูลและ Foreign Keys ในระบบ Supabase PostgreSQL",
      erdTables: [
        {
          tableName: "rework_cases",
          badge: "Core Ledger",
          color: "blue",
          icon: <Table className="w-4 h-4" />,
          columns: [
            { name: "id", type: "UUID / String", isKey: true, desc: "Primary Key (RTxxx-YYYY / RWxxx-YYYY)" },
            { name: "customer_name", type: "VARCHAR(100)", desc: "Customer Identifier (OR / SFC)" },
            { name: "status", type: "VARCHAR(20)", desc: "Dynamic: Pending / In-Progress / Completed" },
            { name: "total_boxes", type: "INTEGER", desc: "Total planned box count" },
            { name: "completed_boxes", type: "INTEGER", desc: "Real completed box progress" },
            { name: "missing_boxes", type: "INTEGER", desc: "Shortage: Missing boxes blocker" },
            { name: "missing_gallons", type: "INTEGER", desc: "Shortage: Missing gallons blocker" },
            { name: "missing_oil", type: "INTEGER", desc: "Shortage: Missing oil blocker" }
          ]
        },
        {
          tableName: "rework_items",
          badge: "Granular Items",
          color: "indigo",
          icon: <Table className="w-4 h-4" />,
          columns: [
            { name: "id", type: "UUID", isKey: true, desc: "Item Primary Key" },
            { name: "case_id", type: "UUID / String", isFk: true, desc: "Foreign Key -> rework_cases.id" },
            { name: "item_code", type: "VARCHAR(50)", isFk: true, desc: "FK -> item_master.item_code (4000xxxx)" },
            { name: "item_number", type: "VARCHAR(50)", desc: "Formula code (61653013A700A)" },
            { name: "batch_no", type: "VARCHAR(50)", desc: "Production Batch Number" },
            { name: "gallon_date", type: "VARCHAR(30)", desc: "Gallon Blow-molding Date" },
            { name: "amount", type: "INTEGER", desc: "Amount in units (Non-zero)" },
            { name: "linked_source_id", type: "UUID", isFk: true, desc: "Cross-Item Link (Stain -> Leak)" }
          ]
        },
        {
          tableName: "item_master",
          badge: "Catalog Master",
          color: "purple",
          icon: <Table className="w-4 h-4" />,
          columns: [
            { name: "item_code", type: "VARCHAR(50)", isKey: true, desc: "Primary Key (Customer Code 4000xxxx)" },
            { name: "item_number", type: "VARCHAR(50)", desc: "Manufacturing Formula Number" },
            { name: "part_name", type: "VARCHAR(255)", desc: "Official Product Name" },
            { name: "oil_group", type: "VARCHAR(50)", desc: "Oil Category Specification" },
            { name: "package_size", type: "VARCHAR(50)", desc: "Package Volume (e.g. 1L, 4L, 5L, 6L)" },
            { name: "pallet_type", type: "VARCHAR(50)", desc: "Pallet Standard (e.g. 1100x1100)" },
            { name: "boxes_per_pallet", type: "VARCHAR(50)", desc: "Normalized Box/Pallet or 'ตามความเหมาะสม'" }
          ]
        },
        {
          tableName: "engineering_drawings",
          badge: "Document Master",
          color: "emerald",
          icon: <Table className="w-4 h-4" />,
          columns: [
            { name: "id", type: "UUID", isKey: true, desc: "Drawing Primary Key" },
            { name: "drawing_number", type: "VARCHAR(100)", desc: "Unique Engineering Drawing Number" },
            { name: "revision", type: "VARCHAR(20)", desc: "Revision Level (Rev 0, 1, 2...)" },
            { name: "item_code", type: "VARCHAR(50)", isFk: true, desc: "FK -> item_master.item_code" },
            { name: "pdf_url", type: "TEXT", desc: "Supabase Storage Document Path" },
            { name: "rag_documents", type: "TABLE (FK)", desc: "Technical Manual Vector Chunks (768-D)" }
          ]
        }
      ]
    },
    // 8. User Roles & RBAC Matrix (Architecture)
    {
      id: 8,
      category: "architecture",
      type: "split",
      chapter: "08 / USER ROLES & RBAC",
      title: "Role-Based Access Control Matrix",
      description: "ทฤษฎีการแบ่งแยกหน้าที่การทำงาน (Separation of Duties) ผ่านระบบความปลอดภัย RBAC",
      bullets: [
        {
          title: "Operator Role (หน้างาน)",
          desc: "สร้างเคส Rework, บันทึกรูปถ่ายหลักฐาน, อัปเดตความคืบหน้ายอดกล่องเสร็จจริง และระบุอุปสรรคหน้างาน (ขาดกล่อง/แกลลอน/น้ำมัน)",
          badge: "OPERATOR",
          icon: <Users className="w-6 h-6 text-amber-600" />
        },
        {
          title: "QSMS Admin Role (ผู้ดูแลและควบคุมคุณภาพ)",
          desc: "สิทธิ์เต็มระบบ: ตรวจสอบและอนุมัติเคส, จัดการ Item Master & Drawing Storage, สกัดแบบแปลนด้วย AI, และส่งออกรายงาน Excel ฝังรูป",
          badge: "QSMS ADMIN",
          icon: <ShieldCheck className="w-6 h-6 text-blue-600" />
        }
      ]
    },
    // 9. Auth Tour (Rework)
    {
      id: 9,
      category: "rework",
      type: "tour",
      chapter: "09 / REWORK WORKFLOW",
      title: "Authentication",
      mockComponent: <MockLogin onNavigate={() => setCurrentIdx(9)} />,
      tourCard: {
        title: "หน้าเข้าสู่ระบบ (Login)",
        description: (
          <>
            เข้าสู่ระบบด้วย Username/Password ที่กำหนด<br />
            <br />
            รองรับระบบจดจำรหัสผ่าน และแบ่งสิทธิ์ผู้ใช้งานตั้งแต่ต้นทาง (Role-Based Access)
            ก่อนเข้าสู่ศูนย์กลางควบคุม
          </>
        ),
        position: "bottom-12 right-12"
      }
    },
    // 10. Portal Tour (Rework)
    {
      id: 10,
      category: "rework",
      type: "tour",
      chapter: "10 / REWORK WORKFLOW",
      title: "Portal Entry",
      mockComponent: <MockPortal onNavigate={() => setCurrentIdx(10)} />,
      tourCard: {
        title: "ระบบรวมศูนย์ (Unified Portal)",
        description: (
          <>
            จุดเริ่มต้นสำหรับการเข้าใช้งานทุกโมดูล<br />
            <br />
            เลือกแอปพลิเคชันที่ต้องการ เช่น Rework หรือ Drawing Storage
            ระบบจะกรองสิทธิ์และแสดงเมนูตามบทบาทผู้ใช้โดยอัตโนมัติ
          </>
        ),
        position: "bottom-12 right-12 z-50"
      }
    },
    // 11. Overall Monitoring Tour (Rework)
    {
      id: 11,
      category: "rework",
      type: "tour",
      chapter: "11 / REWORK WORKFLOW",
      title: "Overall Monitoring",
      mockComponent: <MockOverall onNavigate={() => setCurrentIdx(11)} />,
      tourCard: {
        title: "หน้ารวมรายการ Rework",
        description: (
          <>
            ติดตามเคสทั้งหมดในรูปแบบตารางที่สรุปข้อมูลสำคัญ<br />
            <br />
            พร้อมระบบแจ้งเตือน SLA (Badge สีแดง) หากงานค้างนานเกินกำหนด
            และระบบค้นหาคัดกรองที่มีประสิทธิภาพ
          </>
        ),
        position: "bottom-16 right-16"
      }
    },
    // 12. Add Case Tour (Rework)
    {
      id: 12,
      category: "rework",
      type: "tour",
      chapter: "12 / REWORK WORKFLOW",
      title: "Case Initiation & Evidence Integrity",
      hasSimulation: true,
      simulationLabel: { play: 'เล่นจำลอง Auto-fill (Play Demo)', playing: 'กำลังจำลอง Auto-fill...', replay: 'จำลองใหม่อีกครั้ง (Replay Demo)' },
      mockComponent: (
        <MockAddCase
          onNavigate={() => setCurrentIdx(12)}
          preset="with-item"
          simulationTrigger={simTrigger}
          onSimulationComplete={handleSimulationComplete}
        />
      ),
      tourCard: {
        title: "การเปิดเคสแบบ Smart & บังคับหลักฐาน",
        description: (
          <>
            ลดความผิดพลาดในการกรอกข้อมูลด้วยระบบ Auto-fill และมั่นใจได้ด้วยหลักฐานภาพถ่าย<br />
            <br />
            • <b>Auto-fill:</b> เพียงกรอกรหัสและกดค้นหา ระบบจะตรวจสอบและดึงข้อมูลจาก Item Master (หรือสร้างรายการใหม่) อัตโนมัติ<br />
            • <b>Evidence Integrity:</b> บังคับแนบรูปภาพ พร้อมระบบบีบอัดภาพก่อนอัปโหลดเพื่อประหยัด Storage
          </>
        ),
        position: "bottom-12 left-12"
      }
    },
    // 13. Smart Features Tour (Rework)
    {
      id: 13,
      category: "rework",
      type: "tour",
      chapter: "13 / REWORK WORKFLOW",
      title: "Smart Features & Cross-Item Link",
      hasSimulation: true,
      simulationLabel: { play: 'เล่นจำลอง Smart Features', playing: 'กำลังจำลอง Smart Features...', replay: 'จำลองใหม่อีกครั้ง (Replay Demo)' },
      mockComponent: (
        <MockAddCase
          onNavigate={() => setCurrentIdx(13)}
          preset="ptt-or"
          simulationTrigger={simTrigger}
          onSimulationComplete={handleSimulationComplete}
        />
      ),
      tourCard: {
        title: "ฟีเจอร์ช่วยเหลืออัจฉริยะ",
        description: (
          <>
            ระบบรองรับเงื่อนไขเฉพาะของลูกค้า เช่นบังคับแนบไฟล์เมื่อเป็น PTT OR<br />
            <br />
            และมีระบบเชื่อมโยงสาเหตุ (Cross-Item Link) ระหว่างไอเทม
            ช่วยวิเคราะห์และลดภาระการพิมพ์ข้อมูลซ้ำซ้อน
          </>
        ),
        position: "bottom-12 left-12"
      }
    },
    // 14. Update Case Tour (Rework)
    {
      id: 14,
      category: "rework",
      type: "tour",
      chapter: "14 / REWORK WORKFLOW",
      title: "Dynamic Auto-Status, Blockers & Excel Export",
      hasSimulation: true,
      simulationLabel: { play: 'เล่นจำลองการอัปเดต & ส่งออก Excel', playing: 'กำลังจำลองการทำงาน...', replay: 'จำลองใหม่อีกครั้ง (Replay Demo)' },
      mockComponent: (
        <MockUpdateModal
          onNavigate={() => setCurrentIdx(14)}
          simulationTrigger={simTrigger}
          onSimulationComplete={handleSimulationComplete}
        />
      ),
      tourCard: {
        title: "อัปเดตสถานะ, จัดการอุปสรรค & ส่งออก Excel",
        description: (
          <>
            ระบบคำนวณสถานะอัตโนมัติ (Dynamic Auto-Status) ตามยอดกล่องที่ทำเสร็จจริง<br />
            <br />
            • <b>Auto-Status & Accordion:</b> ปรับสถานะตามยอดผลิตจริง พร้อม Accordion สรุปวัสดุที่ขาด<br />
            • <b>Evidence Photos:</b> แนบและตรวจสอบรูปภาพหลักฐานความผิดปกติระดับไอเทม<br />
            • <b>Direct Excel Export:</b> ส่งออกตารางรายงานพร้อม <b>ฝังรูปภาพหลักฐานลงในเซลล์ Excel โดยตรง</b> จากหน้าจัดการเคส
          </>
        ),
        position: "bottom-16 left-16"
      }
    },
    // 15. Export & Reporting Tour (Rework)
    {
      id: 15,
      category: "rework",
      type: "tour",
      chapter: "15 / REWORK WORKFLOW",
      title: "Executive Analytics & Defect Intelligence Dashboard",
      mockComponent: <MockDashboard onNavigate={() => setCurrentIdx(15)} />,
      tourCard: {
        title: "แดชบอร์ดวิเคราะห์สถิติ & คุณภาพงาน Rework",
        description: (
          <>
            ดูง่าย เข้าใจต้นทุนและสถานะงาน Rework ได้ในพริบตา<br />
            <br />
            • <b>Operations Overview:</b> สรุปจำนวนเคส ยอดกล่องสำเร็จ และอัตราการแก้ไขงานสำเร็จ<br />
            • <b>Defect Intelligence:</b> วิเคราะห์สาเหตุความผิดปกติ (รั่ว, เปื้อน, ฝาแตก) และสายการผลิต<br />
            • <b>Monthly Cost & Trend:</b> ติดตามแนวโน้มและต้นทุนเฉลี่ยเพื่อวางแผนการปรับปรุงคุณภาพเชิงรุก
          </>
        ),
        position: "bottom-12 right-12"
      }
    },
    // 16. Drawing Storage Solution (Storage)
    {
      id: 16,
      category: "storage",
      type: "split",
      chapter: "16 / DRAWING & MASTER MODULE",
      title: "Drawing & Master Storage",
      description: "จัดการแบบแปลนลูกค้าและ Master Sheet ด้วย AI OCR และแผงตรวจทานคู่ขนาน",
      bullets: [
        {
          title: "Gemini Vision OCR Multi-field",
          desc: "สกัดฟิลด์ Drawing (7 ฟิลด์) และ Master Sheet (8 ฟิลด์) อัตโนมัติ ป้องกันความผิดพลาดจากการคีย์ด้วยมือ",
          icon: <Layers className="w-6 h-6 text-amber-500" />
        },
        {
          title: "55/45 Inspection Workspace",
          desc: "แผงตรวจทาน Side-by-Side ดู PDF ฝั่งซ้ายพร้อมแก้ไข Metadata ฝั่งขวา สลับดูแบบแปลนด้วยลูกศร",
          icon: <LayoutGrid className="w-6 h-6 text-blue-500" />
        },
        {
          title: "Boxes per Pallet Normalization",
          desc: "ปรับแปลงค่า 'ตามความเหมาะสม' เข้าสู่ระบบอย่างถูกต้องแม่นยำ ไม่สุ่มเดาตัวเลข",
          icon: <CheckCircle2 className="w-6 h-6 text-emerald-500" />
        }
      ]
    },
    // 17. Drawing Storage Tour (Storage)
    {
      id: 17,
      category: "storage",
      type: "tour",
      chapter: "17 / DRAWING WORKFLOW",
      title: "AI Drawing & Master Storage Workflow",
      hasSimulation: true,
      simulationLabel: { play: 'เล่นจำลอง AI Drawing & Inspection', playing: 'กำลังจำลองการทำงาน...', replay: 'จำลองใหม่อีกครั้ง (Replay Demo)' },
      mockComponent: (
        <MockDrawingMaster
          onNavigate={() => setCurrentIdx(17)}
          simulationTrigger={simTrigger}
          onSimulationComplete={handleSimulationComplete}
        />
      ),
      tourCard: {
        title: "AI OCR, แผงตรวจทาน 55/45 & Gap Analysis",
        description: (
          <>
            จัดการแบบแปลนลูกค้าและ Master Sheet ด้วย AI Vision OCR และแผงตรวจทานคู่ขนาน<br />
            <br />
            • <b>Gemini Vision OCR:</b> สกัดสเปกอัตโนมัติ (Drawing 7 ฟิลด์ / Master 8 ฟิลด์)<br />
            • <b>PDF Orientation Toolbar:</b> หมุน PDF 90° Landscape 1-click และจำองศาลงระบบ<br />
            • <b>Boxes/Pallet Normalization:</b> ตรวจจับและแปลงค่า "ตามความเหมาะสม" แม่นยำ<br />
            • <b>Gap Analysis Report:</b> ตรวจจับแบบแปลนที่ยังขาด Master และส่งออกไฟล์ Excel
          </>
        ),
        position: "bottom-12 right-12"
      }
    },
    // 18. Master Sheet Tour (Storage)
    {
      id: 18,
      category: "storage",
      type: "tour",
      chapter: "18 / STORAGE WORKFLOW",
      title: "Master Sheet Schema & Form Separation",
      hasSimulation: true,
      simulationLabel: { play: 'จำลองการแยกฟอร์ม Master', playing: 'กำลังจำลอง...', replay: 'จำลองใหม่อีกครั้ง' },
      mockComponent: (
        <MockDrawingMaster
          onNavigate={() => setCurrentIdx(18)}
          simulationTrigger={simTrigger}
          onSimulationComplete={handleSimulationComplete}
        />
      ),
      tourCard: {
        title: "การแยกโครงสร้างแบบฟอร์ม Drawing และ Master",
        description: (
          <>
            แยกโครงสร้างข้อมูล Drawing (7 ฟิลด์) และ Master Sheet (8 ฟิลด์) ออกจากกันอย่างเด็ดขาด<br />
            <br />
            • กำหนดสีกำกับเฉพาะ (Drawing = สีน้ำเงิน / Master = สีม่วงเข้ม)<br />
            • ป้องกันฟิลด์ N/A สับสน และรองรับการค้นหาข้ามตารางทันที
          </>
        ),
        position: "bottom-12 right-12"
      }
    },
    // 19. Side-by-Side Inspection Tour (Storage)
    {
      id: 19,
      category: "storage",
      type: "tour",
      chapter: "19 / STORAGE WORKFLOW",
      title: "55/45 Split View & PDF Auto-Orientation",
      hasSimulation: true,
      simulationLabel: { play: 'จำลอง Split View & Landscape', playing: 'กำลังจำลอง...', replay: 'จำลองใหม่อีกครั้ง' },
      mockComponent: (
        <MockDrawingMaster
          onNavigate={() => setCurrentIdx(19)}
          simulationTrigger={simTrigger}
          onSimulationComplete={handleSimulationComplete}
        />
      ),
      tourCard: {
        title: "แผงตรวจทานเอกสาร 55/45 & หมุน PDF แนวนอน",
        description: (
          <>
            เปิดแผงตรวจทานฝั่งขวาทันทีเมื่อคลิกเลือกแถวในตาราง<br />
            <br />
            • <b>Landscape View 1-Click:</b> หมุน PDF 90° ให้อ่านง่ายทันที<br />
            • <b>Persistent Orientation:</b> บันทึกองศาการหมุนลง localStorage ถาวร
          </>
        ),
        position: "bottom-12 right-12"
      }
    },
    // 20. DocAI RAG Tour (RAG)
    {
      id: 20,
      category: "rag",
      type: "tour",
      chapter: "20 / DOCAI WORKFLOW",
      title: "Interactive AI Chatbot & Manual Search",
      hasSimulation: true,
      simulationLabel: { play: 'เล่นจำลอง DocAI RAG & Inspect Chunks', playing: 'กำลังจำลองการทำงาน...', replay: 'จำลองใหม่อีกครั้ง (Replay Demo)' },
      mockComponent: (
        <MockDocAIRAG
          onNavigate={() => setCurrentIdx(20)}
          simulationTrigger={simTrigger}
          onSimulationComplete={handleSimulationComplete}
        />
      ),
      tourCard: {
        title: "ระบบถาม-ตอบคู่มือวิศวกรรมสด & Inspect Chunks",
        description: (
          <>
            ผู้ช่วย AI อัจฉริยะสืบค้นคู่มือเทคนิคและแนวทางการแก้ไขงาน Rework ด้วย Vector pgvector<br />
            <br />
            • <b>Gemini SSE Streaming:</b> ตอบคำถามสดพร้อมหลอดวิเคราะห์ Defect Correlation<br />
            • <b>Sources Citation:</b> ระบุชื่อไฟล์ PDF, เลขหน้า และเปอร์เซ็นต์ Match แม่นยำ<br />
            • <b>Knowledge Base & Chunks:</b> ดูคลัง PDF 768-D และเปิด Inspector ดูเวกเตอร์ชิ้นส่วนจริง
          </>
        ),
        position: "bottom-12 right-12"
      }
    },
    // 21. Infrastructure & Storage Capacity (Overview / All)
    {
      id: 21,
      category: "all",
      type: "split",
      chapter: "21 / STORAGE & CAPACITY",
      title: "Zero-Cost Infrastructure Capacity",
      description: "การวิเคราะห์ขีดจำกัดพื้นที่จัดเก็บ (Storage Quota) และประมาณการอายุการใช้งานจริงของระบบบน Free Tier โดยไม่มีค่าใช้จ่าย (1 เคส = 10 ไอเทม + 10 รูปภาพ)",
      bullets: [
        {
          title: "Cloudinary Free Tier: 25 GB (จุดคอขวดระบบ)",
          desc: "บีบอัดรูปภาพฝั่ง Client เหลือ ~250 KB/รูป (10 รูป/เคส = 2.5 MB) รองรับการสร้างเคสได้สูงสุด 10,000 เคส (100,000 รูปภาพ)",
          badge: "25 GB FREE / 10,000 CASES",
          icon: <Layers className="w-6 h-6 text-orange-600" />
        },
        {
          title: "Supabase Database: 500 MB (PostgreSQL Storage)",
          desc: "จัดเก็บ Case Header, รายการสินค้า 10 ไอเทม, JSONB Requisition และ Indexes (~30 KB/เคส) รองรับได้ถึง 16,600 เคส (166,000 ไอเทม)",
          badge: "500 MB DB / 16,600 CASES",
          icon: <Database className="w-6 h-6 text-blue-600" />
        },
        {
          title: "ขีดจำกัดสูงสุดรวม: 10,000 เคส (100,000 ไอเทม)",
          desc: "ระบบประหยัดพื้นที่จัดเก็บสูงสุดด้วยการเก็บเฉพาะ Text URL ใน Postgres และบีบอัดภาพก่อนส่งขึ้นคลาวด์ ไม่ต้องจ่ายค่า Server รายเดือน",
          badge: "100% ZERO-COST",
          icon: <ShieldCheck className="w-6 h-6 text-emerald-600" />
        },
        {
          title: "ประมาณการอายุการใช้งาน: 5.4 ปี (ที่ 5 เคส/วัน)",
          desc: "หากมีงาน Rework เฉลี่ย 2 เคส/วัน ใช้งานได้ 13.6 ปี | ที่ 5 เคส/วัน ใช้งานได้ 5.4 ปี | ที่ 10 เคส/วัน ใช้งานได้ 2.7 ปี โดยไม่มีค่าใช้จ่าย",
          badge: "~5.4 YEARS LIFESPAN",
          icon: <Clock className="w-6 h-6 text-purple-600" />
        }
      ]
    },
    // 22. Business Impact (Overview / All)
    {
      id: 22,
      category: "all",
      type: "split",
      chapter: "22 / BUSINESS ROI",
      title: "Operational Impact & Value",
      description: "ผลลัพธ์ที่เป็นรูปธรรมและผลตอบแทนจากการลงทุน (ROI) ด้วย QSMS Platform",
      bullets: [
        {
          title: "ลดเวลาทำงานและค้นหาเอกสาร ~70%",
          desc: "ตัดขั้นตอนการค้นหาเอกสารในแฟ้มและการคีย์ข้อมูลซ้ำซ้อนใน Excel ด้วยระบบ AI Vision OCR และ Smart Auto-fill",
          badge: "-70% TIME",
          icon: <Clock className="w-6 h-6 text-blue-600" />
        },
        {
          title: "ตรวจสอบย้อนกลับ & ความโปร่งใส 100%",
          desc: "บันทึกล็อตการผลิต, เลขกล่อง, และเชื่อมโยงสินค้าเปื้อนไปยังไอเทมต้นเหตุ (Cross-Link) พร้อม Audit Log ครบวงจร",
          badge: "100% TRACEABLE",
          icon: <ShieldCheck className="w-6 h-6 text-emerald-600" />
        },
        {
          title: "Zero-Data Loss & Quality Integrity",
          desc: "Gap Analysis แจ้งเตือน Master Sheet ที่ขาดหาย และระบบ Rollback ทันทีหากอัปโหลดหลักฐานรูปภาพไม่สมบูรณ์",
          badge: "0 DATA LOSS",
          icon: <Database className="w-6 h-6 text-rose-600" />
        },
        {
          title: "ผู้ช่วยอัจฉริยะเข้าถึงความรู้ 24/7",
          desc: "พนักงานหน้างานสืบค้นคู่มือเทคนิคและแนวทางแก้ไขงาน Rework ผ่าน Gemini Vector AI ได้ทันที ลดการพึ่งพาตัวบุคคล",
          badge: "24/7 AI SUPPORT",
          icon: <Bot className="w-6 h-6 text-indigo-600" />
        }
      ]
    },
    // 23. Conclusion & Rollout Roadmap + Future Scope (Overview / All)
    {
      id: 23,
      category: "all",
      type: "conclusion",
      chapter: "23 / CONCLUSION & ROADMAP",
      title: "Ready for Operations & Future Scope",
      subtitle: "QSMS Unified Platform • Enterprise Rollout & Long-term Roadmap",
      description: "พร้อมยกระดับกระบวนการ Rework และการจัดการเอกสารวิศวกรรมสู่อนาคต",
      roadmapPhases: [
        {
          phase: "PHASE 01",
          title: "Pilot & Live Testing",
          time: "สัปดาห์ที่ 1 - 2",
          color: "blue",
          icon: <Workflow className="w-5 h-5 text-blue-600" />,
          points: [
            "ทดลองใช้งานนำร่องกับทีม Operator สายการผลิตหลัก",
            "นำเข้าแบบแปลน PDF สู่ Drawing Storage",
            "ตรวจสอบและปรับแต่งความเร็ว AI OCR & Auto-fill"
          ]
        },
        {
          phase: "PHASE 02",
          title: "On-site Training & Feedback",
          time: "สัปดาห์ที่ 3 - 4",
          color: "indigo",
          icon: <Users className="w-5 h-5 text-indigo-600" />,
          points: [
            "จัดอบรมพนักงาน Operator และผู้ตรวจการ QSMS",
            "รวบรวมฟีดแบ็กหน้างานและปรับแต่งคำตอบ DocAI RAG",
            "ตรวจสอบความถูกต้องของ Gap Analysis ในงานจริง"
          ]
        },
        {
          phase: "PHASE 03",
          title: "Full Enterprise Deployment",
          time: "สัปดาห์ที่ 5 เป็นต้นไป",
          color: "emerald",
          icon: <Award className="w-5 h-5 text-emerald-600" />,
          points: [
            "เปิดใช้งานระบบเต็มรูปแบบทุกสายการผลิต 100%",
            "ใช้งานรายงาน Excel ฝังรูปหลักฐานและสถิติ Rework",
            "ติดตามเสถียรภาพและขยายคลังเอกสารอัตโนมัติ"
          ]
        }
      ],
      futureRoadmap: [
        {
          title: "1. การขยายขีดความสามารถ AI (Domain Fine-tuning)",
          horizon: "Future Scope",
          desc: "เทรนและปรับแต่งโมเดล RAG ด้วยคำศัพท์เฉพาะทางวิศวกรรมระดับโรงงาน เพื่อเพิ่มความแม่นยำในการวิเคราะห์อาการเสียเชิงลึก",
          icon: <Cpu className="w-5 h-5 text-purple-600" />,
          tags: ["LoRA / Fine-tuning", "Factory Domain Vocabulary", "Precision Analysis"]
        },
        {
          title: "2. การเชื่อมต่อโครงข่ายองค์กร (Enterprise SAP / ERP)",
          horizon: "Future Scope",
          desc: "เชื่อมโยงข้อมูลค่าใช้จ่ายและสถานะเคสเข้ากับระบบ ERP หลักขององค์กร (เช่น SAP) ผ่าน REST API สำหรับบัญชีอัตโนมัติ 100%",
          icon: <Server className="w-5 h-5 text-blue-600" />,
          tags: ["SAP Integration", "REST API", "Automated Valuation 100%"]
        }
      ]
    }
  ], [simTrigger, handleSimulationComplete]);

  // Active filtered slides based on category
  const activeSlides = useMemo(() => {
    if (selectedCategory === "all") return allSlides;
    return allSlides.filter(s => s.category === selectedCategory);
  }, [allSlides, selectedCategory]);

  const handlePrev = useCallback(() => {
    setDirection(-1);
    setSimTrigger(0);
    setIsSimulating(false);
    setCurrentIdx(prev => Math.max(prev - 1, 0));
  }, []);

  const handleNext = useCallback(() => {
    setDirection(1);
    setSimTrigger(0);
    setIsSimulating(false);
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

    // Swipe detection: moved > 40px, mostly horizontal, within 600ms
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
    setSimTrigger(0);
    setIsSimulating(false);
    setSelectedCategory(catId);
    setCurrentIdx(0);
  }, []);

  // Slide transition physics (Apple Keynote grade directional slide + depth - hardware accelerated)
  const slideVariants: Variants = useMemo(() => ({
    enter: (dir: number) => ({
      x: dir > 0 ? 60 : dir < 0 ? -60 : 0,
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
        opacity: { duration: 0.28, ease: [0.16, 1, 0.3, 1] as const },
        scale: { duration: 0.3, ease: [0.16, 1, 0.3, 1] as const },
      },
    },
    exit: (dir: number) => ({
      zIndex: 0,
      x: dir > 0 ? -60 : dir < 0 ? 60 : 0,
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
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNext, handlePrev, toggleFullscreen]);

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] overflow-hidden font-sans">
      {/* Always-Visible Floating Exit Button for Touch & Mobile Users */}
      {onBackToPortal && (
        <div className="fixed top-3 left-3 sm:top-4 sm:left-4 z-[99999]">
          <button
            type="button"
            onClick={onBackToPortal}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full bg-white/90 backdrop-blur-xl border border-slate-200/80 shadow-lg hover:bg-white text-slate-800 font-bold text-xs active:scale-95 transition cursor-pointer select-none"
            title="ออกจากหน้าสไลด์ (กลับสู่พอร์ทัล)"
          >
            <ArrowLeft size={15} className="text-blue-600 shrink-0" />
            <span className="font-sans">ออก / Back</span>
          </button>
        </div>
      )}

      {/* Navbar Wrapper with dynamic hit area (Desktop Hover) */}
      <div 
        className={`fixed top-0 left-0 right-0 z-[9999] transition-all hidden md:block ${isNavVisible ? 'h-24' : 'h-6'}`}
        onMouseEnter={() => setIsNavVisible(true)}
        onMouseLeave={() => setIsNavVisible(false)}
      >
        <motion.nav
          initial={{ y: "-100%" }}
          animate={{ y: isNavVisible ? 0 : "-100%" }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="absolute top-0 left-0 right-0 px-8 py-5 flex justify-between items-center bg-white/50 backdrop-blur-3xl backdrop-saturate-150 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),inset_0_-1px_0_rgba(255,255,255,0.2),0_10px_30px_rgba(0,0,0,0.05)] text-slate-900 pointer-events-auto border-none"
        >
          <div className="flex items-center gap-4">
            {onBackToPortal && (
              <Button variant="ghost" className="rounded-full p-2 h-9 w-9 bg-slate-100 hover:bg-slate-200 text-slate-700 shadow-sm border border-slate-200" onClick={onBackToPortal}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <div className="flex items-center gap-2">
              <span className="text-xs font-black tracking-[0.2em] uppercase text-[#0071e3] bg-[#0071e3]/10 px-3 py-1 rounded-full border border-[#0071e3]/20">
                QSMS Presentation Deck
              </span>
              <span className="text-xs text-slate-500 font-mono hidden md:inline">
                Slide {currentIdx + 1} of {activeSlides.length}
              </span>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1 bg-black/5 p-1 rounded-full shadow-[inset_0_1px_3px_rgba(0,0,0,0.1)] border border-white/20 backdrop-blur-md">
            {(
              [
                { id: 'all', label: `ทั้งหมด (${allSlides.length})` },
                { id: 'overview', label: 'ที่มา & ไทม์ไลน์' },
                { id: 'rework', label: 'QSMS Rework' },
                { id: 'storage', label: 'Drawing & Master' },
                { id: 'rag', label: 'DocAI RAG' },
                { id: 'architecture', label: 'Architecture & ERD' },
              ] as const
            ).map(cat => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleSelectCategory(cat.id)}
                  className={`relative px-4 py-1.5 text-xs font-medium rounded-full transition-colors duration-200 outline-none cursor-pointer ${
                    isActive ? 'text-slate-900' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="active-category-pill"
                      className="absolute inset-0 bg-white/80 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,1)] backdrop-blur-md"
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

            {/* Fullscreen Present Toggle */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className={`p-1.5 px-3 rounded-lg border transition-all flex items-center gap-1.5 shadow-xs text-xs font-bold cursor-pointer ${
                isFullscreen
                  ? 'bg-blue-600 text-white border-blue-500 shadow-blue-500/20'
                  : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
              title={isFullscreen ? "ออกจากโหมดเต็มจอ (F / Esc)" : "โหมดนำเสนอเต็มจอ Full Screen (กด F)"}
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              <span className="hidden md:inline">{isFullscreen ? 'Exit Fullscreen' : 'Present (F)'}</span>
            </button>
          </div>
        </motion.nav>
      </div>

      {/* Stage Viewport with Touch Swiping */}
      <div 
        className={`deck-viewport relative flex items-center justify-center w-full h-screen bg-[#f5f5f7] overflow-hidden select-none ${
          userZoom > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : ''
        }`}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <main
          className={`deck-stage relative shrink-0 bg-[#f5f5f7] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] rounded-[48px] overflow-hidden will-change-transform transform-gpu ${
            isDragging ? 'transition-none pointer-events-none select-none' : 'transition-transform duration-200 ease-out'
          }`}
          style={{ 
            width: '2560px', 
            height: '1440px', 
            transform: `translate3d(${panOffset.x}px, ${panOffset.y}px, 0px) scale(${scale * userZoom})`,
            transformOrigin: 'center center'
          }}
        >
          {/* Ambient Multi-Layer Background (High-Performance GPU composition) */}
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none transform-gpu">
            <div className="absolute top-[-10%] left-[10%] w-[900px] h-[900px] bg-gradient-to-br from-blue-300/35 via-indigo-200/20 to-transparent rounded-full blur-[100px] will-change-transform" />
            <div className="absolute bottom-[-10%] right-[10%] w-[1000px] h-[1000px] bg-gradient-to-tl from-pink-300/35 via-purple-200/20 to-transparent rounded-full blur-[110px] will-change-transform" />
            <div className="absolute top-[20%] left-[40%] w-[800px] h-[800px] bg-gradient-to-r from-purple-200/25 to-blue-200/20 rounded-full blur-[100px] will-change-transform" />
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
                    <div className="inline-flex items-center px-6 py-2 mb-8 rounded-full bg-white/50 backdrop-blur-md shadow-[0_4px_12px_rgba(0,0,0,0.03)] text-[#0071e3] font-bold tracking-[0.2em] uppercase text-sm">
                      {activeSlides[currentIdx].chapter}
                    </div>
                    <h1 className="text-8xl font-black tracking-tight leading-none mb-6 text-[#1d1d1f]">{activeSlides[currentIdx].title}</h1>
                    <h2 className="text-5xl font-bold text-[#86868b] mb-12">{activeSlides[currentIdx].subtitle}</h2>
                    <p className="text-2xl text-slate-500 font-thai max-w-4xl leading-relaxed">{activeSlides[currentIdx].description}</p>
                  </div>
                )}

                {/* Type: SPLIT */}
                {activeSlides[currentIdx].type === "split" && (
                  <div className="w-full h-full flex items-stretch bg-transparent text-[#1d1d1f] relative z-10 overflow-hidden p-20 gap-16">
                    <div className="flex-1 flex flex-col justify-center relative">
                      <div className="inline-flex items-center self-start px-5 py-2 mb-8 rounded-full bg-white/50 backdrop-blur-md shadow-[0_4px_12px_rgba(0,0,0,0.03)] text-[#0071e3] font-bold tracking-[0.2em] uppercase text-sm">
                        {activeSlides[currentIdx].chapter}
                      </div>
                      <h2 className="text-7xl font-black tracking-tight leading-[1.1] mb-8 text-[#1d1d1f]">{activeSlides[currentIdx].title}</h2>
                      <p className="text-2xl text-[#86868b] font-thai leading-relaxed">{activeSlides[currentIdx].description}</p>
                    </div>
                    <div className="flex-1 flex flex-col justify-center gap-5 relative">
                      {activeSlides[currentIdx].bullets?.map((b, i) => (
                        <motion.div
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.12 + 0.2 }}
                          key={i}
                          className="flex gap-6 items-start p-6 rounded-[28px] bg-white/45 backdrop-blur-2xl border border-white/80 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] hover:bg-white/70 hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.08)] transition-all duration-300 group"
                        >
                          <div className="w-14 h-14 rounded-[20px] bg-white shadow-[0_4px_16px_rgba(0,0,0,0.06)] flex items-center justify-center shrink-0 text-slate-700 group-hover:scale-110 group-hover:text-[#0071e3] transition-all duration-300">
                            {b.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-3 mb-1.5">
                              <h3 className="text-2xl font-bold text-[#1d1d1f] tracking-tight">{b.title}</h3>
                              {b.badge && (
                                <span className="px-3 py-1 rounded-full text-xs font-black tracking-wider bg-blue-50 text-blue-600 border border-blue-200/80 shadow-xs shrink-0">
                                  {b.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-base text-slate-600 font-thai leading-relaxed">{b.desc}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Type: TIMELINE (4-Month SDLC & Milestone Journey) */}
                {activeSlides[currentIdx].type === "timeline" && (
                  <div className="w-full h-full flex flex-col justify-between bg-transparent px-20 py-14 text-[#1d1d1f] relative z-10 overflow-hidden">
                    {/* Header */}
                    <div className="text-center max-w-5xl mx-auto mb-4">
                      <div className="inline-flex items-center px-6 py-2 mb-4 rounded-full bg-white/60 backdrop-blur-md shadow-[0_4px_12px_rgba(0,0,0,0.03)] text-[#0071e3] font-bold tracking-[0.2em] uppercase text-sm">
                        {activeSlides[currentIdx].chapter}
                      </div>
                      <h1 className="text-6xl font-black tracking-tight text-slate-900 mb-3">
                        {activeSlides[currentIdx].title}
                      </h1>
                      <p className="text-xl text-slate-500 font-thai font-medium">
                        {activeSlides[currentIdx].subtitle}
                      </p>
                    </div>

                    {/* 4 Timeline Phase Cards */}
                    <div className="grid grid-cols-4 gap-8 max-w-[2400px] mx-auto w-full my-auto px-4">
                      {activeSlides[currentIdx].timelineEvents?.map((event, eIdx) => (
                        <motion.div
                          key={eIdx}
                          initial={{ opacity: 0, y: 30 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: eIdx * 0.12 + 0.2 }}
                          className="relative p-8 rounded-[36px] bg-white/55 backdrop-blur-2xl border border-white/80 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.08)] flex flex-col justify-between group hover:bg-white/85 hover:-translate-y-2 transition-all duration-300 min-h-[580px]"
                        >
                          <div>
                            {/* Phase & Period Header */}
                            <div className="flex items-center justify-between mb-4">
                              <span className="px-3.5 py-1.5 rounded-full text-xs font-black tracking-wider bg-slate-900 text-white shadow-xs">
                                {event.phase}
                              </span>
                              <span className="text-sm font-bold text-blue-600 font-thai bg-blue-50/90 px-3 py-1 rounded-lg border border-blue-200/60">
                                {event.period}
                              </span>
                            </div>

                            {/* Icon & Title */}
                            <div className="flex items-center gap-3.5 mb-3">
                              <div className="w-13 h-13 rounded-2xl bg-white shadow-sm flex items-center justify-center shrink-0 border border-slate-100 group-hover:scale-110 transition-transform">
                                {event.icon}
                              </div>
                              <h3 className="text-2xl font-bold text-slate-900 tracking-tight leading-snug">
                                {event.title}
                              </h3>
                            </div>

                            <p className="text-sm text-slate-500 font-thai mb-6 leading-relaxed">
                              {event.desc}
                            </p>

                            {/* Deliverables Checklist */}
                            <div className="space-y-3 pt-4 border-t border-slate-100">
                              <div className="text-xs font-black text-slate-400 uppercase tracking-wider">
                                Key Deliverables
                              </div>
                              {event.deliverables.map((deliv, dIdx) => (
                                <div key={dIdx} className="flex items-start gap-2.5 text-sm text-slate-700 font-thai leading-snug">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                                  <span>{deliv}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Status Badge */}
                          <div className="mt-6 pt-4 border-t border-slate-100/80 flex items-center justify-between">
                            <span className="text-xs font-bold tracking-wider uppercase text-slate-400">
                              STATUS
                            </span>
                            <span className={`text-xs font-black tracking-wider px-3 py-1 rounded-full ${
                              event.status === 'PRODUCTION READY' 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}>
                              {event.status}
                            </span>
                          </div>

                          {/* Connector Arrow */}
                          {eIdx < 3 && (
                            <div className="hidden xl:block absolute -right-5 top-1/2 -translate-y-1/2 z-20 text-slate-300 pointer-events-none">
                              <ChevronRight size={28} />
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>

                    {/* Footer Info */}
                    <div className="max-w-[2400px] mx-auto w-full flex items-center justify-between pt-5 border-t border-slate-200/70">
                      <div className="text-sm text-slate-500 font-thai flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <span>วงจรรอบการพัฒนาแบบ Agile SDLC ครอบคลุม 4 เดือนเต็ม สู่เวอร์ชันเสถียรระดับ Enterprise</span>
                      </div>
                      <div className="text-sm font-mono font-bold text-slate-400">
                        TOTAL: 4 PHASES • 130 UNIT TESTS PASSED
                      </div>
                    </div>
                  </div>
                )}

                {/* Type: ARCHITECTURE FLOW (End-to-End Data Pipeline) */}
                {activeSlides[currentIdx].type === "architecture-flow" && (
                  <div className="w-full h-full flex flex-col justify-between bg-transparent px-20 py-14 text-[#1d1d1f] relative z-10 overflow-hidden">
                    {/* Header */}
                    <div className="text-center max-w-5xl mx-auto mb-4">
                      <div className="inline-flex items-center px-6 py-2 mb-4 rounded-full bg-white/60 backdrop-blur-md shadow-[0_4px_12px_rgba(0,0,0,0.03)] text-[#0071e3] font-bold tracking-[0.2em] uppercase text-sm">
                        {activeSlides[currentIdx].chapter}
                      </div>
                      <h1 className="text-6xl font-black tracking-tight text-slate-900 mb-3">
                        {activeSlides[currentIdx].title}
                      </h1>
                      <p className="text-xl text-slate-500 font-thai font-medium">
                        {activeSlides[currentIdx].subtitle}
                      </p>
                    </div>

                    {/* 4 Architecture Flow Pillars */}
                    <div className="grid grid-cols-4 gap-8 max-w-[2400px] mx-auto w-full my-auto px-4">
                      {activeSlides[currentIdx].flowSteps?.map((step, sIdx) => (
                        <motion.div
                          key={sIdx}
                          initial={{ opacity: 0, scale: 0.95, y: 20 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          transition={{ delay: sIdx * 0.12 + 0.2 }}
                          className="relative p-8 rounded-[36px] bg-white/55 backdrop-blur-2xl border border-white/80 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.08)] flex flex-col justify-between group hover:bg-white/85 hover:-translate-y-2 transition-all duration-300 min-h-[580px]"
                        >
                          <div>
                            {/* Step Badge & Tag */}
                            <div className="flex items-center justify-between mb-5">
                              <span className="w-9 h-9 rounded-full bg-slate-900 text-white font-mono font-bold text-sm flex items-center justify-center shadow-xs">
                                0{step.step}
                              </span>
                              <span className="text-xs font-black tracking-wider uppercase px-3.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-200/60">
                                {step.tag}
                              </span>
                            </div>

                            {/* Icon & Title */}
                            <div className="flex items-center gap-3.5 mb-3">
                              <div className="w-13 h-13 rounded-2xl bg-white shadow-sm flex items-center justify-center shrink-0 border border-slate-100 group-hover:scale-110 transition-transform">
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

                            {/* Subitems features list */}
                            <div className="space-y-3 pt-4 border-t border-slate-100">
                              {step.subitems.map((sub, subIdx) => (
                                <div key={subIdx} className="flex items-start gap-2.5 text-sm text-slate-700 font-thai leading-snug">
                                  <span className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                                  <span>{sub}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Step Connector Line */}
                          {sIdx < 3 && (
                            <div className="hidden xl:block absolute -right-5 top-1/2 -translate-y-1/2 z-20 text-slate-300 pointer-events-none">
                              <ChevronRight size={28} />
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>

                    {/* Bottom Status Banner */}
                    <div className="max-w-[2400px] mx-auto w-full flex items-center justify-between pt-5 border-t border-slate-200/70">
                      <div className="text-sm text-slate-500 font-thai flex items-center gap-2.5">
                        <ShieldCheck className="w-5 h-5 text-blue-600" />
                        <span>ระบบซ่อน Secrets ทั้งหมดไว้หลัง Next.js API Boundary ปลอดภัย 100% จากการเข้าถึงโดยตรง</span>
                      </div>
                      <div className="text-sm font-mono font-bold text-slate-400">
                        HYBRID NEXT.JS + SUPABASE + GEMINI
                      </div>
                    </div>
                  </div>
                )}

                {/* Type: ERD SCHEMA (Database Relationships) */}
                {activeSlides[currentIdx].type === "erd-schema" && (
                  <div className="w-full h-full flex flex-col justify-between bg-transparent px-20 py-14 text-[#1d1d1f] relative z-10 overflow-hidden">
                    {/* Header */}
                    <div className="text-center max-w-5xl mx-auto mb-4">
                      <div className="inline-flex items-center px-6 py-2 mb-4 rounded-full bg-white/60 backdrop-blur-md shadow-[0_4px_12px_rgba(0,0,0,0.03)] text-[#0071e3] font-bold tracking-[0.2em] uppercase text-sm">
                        {activeSlides[currentIdx].chapter}
                      </div>
                      <h1 className="text-6xl font-black tracking-tight text-slate-900 mb-3">
                        {activeSlides[currentIdx].title}
                      </h1>
                      <p className="text-xl text-slate-500 font-thai font-medium">
                        {activeSlides[currentIdx].subtitle}
                      </p>
                    </div>

                    {/* 4 Core ERD Table Schema Cards */}
                    <div className="grid grid-cols-4 gap-8 max-w-[2400px] mx-auto w-full my-auto px-4">
                      {activeSlides[currentIdx].erdTables?.map((table, tIdx) => (
                        <motion.div
                          key={tIdx}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: tIdx * 0.12 + 0.2 }}
                          className="p-7 rounded-[32px] bg-white/60 backdrop-blur-2xl border border-white/80 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.08)] flex flex-col justify-between hover:bg-white/85 transition-all duration-300 min-h-[580px]"
                        >
                          <div>
                            {/* Table Header */}
                            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                              <div className="flex items-center gap-2.5">
                                <div className="p-2 rounded-xl bg-slate-900 text-white shadow-sm">
                                  {table.icon}
                                </div>
                                <span className="text-base font-bold font-mono text-slate-900">
                                  {table.tableName}
                                </span>
                              </div>
                              <span className="text-xs font-black tracking-wider uppercase px-3 py-1 rounded-full bg-slate-100 text-slate-600">
                                {table.badge}
                              </span>
                            </div>

                            {/* Columns List */}
                            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-2 custom-scrollbar">
                              {table.columns.map((col, cIdx) => (
                                <div key={cIdx} className="flex flex-col text-sm py-1.5 border-b border-slate-100/80 last:border-0">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                      {col.isKey && (
                                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300 shrink-0">
                                          PK
                                        </span>
                                      )}
                                      {col.isFk && (
                                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-blue-100 text-blue-800 border border-blue-300 shrink-0">
                                          FK
                                        </span>
                                      )}
                                      <span className="font-mono font-semibold text-slate-800 truncate">
                                        {col.name}
                                      </span>
                                    </div>
                                    <span className="text-xs font-mono text-slate-400 shrink-0">
                                      {col.type}
                                    </span>
                                  </div>
                                  <span className="text-xs text-slate-500 font-thai truncate mt-1">
                                    {col.desc}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {/* ERD Footer */}
                    <div className="max-w-[2400px] mx-auto w-full flex items-center justify-between pt-5 border-t border-slate-200/70">
                      <div className="text-sm text-slate-500 font-thai flex items-center gap-2.5">
                        <Key className="w-5 h-5 text-amber-600" />
                        <span>โครงสร้าง Relational Schema สมบูรณ์แบบด้วย Foreign Keys เชื่อมโยงเคส ไอเทม สเปก Master และเวกเตอร์ RAG</span>
                      </div>
                      <div className="text-sm font-mono font-bold text-slate-400">
                        POSTGRESQL + PGVECTOR EXTENSION
                      </div>
                    </div>
                  </div>
                )}

                {/* Type: CONCLUSION & ROLLOUT ROADMAP + FUTURE SCOPE */}
                {activeSlides[currentIdx].type === "conclusion" && (
                  <div className="w-full h-full flex flex-col justify-between bg-transparent px-20 py-12 text-[#1d1d1f] relative z-10 overflow-hidden">
                    
                    {/* Header */}
                    <div className="text-center max-w-5xl mx-auto mb-3">
                      <div className="inline-flex items-center px-6 py-2 mb-3 rounded-full bg-white/60 backdrop-blur-md shadow-[0_4px_12px_rgba(0,0,0,0.03)] text-[#0071e3] font-bold tracking-[0.2em] uppercase text-xs">
                        {activeSlides[currentIdx].chapter}
                      </div>
                      <h1 className="text-5xl font-black tracking-tight text-slate-900 mb-2">
                        {activeSlides[currentIdx].title}
                      </h1>
                      <p className="text-lg text-slate-500 font-thai font-medium">
                        {activeSlides[currentIdx].subtitle}
                      </p>
                    </div>

                    {/* Main Content Area: 2 Large Full-Width Rows */}
                    <div className="max-w-[2400px] mx-auto w-full flex-1 flex flex-col justify-center gap-6 my-auto px-4">
                      {/* Row 1: 3 Horizontal Roadmap Phase Cards */}
                      <div className="grid grid-cols-3 gap-8 w-full">
                        {activeSlides[currentIdx].roadmapPhases?.map((p, pIdx) => (
                          <motion.div
                            key={pIdx}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: pIdx * 0.12 + 0.2 }}
                            className="relative p-8 rounded-[36px] bg-white/55 backdrop-blur-2xl border border-white/80 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.08)] flex flex-col justify-between group hover:bg-white/85 hover:-translate-y-1.5 transition-all duration-300 min-h-[360px]"
                          >
                            <div>
                              {/* Top Badge & Timeline */}
                              <div className="flex items-center justify-between mb-4">
                                <span className="px-3.5 py-1 rounded-full text-xs font-black tracking-wider bg-slate-900 text-white shadow-xs">
                                  {p.phase}
                                </span>
                                <span className="text-sm font-bold text-slate-500 font-mono">
                                  {p.time}
                                </span>
                              </div>

                              {/* Title with Icon */}
                              <div className="flex items-center gap-3.5 mb-3">
                                <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center shrink-0 border border-slate-100">
                                  {p.icon}
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900 tracking-tight leading-snug">
                                  {p.title}
                                </h3>
                              </div>

                              {/* Bullet points */}
                              <ul className="space-y-2.5 mt-3">
                                {p.points.map((pt, ptIdx) => (
                                  <li key={ptIdx} className="flex items-start gap-2.5 text-sm text-slate-600 font-thai leading-relaxed">
                                    <span className="w-2 h-2 rounded-full bg-blue-500 mt-2 shrink-0" />
                                    <span>{pt}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* Step Connector Line */}
                            {pIdx < 2 && (
                              <div className="hidden lg:block absolute -right-5 top-1/2 -translate-y-1/2 z-20 text-slate-300 pointer-events-none">
                                <ChevronRight size={26} />
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </div>

                      {/* Row 2: Future Scope Section (AI Fine-tuning & SAP ERP) */}
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
                                transition={{ delay: 0.4 + fIdx * 0.1 }}
                                className="p-7 rounded-[32px] bg-gradient-to-r from-purple-50/80 to-blue-50/80 border border-purple-200/70 backdrop-blur-xl flex items-start gap-5 shadow-sm hover:shadow-md transition-all"
                              >
                                <div className="w-13 h-13 rounded-2xl bg-white shadow-sm flex items-center justify-center shrink-0 border border-purple-100">
                                  {item.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-xl font-bold text-slate-900 tracking-tight">
                                      {item.title}
                                    </h4>
                                    <span className="text-xs font-black uppercase text-purple-700 bg-purple-100 px-3 py-1 rounded-full border border-purple-200">
                                      {item.horizon}
                                    </span>
                                  </div>
                                  <p className="text-sm text-slate-600 font-thai leading-relaxed mb-3">
                                    {item.desc}
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    {item.tags.map((tg, tgIdx) => (
                                      <span key={tgIdx} className="text-xs font-mono font-semibold bg-white/90 text-slate-600 px-3 py-1 rounded-lg border border-slate-200/80 shadow-2xs">
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
                    <div className="max-w-[2400px] mx-auto w-full flex items-center justify-between pt-4 border-t border-slate-200/70">
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
                            130+ Automated Tests Passed • Full Cloudinary & Supabase Sync
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <button
                          type="button"
                          onClick={() => setIsQaOpen(true)}
                          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-xl shadow-blue-500/25 flex items-center gap-2.5 cursor-pointer transition-all hover:scale-105 active:scale-95 select-none"
                        >
                          <HelpCircle size={17} />
                          <span>เปิดช่วงถาม-ตอบ (Q&A Session)</span>
                        </button>
                      </div>
                    </div>

                  </div>
                )}

                {/* Type: TOUR (Side-by-side Layout) */}
                {activeSlides[currentIdx].type === "tour" && (
                  <div className="w-full h-full flex items-center bg-transparent px-14 pt-28 pb-12 gap-10 relative z-10 overflow-hidden">
                    {/* Ambient Background for Glassmorphism */}
                    <div className="absolute -top-20 -left-20 w-[650px] h-[650px] bg-gradient-to-br from-blue-400/20 to-cyan-300/20 rounded-full mix-blend-multiply filter blur-[120px] pointer-events-none"></div>
                    <div className="absolute -bottom-20 left-40 w-[550px] h-[550px] bg-gradient-to-tr from-indigo-400/20 to-purple-300/20 rounded-full mix-blend-multiply filter blur-[120px] pointer-events-none"></div>

                    {/* Info Card (Left - Compact Floating Liquid Glass) */}
                    {activeSlides[currentIdx].tourCard && (
                      <motion.div
                        initial={{ opacity: 0, x: -35, scale: 0.96 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        transition={{ type: "spring", stiffness: 240, damping: 24, delay: 0.05 }}
                        className="w-[430px] shrink-0 liquid-glass-card p-10 rounded-[36px] flex flex-col justify-center relative self-center text-[#1d1d1f] overflow-hidden group shadow-2xl will-change-transform"
                      >
                        {/* Liquid Glass Top Specular Glare */}
                        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/90 via-white/30 to-transparent pointer-events-none rounded-t-[36px]"></div>
                        {/* Subtle Corner Light Flare */}
                        <div className="absolute -top-12 -right-12 w-36 h-36 bg-blue-400/25 rounded-full blur-2xl pointer-events-none"></div>

                        <div className="relative z-10 flex flex-col items-start w-full">
                          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 mb-5 rounded-full liquid-glass-pill text-[#0071e3] font-black tracking-[0.18em] uppercase text-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#0071e3] animate-pulse"></span>
                            {activeSlides[currentIdx].chapter}
                          </div>
                          <h2 className="text-[32px] font-black tracking-tight leading-[1.25] mb-5 text-slate-900 drop-shadow-sm">
                            {activeSlides[currentIdx].tourCard?.title}
                          </h2>
                          <div className="text-[17px] text-slate-600 font-thai leading-[1.8] font-normal w-full">
                            {activeSlides[currentIdx].tourCard?.description}
                          </div>

                          {activeSlides[currentIdx].hasSimulation && (
                            <motion.button
                              type="button"
                              whileHover={{ scale: isSimulating ? 1 : 1.02 }}
                              whileTap={{ scale: isSimulating ? 1 : 0.98 }}
                              onClick={handleRunSimulation}
                              disabled={isSimulating}
                              className={`mt-7 w-full py-4 px-6 rounded-2xl font-bold text-[15px] flex items-center justify-center gap-2.5 transition-all duration-300 shadow-xl select-none ${
                                isSimulating
                                  ? 'bg-blue-600/90 text-white cursor-not-allowed shadow-blue-500/25'
                                  : hasSimulated
                                  ? 'bg-slate-900 hover:bg-black text-white shadow-slate-900/25 group cursor-pointer'
                                  : 'bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 hover:from-blue-500 hover:via-blue-600 hover:to-indigo-500 text-white shadow-blue-600/35 group cursor-pointer'
                              }`}
                            >
                              {isSimulating ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                  <span>{activeSlides[currentIdx].simulationLabel?.playing || 'กำลังจำลอง...'}</span>
                                </>
                              ) : hasSimulated ? (
                                <>
                                  <RotateCcw size={17} className="transition-transform duration-300 group-hover:-rotate-90 text-blue-300" />
                                  <span>{activeSlides[currentIdx].simulationLabel?.replay || 'จำลองใหม่อีกครั้ง (Replay Demo)'}</span>
                                </>
                              ) : (
                                <>
                                  <Play size={17} className="fill-white transition-transform duration-300 group-hover:scale-110" />
                                  <span>{activeSlides[currentIdx].simulationLabel?.play || 'เล่นจำลอง (Play Demo)'}</span>
                                </>
                              )}
                            </motion.button>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {/* Mock Container (Right - Fit & Scrollable Mac Window) */}
                    <motion.div
                      initial={{ opacity: 0, y: 25, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ type: "spring", stiffness: 220, damping: 24, delay: 0.1 }}
                      className="flex-1 h-full max-h-[1100px] rounded-[36px] bg-white/35 backdrop-blur-2xl border border-white/70 p-3.5 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.12),inset_0_1px_1px_rgba(255,255,255,0.8)] flex flex-col relative overflow-hidden will-change-transform"
                    >
                      {/* Mac OS Window */}
                      <div className="w-full h-full bg-white rounded-[24px] shadow-lg border border-slate-200/80 flex flex-col overflow-hidden relative">
                        {/* Mac OS Window Header */}
                        <div className="h-11 bg-slate-50/90 border-b border-slate-200/80 flex items-center justify-between px-5 shrink-0 select-none">
                          <div className="flex items-center gap-2">
                            <div className="w-3.5 h-3.5 rounded-full bg-[#FF5F56] border border-black/10"></div>
                            <div className="w-3.5 h-3.5 rounded-full bg-[#FFBD2E] border border-black/10"></div>
                            <div className="w-3.5 h-3.5 rounded-full bg-[#27C93F] border border-black/10"></div>
                            <span className="text-xs font-semibold text-slate-500 font-sans ml-3">QSMS Interactive Demo</span>
                          </div>
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[11px] font-semibold tracking-wide">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Live Interactive Sandbox
                          </div>
                        </div>

                        {/* Content Area with smooth internal scroll */}
                        <div className="flex-1 w-full h-full relative overflow-y-auto overflow-x-hidden bg-slate-50/50 pointer-events-auto flex flex-col">
                          <div className="w-full h-full min-h-full flex-1 flex flex-col">
                            {activeSlides[currentIdx].mockComponent}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                )}

              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Floating Mobile Touch Controls (Bottom Center - Touch Friendly) */}
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[9995] md:hidden flex items-center gap-1.5 p-1.5 rounded-full bg-white/95 backdrop-blur-2xl border border-white/80 shadow-[0_12px_36px_rgba(0,0,0,0.18)] text-slate-800 select-none">
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
          className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 active:scale-90 disabled:opacity-30 disabled:pointer-events-none text-white shadow-sm transition cursor-pointer"
          title="สไลด์ถัดไป"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Floating Zoom Controls (Bottom Left - Desktop) */}
      <div className="fixed bottom-6 left-6 z-[9990] hidden md:flex items-center gap-1.5 p-1.5 rounded-full bg-white/80 backdrop-blur-2xl backdrop-saturate-150 border border-white/80 shadow-[0_10px_30px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.9)] text-slate-800 transition-all select-none">
        <button
          type="button"
          onClick={handleZoomOut}
          disabled={userZoom <= 0.75}
          title="Zoom Out (ย่อขนาด)"
          className="p-2 rounded-full hover:bg-slate-100/90 active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer text-slate-700"
        >
          <ZoomOut size={16} />
        </button>

        <button
          type="button"
          onClick={handleResetZoom}
          title="คลิกเพื่อรีเซ็ตขนาด 100% (Fit Screen)"
          className="px-2.5 py-1 text-xs font-mono font-bold tracking-tight rounded-full hover:bg-slate-100/90 active:scale-95 transition-all cursor-pointer text-slate-800"
        >
          {Math.round(userZoom * 100)}%
        </button>

        <button
          type="button"
          onClick={handleZoomIn}
          disabled={userZoom >= 2.0}
          title="Zoom In (ขยายภาพ)"
          className="p-2 rounded-full hover:bg-slate-100/90 active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer text-slate-700"
        >
          <ZoomIn size={16} />
        </button>

        <div className="w-[1px] h-4 bg-slate-300 mx-0.5" />

        <button
          type="button"
          onClick={handleResetZoom}
          title="Fit to Screen (ปรับขนาดพอดีจอ)"
          className="p-2 rounded-full hover:bg-slate-100/90 active:scale-95 text-slate-600 hover:text-blue-600 transition-all cursor-pointer"
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

      {/* Floating Present / Fullscreen Quick Trigger (Bottom Right - Desktop) */}
      <div className="fixed bottom-6 right-6 z-[9990] hidden md:flex items-center gap-2">
        <button
          type="button"
          onClick={toggleFullscreen}
          className={`px-4 py-2.5 rounded-full backdrop-blur-xl border transition-all flex items-center gap-2 shadow-xl text-xs font-bold cursor-pointer select-none ${
            isFullscreen
              ? 'bg-slate-900/80 text-white border-white/20 hover:bg-black/90'
              : 'bg-white/80 text-slate-800 border-white/60 hover:bg-white shadow-slate-900/10'
          }`}
          title={isFullscreen ? "ออกจากโหมดเต็มจอ (F / Esc)" : "โหมดนำเสนอเต็มจอ Full Screen (กด F)"}
        >
          {isFullscreen ? <Minimize2 size={15} className="text-blue-400" /> : <Maximize2 size={15} className="text-blue-600" />}
          <span>{isFullscreen ? 'Exit Fullscreen' : 'Full Screen (F)'}</span>
        </button>
      </div>

      {/* Q&A Modal for Slide 18 */}
      <AnimatePresence>
        {isQaOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-3xl bg-white rounded-3xl p-8 shadow-2xl border border-slate-200/80 flex flex-col space-y-6 max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
                    <MessageSquare size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Q&A: คำถามและประเด็นสำคัญที่พบบ่อย</h3>
                    <p className="text-xs text-slate-500 font-thai">QSMS Platform Implementation & Operations</p>
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

              {/* FAQs */}
              <div className="space-y-4 font-thai">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span className="text-blue-600 font-black">Q1:</span>
                    <span>ความปลอดภัยของข้อมูลและการจัดการไฟล์ภาพหลักฐานเป็นอย่างไร?</span>
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed pl-6">
                    รูปภาพหลักฐานจะได้รับการบีบอัดฝั่ง Client ให้เหลือขนาด ~300KB เพื่อประหยัด Bandwidth และส่งตรงไปยัง Cloudinary โดยปลอดภัย พร้อมทั้งมี Transaction Integrity ตรวจเช็คว่าหากบันทึกล้มเหลวจะทำ Rollback ทันที
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span className="text-blue-600 font-black">Q2:</span>
                    <span>โมเดล DocAI RAG ใช้ข้อมูลจากที่ใดในการตอบคำถาม?</span>
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed pl-6">
                    DocAI ใช้วิธี Ingestion คู่มือเทคนิค PDF และเอกสารสเปกจริง แปลงเป็นเวกเตอร์ 768 มิติ (Jina AI) เก็บใน Supabase pgvector โดยตอบคำถามเฉพาะข้อเท็จจริงที่มีในเอกสารอ้างอิง พร้อมระบุชื่อไฟล์และเลขหน้าอย่างโปร่งใส
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span className="text-blue-600 font-black">Q3:</span>
                    <span>หากต้องการแก้ไขข้อมูลหรือเปิดเคสใหม่ในสายการผลิต ต้องทำอย่างไร?</span>
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed pl-6">
                    Operator สามารถสแกนหรือพิมพ์รหัสสินค้าผ่านมือถือหรือเว็บ Fast-Track เพื่อให้ระบบ Auto-fill ข้อมูล และสามารถอัปเดตยอด Rework กล่อง/ชิ้น ได้แบบเรียลไทม์ พร้อมระบบ Gap Analysis แจ้งเตือนสเปกที่ยังไม่สมบูรณ์
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <span className="text-xs text-slate-400 font-mono">Thank you for your attention • QSMS Platform Team</span>
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
