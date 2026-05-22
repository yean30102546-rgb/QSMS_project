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
    ? 'top-full left-1/2 -translate-x-1/2 border-t-slate-800'
    : 'bottom-full left-1/2 -translate-x-1/2 border-b-slate-800';

  const arrowBorder = position === 'top'
    ? 'border-l-transparent border-r-transparent border-b-transparent border-t-4 border-l-4 border-r-4'
    : 'border-l-transparent border-r-transparent border-t-transparent border-b-4 border-l-4 border-r-4';

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
          className={`absolute z-50 px-3 py-1.5 text-[11px] font-medium text-white bg-slate-800 rounded-lg whitespace-nowrap shadow-lg pointer-events-none ${positionStyles}`}
          role="tooltip"
        >
          {text}
          {/* ลูกศร */}
          <div className={`absolute w-0 h-0 ${arrowStyles} ${arrowBorder}`} />
        </div>
      )}
    </div>
  );
}
