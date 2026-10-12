import React from 'react';
import {
  Printer, Check, CheckCircle2, Clock, AlertCircle, Plus, Trash2, Package, Sparkles
} from 'lucide-react';
import { MaterialRequestItem } from '@/src/services/api';

export interface DerivedShortage {
  hasShortage: boolean;
  shortageList: {
    id: string;
    name: string;
    missingQty: number;
    unit: string;
    requestedQty: number;
    issuedQty: number;
  }[];
  summaryText: string;
  boxes: number;
  gallons: number;
  oil: number;
}

export interface Step3IssuingPanelProps {
  canEditIssuing: boolean;
  canEditRepair: boolean;
  userRole: string;
  materialRequests: MaterialRequestItem[];
  derivedShortage: DerivedShortage;
  receivedHandshake: {
    receivedBy?: string;
    receivedAt?: string;
    isPartial?: boolean;
    status?: 'complete' | 'partial';
    missingSummary?: string;
    note?: string;
  } | null;
  isSaving: boolean;
  setIsRequisitionModalOpen: (val: boolean) => void;
  handleFulfillAllMaterials: () => void;
  handleWPKHandover: () => Promise<void>;
  handleMaterialIssuedQtyChange: (id: string, qty: number) => void;
  handleMaterialSetFulfilled: (id: string) => void;
  handleMaterialSetUnavailable: (id: string) => void;
  handleRemoveMaterialWPK: (id: string) => void;
  isAddingWPKMaterial: boolean;
  setIsAddingWPKMaterial: (val: boolean) => void;
  wpkMaterialName: string;
  setWpkMaterialName: (val: string) => void;
  wpkMaterialQty: number;
  setWpkMaterialQty: (val: number) => void;
  wpkMaterialUnit: string;
  setWpkMaterialUnit: (val: string) => void;
  handleWPKAddCustomMaterial: () => void;
  handleConfirmMaterialReceipt: (isPartial?: boolean) => Promise<void>;
  handleReportShortageBlockage: () => Promise<void>;
}

export const Step3IssuingPanel: React.FC<Step3IssuingPanelProps> = ({
  canEditIssuing,
  canEditRepair,
  userRole,
  materialRequests,
  derivedShortage,
  receivedHandshake,
  isSaving,
  setIsRequisitionModalOpen,
  handleFulfillAllMaterials,
  handleWPKHandover,
  handleMaterialIssuedQtyChange,
  handleMaterialSetFulfilled,
  handleMaterialSetUnavailable,
  handleRemoveMaterialWPK,
  isAddingWPKMaterial,
  setIsAddingWPKMaterial,
  wpkMaterialName,
  setWpkMaterialName,
  wpkMaterialQty,
  setWpkMaterialQty,
  wpkMaterialUnit,
  setWpkMaterialUnit,
  handleWPKAddCustomMaterial,
  handleConfirmMaterialReceipt,
  handleReportShortageBlockage,
}) => {
  return (
    <section className="space-y-5" aria-label="Step 3 จัดเตรียมและจ่ายวัสดุ (WPK คลัง)">
      {/* 1. Step Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900 leading-snug">
              Step 3: จัดเตรียมและจ่ายวัสดุ (WPK คลัง)
            </h2>
            <span
              className={`px-2.5 py-0.5 rounded-md text-xs font-medium border shrink-0 whitespace-nowrap ${
                canEditIssuing
                  ? 'bg-amber-50 text-amber-900 border-amber-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              {canEditIssuing ? 'โหมดเบิกจ่ายของ (WPK / Admin)' : 'โหมดดูการเบิกจ่าย (Preview Only)'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {canEditIssuing
              ? 'ตรวจสอบรายการที่ QSMS ขอ และบันทึกยอดเบิกได้จริงเพื่อส่งมอบงานให้ PDF ซ่อม'
              : 'รายการเบิกจ่ายของแผนกคลัง (เฉพาะแผนก WPK/Admin จึงจะสามารถบันทึกยอดเบิกได้)'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
          <button
            type="button"
            onClick={() => setIsRequisitionModalOpen(true)}
            aria-label="พิมพ์ใบขอเบิกภาชนะ"
            className="min-h-11 inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 rounded-lg border border-slate-300 transition-all cursor-pointer shadow-2xs shrink-0"
            title="เปิดใบขอเบิกภาชนะขนาด A5 สำหรับพิมพ์หรือดาวน์โหลด"
          >
            <Printer size={14} className="text-slate-600" />
            <span>พิมพ์ใบเบิกภาชนะ</span>
          </button>

          {canEditIssuing && (
            <>
              <button
                type="button"
                onClick={handleFulfillAllMaterials}
                disabled={materialRequests.length === 0}
                aria-label="ปรับยอดเบิกครบตามจำนวนที่ขอทั้งหมด"
                className="min-h-11 inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg border border-slate-300 transition-all cursor-pointer shrink-0"
              >
                <Check size={14} className="text-slate-700" />
                <span>เบิกครบตามยอดทั้งหมด</span>
              </button>
              <button
                type="button"
                onClick={handleWPKHandover}
                disabled={isSaving}
                aria-label="ส่งมอบงานให้ช่างซ่อม PDF"
                className={`min-h-11 inline-flex items-center gap-1.5 px-4 py-2 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-all shadow-xs cursor-pointer shrink-0 ${
                  derivedShortage.hasShortage
                    ? 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800'
                    : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800'
                }`}
              >
                <CheckCircle2 size={14} />
                <span>
                  {derivedShortage.hasShortage
                    ? 'ส่งมอบงาน (มีของขาด) ➔'
                    : 'จ่ายของครบ & ส่งให้ PDF ซ่อม ➔'}
                </span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 2. Warehouse Issuing Table */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>รายการเบิกจ่ายวัสดุหน้างาน (Material Fulfillment Items)</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200">
                {materialRequests.length} รายการ
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              แผนกคลังระบุจำนวนที่เบิกจ่ายได้จริง หากรายการใดไม่มีของให้ระบุเป็น 0 หรือกด "ของขาด"
            </p>
          </div>
        </div>

        {materialRequests.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center">
            <Package size={26} className="text-slate-400 mx-auto mb-1.5" />
            <p className="text-xs font-semibold text-slate-600">ยังไม่มีรายการภาชนะที่ QSMS ร้องขอ</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">รายการภาชนะ / วัสดุ</th>
                  <th className="py-2.5 px-3 text-center">ยอดที่ขอ (QSMS)</th>
                  <th className="py-2.5 px-3 text-center">ยอดที่จ่ายจริง (WPK)</th>
                  <th className="py-2.5 px-3 text-center">หน่วยนับ</th>
                  <th className="py-2.5 px-3 text-center">สถานะของ</th>
                  {canEditIssuing && <th className="py-2.5 px-3 text-right">การจัดการ</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {materialRequests.map((mat, idx) => {
                  const isShortage = (mat.issuedQty ?? 0) < mat.requestedQty;
                  return (
                    <tr
                      key={mat.id}
                      className={`transition-colors ${
                        isShortage ? 'bg-amber-50/20 hover:bg-amber-50/40' : 'hover:bg-slate-50/60'
                      }`}
                    >
                      <td className="py-2.5 px-3 font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-800">{mat.materialName}</div>
                        {isShortage && (
                          <div className="text-xs text-amber-700 font-medium mt-0.5">
                            ขาด {mat.requestedQty - (mat.issuedQty ?? 0)} {mat.unit}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-700">
                        {mat.requestedQty}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {canEditIssuing ? (
                          <input
                            type="number"
                            min="0"
                            max={mat.requestedQty}
                            aria-label={`ยอดจ่ายจริงสำหรับ ${mat.materialName}`}
                            value={mat.issuedQty ?? 0}
                            onChange={(e) =>
                              handleMaterialIssuedQtyChange(mat.id, Number(e.target.value) || 0)
                            }
                            className={`w-20 h-9 text-center border rounded-md py-1 px-2 font-mono font-bold shadow-2xs focus:outline-none ${
                              isShortage
                                ? 'border-amber-300 bg-amber-50/40 text-amber-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
                                : 'border-slate-300 bg-white text-slate-900 focus:border-slate-800 focus:ring-2 focus:ring-slate-800/10'
                            }`}
                          />
                        ) : (
                          <span
                            className={`font-mono font-bold ${
                              isShortage ? 'text-amber-700' : 'text-emerald-700'
                            }`}
                          >
                            {mat.issuedQty ?? 0}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-500">{mat.unit}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border ${
                            mat.status === 'fulfilled'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : mat.status === 'partial'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : mat.status === 'unavailable'
                              ? 'bg-rose-50 text-rose-800 border-rose-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {mat.status === 'fulfilled'
                            ? 'จ่ายครบ'
                            : mat.status === 'partial'
                            ? 'จ่ายบางส่วน'
                            : mat.status === 'unavailable'
                            ? 'ของขาด'
                            : 'รอเบิกจ่าย'}
                        </span>
                      </td>
                      {canEditIssuing && (
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleMaterialSetFulfilled(mat.id)}
                              aria-label={`ปรับ ${mat.materialName} เป็นจ่ายครบ`}
                              className="px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50 rounded border border-emerald-200 transition-colors cursor-pointer"
                              title="ตั้งค่าจ่ายครบตามยอดขอ"
                            >
                              ครบ
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMaterialSetUnavailable(mat.id)}
                              aria-label={`ปรับ ${mat.materialName} เป็นของขาด`}
                              className="px-2 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50 rounded border border-rose-200 transition-colors cursor-pointer"
                              title="ตั้งค่าเป็นของขาด (ยอด 0)"
                            >
                              ขาด
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveMaterialWPK(mat.id)}
                              aria-label={`ลบรายการ ${mat.materialName}`}
                              className="min-h-11 min-w-11 inline-flex items-center justify-center text-slate-500 hover:text-rose-700 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                              title="ลบรายการนี้"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {canEditIssuing && (
              <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsAddingWPKMaterial(!isAddingWPKMaterial)}
                  className="text-xs font-semibold text-slate-800 hover:text-slate-950 flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus size={14} />
                  <span>{isAddingWPKMaterial ? 'ยกเลิก' : '+ คลังเพิ่มรายการวัสดุเสริมหน้างาน'}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Custom WPK Material Add Form */}
        {isAddingWPKMaterial && canEditIssuing && (
          <div className="p-4 rounded-xl border border-slate-300 bg-slate-50/80 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ชื่อภาชนะ / วัสดุที่คลังจ่ายเพิ่ม *
              </label>
              <input
                type="text"
                value={wpkMaterialName}
                onChange={(e) => setWpkMaterialName(e.target.value)}
                placeholder="เช่น ถังพลาสติกเสริม, ซองกันกระแทก"
                className="w-full h-10 text-xs border border-slate-300 rounded-lg px-3 bg-white shadow-2xs focus:outline-none focus:border-slate-800 focus:ring-2 focus:ring-slate-800/10"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">จำนวนที่จ่าย *</label>
              <input
                type="number"
                min="1"
                value={wpkMaterialQty}
                onChange={(e) => setWpkMaterialQty(Number(e.target.value) || 1)}
                className="w-full h-10 text-xs border border-slate-300 rounded-lg px-3 bg-white shadow-2xs focus:outline-none focus:border-slate-800 focus:ring-2 focus:ring-slate-800/10"
              />
            </div>
            <div>
              <button
                type="button"
                onClick={handleWPKAddCustomMaterial}
                className="w-full h-10 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-all shadow-xs cursor-pointer"
              >
                บันทึกเพิ่ม
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. Material Shortage Summary Card */}
      <div
        className={`p-4 rounded-xl border transition-all ${
          derivedShortage.hasShortage
            ? 'bg-rose-50/60 border-rose-200'
            : 'bg-emerald-50/60 border-emerald-200'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className={`p-2 rounded-lg shrink-0 ${
                derivedShortage.hasShortage
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {derivedShortage.hasShortage ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                {derivedShortage.hasShortage
                  ? `สรุปรายการวัสดุที่ขาด (พบวัสดุขาด ${derivedShortage.shortageList.length} รายการ)`
                  : 'สถานะความพร้อมของวัสดุ (Material Readiness)'}
              </h4>
              <p className="text-xs text-slate-600 mt-0.5">
                {derivedShortage.hasShortage
                  ? 'ยอดขาดคำนวณจากยอดที่ QSMS ขอ หักลบด้วยยอดที่ WPK จ่ายจริงในตารางด้านบน'
                  : 'วัสดุพร้อมครบตามยอดเบิก ไม่มีรายการขาด พร้อมสำหรับการซ่อม'}
              </p>
              {derivedShortage.hasShortage && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {derivedShortage.shortageList.map((shortage) => (
                    <span
                      key={shortage.id}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-white border border-rose-300 text-rose-800 shadow-2xs"
                    >
                      <span>{shortage.name}</span>
                      <span className="font-bold">
                        ขาด {shortage.missingQty} {shortage.unit}
                      </span>
                      <span className="text-rose-500 text-xs">
                        (ขอ {shortage.requestedQty} / ได้ {shortage.issuedQty})
                      </span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Material Receipt & Handshake Card (Smart Handshake Gate) */}
      <div
        className={`p-4 rounded-xl border transition-all ${
          receivedHandshake
            ? receivedHandshake.isPartial
              ? derivedShortage.hasShortage
                ? 'bg-amber-50/70 border-amber-200 shadow-xs'
                : 'bg-emerald-50/70 border-emerald-300 shadow-xs'
              : 'bg-emerald-50/70 border-emerald-200 shadow-xs'
            : derivedShortage.hasShortage
            ? 'bg-rose-50/40 border-rose-200 shadow-2xs'
            : 'bg-slate-50/80 border-slate-200 shadow-2xs'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className={`p-2 rounded-lg shrink-0 ${
                receivedHandshake
                  ? receivedHandshake.isPartial
                    ? derivedShortage.hasShortage
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                    : 'bg-emerald-100 text-emerald-800'
                  : derivedShortage.hasShortage
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {receivedHandshake ? (
                receivedHandshake.isPartial ? (
                  derivedShortage.hasShortage ? (
                    <Clock size={16} className="text-amber-700" />
                  ) : (
                    <Sparkles size={16} className="text-emerald-700 animate-pulse" />
                  )
                ) : (
                  <Check size={16} className="text-emerald-700" />
                )
              ) : derivedShortage.hasShortage ? (
                <AlertCircle size={16} className="text-rose-600" />
              ) : (
                <Package size={16} />
              )}
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2 flex-wrap">
                <span>สถานะการรับมอบชิ้นส่วนหน้างาน (Material Handshake Receipt)</span>
                {receivedHandshake ? (
                  receivedHandshake.isPartial ? (
                    derivedShortage.hasShortage ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold border border-amber-300 inline-flex items-center gap-1">
                        <Clock size={12} className="text-amber-700" />
                        <span>รับมอบบางส่วน (ยังขาด {derivedShortage.shortageList.length} รายการ)</span>
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-300 inline-flex items-center gap-1 animate-pulse">
                        <Sparkles size={12} className="text-emerald-700" />
                        <span>คลังจ่ายส่วนที่เหลือครบแล้ว • รอตรวจรับ</span>
                      </span>
                    )
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-300 inline-flex items-center gap-1">
                      <CheckCircle2 size={12} className="text-emerald-700" />
                      <span>รับมอบครบชุดเรียบร้อย</span>
                    </span>
                  )
                ) : (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-md font-medium border inline-flex items-center gap-1 ${
                      derivedShortage.hasShortage
                        ? 'bg-rose-50 text-rose-800 border-rose-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    <Clock
                      size={12}
                      className={derivedShortage.hasShortage ? 'text-rose-600' : 'text-slate-500'}
                    />
                    <span>
                      {derivedShortage.hasShortage
                        ? 'รอตรวจรับ (พบของขาด)'
                        : 'รอฝ่ายซ่อม (PDF) ยืนยันตรวจรับ'}
                    </span>
                  </span>
                )}
              </h4>
              <div className="text-xs text-slate-600 mt-1">
                {receivedHandshake ? (
                  receivedHandshake.isPartial ? (
                    <div>
                      <span>
                        ยืนยันรับมอบบางส่วนแล้ว โดย <strong>{receivedHandshake.receivedBy}</strong> เมื่อ{' '}
                        {receivedHandshake.receivedAt}
                      </span>
                      {derivedShortage.hasShortage ? (
                        receivedHandshake.missingSummary && (
                          <span className="block text-xs text-amber-800 mt-0.5 font-medium">
                            รายการที่ยังขาด: {receivedHandshake.missingSummary}
                          </span>
                        )
                      ) : (
                        <span className="block text-xs text-emerald-800 mt-0.5 font-bold">
                          ✨ คลังได้จัดส่งชิ้นส่วนส่วนที่เหลือครบถ้วนแล้ว กรุณากดยืนยันตรวจรับส่วนที่เหลือเพื่อปิด Handshake 100%
                        </span>
                      )}
                    </div>
                  ) : (
                    <span>
                      ยืนยันตรวจรับชิ้นส่วนครบชุดแล้ว โดย <strong>{receivedHandshake.receivedBy}</strong> เมื่อ{' '}
                      {receivedHandshake.receivedAt}
                    </span>
                  )
                ) : canEditRepair || userRole === 'ADMIN' || userRole === 'PDF' ? (
                  derivedShortage.hasShortage ? (
                    <span className="text-rose-700 font-medium">
                      ⚠️ ตรวจพบวัสดุขาดจากการเบิกจ่าย สามารถเลือกรับมอบเพื่อเริ่มซ่อมบางส่วน หรือแจ้งติดปัญหา (Defend Mode)
                    </span>
                  ) : (
                    <span>ฝ่ายซ่อม (PDF) หรือผู้รับมอบหน้างานต้องตรวจนับและยืนยันการรับมอบเมื่อของมาถึง</span>
                  )
                ) : (
                  <span>
                    คลัง (WPK) ส่งมอบของเรียบร้อยแล้ว ช่างซ่อม (PDF) จะเป็นผู้ตรวจนับและกดยืนยันการรับมอบหน้างาน
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons for Handshake Gate */}
          {(!receivedHandshake || receivedHandshake.isPartial) &&
            (canEditRepair || userRole === 'ADMIN' || userRole === 'PDF') && (
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
                {receivedHandshake?.isPartial ? (
                  !derivedShortage.hasShortage ? (
                    <button
                      type="button"
                      onClick={() => handleConfirmMaterialReceipt(false)}
                      disabled={isSaving}
                      aria-label="ยืนยันรับมอบส่วนที่เหลือครบชุด ➔"
                      className="min-h-11 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-all shadow-xs flex items-center gap-2 cursor-pointer shrink-0 animate-pulse"
                      title="ยืนยันตรวจรับชิ้นส่วนส่วนที่เหลือครบชุดสมบูรณ์ 100%"
                    >
                      <CheckCircle2 size={15} />
                      <span>ยืนยันรับมอบส่วนที่เหลือครบชุด ➔</span>
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => handleConfirmMaterialReceipt(true)}
                        disabled={isSaving}
                        aria-label="อัปเดตบันทึกรับมอบ"
                        className="min-h-11 px-3.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 disabled:opacity-50 text-xs font-semibold rounded-lg transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer shrink-0"
                        title="อัปเดตบันทึกการรับมอบตามยอดเบิกล่าสุด"
                      >
                        <Clock size={14} />
                        <span>อัปเดตบันทึกรับมอบ</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleReportShortageBlockage}
                        disabled={isSaving}
                        aria-label="ของไม่พอซ่อม - แจ้งติดปัญหา"
                        className="min-h-11 px-3.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-all shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
                        title="ของยังไม่พอซ่อม แจ้งเปลี่ยนสถานะเป็นติดปัญหา (Defend Mode) ทันที"
                      >
                        <AlertCircle size={14} />
                        <span>ของไม่พอซ่อม - แจ้งติดปัญหา</span>
                      </button>
                    </>
                  )
                ) : derivedShortage.hasShortage ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleConfirmMaterialReceipt(true)}
                      disabled={isSaving}
                      aria-label="รับมอบบางส่วน (เริ่มซ่อมเท่าที่มี)"
                      className="min-h-11 px-3.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-all shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
                      title="รับมอบวัสดุเท่าที่มีเพื่อเริ่มซ่อมบางส่วนก่อน"
                    >
                      <Clock size={14} />
                      <span>รับมอบบางส่วน (เริ่มซ่อมเท่าที่มี)</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleReportShortageBlockage}
                      disabled={isSaving}
                      aria-label="ของไม่พอซ่อม - แจ้งติดปัญหา"
                      className="min-h-11 px-3.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-all shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
                      title="ของยังไม่พอซ่อม แจ้งเปลี่ยนสถานะเป็นติดปัญหา (Defend Mode) ทันที"
                    >
                      <AlertCircle size={14} />
                      <span>ของไม่พอซ่อม - แจ้งติดปัญหา</span>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleConfirmMaterialReceipt(false)}
                    disabled={isSaving}
                    aria-label="ยืนยันตรวจรับชิ้นส่วนครบชุด"
                    className="min-h-11 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-all shadow-xs flex items-center gap-2 cursor-pointer shrink-0"
                  >
                    <CheckCircle2 size={15} />
                    <span>ยืนยันตรวจรับชิ้นส่วนครบชุด</span>
                  </button>
                )}
              </div>
            )}
        </div>
      </div>
    </section>
  );
};
