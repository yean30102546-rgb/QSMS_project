"use client";

import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "./popover";
import { cn } from "../../lib/utils";

export interface MultiSelectOption {
  label: string;
  value: string;
}

interface MultiSelectProps {
  options: (string | MultiSelectOption)[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  emptyText?: string;
  className?: string;
  disabled?: boolean;
}

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = "Select items...",
  emptyText = "No data found",
  className,
  disabled,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);

  const normalizedOptions = React.useMemo(() => {
    return options.map((opt) => {
      if (typeof opt === "string") {
        return { label: opt, value: opt };
      }
      return opt;
    });
  }, [options]);

  const toggleOption = (optValue: string) => {
    const newValue = value.includes(optValue)
      ? value.filter((v) => v !== optValue)
      : [...value, optValue];
    onChange(newValue);
  };

  const selectAll = () => {
    onChange(normalizedOptions.map((o) => o.value));
  };

  const clearAll = () => {
    onChange([]);
  };

  const selectedCount = value.length;
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          aria-expanded={open}
          className={cn(
            "flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none shadow-sm transition-colors focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-[#2c2c2e] dark:focus:ring-blue-500 dark:text-slate-200 text-slate-800",
            className
          )}
        >
          <span className="truncate">
            {selectedCount === 0
              ? placeholder
              : selectedCount === 1
              ? normalizedOptions.find(o => o.value === value[0])?.label || placeholder
              : `${selectedCount} selected`}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-[200px] p-0 z-[100] bg-white dark:bg-[#2c2c2e] border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 shadow-lg rounded-lg" align="start">
        <div className="flex flex-col">
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-white/5">
            <button
              type="button"
              onClick={selectAll}
              className="text-[10px] uppercase font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
            >
              Select All
            </button>
            <button
              type="button"
              onClick={clearAll}
              className="text-[10px] uppercase font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
            >
              Clear
            </button>
          </div>
          <div className="max-h-[260px] overflow-y-auto py-1 scrollbar-thin">
            {normalizedOptions.length === 0 ? (
              <div className="py-4 text-center text-sm text-slate-500">{emptyText}</div>
            ) : (
              normalizedOptions.map((option) => {
                const isSelected = value.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggleOption(option.value)}
                    className="flex w-full items-center px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-white/10 transition-colors text-left"
                  >
                    <div className={cn(
                      "mr-2 flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-slate-300 dark:border-slate-600 transition-all",
                      isSelected ? "bg-blue-600 border-blue-600 text-white" : "bg-white dark:bg-transparent"
                    )}>
                      {isSelected && <Check className="h-3 w-3" strokeWidth={3} />}
                    </div>
                    <span className="truncate flex-1">{option.label}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
