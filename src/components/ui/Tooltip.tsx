/**
 * Tooltip Component
 * คำอธิบายสั้นๆ เมื่อเอาเมาส์ไปวาง — เหมาะสำหรับผู้ใช้ใหม่
 *
 * วิธีใช้:
 *   <Tooltip text="รีเฟรชข้อมูล">
 *     <button>...</button>
 *   </Tooltip>
 */

'use client';

import React, { useState } from 'react';

interface TooltipProps {
  /** ข้อความที่แสดงใน tooltip */
  text: string;
  /** ตำแหน่ง tooltip (default: บน) */
  position?: 'top' | 'bottom';
  /** Element ที่ต้องการเพิ่ม tooltip */
  children: React.ReactNode;
}

export function Tooltip({ text, position = 'top', children }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  // กำหนดตำแหน่ง CSS ตาม position
  const positionStyles = position === 'top'
    ? 'bottom-full left-1/2 -translate-x-1/2 mb-2'
    : 'top-full left-1/2 -translate-x-1/2 mt-2';

  // กำหนดหัวลูกศร
  const arrowStyles = position === 'top'
    ? 'top-full -mt-1 left-1/2 -translate-x-1/2'
    : 'bottom-full -mb-1 left-1/2 -translate-x-1/2';

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}

      {/* Tooltip bubble */}
      {isVisible && (
        <div
          className={`absolute z-50 px-2.5 py-1 text-xs font-medium text-white bg-slate-900 rounded-md whitespace-nowrap shadow-md pointer-events-none transition-opacity duration-150 ${positionStyles}`}
          role="tooltip"
        >
          {text}
          {/* ลูกศร (Crisp rotated indicator) */}
          <div className={`absolute h-2 w-2 rotate-45 bg-slate-900 pointer-events-none ${arrowStyles}`} />
        </div>
      )}
    </div>
  );
}
