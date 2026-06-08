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
  MockLogin, MockPortal, MockOverall, MockUpdateModal, MockAddCase, MockDashboard
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
    description: React.ReactNode;
    position: string;
  };
};

export function GuideApp({ onBackToPortal }: { onBackToPortal?: () => void }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [scale, setScale] = useState(1);

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
      title: "Authentication",
      mockComponent: <MockLogin onNavigate={() => setCurrentIdx(5)} />,
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
    {
      id: 5,
      type: "tour",
      chapter: "04 / USER GUIDE",
      title: "Portal Entry",
      mockComponent: <MockPortal onNavigate={() => setCurrentIdx(6)} />,
      tourCard: {
        title: "ระบบรวมศูนย์ (Unified Portal)",
        description: (
          <>
            จุดเริ่มต้นสำหรับการเข้าใช้งานทุกโมดูล<br />
            <br />
            เลือกแอปพลิเคชันที่ต้องการ เช่น Rework หรือ Roster
            ระบบจะกรองสิทธิ์และแสดงเมนูตามบทบาทผู้ใช้โดยอัตโนมัติ
          </>
        ),
        position: "bottom-12 right-12 z-50"
      }
    },
    {
      id: 6,
      type: "tour",
      chapter: "04 / USER GUIDE",
      title: "Overall Monitoring",
      mockComponent: <MockOverall onNavigate={() => setCurrentIdx(7)} />,
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
    {
      id: 7,
      type: "tour",
      chapter: "04 / USER GUIDE",
      title: "Case Initiation & Evidence Integrity",
      mockComponent: <MockAddCase onNavigate={() => setCurrentIdx(8)} preset="with-item" />,
      tourCard: {
        title: "การเปิดเคสแบบ Smart & บังคับหลักฐาน",
        description: (
          <>
            ลดความผิดพลาดในการกรอกข้อมูลด้วยระบบ Auto-fill และมั่นใจได้ด้วยหลักฐานภาพถ่าย<br />
            <br />
            • <b>Auto-fill:</b> เพียงกรอกรหัสสินค้า ระบบจะดึงรายละเอียดจาก Item Master อัตโนมัติ<br />
            <br />
            • <b>Evidence Integrity:</b> บังคับแนบรูปภาพ พร้อมระบบบีบอัดภาพก่อนอัปโหลดเพื่อประหยัด Storage
          </>
        ),
        position: "bottom-12 left-12"
      }
    },
    {
      id: 8,
      type: "tour",
      chapter: "04 / USER GUIDE",
      title: "Smart Features",
      mockComponent: <MockAddCase onNavigate={() => setCurrentIdx(9)} preset="ptt-or" />,
      tourCard: {
        title: "ฟีเจอร์ช่วยเหลืออัจฉริยะ",
        description: (
          <>
            ระบบรองรับเงื่อนไขเฉพาะของลูกค้า เช่นบังคับแนบไฟล์เมื่อเป็น PTT OR<br />
            <br />
            และมีระบบเชื่อมโยงสาเหตุ (Cross-Item Link) ระหว่างไอเทม<br />
            <br />
            ช่วยวิเคราะห์และลดภาระการพิมพ์ข้อมูลซ้ำซ้อน
          </>
        ),
        position: "bottom-12 right-12"
      }
    },
    {
      id: 9,
      type: "tour",
      chapter: "04 / USER GUIDE",
      title: "Updating Case",
      mockComponent: <MockUpdateModal onNavigate={() => setCurrentIdx(10)} />,
      tourCard: {
        title: "ระบบอัปเดตและประเมินราคา",
        description: (
          <>
            แบ่งส่วนการทำงานระหว่าง Operator (อัปเดตวิธีแก้/เวลา) และ Finance (ประเมินราคา/ค่าแรง)<br />
            <br />
            จำลองการทำงาน คำนวณต้นทุนทันทีโดยไม่ต้องโหลดหน้าใหม่
          </>
        ),
        position: "bottom-16 left-16"
      }
    },
    {
      id: 10,
      type: "tour",
      chapter: "04 / USER GUIDE",
      title: "Export & Reporting",
      mockComponent: <MockDashboard onNavigate={() => setCurrentIdx(0)} />,
      tourCard: {
        title: "ส่งออกรายงานแบบมืออาชีพ",
        description: (
          <>
            ดูง่ายกว่า Excel เข้าใจต้นทุนและสถานะได้ในพริบตา ไม่ต้องเขียนสูตรคำนวณให้ยุ่งยาก<br />
            <br />
            • <b>สรุปข้อมูล (Analytics):</b> แสดงภาพรวมเคสทั้งหมด, ต้นทุนเฉลี่ย และอัตราความสำเร็จ<br />
            • <b>รายงานกราฟ:</b> ช่วยให้เห็นแนวโน้ม (Trends) ของปัญหาที่เกิดขึ้นในแต่ละช่วงเวลาได้อย่างชัดเจน<br />
            • <b>Export to Excel:</b> รองรับการส่งออกตารางสรุปข้อมูล<b>
              <b>พร้อมฝังรูปภาพหลักฐานลงในไฟล์ Excel โดยตรง</b></b>
            <br />

            เพื่อนำไปใช้รายงานต่อผู้บริหารได้ทันที
            <br />
            <br />

          </>


        ),
        position: "bottom-12 right-12"
      }
    },
    // 5. Benefits
    {
      id: 11,
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
    <div className="min-h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-12 py-8 flex justify-between items-center pointer-events-none">
        <div className="flex items-center gap-4 pointer-events-auto">
          {onBackToPortal && (
            <Button variant="ghost" className="rounded-full p-2 h-10 w-10 bg-white/80 backdrop-blur-md shadow-sm border border-white hover:bg-white" onClick={onBackToPortal}>
              <ArrowLeft className="w-5 h-5 text-slate-700" />
            </Button>
          )}
          <span className="text-sm font-bold tracking-[0.2em] uppercase text-slate-500 bg-white/80 backdrop-blur-md px-4 py-2 rounded-full border border-white shadow-sm">QSMS Presentation</span>
        </div>
      </nav>

      <div className="deck-viewport relative flex items-center justify-center w-full h-screen bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
        <main
          className="deck-stage relative shrink-0 transition-transform duration-500 bg-slate-50 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] rounded-2xl overflow-hidden border border-white"
          style={{ width: '2560px', height: '1440px', transform: `scale(${scale})` }}
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
                <div className="w-full h-full flex flex-col items-center justify-center text-center p-20 bg-gradient-to-br from-blue-50/50 via-white to-emerald-50/50 relative overflow-hidden">
                  <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-blue-400/10 blur-[120px] rounded-full pointer-events-none" />
                  <div className="absolute bottom-[-20%] right-[-10%] w-[800px] h-[800px] bg-emerald-400/10 blur-[120px] rounded-full pointer-events-none" />
                  <span className="text-blue-600 font-bold tracking-[0.3em] uppercase mb-8 px-6 py-2 bg-blue-100/50 backdrop-blur-sm rounded-full text-sm border border-blue-200/50">{slides[currentIdx].chapter}</span>
                  <h1 className="text-8xl font-black tracking-tight leading-none mb-6 text-slate-900 drop-shadow-sm">{slides[currentIdx].title}</h1>
                  <h2 className="text-5xl font-bold text-slate-400 mb-12">{slides[currentIdx].subtitle}</h2>
                  <p className="text-2xl text-slate-600 font-thai max-w-3xl leading-relaxed">{slides[currentIdx].description}</p>
                </div>
              )}

              {/* Type: SPLIT */}
              {slides[currentIdx].type === "split" && (
                <div className="w-full h-full grid grid-cols-2 bg-slate-50 relative overflow-hidden">
                  <div className="absolute top-0 right-1/2 w-[800px] h-[800px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />
                  <div className="p-24 flex flex-col justify-center relative z-10">
                    <span className="text-blue-600 font-bold tracking-[0.3em] uppercase mb-8">{slides[currentIdx].chapter}</span>
                    <h2 className="text-7xl font-black tracking-tight leading-[1.1] mb-8 text-slate-900">{slides[currentIdx].title}</h2>
                    <p className="text-2xl text-slate-600 font-thai leading-relaxed">{slides[currentIdx].description}</p>
                  </div>
                  <div className="bg-white p-24 flex flex-col justify-center gap-12 shadow-[-20px_0_40px_-10px_rgba(0,0,0,0.05)] relative z-10">
                    {slides[currentIdx].bullets?.map((b, i) => (
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.15 + 0.3 }}
                        key={i}
                        className="flex gap-8 items-start group"
                      >
                        <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100 shadow-sm text-slate-700 group-hover:scale-110 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-100 transition-all duration-300">
                          {b.icon}
                        </div>
                        <div>
                          <h3 className="text-3xl font-bold mb-3 text-slate-800">{b.title}</h3>
                          <p className="text-xl text-slate-500 font-thai leading-relaxed">{b.desc}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Type: TOUR (Side-by-side Layout) */}
              {slides[currentIdx].type === "tour" && (
                <div className="w-full h-full flex bg-slate-50/50 p-16 pt-40 gap-16 overflow-hidden relative">
                  <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-blue-400/10 blur-[120px] rounded-full pointer-events-none" />

                  {/* Info Card (Left) */}
                  {slides[currentIdx].tourCard && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3, duration: 0.6 }}
                      className="w-[450px] shrink-0 bg-white/80 backdrop-blur-xl p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white flex flex-col justify-center relative z-10"
                    >
                      <span className="text-blue-600 font-bold tracking-[0.3em] uppercase mb-5 text-sm">{slides[currentIdx].chapter}</span>
                      <h2 className="text-4xl font-black tracking-tight leading-[1.1] mb-5 text-slate-900">{slides[currentIdx].tourCard?.title}</h2>
                      <div className="text-[20px] text-slate-600 font-thai leading-relaxed">{slides[currentIdx].tourCard?.description}</div>
                    </motion.div>
                  )}

                  {/* Mock Container (Right) */}
                  <div className="flex-1 h-full rounded-[32px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white relative bg-slate-100/80 z-10 flex items-center justify-center p-8">
                    {/* Flexible Mock Window */}
                    <div className="w-full h-full max-w-[1400px] bg-white rounded-2xl shadow-2xl border border-slate-300 overflow-hidden relative flex flex-col pointer-events-auto">
                      {/* Mac OS Window Header */}
                      <div className="h-10 bg-slate-100 border-b border-slate-200 flex items-center px-4 gap-2 shrink-0">
                        <div className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E]"></div>
                        <div className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]"></div>
                        <div className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29]"></div>
                      </div>

                      {/* Content Area */}
                      <div className="flex-1 w-full h-full relative overflow-y-auto bg-white pointer-events-auto">
                        {/* Wrapper with min-width to force desktop layout */}
                        <div className="min-w-[900px] w-full h-full">
                          {slides[currentIdx].mockComponent}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </main>
      </div>


    </div>
  );
}
