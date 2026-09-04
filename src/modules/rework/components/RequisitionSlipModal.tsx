'use client';

import React, { useRef } from 'react';
import { Printer, X, Package } from 'lucide-react';
import type { ReworkCase, MaterialRequestItem } from '@/src/services/api';
import { formatThaiDateShort } from '@/src/utils/helpers';

interface RequisitionSlipModalProps {
  caseData: ReworkCase;
  materialRequests: MaterialRequestItem[];
  resolutionMethod?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function RequisitionSlipModal({
  caseData,
  materialRequests,
  resolutionMethod,
  isOpen,
  onClose,
}: RequisitionSlipModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const totalRequested = materialRequests.reduce((acc, m) => acc + (Number(m.requestedQty) || 0), 0);
  const totalIssued = materialRequests.reduce((acc, m) => acc + (Number(m.issuedQty) || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Top Bar (Hidden in Print) */}
        <div className="print:hidden flex items-center justify-between px-6 py-3.5 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">
              พรีวิวใบขอเบิกภาชนะและวัสดุ (Material Requisition Slip)
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Printer size={13} />
              <span>สั่งพิมพ์ (Print / PDF)</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Document Container */}
        <div ref={printRef} className="p-8 space-y-6 text-slate-900 bg-white font-sans text-xs">
          
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-slate-900 text-white font-black text-[11px] tracking-wider">QSMS</span>
                <span className="font-bold text-slate-600 text-xs">QUALITY & REWORK MANAGEMENT SYSTEM</span>
              </div>
              <h1 className="text-lg font-black tracking-tight text-slate-900 mt-1">
                ใบขอเบิกภาชนะและวัสดุสำหรับงานซ่อม (REQUISITION SLIP)
              </h1>
              <p className="text-[11px] text-slate-500 mt-0.5">
                เอกสารประกอบการส่งมอบงานระหว่าง แผนกควบคุมคุณภาพ (QSMS) ➔ แผนกคลังสินค้า (WPK) ➔ แผนกผลิต (PDF)
              </p>
            </div>

            <div className="text-right shrink-0">
              <div className="inline-block border-2 border-slate-900 px-3 py-1.5 rounded-lg text-center bg-slate-50">
                <span className="block text-[9px] font-bold text-slate-500 uppercase">Case ID</span>
                <span className="font-mono font-black text-sm text-slate-900">{caseData.id}</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">วันที่: {formatThaiDateShort(caseData.date)}</p>
            </div>
          </div>

          {/* Quick Case Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div>
              <span className="block text-[10px] text-slate-500 font-bold uppercase">ชื่องาน / Case Name</span>
              <span className="font-bold text-slate-800 truncate block">{caseData.caseName || '-'}</span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-500 font-bold uppercase">ลูกค้า / แหล่งที่มา</span>
              <span className="font-bold text-slate-800 truncate block">{caseData.customerName || caseData.source}</span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-500 font-bold uppercase">สถานะปัจจุบัน</span>
              <span className="font-bold text-indigo-700 block">{caseData.status}</span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-500 font-bold uppercase">จำนวนรายการสินค้า</span>
              <span className="font-bold text-slate-800 block">{caseData.items?.length || 0} รายการ</span>
            </div>
          </div>

          {/* Resolution / Analysis Notes */}
          {resolutionMethod && (
            <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50">
              <span className="text-[10px] font-bold text-slate-600 block uppercase mb-1">
                ผลการวิเคราะห์สาเหตุและแนวทางแก้ไข (QSMS Resolution Notes):
              </span>
              <p className="text-[11px] text-slate-800 leading-relaxed italic">
                "{resolutionMethod}"
              </p>
            </div>
          )}

          {/* Material Requests Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Package size={14} className="text-slate-600" />
                <span>รายการภาชนะและวัสดุที่ต้องใช้ (Requisition Items)</span>
              </h4>
              <span className="text-[11px] text-slate-500">
                รวมขอเบิก: <strong>{totalRequested}</strong> | จ่ายจริง: <strong>{totalIssued}</strong>
              </span>
            </div>

            <table className="w-full border-collapse text-left text-[11px] border border-slate-300">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold">
                  <th className="py-2 px-3 border-r border-slate-300 w-10 text-center">#</th>
                  <th className="py-2 px-3 border-r border-slate-300">รายการภาชนะ / วัสดุ</th>
                  <th className="py-2 px-3 border-r border-slate-300 text-center w-28">ยอดที่ขอ (QSMS)</th>
                  <th className="py-2 px-3 border-r border-slate-300 text-center w-28">ยอดจ่ายจริง (WPK)</th>
                  <th className="py-2 px-3 border-r border-slate-300 text-center w-20">หน่วย</th>
                  <th className="py-2 px-3 text-center w-28">สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {materialRequests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400 font-medium">
                      ไม่มีรายการภาชนะหรือวัสดุที่ขอเบิก
                    </td>
                  </tr>
                ) : (
                  materialRequests.map((mat, idx) => (
                    <tr key={mat.id} className="border-b border-slate-200">
                      <td className="py-2 px-3 border-r border-slate-200 text-center font-mono text-slate-500">{idx + 1}</td>
                      <td className="py-2 px-3 border-r border-slate-200 font-semibold text-slate-900">{mat.materialName}</td>
                      <td className="py-2 px-3 border-r border-slate-200 text-center font-bold text-slate-800">{mat.requestedQty}</td>
                      <td className="py-2 px-3 border-r border-slate-200 text-center font-bold text-orange-900 bg-orange-50/40">
                        {mat.issuedQty ?? 0}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 text-center text-slate-600">{mat.unit}</td>
                      <td className="py-2 px-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          mat.status === 'fulfilled' ? 'bg-emerald-100 text-emerald-800' :
                          mat.status === 'partial' ? 'bg-amber-100 text-amber-800' :
                          mat.status === 'unavailable' ? 'bg-rose-100 text-rose-800' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {mat.status === 'fulfilled' ? 'เบิกครบแล้ว' :
                           mat.status === 'partial' ? 'เบิกบางส่วน' :
                           mat.status === 'unavailable' ? 'ของขาด' :
                           'รอเบิกจ่าย'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Signature Sign-Off Handover Blocks */}
          <div className="pt-6 border-t border-slate-200 grid grid-cols-3 gap-4">
            <div className="border border-slate-200 rounded-xl p-3 text-center space-y-4 bg-slate-50/40">
              <span className="text-[10px] font-bold text-slate-600 uppercase block">
                1. ผู้ขอเบิก (QSMS Officer)
              </span>
              <div className="h-10 border-b border-dashed border-slate-300 mx-4" />
              <div className="text-[10px] text-slate-500">
                <span>ลงชื่อ: .......................................</span>
                <span className="block mt-1">วันที่: ...... / ...... / ..........</span>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl p-3 text-center space-y-4 bg-slate-50/40">
              <span className="text-[10px] font-bold text-slate-600 uppercase block">
                2. ผู้จ่ายของ (WPK Warehouse)
              </span>
              <div className="h-10 border-b border-dashed border-slate-300 mx-4" />
              <div className="text-[10px] text-slate-500">
                <span>ลงชื่อ: .......................................</span>
                <span className="block mt-1">วันที่: ...... / ...... / ..........</span>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl p-3 text-center space-y-4 bg-slate-50/40">
              <span className="text-[10px] font-bold text-slate-600 uppercase block">
                3. ผู้รับของไปซ่อม (PDF Technician)
              </span>
              <div className="h-10 border-b border-dashed border-slate-300 mx-4" />
              <div className="text-[10px] text-slate-500">
                <span>ลงชื่อ: .......................................</span>
                <span className="block mt-1">วันที่: ...... / ...... / ..........</span>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-[10px] text-slate-400 text-center pt-2">
            QSMS Rework Management System • พิมพ์เมื่อ {new Date().toLocaleString('th-TH')}
          </div>
        </div>
      </div>
    </div>
  );
}
