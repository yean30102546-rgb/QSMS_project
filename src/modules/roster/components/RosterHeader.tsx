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
    <header className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-[#e4e4e7] pb-4">
      <div className="flex items-center gap-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          type="button"
          onClick={onBackToPortal}
          className="border border-[#e4e4e7] bg-white hover:bg-[#fafafa] rounded-lg px-4 py-2 text-sm font-medium text-[#3f3f46] transition-colors inline-flex items-center gap-2"
        >
          <ArrowLeft size={15} />
          กลับพอร์ทัล
        </motion.button>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#a1a1aa]">ตารางเวร</p>
          <h1 className="text-xl font-bold text-[#18181b]">ShiftHub Roster</h1>
        </div>
      </div>
      <div className="text-sm text-[#71717a] font-medium">
        ลงชื่อเข้าใช้: {user?.name || 'User'}
      </div>
    </header>
  );
}
