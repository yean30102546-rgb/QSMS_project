/**
 * Authentication Login Component
 * Apple-inspired shared entry surface for modular portal flow
 */

'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Eye, EyeOff, Lock, UserCircle2, ChevronLeft } from 'lucide-react';
import { loginWithPassword } from '@/src/services/auth';

export function Login({ 
  onSuccess,
  onBack,
  onNavigateToRegister,
  onNavigateToForgotPassword
}: { 
  onSuccess: (authenticated?: boolean) => void;
  onBack?: () => void;
  onNavigateToRegister?: () => void;
  onNavigateToForgotPassword?: () => void;
}) {
  const handleBack = onBack || (() => {
    window.location.href = '/';
  });

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load remembered username
  React.useEffect(() => {
    const savedUser = localStorage.getItem('remembered_user');
    
    if (savedUser) {
      setUsername(savedUser);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!username.trim()) {
      setError('กรุณาระบุชื่อผู้ใช้งาน');
      return;
    }

    if (!password) {
      setError('กรุณาระบุรหัสผ่าน');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await loginWithPassword(username.trim(), password);

      if (!response.success) {
        setPassword('');
        setError(response.error || 'ไม่สามารถเข้าสู่ระบบได้ กรุณาลองใหม่');
        return;
      }

      // Handle Remember Me — store username only (never password)
      if (rememberMe) {
        localStorage.setItem('remembered_user', username.trim());
      } else {
        localStorage.removeItem('remembered_user');
      }
      localStorage.removeItem('remembered_pass'); // Clean up legacy

      onSuccess(true);
    } catch (err) {
      setPassword('');
      setError(err instanceof Error ? err.message : 'ไม่สามารถเข้าสู่ระบบได้ กรุณาลองใหม่');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full w-full items-center justify-center overflow-y-auto bg-slate-100 px-4 py-8 md:px-8">
      <motion.section
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative z-10 w-full max-w-[920px] overflow-hidden rounded-xl bg-white shadow-xl border border-slate-200"
      >
        <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
          <div className="border-b border-slate-200 bg-slate-900 px-7 py-10 text-white md:px-10 lg:border-b-0 lg:border-r">
            <div className="mb-8 flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-amber-500 flex items-center justify-center text-slate-950 font-black text-sm">
                Q
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">QSMS Central Workspace</div>
            </div>
            <h1 className="max-w-lg text-3xl font-bold leading-tight tracking-tight md:text-4xl text-white">
              Enterprise Operations & Quality Control
            </h1>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-300">
              เข้าสู่ระบบศูนย์กลางเพื่อจัดการเคส Rework, ตรวจสอบแบบแปลน Drawing & Master, และเข้าถึงเครื่องมือทั้งหมดขององค์กร
            </p>
            <div className="mt-8 inline-flex items-center gap-2 rounded-md bg-white/10 px-3 py-1.5 text-xs font-semibold text-amber-400 border border-white/10">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Platform Session Secured</span>
            </div>
          </div>

          <div className="bg-white px-6 py-8 md:px-9 md:py-10">
            <button
              type="button"
              onClick={handleBack}
              className="mb-6 inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
            >
              <ChevronLeft size={14} />
              ย้อนกลับสู่ศูนย์ควบคุม
            </button>

            <div className="mb-6">
              <h2 className="text-xl font-bold tracking-tight text-slate-900">เข้าสู่ระบบ (Sign In)</h2>
              <p className="mt-1 text-xs text-slate-500">
                ใช้บัญชีผู้ใช้งานของท่านเพื่อเข้าสู่ระบบงาน
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">ชื่อผู้ใช้งาน (Username)</label>
                <div className="relative group">
                  <UserCircle2 size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-600 transition-colors" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setError(null);
                    }}
                    placeholder="ระบุชื่อผู้ใช้งาน"
                    className="w-full rounded-md border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 shadow-2xs placeholder-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">รหัสผ่าน (Password)</label>
                <div className="relative group">
                  <Lock size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-600 transition-colors" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError(null);
                    }}
                    placeholder="ระบุรหัสผ่าน"
                    className="w-full rounded-md border border-slate-300 bg-white py-2.5 pl-9 pr-10 text-sm text-slate-900 shadow-2xs placeholder-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="rememberMe"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                  />
                  <label htmlFor="rememberMe" className="text-xs font-medium text-slate-600 cursor-pointer hover:text-slate-900 transition-colors">
                    จดจำชื่อผู้ใช้งาน
                  </label>
                </div>
                {onNavigateToForgotPassword && (
                  <button
                    type="button"
                    onClick={onNavigateToForgotPassword}
                    className="text-xs font-semibold text-amber-700 hover:text-amber-800 transition-colors"
                  >
                    ลืมรหัสผ่าน?
                  </button>
                )}
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700"
                >
                  {error}
                </motion.div>
              )}

              <button
                type="submit"
                disabled={!username.trim() || !password.trim() || isLoading}
                className="mt-2 inline-flex w-full items-center justify-center gap-2 py-2.5 px-4 rounded-md bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 text-sm font-bold shadow-xs transition-all disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950/20 border-t-slate-950" />
                    <span>กำลังเข้าสู่ระบบ...</span>
                  </>
                ) : (
                  <>
                    <span>เข้าสู่ระบบ</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 border-t border-slate-200 pt-4">
              <div className="flex items-start gap-2.5 rounded-md bg-slate-50 border border-slate-200 p-3 text-xs text-slate-600">
                <Lock size={14} className="text-slate-400 mt-0.5 shrink-0" />
                <p className="leading-relaxed text-[11px]">
                  <strong className="text-slate-800 font-semibold block mb-0.5">การจำกัดสิทธิ์การเข้าใช้งาน (Authorized Access Only)</strong>
                  ระบบนี้ไม่อนุญาตให้ลงทะเบียนด้วยตนเอง หากต้องการขอรับสิทธิ์เข้าใช้งานหรือลืมรหัสผ่าน กรุณาติดต่อผู้ดูแลระบบ (System Administrator)
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.section>
    </div>
  );
}

