"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ChevronRight, 
  ChevronLeft, 
  Play, 
  Settings, 
  Download, 
  Eye, 
  Edit3, 
  Plus, 
  LayoutGrid, 
  Info,
  CheckCircle2,
  Package,
  Clock,
  AlertTriangle,
  FileText,
  Calculator,
  UserCheck,
  ArrowLeft
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/src/components/ui/tabs";
import type { User } from "@/src/services/auth";

// Types
type Slide = {
  id: number;
  chapter: string;
  title: string;
  subtitle: string;
  description: string;
  features: {
    title: string;
    description: string;
    icon: React.ReactNode;
  }[];
  content: React.ReactNode;
};

interface GuideAppProps {
  user: User | null;
  onBackToPortal: () => void;
}

export function GuideApp({ user, onBackToPortal }: GuideAppProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [scale, setScale] = useState(1);
  const [isEditMode, setIsEditMode] = useState(false);

  // Auto-scaling logic (1920x1080 baseline)
  const handleResize = useCallback(() => {
    const f = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
    setScale(f);
  }, []);

  useEffect(() => {
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [handleResize]);

  // Keyboard navigation
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
    {
      id: 1,
      chapter: "Chapter 01",
      title: "Portal Entry.",
      subtitle: "Authentication & RBAC",
      description: "ด่านแรกของการเข้าสู่ระบบด้วยสถาปัตยกรรมความปลอดภัยแบบ RBAC จำลองสิทธิ์ QSMS Admin เพื่อการเข้าถึงข้อมูลที่ปลอดภัย",
      features: [
        {
          title: "Split-Screen Layout",
          description: "แบ่งพื้นที่ระหว่าง Branding และ Authentication Form อย่างชัดเจน เพื่อลด Cognitive Load และเพิ่มความชัดเจน",
          icon: <LayoutGrid className="w-5 h-5" />
        }
      ],
      content: (
        <div className="w-full h-full grid grid-cols-2 overflow-hidden bg-white">
          <div className="bg-[#F5F5F7] p-20 flex flex-col justify-center border-r border-slate-100">
            <div className="w-16 h-16 bg-black rounded-2xl mb-12 shadow-xl" />
            <h2 className="text-7xl font-black tracking-tighter leading-[0.9] mb-8">Workflows<br />Unified.</h2>
            <p className="text-xl text-slate-500 max-w-md font-thai leading-relaxed">แพลตฟอร์มศูนย์กลางสำหรับการจัดการ Rework, Roster และ Analytics ในระบบเดียว</p>
          </div>
          <div className="p-20 flex flex-col justify-center bg-white">
            <h3 className="text-4xl font-bold mb-12 font-thai">Sign in.</h3>
            <div className="space-y-6 max-w-sm">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Username</label>
                <input type="text" className="apple-input w-full p-4" placeholder="QSMS" readOnly />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Password</label>
                <input type="password" className="apple-input w-full p-4" placeholder="••••••••" readOnly />
              </div>
              <Button className="w-full py-7 rounded-2xl bg-black text-white hover:bg-zinc-800 text-lg font-bold font-thai">
                ดำเนินการต่อ <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
            <p className="mt-12 text-sm text-slate-400 font-thai text-center max-w-sm">
              สิทธิ์การเข้าถึงจะถูกกำหนดตาม Profile ที่เลือกในขั้นตอนถัดไป
            </p>
          </div>
        </div>
      )
    },
    {
      id: 2,
      chapter: "Chapter 02",
      title: "Control Matrix.",
      subtitle: "Overall Case Monitoring",
      description: "ศูนย์กลางติดตามงาน Rework ที่จำลองข้อมูลตามรูปแบบจริงของระบบ RT/RW Pattern พร้อมระบบแจ้งเตือนอัตโนมัติ",
      features: [
        {
          title: "Advanced Metadata",
          description: "แสดงรายละเอียดครบถ้วน ทั้งวันที่, เวลา, แหล่งที่มา และสถานะการแนบไฟล์ OR สำหรับแผนกการเงิน",
          icon: <Info className="w-5 h-5" />
        },
        {
          title: "SLA Tracking",
          description: "ระบบคำนวณอายุงานอัตโนมัติ พร้อมสัญลักษณ์แจ้งเตือนงานค้างเกิน 30 วัน เพื่อป้องกันความล่าช้า",
          icon: <Clock className="w-5 h-5" />
        }
      ],
      content: (
        <div className="w-full h-full flex flex-col bg-slate-50">
          <div className="p-12 bg-white border-b border-slate-100">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold font-thai">รายการงาน Rework ทั้งหมด</h2>
              <div className="flex gap-4">
                <Badge variant="outline" className="px-6 py-2 rounded-full border-2 font-bold bg-white">SFC Internal</Badge>
                <Badge className="px-6 py-2 rounded-full bg-black text-white font-bold">ทั้งหมด</Badge>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="relative flex-1">
                <input type="text" className="apple-input w-full pl-12 p-4" placeholder="ค้นหาด้วย Case ID (เช่น RT084-2026...)" />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</div>
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {[
              { id: 'RT084-2026', title: 'เคสส่งคืนจากลูกค้า A', item: 'Power Supply V4 (+2)', date: '2026-05-28', days: 0, status: 'Pending' },
              { id: 'RW112-2026', title: 'ล็อตผลิต SFC Internal', item: 'Logic Board V2', date: '2026-05-20', days: 8, status: 'In Progress' },
              { id: 'RT055-2026', title: 'งานเคลมด่วน-เชียงใหม่', item: 'Cooling Fan Pro X', date: '2026-04-10', days: 48, status: 'Pending', danger: true }
            ].map((c, i) => (
              <Card key={i} className={`border-none shadow-sm hover:shadow-md transition-all cursor-pointer border-l-8 ${c.danger ? 'border-l-red-500' : 'border-l-transparent'}`}>
                <CardContent className="p-6 flex justify-between items-center">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="text-xl font-bold">{c.title}</span>
                      <span className="font-mono text-sm bg-slate-100 px-3 py-1 rounded-md text-slate-500 font-bold">{c.id}</span>
                      {c.danger && <Badge className="bg-red-500 text-white animate-pulse">⚠️ ค้างเกิน 30 วัน</Badge>}
                    </div>
                    <div className="flex items-center gap-4 text-slate-400 text-sm font-thai">
                      <span className="font-bold text-slate-700">{c.item}</span>
                      <span>•</span>
                      <span>📅 {c.date}</span>
                      <span>•</span>
                      <span>{c.days === 0 ? 'วันนี้' : `${c.days} วันที่แล้ว`}</span>
                    </div>
                  </div>
                  <Badge variant="outline" className={`px-6 py-2 rounded-full font-bold text-xs uppercase tracking-wider ${c.status === 'Pending' ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>
                    {c.status}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )
    },
    {
      id: 3,
      chapter: "Chapter 03",
      title: "Case Resolution.",
      subtitle: "Update & Valuation",
      description: "ระบบจัดการรายละเอียดงาน Rework ที่รองรับการคำนวณต้นทุนวัสดุและค่าแรงพนักงาน เพื่อประเมินผลกำไร-ขาดทุนของเคส",
      features: [
        {
          title: "Finance Calculation",
          description: "จำลองการคำนวณ Grand Total อัตโนมัติ (Material + Labor) เพื่อประเมินค่าใช้จ่ายในการ Rework ได้แม่นยำ",
          icon: <Calculator className="w-5 h-5" />
        }
      ],
      content: (
        <div className="w-full h-full flex flex-col bg-slate-50">
          <div className="p-10 bg-white border-b border-slate-100 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-black">RT084-2026</h2>
              <p className="text-sm text-slate-400 font-thai">Management Console • Case Detail</p>
            </div>
            <div className="flex gap-4 items-center">
              <Badge className="bg-amber-500 text-white px-6 py-2 rounded-full font-bold">PENDING</Badge>
              <Button className="bg-black text-white px-8 py-6 rounded-2xl font-thai font-bold">บันทึกข้อมูล</Button>
            </div>
          </div>
          <div className="flex-1 p-10 grid grid-cols-[1fr,350px] gap-8">
            <div className="space-y-8">
              <Card className="rounded-[32px] border-none shadow-sm overflow-hidden">
                <CardContent className="p-10">
                  <div className="flex items-center gap-3 mb-8">
                    <Package className="text-blue-500 w-6 h-6" />
                    <h3 className="font-bold font-thai text-lg">ค่าวัสดุ (Materials)</h3>
                  </div>
                  <div className="grid grid-cols-[1fr,120px,150px] gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Item Name</label>
                      <input type="text" className="apple-input w-full p-4 bg-slate-50" value="บรรจุภัณฑ์ (กล่อง)" readOnly />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Qty</label>
                      <input type="number" className="apple-input w-full p-4" defaultValue={10} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Unit Price</label>
                      <input type="number" className="apple-input w-full p-4" defaultValue={15} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-[32px] border-none shadow-sm overflow-hidden">
                <CardContent className="p-10">
                  <div className="flex items-center gap-3 mb-8">
                    <UserCheck className="text-purple-500 w-6 h-6" />
                    <h3 className="font-bold font-thai text-lg">ค่าแรงพนักงาน (Labor)</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Staff Count</label>
                      <input type="number" className="apple-input w-full p-4" defaultValue={2} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Total Hours</label>
                      <input type="number" className="apple-input w-full p-4" defaultValue={4} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Rate (THB/Hr)</label>
                      <input type="number" className="apple-input w-full p-4" defaultValue={45} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="space-y-8">
              <Card className="rounded-[32px] border-none shadow-sm overflow-hidden bg-black text-white p-10 flex flex-col justify-between h-[300px]">
                <div>
                  <h4 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">Case Valuation</h4>
                  <p className="text-4xl font-black">฿ 510.00</p>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm text-slate-400">
                    <span>Material Total</span>
                    <span className="text-white font-bold">฿ 150.00</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-400">
                    <span>Labor Total</span>
                    <span className="text-white font-bold">฿ 360.00</span>
                  </div>
                </div>
              </Card>
              <Card className="rounded-[32px] border-none shadow-sm overflow-hidden p-10 space-y-6">
                <h4 className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Update Status</h4>
                <div className="grid grid-cols-1 gap-4">
                  <Button variant="outline" className="w-full justify-start py-6 rounded-2xl border-amber-200 bg-amber-50 text-amber-700 font-bold">
                    <Clock className="mr-3 w-5 h-5" /> PENDING
                  </Button>
                  <Button variant="outline" className="w-full justify-start py-6 rounded-2xl border-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 font-bold transition-all">
                    <Play className="mr-3 w-5 h-5" /> IN PROGRESS
                  </Button>
                  <Button variant="outline" className="w-full justify-start py-6 rounded-2xl border-slate-100 hover:bg-green-50 hover:text-green-700 hover:border-green-200 font-bold transition-all">
                    <CheckCircle2 className="mr-3 w-5 h-5" /> COMPLETED
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 4,
      chapter: "Chapter 04",
      title: "New Case Intake.",
      subtitle: "Multi-Item Registration",
      description: "ขั้นตอนการเพิ่มงาน Rework ใหม่ พร้อมระบบ Autofill ที่ดึงข้อมูลจาก Item Master อัตโนมัติเพื่อลดความผิดพลาดในการคีย์ข้อมูล",
      features: [
        {
          title: "Verified Items",
          description: "เพียงกรอก Barcode ระบบจะตรวจสอบความถูกต้องและดึงชื่อสินค้าจากฐานข้อมูล Item Master ทันที",
          icon: <UserCheck className="w-5 h-5" />
        }
      ],
      content: (
        <div className="w-full h-full flex flex-col bg-[#F9F9FB] p-16 overflow-y-auto">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-4xl font-bold font-thai mb-2">บันทึกงาน Rework ใหม่</h2>
              <p className="text-slate-400 font-thai">เพิ่มข้อมูลล็อตสินค้าที่พบคราบหรือความเสียหายจากหน้างาน</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-10 mb-10">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">แหล่งที่มา *</label>
              <select className="apple-input w-full p-4 bg-white"><option>Customer</option><option>SFC</option></select>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">หมายเลขเคส *</label>
              <div className="flex items-center bg-white border border-slate-200 rounded-2xl px-6 py-1">
                <span className="font-black text-blue-500 mr-2">RT</span>
                <input type="text" className="w-16 text-center font-black outline-none py-3" defaultValue="084" />
                <span className="text-slate-300 font-black ml-2">- 2026</span>
              </div>
            </div>
          </div>
          <Card className="rounded-[40px] border-none shadow-sm p-10 relative bg-white">
            <Badge className="absolute right-10 top-10 bg-emerald-50 text-emerald-700 border-emerald-100 font-bold px-4 py-1">✓ พบในระบบ</Badge>
            <h3 className="text-lg font-bold font-thai mb-8">📦 รายการสินค้าที่ 1</h3>
            <div className="grid grid-cols-3 gap-6 mb-8">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400">ชื่อลูกค้า *</label>
                <select className="apple-input w-full p-4 bg-slate-50"><option>OR</option></select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400">บาร์โค้ด</label>
                <input type="text" className="apple-input w-full p-4" defaultValue="60001234A" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400">รหัสสินค้า</label>
                <input type="text" className="apple-input w-full p-4" defaultValue="40001234" />
              </div>
            </div>
            <div className="grid grid-cols-5 gap-4 bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <div className="space-y-1"><label className="text-[8px] font-bold text-slate-400 uppercase">Batch No.</label><input className="apple-input w-full p-2 text-center text-xs" defaultValue="28/05/2026" /></div>
              <div className="space-y-1"><label className="text-[8px] font-bold text-slate-400 uppercase">Box No.</label><input className="apple-input w-full p-2 text-center text-xs" defaultValue="001" /></div>
              <div className="space-y-1"><label className="text-[8px] font-bold text-slate-400 uppercase">Qty</label><input className="apple-input w-full p-2 text-center text-xs font-black" defaultValue="10" /></div>
            </div>
          </Card>
          <Button className="mt-10 py-8 rounded-[28px] bg-black text-white text-xl font-bold font-thai shadow-2xl shadow-black/20">บันทึกรายการหลัก →</Button>
        </div>
      )
    },
    {
      id: 5,
      chapter: "Chapter 05",
      title: "Data Pulse.",
      subtitle: "Dashboard & Analytics",
      description: "ระบบวิเคราะห์ข้อมูลภาพรวม (Visual Insights) ที่ช่วยให้ผู้บริหารตัดสินใจได้แม่นยำขึ้นจากข้อมูล Rework แบบเรียลไทม์",
      features: [
        {
          title: "Visual KPIs",
          description: "แสดงผลข้อมูลผ่านกราฟที่เข้าใจง่าย ทั้งจำนวนเคส, สาเหตุการเกิด Defect และแนวโน้มต้นทุน",
          icon: <LayoutGrid className="w-5 h-5" />
        }
      ],
      content: (
        <div className="w-full h-full flex flex-col bg-slate-50 p-12 overflow-hidden">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-3xl font-bold font-thai">Dashboard Analytics</h2>
            <Tabs defaultValue="units" className="roster-tab-bar">
              <TabsList className="bg-slate-100 p-1 rounded-xl">
                <TabsTrigger value="units" className="px-6 py-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Units</TabsTrigger>
                <TabsTrigger value="defects" className="px-6 py-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Defects</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="grid grid-cols-3 gap-6 mb-8">
            <Card className="rounded-3xl border-none shadow-sm p-8 bg-blue-600 text-white">
              <p className="text-blue-200 text-xs font-bold uppercase tracking-widest mb-2">Total Units</p>
              <h3 className="text-4xl font-black">1,284</h3>
              <p className="text-blue-100 text-xs mt-4">↑ 12% from last month</p>
            </Card>
            <Card className="rounded-3xl border-none shadow-sm p-8 bg-white">
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Avg. Cost / Case</p>
              <h3 className="text-4xl font-black text-slate-800">฿ 452</h3>
              <p className="text-emerald-500 text-xs mt-4">↓ 5% improvement</p>
            </Card>
            <Card className="rounded-3xl border-none shadow-sm p-8 bg-white">
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Pending Items</p>
              <h3 className="text-4xl font-black text-amber-500">42</h3>
              <p className="text-slate-400 text-xs mt-4">Requires immediate action</p>
            </Card>
          </div>
          <div className="grid grid-cols-2 gap-6 flex-1">
            <Card className="rounded-[40px] border-none shadow-sm p-10 bg-white">
              <h4 className="font-bold mb-8 font-thai">สาเหตุการ Rework แยกตามประเภท</h4>
              <div className="space-y-6">
                {[
                  { label: 'คราบสกปรก', value: 45, color: 'bg-blue-500' },
                  { label: 'บรรจุภัณฑ์เสียหาย', value: 30, color: 'bg-purple-500' },
                  { label: 'สินค้าผิดสเปก', value: 15, color: 'bg-amber-500' },
                  { label: 'อื่นๆ', value: 10, color: 'bg-slate-300' }
                ].map((item, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between text-sm font-bold">
                      <span className="font-thai">{item.label}</span>
                      <span>{item.value}%</span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${item.value}%` }}
                        transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
                        className={`h-full ${item.color}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
            <Card className="rounded-[40px] border-none shadow-sm p-10 bg-[#1d1d1f] text-white overflow-hidden relative">
              <div className="relative z-10">
                <h4 className="font-bold mb-2 font-thai">ภาพรวมต้นทุนรายสัปดาห์</h4>
                <p className="text-slate-500 text-xs mb-8">Weekly Cost Comparison</p>
                <div className="flex items-end gap-4 h-40">
                  {[40, 65, 45, 90, 55, 75, 60].map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-3">
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${h}%` }}
                        transition={{ duration: 0.8, delay: 0.8 + i * 0.05 }}
                        className="w-full bg-blue-500 rounded-t-lg"
                      />
                      <span className="text-[10px] font-bold text-slate-600">W{i+1}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 blur-[100px] rounded-full -mr-32 -mt-32" />
            </Card>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1d1d1f] overflow-hidden font-sans">
      {/* Navigation Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-12 py-8 flex justify-between items-center pointer-events-none">
        <div className="flex items-center gap-4 pointer-events-auto">
          <Button variant="ghost" className="rounded-2xl p-2 h-10 w-10 hover:bg-slate-200" onClick={onBackToPortal}>
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-white shadow-lg">
            <LayoutGrid className="w-6 h-6" />
          </div>
          <span className="text-2xl font-black tracking-tighter">QSMS PRO</span>
        </div>

        <div className="flex gap-4 pointer-events-auto">
          <Button 
            variant="outline" 
            className={`rounded-full px-8 py-6 font-bold font-thai border-2 transition-all ${isEditMode ? 'bg-green-500 border-green-600 text-white hover:bg-green-600' : 'bg-white/80 backdrop-blur-md'}`}
            onClick={() => setIsEditMode(!isEditMode)}
          >
            {isEditMode ? <CheckCircle2 className="mr-2 w-5 h-5" /> : <Edit3 className="mr-2 w-5 h-5" />}
            {isEditMode ? "บันทึกข้อมูล" : "เข้าสู่โหมดแก้ไข"}
          </Button>
          <Button variant="outline" className="rounded-full px-8 py-6 font-bold font-thai bg-black text-white hover:bg-zinc-800 transition-all">
            <Download className="mr-2 w-5 h-5" /> ดาวน์โหลด PDF
          </Button>
        </div>
      </nav>

      <div className="deck-viewport relative w-full h-screen">
        <main 
          className="deck-stage absolute left-0 top-0 w-[1920px] h-[1080px] origin-top-left transition-transform duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)]"
          style={{ transform: `scale(${scale})` }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIdx}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40 }}
              transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
              className="absolute inset-0 grid grid-cols-[580px,1fr] p-[120px,80px,80px,80px] gap-20"
              style={{ padding: '120px 80px 80px 80px' }}
            >
              {/* Info Sidebar */}
              <div className="flex flex-col gap-10">
                <div className="space-y-4">
                  <span className="chapter-label text-slate-400 font-bold tracking-[0.2em] uppercase text-sm block">
                    {slides[currentIdx].chapter}
                  </span>
                  <h1 className="text-8xl font-black tracking-tighter leading-[0.9] outline-none" contentEditable={isEditMode}>
                    {slides[currentIdx].title}
                  </h1>
                  <p className="text-2xl text-slate-400 font-medium">{slides[currentIdx].subtitle}</p>
                  <p className="text-xl text-slate-500 leading-relaxed font-thai outline-none" contentEditable={isEditMode}>
                    {slides[currentIdx].description}
                  </p>
                </div>

                <div className="space-y-6">
                  {slides[currentIdx].features.map((f, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + i * 0.1 }}
                      className="bg-[#2B2644] text-white p-10 rounded-[40px] border border-white/5 shadow-2xl hover:scale-[1.03] transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-blue-400">
                          {f.icon}
                        </div>
                        <h3 className="text-xl font-bold outline-none" contentEditable={isEditMode}>{f.title}</h3>
                      </div>
                      <p className="text-slate-400 font-thai leading-relaxed outline-none" contentEditable={isEditMode}>{f.description}</p>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* App Preview Area */}
              <div className="relative bg-white rounded-[60px] shadow-[0_80px_160px_rgba(0,0,0,0.12)] border border-slate-100 overflow-hidden">
                {slides[currentIdx].content}
              </div>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Slide Indicators */}
      <div className="fixed right-12 top-1/2 -translate-y-1/2 flex flex-col gap-6 z-50">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIdx(i)}
            className={`w-3 h-3 rounded-full transition-all duration-500 ${currentIdx === i ? 'bg-black scale-[2] shadow-lg' : 'bg-slate-300 hover:bg-slate-400'}`}
          />
        ))}
      </div>

      {/* Controls Overlay */}
      <div className="fixed bottom-12 left-1/2 -translate-x-1/2 flex gap-4 bg-white/80 backdrop-blur-xl p-4 rounded-3xl border border-slate-200 shadow-2xl z-50">
        <Button 
          variant="ghost" 
          className="rounded-2xl w-14 h-14"
          onClick={() => setCurrentIdx(prev => Math.max(prev - 1, 0))}
          disabled={currentIdx === 0}
        >
          <ChevronLeft className="w-8 h-8" />
        </Button>
        <div className="px-8 flex items-center font-bold text-slate-400 tracking-widest text-sm">
          {String(currentIdx + 1).padStart(2, '0')} <span className="mx-4 text-slate-200">/</span> {String(slides.length).padStart(2, '0')}
        </div>
        <Button 
          variant="ghost" 
          className="rounded-2xl w-14 h-14"
          onClick={() => setCurrentIdx(prev => Math.min(prev + 1, slides.length - 1))}
          disabled={currentIdx === slides.length - 1}
        >
          <ChevronRight className="w-8 h-8" />
        </Button>
      </div>
    </div>
  );
}
