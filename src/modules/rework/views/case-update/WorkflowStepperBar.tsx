import React from 'react';
import { ReworkItem } from '@/src/services/api';

export type WorkflowStep = 'items' | 'analysis' | 'issuing' | 'repair';

export interface WorkflowStepperBarProps {
  activeStep: WorkflowStep;
  setActiveStep: (step: WorkflowStep) => void;
  editedItems: ReworkItem[];
  completedItemsCount?: number;
  globalCompleted: number;
  totalBoxes: number;
  resolutionMethod?: string;
  hasShortage: boolean;
  receivedHandshake: {
    isPartial?: boolean;
    status?: 'complete' | 'partial';
  } | null;
  isDefendBlocked: boolean;
  qcSignoff: {
    approvedBy?: string;
  } | null;
  userRole?: string;
}

export const WorkflowStepperBar: React.FC<WorkflowStepperBarProps> = ({
  activeStep,
  setActiveStep,
  editedItems,
  completedItemsCount,
  globalCompleted,
  totalBoxes,
  resolutionMethod,
  hasShortage,
  receivedHandshake,
  isDefendBlocked,
  qcSignoff,
  userRole,
}) => {
  const isRoleStep = (stepKey: WorkflowStep) => {
    if (!userRole) return false;
    if (userRole === 'PDF') return stepKey === 'repair' || (stepKey === 'issuing' && !receivedHandshake);
    if (userRole === 'WPK') return stepKey === 'issuing';
    if (userRole === 'QSMS') return stepKey === 'analysis' || stepKey === 'items';
    return false;
  };

  const isStep1Complete = completedItemsCount !== undefined && editedItems.length > 0 && completedItemsCount >= editedItems.length;

  const steps: {
    key: WorkflowStep;
    label: string;
    shortLabel: string;
    badgeText: string;
    badgeTone: 'slate' | 'amber' | 'emerald' | 'rose' | 'sky';
  }[] = [
    {
      key: 'items',
      label: '1. บันทึกข้อมูลสินค้า (SFC/ผู้แจ้ง)',
      shortLabel: '1. ข้อมูลสินค้า',
      badgeText: completedItemsCount !== undefined && editedItems.length > 0
        ? (isStep1Complete ? `สมบูรณ์ ${completedItemsCount}/${editedItems.length}` : `ยังไม่ครบ ${completedItemsCount}/${editedItems.length}`)
        : `${editedItems.length} รายการ`,
      badgeTone: isStep1Complete ? 'emerald' : completedItemsCount !== undefined ? 'amber' : 'slate',
    },
    {
      key: 'analysis',
      label: '2. วิเคราะห์และออกใบเบิก (QSMS)',
      shortLabel: '2. วิเคราะห์/เบิก',
      badgeText: resolutionMethod ? 'วิเคราะห์แล้ว' : 'รอวิเคราะห์',
      badgeTone: resolutionMethod ? 'emerald' : 'slate',
    },
    {
      key: 'issuing',
      label: '3. จัดเตรียมและจ่ายวัสดุ (WPK คลัง)',
      shortLabel: '3. จ่ายของ',
      badgeText: hasShortage
        ? 'พบของขาด'
        : receivedHandshake?.isPartial
        ? 'รับบางส่วน'
        : receivedHandshake
        ? 'ตรวจรับครบ'
        : 'รอเบิกจ่าย',
      badgeTone: hasShortage
        ? 'rose'
        : receivedHandshake?.isPartial
        ? 'amber'
        : receivedHandshake
        ? 'emerald'
        : 'slate',
    },
    {
      key: 'repair',
      label: '4. ซ่อมแซมและตรวจรับ (PDF/QC)',
      shortLabel: '4. ซ่อม/QC',
      badgeText: qcSignoff
        ? 'QC ปิดเคสแล้ว'
        : isDefendBlocked
        ? 'ติดปัญหา Defend'
        : totalBoxes > 0 && globalCompleted >= totalBoxes
        ? 'ซ่อมเสร็จ 100%'
        : `${globalCompleted}/${totalBoxes} กล่อง`,
      badgeTone: qcSignoff
        ? 'emerald'
        : isDefendBlocked
        ? 'rose'
        : totalBoxes > 0 && globalCompleted >= totalBoxes
        ? 'emerald'
        : 'slate',
    },
  ];

  const getBadgeClass = (tone: 'slate' | 'amber' | 'emerald' | 'rose' | 'sky', isActive: boolean) => {
    switch (tone) {
      case 'emerald':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'amber':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'rose':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      case 'sky':
        return 'bg-sky-50 text-sky-800 border-sky-200';
      default:
        return isActive
          ? 'bg-slate-100 text-slate-700 border-slate-200'
          : 'bg-white/80 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="flex items-center justify-between px-2.5 sm:px-6 py-2 bg-white border-b border-slate-200 shrink-0 overflow-x-auto scrollbar-hide">
      <nav
        aria-label="ขั้นตอนการทำงาน Rework"
        className="flex min-w-max items-center p-1 bg-slate-100 rounded-xl border border-slate-200 gap-1 sm:gap-1.5"
      >
        {steps.map((s) => {
          const isActive = activeStep === s.key;
          const isUserDepartment = isRoleStep(s.key);
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setActiveStep(s.key)}
              aria-current={isActive ? 'step' : undefined}
              className={`min-h-11 shrink-0 whitespace-nowrap px-2.5 sm:px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer flex items-center gap-1.5 sm:gap-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-800 ${
                isActive
                  ? 'bg-white text-slate-900 border border-slate-300/80 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
              }`}
            >
              <span>
                <span className="hidden sm:inline">{s.label}</span>
                <span className="sm:hidden">{s.shortLabel}</span>
              </span>
              {isUserDepartment && (
                <span className="hidden sm:inline-flex text-[10px] bg-slate-900 text-white px-1.5 py-0.5 rounded font-bold">
                  ฝ่ายคุณ
                </span>
              )}
              <span
                className={`text-[11px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-md font-semibold border ${getBadgeClass(
                  s.badgeTone,
                  isActive
                )}`}
              >
                {s.badgeText}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="hidden lg:flex items-center gap-3 text-xs text-slate-500 font-mono tabular-nums">
        <span>รวม {totalBoxes} กล่อง</span>
        <span>•</span>
        <span className="font-semibold text-slate-700">เสร็จ {globalCompleted} กล่อง</span>
      </div>
    </div>
  );
};

