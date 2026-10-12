import React from 'react';
import { Save, CheckCheck, Plus } from 'lucide-react';
import { ReworkItem } from '@/src/services/api';

export interface MobileTechnicianQuickBarProps {
  canEditRepair: boolean;
  totalBoxes: number;
  globalCompleted: number;
  isSaving: boolean;
  editedItems: ReworkItem[];
  handleItemProgressChange: (index: number, completedBoxes: number) => void;
  handlePDFSave: (isComplete: boolean, isDefend: boolean) => Promise<void>;
}

export const MobileTechnicianQuickBar: React.FC<MobileTechnicianQuickBarProps> = ({
  canEditRepair,
  totalBoxes,
  globalCompleted,
  isSaving,
  editedItems,
  handleItemProgressChange,
  handlePDFSave,
}) => {
  if (!canEditRepair || totalBoxes === 0) return null;

  const percentCompleted = totalBoxes > 0 ? Math.min(100, Math.round((globalCompleted / totalBoxes) * 100)) : 0;
  const isAllDone = globalCompleted >= totalBoxes;

  // Find the first item that is not yet fully repaired
  const firstIncompleteIdx = editedItems.findIndex(
    (item) => (Number(item.completedBoxes) || 0) < (Number(item.amount) || 0)
  );

  const handleQuickAddOne = () => {
    if (firstIncompleteIdx >= 0) {
      const cur = Number(editedItems[firstIncompleteIdx].completedBoxes) || 0;
      const max = Number(editedItems[firstIncompleteIdx].amount) || 0;
      handleItemProgressChange(firstIncompleteIdx, Math.min(max, cur + 1));
    }
  };

  return (
    <aside
      aria-label="แถบควบคุมด่วนช่างซ่อมบนมือถือ"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3.5 py-2.5 shadow-[0_-6px_25px_rgba(0,0,0,0.08)] lg:hidden"
    >
      <div className="max-w-xl mx-auto flex items-center justify-between gap-2.5">
        {/* Progress Pill */}
        <div className="min-w-0 flex flex-col justify-center">
          <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-slate-900 truncate">
            <span>{globalCompleted}/{totalBoxes}</span>
            <span className="text-[11px] font-normal text-slate-500">กล่อง</span>
            <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
              isAllDone ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
            }`}>
              {percentCompleted}%
            </span>
          </div>
          <div className="w-24 sm:w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
            <div
              className={`h-full transition-all duration-300 ${
                isAllDone ? 'bg-emerald-600' : 'bg-slate-900'
              }`}
              style={{ width: `${percentCompleted}%` }}
            />
          </div>
        </div>

        {/* Quick Actions Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {!isAllDone && firstIncompleteIdx >= 0 && (
            <button
              type="button"
              onClick={handleQuickAddOne}
              disabled={isSaving}
              aria-label="เพิ่มยอดซ่อม 1 กล่องด่วน"
              className="h-10 px-3 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 border border-slate-200 cursor-pointer"
            >
              <Plus size={14} className="stroke-[3]" />
              <span>1 กล่อง</span>
            </button>
          )}

          {isAllDone ? (
            <button
              type="button"
              onClick={() => handlePDFSave(true, false)}
              disabled={isSaving}
              aria-label="บันทึกซ่อมเสร็จแล้ว 100%"
              className="h-10 px-3.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCheck size={15} />
              <span>ส่ง QC 100%</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handlePDFSave(false, false)}
              disabled={isSaving}
              aria-label="บันทึกยอดซ่อม"
              className="h-10 px-3.5 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Save size={14} />
              <span>บันทึกยอด</span>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};

