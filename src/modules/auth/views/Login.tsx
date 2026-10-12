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
    <div className="relative min-h-full w-full flex items-center justify-center overflow-y-auto bg-slate-100/80 px-4 py-8 md:px-8">
      {/* Ambient background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:20px_20px] opacity-40 pointer-events-none" />
      <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-slate-300/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full bg-slate-300/30 blur-3xl pointer-events-none" />

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-[460px] sm:max-w-[480px] overflow-hidden rounded-3xl bg-white p-7 sm:p-9 shadow-[0_20px_60px_-15px_rgba(15,23,42,0.12),0_1px_3px_rgba(0,0,0,0.04)] border border-slate-200/90"
      >
        {/* Top Header: Back Button & System Version */}
        <div className="flex items-center justify-between mb-6">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/90 bg-slate-50/80 px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
          >
            <ChevronLeft size={14} />
            <span>ย้อนกลับสู่ศูนย์ควบคุม</span>
          </button>
          <span className="font-mono text-[11px] text-slate-400">v2.6 Enterprise</span>
        </div>

        {/* Center Branding & Title */}
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3.5 flex items-center justify-center rounded-2xl bg-slate-50 p-2 shadow-2xs border border-slate-200/80">
            <img
              src="/img/sfc-logo.png"
              alt="SFC Excellence"
              className="h-8 w-auto object-contain"
            />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            เข้าสู่ระบบ
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            กรอกบัญชีผู้ใช้งานเพื่อเข้าสู่ระบบงาน QSMS
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              ชื่อผู้ใช้งาน (Username)
            </label>
            <div className="relative group">
              <UserCircle2
                size={17}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-slate-900"
              />
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError(null);
                }}
                placeholder="ระบุชื่อผู้ใช้งาน"
                autoComplete="username"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-3.5 text-sm text-slate-900 transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-slate-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-slate-900/10"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              รหัสผ่าน (Password)
            </label>
            <div className="relative group">
              <Lock
                size={17}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-slate-900"
              />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                placeholder="ระบุรหัสผ่าน"
                autoComplete="current-password"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-11 text-sm text-slate-900 transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-slate-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-slate-900/10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
              />
              <span className="text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors">
                จดจำชื่อผู้ใช้งาน
              </span>
            </label>

            {onNavigateToForgotPassword && (
              <button
                type="button"
                onClick={onNavigateToForgotPassword}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              >
                ลืมรหัสผ่าน?
              </button>
            )}
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-red-200 bg-red-50/90 px-3.5 py-2.5 text-xs font-semibold text-red-700"
            >
              {error}
            </motion.div>
          )}

          <button
            type="submit"
            disabled={!username.trim() || !password.trim() || isLoading}
            className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-slate-950 py-3 px-4 text-sm font-semibold text-white shadow-xs transition-all hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.99] cursor-pointer"
          >
            {isLoading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                <span>กำลังเข้าสู่ระบบ...</span>
              </>
            ) : (
              <>
                <span>เข้าสู่ระบบ</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Bottom Security Notice */}
        <div className="mt-8 border-t border-slate-100 pt-4">
          <div className="flex items-start gap-3 rounded-xl bg-slate-50/80 border border-slate-200/80 p-3 text-xs text-slate-600">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700 border border-slate-200 mt-0.5">
              <Lock size={13} />
            </div>
            <div>
              <strong className="block text-xs font-bold text-slate-800 mb-0.5">
                การจำกัดสิทธิ์การเข้าใช้งาน (Authorized Access Only)
              </strong>
              <p className="text-[11px] leading-relaxed text-slate-500">
                ระบบนี้ไม่อนุญาตให้ลงทะเบียนด้วยตนเอง หากต้องการขอรับสิทธิ์เข้าใช้งานหรือลืมรหัสผ่าน กรุณาติดต่อผู้ดูแลระบบ (System Administrator)
              </p>
            </div>
          </div>
        </div>
      </motion.section>
    </div>
  );
}

