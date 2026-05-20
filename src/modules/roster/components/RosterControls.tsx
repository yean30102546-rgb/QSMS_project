import React from 'react';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { motion } from 'motion/react';
import { Tabs, TabsList, TabsTrigger } from '@/src/components/ui/tabs';

interface RosterControlsProps {
  monthLabel: string;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  activeTab: 'summary' | 'calendar';
  onTabChange: (tab: 'summary' | 'calendar') => void;
  onResetOverrides: () => void;
}

export function RosterControls({
  monthLabel,
  onPreviousMonth,
  onNextMonth,
  activeTab,
  onTabChange,
  onResetOverrides,
}: RosterControlsProps) {
  return (
    <section className="mb-6 flex flex-wrap items-center justify-between gap-4 bg-white border border-[#e4e4e7] rounded-2xl p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="button"
          onClick={onPreviousMonth}
          className="border border-[#e4e4e7] bg-white hover:bg-[#fafafa] rounded-lg p-2 text-[#3f3f46] transition-colors"
        >
          <ChevronLeft size={16} />
        </motion.button>
        <h2 className="min-w-[200px] text-center text-base font-bold text-[#18181b]">{monthLabel}</h2>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="button"
          onClick={onNextMonth}
          className="border border-[#e4e4e7] bg-white hover:bg-[#fafafa] rounded-lg p-2 text-[#3f3f46] transition-colors"
        >
          <ChevronRight size={16} />
        </motion.button>
      </div>

      <div className="flex items-center gap-3">
        <Tabs 
          value={activeTab} 
          onValueChange={(v) => onTabChange(v as 'summary' | 'calendar')}
          className="bg-[#f4f4f5] p-1 rounded-xl"
        >
          <TabsList className="bg-transparent border-none p-0 gap-1 h-auto">
            <TabsTrigger 
              value="summary"
              className="px-4 py-1.5 rounded-lg text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-[#18181b] data-[state=active]:shadow-sm text-[#71717a] transition-all"
            >
              📊 ภาพรวม
            </TabsTrigger>
            <TabsTrigger 
              value="calendar"
              className="px-4 py-1.5 rounded-lg text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-[#18181b] data-[state=active]:shadow-sm text-[#71717a] transition-all"
            >
              📅 ปฏิทิน
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          type="button"
          onClick={onResetOverrides}
          className="border border-[#e4e4e7] bg-white hover:bg-[#fafafa] rounded-lg px-3 py-1.5 text-xs font-semibold text-[#3f3f46] transition-colors inline-flex items-center gap-1.5"
        >
          <RotateCcw size={13} />
          ล้างการสลับ
        </motion.button>
      </div>
    </section>
  );
}
