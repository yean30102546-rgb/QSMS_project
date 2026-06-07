"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ChevronRight, ChevronLeft, ArrowLeft,
  AlertTriangle, FileText, LayoutGrid, CheckCircle2, TrendingDown,
  Clock, CheckCircle, Database
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";

// Import Mock Components
import { 
  MockPortal, MockOverall, MockUpdateModal, MockAddCase, MockDashboard 
} from "./mocks/MockScreens";

type Slide = {
  id: number;
  type: "title" | "split" | "tour";
  chapter: string;
  title: string;
  subtitle?: string;
  description?: string;
  bullets?: { title: string; desc: string; icon: React.ReactNode }[];
  mockComponent?: React.ReactNode;
  tourCard?: {
    title: string;
    description: string;
    position: string;
  };
};

export function GuideApp({ onBackToPortal }: { onBackToPortal?: () => void }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [scale, setScale] = useState(1);

  const handleResize = useCallback(() => {
    const f = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
    setScale(f);
  }, []);

  useEffect(() => {
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [handleResize]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowRight" || e.key === " ") {
        setCurrentIdx(prev => Math.min(prev + 1, slides.length - 1));
      } else if (e.key === "ArrowLeft") {
        setCurrentIdx(prev => Math.max(prev - 1, 0));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const slides: Slide[] = [
    // 1. Introduction
    {
      id: 1,
      type: "title",
      chapter: "01 / INTRODUCTION",
      title: "QSMS Rework",
      subtitle: "Management System",
      description: "เปลี่ยนระบบการแจ้งซ่อมและประเมินราคางาน Rework ให้เป็นดิจิทัล 100% จัดการข้อมูลอย่างโปร่งใสและตรวจสอบได้",
    },
    // 2. Painpoints
    {
      id: 2,
      type: "split",
      chapter: "02 / THE CHALLENGE",
      title: "Current Painpoints",
      description: "ปัญหาหลักที่พบในการทำงานด้วยระบบแบบดั้งเดิมหรือการใช้ Excel เพียงอย่างเดียว",
      bullets: [
        {
          title: "Operator",
          desc: "บันทึกข้อมูลผ่าน Excel กระจัดกระจาย อัปเดตยากเมื่อข้อมูลเยอะ และระบุสาเหตุปัญหา (เช่น รั่ว) ไม่เชื่อมโยงกันทำให้วิเคราะห์ยาก",
          icon: <AlertTriangle className="w-6 h-6 text-amber-500" />
        },
        {
          title: "Finance",
          desc: "ติดตามงบประมาณการแก้ไขงาน Rework ได้ยาก ขาดการคำนวณต้นทุน/ค่าแรงแบบเรียลไทม์ ทำให้ประเมินสถานการณ์ล่าช้า",
          icon: <FileText className="w-6 h-6 text-red-500" />
        }
      ]
    },
    // 3. Solution
    {
      id: 3,
      type: "split",
      chapter: "03 / THE SOLUTION",
      title: "How QSMS Solves This",
      description: "โซลูชันที่ออกแบบมาเพื่อขจัดปัญหาของ Operator และ Finance อย่างตรงจุด",
      bullets: [
        {
          title: "Real-time Analytics",
          desc: "วิเคราะห์ข้อมูลแบบเรียลไทม์ผ่าน Dashboard ไม่ต้องเขียนสูตร Excel แยก",
          icon: <LayoutGrid className="w-6 h-6 text-[#1d1d1f]" />
        },
        {
          title: "Auto Calculation & Image Viewing",
          desc: "คำนวณต้นทุน/ค่าแรงทันที พร้อมเปิดดูรูปภาพหลักฐานได้ในระบบโดยไม่ต้องทำไฟล์ Excel แยก",
          icon: <CheckCircle2 className="w-6 h-6 text-amber-500" />
        },
        {
          title: "Easy Tracking & Export",
          desc: "ติดตามสถานะงานได้ง่าย และ Export ข้อมูลเป็น PDF/Excel พร้อมภาพประกอบได้ทันที",
          icon: <TrendingDown className="w-6 h-6 text-rose-500" />
        }
      ]
    },
    // 4. Full User Guide (Mocks)
    {
      id: 4,
      type: "tour",
      chapter: "04 / USER GUIDE",
      title: "Portal Entry",
      mockComponent: <MockPortal onNavigate={() => setCurrentIdx(4)} />,
      tourCard: {
        title: "ระบบรวมศูนย์ (Unified Portal)",
        description: "จุดเริ่มต้นสำหรับการเข้าใช้งานทุกโมดูล แบ่งแยกสิทธิ์ชัดเจน",
        position: "bottom-12 right-12 z-50"
      }
    },
    {
      id: 5,
      type: "tour",
      chapter: "04 / USER GUIDE",
      title: "Overall Monitoring",
      mockComponent: <MockOverall onNavigate={() => setCurrentIdx(5)} />,
      tourCard: {
        title: "หน้ารวมรายการ Rework",
        description: "ติดตามเคสทั้งหมด พร้อมแจ้งเตือน SLA สีแดงหากงานค้างนานเกินกำหนด",
        position: "bottom-16 right-16"
      }
    },
    {
      id: 6,
      type: "tour",
      chapter: "04 / USER GUIDE",
      title: "Add New Case",
      mockComponent: <MockAddCase onNavigate={() => setCurrentIdx(6)} />,
      tourCard: {
        title: "หน้าสร้างเคสใหม่ (Add Case)",
        description: "สแกนบาร์โค้ดเพื่อดึงข้อมูลจาก Item Master อัตโนมัติ (ลองพิมพ์ 60001234A)",
        position: "bottom-16 right-16"
      }
    },
    {
      id: 7,
      type: "tour",
      chapter: "04 / USER GUIDE",
      title: "Case Update & Valuation",
      mockComponent: <MockUpdateModal />,
      tourCard: {
        title: "Interactive Update Modal",
        description: "คลิกปุ่ม 'แก้ไขข้อมูล' แล้วกด 'บันทึก' เพื่อดูจำลองการทำงาน คำนวณต้นทุนทันทีโดยไม่ต้องโหลดหน้าใหม่",
        position: "top-8 right-8"
      }
    },
    {
      id: 8,
      type: "tour",
      chapter: "04 / USER GUIDE",
      title: "PTT OR Document Upload",
      mockComponent: <MockAddCase preset="ptt-or" />,
      tourCard: {
        title: "การแนบไฟล์อ้างอิง PTT OR",
        description: "หากเลือกลูกค้าเป็น PTT OR (หรือ OR) ระบบจะเปิดช่องให้แนบไฟล์อ้างอิงขึ้นมาโดยอัตโนมัติ เพื่อป้องกันการตกหล่นของข้อมูล (สูงสุด 2 ไฟล์)",
        position: "bottom-12 right-12"
      }
    },
    {
      id: 9,
      type: "tour",
      chapter: "04 / USER GUIDE",
      title: "Cross-Item Link",
      mockComponent: <MockAddCase preset="cross-link" />,
      tourCard: {
        title: "ระบบความเชื่อมโยงสาเหตุ (Cross-Item Link)",
        description: "หากมีสินค้าเปื้อนในเคสที่มีสินค้ารั่ว ระบบจะเปิดตัวเลือกให้เชื่อมโยงสาเหตุว่าเปื้อนมาจากสินค้ารั่วชิ้นใดทันที ช่วยลดภาระการวิเคราะห์",
        position: "bottom-12 left-12"
      }
    },
    {
      id: 10,
      type: "tour",
      chapter: "04 / USER GUIDE",
      title: "Real-time Dashboard",
      mockComponent: <MockDashboard />,
      tourCard: {
        title: "Friendly Dashboard",
        description: "ดูง่ายกว่า Excel เข้าใจต้นทุนและสถานะได้ในพริบตา ไม่ต้องเขียนสูตรคำนวณ",
        position: "top-1/3 left-1/2 -translate-x-1/2"
      }
    },
    // 5. Benefits
    {
      id: 9,
      type: "split",
      chapter: "05 / BENEFITS",
      title: "Business Impact",
      description: "สิ่งที่องค์กรจะได้รับหลังจากการนำ QSMS ไปใช้งานจริง",
      bullets: [
        {
          title: "ลดเวลาทำงานมหาศาล",
          desc: "ตัดกระบวนการพิมพ์ซ้ำซ้อน การจัดทำรีพอร์ต Excel แบบ Manual",
          icon: <Clock className="w-6 h-6 text-[#1d1d1f]" />
        },
        {
          title: "ข้อมูลโปร่งใส 100%",
          desc: "ตรวจสอบได้ทุกขั้นตอน ใครเป็นคนทำ ค่าแรงเท่าไหร่ วัสดุอะไร",
          icon: <CheckCircle className="w-6 h-6 text-amber-500" />
        },
        {
          title: "นำไปวิเคราะห์ต่อได้ง่าย",
          desc: "ข้อมูลอยู่ในรูปแบบฐานข้อมูลที่มีโครงสร้างมาตรฐาน พร้อมนำไปทำ Data Analytics",
          icon: <Database className="w-6 h-6 text-rose-500" />
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1d1d1f] overflow-hidden font-sans">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-12 py-8 flex justify-between items-center pointer-events-none">
        <div className="flex items-center gap-4 pointer-events-auto">
          {onBackToPortal && (
            <Button variant="ghost" className="rounded-2xl p-2 h-10 w-10 hover:bg-slate-200" onClick={onBackToPortal}>
              <ArrowLeft className="w-6 h-6" />
            </Button>
          )}
          <span className="text-xl font-black tracking-widest uppercase">QSMS Presentation</span>
        </div>
      </nav>

      <div className="deck-viewport relative flex items-center justify-center w-full h-screen bg-slate-200 overflow-hidden">
        <main 
          className="deck-stage relative w-[1920px] h-[1080px] shrink-0 transition-transform duration-500 bg-[#F5F5F7] shadow-2xl rounded-sm overflow-hidden"
          style={{ transform: `scale(${scale})` }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIdx}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0"
            >
              
              {/* Type: TITLE */}
              {slides[currentIdx].type === "title" && (
                <div className="w-full h-full flex flex-col items-center justify-center text-center p-20 bg-white">
                  <span className="text-slate-400 font-bold tracking-[0.3em] uppercase mb-8">{slides[currentIdx].chapter}</span>
                  <h1 className="text-8xl font-black tracking-tighter leading-none mb-4">{slides[currentIdx].title}</h1>
                  <h2 className="text-5xl font-bold text-slate-300 mb-12">{slides[currentIdx].subtitle}</h2>
                  <p className="text-2xl text-slate-500 font-thai max-w-3xl leading-relaxed">{slides[currentIdx].description}</p>
                </div>
              )}

              {/* Type: SPLIT */}
              {slides[currentIdx].type === "split" && (
                <div className="w-full h-full grid grid-cols-2">
                  <div className="bg-black text-white p-24 flex flex-col justify-center">
                    <span className="text-slate-400 font-bold tracking-[0.3em] uppercase mb-8">{slides[currentIdx].chapter}</span>
                    <h2 className="text-7xl font-black tracking-tighter leading-[1.1] mb-8">{slides[currentIdx].title}</h2>
                    <p className="text-2xl text-slate-400 font-thai leading-relaxed">{slides[currentIdx].description}</p>
                  </div>
                  <div className="bg-white p-24 flex flex-col justify-center gap-12">
                    {slides[currentIdx].bullets?.map((b, i) => (
                      <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.15 + 0.3 }}
                        key={i} 
                        className="flex gap-8"
                      >
                        <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shrink-0 border-2 border-[#1d1d1f] shadow-[4px_4px_0_0_#1d1d1f]">
                          {b.icon}
                        </div>
                        <div>
                          <h3 className="text-3xl font-bold mb-3">{b.title}</h3>
                          <p className="text-xl text-slate-500 font-thai leading-relaxed">{b.desc}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Type: TOUR (Full screen mock + Overlay card) */}
              {slides[currentIdx].type === "tour" && (
                <div className="w-full h-full relative bg-slate-200 p-12 pt-28">
                  {/* Mock Container */}
                  <div className="w-full h-full rounded-[32px] overflow-hidden shadow-2xl border-4 border-white/50 relative">
                    {slides[currentIdx].mockComponent}
                  </div>
                  
                  {/* Glassmorphism Spotlight Card */}
                  {slides[currentIdx].tourCard && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5, duration: 0.8 }}
                      className={`absolute ${slides[currentIdx].tourCard?.position} w-[450px] bg-white p-10 rounded-2xl shadow-[8px_8px_0_0_#1d1d1f] border-4 border-[#1d1d1f]`}
                    >
                      <Badge className="bg-amber-400 text-black hover:bg-amber-500 mb-6 px-4 py-1.5 text-xs font-bold tracking-widest border-2 border-black">{slides[currentIdx].chapter}</Badge>
                      <h3 className="text-3xl font-black mb-4 font-thai text-[#1d1d1f]">{slides[currentIdx].tourCard?.title}</h3>
                      <p className="text-lg text-slate-700 font-thai leading-relaxed">{slides[currentIdx].tourCard?.description}</p>
                    </motion.div>
                  )}
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Controls Overlay */}
      <div className="fixed bottom-12 left-1/2 -translate-x-1/2 flex gap-4 bg-white p-4 rounded-3xl border-4 border-[#1d1d1f] shadow-[8px_8px_0_0_#1d1d1f] z-50">
        <Button 
          variant="ghost" 
          className="rounded-2xl w-14 h-14 hover:bg-amber-100 focus-visible:ring-4 focus-visible:ring-amber-400 focus-visible:outline-none disabled:opacity-30"
          onClick={() => setCurrentIdx(prev => Math.max(prev - 1, 0))}
          disabled={currentIdx === 0}
          title="Previous slide (Left Arrow)"
        >
          <ChevronLeft className="w-8 h-8 text-[#1d1d1f]" />
        </Button>
        <div className="px-8 flex items-center font-black text-[#1d1d1f] tracking-widest text-sm">
          {String(currentIdx + 1).padStart(2, '0')} <span className="mx-4 text-amber-500">/</span> {String(slides.length).padStart(2, '0')}
        </div>
        <Button 
          variant="ghost" 
          className="rounded-2xl w-14 h-14 hover:bg-amber-100 focus-visible:ring-4 focus-visible:ring-amber-400 focus-visible:outline-none disabled:opacity-30"
          onClick={() => setCurrentIdx(prev => Math.min(prev + 1, slides.length - 1))}
          disabled={currentIdx === slides.length - 1}
          title="Next slide (Right Arrow or Space)"
        >
          <ChevronRight className="w-8 h-8 text-[#1d1d1f]" />
        </Button>
      </div>
    </div>
  );
}
