/**
 * useToast Hook
 * จัดการ Toast notifications — แจ้งสถานะการทำงานให้ผู้ใช้ทราบ
 *
 * วิธีใช้:
 *   const { toasts, addToast, removeToast } = useToast();
 *   addToast('บันทึกสำเร็จ ✅', 'success');
 */

import { useState, useCallback } from 'react';

// ===== TYPES =====

export type ToastType = 'success' | 'error' | 'info' | 'loading';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface UseToastReturn {
  /** รายการ toasts ที่แสดงอยู่ */
  toasts: Toast[];
  /** เพิ่ม toast ใหม่ */
  addToast: (message: string, type?: ToastType, durationMs?: number) => string;
  /** ลบ toast ตาม id */
  removeToast: (id: string) => void;
}

// ===== HOOK =====

export function useToast(): UseToastReturn {
  const [toasts, setToasts] = useState<Toast[]>([]);

  // สร้าง unique id
  const generateId = () => `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  const addToast = useCallback(
    (message: string, type: ToastType = 'info', durationMs: number = 4000): string => {
      const id = generateId();
      const newToast: Toast = { id, message, type };

      setToasts((prev) => [...prev, newToast]);

      // ลบอัตโนมัติหลังจาก duration (ยกเว้น type 'loading')
      if (type !== 'loading') {
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
        }, durationMs);
      }

      return id;
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
}
