import React from 'react';
import {
  Save, CheckCheck, AlertTriangle, CheckCircle2, Shield, Award, Layers
} from 'lucide-react';
import { ReworkCase, ReworkItem } from '@/src/services/api';

export interface Step4RepairPanelProps {
  canEditRepair: boolean;
  userRole: string;
  isAdmin: boolean;
  caseStatus: ReworkCase['status'];
  isDefendBlocked: boolean;
  setIsDefendBlocked: (val: boolean) => void;
  defendCategory: string;
  setDefendCategory: (val: string) => void;
  defendNotes: string;
  setDefendNotes: (val: string) => void;
  handlePDFSave: (isComplete: boolean, isDefend: boolean) => Promise<void>;
  isSaving: boolean;
  editedItems: ReworkItem[];
  handleItemProgressChange: (index: number, completedBoxes: number) => void;
  globalCompleted: number;
  totalBoxes: number;
  qcSignoff: {
    approvedBy?: string;
    approvedAt?: string;
    qcNotes?: string;
  } | null;
  qcNotesInput: string;
  setQcNotesInput: (val: string) => void;
  handleQCSignoff: () => Promise<void>;
}

export const Step4RepairPanel: React.FC<Step4RepairPanelProps> = ({
  canEditRepair,
  userRole,
  isAdmin,
  caseStatus,
  isDefendBlocked,
  setIsDefendBlocked,
  defendCategory,
  setDefendCategory,
  defendNotes,
  setDefendNotes,
  handlePDFSave,
  isSaving,
  editedItems,
  handleItemProgressChange,
  globalCompleted,
  totalBoxes,
  qcSignoff,
  qcNotesInput,
  setQcNotesInput,
  handleQCSignoff,
}) => {
  const percentCompleted = totalBoxes > 0 ? Math.min(100, Math.round((globalCompleted / totalBoxes) * 100)) : 0;

  return (
    <section className="space-y-5" aria-label="Step 4 ซ่อมแซมและตรวจรับ (PDF/QC)">
      {/* 1. Step Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900">Step 4: ซ่อมแซมและตรวจรับ (PDF/QC)</h2>
            <span
              className={`px-2.5 py-0.5 rounded-md text-xs font-medium border shrink-0 ${
                canEditRepair
                  ? 'bg-sky-50 text-sky-800 border-sky-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              {canEditRepair ? 'โหมดซ่อม & Defend (PDF / Admin)' : 'โหมดดูความคืบหน้า (Preview Only)'}
            </span>
            {caseStatus === 'Blocked' && (
              <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-rose-50 text-rose-800 border border-rose-300 inline-flex items-center gap-1 shrink-0">
                <AlertTriangle size={13} />
                <span>ติดปัญหา (Blocked)</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {canEditRepair
              ? 'บันทึกยอดกล่องที่ซ่อมเสร็จจริง หรือบันทึกปัญหา Defend กรณีติดอุปสรรคหน้างาน'
              : 'ความคืบหน้างานซ่อมของแผนก PDF (เฉพาะแผนก PDF/Admin จึงจะสามารถบันทึกยอดซ่อมได้)'}
          </p>
        </div>

        {canEditRepair && (
          <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
            <button
              type="button"
              onClick={() => handlePDFSave(false, false)}
              disabled={isSaving}
              aria-label="บันทึกความคืบหน้างานซ่อม"
              className="min-h-11 px-4 inline-flex items-center gap-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-2xs transition-all cursor-pointer"
            >
              <Save size={14} className="text-slate-600" />
              <span>บันทึกความคืบหน้า</span>
            </button>
            <button
              type="button"
              onClick={() => handlePDFSave(true, false)}
              disabled={isSaving || globalCompleted < totalBoxes}
              aria-label="บันทึกซ่อมเสร็จแล้ว 100%"
              className="min-h-11 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg transition-all shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <CheckCheck size={15} />
              <span>ซ่อมเสร็จแล้ว 100% ➔</span>
            </button>
            <button
              type="button"
              onClick={() => setIsDefendBlocked(!isDefendBlocked)}
              aria-label="สลับโหมดรายงานปัญหา Defend Mode"
              className={`min-h-11 px-3.5 border text-xs font-semibold rounded-lg transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer ${
                isDefendBlocked
                  ? 'bg-rose-50 border-rose-300 text-rose-800'
                  : 'bg-white hover:bg-rose-50 border-slate-300 text-rose-700'
              }`}
            >
              <AlertTriangle size={14} />
              <span>{isDefendBlocked ? 'ยกเลิก Defend' : 'แจ้งติดปัญหา'}</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. Global Progress Gauge Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers size={16} className="text-slate-700" />
            <h3 className="text-sm font-bold text-slate-900">
              ภาพรวมความคืบหน้าการซ่อมทั้งหมด (Total Repair Progress)
            </h3>
          </div>
          <div className="flex items-center gap-2 font-mono">
            <span className="text-sm font-bold text-slate-900">{globalCompleted}</span>
            <span className="text-xs text-slate-400">/ {totalBoxes} กล่อง</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200">
              {percentCompleted}%
            </span>
          </div>
        </div>

        <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              percentCompleted >= 100 ? 'bg-emerald-600' : 'bg-slate-900'
            }`}
            style={{ width: `${percentCompleted}%` }}
          />
        </div>
      </div>

      {/* 3. Items Repair Progress Inputs Table */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
          บันทึกยอดซ่อมตามรายการสินค้า (Item Progress)
        </h3>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
              <tr>
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">รหัส / สินค้า</th>
                <th className="py-2.5 px-3 text-center">ยอดทั้งหมด (กล่อง)</th>
                <th className="py-2.5 px-3 text-center">ยอดซ่อมเสร็จจริง</th>
                <th className="py-2.5 px-3 text-center">ความคืบหน้า</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {editedItems.map((item, idx) => {
                const totalItemBoxes = Number(item.amount) || 0;
                const completedItemBoxes = Number(item.completedBoxes) || 0;
                const isComplete = totalItemBoxes > 0 && completedItemBoxes >= totalItemBoxes;

                return (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-slate-400">{idx + 1}</td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-900">{item.itemName || 'ไม่ระบุชื่อ'}</div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">
                        {item.itemCode || item.itemNumber || '-'}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-800">
                      {totalItemBoxes}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {canEditRepair ? (
                        <div className="inline-flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleItemProgressChange(idx, Math.max(0, completedItemBoxes - 1))}
                            disabled={completedItemBoxes <= 0}
                            aria-label={`ลดยอดซ่อม ${item.itemName}`}
                            className="w-8 h-8 rounded-md bg-slate-100 hover:bg-slate-200 active:bg-slate-300 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 font-bold text-sm flex items-center justify-center transition-colors cursor-pointer select-none"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="0"
                            max={totalItemBoxes}
                            aria-label={`ยอดซ่อมเสร็จสำหรับ ${item.itemName}`}
                            value={completedItemBoxes}
                            onChange={(e) => handleItemProgressChange(idx, Math.max(0, Math.min(totalItemBoxes, Number(e.target.value) || 0)))}
                            className="w-16 h-8 text-center border border-slate-300 bg-white rounded-md py-1 px-1 font-mono font-bold text-slate-900 shadow-2xs focus:border-slate-800 focus:ring-2 focus:ring-slate-800/10 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleItemProgressChange(idx, Math.min(totalItemBoxes, completedItemBoxes + 1))}
                            disabled={completedItemBoxes >= totalItemBoxes}
                            aria-label={`เพิ่มยอดซ่อม ${item.itemName}`}
                            className="w-8 h-8 rounded-md bg-slate-900 hover:bg-slate-800 active:bg-slate-950 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold text-sm flex items-center justify-center transition-colors cursor-pointer select-none"
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <span className="font-mono font-bold text-slate-900">{completedItemBoxes}</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border ${
                          isComplete
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : completedItemBoxes > 0
                            ? 'bg-sky-50 text-sky-800 border-sky-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {isComplete
                          ? 'เสร็จแล้ว'
                          : completedItemBoxes > 0
                          ? `กำลังซ่อม (${completedItemBoxes}/${totalItemBoxes})`
                          : 'ยังไม่เริ่ม'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Defend Mode Card (Blocked state) */}
      {(isDefendBlocked || caseStatus === 'Blocked') && (
        <div className="bg-rose-50/70 border border-rose-300 rounded-xl p-4 shadow-xs space-y-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle size={18} className="text-rose-700 mt-0.5 shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-rose-900">
                รายงานติดปัญหาหน้างาน (Defend Mode / Bottleneck Blocker)
              </h3>
              <p className="text-xs text-rose-700 mt-0.5">
                เปลี่ยนสถานะเคสเป็น "ติดปัญหา (Blocked)" พร้อมระบุเหตุผลเพื่อประสานงานฝ่ายที่เกี่ยวข้อง
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">สาเหตุที่ติดขัด *</label>
              <select
                value={defendCategory}
                onChange={(e) => setDefendCategory(e.target.value)}
                disabled={!canEditRepair}
                className="w-full h-10 text-xs border border-rose-300 rounded-lg px-3 bg-white focus:outline-none focus:border-rose-500"
              >
                <option value="waiting_oil">รอน้ำมัน / วัตถุดิบเติม</option>
                <option value="waiting_container">รอแกลลอน / ภาชนะบรรจุ</option>
                <option value="waiting_lab">รอผลตรวจสอบคุณภาพห้องแล็บ (QC Lab)</option>
                <option value="waiting_machine">เครื่องจักรขัดข้อง / ปัญหาอุปกรณ์</option>
                <option value="other">สาเหตุอื่นๆ</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">รายละเอียดเพิ่มเติม</label>
              <input
                type="text"
                value={defendNotes}
                onChange={(e) => setDefendNotes(e.target.value)}
                disabled={!canEditRepair}
                placeholder="ระบุข้อความอธิบาย เช่น รอแกลลอน 1L จาก supplier อีก 50 ใบ"
                className="w-full h-10 text-xs border border-rose-300 rounded-lg px-3 bg-white focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          {canEditRepair && (
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => handlePDFSave(false, true)}
                disabled={isSaving}
                className="min-h-11 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-xs"
              >
                ยืนยันแจ้งติดปัญหา (Defend)
              </button>
            </div>
          )}
        </div>
      )}

      {/* 5. QC Verification Gate (Sign-Off Gate) */}
      <div
        className={`p-4 rounded-xl border transition-all ${
          qcSignoff
            ? 'bg-emerald-50/70 border-emerald-200 shadow-xs'
            : globalCompleted >= totalBoxes && totalBoxes > 0
            ? 'bg-slate-50 border-slate-300 shadow-xs'
            : 'bg-slate-50/50 border-slate-200 opacity-80'
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`p-2 rounded-lg shrink-0 ${
              qcSignoff
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-slate-200 text-slate-700'
            }`}
          >
            {qcSignoff ? <Award size={18} /> : <Shield size={18} />}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>QC Verification Gate (การตรวจรับมาตรฐานและปิดเคส)</span>
                {qcSignoff && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                    ตรวจรับผ่านเกณฑ์ QC เรียบร้อย
                  </span>
                )}
              </h4>
            </div>

            <p className="text-xs text-slate-500 mt-0.5">
              {qcSignoff
                ? `ลงนามตรวจรับเรียบร้อยแล้ว โดย ${qcSignoff.approvedBy} เมื่อ ${qcSignoff.approvedAt}`
                : 'เมื่อซ่อมครบ 100% เจ้าหน้าที่ QSMS หรือ Admin จะเป็นผู้ตรวจทานคุณภาพและลงนามปิดเคสสมบูรณ์'}
            </p>

            {qcSignoff?.qcNotes && (
              <div className="mt-2 text-xs bg-white/80 p-2.5 rounded-lg border border-emerald-200 text-emerald-900 font-medium">
                หมายเหตุ QC: {qcSignoff.qcNotes}
              </div>
            )}

            {!qcSignoff && globalCompleted >= totalBoxes && totalBoxes > 0 && (
              <div className="mt-3 space-y-3 pt-2 border-t border-slate-200">
                {isAdmin || userRole === 'QSMS' ? (
                  <>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-semibold text-slate-700">
                          บันทึกผลการตรวจสอบของ QC (QC Inspection Notes):
                        </label>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <span>ทางลัด:</span>
                          <button
                            type="button"
                            onClick={() =>
                              setQcNotesInput(
                                'ตรวจสอบสภาพกล่อง แกลลอน และรอยรั่วซึมแล้ว อยู่ในเกณฑ์มาตรฐาน 100%'
                              )
                            }
                            className="text-slate-800 hover:underline cursor-pointer"
                          >
                            +ผ่านเกณฑ์ 100%
                          </button>
                        </div>
                      </div>
                      <textarea
                        rows={2}
                        value={qcNotesInput}
                        onChange={(e) => setQcNotesInput(e.target.value)}
                        placeholder="ระบุข้อคิดเห็น QC เช่น ตรวจสอบสภาพกล่อง แกลลอน และรอยรั่วซึมแล้ว อยู่ในเกณฑ์มาตรฐาน พร้อมส่งเข้าคลัง..."
                        className="w-full text-xs font-medium bg-white border border-slate-300 rounded-lg p-2.5 focus:border-slate-800 focus:ring-2 focus:ring-slate-800/10 focus:outline-none"
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleQCSignoff}
                        disabled={isSaving}
                        aria-label="ลงนามตรวจรับ QC & ปิดเคส ➔"
                        className="min-h-11 px-5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
                      >
                        <CheckCircle2 size={15} />
                        <span>ลงนามตรวจรับ QC & ปิดเคส ➔</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-slate-600 italic">
                    งานซ่อมเสร็จครบตามยอดแล้ว กรุณาแจ้งฝ่าย QSMS หรือ Admin เพื่อตรวจรับและลงนามปิดเคส
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
