'use client';

import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import type { User } from '../../../services/auth';

interface RosterHeaderProps {
  user: User | null;
  onBackToPortal: () => void;
}

export function RosterHeader({ user, onBackToPortal }: RosterHeaderProps) {
  return (
    <header className="glass-panel mb-6 flex flex-wrap items-center justify-between gap-3 rounded-[24px] px-5 py-4 shadow-xl shadow-blue-900/5 transition-all">
      <div className="flex items-center gap-3">
        <motion.button
          whileHover={{ scale: 1.02, x: -2 }}
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={onBackToPortal}
          className="inline-flex items-center gap-2 rounded-xl border border-black/5 bg-white/60 px-4 py-2 text-sm font-bold text-[#1d1d1f] shadow-sm backdrop-blur-md transition-colors hover:bg-white"
        >
          <ArrowLeft size={15} />
          กลับพอร์ทัล
        </motion.button>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-black/40">ตารางเวร</p>
          <h1 className="text-xl font-bold tracking-[-0.02em] text-[#1d1d1f]">ShiftHub Roster</h1>
        </div>
      </div>
      <div className="rounded-full bg-black/5 px-4 py-1.5 text-xs font-bold text-black/70 backdrop-blur-sm">
        ลงชื่อเข้าใช้: {user?.name || 'User'}
      </div>
    </header>
  );
}
