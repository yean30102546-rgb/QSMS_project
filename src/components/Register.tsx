'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Eye, EyeOff, Lock, UserCircle2, ChevronLeft, User, ShieldCheck } from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';
import type { Variants } from 'motion/react';

// Define Framer Motion variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, ease: [0.22, 1, 0.36, 1], delayChildren: 0.1 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 120, damping: 14 } }
};

export function Register({ 
  onSuccess,
  onBack
}: { 
  onSuccess: (authenticated?: boolean) => void;
  onBack?: () => void;
}) {
  const handleBack = onBack || (() => {
    window.location.href = '/';
  });

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useNotification();

  // Password strength validation
  const passwordChecks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };
  const passwordStrength = Object.values(passwordChecks).filter(Boolean).length;
  const isPasswordValid = passwordStrength === 4;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!username.trim() || !password.trim() || !name.trim()) {
      setError('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password,
          name: name.trim()
        })
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.error || 'ไม่สามารถสร้างบัญชีได้');
        return;
      }

      showToast('สร้างบัญชีสำเร็จ กรุณาเข้าสู่ระบบด้วยบัญชีใหม่ของคุณ', 'success');
      if (onBack) {
        onBack();
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'ไม่สามารถสร้างบัญชีได้ กรุณาลองใหม่');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="apple-shell flex min-h-screen items-center justify-center overflow-y-auto bg-gradient-to-br from-[#F5F5F7] via-[#FFFFFF] to-[#E8E8ED] px-4 py-8 md:px-8">
      <div className="pointer-events-none absolute inset-0 opacity-30">
        <div className="absolute -left-24 top-12 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(0,0,0,0.05),transparent_70%)]" />
        <div className="absolute -right-24 bottom-6 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(0,0,0,0.04),transparent_70%)]" />
      </div>

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-[980px] overflow-hidden rounded-[36px] bg-white/30 backdrop-blur-md shadow-2xl shadow-blue-900/5 border border-white/40"
      >
        <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
          <div className="flex flex-col justify-between border-b border-white/60 bg-white/40 backdrop-blur-xl px-7 py-10 text-[#1d1d1f] md:px-10 lg:border-b-0 lg:border-r lg:border-r-black/5">
            <div>
              <div className="mb-8 flex items-center gap-3">
                <img src="/img/logo.png" alt="QSMS" className="h-10 object-contain" />
                <div className="text-xs font-bold uppercase tracking-[0.22em] text-[#1d1d1f]/70">Central Workspace</div>
              </div>
              <h1 className="max-w-lg text-4xl font-semibold leading-[1.04] tracking-[-0.03em] md:text-5xl text-[#1d1d1f]">
                Create an account for personal tracking.
              </h1>
              <p className="mt-5 max-w-md text-[16px] leading-7 text-[#515154]">
                ลงทะเบียนบัญชีใหม่ของคุณเพื่อเข้าสู่ระบบ ด้วยบัญชีส่วนบุคคล การทำรายการทุกขั้นตอนจะถูกระบุชื่อเพื่อการตรวจสอบย้อนหลังที่โปร่งใสและแม่นยำ
              </p>
            </div>
            
            <div className="mt-12 flex items-center gap-2 rounded-2xl bg-black/5 px-4 py-3 shadow-inner shadow-black/5 backdrop-blur-sm w-fit">
              <ShieldCheck size={16} className="text-blue-600" />
              <span className="text-[13px] font-medium text-[#1d1d1f]/80">Personal accountability</span>
            </div>
          </div>

          <div className="bg-white/80 px-6 py-8 md:px-9 md:py-10">
            <button
              type="button"
              onClick={handleBack}
              className="mb-6 inline-flex items-center gap-1 text-xs font-semibold text-[#6e6e73] hover:text-[#1d1d1f] transition-colors"
            >
              <ChevronLeft size={14} />
              ย้อนกลับสู่หน้าเข้าสู่ระบบ
            </button>

            <div className="mb-8">
              <h2 className="text-3xl font-semibold tracking-[-0.02em] text-[#1d1d1f]">สร้างบัญชีใหม่</h2>
              <p className="mt-2 text-sm leading-6 text-[#5d5d63]">
                กรอกข้อมูลส่วนตัวเพื่อเริ่มต้นใช้งานระบบ
              </p>
            </div>

            <motion.form 
              variants={containerVariants}
              initial="hidden"
              animate="show"
              onSubmit={handleSubmit} 
              className="space-y-4"
            >
              <motion.div variants={itemVariants} className="relative group">
                <UserCircle2 size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#7a7a80] group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setError(null);
                  }}
                  placeholder="Username (สำหรับใช้ล็อกอิน)"
                  className="glass-input w-full rounded-2xl py-3.5 pl-11 pr-4 text-[15px]"
                />
              </motion.div>

              <motion.div variants={itemVariants} className="relative group">
                <User size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#7a7a80] group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setError(null);
                  }}
                  placeholder="ชื่อ-นามสกุลจริง"
                  className="glass-input w-full rounded-2xl py-3.5 pl-11 pr-4 text-[15px]"
                />
              </motion.div>

              <motion.div variants={itemVariants} className="relative group">
                <Lock size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#7a7a80] group-focus-within:text-blue-500 transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  placeholder="รหัสผ่าน"
                  className="glass-input w-full rounded-2xl py-3.5 pl-11 pr-11 text-[15px]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#7a7a80] transition hover:text-[#1d1d1f]"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </motion.div>

              {/* Password strength indicator */}
              {password.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-2 rounded-2xl border border-[#e8e8ed] bg-[#fafafa] px-4 py-3"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1 flex-1">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded-full transition-colors ${
                            passwordStrength >= level
                              ? passwordStrength <= 1 ? 'bg-red-400'
                              : passwordStrength <= 2 ? 'bg-orange-400'
                              : passwordStrength <= 3 ? 'bg-yellow-400'
                              : 'bg-green-500'
                              : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                    <span className={`text-[11px] font-medium ${
                      passwordStrength <= 1 ? 'text-red-500'
                      : passwordStrength <= 2 ? 'text-orange-500'
                      : passwordStrength <= 3 ? 'text-yellow-600'
                      : 'text-green-600'
                    }`}>
                      {passwordStrength <= 1 ? 'อ่อนมาก' : passwordStrength <= 2 ? 'ปานกลาง' : passwordStrength <= 3 ? 'ดี' : 'แข็งแรง'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                    <span className={passwordChecks.length ? 'text-green-600' : 'text-[#9e9ea0]'}>
                      {passwordChecks.length ? '✓' : '•'} 8 ตัวขึ้นไป
                    </span>
                    <span className={passwordChecks.uppercase ? 'text-green-600' : 'text-[#9e9ea0]'}>
                      {passwordChecks.uppercase ? '✓' : '•'} พิมพ์ใหญ่ (A-Z)
                    </span>
                    <span className={passwordChecks.number ? 'text-green-600' : 'text-[#9e9ea0]'}>
                      {passwordChecks.number ? '✓' : '•'} ตัวเลข (0-9)
                    </span>
                    <span className={passwordChecks.special ? 'text-green-600' : 'text-[#9e9ea0]'}>
                      {passwordChecks.special ? '✓' : '•'} อักขระพิเศษ (!@#$)
                    </span>
                  </div>
                </motion.div>
              )}

              {/* Role info badge */}
              <motion.div variants={itemVariants} className="rounded-2xl border border-[#e8e8ed] bg-[#f5f5f7] px-4 py-3">
                <p className="text-xs text-[#6e6e73]">
                  <ShieldCheck size={13} className="inline-block mr-1 text-blue-500 -mt-0.5" />
                  บัญชีใหม่จะได้รับสิทธิ์ <strong className="text-[#1d1d1f]">Operator</strong> โดยอัตโนมัติ หากต้องการสิทธิ์อื่น กรุณาติดต่อผู้ดูแลระบบ
                </p>
              </motion.div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-[#ffd4d4] bg-[#fff6f6] px-4 py-3 text-sm text-[#b42318]"
                >
                  {error}
                </motion.div>
              )}

              <motion.button
                variants={itemVariants}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={!username.trim() || !password.trim() || !name.trim() || !isPasswordValid || isLoading}
                className="apple-btn-primary mt-3 inline-flex w-full items-center justify-center gap-2 py-3.5 text-sm font-semibold shadow-lg shadow-blue-600/20 disabled:cursor-not-allowed disabled:opacity-55"
              >
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/25 border-t-white" />
                    Processing...
                  </>
                ) : (
                  <>
                    ยืนยันสร้างบัญชี
                    <ArrowRight size={16} />
                  </>
                )}
              </motion.button>
            </motion.form>
          </div>
        </div>
      </motion.section>
    </div>
  );
}
