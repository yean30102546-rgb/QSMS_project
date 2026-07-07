import React, { useState } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { Employee } from '../types';

interface RosterEmployeeDrawerProps {
  employee: Employee | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (id: string) => void;
}

export function RosterEmployeeDrawer({ employee, isOpen, onClose, onDelete }: RosterEmployeeDrawerProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!employee) return null;

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="fixed inset-y-0 right-0 z-50 h-full w-full max-w-sm flex flex-col gap-0 border-l border-slate-200 bg-white p-0 shadow-2xl sm:max-w-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right duration-300 focus:outline-none">
          <div className="flex-1 overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-8">
              <div className="flex flex-col">
                <DialogPrimitive.Title className="text-2xl font-bold text-slate-900">{employee.name}</DialogPrimitive.Title>
                <DialogPrimitive.Description className="text-sm text-slate-500 mt-1">
                  Phase {employee.phase + 1}
                </DialogPrimitive.Description>
              </div>
              <DialogPrimitive.Close className="rounded-full p-2 hover:bg-slate-100 transition-colors">
                <X size={20} className="text-slate-500" />
                <span className="sr-only">Close</span>
              </DialogPrimitive.Close>
            </div>

          <div className="space-y-6">
            <section className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">ข้อมูลการทำงาน</h4>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600">เสาร์แรกที่เข้างาน</span>
                  <span className="font-semibold text-slate-900">
                    {employee.startWorkingSaturday || <span className="text-amber-500">ยังไม่กำหนด</span>}
                  </span>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">การจัดการ</h4>
              {!confirmDelete ? (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="w-full rounded-xl border border-rose-200 bg-white px-4 py-3 text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-colors text-left"
                >
                  ลบพนักงาน
                </button>
              ) : (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 space-y-3">
                  <p className="text-sm text-rose-800 font-medium">คุณแน่ใจหรือไม่ว่าต้องการลบพนักงานนี้?</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onDelete(employee.id);
                        onClose();
                        setConfirmDelete(false);
                      }}
                      className="flex-1 rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-700 transition-colors"
                    >
                      ยืนยันลบ
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      ยกเลิก
                    </button>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
