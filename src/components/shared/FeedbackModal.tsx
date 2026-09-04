'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquarePlus, 
  X, 
  Star, 
  Bug, 
  Lightbulb, 
  Send, 
  CheckCircle2, 
  AlertCircle,
  Monitor,
  ChevronDown,
  Check,
  Layers,
  Bot,
  Smartphone,
  RotateCcw,
  LayoutGrid
} from 'lucide-react';
import { getCurrentUser } from '@/src/services/auth';
import type { FeedbackCategory, FeedbackModule, FeedbackSubmission } from '@/src/types/feedback';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeView?: string;
}

const CATEGORIES: { id: FeedbackCategory; label: string; icon: (active: boolean) => React.ReactNode; desc: string }[] = [
  { 
    id: 'rating', 
    label: 'ประเมินการใช้งาน', 
    icon: (active) => <Star className={`w-4 h-4 transition-colors ${active ? 'text-amber-500 fill-amber-500' : 'text-amber-500/80'}`} />, 
    desc: 'ให้คะแนนความพึงพอใจและประสบการณ์ใช้งาน' 
  },
  { 
    id: 'bug_report', 
    label: 'แจ้งปัญหา / บั๊ก', 
    icon: (active) => <Bug className={`w-4 h-4 transition-colors ${active ? 'text-rose-500' : 'text-rose-400'}`} />, 
    desc: 'พบข้อผิดพลาด การคำนวณ หรือการแสดงผลไม่ถูกต้อง' 
  },
  { 
    id: 'feature_request', 
    label: 'เสนอแนะฟีเจอร์', 
    icon: (active) => <Lightbulb className={`w-4 h-4 transition-colors ${active ? 'text-blue-500' : 'text-blue-400'}`} />, 
    desc: 'แนะนำฟังก์ชันใหม่หรือส่วนที่อยากให้เพิ่มเติม' 
  },
  { 
    id: 'general', 
    label: 'ข้อคิดเห็นทั่วไป', 
    icon: (active) => <MessageSquarePlus className={`w-4 h-4 transition-colors ${active ? 'text-slate-700 dark:text-zinc-200' : 'text-slate-400'}`} />, 
    desc: 'ความคิดเห็นและคำแนะนำทั่วไปเกี่ยวกับระบบ' 
  },
];

const MODULES: { id: FeedbackModule; label: string; sub: string; icon: React.ReactNode }[] = [
  { 
    id: 'overall', 
    label: 'ภาพรวมระบบ (Overall Workspace)', 
    sub: 'ความเร็ว ความเสถียร และดีไซน์หน้าตา UI ศูนย์ควบคุม',
    icon: <LayoutGrid className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" /> 
  },
  { 
    id: 'rework_management', 
    label: 'Rework Management Module', 
    sub: 'สร้างเคส, Autofill ข้อมูลสินค้า, อัปเดตงาน, ส่งออก Excel',
    icon: <RotateCcw className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" /> 
  },
  { 
    id: 'drawing_master_ocr', 
    label: 'Drawing & Master OCR Workspace', 
    sub: 'วิเคราะห์สกัดแบบแปลน PDF, Split View 55/45, หมุนมุมมอง',
    icon: <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" /> 
  },
  { 
    id: 'docai_assistant', 
    label: 'DocAI RAG Assistant', 
    sub: 'ถามตอบคู่มือเทคนิค Rework และสืบค้นสถิติย้อนหลัง',
    icon: <Bot className="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0" /> 
  },
  { 
    id: 'ui_performance', 
    label: 'Mobile Experience & Performance', 
    sub: 'การใช้งานบนมือถือ/แท็บเล็ต ขนาดปุ่ม และความลื่นไหล',
    icon: <Smartphone className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" /> 
  },
];

const QUICK_TAGS: Record<FeedbackModule, string[]> = {
  overall: ['ใช้งานง่าย', 'ระบบเร็วดี', 'UI ชัดเจน', 'อยากได้ Dark mode', 'หน้าจอโหลดช้า'],
  rework_management: ['Autofill สะดวก', 'ข้อมูลสูตรสินค้าไม่ตรง', 'อัปโหลดรูปช้า', 'อยากได้ปุ่มลัด', 'ส่งออก Excel สวย'],
  drawing_master_ocr: ['OCR แม่นยำ', 'อ่านตัวเลขผิด', 'หมุน PDF สะดวก', 'สลับหน้าจอเร็ว', 'ต้องการฟิลด์เพิ่ม'],
  docai_assistant: ['ตอบคำถามตรงจุด', 'คู่มือครบถ้วน', 'สถิติเคสแม่นยำ', 'คำตอบยาวเกินไป', 'หาเอกสารไม่เจอ'],
  ui_performance: ['บนมือถือใช้ง่าย', 'ปุ่มกดยากบนมือถือ', 'ฟอนต์เล็กเกินไป', 'ภาพโหลดเร็ว', 'หน้าจอล้นขอบ'],
};

const RATING_LABELS = [
  '',
  'ต้องปรับปรุง (1/5)',
  'พอใช้ (2/5)',
  'ปานกลาง (3/5)',
  'ดีมาก (4/5)',
  'ยอดเยี่ยม (5/5)',
];

export function FeedbackModal({ isOpen, onClose, activeView = 'portal' }: FeedbackModalProps) {
  const [category, setCategory] = useState<FeedbackCategory>('rating');
  const [module, setModule] = useState<FeedbackModule>('overall');
  const [isModuleDropdownOpen, setIsModuleDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync module with active view when opening
  useEffect(() => {
    if (isOpen) {
      setIsSuccess(false);
      setErrorMessage(null);
      setIsModuleDropdownOpen(false);
      if (activeView === 'rework') setModule('rework_management');
      else if (activeView === 'storage') setModule('drawing_master_ocr');
      else if (activeView === 'guide') setModule('overall');
      else setModule('overall');
    }
  }, [isOpen, activeView]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsModuleDropdownOpen(false);
      }
    };
    if (isModuleDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isModuleDropdownOpen]);

  if (!isOpen) return null;

  const currentSelectedModule = MODULES.find(m => m.id === module) || MODULES[0];

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      setErrorMessage('กรุณากรอกข้อความรายละเอียดหรือข้อเสนอแนะ');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const currentUser = getCurrentUser();
    const submission: FeedbackSubmission = {
      category,
      module,
      rating: category === 'rating' ? rating : undefined,
      title: title.trim() || undefined,
      comment: comment.trim(),
      tags: selectedTags,
      userEmail: currentUser?.email || undefined,
      userName: currentUser?.name || undefined,
      userRole: currentUser?.role || 'Guest',
      metadata: {
        screenWidth: typeof window !== 'undefined' ? window.innerWidth : 0,
        screenHeight: typeof window !== 'undefined' ? window.innerHeight : 0,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        url: typeof window !== 'undefined' ? window.location.href : '',
        activeView,
        timestamp: new Date().toISOString(),
      },
    };

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submission),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'ไม่สามารถส่งข้อเสนอแนะได้');
      }

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setTitle('');
        setComment('');
        setSelectedTags([]);
        onClose();
      }, 1800);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9990] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="relative w-full max-w-xl bg-white dark:bg-[#18181b] border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden my-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-zinc-800/80 bg-slate-50/70 dark:bg-zinc-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30">
              <MessageSquarePlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-zinc-100">
                แบบสอบถามและข้อเสนอแนะผู้ใช้งาน
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                QSMS Rework Management & Technical Workspace
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        {isSuccess ? (
          <div className="p-8 text-center flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h4 className="text-lg font-semibold text-slate-900 dark:text-zinc-100">
              ขอบคุณสำหรับข้อเสนอแนะ!
            </h4>
            <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm">
              ข้อมูลของท่านถูกบันทึกเรียบร้อยแล้ว ทีมวิศวกร QSMS จะนำความคิดเห็นนี้ไปพัฒนาและปรับปรุงระบบให้ดียิ่งขึ้น
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
            {/* 1. Category Selector with Animated Liquid Sliding Pill (Animated Segmented Control) */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-zinc-400 mb-2">
                1. ประเภทข้อเสนอแนะ (Category)
              </label>
              
              {/* Liquid Sliding Pill Container */}
              <div className="relative grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1.5 rounded-2xl bg-slate-100/80 dark:bg-zinc-900/90 border border-slate-200/80 dark:border-zinc-800/80 select-none">
                {CATEGORIES.map(cat => {
                  const isSelected = category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`relative z-10 flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-center transition-colors duration-200 ${
                        isSelected
                          ? 'text-slate-900 dark:text-white font-semibold'
                          : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
                      }`}
                    >
                      {/* Spring Liquid Indicator Background */}
                      {isSelected && (
                        <motion.div
                          layoutId="active-feedback-category-liquid-pill"
                          className="absolute inset-0 bg-white dark:bg-zinc-800 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] border border-slate-200/90 dark:border-zinc-700/80 -z-10"
                          transition={{
                            type: 'spring',
                            stiffness: 450,
                            damping: 35,
                            mass: 0.8
                          }}
                        />
                      )}
                      <div className="mb-1">{cat.icon(isSelected)}</div>
                      <span className="text-xs tracking-tight">{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Custom Enterprise Module Dropdown matching QSMS Project Design System */}
            <div ref={dropdownRef} className="relative">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-zinc-400 mb-2">
                2. โมดูล / ส่วนงานที่เกี่ยวข้อง
              </label>
              
              {/* Dropdown Trigger Button */}
              <button
                type="button"
                onClick={() => setIsModuleDropdownOpen(prev => !prev)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border bg-white dark:bg-zinc-900 text-left transition-all duration-200 shadow-xs focus:outline-none ${
                  isModuleDropdownOpen
                    ? 'border-blue-500 ring-2 ring-blue-500/20 dark:ring-blue-400/20'
                    : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700">
                    {currentSelectedModule.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-zinc-100 truncate">
                      {currentSelectedModule.label}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                      {currentSelectedModule.sub}
                    </div>
                  </div>
                </div>

                <div className={`p-1 text-slate-400 transition-transform duration-200 ${isModuleDropdownOpen ? 'rotate-180 text-blue-600' : ''}`}>
                  <ChevronDown className="w-4 h-4" />
                </div>
              </button>

              {/* Animated Dropdown Menu List */}
              <AnimatePresence>
                {isModuleDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.98 }}
                    transition={{ duration: 0.16, ease: 'easeOut' }}
                    className="absolute left-0 right-0 top-full mt-1.5 z-50 p-1.5 bg-white/95 dark:bg-[#1c1c1e]/95 backdrop-blur-xl border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl space-y-1 max-h-64 overflow-y-auto"
                  >
                    {MODULES.map(m => {
                      const isItemActive = module === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            setModule(m.id);
                            setSelectedTags([]);
                            setIsModuleDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all ${
                            isItemActive
                              ? 'bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/30 text-blue-900 dark:text-blue-200'
                              : 'hover:bg-slate-50 dark:hover:bg-zinc-800/60 text-slate-700 dark:text-zinc-300'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 pr-2">
                            <div className="p-1.5 rounded-lg bg-white dark:bg-zinc-800 shadow-xs border border-slate-100 dark:border-zinc-700">
                              {m.icon}
                            </div>
                            <div className="min-w-0">
                              <div className={`text-xs font-semibold ${isItemActive ? 'text-blue-700 dark:text-blue-300' : 'text-slate-900 dark:text-zinc-100'} truncate`}>
                                {m.label}
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                                {m.sub}
                              </div>
                            </div>
                          </div>

                          {isItemActive && (
                            <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Rating Stars (Active when category === 'rating') */}
            {category === 'rating' && (
              <div className="p-3.5 rounded-xl bg-slate-50/90 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800 flex flex-col items-center justify-center gap-1.5">
                <span className="text-xs font-medium text-slate-700 dark:text-zinc-300">
                  ระดับความพึงพอใจโดยรวมสำหรับโมดูลนี้
                </span>
                <div className="flex items-center gap-1.5 my-1">
                  {[1, 2, 3, 4, 5].map(star => {
                    const activeScore = hoverRating || rating;
                    const isFilled = star <= activeScore;
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 rounded-lg hover:scale-110 transition-transform focus:outline-none"
                      >
                        <Star
                          className={`w-6 h-6 transition-colors ${
                            isFilled
                              ? 'text-amber-400 fill-amber-400 drop-shadow-sm'
                              : 'text-slate-300 dark:text-zinc-700'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
                <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                  {RATING_LABELS[hoverRating || rating]}
                </span>
              </div>
            )}

            {/* Quick Tag Pills */}
            {QUICK_TAGS[module] && QUICK_TAGS[module].length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-zinc-400">
                    3. แท็กหัวข้อด่วน (Quick Topics)
                  </label>
                  <span className="text-[11px] text-slate-400 dark:text-zinc-500">
                    เลือกได้มากกว่า 1 ข้อ
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 p-2 rounded-xl bg-slate-50/60 dark:bg-zinc-900/40 border border-slate-200/70 dark:border-zinc-800/70">
                  {QUICK_TAGS[module].map(tag => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <motion.button
                        key={tag}
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => toggleTag(tag)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs transition-all select-none ${
                          isSelected
                            ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-700 dark:text-blue-300 font-semibold shadow-xs ring-2 ring-blue-500/15'
                            : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:border-slate-300 dark:hover:border-zinc-700 hover:bg-slate-50/80 shadow-2xs'
                        }`}
                      >
                        {isSelected ? (
                          <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 stroke-[2.5]" />
                        ) : (
                          <span className="text-slate-400 dark:text-zinc-500 text-xs font-light">+</span>
                        )}
                        <span>{tag}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Title (Optional) */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-zinc-400 mb-1">
                หัวข้อสั้นๆ (ไม่บังคับ)
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="เช่น การคำนวณยอด Progress บนมือถือ, อยากให้เพิ่มสีเตือน"
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            {/* Comment Body */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-zinc-400 mb-1">
                รายละเอียด / สิ่งที่ต้องการให้ปรับปรุง <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                rows={3}
                required
                placeholder="ระบุสิ่งที่พบ ข้อดี ปัญหา หรือข้อเสนอแนะที่ต้องการให้ทีมงานพัฒนา..."
                className="w-full text-xs sm:text-sm p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 resize-none"
              />
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="flex items-center gap-2 p-3 text-xs rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/30 text-rose-700 dark:text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-zinc-800">
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Monitor className="w-3.5 h-3.5" /> บันทึกสถานะหน้าจออัตโนมัติ
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-1.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !comment.trim()}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white shadow-sm transition-all"
                >
                  {isSubmitting ? (
                    'กำลังส่ง...'
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      ส่งข้อเสนอแนะ
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
