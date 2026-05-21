/**
 * Authentication Login Component
 * Apple-inspired shared entry surface for modular portal flow
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Eye, EyeOff, Lock, UserCircle2 } from 'lucide-react';
import { loginWithPassword } from '../services/auth';

export function Login({ onSuccess }: { onSuccess: (authenticated?: boolean) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!username.trim()) {
      setError('กรุณาระบุชื่อผู้ใช้งาน');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await loginWithPassword(username.trim().toUpperCase(), password);

      if (!response.success) {
        setPassword('');
        setError(response.error || 'ไม่สามารถเข้าสู่ระบบได้ กรุณาลองใหม่');
        return;
      }

      onSuccess(true);
    } catch (err) {
      setPassword('');
      setError(err instanceof Error ? err.message : 'ไม่สามารถเข้าสู่ระบบได้ กรุณาลองใหม่');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="apple-shell flex min-h-screen items-center justify-center overflow-y-auto bg-gradient-to-br from-[#F0F7FF] via-[#FFFFFF] to-[#F5F9FF] px-4 py-8 md:px-8">
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute -left-24 top-12 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(0,102,204,0.1),transparent_70%)]" />
        <div className="absolute -right-24 bottom-6 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(61,89,124,0.1),transparent_70%)]" />
      </div>

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-[980px] overflow-hidden rounded-[36px] bg-white/30 backdrop-blur-md shadow-2xl shadow-blue-900/5 border border-white/40"
      >
        <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
          <div className="glass-panel px-7 py-10 text-[#1d1d1f] md:px-10 lg:border-0 lg:border-r lg:border-r-black/5">
            <div className="mb-8 flex items-center gap-3">
              <img src="/img/logo.png" alt="QSMS" className="h-10 object-contain" />
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-600/80">Central Workspace</div>
            </div>
            <h1 className="max-w-lg text-4xl font-semibold leading-[1.04] tracking-[-0.03em] md:text-5xl text-[#1d1d1f]">
              One login for Rework and upcoming Roster operations.
            </h1>
            <p className="mt-5 max-w-md text-[16px] leading-7 text-[#515154]">
              เข้าสู่ระบบครั้งเดียว แล้วเลือกใช้งานแต่ละ webapp ผ่าน Central Control ได้ทันที
              โดยรักษา workflow เดิมของ Rework ให้ทำงานต่อเนื่อง
            </p>
            <div className="mt-8 inline-flex items-center gap-2 rounded-full bg-blue-600/5 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-700/70">
              Platform session secured
            </div>
          </div>

          <div className="bg-white/80 px-6 py-8 md:px-9 md:py-10">
            <div className="mb-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6e6e73]">Sign in</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.02em] text-[#1d1d1f]">เข้าสู่ Central Control</h2>
              <p className="mt-2 text-sm leading-6 text-[#5d5d63]">
                ใช้ profile และ password เดิมของระบบเพื่อเข้าสู่ Portal
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative group">
                <UserCircle2 size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#7a7a80] group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setError(null);
                  }}
                  placeholder="Username"
                  className="glass-input w-full rounded-2xl py-3.5 pl-11 pr-4 text-[15px]"
                />
              </div>

              <div className="relative group">
                <Lock size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#7a7a80] group-focus-within:text-blue-500 transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  placeholder="Password"
                  className="glass-input w-full rounded-2xl py-3.5 pl-11 pr-11 text-[15px]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#7a7a80] transition hover:text-[#1d1d1f]"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>

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
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={!username.trim() || !password.trim() || isLoading}
                className="apple-btn-primary mt-1 inline-flex w-full items-center justify-center gap-2 py-3.5 text-sm font-semibold shadow-lg shadow-blue-600/20 disabled:cursor-not-allowed disabled:opacity-55"
              >
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/25 border-t-white" />
                    Processing...
                  </>
                ) : (
                  <>
                    เข้าสู่ระบบ
                    <ArrowRight size={16} />
                  </>
                )}
              </motion.button>
            </form>

            <div className="mt-7 border-t border-[#e8e8ed] pt-5 text-xs leading-5 text-[#6e6e73]">
              <p>ตัวอย่าง profile: `QSMS`, `PDB`, `OPERATOR`, `FINANCE`</p>
              <p className="mt-1">หากต้องการแก้บัญชี ให้ปรับค่าใน Google Apps Script Properties</p>
            </div>
          </div>
        </div>
      </motion.section>
    </div>
  );
}
