/**
 * Apple Pro Style Self-Service Password Reset Component (Streamlined 2-Step Flow)
 */

'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, ChevronLeft, Lock, UserCircle2, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { requestPasswordReset, resetPasswordWithToken } from '@/src/services/auth';

type ResetStep = 'request' | 'reset';

interface PasswordStrength {
  score: number; // 0 to 4
  label: string;
  color: string;
  hasMinLength: boolean;
  hasUpper: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

export function ForgotPassword({
  onSuccess,
  onBackToLogin,
}: {
  onSuccess: () => void;
  onBackToLogin: () => void;
}) {
  const [step, setStep] = useState<ResetStep>('request');
  const [profile, setProfile] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldownTimer, setCooldownTimer] = useState<number>(0);

  // Handle Cooldown Timer countdown
  React.useEffect(() => {
    if (cooldownTimer <= 0) return;
    const interval = setInterval(() => {
      setCooldownTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownTimer]);

  // Evaluate Password Strength
  const evaluatePassword = (pass: string): PasswordStrength => {
    const hasMinLength = pass.length >= 8;
    const hasUpper = /[A-Z]/.test(pass);
    const hasNumber = /[0-9]/.test(pass);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pass);

    let score = 0;
    if (hasMinLength) score++;
    if (hasUpper) score++;
    if (hasNumber) score++;
    if (hasSpecial) score++;

    let label = 'รหัสผ่านค่อนข้างอ่อน';
    let color = 'bg-red-500';

    if (score === 2 || score === 3) {
      label = 'รหัสผ่านปานกลาง';
      color = 'bg-amber-500';
    } else if (score >= 4) {
      label = 'รหัสผ่านปลอดภัยสูง';
      color = 'bg-emerald-500';
    }

    return { score, label, color, hasMinLength, hasUpper, hasNumber, hasSpecial };
  };

  const strength = evaluatePassword(newPassword);

  // Step 1: Verify Identity via Username & Employee ID
  const handleRequestSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (cooldownTimer > 0) return;
    if (!profile.trim() || !employeeId.trim()) {
      setError('กรุณาระบุชื่อผู้ใช้งานและรหัสพนักงานให้ครบถ้วน');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await requestPasswordReset(profile.trim(), employeeId.trim());
      if (!res.success) {
        setError(res.error || 'ข้อมูลชื่อผู้ใช้งานและรหัสพนักงานไม่ตรงกัน');
        if (res.error?.includes('บ่อยเกินไป')) {
          setCooldownTimer(60);
        }
        return;
      }

      if (res.token) {
        setToken(res.token);
      }
      setStep('reset');
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Update New Password
  const handleResetSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!newPassword || newPassword.length < 8) {
      setError('รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('รหัสผ่านทั้งสองช่องไม่ตรงกัน');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await resetPasswordWithToken(profile.trim(), token.trim(), newPassword);
      if (!res.success) {
        setError(res.error || 'ไม่สามารถอัปเดตรหัสผ่านได้');
        return;
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการอัปเดตรหัสผ่าน');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="apple-shell flex h-full w-full items-center justify-center overflow-y-auto custom-scrollbar bg-gradient-to-br from-[#F5F5F7] via-[#FFFFFF] to-[#E8E8ED] px-4 py-8 md:px-8">
      <div className="pointer-events-none absolute inset-0 opacity-30">
        <div className="absolute -left-24 top-12 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(0,0,0,0.05),transparent_70%)]" />
        <div className="absolute -right-24 bottom-6 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(0,0,0,0.04),transparent_70%)]" />
      </div>

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-[560px] overflow-hidden rounded-[36px] bg-white/40 backdrop-blur-xl shadow-2xl shadow-blue-900/5 border border-white/50 p-6 md:p-10"
      >
        <button
          type="button"
          onClick={onBackToLogin}
          className="mb-6 inline-flex items-center gap-1.5 text-xs font-semibold text-[#6e6e73] hover:text-[#1d1d1f] transition-colors"
        >
          <ChevronLeft size={16} />
          กลับสู่หน้าเข้าสู่ระบบ
        </button>

        {/* Step Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className={`h-2 w-2 rounded-full ${step === 'request' ? 'bg-blue-600' : 'bg-gray-300'}`} />
            <span className={`h-2 w-2 rounded-full ${step === 'reset' ? 'bg-blue-600' : 'bg-gray-300'}`} />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#6e6e73] ml-1">
              Step {step === 'request' ? '1 of 2' : '2 of 2'}
            </span>
          </div>

          <h2 className="text-2xl font-semibold tracking-[-0.02em] text-[#1d1d1f] md:text-3xl">
            {step === 'request' && 'ยืนยันตัวตน'}
            {step === 'reset' && 'ตั้งรหัสผ่านใหม่'}
          </h2>
          <p className="mt-1.5 text-sm leading-6 text-[#5d5d63]">
            {step === 'request' && 'กรอกชื่อผู้ใช้งานและรหัสพนักงานของคุณเพื่อยืนยันสิทธิ์ในการตั้งรหัสผ่านใหม่'}
            {step === 'reset' && 'กำหนดรหัสผ่านใหม่ที่ปลอดภัยสำหรับบัญชีของคุณ'}
          </p>
        </div>

        {/* Form Content per Step */}
        <AnimatePresence mode="wait">
          {step === 'request' && (
            <motion.form
              key="step1"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              onSubmit={handleRequestSubmit}
              className="space-y-4"
            >
              <div className="relative group">
                <UserCircle2 size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#7a7a80] group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="text"
                  value={profile}
                  onChange={(e) => {
                    setProfile(e.target.value);
                    setError(null);
                  }}
                  placeholder="Username (ชื่อผู้ใช้งาน)"
                  className="glass-input w-full rounded-2xl py-3.5 pl-11 pr-4 text-[15px]"
                />
              </div>

              <div className="relative group">
                <ShieldCheck size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#7a7a80] group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="text"
                  value={employeeId}
                  onChange={(e) => {
                    setEmployeeId(e.target.value);
                    setError(null);
                  }}
                  placeholder="รหัสพนักงาน (เช่น EMP1002)"
                  className="glass-input w-full rounded-2xl py-3.5 pl-11 pr-4 text-[15px]"
                />
              </div>

              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50/80 px-4 py-3 text-xs font-medium text-red-600">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={!profile.trim() || !employeeId.trim() || cooldownTimer > 0 || isLoading}
                className="apple-btn-primary mt-2 inline-flex w-full items-center justify-center gap-2 py-3.5 text-sm font-semibold shadow-lg shadow-blue-600/20 disabled:opacity-55 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/25 border-t-white" />
                    กำลังตรวจสอบ...
                  </>
                ) : cooldownTimer > 0 ? (
                  <>
                    กรุณารออีก {cooldownTimer} วินาที...
                  </>
                ) : (
                  <>
                    ยืนยันตัวตน
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </motion.form>
          )}

          {step === 'reset' && (
            <motion.form
              key="step2"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              onSubmit={handleResetSubmit}
              className="space-y-4"
            >
              <div className="relative group">
                <Lock size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#7a7a80] group-focus-within:text-blue-500 transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setError(null);
                  }}
                  placeholder="รหัสผ่านใหม่ (อย่างน้อย 8 ตัวอักษร)"
                  className="glass-input w-full rounded-2xl py-3.5 pl-11 pr-11 text-[15px]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#7a7a80] hover:text-[#1d1d1f]"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>

              {/* Real-time Password Strength Meter */}
              {newPassword.length > 0 && (
                <div className="rounded-2xl bg-white/60 p-3.5 border border-black/5 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-[#6e6e73] flex items-center gap-1">
                      <ShieldCheck size={14} />
                      ระดับความปลอดภัย:
                    </span>
                    <span className={strength.score >= 4 ? 'text-emerald-600' : strength.score >= 2 ? 'text-amber-600' : 'text-red-500'}>
                      {strength.label}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${strength.color}`}
                      style={{ width: `${(strength.score / 4) * 100}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px] text-[#6e6e73]">
                    <span className={strength.hasMinLength ? 'text-emerald-600 font-medium' : ''}>• อย่างน้อย 8 ตัวอักษร</span>
                    <span className={strength.hasUpper ? 'text-emerald-600 font-medium' : ''}>• มีตัวพิมพ์ใหญ่ A-Z</span>
                    <span className={strength.hasNumber ? 'text-emerald-600 font-medium' : ''}>• มีตัวเลข 0-9</span>
                    <span className={strength.hasSpecial ? 'text-emerald-600 font-medium' : ''}>• มีอักขระพิเศษ (!@#$)</span>
                  </div>
                </div>
              )}

              <div className="relative group">
                <Lock size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#7a7a80] group-focus-within:text-blue-500 transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError(null);
                  }}
                  placeholder="ยืนยันรหัสผ่านใหม่"
                  className="glass-input w-full rounded-2xl py-3.5 pl-11 pr-4 text-[15px]"
                />
              </div>

              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50/80 px-4 py-3 text-xs font-medium text-red-600">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={!newPassword || !confirmPassword || newPassword !== confirmPassword || strength.score < 2 || isLoading}
                className="apple-btn-primary mt-2 inline-flex w-full items-center justify-center gap-2 py-3.5 text-sm font-semibold shadow-lg shadow-blue-600/20 disabled:opacity-55 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/25 border-t-white" />
                    กำลังอัปเดต...
                  </>
                ) : (
                  <>
                    อัปเดตรหัสผ่านใหม่
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.section>
    </div>
  );
}
