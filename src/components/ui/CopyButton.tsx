'use client';

import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CopyButtonProps {
  text: string;
  size?: number;
  className?: string;
}

export function CopyButton({ text, size = 13, className = '' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`p-1 rounded-md text-on-surface-variant/60 hover:text-on-surface hover:bg-surface-secondary/80 transition-all active:scale-90 flex items-center justify-center ${className}`}
      title="คัดลอกไปยังคลิปบอร์ด"
    >
      {copied ? (
        <Check size={size} className="text-success transition-transform scale-110" />
      ) : (
        <Copy size={size} />
      )}
    </button>
  );
}
