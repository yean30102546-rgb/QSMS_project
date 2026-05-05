/**
 * Authentication Login Component - Modern SFC Excellence Design
 * Supports user-specific PIN credentials with beautiful UI
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Lock, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { loginWithPassword } from '../services/auth';

export function Login({ onSuccess }: { onSuccess: (authenticated?: boolean) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showpassword, setShowPassword] = useState(false);
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
    <div className="flex h-screen w-screen bg-[#FDF8F6] font-sans overflow-hidden text-[#1C1917]" style={{ height: '100dvh' }}>
      <div className="hidden lg:flex flex-[0.8] bg-gradient-to-br from-slate-50 to-slate-100 border-r border-slate-200 flex-col p-8 lg:p-12 relative overflow-hidden">
        <motion.div
          className="absolute -top-32 -right-32 w-80 h-80 rounded-full opacity-10"
          animate={{ y: [0, 20, 0], x: [0, -20, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          style={{ background: 'radial-gradient(circle, rgba(14, 165, 233, 0.25), transparent 70%)' }}
        />
        <motion.div
          className="absolute -bottom-32 -left-28 w-72 h-72 rounded-full opacity-10"
          animate={{ y: [0, -20, 0], x: [0, 20, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
          style={{ background: 'radial-gradient(circle, rgba(14, 165, 233, 0.18), transparent 70%)' }}
        />

        <div className="mb-12">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center text-white font-black text-lg">
            SFC
          </div>
        </div>

        <div className="mt-auto mb-auto max-w-md">
          <h1 className="text-6xl font-black leading-tight mb-4 text-slate-900">
            QSMS<br />
            <span className="text-slate-400">Rework</span>
          </h1>
          <p className="text-base text-slate-600 font-medium leading-relaxed max-w-sm">
            ระบบจัดการงาน rework พร้อมการเชื่อมต่อ Google Sheets แบบเรียบง่าย
          </p>
        </div>

        <div className="mt-auto">
          <div className="inline-flex items-center gap-3 px-5 py-3 bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/40 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">System Status</span>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-bold text-slate-900">OPERATIONAL</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center relative px-4 sm:px-6 w-full overflow-y-auto">
        <motion.div
          className="w-full max-w-[520px] my-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black mb-3 tracking-tight text-slate-900">เข้าสู่ระบบ</h2>
            <p className="text-slate-600 font-medium">กรอกชื่อผู้ใช้งานและ PIN เพื่อเริ่มงานได้ทันที</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <label className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 ml-1">ชื่อผู้ใช้งาน</label>
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError(null);
                }}
                placeholder="Enter Username"
                className="w-full px-5 py-4 bg-slate-100/50 border border-transparent rounded-2xl focus:border-slate-300 focus:bg-white outline-none transition font-sans"
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 ml-1">Password</label>
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors">
                  <Lock size={20} />
                </div>
                <input
                  type={showpassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  placeholder="Enter Password"
                  className="w-full pl-14 pr-14 py-4 bg-slate-100/50 border border-transparent focus:bg-white focus:border-slate-300 rounded-2xl outline-none transition-all font-sans text-lg placeholder:text-slate-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showpassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showpassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </motion.div>
            )}

            <motion.button
              type="submit"
              disabled={!username.trim() || !password.trim() || isLoading}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-base flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-800 shadow-xl shadow-slate-200"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  เข้าสู่ระบบ
                  <ChevronRight size={20} />
                </>
              )}
            </motion.button>
          </form>

          <div className="mt-8 text-center text-sm text-slate-500 space-y-2">
            <p>ชื่อผู้ใช้งานตัวอย่าง: QSMS หรือ WFG</p>
            <p>หากต้องการแก้ไขบัญชี ให้ปรับค่าใน Google Apps Script Properties</p>
          </div>

          <div className="mt-16 pt-8 border-t border-slate-100 flex flex-col items-center gap-6">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
              SFC Excellence System V4.2.0
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
