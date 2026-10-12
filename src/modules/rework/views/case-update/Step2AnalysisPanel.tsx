import React from 'react';
import { FileText, Send, Package, Plus, Trash2 } from 'lucide-react';
import { MaterialRequestItem } from '@/src/services/api';

export interface Step2AnalysisPanelProps {
  canEditAnalysis: boolean;
  resolutionMethod: string;
  setResolutionMethod: React.Dispatch<React.SetStateAction<string>>;
  materialRequests: MaterialRequestItem[];
  setMaterialRequests: React.Dispatch<React.SetStateAction<MaterialRequestItem[]>>;
  handleQSMSHandover: () => Promise<void>;
  handleRemoveMaterial: (id: string) => void;
  isAddingCustomMaterial: boolean;
  setIsAddingCustomMaterial: (val: boolean) => void;
  customMaterialName: string;
  setCustomMaterialName: (val: string) => void;
  customMaterialQty: number;
  setCustomMaterialQty: (val: number) => void;
  customMaterialUnit: string;
  setCustomMaterialUnit: (val: string) => void;
  handleCustomMaterialAdd: () => void;
  handleAddPresetMaterial: (name: string, unit: string) => void;
  handleMaterialQtyChange: (id: string, qty: number) => void;
  isSaving: boolean;
}

export const Step2AnalysisPanel: React.FC<Step2AnalysisPanelProps> = ({
  canEditAnalysis,
  resolutionMethod,
  setResolutionMethod,
  materialRequests,
  handleQSMSHandover,
  handleRemoveMaterial,
  isAddingCustomMaterial,
  setIsAddingCustomMaterial,
  customMaterialName,
  setCustomMaterialName,
  customMaterialQty,
  setCustomMaterialQty,
  handleCustomMaterialAdd,
  handleAddPresetMaterial,
  handleMaterialQtyChange,
  isSaving,
}) => {
  return (
    <section className="space-y-5" aria-label="Step 2 วิเคราะห์และออกใบเบิก (QSMS)">
      {/* Step Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-sm font-bold text-slate-900">Step 2: วิเคราะห์และออกใบเบิก (QSMS)</h2>
            <span
              className={`px-2.5 py-0.5 rounded-md text-xs font-medium border ${
                canEditAnalysis
                  ? 'bg-amber-50 text-amber-900 border-amber-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              {canEditAnalysis ? 'โหมดวิเคราะห์ & ขอเบิก (QSMS / Admin)' : 'โหมดดูผลวิเคราะห์ (Preview Only)'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {canEditAnalysis
              ? 'ระบุสาเหตุข้อบกพร่อง แนวทางแก้ไข และกำหนดรายการภาชนะที่ต้องใช้ส่งต่อให้คลัง (WPK)'
              : 'ผลการวิเคราะห์จากแผนก QSMS (เฉพาะ QSMS/Admin จึงจะสามารถแก้ไขส่วนนี้ได้)'}
          </p>
        </div>

        {canEditAnalysis && (
          <button
            type="button"
            onClick={handleQSMSHandover}
            disabled={isSaving}
            aria-label="บันทึกผลและส่งขอเบิกภาชนะ"
            className="min-h-11 px-4 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-all shadow-xs flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Send size={14} />
            <span>บันทึกผล & ส่งขอเบิกภาชนะ</span>
          </button>
        )}
      </div>

      {/* Analysis Textarea */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
            <FileText size={14} className="text-slate-700" />
            <span>ผลการวิเคราะห์สาเหตุและแนวทางแก้ไข (Analysis & Resolution Notes)</span>
          </h3>
        </div>

        {canEditAnalysis && (
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1">
            <span className="text-xs font-medium text-slate-500 shrink-0">ข้อความแนะนำ:</span>
            {[
              'เปลี่ยนแกลลอนใหม่และรันซีลซ้ำ',
              'เช็ดทำความสะอาดและเปลี่ยนกล่องใหม่',
              'เปลี่ยนฝาและตรวจเช็กแรงบิด',
            ].map((templateText) => (
              <button
                key={templateText}
                type="button"
                onClick={() =>
                  setResolutionMethod((prev) => (prev ? `${prev} | ${templateText}` : templateText))
                }
                className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-all cursor-pointer whitespace-nowrap"
              >
                + {templateText}
              </button>
            ))}
          </div>
        )}

        <textarea
          rows={3}
          value={resolutionMethod}
          disabled={!canEditAnalysis}
          onChange={(e) => setResolutionMethod(e.target.value)}
          placeholder="ระบุผลการวิเคราะห์สาเหตุ เช่น ซีลฟอยล์ไม่สนิทจากความร้อนตก และแนวทางการแก้ไข เช่น ให้เปลี่ยนแกลลอนใหม่และรันซีลซ้ำ..."
          className="w-full text-xs font-medium rounded-lg border border-slate-300 bg-white p-3 text-slate-900 shadow-2xs focus:border-slate-800 focus:ring-2 focus:ring-slate-800/10 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500 leading-relaxed"
        />
      </div>

      {/* Container & Material Requisition Table */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 flex-wrap">
              <span>รายการภาชนะและวัสดุที่ต้องใช้ (Container & Material Requisition)</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200 shrink-0">
                {materialRequests.length} รายการ
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              ระบุรายการและจำนวนภาชนะเพื่อให้แผนกคลัง (WPK) ดำเนินการเบิกจ่าย
            </p>
          </div>
        </div>

        {canEditAnalysis && (
          <div className="rounded-xl bg-slate-50 p-3 border border-slate-200 flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 shrink-0">
              <span>เพิ่มด่วน:</span>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-0.5 w-full flex-wrap sm:flex-nowrap">
              {[
                { name: 'กล่องใหม่', unit: 'กล่อง' },
                { name: 'แกลลอน 1L', unit: 'ใบ' },
                { name: 'แกลลอน 4L', unit: 'ใบ' },
                { name: 'แกลลอน 5L', unit: 'ใบ' },
                { name: 'ฝาแกลลอน', unit: 'ชิ้น' },
                { name: 'สติกเกอร์/ฉลาก', unit: 'แผ่น' },
                { name: 'ถัง 200L', unit: 'ถัง' },
              ].map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handleAddPresetMaterial(preset.name, preset.unit)}
                  className="min-h-8 px-3 py-1 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 hover:text-slate-900 rounded-lg border border-slate-200 shadow-2xs transition-all cursor-pointer shrink-0 whitespace-nowrap"
                >
                  + {preset.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {materialRequests.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center">
            <Package size={26} className="text-slate-400 mx-auto mb-1.5" />
            <p className="text-xs font-semibold text-slate-600">ยังไม่มีการระบุภาชนะหรือวัสดุที่ต้องใช้</p>
            {canEditAnalysis && (
              <div className="mt-3 flex justify-center">
                <button
                  type="button"
                  onClick={() => setIsAddingCustomMaterial(true)}
                  className="min-h-11 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus size={14} />
                  <span>เพิ่มรายการวัสดุแบบกำหนดเอง</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">รายการภาชนะ / วัสดุ</th>
                  <th className="py-2.5 px-3 text-center">จำนวนที่ขอ (QSMS)</th>
                  <th className="py-2.5 px-3 text-center">หน่วยนับ</th>
                  <th className="py-2.5 px-3 text-center">สถานะ</th>
                  {canEditAnalysis && <th className="py-2.5 px-3 text-right">จัดการ</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {materialRequests.map((mat, idx) => (
                  <tr key={mat.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-slate-400">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{mat.materialName}</td>
                    <td className="py-2.5 px-3 text-center">
                      {canEditAnalysis ? (
                        <input
                          type="number"
                          min="1"
                          aria-label={`จำนวนที่ขอสำหรับ ${mat.materialName}`}
                          value={mat.requestedQty}
                          onChange={(e) => handleMaterialQtyChange(mat.id, Number(e.target.value) || 0)}
                          className="w-20 h-9 text-center border border-slate-300 bg-white rounded-md py-1 px-2 font-mono font-bold text-slate-900 shadow-2xs focus:border-slate-800 focus:ring-2 focus:ring-slate-800/10 focus:outline-none"
                        />
                      ) : (
                        <span className="font-mono font-bold text-slate-900">{mat.requestedQty}</span>
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
                          ? 'เบิกจ่ายครบแล้ว'
                          : mat.status === 'partial'
                          ? 'เบิกจ่ายบางส่วน'
                          : mat.status === 'unavailable'
                          ? 'ของขาด'
                          : 'รอคลังเบิกจ่าย'}
                      </span>
                    </td>
                    {canEditAnalysis && (
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveMaterial(mat.id)}
                          aria-label={`ลบรายการ ${mat.materialName}`}
                          className="min-h-11 min-w-11 inline-flex items-center justify-center text-slate-500 hover:text-rose-700 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                          title="ลบรายการนี้"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>

            {canEditAnalysis && (
              <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsAddingCustomMaterial(!isAddingCustomMaterial)}
                  className="text-xs font-semibold text-slate-800 hover:text-slate-950 flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus size={14} />
                  <span>{isAddingCustomMaterial ? 'ยกเลิก' : '+ เพิ่มรายการวัสดุอื่นๆ แบบกำหนดเอง'}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Custom Material Input Form */}
        {isAddingCustomMaterial && canEditAnalysis && (
          <div className="p-4 rounded-xl border border-slate-300 bg-slate-50/80 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">ชื่อภาชนะ / วัสดุ *</label>
              <input
                type="text"
                value={customMaterialName}
                onChange={(e) => setCustomMaterialName(e.target.value)}
                placeholder="เช่น ฝาซีลกันปลอม, ฟิล์มหด ฯลฯ"
                className="w-full h-10 text-xs border border-slate-300 rounded-lg px-3 bg-white shadow-2xs focus:outline-none focus:border-slate-800 focus:ring-2 focus:ring-slate-800/10"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">จำนวนที่ขอ *</label>
              <input
                type="number"
                min="1"
                value={customMaterialQty}
                onChange={(e) => setCustomMaterialQty(Number(e.target.value) || 1)}
                className="w-full h-10 text-xs border border-slate-300 rounded-lg px-3 bg-white shadow-2xs focus:outline-none focus:border-slate-800 focus:ring-2 focus:ring-slate-800/10"
              />
            </div>
            <div>
              <button
                type="button"
                onClick={handleCustomMaterialAdd}
                className="w-full h-10 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-all shadow-xs cursor-pointer"
              >
                บันทึกเข้าตาราง
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
