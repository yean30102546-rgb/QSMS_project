import React from 'react';

export function RosterLegend() {
  const items = [
    { label: 'ทำงาน (WORK)', color: '#10b981' },
    { label: 'หยุด (OFF)', color: '#cbd5e1' },
    { label: 'ลาป่วย (SICK)', color: '#f43f5e' },
    { label: 'ลากิจ (BIZ)', color: '#f59e0b' },
    { label: 'ลาพักร้อน (VAC)', color: '#8b5cf6' },
  ];

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-4 px-2">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-sm shadow-sm" 
            style={{ backgroundColor: item.color }} 
          />
          <span className="text-xs font-medium text-[#71717a]">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
